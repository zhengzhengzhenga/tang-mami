<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1gzPLKAkal4w4KVuSRTditPhSMIBodp9C

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```
2. 配置 Supabase（用户登录与数据存储）：
   - 在 [supabase.com](https://supabase.com) 创建项目
   - 复制 `.env.example` 为 `.env`，填入 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`
   - 在 Supabase Dashboard -> SQL Editor 中执行 `supabase/schema.sql`
   - 在 Authentication -> Providers -> Email 中：开启 Email provider（允许邮箱注册）
   - 在 Authentication -> Providers -> Email 中：关闭 "Confirm email"（避免注册后邮件验证）
3. 可选：在 `.env` 中配置 `GEMINI_API_KEY` 以启用 AI 营养分析
4. 启动应用：
   ```bash
   npm run dev
   ```
