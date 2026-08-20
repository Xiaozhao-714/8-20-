// POST /api/personal/analyze — 个人数据调向分析
const { analyzePersonalData } = require('../_lib');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const data = req.method === 'POST' ? (req.body||{}) : req.query;
    const result = analyzePersonalData(data);
    res.status(200).json({ success: true, ...result });
  } catch (e) {
    res.status(200).json({ success: false, error: e.message });
  }
};
