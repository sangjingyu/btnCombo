// =============================================
// Supabase 설정 파일
// GitHub Pages 배포 전에 아래 값을 입력하세요
// =============================================

const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

// Supabase 클라이언트 초기화
const supabaseClient = window.supabase
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// =============================================
// Supabase SQL 스키마 (대시보드에서 실행)
// =============================================
/*
-- 버튼 클릭 기록 테이블
CREATE TABLE button_clicks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  clicked_at TIMESTAMPTZ DEFAULT NOW(),
  hour_bucket INT GENERATED ALWAYS AS (EXTRACT(HOUR FROM clicked_at)) STORED,
  date_bucket DATE GENERATED ALWAYS AS (clicked_at::DATE) STORED
);

-- RLS 정책
ALTER TABLE button_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own clicks" ON button_clicks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own clicks" ON button_clicks
  FOR SELECT USING (auth.uid() = user_id);

-- 통계 뷰
CREATE VIEW daily_click_stats AS
  SELECT user_id, date_bucket, hour_bucket, COUNT(*) as click_count
  FROM button_clicks
  GROUP BY user_id, date_bucket, hour_bucket;
*/

export { supabaseClient, SUPABASE_URL, SUPABASE_ANON_KEY };
