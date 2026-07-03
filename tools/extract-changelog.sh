#!/bin/bash
# 从 CHANGELOG.md 中提取指定版本号的更新内容
# 用法: ./tools/extract-changelog.sh v1.0.0  或  ./tools/extract-changelog.sh 1.0.0
# 输出: 该版本在 CHANGELOG.md 中的完整内容（含版本标题行，不含下一个版本标题）

set -euo pipefail

VERSION="${1#v}"  # 去掉前缀 v（如果有）

if [ -z "$VERSION" ]; then
  echo "Usage: $0 <version>" >&2
  exit 1
fi

CHANGELOG="CHANGELOG.md"

if [ ! -f "$CHANGELOG" ]; then
  echo "Error: $CHANGELOG not found" >&2
  exit 1
fi

# 提取从 "[v${VERSION}]" 到下一个 "## [" 之间的内容
# 支持 v0.9.0-beta 和 v1.0.0 两种格式
CONTENT=$(sed -n "/^## \[v${VERSION}\]/,/^## \[/p" "$CHANGELOG" | sed '$d')

if [ -z "$CONTENT" ]; then
  # 尝试不带 v 前缀的格式
  CONTENT=$(sed -n "/^## \[v\?${VERSION}\]/,/^## \[/p" "$CHANGELOG" | sed '$d')
fi

if [ -z "$CONTENT" ]; then
  echo "## v${VERSION}" >&2
  echo "No changelog entry found for v${VERSION}" >&2
  exit 0
fi

echo "$CONTENT"