const { fetchBilibiliHot, getDemoData } = require('../_lib');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const results = await fetchBilibiliHot();
    if (results.length === 0) {
      return res.json({ success: true, data: getDemoData('reading'), source: 'demo' });
    }
    res.json({ success: true, data: results, source: 'bilibili' });
  } catch (e) {
    res.json({ success: false, data: getDemoData('reading'), source: 'demo', error: e.message });
  }
};
