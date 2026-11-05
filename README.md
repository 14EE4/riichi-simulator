# 🀄 Riichi Mahjong Simulator (1인용 리치마작 시뮬레이터)

오픈소스 마작 신경망 **Mortal AI**와 Rust 기반 마작 라이브러리 **libriichi**를 기반으로 제작된 **1인용 일본 리치마작 시뮬레이터**입니다.  
플레이어 1인(You)과 3명의 Mortal AI(`Mortal East`, `Mortal North`, `Mortal West`)가 정통 일본 리치마작 룰로 대국을 진행합니다.

> [!NOTE]
> **모델 가중치 안내**:
> Mortal AI의 원작자(Equim-chan)는 신경망 아키텍처와 `libriichi` 라이브러리를 오픈소스로 공개하였으나, 모델 가중치 원본은 공식 저장소에 직접 배포되지 않았습니다.  
> 본 시뮬레이터에서 구동되는 가중치는 커뮤니티 사용자가 대규모 패보를 바탕으로 직접 학습(Train)하여 공유한 모델입니다.  
> 가중치 파일(`mortal.pth`)은 용량(`100MB+`) 및 저작권 특성상 GitHub 저장소에 포함되어 있지 않으므로, 로컬 실행 시 `backend/models/mortal.pth` 경로에 직접 배치하여 사용합니다.

---

## 🌟 주요 특징

- **정통 일본 리치마작 룰 구현 (`libriichi` & `mahjong`)**:
  - 패산(`136장`) 셔플 및 왕패(린샹 4장, 도라/우라도라 각 5장) 분리
  - 멘젠 쯔모, 론, 리치, 더블 리치, 일발(Ippatsu), 치, 퐁, 대명깡, 안깡, 가깡
  - **리치 스마트 보조 & 자동 진행**: 리치 선언 시 텐파이가 유지되는 타패 후보만 하이라이트 및 활성화되며, 리치 성립 후에는 불필요한 후로(치/퐁/깡) 팝업 없이 자동으로 쯔모기리가 진행됩니다.
  - 후리텐(Furiten) 자동 감지 및 실시간 샹텐수/대기패 안내
  - 공식 화료 역 판정 및 부수/판수/점수(론/쯔모 지불 분배) 정산
  - 유국 시 텐파이 판정 및 `3,000점` 노텐 벌부 정산
- **최고 수준의 AI 대국자 (Mortal 3인)**:
  - 40블록 딥러닝 ResNet + Dueling DQN 오프라인 신경망 탑재
  - 단일 모델 가중치(`mortal.pth`) 메모리 공유로 초경량/초고속 GPU/CPU 추론
  - 자연스러운 AI 타패 딜레이(`0.6초`) 및 실시간 턴 브로드캐스트
- **미려한 마작 테이블 UI (`mahgen` 고해상도 SVG 타일)**:
  - 좌측 상단 **도라 표시패 5장** 배치 (깡 발생 시 순차 오픈) 및 **리치 화료 시 결과 모달에서 뒷도라(우라도라) 5장 공개**
  - 4인 좌석 방향 기준 손패, 버림패 하천(River 6열), 후로 패(Melds) 회전 배치 및 후로 시 손패 장수 자동 차감
  - 직관적인 플로팅 액션 버튼 ([치], [퐁], [깡], [리치], [론], [쯔모], [패스])
- **가상환경(`.venv`) 자동화 및 Docker 지원**:
  - `run.bat` 실행 시 프로젝트 전용 Python 가상환경(`.venv`)을 자동 감지·생성하여 전역 Python 환경 오염 없이 격리 구동
  - `Dockerfile` 및 `docker-compose.yml`을 통한 컨테이너 배포 지원

---

## 🚀 빠른 시작 (Quick Start)

### 1. Windows 원클릭 실행 (Python `.venv` 가상환경 자동 구동)
루트 폴더의 `run.bat`를 더블 클릭하여 실행합니다. `.venv` 가상환경이 없으면 자동으로 생성 및 패키지 설치 후 서버를 띄웁니다:

```powershell
.\run.bat
```

또는 가상환경 파이썬으로 직접 실행할 수 있습니다:

```powershell
.\.venv\Scripts\python.exe backend/server.py
```

브라우저가 자동으로 열리며 즉시 게임이 시작됩니다:
👉 **http://localhost:8000**

### 2. Docker / Docker Compose 실행
`backend/models/mortal.pth`에 가중치 파일을 배치한 후 다음 명령으로 컨테이너를 실행합니다:

```powershell
docker compose up -d --build
```

---

## 🛠️ 개발 및 빌드 안내

### 백엔드 (Python `.venv` + FastAPI + PyTorch)
```powershell
python -m venv .venv --system-site-packages
.\.venv\Scripts\python.exe -m pip install -r backend/requirements.txt
.\.venv\Scripts\python.exe backend/server.py
```

### 프론트엔드 (Vite + React + TypeScript + TailwindCSS)
```powershell
cd frontend
npm install
npm run dev     # 개발 모드 (http://localhost:5173)
npm run build   # 프로덕션 빌드 (dist/ 생성)
```

---

## 📁 프로젝트 구조

```
riichi-simulator/
├── .venv/                     # 프로젝트 전용 Python 가상환경 (Git 제외)
├── backend/
│   ├── engine/
│   │   ├── libriichi/         # Rust 기반 고성능 마작 엔진 바인딩 (.pyd / .so)
│   │   ├── _libriichi_loader.py
│   │   ├── model.py           # Mortal ResNet/Dueling DQN 오프라인 신경망
│   │   ├── mortal_agent.py    # Mortal AI 플레이어 래퍼 (3개 인스턴스)
│   │   ├── scorer.py          # 공식 역 판정, 점수 계산 및 리치 가능 타패 탐색
│   │   └── dealer.py          # 비동기 게임 딜러 (패산, 쯔모/타패 딜레이, 울림, 정산)
│   ├── models/
│   │   └── mortal.pth         # 커뮤니티 학습 Mortal 신경망 가중치
│   ├── server.py              # FastAPI + WebSocket 실시간 게임 서버
│   └── requirements.txt
├── frontend/                  # React + TypeScript + Tailwind + mahgen
│   ├── src/
│   │   ├── components/
│   │   │   ├── MahjongTile.tsx   # SVG 마작 타일 렌더러 (xs/sm/md/lg)
│   │   │   ├── PlayerHand.tsx    # 내 손패 (리치 가능 타패 하이라이트, 샹텐/대기패)
│   │   │   ├── OpponentHand.tsx  # 상대 AI 뒷면 패 (후로 시 장수 자동 차감)
│   │   │   ├── Melds.tsx         # 4인 좌석별 방향 회전 후로 패 렌더러
│   │   │   ├── River.tsx         # 버림패 하천 (리치패 눕힘, 쯔모기리 표시)
│   │   │   ├── CenterPanel.tsx   # 중앙 정보 (5x2 왕패, 국/본장, 남은 패, 회전 점수판)
│   │   │   ├── ActionBar.tsx     # [치/퐁/깡/리치/론/쯔모/패스] 플로팅 팝업 버튼
│   │   │   └── ResultModal.tsx   # 화료 역/점수 및 유국 결과 모달
│   │   ├── utils/tiles.ts
│   │   └── App.tsx
│   └── dist/                  # 사전 빌드 완료된 정적 에셋
├── Dockerfile                 # Linux 컨테이너 이미지 빌드 설정
├── docker-compose.yml         # Docker Compose 서비스 설정
├── run.bat                    # .venv 가상환경 자동 구성 및 원클릭 실행 스크립트
└── README.md
```

---

## 📜 오픈소스 라이선스 및 크레딧 (Third-Party Notices)

본 프로젝트는 다음 오픈소스 소프트웨어 및 라이브러리를 활용하여 제작되었습니다:

- **[Mortal](https://github.com/Equim-chan/Mortal) & libriichi**
  - Copyright (c) Equim-chan
  - Licensed under the **Apache License, Version 2.0**
  - 신경망 아키텍처(ResNet-40/Dueling DQN) 및 Rust 기반 마작 룰/상태 관리 바인딩 사용
- **[mahjong](https://github.com/KillerGoldFisch/mahjong)**
  - Copyright (c) 2017-2023 Alexey Lisachev
  - Licensed under the **MIT License**
  - 리치마작 역 판정 및 부수/점수 계산 엔진 사용
- **[mahgen](https://www.npmjs.com/package/mahgen)**
  - Licensed under the **MIT License**
  - 웹 컴포넌트 기반 고해상도 벡터 마작 패 SVG 렌더링 사용
- **[Lucide Icons](https://lucide.dev/)**
  - Licensed under the **ISC License**
  - UI 아이콘 사용
