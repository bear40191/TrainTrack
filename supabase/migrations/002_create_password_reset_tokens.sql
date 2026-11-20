-- 002_create_password_reset_tokens.sql
-- TrainTrack: ตารางเก็บโทเค็นรีเซ็ตรหัสผ่าน (ตาม Spec 2026-11-20)

-- 1. ตาราง password_reset_tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL, -- SHA-256 hash (ไม่เก็บค่า raw token เด็ดขาด)
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ, -- ว่าง = ยังไม่ถูกใช้
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index สำหรับค้นหา token_hash แบบรวดเร็ว
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_hash ON password_reset_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user ON password_reset_tokens(user_id);

-- 2. เพิ่มคอลัมน์ password_changed_at ในตาราง profiles เพื่อใช้เป็นกลไกยกเลิก Session ทุกอุปกรณ์
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ DEFAULT now();
