# 배포 방법 (public 저장소 + GitHub Pages)

이 폴더 전체가 곧 저장소 루트입니다. `index.html`이 루트에 있으므로 그대로 올리면 됩니다.

## 1) GitHub에서 public 저장소 만들기
- 이름 예: `tarot-arcana-flow`
- **Public** 선택
- README/.gitignore 추가는 **체크하지 말 것**(비워서 생성).

## 2-A) 가장 쉬운 방법 — 웹에서 드래그&드롭
1. 새 저장소 페이지의 **uploading an existing file** 클릭.
2. 이 폴더의 **내용물 전체**(`index.html`, `css/`, `js/`, `.nojekyll`, `README.md`,
   `.github/`)를 끌어다 놓고 **Commit**.
3. **Settings → Pages → Build and deployment**
   - Source = **Deploy from a branch**
   - Branch = **main** / 폴더 **/(root)** → Save.
4. 1~2분 뒤 `https://<사용자명>.github.io/tarot-arcana-flow/` 에서 열립니다.

> 드래그&드롭은 `.github/` 같은 점(.)으로 시작하는 폴더가 빠질 수 있으니,
> Actions 자동배포가 필요 없으면 위 **Deploy from a branch** 방식이면 충분합니다.

## 2-B) git 명령으로 올리기 (Actions 자동배포 포함)
```bash
cd <이 폴더>
git init -b main
git add -A
git commit -m "feat: Arcana Flow tarot webapp"
git remote add origin https://github.com/<사용자명>/tarot-arcana-flow.git
git push -u origin main
```
그다음 **Settings → Pages → Source = "GitHub Actions"** 로 설정하면,
포함된 `.github/workflows/pages.yml` 가 매 푸시마다 자동 배포합니다.
(public 저장소라 `enablement: true` 로 자동 활성화가 보통 바로 됩니다.)

## 로컬에서 먼저 확인
```bash
python3 -m http.server 8080   # → http://localhost:8080
```

카드 이미지는 위키미디어(퍼블릭 도메인 RWS)에서 핫링크되며, 브라우저에서 정상
로드됩니다. 로드 실패 시 카드명 폴백이 표시됩니다.
