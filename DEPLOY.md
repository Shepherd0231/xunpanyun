# 询盘云部署指南

## 1. 创建 D1 数据库

```bash
# 创建数据库
npx wrangler d1 create xunpanyun-db

# 记录返回的 database_id，更新 wrangler.toml
```

## 2. 初始化数据库表

```bash
# 执行 schema.sql 创建表
npx wrangler d1 execute xunpanyun-db --file=./database/schema.sql
```

## 3. 设置 Secrets

```bash
# 设置 Resend API Key
npx wrangler secret put RESEND_API_KEY

# 设置 Sanity Token（如需要）
npx wrangler secret put SANITY_WRITE_TOKEN

# 设置其他 secrets
npx wrangler secret put KIMI_API_KEY
npx wrangler secret put PUBLIC_GA_ID
npx wrangler secret put PUBLIC_WHATSAPP_NUMBER
```

## 4. 部署到 Cloudflare Pages

```bash
# 构建项目
npm run build

# 部署
npx wrangler pages deploy dist
```

## 5. 验证部署

1. 访问联系页面 `/contact/`
2. 填写表单并提交
3. 检查：
   - 是否收到成功提示
   - D1 数据库是否有记录
   - 是否收到邮件通知

## 6. 配置 Resend 邮件

1. 登录 [Resend](https://resend.com)
2. 添加并验证域名 `xunpanyun.com`
3. 创建 API Key 并设置到 secrets
4. 更新 `src/pages/api/submit.ts` 中的发件人地址

## 数据库查询示例

```sql
-- 查看所有询盘
SELECT * FROM inquiries ORDER BY created_at DESC;

-- 查看新询盘
SELECT * FROM inquiries WHERE status = 'new' ORDER BY created_at DESC;

-- 更新询盘状态
UPDATE inquiries SET status = 'contacted' WHERE id = 1;
```
