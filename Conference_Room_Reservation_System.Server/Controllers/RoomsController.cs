using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Conference_Room_Reservation_System.Server.Data;
using Conference_Room_Reservation_System.Server.DTOs;
using Conference_Room_Reservation_System.Server.Models;

namespace Conference_Room_Reservation_System.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class RoomsController : ControllerBase
{
    private readonly AppDbContext _context;

    public RoomsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? minCapacity, [FromQuery] string? status)
    {
        var query = _context.Rooms.Include(r => r.Equipment).AsQueryable();

        if (minCapacity.HasValue)
            query = query.Where(r => r.Capacity >= minCapacity.Value);

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<RoomStatus>(status, true, out var s))
            query = query.Where(r => r.Status == s);

        var rooms = await query.OrderBy(r => r.Name).ToListAsync();

        return Ok(rooms.Select(MapToDto));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var room = await _context.Rooms.Include(r => r.Equipment).FirstOrDefaultAsync(r => r.Id == id);
        if (room == null) return NotFound(new { message = "会议室不存在" });
        return Ok(MapToDto(room));
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] CreateRoomRequest request)
    {
        if (await _context.Rooms.AnyAsync(r => r.Name == request.Name))
            return BadRequest(new { message = "会议室名称已存在" });

        var room = new Room
        {
            Name = request.Name, Location = request.Location,
            Capacity = request.Capacity, Description = request.Description,
            ImageUrl = request.ImageUrl, Status = (RoomStatus)request.Status
        };

        if (request.Equipment?.Any() == true)
            foreach (var eq in request.Equipment)
                room.Equipment.Add(new RoomEquipment { Name = eq });

        _context.Rooms.Add(room);
        await _context.SaveChangesAsync();
        return Ok(MapToDto(room));
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateRoomRequest request)
    {
        var room = await _context.Rooms.Include(r => r.Equipment).FirstOrDefaultAsync(r => r.Id == id);
        if (room == null) return NotFound(new { message = "会议室不存在" });
        if (await _context.Rooms.AnyAsync(r => r.Name == request.Name && r.Id != id))
            return BadRequest(new { message = "会议室名称已存在" });

        room.Name = request.Name; room.Location = request.Location;
        room.Capacity = request.Capacity; room.Description = request.Description;
        room.ImageUrl = request.ImageUrl; room.Status = (RoomStatus)request.Status;

        _context.RoomEquipments.RemoveRange(room.Equipment);
        if (request.Equipment?.Any() == true)
            foreach (var eq in request.Equipment)
                room.Equipment.Add(new RoomEquipment { Name = eq });

        await _context.SaveChangesAsync();
        return Ok(MapToDto(room));
    }

    [HttpGet("{id}/schedule")]
    public async Task<IActionResult> GetSchedule(int id, [FromQuery] string? date)
    {
        var room = await _context.Rooms.Include(r => r.Equipment).FirstOrDefaultAsync(r => r.Id == id);
        if (room == null) return NotFound(new { message = "会议室不存在" });

        var targetDate = string.IsNullOrEmpty(date) ? DateTime.Today : DateTime.Parse(date);
        var dayStart = targetDate.Date.AddHours(8);
        var dayEnd = targetDate.Date.AddHours(23);

        var reservations = await _context.Reservations
            .Include(r => r.User)
            .Where(r => r.RoomId == id
                && r.Status != ReservationStatus.Rejected
                && r.Status != ReservationStatus.Cancelled
                && r.StartTime < dayEnd
                && r.EndTime > dayStart)
            .OrderBy(r => r.StartTime)
            .ToListAsync();

        var schedule = new List<object>();
        var current = dayStart;

        foreach (var res in reservations)
        {
            if (res.StartTime > current)
            {
                schedule.Add(new { start = current.ToString("HH:mm"), end = res.StartTime.ToString("HH:mm"), status = "free", title = "空闲" });
            }
            schedule.Add(new
            {
                start = res.StartTime > dayStart ? res.StartTime.ToString("HH:mm") : "08:00",
                end = res.EndTime < dayEnd ? res.EndTime.ToString("HH:mm") : "23:00",
                status = res.Status == ReservationStatus.Approved ? "reserved" : "pending",
                title = res.Title,
                username = res.User.Username,
                reservationId = res.Id
            });
            current = res.EndTime > current ? res.EndTime : current;
        }

        if (current < dayEnd)
        {
            schedule.Add(new { start = current.ToString("HH:mm"), end = "23:00", status = "free", title = "空闲" });
        }

        if (room.Status == RoomStatus.Maintenance)
        {
            schedule.Clear();
            schedule.Add(new { start = "08:00", end = "23:00", status = "maintenance", title = "维护中" });
        }

        return Ok(new
        {
            roomId = room.Id,
            roomName = room.Name,
            roomStatus = room.Status.ToString(),
            date = targetDate.ToString("yyyy-MM-dd"),
            schedule
        });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var room = await _context.Rooms.Include(r => r.Reservations).FirstOrDefaultAsync(r => r.Id == id);
        if (room == null) return NotFound(new { message = "会议室不存在" });
        if (room.Reservations.Any(r => r.Status == ReservationStatus.Approved && r.EndTime > DateTime.UtcNow))
            return BadRequest(new { message = "该会议室有未完成的预约，无法删除" });

        _context.Rooms.Remove(room);
        await _context.SaveChangesAsync();
        return Ok(new { message = "已删除" });
    }

    private static RoomDto MapToDto(Room room) => new(
        room.Id, room.Name, room.Location, room.Capacity, room.Description, room.ImageUrl,
        room.Status.ToString(), room.Equipment.Select(e => e.Name).ToList(), room.CreatedAt
    );
}
