using System.ComponentModel.DataAnnotations;

namespace Conference_Room_Reservation_System.Server.Models;

public class Employee
{
    public int Id { get; set; }

    [Required, MaxLength(50)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? Phone { get; set; }

    [MaxLength(100)]
    public string? Email { get; set; }

    [MaxLength(50)]
    public string? Position { get; set; }

    public int DepartmentId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Department Department { get; set; } = null!;
    public User? User { get; set; }
}
