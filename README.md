# WallPoll

这是一个练习用的项目，旨在创建一个部署于Cloudflare Workers的壁纸投票画廊应用。项目采用前后端分离设计，允许用户上传壁纸图片并进行投票。

## 功能

- 用户可以通过输入1到59的ID进行登录。
- 每个用户可以上传一张图片，图片会自动裁切成16:9比例并展示在画廊中。
- 用户可以为画廊中的图片投票，最多投出两票，不能投给自己上传的作品。
- 所有用户都可以随意下载画廊中的图片。

## 设计风格

- 网页设计风格优雅简约，使用浅灰色调与饱和度低的浅蓝色。
- 页面同时适配手机竖屏和电脑横屏两种比例。

## 部署

项目可以通过链接GitHub仓库部署到Cloudflare Workers。

## 安装与开发

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建项目
npm run build

# 部署到Cloudflare
npm run deploy
```

## 许可证

MIT
