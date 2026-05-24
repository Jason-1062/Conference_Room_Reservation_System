namespace Conference_Room_Reservation_System.Server.DTOs;

// ========== Auth DTOs ==========
public record LoginRequest(string Username, string Password);
public record RegisterRequest(string Username, string Password);
public record LoginResponse(string Token, UserDto User);
public record LinkAccountRequest(string Name, string Phone);
public record UpdateProfileRequest(string? Phone, string? Email);

// ========== User DTOs ==========
public record UserDto(int Id, string Username, string Role, string Status, int? EmployeeId, string? EmployeeName, string? DepartmentName, string? Phone, string? Email, DateTime CreatedAt);
public record UserListDto(int Id, string Username, string Role, string Status, string? EmployeeName, string? DepartmentName, DateTime CreatedAt);

// ========== Department DTOs ==========
public record DepartmentDto(int Id, string Name, string? Description, int EmployeeCount, DateTime CreatedAt);
public record CreateDepartmentRequest(string Name, string? Description);
public record UpdateDepartmentRequest(string Name, string? Description);

// ========== Employee DTOs ==========
public record EmployeeDto(int Id, string Name, string? Phone, string? Email, string? Position, int DepartmentId, string DepartmentName, bool HasAccount, DateTime CreatedAt);
public record CreateEmployeeRequest(string Name, string? Phone, string? Email, string? Position, int DepartmentId);
public record UpdateEmployeeRequest(string Name, string? Phone, string? Email, string? Position, int DepartmentId);

// ========== Room DTOs ==========
public record RoomDto(int Id, string Name, string? Location, int Capacity, string? Description, string? ImageUrl, string Status, List<string> Equipment, DateTime CreatedAt);
public record CreateRoomRequest(string Name, string? Location, int Capacity, string? Description, string? ImageUrl, int Status, List<string>? Equipment);
public record UpdateRoomRequest(string Name, string? Location, int Capacity, string? Description, string? ImageUrl, int Status, List<string>? Equipment);

// ========== Reservation DTOs ==========
public record ReservationDto(int Id, string Title, string? Description, int RoomId, string RoomName, string? RoomLocation, int UserId, string Username, DateTime StartTime, DateTime EndTime, string Status, int AttendeesCount, DateTime CreatedAt);
public record CreateReservationRequest(string Title, string? Description, int RoomId, DateTime StartTime, DateTime EndTime, int AttendeesCount);

// ========== Notification DTOs ==========
public record NotificationDto(int Id, string Title, string Message, bool IsRead, DateTime CreatedAt);

// ========== Dashboard DTOs ==========
public record DashboardStats(
    int TotalRooms,
    int AvailableRooms,
    int TodayReservations,
    int PendingApprovals,
    int TotalUsers,
    int PendingUsers,
    int TotalDepartments,
    int TotalEmployees,
    List<ReservationDto> UpcomingReservations,
    List<RoomUsageDto> RoomUsage
);
public record RoomUsageDto(string RoomName, int ReservationCount);
