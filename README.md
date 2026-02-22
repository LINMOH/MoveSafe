# MoveSafe — 智能运动环境评估与体育信息服务平台

## 体育新闻（新华社爬取）

新闻数据来自 [新华社体育](https://www.news.cn/sports/)。需先启动爬虫服务：

```bash
# 终端 1：启动新闻爬虫服务
bun run server

# 终端 2：启动前端
bun run dev
```

爬虫服务默认运行于 `http://localhost:3001`，Vite 会将 `/api` 请求代理到该服务。若爬虫未启动，前端将使用本地 JSON 缓存作为备用数据。

## 和风天气（基础天气服务）

环境评估模块支持通过和风天气 API 自动填充温度、湿度、天气状况。需配置环境变量：

1. 复制 `.env.example` 为 `.env`
2. 设置 `QWEATHER_API_KEY`（在 [和风天气控制台](https://console.qweather.com) 创建项目获取）
3. 设置 `QWEATHER_API_HOST`（在 [控制台-设置](https://console.qweather.com/setting) 查看你的 API Host，格式如 `abc123.def.qweatherapi.com`）

若使用旧版公共域名，可尝试 `QWEATHER_API_HOST=devapi.qweather.com`（2026 年起可能逐步停用）。