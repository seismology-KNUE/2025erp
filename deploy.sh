#!/bin/bash

echo "🚀 GitHub Pages 배포 시작..."
echo ""

# 변경사항 확인
if [[ -n $(git status --porcelain) ]]; then
    echo "📝 변경사항 커밋 중..."
    git add .
    read -p "커밋 메시지를 입력하세요 (기본: Update): " COMMIT_MSG
    COMMIT_MSG=${COMMIT_MSG:-Update}
    git commit -m "$COMMIT_MSG"
    git push origin main
fi

# 배포
echo ""
echo "📦 빌드 및 배포 중..."
npm run deploy

echo ""
echo "✅ 배포 완료!"
echo ""
echo "1~2분 후 사이트에서 확인하세요."
echo "💡 변경사항이 바로 반영되지 않으면 브라우저 캐시를 지우고 새로고침하세요."
