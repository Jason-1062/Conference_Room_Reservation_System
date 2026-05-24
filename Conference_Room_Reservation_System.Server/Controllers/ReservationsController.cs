using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Conference_Room_Reservation_System.Server.Data;
using Conference_Room_Reservation_System.Server.DTOs;
using Conference_Room_Reservation_System.Server.Models;
using Conference_Room_Reservation_System.Server.Services;
using System.Security.Claims;

namespace Conference_Room_Reservation_System.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReservationsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly NotificationService _notificationService;

    public ReservationsController(AppDbContext context, NotificationService notificationService)
    {
        _context = context;
        _notificationService = notificationService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? roomId, [FromQuery] string? status, [FromQuery] string? date)
    {
        var query = _context.Reservations.Include(r => r.Room).Include(r => r.User).AsQueryable();
        if (roomId.HasValue) query = query.Where(r => r.RoomId == roomId.Value);
        if (!string.IsNullOrEmpty(status) && Enum.TryParse<ReservationStatus>(status, true, out var s))
            query = query.Where(r => r.Status == s);
        if (!string.IsNullOrEmpty(date) && DateTime.TryParse(date, out var d))
        {
            var start = d.Date; var end = d.Date.AddDays(1);
            query = query.Where(r => r.StartTime < end && r.EndTime > start);
        }
        var list = await query.OrderByDescending(r => r.CreatedAt).ToListAsync();
        return Ok(list.Select(MapToDto));
    }

    [HttpGet("my")]
    public async Task<IActionResult> GetMy()
    {
        var userId = GetUserId();
        var list = await _context.Reservations
            .Include(r => r.Room).Include(r => r.User)
            .Where(r => r.UserId == userId)
            .OrderByDescending(r => r.CreatedAt).ToListAsync();
        return Ok(list.Select(MapToDto));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateReservationRequest request)
    {
        var userId = GetUserId();
        var room = await _context.Rooms.FindAsync(request.RoomId);
        if (room == null) return BadRequest(new { message = "会议室不存在" });
        if (room.Status == RoomStatus.Maintenance)
            return BadRequest(new { message = "该会议室正在维护中" });
        if (request.StartTime >= request.EndTime)
            return BadRequest(new { message = "结束时间必须晚于开始时间" });
        if (request.AttendeesCount > room.Capacity)
            return BadRequest(new { message = $"参会人数超过会议室容量({room.Capacity}人)" });

        var conflict = await _context.Reservations.AnyAsync(r =>
            r.RoomId == request.RoomId &&
            r.Status != ReservationStatus.Rejected && r.Status != ReservationStatus.Cancelled &&
            r.StartTime < request.EndTime && r.EndTime > request.StartTime);
        if (conflict) return BadRequest(new { message = "该时间段已被预约" });

        var reservation = new Reservation
        {
            Title = request.Title, Description = request.Description,
            RoomId = request.RoomId, UserId = userId,
            StartTime = request.StartTime, EndTime = request.EndTime,
            AttendeesCount = request.AttendeesCount, Status = ReservationStatus.Pending
        };
        _context.Reservations.Add(reservation);
        await _context.SaveChangesAsync();

        var user = await _context.Users.FindAsync(userId);
        await _notificationService.NotifyAdminsAsync("新预约申请",
            $"{user?.Username} 预约了 {room.Name}，时间: {request.StartTime:MM-dd HH:mm} ~ {request.EndTime:HH:mm}");

        reservation.Room = room; reservation.User = user!;
        return Ok(MapToDto(reservation));
    }

    [HttpGet("check")]
    public async Task<IActionResult> CheckAvailability([FromQuery] int roomId, [FromQuery] DateTime start, [FromQuery] DateTime end, [FromQuery] int? excludeId)
    {
        var query = _context.Reservations.Where(r =>
            r.RoomId == roomId &&
            r.Status != ReservationStatus.Rejected && r.Status != ReservationStatus.Cancelled &&
            r.StartTime < end && r.EndTime > start);
        if (excludeId.HasValue) query = query.Where(r => r.Id != excludeId.Value);
        var conflicts = await query.Include(r => r.User).ToListAsync();
        return Ok(new { available = !conflicts.Any(), conflicts = conflicts.Select(c => new {
            c.Id, c.Title, c.StartTime, c.EndTime, Username = c.User.Username
        })});
    }

    [HttpPut("{id}/approve")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Approve(int id)
    {
        var r = await _context.Reservations.Include(x => x.Room).FirstOrDefaultAsync(x => x.Id == id);
        if (r == null) return NotFound();
        r.Status = ReservationStatus.Approved;
        await _context.SaveChangesAsync();
        await _notificationService.CreateAsync(r.UserId, "预约已通过",
            $"您预约的 {r.Room.Name}（{r.StartTime:MM-dd HH:mm}~{r.EndTime:HH:mm}）已通过审批。");
        return Ok(new { message = "已通过" });
    }

    [HttpPut("{id}/reject")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Reject(int id)
    {
        var r = await _context.Reservations.Include(x => x.Room).FirstOrDefaultAsync(x => x.Id == id);
        if (r == null) return NotFound();
        r.Status = ReservationStatus.Rejected;
        await _context.SaveChangesAsync();
        await _notificationService.CreateAsync(r.UserId, "预约被拒绝",
            $"您预约的 {r.Room.Name}（{r.StartTime:MM-dd HH:mm}~{r.EndTime:HH:mm}）未通过审批。");
        return Ok(new { message = "已拒绝" });
    }

    [HttpPut("{id}/cancel")]
    public async Task<IActionResult> Cancel(int id)
    {
        var userId = GetUserId();
        var r = await _context.Reservations.FindAsync(id);
        if (r == null) return NotFound();
        var isAdmin = User.IsInRole("Admin");
        if (r.UserId != userId && !isAdmin) return Forbid();
        r.Status = ReservationStatus.Cancelled;
        await _context.SaveChangesAsync();
        return Ok(new { message = "已取消" });
    }

    private int GetUserId() => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    private static ReservationDto MapToDto(Reservation r) => new(
        r.Id, r.Title, r.Description, r.RoomId, r.Room.Name, r.Room.Location,
        r.UserId, r.User.Username, r.StartTime, r.EndTime,
        r.Status.ToString(), r.AttendeesCount, r.CreatedAt
    );
}
