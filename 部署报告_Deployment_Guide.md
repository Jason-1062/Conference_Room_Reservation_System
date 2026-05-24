# 🚀 会议室预约系统 - 生产环境部署指南 (Deployment Guide)

这份指南将引导您在一台典型的 Linux 服务器 (如 Ubuntu 22.04) 上，使用 Nginx + systemd 将您的 **.NET 10 后端** 和 **React 前端** 部署上线。

## 📍 环境准备

在服务器上，您需要进行以下环境的安装：
1. **Nginx**：作为前端静态资源的网关以及后端 API 的反向代理。
   ```bash
   sudo apt update
   sudo apt install nginx -y
   ```
2. **.NET 10 运行时**：用于运行后端的 ASP.NET Core 应用。
   请参考微软官方文档安装对应版本的 ASP.NET Core Runtime (如 `aspnetcore-runtime-10.0`)。
3. **Node.js + npm**：用于构建 React 前端静态资源。
4. **数据库**：当前项目后端使用 **MySQL**，请按生产环境准备好对应实例，并用自己的生产配置覆盖连接字符串与 JWT 密钥。

---

## 🛠️ 第一步：部署后端 (.NET API)

1. **本地发布项目**：
   在开发机上执行打包命令，将程序编译为发布格式。
   ```bash
   dotnet publish Conference_Room_Reservation_System.Server/Conference_Room_Reservation_System.Server.csproj -c Release -o ./publish
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
   RestartSec=10
   KillSignal=SIGINT
   SyslogIdentifier=conference-api
   Environment=ASPNETCORE_ENVIRONMENT=Production
   Environment=ASPNETCORE_URLS=http://127.0.0.1:5000
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
   *生产环境建议显式绑定到 `http://127.0.0.1:5000`，这样只允许 Nginx 通过反向代理访问后端。开发态看到的 `5574` 端口只用于 `dotnet run`。*

---

## 🎨 第二步：部署前端 (React)

1. **本地构建前端项目**：
   ```bash
   cd frontend
   npm install
   npm run build
   ```
   *构建完成后会生成一个 `dist` 目录。*
2. **上传至服务器**：
   将 `dist` 文件夹内容上传至服务器的静态目录，比如 `/var/www/conference-frontend`。
   ```bash
   rsync -a ./dist/ user@your_server_ip:/var/www/conference-frontend/
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

## ⚙️ 生产配置建议

- 在服务器上放置 `appsettings.Production.json` 或通过环境变量覆盖数据库连接字符串、JWT 密钥和其他敏感信息。
- 后端发布后如果数据库为空，启动时会自动执行 `EnsureCreated()`；如果你已经有现成数据库结构，也可以改成迁移方案再上线。
- 如果站点首次访问报 502，优先检查 `conference-api.service` 是否启动成功，以及后端是否正在监听 `127.0.0.1:5000`。

## 🎉 第四步：运维与更新

- **更新后端**：
   1. 在项目根目录重新发布：`cd /root/Conference_Room_Reservation_System && dotnet publish Conference_Room_Reservation_System.Server/Conference_Room_Reservation_System.Server.csproj -c Release -o /var/www/conference-api`
   2. 重启服务：`sudo systemctl restart conference-api.service`

- **更新前端**：
   1. 在前端目录重新构建：`cd /root/Conference_Room_Reservation_System/frontend && npm run build`
   2. 覆盖静态目录：`sudo rm -rf /var/www/conference-frontend/* && sudo cp -r /root/Conference_Room_Reservation_System/frontend/dist/* /var/www/conference-frontend/`
   3. 如果只改了前端页面内容，通常不需要重启 Nginx；如果改了 Nginx 配置，再执行 `sudo systemctl restart nginx`。

- **快速检查**：
   - 前端是否可访问：`curl -I http://127.0.0.1/`
   - 后端是否可访问：`curl -I http://127.0.0.1/api/auth/login`
- **查看后端日志**：`sudo journalctl -fu conference-api.service`

**恭喜！您的会议室预约系统已成功部署到生产环境。**
