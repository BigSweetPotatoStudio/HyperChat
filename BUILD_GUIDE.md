# HyperChat 多端打包指南

本文档回答关于 HyperChat 多端打包的常见问题。

## 🍎 macOS 无Apple证书打包

### 快速方案

使用项目提供的构建脚本：

```bash
./scripts/build-multiplatform.sh --mac-unsigned
```

### 手动构建

1. **禁用代码签名**：
```bash
export CSC_IDENTITY_AUTO_DISCOVERY=false
cd packages/electron
npm run build
```

2. **用户安装时需要**：
   - 右键点击应用 → "打开"
   - 或在"系统偏好设置" → "安全性与隐私"中允许

### 分发建议

- 提供 DMG 和 ZIP 两种格式
- 在分发说明中提醒用户安装步骤
- 考虑使用 tar.gz 格式减少macOS安全限制

## 🐧 Linux ARM64 支持

### ✅ 完全支持

HyperChat **已经完全支持** Linux ARM64 架构，包括：

- **AppImage** (推荐) - 适用于所有Linux发行版
- **DEB包** - 适用于 Debian/Ubuntu/树莓派OS
- **TAR.GZ** - 通用压缩包格式

### 支持的设备

- 树莓派 4/5 (4GB+ RAM 推荐)
- Apple Silicon Mac 运行 Linux
- AWS Graviton 实例
- 其他 ARM64 Linux 服务器

### 快速构建

```bash
# 在ARM64设备上直接构建
./scripts/build-multiplatform.sh --linux-arm64

# 或交叉编译
cd packages/electron
npx electron-builder --linux --arm64
```

### 树莓派优化运行

```bash
# 设置可执行权限
chmod +x HyperChat-*.AppImage

# 性能优化启动
./HyperChat-*.AppImage --no-sandbox --disable-gpu
```

## 🌍 一键构建所有平台

```bash
./scripts/build-multiplatform.sh --all
```

会根据当前系统自动选择合适的构建目标。

## 📋 构建要求

### 系统要求
- Node.js 18+
- npm 或 yarn
- 至少 4GB RAM (推荐 8GB+)

### macOS 额外要求
- macOS 10.15+ 
- Xcode Command Line Tools

### Linux 额外要求
- build-essential
- libnss3-dev, libatk-bridge2.0-dev 等依赖

## 🔧 自定义构建

### 修改目标平台

编辑 `packages/electron/package.json`：

```json
{
  "build": {
    "linux": {
      "target": [
        {"arch": ["arm64"], "target": "AppImage"},
        {"arch": ["arm64"], "target": "deb"}
      ]
    },
    "mac": {
      "notarize": false,
      "target": [
        {"arch": ["arm64"], "target": "dmg"}
      ]
    }
  }
}
```

### 环境变量控制

```bash
# 禁用 macOS 签名
export CSC_IDENTITY_AUTO_DISCOVERY=false

# ARM64 交叉编译
export npm_config_target_arch=arm64
export npm_config_target_platform=linux

# 构建
npm run build
```

## 📚 详细文档

- [macOS 无证书构建详细指南](./docs/guide/macos-unsigned-build.md)
- [Linux ARM64 构建详细指南](./docs/guide/linux-arm-build.md)

## ❓ 常见问题

### Q: macOS 显示"无法验证开发者"

A: 右键点击应用选择"打开"，或使用以下命令：
```bash
xattr -cr /Applications/HyperChat.app
```

### Q: Linux ARM64 版本在树莓派上运行缓慢

A: 使用以下优化参数：
```bash
./HyperChat-*.AppImage --no-sandbox --disable-gpu --disable-software-rasterizer
```

### Q: 如何验证ARM64支持

A: 检查构建配置：
```bash
cat packages/electron/package.json | grep -A 10 "linux"
```

### Q: 可以在GitHub Actions中自动构建吗？

A: 是的，项目已配置GitHub Actions，推送到stable分支会自动构建所有平台。