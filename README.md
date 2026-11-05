# 🀄 Riichi Mahjong Simulator (1인용 리치마작 시뮬레이터)

오픈소스 마작 신경망 **Mortal AI**와 Rust 기반 마작 라이브러리 **libriichi**를 기반으로 제작된 **1인용 일본 리치마작 시뮬레이터**입니다.  
플레이어 1인(You)과 3명의 Mortal AI(`Mortal East`, `Mortal North`, `Mortal West`)가 정통 일본 리치마작 룰로 대국을 진행합니다.

> [!NOTE]
> **모델 가중치 안내**:
> Mortal AI의 원작자(Equim-chan)는 신경망 아키텍처와 `libriichi` 라이브러리를 오픈소스로 공개하였으나, 모델 가중치 원본은 공식 저장소에 직접 배포되지 않았습니다.  
> 본 시뮬레이터에서 구동되는 가중치는 커뮤니티 사용자가 대규모 패보를 바탕으로 직접 학습(Train)하여 공유한 모델입니다.  
> 가중치 파일(`mortal.pth`)은 용량(100MB+) 및 저작권 특성상 GitHub 저장소에 포함되어 있지 않으므로, 로컬 실행 시 `backend/models/mortal.pth` 경로에 직접 배치하여 사용합니다.

---

## 🌟 주요 특징

- **정통 일본 리치마작 룰 구현 (`libriichi` & `mahjong`)**:
  - 패산(136장) 셔플 및 왕패(린샹 4장, 도라/우라도라 각 5장) 분리
  - 멘젠 쯔모, 론, 리치, 더블 리치, 일발(Ippatsu), 치, 퐁, 대명깡, 안깡, 가깡
  - 후리텐(Furiten) 자동 감지 및 실시간 샹텐수/대기패 안내
  - 공식 화료 역 판정 및 부수/판수/점수(론/쯔모 지불 분배) 정산
  - 유국 시 텐파이 판정 및 3,000점 노텐 벌부 정산
- **최고 수준의 AI 대국자 (Mortal 3인)**:
  - 40블록 딥러닝 ResNet + Dueling DQN 오프라인 신경망 탑재
  - 단일 모델 가중치(`mortal.pth`) 메모리 공유로 초경량/초고속 GPU/CPU 추론
- **미려한 마작 테이블 UI (`mahgen` 고해상도 SVG 타일)**:
  - 선명한 벡터 SVG 타일 렌더링
  - 가로 눕힘 리치패, 쯔모기리 인디케이터, 버림패 하천(River) 6열 정렬
  - 4인 좌석 기준 회전 중앙 점수판 (국/본장, 공탁, 도라 표시패, 실시간 점수)
  - 직관적인 플로팅 액션 버튼 ([치], [퐁], [깡], [리치], [론], [쯔모], [패스])
- **원클릭 실행**:
  - `run.bat` 더블 클릭만으로 로컬 웹 서버 가동 및 브라우저(`http://localhost:8000`) 자동 실행

---

## 🚀 빠른 시작 (Quick Start)

### 1. 실행하기
루트 폴더의 `run.bat`를 더블 클릭하여 실행하거나 터미널에서 다음 명령을 실행합니다:

```powershell
python backend/server.py
```

브라우저가 자동으로 열리며 즉시 게임이 시작됩니다:
👉 **http://localhost:8000**

---

## 🛠️ 개발 및 빌드 안내

### 백엔드 (Python + FastAPI + PyTorch)
```powershell
pip install -r backend/requirements.txt
python backend/server.py
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
├── backend/
│   ├── engine/
│   │   ├── libriichi/         # Rust 기반 고성능 마작 엔진 바인딩 (.pyd)
│   │   ├── _libriichi_loader.py
│   │   ├── model.py           # Mortal ResNet/Dueling DQN 오프라인 신경망
│   │   ├── mortal_agent.py    # Mortal AI 플레이어 래퍼 (3개 인스턴스)
│   │   ├── scorer.py          # 공식 역 판정 및 점수 계산 모듈
│   │   └── dealer.py          # 게임 딜러 (패산 셔플, 쯔모/타패/울림/정산 상태 머신)
│   ├── models/
│   │   └── mortal.pth         # 커뮤니티 학습 Mortal 신경망 가중치
│   ├── server.py              # FastAPI + WebSocket 실시간 게임 서버
│   └── requirements.txt
├── frontend/                  # React + TypeScript + Tailwind + mahgen
│   ├── src/
│   │   ├── components/
│   │   │   ├── MahjongTile.tsx   # SVG 마작 타일 렌더러
│   │   │   ├── PlayerHand.tsx    # 내 손패 (인터랙티브 타패, 샹텐수/대기패 표시)
│   │   │   ├── OpponentHand.tsx  # 상대 AI 뒷면 패
│   │   │   ├── River.tsx         # 버림패 하천 (리치패 눕힘, 쯔모기리 표시)
│   │   │   ├── CenterPanel.tsx   # 중앙 정보 (국/본장, 도라, 남은 패, 점수판)
│   │   │   ├── ActionBar.tsx     # [치/퐁/깡/리치/론/쯔모/패스] 플로팅 팝업 버튼
│   │   │   └── ResultModal.tsx   # 화료 역/점수 및 유국 결과 모달
│   │   ├── utils/tiles.ts
│   │   └── App.tsx
│   └── dist/                  # 사전 빌드 완료된 정적 에셋
├── run.bat                    # 원클릭 실행 스크립트
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
