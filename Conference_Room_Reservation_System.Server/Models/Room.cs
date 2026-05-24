using System.ComponentModel.DataAnnotations;

namespace Conference_Room_Reservation_System.Server.Models;

public enum RoomStatus
{
    Available = 0,
    Maintenance = 1
}

public class Room
{
    public int Id { get; set; }

    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? Location { get; set; }

    public int Capacity { get; set; }

    [MaxLength(500)]
    public string? Description { get; set; }

    [MaxLength(500)]
    public string? ImageUrl { get; set; }

    public RoomStatus Status { get; set; } = RoomStatus.Available;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<RoomEquipment> Equipment { get; set; } = new List<RoomEquipment>();
    public ICollection<Reservation> Reservations { get; set; } = new List<Reservation>();
}
