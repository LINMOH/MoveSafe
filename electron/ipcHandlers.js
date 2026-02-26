import { ipcMain } from 'electron';
import * as cheerio from 'cheerio';

const QWEATHER_HOST = process.env.QWEATHER_API_HOST || 'jj5b65qd45.re.qweatherapi.com';
const QWEATHER_API_KEY = process.env.QWEATHER_API_KEY;

const SOURCE_URL = 'https://www.news.cn/sports/news.htm';
const BASE_URL = 'https://www.news.cn';
const DEFAULT_LOCATION_ID = '101120802';

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

async function qweatherFetch(pathname, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const url = `https://${QWEATHER_HOST}${pathname}?${qs}`;
  let headers = {};

  if (QWEATHER_API_KEY) {
    params.key = QWEATHER_API_KEY;
    const qsWithKey = new URLSearchParams(params).toString();
    const urlWithKey = `https://${QWEATHER_HOST}${pathname}?${qsWithKey}`;
    const res = await fetch(urlWithKey);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function fetchNewsList() {
  const res = await fetch(SOURCE_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
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

function setupIpcHandlers() {
  ipcMain.handle('get-news', async () => {
    try {
      return await fetchNewsList();
    } catch (err) {
      console.error('get-news error:', err.message);
      throw err;
    }
  });

  ipcMain.handle('get-news-article', async (event, url) => {
    try {
      if (!url || !url.includes('news.cn')) {
        throw new Error('无效的URL');
      }
      const content = await fetchArticleContent(url);
      return { content };
    } catch (err) {
      console.error('get-news-article error:', err.message);
      throw err;
    }
  });

  ipcMain.handle('search-city', async (event, location) => {
    try {
      if (!location || !location.trim()) {
        throw new Error('缺少 location 参数');
      }
      const data = await qweatherFetch('/geo/v2/city/lookup', { location, number: 10, range: 'cn' });
      if (data.code !== '200' || !data.location?.length) {
        return { code: data.code, location: [] };
      }
      return data;
    } catch (err) {
      console.error('search-city error:', err.message);
      throw err;
    }
  });

  ipcMain.handle('get-weather-now', async (event, location) => {
    try {
      if (!location || !location.trim()) {
        throw new Error('缺少 location 参数');
      }
      const data = await qweatherFetch('/v7/weather/now', { location });
      if (data.code !== '200' || !data.now) {
        throw new Error(data.code || '获取天气失败');
      }
      const now = data.now;
      return {
        temp: parseInt(now.temp, 10) || 0,
        humidity: parseInt(now.humidity, 10) || 0,
        weatherText: now.text,
        weatherCondition: mapWeatherTextToCondition(now.text),
        windScale: now.windScale,
        obsTime: now.obsTime
      };
    } catch (err) {
      console.error('get-weather-now error:', err.message);
      throw err;
    }
  });

  ipcMain.handle('get-weather-default', async () => {
    try {
      const data = await qweatherFetch('/v7/weather/now', { location: DEFAULT_LOCATION_ID });
      if (data.code !== '200' || !data.now) {
        throw new Error(data.code || '获取天气失败');
      }
      const now = data.now;
      return {
        locationId: DEFAULT_LOCATION_ID,
        cityName: '平阴',
        adm: '济南',
        temp: parseInt(now.temp, 10) || 0,
        humidity: parseInt(now.humidity, 10) || 0,
        weatherText: now.text,
        weatherCondition: mapWeatherTextToCondition(now.text),
        windScale: now.windScale,
        obsTime: now.obsTime
      };
    } catch (err) {
      console.error('get-weather-default error:', err.message);
      throw err;
    }
  });
}

export { setupIpcHandlers };
