#!/bin/bash
# 一键同步版本号到所有配置文件
# 用法: ./tools/sync-version.sh 1.1.0
# 同步位置: package.json / Cargo.toml / tauri.conf.json

set -euo pipefail

VERSION="${1#v}"  # 去掉前缀 v（如果有）

if [ -z "$VERSION" ]; then
  echo "Usage: $0 <version>" >&2
  echo "Example: $0 1.1.0" >&2
  exit 1
fi

echo "🔄 Syncing version to $VERSION..."

# package.json
npm version "$VERSION" --no-git-tag-version --prefix 03_Web_Rebuild 2>/dev/null || \
  (cd 03_Web_Rebuild && npm version "$VERSION" --no-git-tag-version)
echo "  ✅ package.json"

# Cargo.toml (Tauri backend)
if [ -f 03_Web_Rebuild/src-tauri/Cargo.toml ]; then
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s/^version = \".*\"/version = \"$VERSION\"/" 03_Web_Rebuild/src-tauri/Cargo.toml
  else
    sed -i "s/^version = \".*\"/version = \"$VERSION\"/" 03_Web_Rebuild/src-tauri/Cargo.toml
  fi
  echo "  ✅ Cargo.toml"
fi

# tauri.conf.json
if [ -f 03_Web_Rebuild/src-tauri/tauri.conf.json ]; then
  if command -v jq &> /dev/null; then
    jq ".version = \"$VERSION\"" 03_Web_Rebuild/src-tauri/tauri.conf.json > tmp.json && mv tmp.json 03_Web_Rebuild/src-tauri/tauri.conf.json
    echo "  ✅ tauri.conf.json"
  else
    echo "  ⚠️  jq not found, skipping tauri.conf.json (install: brew install jq)"
  fi
fi

echo "✅ All version references updated to $VERSION"
echo ""
echo "Next steps:"
echo "  1. Edit CHANGELOG.md to move [Unreleased] content to [v$VERSION]"
echo "  2. git commit -m \"release: v$VERSION\""
echo "  3. git tag v$VERSION"
echo "  4. git push origin main --tags"