using System.ComponentModel.DataAnnotations;

namespace Conference_Room_Reservation_System.Server.Models;

public class RoomEquipment
{
    public int Id { get; set; }

    public int RoomId { get; set; }

    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    // Navigation
    public Room Room { get; set; } = null!;
}
