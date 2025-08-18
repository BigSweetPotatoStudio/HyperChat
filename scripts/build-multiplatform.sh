#!/bin/bash

# HyperChat 多平台构建脚本
# 支持 macOS 无证书构建和 Linux ARM64 构建

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 HyperChat 多平台构建脚本${NC}"
echo "======================================"

# 检查参数
show_help() {
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  --mac-unsigned    构建 macOS 无证书版本"
    echo "  --linux-arm64     构建 Linux ARM64 版本"
    echo "  --all             构建所有平台"
    echo "  --help            显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 --mac-unsigned     # 构建 macOS 无证书版本"
    echo "  $0 --linux-arm64      # 构建 Linux ARM64 版本"
    echo "  $0 --all              # 构建所有支持的平台"
}

# 检查依赖
check_dependencies() {
    echo -e "${YELLOW}📋 检查构建依赖...${NC}"
    
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js 未安装，请先安装 Node.js${NC}"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm 未安装，请先安装 npm${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ 依赖检查完成${NC}"
}

# 安装项目依赖
install_dependencies() {
    echo -e "${YELLOW}📦 安装项目依赖...${NC}"
    
    # 根目录依赖
    npm install
    
    # Web 包依赖
    cd packages/web
    npm install
    cd ../..
    
    # Electron 包依赖
    cd packages/electron
    npm install
    cd ../..
    
    echo -e "${GREEN}✅ 依赖安装完成${NC}"
}

# macOS 无证书构建
build_mac_unsigned() {
    echo -e "${YELLOW}🍎 开始构建 macOS 无证书版本...${NC}"
    
    # 设置环境变量禁用签名
    export CSC_IDENTITY_AUTO_DISCOVERY=false
    export CSC_LINK=""
    export CSC_KEY_PASSWORD=""
    export APPLE_ID=""
    export APPLE_APP_SPECIFIC_PASSWORD=""
    export APPLE_TEAM_ID=""
    
    # 备份原始配置
    cd packages/electron
    cp package.json package.json.bak
    
    # 临时修改配置
    node -e "
        const fs = require('fs');
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        delete pkg.build.afterSign;
        pkg.build.mac.notarize = false;
        fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
    "
    
    # 构建 Web 前端
    cd ../web
    npm run build
    
    # 构建 Electron
    cd ../electron
    npm run build
    
    # 恢复原始配置
    mv package.json.bak package.json
    
    cd ../..
    
    echo -e "${GREEN}✅ macOS 无证书版本构建完成${NC}"
    echo -e "${YELLOW}📦 输出文件位于: packages/electron/dist/${NC}"
}

# Linux ARM64 构建
build_linux_arm64() {
    echo -e "${YELLOW}🐧 开始构建 Linux ARM64 版本...${NC}"
    
    # 构建 Web 前端
    cd packages/web
    npm run build
    
    # 构建 Electron ARM64
    cd ../electron
    
    # 设置 ARM64 构建环境
    export npm_config_target_arch=arm64
    export npm_config_target_platform=linux
    
    # 仅构建 ARM64
    npx electron-builder --linux --arm64
    
    cd ../..
    
    echo -e "${GREEN}✅ Linux ARM64 版本构建完成${NC}"
    echo -e "${YELLOW}📦 输出文件位于: packages/electron/dist/${NC}"
}

# 构建所有平台
build_all() {
    echo -e "${YELLOW}🌍 开始构建所有平台...${NC}"
    
    # 构建 Web 前端（只需要一次）
    cd packages/web
    npm run build
    cd ../..
    
    # 根据当前平台选择构建目标
    case "$(uname)" in
        "Darwin")
            echo -e "${YELLOW}🍎 在 macOS 上构建...${NC}"
            build_mac_unsigned
            ;;
        "Linux")
            echo -e "${YELLOW}🐧 在 Linux 上构建...${NC}"
            build_linux_arm64
            
            # 如果是 x64 Linux，也构建 x64 版本
            if [ "$(uname -m)" = "x86_64" ]; then
                echo -e "${YELLOW}🐧 同时构建 Linux x64 版本...${NC}"
                cd packages/electron
                npx electron-builder --linux --x64
                cd ../..
            fi
            ;;
        *)
            echo -e "${RED}❌ 不支持的平台: $(uname)${NC}"
            exit 1
            ;;
    esac
    
    echo -e "${GREEN}✅ 所有平台构建完成${NC}"
}

# 显示构建结果
show_results() {
    echo ""
    echo -e "${GREEN}🎉 构建完成！${NC}"
    echo "======================================"
    echo -e "${YELLOW}📦 构建产物位于:${NC}"
    
    if [ -d "packages/electron/dist" ]; then
        ls -la packages/electron/dist/
        echo ""
        echo -e "${YELLOW}💡 安装说明:${NC}"
        echo "- macOS: 双击 .dmg 文件安装，首次运行右键选择'打开'"
        echo "- Linux: 使用 'chmod +x *.AppImage && ./HyperChat-*.AppImage'"
        echo "- DEB: 使用 'sudo dpkg -i *.deb'"
    else
        echo -e "${RED}❌ 未找到构建产物${NC}"
    fi
}

# 主逻辑
main() {
    # 检查参数
    if [ $# -eq 0 ]; then
        show_help
        exit 1
    fi
    
    # 检查依赖
    check_dependencies
    
    # 安装项目依赖
    install_dependencies
    
    # 根据参数执行对应构建
    case "$1" in
        "--mac-unsigned")
            build_mac_unsigned
            ;;
        "--linux-arm64")
            build_linux_arm64
            ;;
        "--all")
            build_all
            ;;
        "--help")
            show_help
            exit 0
            ;;
        *)
            echo -e "${RED}❌ 未知选项: $1${NC}"
            show_help
            exit 1
            ;;
    esac
    
    # 显示结果
    show_results
}

# 运行主函数
main "$@"