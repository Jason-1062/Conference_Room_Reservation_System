using Microsoft.EntityFrameworkCore;
using Conference_Room_Reservation_System.Server.Models;

namespace Conference_Room_Reservation_System.Server.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Department> Departments => Set<Department>();
    public DbSet<Employee> Employees => Set<Employee>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Room> Rooms => Set<Room>();
    public DbSet<RoomEquipment> RoomEquipments => Set<RoomEquipment>();
    public DbSet<Reservation> Reservations => Set<Reservation>();
    public DbSet<Notification> Notifications => Set<Notification>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Department
        modelBuilder.Entity<Department>(e =>
        {
            e.HasIndex(d => d.Name).IsUnique();
        });

        // Employee
        modelBuilder.Entity<Employee>(e =>
        {
            e.HasOne(emp => emp.Department)
                .WithMany(d => d.Employees)
                .HasForeignKey(emp => emp.DepartmentId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // User
        modelBuilder.Entity<User>(e =>
        {
            e.HasIndex(u => u.Username).IsUnique();
            e.HasOne(u => u.Employee)
                .WithOne(emp => emp.User)
                .HasForeignKey<User>(u => u.EmployeeId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // Room
        modelBuilder.Entity<Room>(e =>
        {
            e.HasIndex(r => r.Name).IsUnique();
        });

        // RoomEquipment
        modelBuilder.Entity<RoomEquipment>(e =>
        {
            e.HasOne(eq => eq.Room)
                .WithMany(r => r.Equipment)
                .HasForeignKey(eq => eq.RoomId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Reservation
        modelBuilder.Entity<Reservation>(e =>
        {
            e.HasOne(r => r.Room)
                .WithMany(room => room.Reservations)
                .HasForeignKey(r => r.RoomId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(r => r.User)
                .WithMany(u => u.Reservations)
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasIndex(r => new { r.RoomId, r.StartTime, r.EndTime });
        });

        // Notification
        modelBuilder.Entity<Notification>(e =>
        {
            e.HasOne(n => n.User)
                .WithMany(u => u.Notifications)
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasIndex(n => new { n.UserId, n.IsRead });
        });

        // Seed admin user and sample data
        SeedData(modelBuilder);
    }

    private void SeedData(ModelBuilder modelBuilder)
    {
        // Seed departments
        modelBuilder.Entity<Department>().HasData(
            new Department { Id = 1, Name = "技术部", Description = "负责软件开发与技术支持", CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Department { Id = 2, Name = "市场部", Description = "负责市场推广与品牌建设", CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Department { Id = 3, Name = "人事部", Description = "负责人力资源管理", CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Department { Id = 4, Name = "财务部", Description = "负责财务管理与预算", CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Department { Id = 5, Name = "行政部", Description = "负责行政事务与后勤保障", CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) }
        );

        // Seed employees
        modelBuilder.Entity<Employee>().HasData(
            new Employee { Id = 1, Name = "管理员", Phone = "13800000000", Email = "admin@company.com", Position = "系统管理员", DepartmentId = 5, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Employee { Id = 2, Name = "张三", Phone = "13800000001", Email = "zhangsan@company.com", Position = "高级工程师", DepartmentId = 1, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Employee { Id = 3, Name = "李四", Phone = "13800000002", Email = "lisi@company.com", Position = "市场经理", DepartmentId = 2, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Employee { Id = 4, Name = "王五", Phone = "13800000003", Email = "wangwu@company.com", Position = "HR专员", DepartmentId = 3, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Employee { Id = 5, Name = "赵六", Phone = "13800000004", Email = "zhaoliu@company.com", Position = "财务主管", DepartmentId = 4, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) }
        );

        // Seed admin user (password: admin123)
        modelBuilder.Entity<User>().HasData(
            new User
            {
                Id = 1,
                Username = "admin",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
                Role = UserRole.Admin,
                Status = UserStatus.Approved,
                EmployeeId = 1,
                CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            new User
            {
                Id = 2,
                Username = "zhangsan",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("123456"),
                Role = UserRole.User,
                Status = UserStatus.Approved,
                EmployeeId = 2,
                CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            }
        );

        // Seed rooms
        modelBuilder.Entity<Room>().HasData(
            new Room { Id = 1, Name = "星辰会议室", Location = "A栋3楼301", Capacity = 10, Description = "小型会议室，适合团队讨论", Status = RoomStatus.Available, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Room { Id = 2, Name = "银河会议室", Location = "A栋3楼302", Capacity = 20, Description = "中型会议室，配备完善的视频会议设备", Status = RoomStatus.Available, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Room { Id = 3, Name = "日月会议室", Location = "B栋5楼501", Capacity = 50, Description = "大型报告厅，可举办大型会议和培训", Status = RoomStatus.Available, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Room { Id = 4, Name = "清风会议室", Location = "A栋2楼201", Capacity = 6, Description = "迷你会议室，适合小组讨论", Status = RoomStatus.Available, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Room { Id = 5, Name = "明月会议室", Location = "B栋3楼303", Capacity = 15, Description = "中型会议室，环境优雅", Status = RoomStatus.Maintenance, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) }
        );

        // Seed room equipment
        modelBuilder.Entity<RoomEquipment>().HasData(
            new RoomEquipment { Id = 1, RoomId = 1, Name = "投影仪" },
            new RoomEquipment { Id = 2, RoomId = 1, Name = "白板" },
            new RoomEquipment { Id = 3, RoomId = 2, Name = "投影仪" },
            new RoomEquipment { Id = 4, RoomId = 2, Name = "视频会议系统" },
            new RoomEquipment { Id = 5, RoomId = 2, Name = "白板" },
            new RoomEquipment { Id = 6, RoomId = 3, Name = "投影仪" },
            new RoomEquipment { Id = 7, RoomId = 3, Name = "音响系统" },
            new RoomEquipment { Id = 8, RoomId = 3, Name = "视频会议系统" },
            new RoomEquipment { Id = 9, RoomId = 3, Name = "无线麦克风" },
            new RoomEquipment { Id = 10, RoomId = 4, Name = "电视屏幕" },
            new RoomEquipment { Id = 11, RoomId = 5, Name = "投影仪" },
            new RoomEquipment { Id = 12, RoomId = 5, Name = "白板" }
        );
    }
}
