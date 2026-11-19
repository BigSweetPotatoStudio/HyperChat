# macOS 无证书打包指南

本指南帮助您在没有Apple开发者证书的情况下打包HyperChat for macOS。

## 方法一：禁用代码签名和公证

### 1. 修改electron配置

编辑`packages/electron/package.json`，确保以下配置：

```json
{
  "build": {
    "mac": {
      "notarize": false,
      "target": [
        {
          "arch": ["arm64", "x64"],
          "target": "dmg"
        },
        {
          "arch": ["arm64", "x64"], 
          "target": "zip"
        }
      ]
    }
  }
}
```

### 2. 临时禁用notarize脚本

重命名或注释掉`afterSign`配置：

```json
{
  "build": {
    // "afterSign": "./build/notarize.js",  // 注释这行
    "mac": {
      "notarize": false
    }
  }
}
```

### 3. 构建命令

```bash
cd packages/electron
npm run build
```

或者使用环境变量临时禁用：

```bash
export CSC_IDENTITY_AUTO_DISCOVERY=false
npm run build
```

## 方法二：使用本地构建脚本

创建一个无证书构建脚本：

```bash
#!/bin/bash
# build-unsigned.sh

export CSC_IDENTITY_AUTO_DISCOVERY=false
export CSC_LINK=""
export CSC_KEY_PASSWORD=""
export APPLE_ID=""
export APPLE_APP_SPECIFIC_PASSWORD=""
export APPLE_TEAM_ID=""

cd packages/web
npm run build

cd ../electron
npm run build
```

## 分享给用户的注意事项

### 1. 用户首次安装步骤

由于应用未签名，用户需要：

1. 下载dmg文件后，右键点击应用 → "打开"
2. 在弹出的警告对话框中点击"打开"
3. 或者在"系统偏好设置" → "安全性与隐私" → "通用"中允许运行

### 2. 绕过Gatekeeper

用户也可以通过命令行绕过：

```bash
sudo spctl --master-disable  # 完全禁用Gatekeeper
# 或
xattr -cr /Applications/HyperChat.app  # 移除应用的隔离属性
```

### 3. 打包为不同格式

为了方便分发，建议同时构建多种格式：

```json
"mac": {
  "target": [
    {"arch": ["arm64"], "target": "dmg"},
    {"arch": ["arm64"], "target": "zip"}, 
    {"arch": ["arm64"], "target": "tar.gz"},
    {"arch": ["x64"], "target": "dmg"},
    {"arch": ["x64"], "target": "zip"}
  ]
}
```

## 自动化构建

使用GitHub Actions进行自动化构建，但禁用签名：

```yaml
- name: Build Electron App (macOS unsigned)
  run: npm run prod
  env:
    CSC_IDENTITY_AUTO_DISCOVERY: false
    MYRUNENV: github
```

## 注意事项

1. **安全警告**：未签名的应用在macOS上会显示安全警告
2. **分发限制**：无法通过Mac App Store分发
3. **用户体验**：用户需要额外步骤才能运行应用
4. **建议**：如果可能，还是建议申请Apple开发者证书以获得更好的用户体验