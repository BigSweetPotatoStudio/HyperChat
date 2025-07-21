# 🚀 发布工作流程

## 📋 新的发布流程

### 🔄 自动版本管理
现在版本管理完全通过 Husky pre-push 钩子自动处理，无需手动操作。

#### Dev2 分支（Alpha 版本）
```bash
git add .
git commit -m "feat: 新功能"
git push origin dev2  # 🚀 自动 bump alpha 版本并发布到 npm
```

#### Stable 分支（正式版本）
```bash
git add .
git commit -m "feat: 稳定版本"
git push origin stable  # 🚀 自动 bump patch 版本并发布到 npm
```

### ⚡ Pre-push 钩子自动执行：

1. **检测分支**：根据当前分支决定版本策略
2. **版本管理**：
   - `dev2` → 自动 bump alpha 版本
   - `stable` → 自动 bump patch 版本
   - 其他分支 → 无版本操作
3. **同步版本**：运行 `npm run version:sync`
4. **构建检查**：运行完整构建验证
5. **依赖同步**：同步 electron 依赖
6. **推送代码**：包含更新后的版本文件

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