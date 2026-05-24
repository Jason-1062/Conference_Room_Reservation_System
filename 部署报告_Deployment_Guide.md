# 🚀 会议室预约系统 - 生产环境部署指南 (Deployment Guide)

这份指南将引导您在一台典型的 Linux 服务器 (如 Ubuntu 22.04) 上，使用 Nginx 作为反向代理并结合 PM2/Daemon 或 Docker，将您的 **.NET 10 后端** 和 **React 前端** 部署上线。

## 📍 环境准备

在服务器上，您需要进行以下环境的安装：
1. **Nginx**：作为前端静态资源的网关以及后端 API 的反向代理。
   ```bash
   sudo apt update
   sudo apt install nginx -y
   ```
2. **.NET 10 运行时**：用于运行后端的 ASP.NET Core 应用。
   请参考微软官方文档安装对应版本的 ASP.NET Core Runtime (如 `aspnetcore-runtime-10.0`)。
3. **数据库**：如 PostgreSQL / MySQL / SQL Server 等，按您的 `appsettings.Production.json` 需求部署并配置。

---

## 🛠️ 第一步：部署后端 (.NET API)

1. **本地发布项目**：
   在开发机上执行打包命令，将程序编译为发布格式。
   ```bash
   cd Conference_Room_Reservation_System.Server
   dotnet publish -c Release -o ./publish
   ```
2. **上传至服务器**：
   将生成的 `publish` 文件夹上传到服务器的 `/var/www/conference-api` 路径下。
   ```bash
   scp -r ./publish user@your_server_ip:/var/www/conference-api
   ```
3. **配置系统服务 (Systemd) 守护进程**：
   在服务器上创建服务文件以保持后端常驻运行。
   ```bash
   sudo nano /etc/systemd/system/conference-api.service
   ```
   写入以下内容：
   ```ini
   [Unit]
   Description=Conference Room API .NET Web API

   [Service]
   WorkingDirectory=/var/www/conference-api
   ExecStart=/usr/bin/dotnet /var/www/conference-api/Conference_Room_Reservation_System.Server.dll
   Restart=always
   # 如果服务崩溃，10秒后重启
   RestartSec=10
   KillSignal=SIGINT
   SyslogIdentifier=conference-api
   Environment=ASPNETCORE_ENVIRONMENT=Production
   Environment=DOTNET_PRINT_TELEMETRY_MESSAGE=false

   [Install]
   WantedBy=multi-user.target
   ```
4. **启动服务**：
   ```bash
   sudo systemctl enable conference-api.service
   sudo systemctl start conference-api.service
   sudo systemctl status conference-api.service
   ```
   *此时，后端应默认运行在 `http://localhost:5000` (取决于您的 appsettings 配置).*

---

## 🎨 第二步：部署前端 (React)

1. **本地构建前端项目**：
   ```bash
   cd frontend
   npm run build
   ```
   *构建完成后会生成一个 `dist` 目录。*
2. **上传至服务器**：
   将 `dist` 文件夹内容上传至服务器的静态目录，比如 `/var/www/conference-frontend`。
   ```bash
   scp -r ./dist user@your_server_ip:/var/www/conference-frontend
   ```

---

## 🌐 第三步：配置 Nginx

配置 Nginx 来同时托管前端静态文件并对 `/api` 前缀的请求反向代理到 .NET 后端。

1. **新建站点配置文件**：
   ```bash
   sudo nano /etc/nginx/sites-available/conference-system
   ```
2. **写入配置规则**：
   ```nginx
   server {
       listen 80;
       server_name your_domain.com; # 换成您的域名或公网IP

       # 路由前端静态文件
       location / {
           root /var/www/conference-frontend;
           index index.html;
           # React 路由基于 BrowserHistory，所有的请求重定向到 index.html
           try_files $uri $uri/ /index.html;
       }

       # 反向代理后端 API 请求
       location /api/ {
           proxy_pass         http://127.0.0.1:5000; # 指向.NET的内网地址和端口
           proxy_http_version 1.1;
           proxy_set_header   Upgrade $http_upgrade;
           proxy_set_header   Connection keep-alive;
           proxy_set_header   Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header   X-Forwarded-Proto $scheme;
       }
   }
   ```
3. **启用站点并重启 Nginx**：
   ```bash
   sudo ln -s /etc/nginx/sites-available/conference-system /etc/nginx/sites-enabled/
   sudo nginx -t  # 测试配置文件语法是否有误
   sudo systemctl restart nginx
   ```

## 🎉 第四步：运维与更新

- **更新后端**：重新 `dotnet publish` -> 覆盖服务器文件 -> 执行 `sudo systemctl restart conference-api.service`。
- **更新前端**：重新 `npm run build` -> 覆盖 `/var/www/conference-frontend` 内容。
- **查看后端日志**：`sudo journalctl -fu conference-api.service`

**恭喜！您的会议室预约系统已成功部署到生产环境。**
