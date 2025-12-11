#!/bin/bash

echo "🌏 지진 미디어 리터러시 교육 플랫폼 설정"
echo "==========================================="
echo ""

# GitHub 사용자명 입력 받기
read -p "GitHub 사용자명을 입력하세요: " USERNAME

if [ -z "$USERNAME" ]; then
    echo "❌ 사용자명이 입력되지 않았습니다."
    exit 1
fi

# 저장소 이름 입력 (기본값: earthquake-literacy)
read -p "저장소 이름을 입력하세요 (기본: earthquake-literacy): " REPO_NAME
REPO_NAME=${REPO_NAME:-earthquake-literacy}

echo ""
echo "📝 설정 정보:"
echo "   - 사용자명: $USERNAME"
echo "   - 저장소: $REPO_NAME"
echo "   - URL: https://$USERNAME.github.io/$REPO_NAME"
echo ""

# package.json 업데이트
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|https://USERNAME.github.io/earthquake-literacy|https://$USERNAME.github.io/$REPO_NAME|g" package.json
else
    # Linux
    sed -i "s|https://USERNAME.github.io/earthquake-literacy|https://$USERNAME.github.io/$REPO_NAME|g" package.json
fi

echo "✅ package.json 업데이트 완료"

# 의존성 설치
echo ""
echo "📦 의존성 설치 중..."
npm install

echo ""
echo "==========================================="
echo "✅ 설정 완료!"
echo ""
echo "다음 단계:"
echo ""
echo "1. GitHub에 저장소 생성: https://github.com/new"
echo "   - 저장소 이름: $REPO_NAME"
echo "   - Public 선택"
echo ""
echo "2. Git 초기화 및 Push:"
echo "   git init"
echo "   git add ."
echo "   git commit -m 'Initial commit'"
echo "   git branch -M main"
echo "   git remote add origin https://github.com/$USERNAME/$REPO_NAME.git"
echo "   git push -u origin main"
echo ""
echo "3. GitHub Pages 배포:"
echo "   npm run deploy"
echo ""
echo "4. GitHub → Settings → Pages에서 Branch를 'gh-pages'로 설정"
echo ""
echo "🌐 배포 URL: https://$USERNAME.github.io/$REPO_NAME"
echo "==========================================="
