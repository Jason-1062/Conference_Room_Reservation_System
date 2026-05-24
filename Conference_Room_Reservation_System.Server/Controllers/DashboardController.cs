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
public class DashboardController : ControllerBase
{
    private readonly AppDbContext _context;
    public DashboardController(AppDbContext context) { _context = context; }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var today = DateTime.UtcNow.Date;
        var tomorrow = today.AddDays(1);

        var totalRooms = await _context.Rooms.CountAsync();
        var availableRooms = await _context.Rooms.CountAsync(r => r.Status == RoomStatus.Available);
        var todayReservations = await _context.Reservations.CountAsync(r =>
            r.StartTime < tomorrow && r.EndTime > today &&
            r.Status != ReservationStatus.Cancelled && r.Status != ReservationStatus.Rejected);
        var pendingApprovals = await _context.Reservations.CountAsync(r => r.Status == ReservationStatus.Pending);
        var totalUsers = await _context.Users.CountAsync();
        var pendingUsers = await _context.Users.CountAsync(u => u.Status == UserStatus.Pending);
        var totalDepartments = await _context.Departments.CountAsync();
        var totalEmployees = await _context.Employees.CountAsync();

        var upcoming = await _context.Reservations
            .Include(r => r.Room).Include(r => r.User)
            .Where(r => r.StartTime >= DateTime.UtcNow && r.Status == ReservationStatus.Approved)
            .OrderBy(r => r.StartTime).Take(5).ToListAsync();

        var roomUsageData = await _context.Reservations
            .Where(r => r.StartTime >= today.AddDays(-30) && r.Status == ReservationStatus.Approved)
            .GroupBy(r => r.Room.Name)
            .Select(g => new { RoomName = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .Take(5)
            .ToListAsync();

        var roomUsage = roomUsageData.Select(x => new RoomUsageDto(x.RoomName, x.Count)).ToList();

        return Ok(new DashboardStats(
            totalRooms, availableRooms, todayReservations, pendingApprovals,
            totalUsers, pendingUsers, totalDepartments, totalEmployees,
            upcoming.Select(r => new ReservationDto(
                r.Id, r.Title, r.Description, r.RoomId, r.Room.Name, r.Room.Location,
                r.UserId, r.User.Username, r.StartTime, r.EndTime,
                r.Status.ToString(), r.AttendeesCount, r.CreatedAt)).ToList(),
            roomUsage
        ));
    }
}
