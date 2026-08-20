// POST /api/hot/client — 客户行业热点 + 可爆选题
const { fetchClientHot, getDemoData } = require('../_lib');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const client = req.method === 'POST' ? (req.body||{}) : req.query;
    const result = await fetchClientHot(client);
    if (result.industryHot.length === 0 && result.topics.length === 0) {
      return res.status(200).json({ success: true, ...getDemoData('client') });
    }
    res.status(200).json({ success: true, ...result });
  } catch (e) {
    res.status(200).json({ success: false, ...getDemoData('client'), error: e.message });
  }
};
