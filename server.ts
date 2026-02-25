import { serve } from "bun";
import { exec } from "child_process";

const port = 3000;

// 启动 Web 服务器
serve({
  port,
  fetch(req) {
    const url = new URL(req.url);
    let path = url.pathname;
    if (path === "/") path = "/index.html";
    
    // 读取 dist 目录下的文件
    return new Response(Bun.file(`./dist${path}`));
  },
});

console.log(`服务已启动: http://localhost:${port}`);

// 自动为用户打开浏览器 (Windows 指令)
exec(`start http://localhost:${port}`);