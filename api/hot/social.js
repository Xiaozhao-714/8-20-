// GET /api/hot/social — 社交平台热点选题
const { fetchSocialHot, getDemoData } = require('../_lib');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const result = await fetchSocialHot();
    if (result.hot.length === 0) {
      return res.status(200).json({ success: true, ...getDemoData('social') });
    }
    res.status(200).json({ success: true, ...result });
  } catch (e) {
    res.status(200).json({ success: false, ...getDemoData('social'), error: e.message });
  }
};
