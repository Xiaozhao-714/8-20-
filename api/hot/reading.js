// POST /api/hot/reading — 读书相关热点
const { fetchReadingHot, getDemoData } = require('../_lib');

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const books = (req.method === 'POST' ? (req.body||{}).books : (req.query.books||'').split(',').filter(Boolean)) || [];
    const result = await fetchReadingHot(books);
    if (result.videos.length === 0 && result.topics.length === 0) {
      return res.status(200).json({ success: true, ...getDemoData('reading') });
    }
    res.status(200).json({ success: true, ...result });
  } catch (e) {
    res.status(200).json({ success: false, ...getDemoData('reading'), error: e.message });
  }
};
