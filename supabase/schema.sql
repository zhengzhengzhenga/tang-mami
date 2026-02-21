-- 甜心孕记 Supabase 数据库 Schema
-- 在 Supabase Dashboard -> SQL Editor 中执行此脚本
--
-- 认证配置说明（Supabase Dashboard -> Authentication -> Providers -> Email）：
-- 1) 开启 Email provider（否则会报：Email signups are disabled）
-- 2) 关闭 Confirm email（避免注册后需要邮件验证）

-- 血糖记录表
CREATE TABLE IF NOT EXISTS glucose_logs (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  value DECIMAL(5,2) NOT NULL,
  unit TEXT NOT NULL DEFAULT 'mmol/L',
  timing TEXT NOT NULL,
  meal_type TEXT,
  associated_meal_id TEXT,
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 饮食记录表
CREATE TABLE IF NOT EXISTS meal_logs (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  items JSONB,
  photo_url TEXT,
  nutrients JSONB,
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 运动记录表
CREATE TABLE IF NOT EXISTS exercise_logs (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity TEXT NOT NULL,
  duration INTEGER NOT NULL,
  intensity TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 用户资料表（扩展 auth.users）
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 启用 Row Level Security
ALTER TABLE glucose_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS 策略：用户只能访问自己的数据
CREATE POLICY "Users can CRUD own glucose_logs" ON glucose_logs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can CRUD own meal_logs" ON meal_logs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can CRUD own exercise_logs" ON exercise_logs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can CRUD own user_profiles" ON user_profiles
  FOR ALL USING (auth.uid() = id);

-- 创建索引以加速查询
CREATE INDEX IF NOT EXISTS idx_glucose_logs_user_timestamp ON glucose_logs(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_meal_logs_user_timestamp ON meal_logs(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_exercise_logs_user_timestamp ON exercise_logs(user_id, timestamp DESC);
