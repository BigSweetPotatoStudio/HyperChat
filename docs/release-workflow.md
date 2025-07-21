# 🚀 发布工作流程

## 📋 智能版本管理 - Pre-push 策略

### 🎯 推送时智能检测版本发布

版本管理现在通过 **Pre-push 钩子** 实现，在推送前检测最新提交是否需要发布版本。

#### 🔄 普通开发流程（不改版本）
```bash
git add .
git commit -m "feat: 添加新功能"        # ✅ 普通提交
git commit -m "fix: 修复bug"           # ✅ 普通提交  
git commit -m "docs: 更新文档"         # ✅ 普通提交
git push origin dev2                  # ✅ 正常推送，不触发版本变更
```

#### 🚀 发布流程（自动版本管理）

**步骤1: 提交发布代码**
```bash
git add .
git commit -m "feat: 重要新功能 [release]"  # 📝 包含发布关键词
```

**步骤2: 推送触发版本管理**
```bash
git push origin dev2
# 🎯 Pre-push 钩子检测到发布关键词
# 📦 自动升级版本 (alpha.34 → alpha.35)
# 🔄 同步所有包版本
# 💾 自动创建版本提交
# ⚠️  中止推送，提示重新推送
```

**步骤3: 重新推送完成发布**
```bash
git push origin dev2
# ✅ 推送成功（包含版本提交）
# 🚀 GitHub Actions 自动发布到 npm
```

### 🎯 发布触发方式

| 触发方式 | 示例 | 版本类型 |
|----------|------|----------|
| **发布关键词** | `feat: 新功能 [release]` | 根据分支决定 |
| **发布关键词** | `fix: 重要修复 [publish]` | 根据分支决定 |
| **发布关键词** | `perf: 优化 [version]` | 根据分支决定 |
| **Breaking Changes** | `feat!: 重大更新` | Major (stable) / Alpha (dev2) |
| **BREAKING CHANGE** | 包含 `BREAKING CHANGE:` | Major (stable) / Alpha (dev2) |
| **Stable 分支新功能** | `feat: 新功能` (仅 stable) | Minor |

### ⚡ 版本规则

#### Dev2 分支
- 所有触发 → `prerelease` 版本
- `2.0.0-alpha.34` → `2.0.0-alpha.35`

#### Stable 分支  
- `feat!:` / `BREAKING CHANGE:` → **Major** (1.0.0 → 2.0.0)
- `feat:` → **Minor** (1.0.0 → 1.1.0)
- `[release]` 等关键词 → **Patch** (1.0.0 → 1.0.1)

### ⚡ Pre-push 钩子执行：

1. **构建检查**：运行完整构建验证
2. **依赖同步**：同步 electron 依赖

### 🎯 GitHub Actions 自动发布：

1. **检查版本**：验证版本是否已存在于 npm
2. **发布包**：如果版本不存在，自动发布到 npm
3. **发送通知**：Telegram 通知发布结果

## 🛡️ 防循环机制

- GitHub Actions 忽略 `package.json` 文件变更，避免循环触发
- 只有实质性的代码变更才会触发发布流程

## 📦 手动版本管理（可选）

如果需要手动控制版本：

```bash
# 禁用 pre-push 版本管理
git push --no-verify origin dev2

# 或手动版本管理
npm run version:patch  # 或 version:minor, version:major
git add .
git commit -m "chore: bump version"
git push origin dev2
```

## 🔍 调试和监控

### 查看 pre-push 日志
```bash
# pre-push 钩子会显示详细的执行日志
git push origin dev2
```

### 跳过 pre-push 检查
```bash
# 紧急推送（不推荐）
git push --no-verify origin dev2
```

## 🎉 优势

✅ **无循环触发**：版本管理在本地完成  
✅ **历史清晰**：每次推送包含正确的版本信息  
✅ **自动化**：无需手动管理版本号  
✅ **安全**：构建失败自动阻止推送  
✅ **简洁**：GitHub Actions 只专注于发布  

## 🚫 常见问题

### Q: pre-push 失败了怎么办？
A: 检查构建错误，修复后重新推送

### Q: 版本号不对怎么办？
A: 可以手动修改 `package.json` 后重新推送

### Q: 如何跳过版本管理？
A: 使用 `git push --no-verify` 或切换到其他分支推送