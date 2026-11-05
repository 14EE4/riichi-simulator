# Riichi Mahjong Simulator 워크스페이스 가이드 (`AGENTS.md`)

이 문서는 Antigravity 에이전트가 세션을 다시 시작할 때마다 자동으로 읽어들여 컨텍스트를 유지하기 위한 프로젝트 규칙 및 작업 메모입니다.

---

## 1. 프로젝트 구조 및 실행 환경

- **프로젝트 위치**: `D:\vscodeworkspace\riichi-simulator`
- **Python 가상환경 (`.venv`)**:
  - 루트의 `.venv` 가상환경(`.\.venv\Scripts\python.exe`)을 기본 런타임으로 사용합니다.
  - `run.bat`가 `.venv` 존재 여부를 확인하여 자동 생성 및 실행하며, Docker 배포를 위한 `Dockerfile` 및 `docker-compose.yml`을 포함합니다.
- **백엔드 (Python 3.10+ / FastAPI / WebSocket / PyTorch / libriichi)**:
  - `backend/engine/libriichi/`: Rust 기반 공식 리치마작 엔진 바인딩 (`.pyd` / `.so`)
  - `backend/engine/model.py`: Mortal ResNet-40 + Dueling DQN 오프라인 신경망 (CUDA 지원)
  - `backend/engine/mortal_agent.py`: 3명의 Mortal AI 플레이어 래퍼 (단일 모델 가중치 공유)
  - `backend/engine/dealer.py`: 비동기 마작 딜러 상태 머신 (패산 셔플, 배패, 쯔모/타패 딜레이, 울림 판정, 정산)
  - `backend/engine/scorer.py`: 공식 일본 마작 역 판정, 점수 계산 및 리치 가능 타패 계산 모듈 (`mahjong` 라이브러리)
  - `backend/models/mortal.pth`: 커뮤니티 학습 Mortal 신경망 모델 가중치 (~133MB)
  - `backend/server.py`: FastAPI + WebSocket 실시간 대국 서버 및 정적 프론트엔드 서빙
- **프론트엔드 (React 19 / Vite / TypeScript / TailwindCSS / mahgen)**:
  - `frontend/src/components/`:
    - `MahjongTile.tsx`: 고해상도 SVG 마작 타일 렌더러 (`xs`, `sm`, `md`, `lg`)
    - `PlayerHand.tsx`: 내 손패 인터랙션 (타패 클릭, 리치 가능 타패 하이라이트, 샹텐수/대기패/후리텐 표시)
    - `OpponentHand.tsx`: 상대 AI 뒷면 손패 (후로 시 장수 자동 차감)
    - `Melds.tsx`: 4인 좌석별 방향 회전 후로 패 렌더러
    - `River.tsx`: 버림패 하천 (6열 정렬, 리치패 가로 눕힘, 쯔모기리 표시)
    - `CenterPanel.tsx`: 중앙 정보 (5x2 왕패, 국/본장, 남은 패산, 4인 회전 점수판)
    - `ActionBar.tsx`: [치/퐁/깡/리치/론/쯔모/패스] 플로팅 팝업 인터랙션 바
    - `ResultModal.tsx`: 화료 역/점수 및 유국 결과 정산 모달
  - `frontend/dist/`: 빌드 완료된 정적 에셋 (zero-config 즉시 실행 지원)
- **실행 스크립트**: `run.bat` (`.venv` 가상환경 자동 감지·구축 및 로컬 서버 구동, 브라우저 `http://localhost:8000` 자동 오픈)

---

## 2. 로컬 빌드 및 개발 규칙 (필수)

1. **가상환경(`.venv`) 및 원클릭 단독 실행 원칙 (`run.bat`)**
   - 모든 Python 명령 및 테스트는 전역 Python 대신 `.\.venv\Scripts\python.exe`로 실행합니다.
   - 프론트엔드가 이미 `frontend/dist`로 빌드되어 배포되어 있으므로, `run.bat` 또는 `.\.venv\Scripts\python.exe backend/server.py` 하나로 웹 UI와 백엔드가 동시에 구동됩니다.
2. **프론트엔드 수정 후 반드시 빌드 갱신**
   - `frontend/src` 내의 UI 코드를 수정했을 때는 반드시 빌드를 다시 수행하여 `frontend/dist`에 반영해야 로컬 파이썬 서버에서 변경사항이 적용됩니다:
     ```powershell
     cd frontend
     npm run build
     ```
3. **대용량 모델 가중치(`backend/models/mortal.pth`) Git 관리 주의**
   - `mortal.pth`는 약 133MB로 GitHub의 단일 파일 100MB 크기 제한을 초과합니다.
   - `.gitignore`에 등록되어 있으므로 Git에 강제로 커밋하지 않습니다. 로컬 환경에서 유지합니다.
4. **PowerShell 명령 실행 주의사항**
   - PowerShell에서는 `&&`가 동작하지 않으므로 명령 구분 시 `;`를 사용합니다.

---

## 3. 브랜치 구조 및 원격 저장소 규칙

- **원격 저장소**: GitHub 개인 저장소 (`origin`)
- **브랜치 역할**:
  - `dev`: 모든 기능 개발·수정이 통합되는 기본 개발 브랜치
  - `main` / `master`: 테스트 및 검증이 완료된 안정 릴리스 브랜치
  - 작업 브랜치: `dev`에서 분기 (`feat/...`, `fix/...`)
- **`main` 직접 커밋/분기 금지**: `main`은 사용자가 모든 테스트를 마치고 명시적으로 지시할 때만 머지합니다.

---

## 4. 작업 진행 필수 표준 워크플로우 (순서 엄격 준수)

```
[1단계: 이슈 생성] ➔ [2단계: dev 기준 브랜치 분기] ➔ [3단계: 작업·빌드·문서화] ➔ [4단계: 사용자 검증 후 PR]
```

1. **1단계: 이슈(Issue) 먼저 생성**
   - 코드 수정 전에 배경, 문제점, 구체적 작업 계획을 담은 이슈를 먼저 등록합니다 (`gh issue create`).
2. **2단계: 이슈에서 `dev` 기준 작업 브랜치 생성**
   - 반드시 최신 `dev` 브랜치를 기준으로 새 피처 브랜치를 생성하여 이동합니다 (`git checkout -b feat/... dev`).
3. **3단계: 코드 구현, 빌드 검증, 문서 최신화 (문서 동기화 원칙)**
   - 코드 작업 후 백엔드 단위 테스트 및 `frontend` 빌드(`npm run build`)를 통과시킵니다.
   - **문서 동기화(Documentation Drift 방지)**:
     - 기능 개발, 룰 추가, UI 변경 완료 시 사용자 보고 전에 `README.md` 및 관련 문서를 반드시 최신화합니다.
     - 커밋 메시지는 `feat:`, `fix:`, `docs:`, `chore:` 접두사를 명확히 구분하여 사용합니다.
4. **4단계: 사용자 검증 후 PR 생성 및 머지**
   - **사용자가 직접 테스트하고 승인한 후**에 PR을 생성하여 `dev`에 머지합니다.
   - `main` 브랜치는 사용자가 모든 테스트를 마치고 명시적으로 지시할 때만 머지합니다.

---

## 5. 협업 및 환경 실전 메모

- **GitHub CLI 본문 전달 시 `--body-file` 필수 (PowerShell 백틱 충돌 방지)**:
  - PowerShell에서는 백틱(`` ` ``)이 이스케이프 문자로 취급되므로 `gh issue create/edit --body "..."`나 `gh pr create --body "..."`에 마크다운 코드가 들어가면 본문이 중간에 잘리거나 왜곡됩니다. 반드시 임시 파일(예: `_body.md`)을 작성한 후 `--body-file _body.md`로 전달하고 삭제합니다.
- **마크다운 수치·날짜 범위 표현 시 백틱 보호 (취소선·첨자 파싱 왜곡 방지)**:
  - 마크다운 파서에서 평문에 `~`가 2회 이상 등장하면(예: `0.5~1.0초`, `13~14장`) 물결표 사이의 텍스트가 취소선(`~~`)으로 오인식되어 문장 일부가 지워지는 결함이 발생합니다. 범위 수치는 반드시 백틱(`` `13~14장` ``, `` `25000~30000점` ``)으로 감싸 보호합니다.
- **작업 완료 시 GitHub 이슈 코멘트 기록 의무**:
  - 작업 단위나 이슈가 완료되면 배경, 원인, 상세 조치 내역, 검증 결과를 GitHub 이슈에 코멘트로 상세히 기록합니다 (`--body-file` 필수 활용).
