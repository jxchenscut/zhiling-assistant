# 基于豆包API的问答交互网页

这是一个基于豆包（或其他类似大语言模型）API构建的简单问答交互网页。项目使用原生HTML、JavaScript和Tailwind CSS开发，界面风格参考了主流聊天应用，实现了核心的问答、加载状态、错误提示等功能。

## ✨ 功能特性

- **实时问答**：与AI进行流畅的对话。
- **现代设计**：简洁、美观的聊天界面，区分用户和AI消息。
- **响应式布局**：完美适配PC和移动设备。
- **轻量高效**：无复杂框架，加载速度快。
- **易于部署**：可一键部署到GitHub Pages、Vercel等平台。
- **流式响应**：支持处理流式API响应，实现打字机效果。

## 🚀 如何运行

1. 克隆或下载本仓库到本地。
2. 直接在浏览器中打开 `index.html` 文件即可开始使用。

**注意**：由于浏览器安全策略，直接在本地`file://`协议下运行时，API请求可能会失败。建议使用一个简单的本地服务器来预览，例如通过VS Code的`Live Server`插件。

## ⚙️ API 配置

在使用前，你需要配置你的豆包API信息。

1. 打开 `assets/js/main.js` 文件。
2. 找到顶部的API配置部分：

   ```javascript
   // 豆包API配置 - 请替换为你的实际配置
   const API_URL = 'YOUR_API_ENDPOINT'; // 你的API地址
   const API_KEY = 'YOUR_API_KEY';      // 你的API密钥
   ```

3. 将 `API_URL` 和 `API_KEY` 的值替换为你自己的API Endpoint和密钥。

4. **请求体（Body）配置**：根据你的API文档，修改 `fetch` 请求中的 `body` 部分，以匹配API要求的参数格式。

   ```javascript
   // ...
   body: JSON.stringify({
       "query": message,
       "stream": true, // 根据API要求看是否需要流式输出
       // ... 其他自定义参数
   })
   // ...
   ```

## 🌐 关于跨域（CORS）问题

**重要提示**：出于安全原因，豆包的官方API**不允许**直接从浏览器前端进行跨域调用。如果你直接在部署后的网页上请求API，浏览器的控制台会报CORS（跨域资源共享）错误。

### 解决方案

你需要一个**代理服务器**来转发你的请求。代理服务器会接收你网页的请求，然后从服务器端去请求豆包API，再把结果返回给你的网页。这样就绕过了浏览器的跨域限制。

你可以使用以下方式快速搭建代理：

- **Vercel / Netlify**：这两个平台都支持简单的代理配置。你只需在项目根目录添加一个配置文件（如 `vercel.json` 或 `netlify.toml`）即可设置重写规则。
- **Cloudflare Workers**：创建一个轻量级的 Worker 来转发请求。
- **Nginx**：如果你有自己的服务器，可以通过配置Nginx反向代理来实现。
- **后端语言**：使用Node.js、Python等后端语言搭建一个简单的API服务器来做中转。

## 部署到 GitHub Pages

你可以非常方便地将此项目部署到GitHub Pages上免费托管。

1. **创建GitHub仓库**：在你的GitHub上创建一个新的公开仓库。
2. **上传代码**：将 `index.html`, `assets/` 文件夹和 `README.md` 一起上传到这个仓库。
3. **启用GitHub Pages**：
   - 进入你的仓库页面，点击 "Settings"（设置）。
   - 在左侧菜单中，选择 "Pages"。
   - 在 "Build and deployment" 部分，将 "Source"（源）设置为 "Deploy from a branch"（从分支部署）。
   - 在 "Branch"（分支）部分，选择 `main`（或 `master`）分支和 `/(root)` 目录，然后点击 "Save"。
4. **访问你的网站**：等待几分钟，GitHub Pages会自动为你构建和部署。完成后，页面顶部会显示你的网站访问地址，格式通常为 `https://<你的用户名>.github.io/<你的仓库名>/`。

---

祝你使用愉快！ 