using Microsoft.EntityFrameworkCore;
using Conference_Room_Reservation_System.Server.Data;
using Conference_Room_Reservation_System.Server.Models;

namespace Conference_Room_Reservation_System.Server.Services;

public class NotificationService
{
    private readonly AppDbContext _context;

    public NotificationService(AppDbContext context)
    {
        _context = context;
    }

    public async Task CreateAsync(int userId, string title, string message)
    {
        var notification = new Notification
        {
            UserId = userId,
            Title = title,
            Message = message
        };
        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();
    }

    public async Task NotifyAdminsAsync(string title, string message)
    {
        var adminIds = await _context.Users
            .Where(u => u.Role == UserRole.Admin && u.Status == UserStatus.Approved)
            .Select(u => u.Id)
            .ToListAsync();

        foreach (var adminId in adminIds)
        {
            _context.Notifications.Add(new Notification
            {
                UserId = adminId,
                Title = title,
                Message = message
            });
        }
        await _context.SaveChangesAsync();
    }
}
