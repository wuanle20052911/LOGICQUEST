const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const DIST_DIR = path.join(__dirname, 'dist');

app.use(cors());
app.use(express.json({ limit: '1mb' }));

const getSupabase = () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return null;
  }

  return createClient(url, key, {
    auth: { persistSession: false }
  });
};

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'LogicQuest API is running', envConfigured: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) });
});

app.get('/api/progress/:userId', async (req, res) => {
  const { userId } = req.params;
  const supabase = getSupabase();

  if (!supabase) {
    return res.status(503).json({ error: 'Supabase chưa được cấu hình. Tiến độ chỉ lưu trên thiết bị này.' });
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId)) {
    return res.status(400).json({ error: 'userId không hợp lệ' });
  }

  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json({ data: data || null, source: 'supabase' });
});

app.post('/api/progress', async (req, res) => {
  const { user_id, completed, attempts, age } = req.body || {};

  if (typeof user_id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(user_id)) {
    return res.status(400).json({ error: 'user_id không hợp lệ' });
  }
  if (!Array.isArray(completed) || completed.some(id => !Number.isInteger(id) || id < 0 || id > 9)) {
    return res.status(400).json({ error: 'completed phải là danh sách nhiệm vụ hợp lệ' });
  }
  if (!Array.isArray(attempts) || attempts.length > 500) {
    return res.status(400).json({ error: 'attempts phải là danh sách hợp lệ (tối đa 500 lượt)' });
  }
  if (!Number.isInteger(age) || age < 6 || age > 8) {
    return res.status(400).json({ error: 'age phải từ 6 đến 8' });
  }

  const payload = {
    user_id,
    completed: [...new Set(completed)],
    attempts: attempts.slice(-500),
    stars: new Set(completed).size,
    age,
    updated_at: new Date().toISOString()
  };

  const supabase = getSupabase();

  if (!supabase) {
    return res.status(503).json({ error: 'Supabase chưa được cấu hình. Tiến độ chỉ lưu trên thiết bị này.' });
  }

  const { data, error } = await supabase
    .from('user_progress')
    .upsert(payload, { onConflict: 'user_id' })
    .select();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json({ data: data?.[0] || payload, source: 'supabase' });
});

app.get('/api/leaderboard', async (req, res) => {
  const supabase = getSupabase();

  if (!supabase) {
    return res.status(503).json({ error: 'Supabase chưa được cấu hình.' });
  }

  const { data, error } = await supabase
    .from('user_progress')
    .select('user_id, stars, age, updated_at')
    .order('stars', { ascending: false })
    .limit(10);

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json({ data, source: 'supabase' });
});

app.use(express.static(DIST_DIR));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }

  res.sendFile(path.join(DIST_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`LogicQuest server running at http://localhost:${PORT}`);
  console.log('Frontend served from dist/');
});
