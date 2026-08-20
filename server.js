const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/public', express.static(path.join(__dirname, 'public')));

/* ============================================================
   页面路由
   ============================================================ */
app.get('/mobile', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'workbench-mobile.html'));
});
app.get('/desktop', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'workbench-desktop.html'));
});
app.get('/', (req, res) => {
  const ua = req.headers['user-agent'] || '';
  if (/Mobile|Android|iPhone|iPad/i.test(ua)) {
    res.redirect('/mobile');
  } else {
    res.sendFile(path.join(__dirname, 'public', 'workbench-desktop.html'));
  }
});

/* ============================================================
   方向一：读书相关热点
   POST /api/hot/reading  body: { books: ["书名1","书名2"] }
   ============================================================ */
app.post('/api/hot/reading', async (req, res) => {
  const { fetchReadingHot, getDemoData } = require('./api/_lib');
  try {
    const books = req.body.books || [];
    const result = await fetchReadingHot(books);
    if (result.videos.length === 0 && result.topics.length === 0) {
      return res.json({ success: true, ...getDemoData('reading') });
    }
    res.json({ success: true, ...result });
  } catch (e) {
    res.json({ success: false, ...getDemoData('reading'), error: e.message });
  }
});

// 兼容 GET
app.get('/api/hot/reading', async (req, res) => {
  const { fetchReadingHot, getDemoData } = require('./api/_lib');
  try {
    const books = req.query.books ? req.query.books.split(',') : [];
    const result = await fetchReadingHot(books);
    if (result.videos.length === 0 && result.topics.length === 0) {
      return res.json({ success: true, ...getDemoData('reading') });
    }
    res.json({ success: true, ...result });
  } catch (e) {
    res.json({ success: false, ...getDemoData('reading'), error: e.message });
  }
});

/* ============================================================
   方向二：社交平台热点选题
   GET /api/hot/social
   ============================================================ */
app.get('/api/hot/social', async (req, res) => {
  const { fetchSocialHot, getDemoData } = require('./api/_lib');
  try {
    const result = await fetchSocialHot();
    if (result.hot.length === 0) {
      return res.json({ success: true, ...getDemoData('social') });
    }
    res.json({ success: true, ...result });
  } catch (e) {
    res.json({ success: false, ...getDemoData('social'), error: e.message });
  }
});

/* ============================================================
   方向三：客户行业热点 + 可爆选题
   POST /api/hot/client  body: { name, industry, traits, direction }
   ============================================================ */
app.post('/api/hot/client', async (req, res) => {
  const { fetchClientHot, getDemoData } = require('./api/_lib');
  try {
    const client = req.body || {};
    const result = await fetchClientHot(client);
    if (result.industryHot.length === 0 && result.topics.length === 0) {
      return res.json({ success: true, ...getDemoData('client') });
    }
    res.json({ success: true, ...result });
  } catch (e) {
    res.json({ success: false, ...getDemoData('client'), error: e.message });
  }
});

/* ============================================================
   方向四：个人数据调向分析
   POST /api/personal/analyze  body: { sport, read, recite, content }
   ============================================================ */
app.post('/api/personal/analyze', (req, res) => {
  const { analyzePersonalData } = require('./api/_lib');
  try {
    const data = req.body || {};
    const result = analyzePersonalData(data);
    res.json({ success: true, ...result });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

/* ============================================================
   兼容旧版 API
   ============================================================ */
app.get('/api/recommend', async (req, res) => {
  const { fetchReadingHot, getDemoData } = require('./api/_lib');
  try {
    const result = await fetchReadingHot([]);
    if (result.videos.length === 0) return res.json({ success: true, data: getDemoData('reading').videos, source: 'demo' });
    res.json({ success: true, data: result.videos, source: result.source });
  } catch (e) {
    res.json({ success: false, data: getDemoData('reading').videos, source: 'demo', error: e.message });
  }
});

app.get('/api/hot', async (req, res) => {
  const { fetchSocialHot, getDemoData } = require('./api/_lib');
  try {
    const result = await fetchSocialHot();
    if (result.hot.length === 0) return res.json({ success: true, data: getDemoData('hot'), source: 'demo' });
    res.json({ success: true, data: result.hot, source: result.source });
  } catch (e) {
    res.json({ success: false, data: getDemoData('hot'), source: 'demo', error: e.message });
  }
});

app.get('/api/search', async (req, res) => {
  const { fetchBilibiliSearch } = require('./api/_lib');
  try {
    const keyword = req.query.keyword || '';
    if (!keyword) return res.json({ success: false, data: [], error: '缺少关键词' });
    const results = await fetchBilibiliSearch(keyword);
    res.json({ success: true, data: results, source: 'bilibili' });
  } catch (e) {
    res.json({ success: false, data: [], error: e.message });
  }
});

app.get('/api/videos/popular', async (req, res) => {
  const { fetchBilibiliHot, getDemoData } = require('./api/_lib');
  try {
    const results = await fetchBilibiliHot();
    if (results.length === 0) return res.json({ success: true, data: getDemoData('reading').videos, source: 'demo' });
    res.json({ success: true, data: results, source: 'bilibili' });
  } catch (e) {
    res.json({ success: false, data: getDemoData('reading').videos, source: 'demo', error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`寂寥工作台运行中 → http://localhost:${PORT}`);
  console.log(`手机版 → http://localhost:${PORT}/mobile`);
  console.log(`电脑版 → http://localhost:${PORT}/desktop`);
});
