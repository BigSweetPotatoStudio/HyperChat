#!/usr/bin/env node
import { execSync } from 'child_process';
import { copyFileSync, mkdirSync, existsSync, readFileSync, writeFileSync, rmSync, cpSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

// 辅助函数：执行命令
function exec(command, options = {}) {
  console.log(`\n📦 执行: ${command}`);
  try {
    execSync(command, { stdio: 'inherit', cwd: rootDir, ...options });
  } catch (error) {
    console.error(`❌ 命令失败: ${command}`);
    process.exit(1);
  }
}

// 辅助函数：确保目录存在
function ensureDir(dir) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

// 辅助函数：读取和写入 JSON
function readJSON(path) {
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function writeJSON(path, data) {
  writeFileSync(path, JSON.stringify(data, null, 2));
}

// 获取命令行参数
const args = process.argv.slice(2);
const command = args[0];

// 构建任务
const tasks = {
  // 清理所有构建产物
  clean() {
    console.log('🧹 清理构建产物...');
    const dirs = [
      'packages/web/build',
      'packages/web/dist',
      'packages/core/dist',
      'packages/core/web-build',
      'packages/cli/dist',
      'packages/electron/dist',
      'packages/electron/web-build'
    ];

    dirs.forEach(dir => {
      const path = join(rootDir, dir);
      if (existsSync(path)) {
        rmSync(path, { recursive: true, force: true });
        console.log(`  ✅ 已删除: ${dir}`);
      }
    });
  },

  // 构建 Web 前端
  async buildWeb() {
    console.log('\n🌐 构建 Web 前端...');
    exec('npm run build', { cwd: join(rootDir, 'packages/web') });
  },

  // 构建 Core（Node.js 核心）
  async buildCore() {
    console.log('\n🎯 构建 Core 包...');
    const coreDir = join(rootDir, 'packages/core');
    const distDir = join(coreDir, 'dist');

    // 创建输出目录
    ensureDir(distDir);

    // 使用 TypeScript 编译
    exec('npm run build', { cwd: coreDir });

    // 复制必要文件
    const filesToCopy = ['package.json', 'README.md'];
    filesToCopy.forEach(file => {
      const src = join(rootDir, file);
      const dest = join(distDir, file);
      if (existsSync(src)) {
        copyFileSync(src, dest);
        console.log(`  ✅ 复制: ${file}`);
      }
    });

    // 处理 package.json（用于发布）
    if (args.includes('--publish')) {
      const pkgPath = join(distDir, 'package.json');
      const corePkgPath = join(coreDir, 'package.json');
      const nodePkgPath = join(coreDir, 'package.nodejs.json');

      let pkg = readJSON(corePkgPath);

      // 如果存在 nodejs 特定配置，合并它
      if (existsSync(nodePkgPath)) {
        const nodePkg = readJSON(nodePkgPath);
        pkg = { ...pkg, ...nodePkg };
      }

      // 更新版本号
      const rootPkg = readJSON(join(rootDir, 'package.json'));
      pkg.version = rootPkg.version;

      // 移除 electron 相关依赖
      if (pkg.dependencies) {
        Object.keys(pkg.dependencies).forEach(key => {
          if (key.includes('electron')) {
            delete pkg.dependencies[key];
          }
        });
      }

      writeJSON(pkgPath, pkg);
      console.log('  ✅ 已处理发布用 package.json');
    }
  },


  // 构建 CLI
  async buildCli() {
    console.log('\n⚡ 构建 CLI 包...');
    exec('npm run build', { cwd: join(rootDir, 'packages/cli') });
  },

  // 构建 Electron
  async buildElectron() {
    console.log('\n💻 构建 Electron 应用...');

    // 先确保 Web 已构建
    if (!existsSync(join(rootDir, 'packages/web/build'))) {
      await tasks.buildWeb();
    }

    const electronDir = join(rootDir, 'packages/electron');

    // 复制 Web 构建产物
    const webBuildSrc = join(rootDir, 'packages/web/build');
    const webBuildDest = join(electronDir, 'web-build');

    ensureDir(webBuildDest);
    cpSync(webBuildSrc, webBuildDest, { recursive: true });
    console.log('  ✅ 已复制 Web 构建产物');

    // 运行 Electron 构建
    exec('npm run build', { cwd: electronDir });
  },

  // 构建所有
  async buildAll() {
    console.log('🚀 开始完整构建...\n');

    // 清理
    tasks.clean();

    // 按顺序构建
    await tasks.buildWeb();
    await tasks.buildCore();
    await tasks.buildCli();
    await tasks.buildElectron();

    console.log('\n✨ 所有构建已完成！');
  },

  // 开发模式
  dev() {
    const target = args[1] || 'web';
    console.log(`🔧 启动开发模式: ${target}`);

    switch (target) {
      case 'web':
        exec('npm run start', { cwd: join(rootDir, 'packages/web') });
        break;
      case 'core':
        exec('npm run start', { cwd: join(rootDir, 'packages/core') });
        break;
      case 'cli':
        exec('npm run start', { cwd: join(rootDir, 'packages/cli') });
        break;
      case 'electron':
        exec('npm run start', { cwd: join(rootDir, 'packages/electron') });
        break;
      case 'all':
        // 使用 concurrently 同时运行多个开发服务器
        exec('npx concurrently "npm run start --prefix packages/web" "npm run start --prefix packages/core"');
        break;
      default:
        console.error(`❌ 未知的开发目标: ${target}`);
        console.log('可用选项: web, core, cli, electron, all');
        process.exit(1);
    }
  },

  // 帮助信息
  help() {
    console.log(`
HyperChat 构建脚本

使用方法:
  node scripts/build.mjs <command> [options]

命令:
  clean         清理所有构建产物
  buildWeb      构建 Web 前端
  buildCore     构建 Core 包
  buildCli      构建 CLI 包
  buildElectron 构建 Electron 应用
  buildAll      构建所有包
  dev [target]  启动开发模式 (web/core/cli/electron/all)
  help          显示此帮助信息

选项:
  --publish     为发布准备 Core 包（处理 package.json）

示例:
  node scripts/build.mjs buildAll
  node scripts/build.mjs dev web
  node scripts/build.mjs buildCore --publish
`);
  }
};

// 执行命令
const taskName = command || 'help';
const task = tasks[taskName];

if (task) {
  try {
    const result = task();
    if (result && typeof result.catch === 'function') {
      result.catch(error => {
        console.error('❌ 构建失败:', error);
        process.exit(1);
      });
    }
  } catch (error) {
    console.error('❌ 构建失败:', error);
    process.exit(1);
  }
} else {
  console.error(`❌ 未知命令: ${taskName}`);
  tasks.help();
  process.exit(1);
}