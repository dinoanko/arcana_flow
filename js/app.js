/* ============================================================================
 * app.js — 컨트롤러: 테마 · 커버플로우 · 추첨 · 해석 렌더 · 아카이브
 * ==========================================================================*/
(function () {
  'use strict';

  const CARDS = window.TAROT_CARDS;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  /* ---------- 테마 ---------- */
  const THEMES = [
    ['mystic',    '미스틱'],
    ['classic',   '클래식'],
    ['gummy',     '구미베어'],
    ['nouveau',   '아르누보'],
    ['midnight',  '미드나잇'],
    ['goldleaf',  '골드리프'],
    ['pastel',    '파스텔'],
    ['neon',      '네온'],
    ['sepia',     '세피아'],
    ['woodcut',   '우드컷'],
    ['sakura',    '사쿠라'],
    ['ocean',     '오션'],
    ['mono',      '모노크롬']
  ];

  function initThemes() {
    const wrap = $('#themePicker');
    const saved = localStorage.getItem('tarot.theme') || 'mystic';
    THEMES.forEach(([id, label]) => {
      const b = document.createElement('button');
      b.className = 'theme-chip';
      b.textContent = label;
      b.setAttribute('aria-pressed', String(id === saved));
      b.addEventListener('click', () => setTheme(id));
      b._themeId = id;
      wrap.appendChild(b);
    });
    setTheme(saved, false);
  }

  function setTheme(id, save = true) {
    document.body.setAttribute('data-theme', id);
    document.documentElement.setAttribute('data-theme', id);
    $$('.theme-chip').forEach((b) => b.setAttribute('aria-pressed', String(b._themeId === id)));
    if (save) localStorage.setItem('tarot.theme', id);
  }

  /* ---------- 이미지 헬퍼 ---------- */
  function attachImg(imgEl, card, container) {
    imgEl.addEventListener('error', () => container.classList.add('img-error'), { once: true });
    imgEl.src = card.src;
    imgEl.alt = card.ko + ' (' + card.name + ')';
  }

  function fallbackHTML(card) {
    return '<div class="fallback">' +
      '<div class="fb-mark">✦</div>' +
      '<div class="fb-name">' + card.name + '</div>' +
      '<div class="fb-ko">' + card.ko + '</div>' +
      '</div>';
  }

  /* ---------- 커버플로우 ---------- */
  let center = 0;
  const track = $('#flowTrack');

  function buildFlow() {
    CARDS.forEach((card, i) => {
      const el = document.createElement('div');
      el.className = 'flow-card';
      el.dataset.i = i;
      el.setAttribute('role', 'option');
      el.setAttribute('aria-label', card.ko + ' ' + card.name);

      const img = document.createElement('img');
      img.loading = 'lazy';
      el.appendChild(img);
      el.insertAdjacentHTML('beforeend', fallbackHTML(card));
      attachImg(img, card, el);

      el.addEventListener('click', () => {
        if (i !== center) gotoFlow(i);
      });
      track.appendChild(el);
    });
    layoutFlow();
  }

  function layoutFlow() {
    const cards = track.children;
    for (let i = 0; i < cards.length; i++) {
      const off = i - center;
      const abs = Math.abs(off);
      const sign = Math.sign(off);
      const el = cards[i];

      let transform, opacity, zIndex;
      if (off === 0) {
        transform = 'translate3d(0,0,70px) rotateY(0deg) scale(1.07)';
        opacity = 1;
        zIndex = 200;
        el.classList.add('is-center');
        el.setAttribute('aria-selected', 'true');
      } else {
        const x = sign * (158 + (abs - 1) * 52);
        const tz = -140 - (abs - 1) * 44;
        const ry = sign * -58;
        const sc = Math.max(0.78, 1 - abs * 0.05);
        transform = `translate3d(${x}px,0,${tz}px) rotateY(${ry}deg) scale(${sc})`;
        opacity = abs <= 6 ? Math.max(0, 1 - abs * 0.16) : 0;
        zIndex = 200 - abs;
        el.classList.remove('is-center');
        el.setAttribute('aria-selected', 'false');
      }

      el.style.transform = transform;
      el.style.opacity = opacity;
      el.style.zIndex = zIndex;
      el.style.pointerEvents = abs <= 7 ? 'auto' : 'none';
    }

    const c = CARDS[center];
    $('#flowMeta').innerHTML =
      '<strong>' + c.name + '</strong> · ' + c.ko +
      ' <span style="opacity:.6">(' + (center + 1) + ' / ' + CARDS.length + ')</span>';
    $('#flowRange').value = center;
  }

  function gotoFlow(i) {
    center = Math.max(0, Math.min(CARDS.length - 1, i));
    layoutFlow();
  }

  function initFlowControls() {
    $('#flowPrev').addEventListener('click', () => gotoFlow(center - 1));
    $('#flowNext').addEventListener('click', () => gotoFlow(center + 1));
    $('#flowRange').max = CARDS.length - 1;
    $('#flowRange').addEventListener('input', (e) => gotoFlow(+e.target.value));

    // 키보드
    document.addEventListener('keydown', (e) => {
      if (e.target.matches('input, textarea, select')) return;
      if (e.key === 'ArrowLeft')  gotoFlow(center - 1);
      if (e.key === 'ArrowRight') gotoFlow(center + 1);
      if (e.key === 'Home')       gotoFlow(0);
      if (e.key === 'End')        gotoFlow(CARDS.length - 1);
    });

    // 휠
    const stage = $('#flowStage');
    let acc = 0;
    stage.addEventListener('wheel', (e) => {
      acc += Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(acc) > 55) {
        gotoFlow(center + (acc > 0 ? 1 : -1));
        acc = 0;
        e.preventDefault();
      }
    }, { passive: false });

    // 드래그 / 터치
    let dragging = false, startX = 0, startCenter = 0;
    const onPress = (x) => { dragging = true; startX = x; startCenter = center; };
    const onMove  = (x) => { if (dragging) gotoFlow(startCenter + Math.round((startX - x) / 58)); };
    const onUp    = ()  => { dragging = false; };

    stage.addEventListener('mousedown',   (e) => onPress(e.clientX));
    window.addEventListener('mousemove',  (e) => onMove(e.clientX));
    window.addEventListener('mouseup',    onUp);
    stage.addEventListener('touchstart',  (e) => onPress(e.touches[0].clientX), { passive: true });
    stage.addEventListener('touchmove',   (e) => onMove(e.touches[0].clientX),  { passive: true });
    stage.addEventListener('touchend',    onUp);
  }

  /* ---------- 스프레드 선택 ---------- */
  const SPREADS = [
    { n: 1,  label: '1장',  sub: '한마디' },
    { n: 3,  label: '3장',  sub: '과·현·미' },
    { n: 5,  label: '5장',  sub: '십자' },
    { n: 7,  label: '7장',  sub: '말굽' },
    { n: 10, label: '10장', sub: '켈틱' }
  ];
  let drawCount = 3;

  function initCounts() {
    const wrap = $('#countChips');
    SPREADS.forEach((s) => {
      const b = document.createElement('button');
      b.className = 'count-chip';
      b.setAttribute('aria-pressed', String(s.n === drawCount));
      b.innerHTML = s.label + '<small>' + s.sub + '</small>';
      b.addEventListener('click', () => {
        drawCount = s.n;
        $$('.count-chip').forEach((x) => x.setAttribute('aria-pressed', 'false'));
        b.setAttribute('aria-pressed', 'true');
      });
      wrap.appendChild(b);
    });
  }

  /* ---------- 포지션 레이블 ---------- */
  const POS = {
    1:  ['지금 당신에게'],
    3:  ['과거', '현재', '미래'],
    5:  ['중심', '도전', '뿌리', '최근 과거', '다가올 것'],
    7:  ['현재', '도전', '가까운 과거', '가까운 미래', '의식의 목표', '무의식', '결과'],
    10: ['현재', '도전', '뿌리/과거', '최근 과거', '가능한 미래', '다가올 것', '당신의 태도', '환경/주변', '희망과 두려움', '최종 결과']
  };

  /* ---------- 결과 렌더 ---------- */
  function render(result, spreadCount, { scroll = true } = {}) {
    const root = $('#results');
    root.innerHTML = '';

    const positions = POS[spreadCount] || result.picks.map((_, i) => '카드 ' + (i + 1));

    // 헤더
    const head = document.createElement('div');
    head.className = 'result-head';
    const seedSpan = document.createElement('div');
    seedSpan.className = 'result-seed';
    seedSpan.textContent = 'seed: ' + result.seed + ' ';
    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-seed-btn';
    copyBtn.textContent = '복사';
    copyBtn.addEventListener('click', () => {
      navigator.clipboard && navigator.clipboard.writeText(result.seed);
      copyBtn.textContent = '복사됨 ✓';
      setTimeout(() => { copyBtn.textContent = '복사'; }, 2200);
    });
    seedSpan.appendChild(copyBtn);
    head.innerHTML = '<h2>' + spreadCount + '장 스프레드</h2>';
    head.appendChild(seedSpan);
    root.appendChild(head);

    // 각 카드
    result.picks.forEach((pick, idx) => {
      const card = CARDS[pick.index];
      const reversed = pick.reversed;
      const reading = window.TarotReading.essayFromCard(card, reversed);

      const wrap = document.createElement('article');
      wrap.className = 'reading-card';
      // 스태거 애니메이션
      wrap.style.animationDelay = (idx * 90) + 'ms';

      const top = document.createElement('div');
      top.className = 'reading-top';

      // 썸네일
      const thumb = document.createElement('div');
      thumb.className = 'reading-thumb' + (reversed ? ' reversed' : '');
      const img = document.createElement('img');
      img.loading = 'lazy';
      thumb.appendChild(img);
      thumb.insertAdjacentHTML('beforeend', fallbackHTML(card));
      attachImg(img, card, thumb);

      // 요약
      const sum = document.createElement('div');
      sum.className = 'reading-summary';

      const meta = [
        card.arcana === 'major' ? '메이저 ' + card.num : '마이너',
        '원소: ' + card.element,
        card.astro ? '점성: ' + card.astro : null
      ].filter(Boolean).map((m) => '<span>' + m + '</span>').join('');

      const orient = reversed
        ? '<span class="orient-badge orient-rev">역방향 ⟲</span>'
        : '<span class="orient-badge orient-up">정방향 ↑</span>';

      sum.innerHTML =
        '<span class="pos-tag">' + (positions[idx] || '카드 ' + (idx + 1)) + '</span>' +
        '<h3>' + card.name + '</h3>' +
        '<p class="ko">' + card.ko + ' · ' + orient + '</p>' +
        '<div class="meta-grid">' + meta + '</div>' +
        '<p class="kw-line"><b>정방향</b> · ' + card.keywordsUp + '</p>' +
        '<p class="kw-line"><b>역방향</b> · ' + card.keywordsRev + '</p>' +
        '<button class="read-toggle">전체 해석 읽기' +
          '<span class="word-count">약 ' + reading.words + '단어' +
          (reading.authored ? ' · 손글' : '') + '</span>' +
        '</button>';

      top.appendChild(thumb);
      top.appendChild(sum);
      wrap.appendChild(top);

      const body = document.createElement('div');
      body.className = 'reading-body';
      body.hidden = true;
      body.innerHTML = reading.html;
      wrap.appendChild(body);

      sum.querySelector('.read-toggle').addEventListener('click', (e) => {
        body.hidden = !body.hidden;
        const btn = e.currentTarget;
        if (body.hidden) {
          btn.firstChild.textContent = '전체 해석 읽기';
        } else {
          btn.firstChild.textContent = '접기 ';
          body.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });

      root.appendChild(wrap);
    });

    if (scroll) root.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ---------- 추첨 ---------- */
  function doDraw() {
    const btn = $('#drawBtn');
    btn.classList.add('loading');
    btn.querySelector('.btn-label').textContent = '섞는 중…';

    // 짧은 딜레이로 UI 피드백 후 추첨
    setTimeout(() => {
      const seedInput = $('#seedInput').value.trim();
      const result = window.TarotRNG.draw(CARDS.length, drawCount, seedInput || null);
      render(result, drawCount);
      window.TarotArchive.add({
        seed: result.seed,
        drawnAt: result.drawnAt,
        count: drawCount,
        picks: result.picks
      });
      refreshArchive();

      btn.classList.remove('loading');
      btn.querySelector('.btn-label').textContent = '카드 뽑기';
    }, 220);
  }

  /* ---------- 아카이브 ---------- */
  let archiveOpen = false;

  function refreshArchive() {
    const list = $('#archiveList');
    const items = window.TarotArchive.all();
    if (!items.length) {
      list.innerHTML = '<p class="archive-empty">아직 뽑은 기록이 없습니다.</p>';
      return;
    }
    list.innerHTML = '';
    items.forEach((rec) => {
      const el = document.createElement('div');
      el.className = 'archive-item';

      const mini = rec.picks.slice(0, 10).map((pk) => {
        const c = CARDS[pk.index];
        return '<img class="' + (pk.reversed ? 'rev' : '') + '" loading="lazy" src="' +
          c.src + '" alt="' + c.ko + '" onerror="this.style.visibility=\'hidden\'">';
      }).join('');

      const when = new Date(rec.drawnAt);
      const names = rec.picks.map((pk) => CARDS[pk.index].ko + (pk.reversed ? '(역)' : '')).join(', ');

      el.innerHTML =
        '<div class="archive-mini">' + mini + '</div>' +
        '<div class="archive-info">' +
          '<div class="a-title">' + rec.count + '장 · ' + when.toLocaleString('ko-KR') + '</div>' +
          '<div class="a-sub">' + names + '</div>' +
          '<div class="a-seed">seed: ' + rec.seed + '</div>' +
        '</div>' +
        '<div class="a-btns">' +
          '<button class="ghost-btn sm a-open">다시 보기</button>' +
          '<button class="ghost-btn sm danger a-del">삭제</button>' +
        '</div>';

      el.querySelector('.a-open').addEventListener('click', () => {
        render({ seed: rec.seed, drawnAt: rec.drawnAt, picks: rec.picks }, rec.count);
      });
      el.querySelector('.a-del').addEventListener('click', () => {
        window.TarotArchive.remove(rec.id);
        refreshArchive();
      });
      list.appendChild(el);
    });
  }

  function initArchive() {
    const toggle = $('#archiveToggle');
    const listEl = $('#archiveList');
    toggle.addEventListener('click', () => {
      archiveOpen = !archiveOpen;
      listEl.hidden = !archiveOpen;
      toggle.textContent = archiveOpen ? '접기' : '펼치기';
      if (archiveOpen) refreshArchive();
    });
    $('#archiveClear').addEventListener('click', () => {
      if (confirm('아카이브의 모든 기록을 삭제할까요?')) {
        window.TarotArchive.clear();
        refreshArchive();
      }
    });
  }

  /* ---------- 부팅 ---------- */
  function init() {
    CARDS.forEach((c) => {
      c.keywordsUp  = (c.keywords?.up  || c.light ).join(', ');
      c.keywordsRev = (c.keywords?.rev || c.shadow).join(', ');
    });
    initThemes();
    buildFlow();
    initFlowControls();
    initCounts();
    initArchive();
    $('#drawBtn').addEventListener('click', doDraw);
    refreshArchive();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
