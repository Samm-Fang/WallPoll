# WallPoll

WallPoll是一个部署在Cloudflare Workers上的壁纸投票画廊项目，允许用户上传壁纸并为喜欢的壁纸投票。

## 功能

- **用户登录**：输入1到59的用户ID进行登录。
- **壁纸上传**：每个用户可以上传一张壁纸，图片会自动裁切为16:9比例。
- **壁纸投票**：每个用户最多可以投出两票，不能投给自己上传的作品。
- **壁纸下载**：所有用户都可以下载画廊中的图片。
- **响应式设计**：页面适配手机竖屏和电脑横屏两种比例。

## 设计风格

- 采用优雅简约的设计风格，使用流畅的动画。
- 主要色调为浅灰色和饱和度低的浅蓝色，辅助色为莫兰迪色系。

## 部署

本项目通过Cloudflare Workers部署，前后端分离：
- 后端使用Cloudflare Workers处理用户认证、上传、投票和下载逻辑。
- 前端静态文件可以通过Cloudflare Pages或其他方式提供。

### 部署步骤

1. 配置`wrangler.toml`文件中的数据库ID和其他环境变量。
2. 使用`npm run deploy`命令发布到Cloudflare Workers。
3. 将前端静态文件部署到Cloudflare Pages或其他静态文件托管服务。

## 开发

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

## GitHub仓库

项目仓库地址：[https://github.com/Samm-Fang/WallPoll](https://github.com/Samm-Fang/WallPoll)
