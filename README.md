# 🌏 지진 미디어 리터러시 교육 플랫폼

구텐베르그-리히터 법칙을 체험하고 지진 관련 미디어의 신뢰도를 평가하는 STEM 교육 플랫폼입니다.

---

## 🚀 GitHub Pages 배포 가이드

### 📋 사전 준비

- [Node.js](https://nodejs.org/) 설치 (v16 이상)
- [Git](https://git-scm.com/) 설치
- [GitHub](https://github.com/) 계정

---

### Step 1: 저장소 생성

1. GitHub에서 **New repository** 클릭
2. Repository name: `earthquake-literacy` (원하는 이름)
3. **Public** 선택
4. **Create repository** 클릭

---

### Step 2: 로컬 설정

```bash
# 1. 프로젝트 폴더로 이동
cd earthquake-literacy

# 2. package.json의 homepage 수정 (중요!)
# "homepage": "https://YOUR_USERNAME.github.io/earthquake-literacy"
# YOUR_USERNAME을 본인의 GitHub 사용자명으로 변경

# 3. 의존성 설치
npm install

# 4. 로컬에서 테스트 (선택사항)
npm start
# 브라우저에서 http://localhost:3000 확인
```

---

### Step 3: GitHub에 Push

```bash
# Git 초기화 및 원격 저장소 연결
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/earthquake-literacy.git
git push -u origin main
```

---

### Step 4: GitHub Pages 배포

```bash
# 빌드 및 배포 (한 번에 실행)
npm run deploy
```

이 명령어가 실행되면:
1. `npm run build` 자동 실행 (프로덕션 빌드)
2. `gh-pages` 브랜치 자동 생성
3. 빌드된 파일이 `gh-pages` 브랜치에 push

---

### Step 5: GitHub Pages 활성화

1. GitHub 저장소 → **Settings** 탭
2. 왼쪽 메뉴에서 **Pages** 클릭
3. **Source** 섹션에서:
   - Branch: `gh-pages`
   - Folder: `/ (root)`
4. **Save** 클릭

---

### Step 6: 완료! 🎉

1~2분 후 사이트 접속 가능:

```
https://YOUR_USERNAME.github.io/earthquake-literacy
```

---

## 🔄 업데이트 배포

코드 수정 후 재배포:

```bash
# 변경사항 커밋
git add .
git commit -m "Update features"
git push origin main

# GitHub Pages 재배포
npm run deploy
```

---

## 🔗 Google Sites에 임베드

### 방법 1: 전체 페이지 임베드

1. Google Sites 편집 모드
2. **삽입** → **삽입** → **URL로 삽입**
3. GitHub Pages URL 입력:
   ```
   https://YOUR_USERNAME.github.io/earthquake-literacy
   ```
4. 크기: **전체 너비**, 높이 **800px** 이상 권장

### 방법 2: HTML 코드 직접 삽입

1. **삽입** → **삽입** → **HTML 삽입**
2. 아래 코드 붙여넣기:

```html
<iframe 
  src="https://YOUR_USERNAME.github.io/earthquake-literacy" 
  width="100%" 
  height="900" 
  frameborder="0"
  style="border: none; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
</iframe>
```

---

## 📁 프로젝트 구조

```
earthquake-literacy/
├── public/
│   └── index.html          # HTML 템플릿
├── src/
│   ├── index.js            # React 진입점
│   ├── index.css           # 전역 스타일 (Tailwind)
│   ├── App.js              # 앱 컴포넌트
│   └── GRModule.js         # G-R 분석 메인 모듈
├── .gitignore
├── package.json            # 의존성 및 스크립트
└── README.md
```

---

## 🎯 주요 기능

### 1️⃣ 시뮬레이션 모드
- b-value 슬라이더로 값 설정 (0.5 ~ 1.5)
- 가상 지진 데이터 생성
- **단계별 애니메이션**으로 G-R 법칙 시각화
  - Step 1: 히스토그램
  - Step 2: 누적 빈도
  - Step 3: 로그 변환
  - Step 4: 선형 회귀 → b-value 계산

### 2️⃣ 실제 데이터 분석
- **USGS API**에서 실시간 지진 데이터 로드
- **17개 주요 지역** 지원
- Mc (완전성 규모) 설정 가능
- 자동 b-value 계산 및 해석

### 3️⃣ 시계열 분석
- 시간에 따른 b-value 변화 추적
- 이동 윈도우 크기 조절 (30~180일)
- 오차 범위 시각화

---

## 🌍 지원 지역

| 카테고리 | 지역 | 판구조 유형 |
|----------|------|------------|
| **동아시아** | 한반도 | 판내부 |
| | 일본 전역 | 섭입대 |
| | 난카이 트러프 | 메가스러스트 |
| | 센다이/도호쿠 | 섭입대 |
| | 쓰촨성 | 충돌영향 |
| | 필리핀 | 섭입대 |
| **환태평양** | 캄차카 | 섭입대 |
| | 알래스카 | 섭입대 |
| | 캘리포니아 | 변환단층 |
| | 수마트라 | 섭입대 |
| | 칠레 | 섭입대 |
| | 뉴질랜드 | 복합경계 |
| **변환/충돌** | 동아나톨리아 | 주향이동 |
| | 북아나톨리아 | 변환단층 |
| | 히말라야 | 충돌경계 |
| **발산경계** | 동아프리카 열곡 | 발산경계 |
| | 아이슬란드 | 중앙해령 |

---

## ❓ 문제 해결

### 배포 후 404 에러

1. `package.json`의 `homepage` URL 확인
2. GitHub → Settings → Pages에서 브랜치가 `gh-pages`인지 확인
3. 5분 정도 기다린 후 다시 시도

### 빌드 에러

```bash
# node_modules 삭제 후 재설치
rm -rf node_modules package-lock.json
npm install
npm run build
```

### USGS 데이터 로드 실패

- CORS 문제일 수 있음 → 새로고침 후 재시도
- API 서버 일시 장애 → 잠시 후 재시도
- 네트워크 확인

---

## 📚 학습 목표

이 플랫폼을 통해 학습자는:

1. **구텐베르그-리히터 법칙**을 이해하고 직접 분석할 수 있다
2. **b-value**의 의미와 지역별 차이를 설명할 수 있다
3. 지진 관련 **미디어의 신뢰도**를 과학적으로 평가할 수 있다
4. "확정적 예언"과 "확률적 위험 평가"를 구별할 수 있다

---

## 📄 라이선스

MIT License - 교육 목적으로 자유롭게 사용, 수정, 배포 가능

---

## 🙋 문의

이슈나 개선 제안은 GitHub Issues를 통해 등록해 주세요.
