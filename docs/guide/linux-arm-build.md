# Linux ARM64 构建指南

HyperChat 完全支持 Linux ARM64 架构，包括树莓派、Apple Silicon Mac 运行 Linux 等设备。

## 支持的格式

HyperChat 为 Linux ARM64 提供以下安装包格式：

### 1. AppImage (推荐)
- **优势**: 便携式，无需安装，支持所有Linux发行版
- **适用**: 树莓派、Ubuntu ARM、Debian ARM等
- **文件**: `HyperChat-{version}-linux-arm64.AppImage`

### 2. DEB 包
- **优势**: 原生 Debian/Ubuntu 包管理
- **适用**: Debian、Ubuntu、树莓派OS等
- **文件**: `HyperChat-{version}-linux-arm64.deb`

### 3. TAR.GZ 压缩包
- **优势**: 通用压缩包，手动部署
- **适用**: 所有Linux ARM64系统
- **文件**: `HyperChat-{version}-linux-arm64.tar.gz`

## 构建 ARM64 版本

### 方法一：在 ARM64 设备上构建

如果您有 ARM64 Linux 设备（如树莓派 4/5、Apple Silicon Mac 运行 Linux）：

```bash
# 克隆项目
git clone https://github.com/BigSweetPotatoStudio/HyperChat.git
cd HyperChat

# 安装依赖
npm install

# 安装各个包的依赖
cd packages/web && npm install && cd ..
cd packages/electron && npm install && cd ..

# 构建
npm run prod
```

### 方法二：交叉编译

在 x64 系统上交叉编译 ARM64 版本：

```bash
# 安装交叉编译工具
npm install -g electron-builder

# 设置目标架构
export npm_config_target_arch=arm64
export npm_config_target_platform=linux

# 构建
cd packages/electron
npx electron-builder --linux --arm64
```

### 方法三：使用 GitHub Actions

项目已配置 GitHub Actions 自动构建，包含 ARM64 版本：

```yaml
# 在 ubuntu-latest 上构建 Linux ARM64
- name: Build Electron App (Linux)
  run: npm run prod
  env:
    GH_TOKEN: ${{ secrets.GH_TOKEN }}
```

## 安装和运行

### AppImage 安装

```bash
# 下载后设置可执行权限
chmod +x HyperChat-*.AppImage

# 运行
./HyperChat-*.AppImage
```

### DEB 包安装

```bash
# 使用 dpkg 安装
sudo dpkg -i HyperChat-*-linux-arm64.deb

# 如果有依赖问题，修复依赖
sudo apt-get install -f

# 运行
hyperchat
```

### TAR.GZ 安装

```bash
# 解压
tar -xzf HyperChat-*-linux-arm64.tar.gz

# 运行
cd HyperChat-*/
./hyperchat
```

## 树莓派特殊配置

### 性能优化

为树莓派优化性能，可以修改 Electron 启动参数：

```bash
# 创建启动脚本
cat > run-hyperchat-pi.sh << 'EOF'
#!/bin/bash
export ELECTRON_DISABLE_GPU=true
export ELECTRON_ENABLE_LOGGING=true
./HyperChat-*.AppImage --no-sandbox --disable-gpu --disable-software-rasterizer
EOF

chmod +x run-hyperchat-pi.sh
```

### 内存限制

对于内存有限的设备：

```bash
# 增加交换空间
sudo dphys-swapfile swapoff
sudo nano /etc/dphys-swapfile
# 设置 CONF_SWAPSIZE=2048
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

## 测试设备

已测试的 ARM64 Linux 设备：

- ✅ 树莓派 4 (4GB/8GB RAM)
- ✅ 树莓派 5 (4GB/8GB RAM)  
- ✅ Apple Silicon Mac (asahi linux)
- ✅ AWS Graviton 实例
- ✅ Ubuntu ARM64 服务器

## 问题排查

### 1. 权限问题

```bash
# 确保有执行权限
chmod +x HyperChat-*.AppImage

# 检查 FUSE 支持
sudo apt install fuse libfuse2
```

### 2. 依赖问题

```bash
# 安装基础依赖
sudo apt update
sudo apt install libnss3 libatk-bridge2.0-0 libx11-xcb1 libxcb-dri3-0 libdrm2 libxss1 libasound2
```

### 3. GPU 加速问题

```bash
# 禁用硬件加速
./HyperChat-*.AppImage --disable-gpu
```

## 自定义构建

如需自定义 ARM64 构建配置，修改 `packages/electron/package.json`：

```json
{
  "build": {
    "linux": {
      "target": [
        {
          "arch": ["arm64"],
          "target": "AppImage"
        }
      ]
    }
  }
}
```

然后运行：

```bash
npx electron-builder --linux --arm64
```