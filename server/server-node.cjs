/**
 * MoveSafe 后端服务 (Node.js 兼容版本)
 * - 新华社体育新闻爬虫
 * - 和风天气 API 代理（JWT 认证）
 */

require('dotenv').config();
const express = require('express');
const cheerio = require('cheerio');
const { SignJWT, importPKCS8 } = require('jose');
const fetch = require('node-fetch');

const CORS_ORIGIN = true;
const QWEATHER_HOST = process.env.QWEATHER_API_HOST || 'jj5b65qd45.re.qweatherapi.com';
const QWEATHER_PRIVATE_KEY = process.env.QWEATHER_PRIVATE_KEY;
const QWEATHER_KEY_ID = process.env.QWEATHER_KEY_ID;
const QWEATHER_PROJECT_ID = process.env.QWEATHER_PROJECT_ID;
const QWEATHER_API_KEY = process.env.QWEATHER_API_KEY;

const SOURCE_URL = 'https://www.news.cn/sports/news.htm';
const BASE_URL = 'https://www.news.cn';

// 默认城市：山东济南平阴
const DEFAULT_LOCATION_ID = '101120802';
const DEFAULT_CITY_NAME = '平阴';
const DEFAULT_CITY_ADM = '济南';

console.log('QWeather Host:', QWEATHER_HOST);
console.log('Key ID:', QWEATHER_KEY_ID);
console.log('Project ID:', QWEATHER_PROJECT_ID);
console.log('Private Key loaded:', !!QWEATHER_PRIVATE_KEY);

async function generateJWT() {
  const privateKey = await importPKCS8(QWEATHER_PRIVATE_KEY, 'EdDSA');
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ sub: QWEATHER_PROJECT_ID })
    .setProtectedHeader({ alg: 'EdDSA', kid: QWEATHER_KEY_ID })
    .setIssuedAt(now - 30)
    .setExpirationTime(now + 900)
    .sign(privateKey);
}

async function qweatherFetch(path, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const url = `https://${QWEATHER_HOST}${path}?${qs}`;
  let headers = {};

  if (QWEATHER_API_KEY) {
    // 使用 API Key 认证
    params.key = QWEATHER_API_KEY;
    const qsWithKey = new URLSearchParams(params).toString();
    const urlWithKey = `https://${QWEATHER_HOST}${path}?${qsWithKey}`;
    const res = await fetch(urlWithKey);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } else {
    // 使用 JWT 认证
    if (!QWEATHER_PRIVATE_KEY) throw new Error('未配置 QWEATHER_PRIVATE_KEY 或 QWEATHER_API_KEY');
    const token = await generateJWT();
    headers = {
      'Authorization': `Bearer ${token}`
    };
  }

  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function inferCategory(title) {
  if (title.startsWith('冬奥会') || title.includes('冬奥')) return '冬奥会';
  if (title.startsWith('足球') || title.includes('西甲') || title.includes('英超') || title.includes('意甲') || title.includes('德甲')) return '足球';
  if (title.includes('篮球') || title.includes('NBA')) return '篮球';
  if (title.includes('乒乓球') || title.includes('WTT')) return '乒乓球';
  if (title.includes('马拉松') || title.includes('跑步')) return '跑步';
  if (title.includes('全民健身') || title.includes('健身')) return '全民健身';
  if (title.includes('围棋')) return '围棋';
  if (title.includes('冰雪') || title.includes('滑雪') || title.includes('滑冰')) return '冰雪运动';
  if (title.includes('电竞') || title.includes('KPL') || title.includes('DOTA')) return '电竞';
  if (title.includes('排球') || title.includes('村排')) return '排球';
  return '综合体育';
}

async function fetchNewsList() {
  const res = await fetch(SOURCE_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'zh-CN,zh;q=0.9'
    }
  });
  const html = await res.text();
  const $ = cheerio.load(html);

  const items = [];
  const seen = new Set();

  $('a[href*="/sports/"][href*="c.html"]').each((_, el) => {
    const $a = $(el);
    const href = $a.attr('href');
    let title = $a.text().trim();
    if (!href || !title || title.length < 4) return;

    const url = href.startsWith('http') ? href : new URL(href, BASE_URL).href;
    if (seen.has(url)) return;
    seen.add(url);

    let date = '';
    const parent = $a.parent();
    const nextText = parent.text() || '';
    const dateMatch = nextText.match(/(\d{4})-(\d{2})-(\d{2})\s*(\d{2}):(\d{2})/);
    if (dateMatch) {
      date = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
    } else {
      const pathMatch = href.match(/\/(\d{4})(\d{2})(\d{2})\//);
      if (pathMatch) date = `${pathMatch[1]}-${pathMatch[2]}-${pathMatch[3]}`;
    }

    items.push({
      id: items.length + 1,
      title,
      url,
      date: date || new Date().toISOString().slice(0, 10),
      category: inferCategory(title),
      content: '',
      source: '新华社'
    });
  });

  return items.slice(0, 30);
}

async function fetchArticleContent(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html'
      }
    });
    const html = await res.text();
    const $ = cheerio.load(html);
    const paragraphs = [];
    $('div#p-detail p, .article p, .content p').each((_, el) => {
      const text = $(el).text().trim();
      if (text && text.length > 10 && !text.startsWith('【')) {
        paragraphs.push(text);
      }
    });
    return paragraphs.join('\n\n') || $('meta[name="description"]').attr('content') || '';
  } catch {
    return '';
  }
}

function mapWeatherTextToCondition(text) {
  const t = (text || '').toLowerCase();
  if (t.includes('晴') && !t.includes('多云')) return 'sunny';
  if (t.includes('多云')) return 'cloudy';
  if (t.includes('阴')) return 'partlyCloudy';
  if (t.includes('小雨') || t === '雨') return 'lightRain';
  if (t.includes('中雨')) return 'moderateRain';
  if (t.includes('大雨') || t.includes('暴雨')) return 'heavyRain';
  if (t.includes('雷')) return 'thunderstorm';
  if (t.includes('雪')) return 'snow';
  if (t.includes('雾') || t.includes('霾')) return 'fog';
  if (t.includes('风')) return 'windy';
  return 'cloudy';
}

const app = express();
app.use(express.json());

if (CORS_ORIGIN) {
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    next();
  });
}

app.get('/api/news', async (req, res) => {
  try {
    const news = await fetchNewsList();
    res.json(news);
  } catch (err) {
    console.error('Scrape error:', err.message);
    res.status(500).json({ error: '获取新闻失败', message: err.message });
  }
});

// 默认城市天气（平阴）
app.get('/api/weather/default', async (req, res) => {
  try {
    const data = await qweatherFetch('/v7/weather/now', { location: DEFAULT_LOCATION_ID });
    if (data.code !== '200' || !data.now) {
      return res.status(400).json({ error: data.code || '获取天气失败' });
    }
    const now = data.now;
    res.json({
      locationId: DEFAULT_LOCATION_ID,
      cityName: DEFAULT_CITY_NAME,
      adm: DEFAULT_CITY_ADM,
      temp: parseInt(now.temp, 10) || 0,
      humidity: parseInt(now.humidity, 10) || 0,
      weatherText: now.text,
      weatherCondition: mapWeatherTextToCondition(now.text),
      windScale: now.windScale,
      obsTime: now.obsTime
    });
  } catch (err) {
    console.error('QWeather default error:', err.message);
    res.status(500).json({ error: '获取默认天气失败', message: err.message });
  }
});

// 城市搜索
app.get('/api/weather/city', async (req, res) => {
  const location = req.query.location?.trim();
  if (!location) return res.status(400).json({ error: '缺少 location 参数' });
  try {
    const data = await qweatherFetch('/geo/v2/city/lookup', { location, number: 10, range: 'cn' });
    if (data.code !== '200' || !data.location?.length) {
      return res.json({ code: data.code, location: [] });
    }
    res.json(data);
  } catch (err) {
    console.error('QWeather city error:', err.message);
    res.status(500).json({ error: '城市搜索失败', message: err.message });
  }
});

// 实时天气
app.get('/api/weather/now', async (req, res) => {
  const location = req.query.location?.trim();
  if (!location) return res.status(400).json({ error: '缺少 location 参数' });
  try {
    const data = await qweatherFetch('/v7/weather/now', { location });
    if (data.code !== '200' || !data.now) {
      return res.status(400).json({ error: data.code || '获取天气失败' });
    }
    const now = data.now;
    res.json({
      temp: parseInt(now.temp, 10) || 0,
      humidity: parseInt(now.humidity, 10) || 0,
      weatherText: now.text,
      weatherCondition: mapWeatherTextToCondition(now.text),
      windScale: now.windScale,
      obsTime: now.obsTime
    });
  } catch (err) {
    console.error('QWeather now error:', err.message);
    res.status(500).json({ error: '获取天气失败', message: err.message });
  }
});

app.get('/api/news/article', async (req, res) => {
  const url = req.query.url;
  if (!url || !url.includes('news.cn')) {
    return res.status(400).json({ error: '无效的URL' });
  }
  try {
    const content = await fetchArticleContent(url);
    res.json({ content });
  } catch (err) {
    res.status(500).json({ error: '获取正文失败' });
  }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`MoveSafe 新闻爬虫服务 (Node.js): http://localhost:${PORT}`);
});