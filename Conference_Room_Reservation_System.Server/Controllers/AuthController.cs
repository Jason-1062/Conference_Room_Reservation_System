using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Conference_Room_Reservation_System.Server.Data;
using Conference_Room_Reservation_System.Server.DTOs;
using Conference_Room_Reservation_System.Server.Models;
using Conference_Room_Reservation_System.Server.Services;

namespace Conference_Room_Reservation_System.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly AuthService _authService;
    private readonly NotificationService _notificationService;

    public AuthController(AppDbContext context, AuthService authService, NotificationService notificationService)
    {
        _context = context;
        _authService = authService;
        _notificationService = notificationService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var user = await _context.Users
            .Include(u => u.Employee)
            .ThenInclude(e => e!.Department)
            .FirstOrDefaultAsync(u => u.Username == request.Username);

        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return Unauthorized(new { message = "用户名或密码错误" });

        if (user.Status == UserStatus.Pending)
            return BadRequest(new { message = "账号正在审核中，请等待管理员审批" });

        if (user.Status == UserStatus.Rejected)
            return BadRequest(new { message = "账号审核未通过，请联系管理员" });

        var token = _authService.GenerateToken(user);
        var userDto = MapToUserDto(user);

        return Ok(new LoginResponse(token, userDto));
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        if (await _context.Users.AnyAsync(u => u.Username == request.Username))
            return BadRequest(new { message = "用户名已存在" });

        var user = new User
        {
            Username = request.Username,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = UserRole.User,
            Status = UserStatus.Pending,
            EmployeeId = null
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        await _notificationService.NotifyAdminsAsync(
            "新用户注册",
            $"用户 {request.Username} 已提交注册申请，请审核。"
        );

        return Ok(new { message = "注册成功，请等待管理员审核。审核通过后请关联您的职工账号。" });
    }

    [HttpPost("link-account")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public async Task<IActionResult> LinkAccount([FromBody] LinkAccountRequest request)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var user = await _context.Users.FindAsync(userId.Value);
        if (user == null) return NotFound(new { message = "用户不存在" });

        if (user.EmployeeId.HasValue)
            return BadRequest(new { message = "账号已关联职工" });

        var employee = await _context.Employees
            .Include(e => e.User)
            .FirstOrDefaultAsync(e => e.Name == request.Name && e.Phone == request.Phone);

        if (employee == null)
            return BadRequest(new { message = "未找到匹配的职工信息，请确认姓名和手机号正确" });

        if (employee.User != null)
            return BadRequest(new { message = "该职工已关联其他账号" });

        user.EmployeeId = employee.Id;
        await _context.SaveChangesAsync();

        var updatedUser = await _context.Users
            .Include(u => u.Employee)
            .ThenInclude(e => e!.Department)
            .FirstOrDefaultAsync(u => u.Id == userId);

        return Ok(MapToUserDto(updatedUser!));
    }

    [HttpPut("profile")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var user = await _context.Users
            .Include(u => u.Employee)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null) return NotFound(new { message = "用户不存在" });
        if (user.Employee == null) return BadRequest(new { message = "请先关联职工账号" });

        if (request.Phone != null) user.Employee.Phone = request.Phone;
        if (request.Email != null) user.Employee.Email = request.Email;
        await _context.SaveChangesAsync();

        var updated = await _context.Users
            .Include(u => u.Employee)
            .ThenInclude(e => e!.Department)
            .FirstOrDefaultAsync(u => u.Id == userId);

        return Ok(MapToUserDto(updated!));
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentUser()
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var user = await _context.Users
            .Include(u => u.Employee)
            .ThenInclude(e => e!.Department)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null) return NotFound();

        return Ok(MapToUserDto(user));
    }

    private int? GetUserId()
    {
        var claim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        return claim != null ? int.Parse(claim.Value) : null;
    }

    private static UserDto MapToUserDto(User user) => new(
        user.Id,
        user.Username,
        user.Role.ToString(),
        user.Status.ToString(),
        user.EmployeeId,
        user.Employee?.Name,
        user.Employee?.Department?.Name,
        user.Employee?.Phone,
        user.Employee?.Email,
        user.CreatedAt
    );
}
