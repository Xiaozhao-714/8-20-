const { fetchBilibiliSearch } = require('./_lib');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const keyword = req.query.keyword || '';
    if (!keyword) {
      return res.json({ success: false, data: [], error: '缺少关键词' });
    }

    const results = await fetchBilibiliSearch(keyword);
    res.json({ success: true, data: results, source: results[0]?.source || 'bilibili' });
  } catch (e) {
    res.json({ success: false, data: [], error: e.message });
  }
};
