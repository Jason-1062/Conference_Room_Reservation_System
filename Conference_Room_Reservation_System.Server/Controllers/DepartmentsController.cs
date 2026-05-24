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
public class DepartmentsController : ControllerBase
{
    private readonly AppDbContext _context;

    public DepartmentsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var data = await _context.Departments
            .OrderBy(d => d.Name)
            .Select(d => new { d.Id, d.Name, d.Description, d.CreatedAt, EmployeeCount = d.Employees.Count })
            .ToListAsync();

        var departments = data.Select(d => new DepartmentDto(d.Id, d.Name, d.Description, d.EmployeeCount, d.CreatedAt)).ToList();

        return Ok(departments);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var dept = await _context.Departments
            .Include(d => d.Employees)
            .FirstOrDefaultAsync(d => d.Id == id);

        if (dept == null) return NotFound(new { message = "部门不存在" });

        return Ok(new DepartmentDto(dept.Id, dept.Name, dept.Description, dept.Employees.Count, dept.CreatedAt));
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] CreateDepartmentRequest request)
    {
        if (await _context.Departments.AnyAsync(d => d.Name == request.Name))
            return BadRequest(new { message = "部门名称已存在" });

        var department = new Department
        {
            Name = request.Name,
            Description = request.Description
        };

        _context.Departments.Add(department);
        await _context.SaveChangesAsync();

        return Ok(new DepartmentDto(department.Id, department.Name, department.Description, 0, department.CreatedAt));
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateDepartmentRequest request)
    {
        var department = await _context.Departments.FindAsync(id);
        if (department == null) return NotFound(new { message = "部门不存在" });

        if (await _context.Departments.AnyAsync(d => d.Name == request.Name && d.Id != id))
            return BadRequest(new { message = "部门名称已存在" });

        department.Name = request.Name;
        department.Description = request.Description;
        await _context.SaveChangesAsync();

        var count = await _context.Employees.CountAsync(e => e.DepartmentId == id);
        return Ok(new DepartmentDto(department.Id, department.Name, department.Description, count, department.CreatedAt));
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var department = await _context.Departments.Include(d => d.Employees).FirstOrDefaultAsync(d => d.Id == id);
        if (department == null) return NotFound(new { message = "部门不存在" });

        if (department.Employees.Any())
            return BadRequest(new { message = "该部门下还有职工，无法删除" });

        _context.Departments.Remove(department);
        await _context.SaveChangesAsync();

        return Ok(new { message = "已删除" });
    }
}
