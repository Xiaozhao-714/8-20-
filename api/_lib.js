const fetch = require('node-fetch');

/* ============================================================
   全局配置
   ============================================================ */
const CONFIG = {
  // 读书相关搜索关键词（默认，前端可传书名覆盖）
  readingKeywords: ['读书分享', '书评', '阅读方法', '好书推荐', '知识管理'],
  // 社交平台入口
  socialPlatforms: [
    { name: '抖音', url: 'https://www.douyin.com', icon: 'video' },
    { name: '视频号', url: 'https://channels.weixin.qq.com', icon: 'play' },
    { name: '小红书', url: 'https://www.xiaohongshu.com', icon: 'book-open' },
    { name: '微博', url: 'https://weibo.com', icon: 'message' },
    { name: 'B站', url: 'https://www.bilibili.com', icon: 'tv' },
  ],
  bilibili: { cookie: '' }
};

/* ============================================================
   B站 — 搜索 + 热门排行
   ============================================================ */
async function fetchBilibiliSearch(keyword, page = 1) {
  const url = `https://api.bilibili.com/x/web-interface/search/type?search_type=video&keyword=${encodeURIComponent(keyword)}&page=${page}`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Cookie': CONFIG.bilibili.cookie } });
    const data = await res.json();
    if (data.code === 0 && data.data && data.data.result) {
      return data.data.result.slice(0, 10).map(v => ({
        title: (v.title || '').replace(/<[^>]+>/g, ''),
        author: v.author,
        cover: v.pic ? (v.pic.startsWith('http') ? v.pic : 'https:' + v.pic) : '',
        url: `https://www.bilibili.com/video/${v.bvid}`,
        play: v.play,
        danmaku: v.video_review,
        description: v.description,
        duration: v.duration,
        source: 'bilibili',
        category: 'video'
      }));
    }
  } catch (e) {}
  return [];
}

async function fetchBilibiliHot() {
  const url = 'https://api.bilibili.com/x/web-interface/ranking/v2?rid=0&day=3';
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const data = await res.json();
    if (data.code === 0 && data.data && data.data.list) {
      return data.data.list.slice(0, 20).map(v => ({
        title: v.title,
        author: v.owner ? v.owner.name : '',
        cover: v.pic ? (v.pic.startsWith('http') ? v.pic : 'https:' + v.pic) : '',
        url: `https://www.bilibili.com/video/${v.bvid}`,
        play: v.stat ? v.stat.view : 0,
        danmaku: v.stat ? v.stat.danmaku : 0,
        description: v.desc,
        duration: v.duration,
        source: 'bilibili',
        category: 'video'
      }));
    }
  } catch (e) {}
  return [];
}

/* ============================================================
   知乎 — 热榜
   ============================================================ */
async function fetchZhihuHot() {
  const url = 'https://www.zhihu.com/api/v3/feed/topstory/hot-lists/total?limit=10';
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const data = await res.json();
    if (data && data.data) {
      return data.data.slice(0, 10).map(t => ({
        title: t.target ? t.target.title : '',
        url: t.target ? ('https://www.zhihu.com/question/' + t.target.id) : '',
        excerpt: t.target ? (t.target.excerpt || '') : '',
        hot: t.detail_text || '',
        source: 'zhihu',
        category: 'article'
      }));
    }
  } catch (e) {}
  return [];
}

/* ============================================================
   微博 — 热搜
   ============================================================ */
async function fetchWeiboHot() {
  const url = 'https://weibo.com/ajax/side/hotSearch';
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const data = await res.json();
    if (data && data.data && data.data.realtime) {
      return data.data.realtime.slice(0, 15).map((t, i) => ({
        title: t.word,
        url: `https://s.weibo.com/weibo?q=${encodeURIComponent(t.word)}`,
        hot: t.num,
        rank: i + 1,
        source: 'weibo',
        category: 'topic'
      }));
    }
  } catch (e) {}
  return [];
}

/* ============================================================
   方向一：读书相关热点
   前端传入 books（书名数组），据此搜索B站+知乎相关内容
   ============================================================ */
async function fetchReadingHot(books = []) {
  const keywords = books.length > 0
    ? books.flatMap(b => [b + ' 书评', b + ' 解读', b + ' 读书笔记'])
    : CONFIG.readingKeywords;

  let allResults = [];
  // B站搜索（最多3个关键词）
  for (const kw of keywords.slice(0, 4)) {
    const results = await fetchBilibiliSearch(kw);
    allResults = allResults.concat(results);
    if (allResults.length >= 15) break;
  }

  // 知乎热榜（与读书相关的）
  const zhihu = await fetchZhihuHot();
  const readingZhihu = zhihu.filter(t =>
    /书|读|学|知|思|成长|认知/.test(t.title)
  );
  allResults = allResults.concat(readingZhihu);

  // 生成读书选题建议
  const topics = generateReadingTopics(books);

  return {
    videos: allResults.slice(0, 15),
    topics: topics,
    source: allResults.length > 0 ? 'live' : 'demo'
  };
}

/* 读书选题生成器 */
function generateReadingTopics(books = []) {
  const templates = [
    book => `${book}：这 3 个观点颠覆了我的认知`,
    book => `读完《${book}》，我做了一个 30 天改变计划`,
    book => `${book} 核心方法论拆解｜普通人也能用`,
    book => `为什么劝你读《${book}》？说 5 个理由`,
    book => `${book} 读书笔记｜高效阅读法实战`,
  ];
  if (books.length === 0) books = ['认知觉醒', '原子习惯'];
  return books.flatMap(b => templates.map(t => ({ title: t(b), type: 'reading' }))).slice(0, 8);
}

/* ============================================================
   方向二：社交平台热点选题
   根据用户最近偏好的平台，出相关选题
   ============================================================ */
async function fetchSocialHot(platforms = []) {
  const weibo = await fetchWeiboHot();
  const bilibili = await fetchBilibiliHot();
  const zhihu = await fetchZhihuHot();

  // 合并所有热点，按平台标注
  let allHot = [
    ...weibo.map(h => ({ ...h, platform: '微博' })),
    ...bilibili.map(h => ({ ...h, platform: 'B站' })),
    ...zhihu.map(h => ({ ...h, platform: '知乎' })),
  ];

  // 根据热点生成选题建议
  const topics = generateSocialTopics(weibo, zhihu, bilibili);

  return {
    hot: allHot.slice(0, 20),
    topics: topics,
    platforms: CONFIG.socialPlatforms,
    source: allHot.length > 0 ? 'live' : 'demo'
  };
}

/* 社交选题生成器 */
function generateSocialTopics(weibo, zhihu, bilibili) {
  let topics = [];
  // 微博热搜 → 选题
  weibo.slice(0, 3).forEach(h => {
    topics.push({ title: `蹭热点：${h.title}，我的看法是…`, type: 'hot', platform: '微博' });
  });
  // 知乎 → 选题
  zhihu.slice(0, 3).forEach(h => {
    topics.push({ title: `深度解读：${h.title}`, type: 'knowledge', platform: '知乎' });
  });
  // B站热门 → 选题
  bilibili.slice(0, 3).forEach(h => {
    topics.push({ title: `同题拆解：${h.title}`, type: 'video', platform: 'B站' });
  });
  return topics;
}

/* ============================================================
   方向三：客户行业热点 + 可爆选题
   前端传入 client = { name, industry, traits, direction }
   ============================================================ */
async function fetchClientHot(client = {}) {
  const { name, industry, traits, direction } = client;
  // 根据客户行业生成搜索关键词
  const keywords = [];
  if (industry) {
    keywords.push(industry + ' 行业趋势');
    keywords.push(industry + ' 热点');
    keywords.push(industry + ' 爆款案例');
  }
  if (direction) keywords.push(direction + ' 方法论');
  if (traits) keywords.push(traits + ' 人设打造');

  let searchResults = [];
  for (const kw of keywords.slice(0, 3)) {
    const results = await fetchBilibiliSearch(kw);
    searchResults = searchResults.concat(results);
    if (searchResults.length >= 10) break;
  }

  // 微博/知乎中与行业相关的
  const weibo = await fetchWeiboHot();
  const industryWeibo = industry
    ? weibo.filter(h => new RegExp(industry + '|' + (traits || '')).test(h.title))
    : [];

  // 生成可爆选题
  const topics = generateClientTopics(client);

  return {
    industryHot: searchResults.slice(0, 10),
    relatedTopics: industryWeibo,
    topics: topics,
    source: searchResults.length > 0 ? 'live' : 'demo'
  };
}

/* 客户可爆选题生成器 */
function generateClientTopics(client = {}) {
  const { name, industry, traits, direction } = client;
  if (!name) return [];

  const industryStr = industry || '该行业';
  const traitStr = traits || '专业';
  const dirStr = direction || '个人品牌';

  return [
    `${name}：${industryStr}里的${traitStr}代表，凭什么出圈？`,
    `拆解${name}的${dirStr}路径，普通人能复制哪 3 步？`,
    `${industryStr}赛道要爆，${name}做对了什么？`,
    `${name}的${traitStr}人设怎么打造？5 个细节拆给你看`,
    `${industryStr}+${dirStr}=${name}：一个可复制的爆款公式`,
    `${name}案例拆解：${industryStr}人怎么用内容破圈？`,
    `为什么${name}能火？${traitStr}人设在${industryStr}的稀缺性`,
    `${dirStr}进阶：从${name}身上学到的 4 条内容心法`,
  ];
}

/* ============================================================
   方向四：个人数据汇总
   前端传入 personalData（运动/读书/背诵/运营的 localStorage 数据）
   后端据此生成调向建议
   ============================================================ */
function analyzePersonalData(data = {}) {
  const { sport = [], read = [], recite = [], content = [] } = data;
  const suggestions = [];

  // 运动分析
  const sportDone = sport.filter(s => s.current >= s.target).length;
  const sportTotal = sport.length;
  if (sportTotal > 0) {
    const sportRate = Math.round(sportDone / sportTotal * 100);
    if (sportRate < 50) {
      suggestions.push({ area: '运动', level: '需加强', text: `运动完成率 ${sportRate}%，建议每天固定时段运动，先从 15 分钟开始。` });
    } else if (sportRate < 80) {
      suggestions.push({ area: '运动', level: '稳步中', text: `运动完成率 ${sportRate}%，保持节奏，可尝试增加强度。` });
    } else {
      suggestions.push({ area: '运动', level: '优秀', text: `运动完成率 ${sportRate}%，状态很好，可挑战新目标。` });
    }
  }

  // 读书分析
  const readProgress = read.map(r => ({
    title: r.title,
    rate: r.target > 0 ? Math.round(r.current / r.target * 100) : 0
  }));
  const avgRead = readProgress.length > 0
    ? Math.round(readProgress.reduce((s, r) => s + r.rate, 0) / readProgress.length)
    : 0;
  if (avgRead < 30) {
    suggestions.push({ area: '读书', level: '起步期', text: `平均进度 ${avgRead}%，建议每天固定 30 分钟阅读时间。` });
  } else if (avgRead < 70) {
    suggestions.push({ area: '读书', level: '推进中', text: `平均进度 ${avgRead}%，注意做笔记，加深理解。` });
  } else {
    suggestions.push({ area: '读书', level: '即将完成', text: `平均进度 ${avgRead}%，准备复盘并选下一本。` });
  }

  // 背诵分析
  const reciteProgress = recite.map(r => ({
    title: r.title,
    rate: r.target > 0 ? Math.round(r.current / r.target * 100) : 0
  }));
  const avgRecite = reciteProgress.length > 0
    ? Math.round(reciteProgress.reduce((s, r) => s + r.rate, 0) / reciteProgress.length)
    : 0;
  if (avgRecite < 50) {
    suggestions.push({ area: '古诗背诵', level: '需加强', text: `背诵进度 ${avgRecite}%，建议每天晨读 10 分钟。` });
  } else {
    suggestions.push({ area: '古诗背诵', level: '稳步中', text: `背诵进度 ${avgRecite}%，可尝试录音回听检查。` });
  }

  // 内容运营分析
  const contentDone = content.filter(c => c.done).length;
  const contentTotal = content.length;
  if (contentTotal > 0) {
    const contentRate = Math.round(contentDone / contentTotal * 100);
    if (contentRate < 30) {
      suggestions.push({ area: '账号运营', level: '需加强', text: `内容完成率 ${contentRate}%，建议降低单篇难度，先保证更新频率。` });
    } else if (contentRate < 70) {
      suggestions.push({ area: '账号运营', level: '推进中', text: `内容完成率 ${contentRate}%，可关注数据反馈调整选题方向。` });
    } else {
      suggestions.push({ area: '账号运营', level: '优秀', text: `内容完成率 ${contentRate}%，保持产出节奏，尝试系列化内容。` });
    }
  }

  return {
    summary: {
      sport: { done: sportDone, total: sportTotal, rate: sportTotal > 0 ? Math.round(sportDone / sportTotal * 100) : 0 },
      reading: { avgProgress: avgRead, books: readProgress },
      recite: { avgProgress: avgRecite, items: reciteProgress },
      content: { done: contentDone, total: contentTotal, rate: contentTotal > 0 ? Math.round(contentDone / contentTotal * 100) : 0 },
    },
    suggestions: suggestions,
  };
}

/* ============================================================
   Demo 数据兜底
   ============================================================ */
function getDemoData(type) {
  const demo = {
    reading: {
      videos: [
        { title: '如何高效阅读一本书？3个方法让你读得更深', author: '读书达人', cover: '', url: 'https://www.bilibili.com', play: 120000, danmaku: 800, description: '分享高效阅读的方法和技巧', source: 'demo', category: 'video' },
        { title: '2024年必读的10本好书推荐', author: '书单君', cover: '', url: 'https://www.bilibili.com', play: 89000, danmaku: 500, description: '年度好书推荐清单', source: 'demo', category: 'video' },
        { title: '读书笔记怎么做？康奈尔笔记法详解', author: '学习方法论', cover: '', url: 'https://www.bilibili.com', play: 56000, danmaku: 300, description: '康奈尔笔记法在读书中的应用', source: 'demo', category: 'video' },
      ],
      topics: [
        { title: '《认知觉醒》：这 3 个观点颠覆了我的认知', type: 'reading' },
        { title: '读完《原子习惯》，我做了一个 30 天改变计划', type: 'reading' },
        { title: '高效阅读法拆解｜普通人也能用', type: 'reading' },
      ],
      source: 'demo'
    },
    social: {
      hot: [
        { title: '今日热点话题一', url: 'https://weibo.com', hot: 999999, source: 'demo', platform: '微博', category: 'topic' },
        { title: '科技行业最新动态', url: 'https://www.zhihu.com', excerpt: 'AI技术最新进展分析', source: 'demo', platform: '知乎', category: 'article' },
        { title: '热门视频盘点', url: 'https://www.bilibili.com', play: 200000, source: 'demo', platform: 'B站', category: 'video' },
      ],
      topics: [
        { title: '蹭热点：今日热门话题，我的看法是…', type: 'hot', platform: '微博' },
        { title: '深度解读：科技行业最新动态', type: 'knowledge', platform: '知乎' },
        { title: '同题拆解：热门视频盘点', type: 'video', platform: 'B站' },
      ],
      platforms: CONFIG.socialPlatforms,
      source: 'demo'
    },
    client: {
      industryHot: [
        { title: '行业趋势分析视频', author: '行业观察', cover: '', url: '', play: 50000, source: 'demo', category: 'video' },
      ],
      relatedTopics: [],
      topics: [
        { title: '客户案例：行业里的出圈代表，凭什么？', type: 'client' },
        { title: '拆解客户的个人品牌路径，普通人能复制哪 3 步？', type: 'client' },
      ],
      source: 'demo'
    },
    hot: [
      { title: '今日热点话题汇总', url: 'https://weibo.com', hot: 999999, source: 'demo', category: 'topic' },
      { title: '科技行业最新动态', url: 'https://www.zhihu.com', excerpt: 'AI技术最新进展分析', source: 'demo', category: 'article' },
      { title: '社会关注焦点事件', url: 'https://weibo.com', hot: 888888, source: 'demo', category: 'topic' }
    ]
  };
  return demo[type] || [];
}

module.exports = {
  CONFIG,
  fetchBilibiliSearch,
  fetchBilibiliHot,
  fetchZhihuHot,
  fetchWeiboHot,
  fetchReadingHot,
  fetchSocialHot,
  fetchClientHot,
  analyzePersonalData,
  getDemoData,
};
