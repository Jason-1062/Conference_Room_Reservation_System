using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Conference_Room_Reservation_System.Server.Data;
using Conference_Room_Reservation_System.Server.DTOs;
using Conference_Room_Reservation_System.Server.Models;
using Conference_Room_Reservation_System.Server.Services;

namespace Conference_Room_Reservation_System.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly NotificationService _notificationService;

    public UsersController(AppDbContext context, NotificationService notificationService)
    {
        _context = context;
        _notificationService = notificationService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? status)
    {
        var query = _context.Users
            .Include(u => u.Employee)
            .ThenInclude(e => e!.Department)
            .AsQueryable();

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<UserStatus>(status, true, out var s))
            query = query.Where(u => u.Status == s);

        var users = await query.OrderByDescending(u => u.CreatedAt).ToListAsync();

        var result = users.Select(u => new UserListDto(
            u.Id, u.Username, u.Role.ToString(), u.Status.ToString(),
            u.Employee?.Name, u.Employee?.Department?.Name, u.CreatedAt
        ));

        return Ok(result);
    }

    [HttpPut("{id}/approve")]
    public async Task<IActionResult> Approve(int id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) return NotFound(new { message = "用户不存在" });

        user.Status = UserStatus.Approved;
        await _context.SaveChangesAsync();

        await _notificationService.CreateAsync(user.Id, "账号审核通过", "恭喜！您的账号已通过审核，现在可以正常使用系统了。");

        return Ok(new { message = "已通过审核" });
    }

    [HttpPut("{id}/reject")]
    public async Task<IActionResult> Reject(int id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) return NotFound(new { message = "用户不存在" });

        user.Status = UserStatus.Rejected;
        await _context.SaveChangesAsync();

        await _notificationService.CreateAsync(user.Id, "账号审核未通过", "很抱歉，您的账号审核未通过。如有疑问请联系管理员。");

        return Ok(new { message = "已拒绝" });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) return NotFound(new { message = "用户不存在" });

        if (user.Role == UserRole.Admin)
            return BadRequest(new { message = "不能删除管理员账号" });

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();

        return Ok(new { message = "已删除" });
    }
}
