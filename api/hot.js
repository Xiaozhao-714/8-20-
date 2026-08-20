const { fetchBilibiliHot, fetchZhihuHot, fetchWeiboHot, getDemoData } = require('./_lib');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const [bilibili, zhihu, weibo] = await Promise.all([
      fetchBilibiliHot(),
      fetchZhihuHot(),
      fetchWeiboHot()
    ]);

    let allResults = [...bilibili, ...zhihu, ...weibo];
    if (allResults.length === 0) {
      allResults = getDemoData('hot');
    }

    res.json({ success: true, data: allResults, source: allResults[0]?.source || 'demo' });
  } catch (e) {
    res.json({ success: false, data: getDemoData('hot'), source: 'demo', error: e.message });
  }
};
