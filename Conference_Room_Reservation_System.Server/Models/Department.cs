using System.ComponentModel.DataAnnotations;

namespace Conference_Room_Reservation_System.Server.Models;

public class Department
{
    public int Id { get; set; }

    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<Employee> Employees { get; set; } = new List<Employee>();
}
