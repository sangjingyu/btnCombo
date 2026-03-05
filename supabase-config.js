// =============================================
// Supabase 설정 파일
// GitHub Pages 배포 전에 아래 값을 입력하세요
// =============================================

const SUPABASE_URL = 'https://phmyoybjdvlfznraznfz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobXlveWJqZHZsZnpucmF6bmZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NzY4OTcsImV4cCI6MjA4ODI1Mjg5N30.h3ck4dvQ4FHiDUL54p5DLtI0xdwItVj2P1Ahl8IFGlk';

// Supabase 클라이언트 초기화
const supabaseClient = window.supabase
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

export { supabaseClient, SUPABASE_URL, SUPABASE_ANON_KEY };
