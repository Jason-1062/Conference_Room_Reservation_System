# 会议室预约系统 (Conference Room Reservation System)

这是一个基于 **ASP.NET Core Web API (.NET 10)** 和 **React + Vite + TypeScript** 开发的现代化会议室预约管理系统。系统包含企业级会议室预约、部门与职工管理、甘特图时段预览、站内通知系统等功能。

## 🌟 主要功能

- **用户与鉴权**：角色区分（普通用户 / 管理员），提供注册、登录及职工账号绑定功能。
- **会议室管理**：管理员可进行会议室的增删改查。
- **时间段总览 (甘特图)**：实时查看会议室各个时段的预约状态（可用、已预约、待审批、维护中）。支持单日的全局视图与单个会议室的周历视图。
- **预约系统**：用户可以发起预约，后台对时间冲突进行检测，确保预约资源的唯一性。
- **部门与职工管理**：录入企业部门与职工数据。
- **通知消息**：预约状态变更、系统通知等能即时推送并在个人中心展示。
- **个人中心**：显示用户基础信息、近期会议、各类消息等，并可方便地修改联系方式。

## 💻 技术栈

### 后端 (Backend)
- 框架：.NET 10.0 / ASP.NET Core Web API
- 数据库框架：Entity Framework Core
- 项目结构：
  - `Conference_Room_Reservation_System.Server`: 主 API 服务，处理所有业务逻辑，包括数据库交互。
  - `Conference_Room_Reservation_System.AppHost`: [.NET Aspire](https://learn.microsoft.com/en-us/dotnet/aspire/) 宿主项目，用于本地开发编排。

### 前端 (Frontend)
- 框架：React 18 + Vite
- 语言：TypeScript
- 路由：React Router v6
- 状态管理/请求：Context API / Axios (或原生 Fetch 封装)
- UI/样式：原生的玻璃拟态 (Glassmorphism) CSS 风格，无过重第三方组件库依赖。

## 🚀 本地开发与运行

### 环境要求
- [.NET 10.0 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
- [Node.js](https://nodejs.org/) (建议 18.x 或以上)
- 一款兼容的数据库（可通过修改 `appsettings.json` 配置连接字符串，默认可使用 SQLite/SQL Server 进行开发）

### 后台启动
1. 进入工作区根目录。
2. 使用 Visual Studio 打开 `Conference_Room_Reservation_System.slnx` 解决方案，或者在终端运行：
   ```bash
   dotnet run --project Conference_Room_Reservation_System.AppHost
   ```
   *注意：使用 AppHost 启动可以利用 .NET Aspire 的仪表盘，方便进行容器和服务编排调试。也可直接运行 `.Server` 项目。*

### 前端启动
1. 进入前端目录页：
   ```bash
   cd frontend
   ```
2. 安装依赖：
   ```bash
   npm install
   ```
3. 启动开发服务器：
   ```bash
   npm run dev
   ```

## 📜 许可证

MIT License.
