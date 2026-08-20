const { CONFIG, fetchBilibiliSearch, getDemoData } = require('./_lib');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const type = req.query.type || 'reading';
    const keywords = type === 'reading' ? CONFIG.readingKeywords : CONFIG.workKeywords;
    let allResults = [];

    for (const kw of keywords.slice(0, 3)) {
      const results = await fetchBilibiliSearch(kw);
      allResults = allResults.concat(results);
      if (allResults.length >= 20) break;
    }

    if (allResults.length === 0) {
      allResults = getDemoData(type);
    }

    res.json({ success: true, data: allResults, source: allResults[0]?.source || 'demo' });
  } catch (e) {
    res.json({ success: false, data: getDemoData(req.query.type || 'reading'), source: 'demo', error: e.message });
  }
};
