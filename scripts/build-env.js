import { writeFileSync, readFileSync, existsSync } from 'fs';
import { parse } from 'dotenv';

if (!existsSync(".env")) {
  console.warn('[build:env] .env 文件不存在，跳过环境变量注入');
  process.exit(0);
}

const envConfig = parse(readFileSync(".env"));

const configContent = `// 此文件由 build:env 自动生成
export default ${JSON.stringify(envConfig, null, 2)};
`;

writeFileSync('electron/envConfig.js', configContent);
console.log('[build:env] 环境变量已注入到 envConfig.js');
