/* ============================================================================
 * rng.js — 시간(밀리초) 연동 결정론적 난수 / 추첨 알고리즘
 * ----------------------------------------------------------------------------
 * 설계 의도
 *  - "뽑는 그 순간"을 시드로 만든다: Date.now()의 밀리초 + performance.now()의
 *    마이크로초 분해능 + 약간의 하드웨어 엔트로피(Crypto)까지 섞어, 같은 초라도
 *    클릭 타이밍의 미세한 차이가 전혀 다른 스프레드로 발산하도록 한다.
 *  - 동시에 '시드'를 기록해 둔다. 같은 시드 → 같은 결과(재현 가능). 아카이브에
 *    저장된 과거 추첨을 똑같이 복원하거나 공유할 수 있다.
 *  - 알고리즘: SplitMix64 식 해시로 시드를 정련한 뒤 Mulberry32로 스트림 생성.
 *    Fisher–Yates로 78장에서 N장을 비복원 추출, 각 카드의 정/역방향도 같은
 *    스트림에서 결정한다.
 * ==========================================================================*/
(function (global) {
  'use strict';

  // 32-bit Mulberry32 PRNG — 빠르고 분포가 고른 결정론적 스트림.
  function mulberry32(a) {
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // 문자열/수치 혼합 시드를 32-bit 정수로 으깨는 해시 (xmur3 변형).
  function hashSeed(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  }

  // 추첨 순간의 엔트로피를 모아 사람이 공유할 수 있는 시드 문자열로 만든다.
  function freshSeed() {
    const now = Date.now();                       // 밀리초 (벽시계)
    const hi = (typeof performance !== 'undefined' && performance.now)
      ? performance.now()                         // 마이크로초 분해능 (단조 증가)
      : Math.random() * 1000;
    let salt = '';
    try {
      const buf = new Uint32Array(2);
      (global.crypto || global.msCrypto).getRandomValues(buf);
      salt = buf[0].toString(36) + buf[1].toString(36);
    } catch (e) {
      salt = Math.floor(Math.random() * 0xffffffff).toString(36);
    }
    // 밀리초·마이크로초·엔트로피를 모두 보존한 사람이 읽을 수 있는 시드.
    const ms = now % 1000;
    return `${now.toString(36)}.${ms.toString().padStart(3, '0')}.` +
           `${Math.floor(hi * 1000).toString(36)}.${salt}`;
  }

  // 시드 문자열로부터 PRNG 함수를 만든다.
  function makeRng(seedStr) {
    return mulberry32(hashSeed(String(seedStr)));
  }

  // Fisher–Yates: 배열을 시드 스트림으로 섞는다(원본 비파괴).
  function shuffle(arr, rng) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /**
   * 추첨: deckSize장에서 count장을 비복원 추출 + 각 카드 정/역방향 결정.
   * @returns {{seed, drawnAt, picks:[{index, reversed}]}}
   */
  function draw(deckSize, count, seedStr) {
    const seed = seedStr || freshSeed();
    const rng = makeRng(seed);
    // 시드 스트림을 몇 번 돌려 초기 상관을 흘려보낸다(warm-up).
    for (let i = 0; i < 8; i++) rng();
    const order = shuffle(
      Array.from({ length: deckSize }, (_, i) => i),
      rng
    );
    const chosen = order.slice(0, count);
    const picks = chosen.map((index) => ({
      index,
      // 전통적으로 역방향 확률은 정방향보다 낮게(여기선 38%) 잡아
      // 정방향이 약간 더 자주 나오도록 한다.
      reversed: rng() < 0.38
    }));
    return { seed, drawnAt: Date.now(), picks };
  }

  global.TarotRNG = { freshSeed, makeRng, shuffle, draw, hashSeed };
})(typeof window !== 'undefined' ? window : globalThis);
