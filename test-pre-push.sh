#!/usr/bin/env sh

echo "🧪 Testing pre-push hook..."
echo "=================================="

# 显示当前状态
echo "📍 Current branch: $(git rev-parse --abbrev-ref HEAD)"
echo "📝 Last commit: $(git log -1 --pretty=format:%s)"
echo "🔍 Working directory status:"
git status --porcelain

echo ""
echo "🚀 Running pre-push hook..."
echo "=================================="

# 运行 pre-push 钩子
./.husky/pre-push

# 获取退出码
EXIT_CODE=$?

echo ""
echo "=================================="
if [ $EXIT_CODE -eq 0 ]; then
  echo "✅ Pre-push hook passed (exit $EXIT_CODE)"
  echo "💡 Push would continue normally"
else
  echo "❌ Pre-push hook failed (exit $EXIT_CODE)" 
  echo "💡 Push would be aborted"
fi