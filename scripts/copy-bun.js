import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 获取bun可执行文件路径
function findBunExecutable() {
  const isWin = process.platform === 'win32'
  const bunExeName = isWin ? 'bun.exe' : 'bun'
  
  // 尝试从环境变量中查找
  const possiblePaths = []
  
  // 1. 从BUN_INSTALL环境变量
  if (process.env.BUN_INSTALL) {
    possiblePaths.push(path.join(process.env.BUN_INSTALL, 'bin', bunExeName))
  }
  
  // 2. 从用户目录
  if (process.env.USERPROFILE) {
    possiblePaths.push(path.join(process.env.USERPROFILE, '.bun', 'bin', bunExeName))
  }
  
  // 3. 从PATH中查找
  if (process.env.PATH) {
    const pathDirs = process.env.PATH.split(path.delimiter)
    for (const dir of pathDirs) {
      possiblePaths.push(path.join(dir, bunExeName))
    }
  }
  
  // 检查每个可能的路径
  for (const possiblePath of possiblePaths) {
    try {
      if (fs.existsSync(possiblePath)) {
        console.log(`Found bun at: ${possiblePath}`)
        return possiblePath
      }
    } catch (err) {
      // 忽略错误
    }
  }
  
  return null
}

// 复制bun可执行文件
async function copyBunExecutable() {
  const sourcePath = findBunExecutable()
  if (!sourcePath) {
    console.error('Could not find bun executable')
    process.exit(1)
  }
  
  const targetDir = path.join(__dirname, '..', 'node_modules', 'bun', 'bin')
  const targetPath = path.join(targetDir, path.basename(sourcePath))
  
  // 创建目标目录
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true })
  }
  
  try {
    // 复制文件
    fs.copyFileSync(sourcePath, targetPath)
    console.log(`Copied bun from ${sourcePath} to ${targetPath}`)
    
    // 在Windows上，可能需要复制bun.dll
    if (process.platform === 'win32') {
      const sourceDir = path.dirname(sourcePath)
      const dllPath = path.join(sourceDir, 'bun.dll')
      if (fs.existsSync(dllPath)) {
        const targetDllPath = path.join(targetDir, 'bun.dll')
        fs.copyFileSync(dllPath, targetDllPath)
        console.log(`Copied bun.dll to ${targetDllPath}`)
      }
    }
    
    return true
  } catch (err) {
    console.error('Error copying bun executable:', err.message)
    return false
  }
}

// 主函数
async function main() {
  console.log('Copying bun executable for packaging...')
  const success = await copyBunExecutable()
  if (success) {
    console.log('Bun executable copied successfully')
    process.exit(0)
  } else {
    console.error('Failed to copy bun executable')
    process.exit(1)
  }
}

main().catch(err => {
  console.error('Unexpected error:', err)
  process.exit(1)
})