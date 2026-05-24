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
public class EmployeesController : ControllerBase
{
    private readonly AppDbContext _context;

    public EmployeesController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("public-list")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPublicList()
    {
        var employees = await _context.Employees
            .Include(e => e.Department)
            .Include(e => e.User)
            .Where(e => e.User == null)
            .OrderBy(e => e.Name)
            .Select(e => new
            {
                id = e.Id,
                name = e.Name,
                departmentName = e.Department.Name
            })
            .ToListAsync();

        return Ok(employees);
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? departmentId)
    {
        var query = _context.Employees
            .Include(e => e.Department)
            .Include(e => e.User)
            .AsQueryable();

        if (departmentId.HasValue)
            query = query.Where(e => e.DepartmentId == departmentId.Value);

        var employees = await query.OrderBy(e => e.Name).ToListAsync();

        var result = employees.Select(e => new EmployeeDto(
            e.Id, e.Name, e.Phone, e.Email, e.Position,
            e.DepartmentId, e.Department.Name, e.User != null, e.CreatedAt
        ));

        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var employee = await _context.Employees
            .Include(e => e.Department)
            .Include(e => e.User)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (employee == null) return NotFound(new { message = "职工不存在" });

        return Ok(new EmployeeDto(
            employee.Id, employee.Name, employee.Phone, employee.Email, employee.Position,
            employee.DepartmentId, employee.Department.Name, employee.User != null, employee.CreatedAt
        ));
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] CreateEmployeeRequest request)
    {
        var department = await _context.Departments.FindAsync(request.DepartmentId);
        if (department == null) return BadRequest(new { message = "部门不存在" });

        var employee = new Employee
        {
            Name = request.Name,
            Phone = request.Phone,
            Email = request.Email,
            Position = request.Position,
            DepartmentId = request.DepartmentId
        };

        _context.Employees.Add(employee);
        await _context.SaveChangesAsync();

        return Ok(new EmployeeDto(
            employee.Id, employee.Name, employee.Phone, employee.Email, employee.Position,
            employee.DepartmentId, department.Name, false, employee.CreatedAt
        ));
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateEmployeeRequest request)
    {
        var employee = await _context.Employees.FindAsync(id);
        if (employee == null) return NotFound(new { message = "职工不存在" });

        var department = await _context.Departments.FindAsync(request.DepartmentId);
        if (department == null) return BadRequest(new { message = "部门不存在" });

        employee.Name = request.Name;
        employee.Phone = request.Phone;
        employee.Email = request.Email;
        employee.Position = request.Position;
        employee.DepartmentId = request.DepartmentId;
        await _context.SaveChangesAsync();

        var hasAccount = await _context.Users.AnyAsync(u => u.EmployeeId == id);
        return Ok(new EmployeeDto(
            employee.Id, employee.Name, employee.Phone, employee.Email, employee.Position,
            employee.DepartmentId, department.Name, hasAccount, employee.CreatedAt
        ));
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var employee = await _context.Employees.Include(e => e.User).FirstOrDefaultAsync(e => e.Id == id);
        if (employee == null) return NotFound(new { message = "职工不存在" });

        if (employee.User != null)
            return BadRequest(new { message = "该职工已关联用户账号，无法删除。请先删除关联的用户账号。" });

        _context.Employees.Remove(employee);
        await _context.SaveChangesAsync();

        return Ok(new { message = "已删除" });
    }
}
