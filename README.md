# Astro B2B 外贸独立站

一个基于 Astro 框架构建的高性能外贸 B2B 独立站，集成 Sanity CMS 双引擎内容管理、多语言支持、SEO 优化和自动化发布流程。

## 🚀 技术栈

- **框架**: [Astro](https://astro.build/) v6.x
- **样式**: TailwindCSS v4
- **CMS**: Sanity.io (可视化 Studio + MD 自动化脚本)
- **部署**: Cloudflare Pages
- **数据库**: Cloudflare D1
- **搜索**: Pagefind
- **邮件**: Resend

## 📁 项目结构

```
├── src/
│   ├── components/          # UI 组件
│   │   ├── communication/   # 沟通组件 (CTA, 悬浮窗)
│   │   ├── layout/          # 布局组件 (Header, Layout)
│   │   ├── media/           # 媒体组件 (SmartImage)
│   │   ├── portable-text/   # 富文本渲染
│   │   ├── seo/             # SEO 组件 (SEO, Schema, Analytics)
│   │   └── ui/              # 基础 UI (Container, Section, Search)
│   ├── pages/               # 页面路由
│   │   ├── api/             # API 端点
│   │   ├── blog/            # 博客动态路由
│   │   ├── products/        # 产品动态路由
│   │   └── services/        # 服务动态路由
│   ├── schema/              # Sanity Schema 定义
│   ├── styles/              # 全局样式
│   └── utils/               # 工具函数
├── scripts/                 # 自动化脚本
├── drafts/                  # MD 文件草稿
└── public/                  # 静态资源
```

## 🛠️ 本地开发

### 1. 环境准备

确保已安装 Node.js 18+ 和 npm。

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制 `.env.example` 为 `.env`：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入必要的环境变量：

```env
# Sanity CMS (必需)
SANITY_PROJECT_ID="39od49xj"
SANITY_DATASET="production"
SANITY_WRITE_TOKEN="your-write-token"

# Resend 邮件服务 (可选)
RESEND_API_KEY="your-resend-api-key"

# Kimi AI API (可选，用于 SEO 自动生成)
KIMI_API_KEY="your-kimi-api-key"

# Google Analytics (可选)
PUBLIC_GA_ID="G-XXXXXXXXXX"

# Google Search Console (可选)
PUBLIC_GSC_ID="your-gsc-verification"
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:4321 查看网站。

## 🔧 Sanity CMS 配置

### 1. 配置 CORS

登录 [Sanity Manage](https://www.sanity.io/manage) → 选择项目 → **API** → **CORS Origins**，添加以下来源：

```
http://localhost:4321
https://your-domain.com
https://*.pages.dev
```

### 2. 获取 API Token

在 **API** → **Tokens** 中创建新 Token：
- 选择 **Editor** 权限
- 复制 Token 到 `.env` 的 `SANITY_WRITE_TOKEN`

### 3. 访问 Studio

启动开发服务器后，访问 http://localhost:4321/admin 使用可视化 Studio。

## 📝 自动化发布流程

### 准备 MD 文件

在 `/drafts/` 目录创建 Markdown 文件：

```markdown
---
title: "Your Article Title"
type: "post"  # 或 "product"
category: "industry-insights"
tags: ["cnc", "machining"]
excerpt: "Brief description"
---

## Introduction

Your content here...

## Features

- Feature 1
- Feature 2

![Alt text](./images/your-image.jpg)
```

### 运行发布脚本

```bash
# 发布单个文件
npx tsx scripts/publish-to-sanity.ts drafts/your-article.md

# 或处理所有草稿
npx tsx scripts/publish-to-sanity.ts
```

### 自动化功能

脚本会自动完成：

1. **读取 MD 文件** - 解析 frontmatter 和正文
2. **生成 Slug** - 从标题自动生成 URL 友好的 slug
3. **上传图片** - 提取本地图片并上传到 Sanity Assets
4. **SEO 自动生成** - 调用 Kimi API 生成 150 字 SEO 描述
5. **多语言翻译** - 自动翻译为中文(zh)和德语(de)
6. **写入数据库** - 通过 Mutations API 创建文档

### 处理后的文件

发布成功后，MD 文件会被移动到 `/drafts/processed/` 目录。

## 🔍 站内搜索

### 构建搜索索引

```bash
# 先构建站点
npm run build

# 生成 Pagefind 索引
npx pagefind --site dist

# 或使用 npm 脚本 (如果已配置)
npm run index:search
```

### 使用搜索组件

在页面中引入 Search 组件：

```astro
---
import Search from '../components/ui/search.astro';
---

<Search placeholder="Search products..." />
```

快捷键：`Cmd/Ctrl + K` 打开搜索

## 📊 流量监控

### Google Analytics 4

1. 在 [GA4](https://analytics.google.com/) 创建数据流
2. 复制 Measurement ID (格式: `G-XXXXXXXXXX`)
3. 添加到 `.env`：`PUBLIC_GA_ID="G-XXXXXXXXXX"`

### Google Search Console

1. 在 [GSC](https://search.google.com/search-console) 添加网站
2. 选择 **HTML 标记** 验证方式
3. 复制 `content` 值到 `.env`：`PUBLIC_GSC_ID="your-code"`

### 其他监控

- **Microsoft Clarity**: `PUBLIC_CLARITY_ID`
- **百度统计**: `PUBLIC_BAIDU_ID`

## 🌍 多语言

### 配置

在 `astro.config.mjs` 中配置：

```javascript
i18n: {
  defaultLocale: 'en',
  locales: ['en', 'zh', 'de'],
  routing: {
    prefixDefaultLocale: false,
  },
}
```

### 访问不同语言

- 英语 (默认): `/products`
- 中文: `/zh/products`
- 德语: `/de/products`

### 切换语言

网站右上角提供语言切换下拉菜单，自动根据当前 URL 生成对应语言的链接。

## 🚀 部署

### Cloudflare Pages

1. 连接 Git 仓库到 Cloudflare Pages
2. 构建设置：
   - Build command: `npm run build`
   - Build output: `dist`
3. 添加环境变量（与 `.env` 相同）
4. 绑定 D1 数据库（用于表单提交）

### D1 数据库初始化

```bash
# 创建数据库
wrangler d1 create yourbrand-db

# 创建表
wrangler d1 execute yourbrand-db --command="
  CREATE TABLE IF NOT EXISTS inquiries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    company TEXT,
    phone TEXT,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
"
```

## 📋 环境变量清单

| 变量名 | 必需 | 说明 |
|--------|------|------|
| `SANITY_PROJECT_ID` | ✅ | Sanity 项目 ID |
| `SANITY_DATASET` | ✅ | 数据集名称 (默认: production) |
| `SANITY_WRITE_TOKEN` | ⚠️ | 发布脚本需要 |
| `RESEND_API_KEY` | ❌ | 邮件通知 |
| `KIMI_API_KEY` | ❌ | AI SEO 生成 |
| `PUBLIC_GA_ID` | ❌ | Google Analytics |
| `PUBLIC_GSC_ID` | ❌ | Search Console |
| `PUBLIC_WHATSAPP_NUMBER` | ❌ | WhatsApp 联系号码 |
| `PUBLIC_CONTACT_EMAIL` | ❌ | 联系邮箱 |

## 🐛 常见问题

### Q: 开发服务器报错 "Configuration must contain projectId"
A: 检查 `.env` 文件是否包含 `SANITY_PROJECT_ID`，或确认 `astro.config.mjs` 中已硬编码项目 ID。

### Q: 图片无法显示
A: 确保使用 `<SmartImage />` 组件，并正确配置 Sanity image-url。

### Q: 搜索功能不工作
A: 需要先运行 `npm run build && npx pagefind --site dist` 生成搜索索引。

### Q: 表单提交失败
A: 检查 D1 数据库绑定是否正确，以及 `wrangler.toml` 中的数据库 ID 是否匹配。

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**Built with ❤️ using Astro + Sanity + Cloudflare**
