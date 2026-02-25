# MoveSafe

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Bun](https://img.shields.io/badge/Runtime-Bun-FFDF00)](https://bun.sh/)
[![Vue](https://img.shields.io/badge/Framework-Vue-4FC08D)](https://vuejs.org/)
[![Electron](https://img.shields.io/badge/Desktop-Electron-47848F)](https://electronjs.org/)

> 结合体育新闻爬虫与实时天气监控的集成化桌面服务系统

## 📋 Project Overview

MoveSafe 是一个创新的桌面应用程序，致力于为体育爱好者和健身人群提供全面的运动环境评估与体育资讯服务。通过集成新华社体育新闻爬虫和和风天气API，系统能够实时监控运动环境参数，为用户提供个性化的运动适宜度评估、安全建议，并聚合最新的体育资讯。

### 🎯 核心价值
- **科学评估**：基于环境科学数据提供量化运动适宜度评分
- **实时监控**：集成天气API实现环境参数的动态更新
- **资讯聚合**：自动爬取并分类体育新闻，提供一站式信息服务
- **桌面体验**：Electron封装的原生桌面应用，操作便捷

## 🏗️ Technical Architecture

### 为什么选择 Bun
Bun 是一个高性能的 JavaScript 运行时，相比传统 Node.js 具有显著优势：
- **原生性能**：内置原生 fetch API，无需额外依赖
- **快速启动**：冷启动速度比 Node.js 快 4-6 倍
- **兼容性**：完全兼容 Node.js API，支持现有生态
- **内置工具**：集成包管理器、测试运行器和打包工具

### 爬虫原理
系统使用 Cheerio 库解析新华社体育频道的 HTML 内容：
```javascript
// 核心爬虫逻辑示例
const $ = cheerio.load(html);
const articles = $('.news-list li').map((i, el) => ({
  title: $(el).find('h3').text(),
  url: $(el).find('a').attr('href'),
  category: classifyCategory($(el).find('h3').text())
})).get();
```

**内容分类算法**：
- 基于关键词匹配：足球、篮球、乒乓球、羽毛球等
- 支持多语言识别：中英文标题自动分类
- 动态标签：冬奥会、奥运会等时事专题

### 安全认证原理
采用 EdDSA (Ed25519) + JWT 的安全认证机制：

**JWT 签名流程**：
1. 使用 `jose` 库的 `importPKCS8` 加载 PEM 格式私钥
2. 生成包含 `kid` (Key ID) 的 JWT Header
3. 签名 Payload 包含时间戳 `iat` 和过期时间 `exp`
4. 发送带签名令牌的请求到和风天气API

```javascript
// JWT 生成示例
const privateKey = await importPKCS8(privateKeyPEM, 'EdDSA');
const jwt = await new SignJWT(payload)
  .setProtectedHeader({ alg: 'EdDSA', kid: keyId })
  .setIssuedAt()
  .setExpirationTime('1h')
  .sign(privateKey);
```

**安全优势**：
- 避免 API Key 明文传输
- 基于公钥加密的身份验证
- 支持令牌过期和撤销机制

## ⚙️ Environment Setup

### 必需环境变量
在项目根目录创建 `.env` 文件，配置以下变量：

```env
# 和风天气 API 配置
QWEATHER_API_HOST=your-api-host.qweatherapi.com
QWEATHER_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n你的私钥内容\n-----END PRIVATE KEY-----
QWEATHER_KEY_ID=your-key-id
QWEATHER_PROJECT_ID=your-project-id

# 服务器配置
PORT=3001
NODE_ENV=development
```

### PEM 格式私钥配置
1. 从和风天气控制台获取私钥
2. 保持完整的 PEM 格式，包括 `-----BEGIN PRIVATE KEY-----` 和 `-----END PRIVATE KEY-----`
3. 在 `.env` 文件中直接粘贴，注意转义换行符为 `\n`
4. 确保私钥内容不包含额外空格或换行

**示例**：
```env
QWEATHER_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMC4CAQAwBQYDK2VwBCIEI...\n-----END PRIVATE KEY-----
```

## 🚀 Installation & Usage

### 系统要求
- Bun 1.0+ 或 Node.js 18+
- Windows/macOS/Linux
- 现代浏览器支持

### 安装步骤

```bash
# 1. 克隆项目
git clone <repository-url>
cd movesafe

# 2. 安装依赖
bun install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件填入 API 配置
```

### 开发模式运行

```bash
# 启动后端服务 (新闻爬虫 + 天气代理)
bun run server

# 启动前端开发服务器
bun run dev

# 访问应用
# 前端: http://localhost:5173
# 后端API: http://localhost:3001
```

### 生产构建

```bash
# 构建前端应用
bun run build

# Electron 桌面应用打包
bun run electron:packager:win  # Windows
bun run electron:packager:mac  # macOS
bun run electron:packager:linux  # Linux
```

### 启动生产服务

```bash
# 启动后端服务器
bun server/scraper.js

# 或使用 PM2 进程管理
bun x pm2 start server/scraper.js --name movesafe
```

## 🔧 Troubleshooting

### 端口冲突 (3002 Port in use)
**问题描述**：启动服务时提示端口 3002 已被占用

**解决方案**：
```bash
# 检查端口占用
netstat -ano | findstr :3002

# 杀死占用进程 (Windows)
taskkill /PID <PID> /F

# 或修改服务器端口
# 在 .env 中设置 PORT=3003
```

### 和风天气 401 认证错误
**常见原因及解决方案**：

1. **时间戳校验失败**：
   - 确保系统时间准确
   - 检查服务器时区设置

2. **Key 不匹配**：
   - 验证 `QWEATHER_KEY_ID` 与私钥对应
   - 检查私钥 PEM 格式是否正确
   - 确认项目ID配置

3. **JWT 过期**：
   - 令牌默认1小时过期，检查令牌生成时间
   - 考虑增加过期时间或实现自动刷新

**调试命令**：
```bash
# 测试 API 连接
curl -H "Authorization: Bearer <your-jwt>" \
     "https://your-api-host.qweatherapi.com/v7/weather/now?location=101010100"
```

### Electron 打包下载慢
**解决方案**：
```bash
# 配置 npm 镜像源
npm config set registry https://registry.npmmirror.com

# 或使用 yarn
yarn config set registry https://registry.npmmirror.com

# 配置 electron-mirror (国内用户)
export ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
export ELECTRON_BUILDER_BINARIES_MIRROR="https://npmmirror.com/mirrors/electron-builder-binaries/"
```

## ✨ Features

### 🌡️ 运动环境评估
- [x] 多参数环境监测（温度、湿度、AQI、人流密度）
- [x] 智能评分算法（0-100分动态评估）
- [x] 风险等级分级（优秀/良好/不建议）
- [x] 个性化运动建议
- [x] 实时天气数据集成

### 📰 体育资讯聚合
- [x] 新华社体育新闻自动爬取
- [x] 智能内容分类（足球、篮球、冬奥等）
- [x] 新闻全文阅读
- [x] 本地缓存机制
- [x] 实时更新推送

### 💪 健康评估模块
- [x] 生理指标分析
- [x] 运动计划推荐
- [x] 安全阈值提醒
- [x] 健康风险预警

### 📊 仪表盘概览
- [x] 可视化数据展示
- [x] 综合评分仪表盘
- [x] 快捷功能入口
- [x] 系统状态监控

### 🖥️ 桌面应用特性
- [x] Electron 原生封装
- [x] 跨平台支持（Windows/macOS/Linux）
- [x] 系统托盘运行
- [x] 离线数据缓存

## 📐 项目原理图

### 系统架构流程
```
前端渲染层 (Vite + Vue)
    ↓ AJAX 请求
后端逻辑层 (Bun + Express)
├── 新闻引擎: 周期性抓取新华社 HTML，通过关键词算法自动贴标签
├── 安全引擎: 请求天气数据前，利用 importPKCS8 加载私钥，实时生成带 kid 的 JWT 令牌
└── 通信层: 解决跨域 (CORS) 限制，作为代理转发外部 API
    ↓ HTTP 请求
外部服务 (和风天气 API + 新华社)
```

### 完整架构图
```mermaid
graph TB
%% 核心样式定义
classDef frontend fill:#e3f2fd,stroke:#2196f3,stroke-width:2px,color:#0d47a1
classDef backend fill:#f3e5f5,stroke:#9c27b0,stroke-width:2px,color:#4a148c
classDef external fill:#fafafa,stroke:#558b2f,stroke-width:2px,stroke-dasharray: 5 5,color:#2e7d32
classDef database fill:#fff3e0,stroke:#ff9800,stroke-width:2px,color:#e65100
classDef build fill:#f5f5f5,stroke:#9e9e9e,stroke-dasharray: 2 2,color:#616161

%% ==================== 用户层 ====================
User((👤 用户/浏览器)) -- "HTTPS / WS" --> SPA

%% ==================== 前端应用层 (Vue 3) ====================
subgraph SPA [🚀 前端应用 - Vue 3 + Vite]
    direction TB
    subgraph UI_Layer [界面显示]
        Dashboard[📊 仪表盘]
        Assess[🌡️ 环境评估]
        Health[💪 健康评估]
        News[📰 体育新闻]
    end
    
    subgraph Logic_Layer [核心逻辑]
        Engine{⚙️ 评估引擎}
        Services[📞 API 服务层]
    end

    subgraph Store [数据状态]
        LocalJSON[(📄 本地配置)]
    end
end

%% ==================== 后端服务层 (Bun) ====================
subgraph Backend [⚡ 后端服务 - Bun + Express]
    direction TB
    API_Gate[🛡️ API 网关 / 中间件]
    
    subgraph Core_Services [业务逻辑]
        Scraper[🕷️ 新闻爬虫引擎]
        Weather[☁️ 天气代理服务]
        Auth[🔐 EdDSA 安全认证]
    end

    subgraph Processing [数据处理]
        Transformer[🔧 数据清洗]
        Cache[💾 内存缓存]
    end
end

%% ==================== 外部与持久化 ====================
subgraph External [🌐 外部云服务]
    QWeather[☁️ 和风天气 API]
    NewsSource[📰 新华社/媒体源]
end

subgraph Storage [📦 数据持久化]
    JSON_DB[(📁 JSON 数据库)]
    Fallback[(⚠️ 降级静态数据)]
end

%% ==================== 核心链路 ====================
%% 前后端交互
Services -- "Axios" --> API_Gate
API_Gate --> Core_Services

%% 服务扩展
Scraper -- "Fetch" --> NewsSource
Weather -- "JWT Request" --> QWeather

%% 数据流转
Core_Services --> Processing
Processing --> JSON_DB
JSON_DB -.->|失败回滚| Fallback
LocalJSON --> Engine
Engine <--> Health

%% 样式应用
class SPA,UI_Layer,Logic_Layer,Dashboard,Assess,Health,News,Engine,Services frontend
class Backend,API_Gate,Core_Services,Processing,Scraper,Weather,Auth,Transformer,Cache backend
class External,QWeather,NewsSource external
class Storage,JSON_DB,Fallback,LocalJSON database
```

## 🤝 Contributing

欢迎提交 Issue 和 Pull Request！

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 License

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 Acknowledgments

- [新华社](https://www.news.cn/) - 体育新闻数据源
- [和风天气](https://www.qweather.com/) - 天气API服务
- [Bun](https://bun.sh/) - 高性能 JavaScript 运行时
- [Vue.js](https://vuejs.org/) - 渐进式前端框架
- [Electron](https://electronjs.org/) - 跨平台桌面应用框架

---

**MoveSafe - 让每一次运动都更安全、更科学** 🏃‍♂️