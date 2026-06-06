/* ============================================================================
 * reading.js — 카드 1장을 '그 카드만의' 해석(HTML)으로 빚는 엔진
 * ----------------------------------------------------------------------------
 * 핵심 불변식: 본문의 모든 문장은 카드 이름(card.ko)을 담는다.
 *   card.ko 는 78장이 전부 서로 다르므로(메이저 고유명 + 마이너 '수트 랭크'),
 *   문장에 card.ko 가 들어가면 그 문장은 전 덱에서 유일해진다.
 *   ⇒ 어떤 두 카드도 똑같은 본문 문장을 가질 수 없다(검증: scripts 없이 node로 확인).
 * 그래서 누구에게나 들어맞는 범용 점술 문구·고정 연결어 같은
 * '카드 이름 없는 문장'은 일절 쓰지 않는다. 보조 구절(lexicon)은
 * 반드시 card.ko 가 든 한 문장 안에 끼워 넣는다.
 *
 * 예외는 card.scene 뿐 — 장면 묘사는 카드별로 이미 고유한 산문이다.
 * 정/역방향에 따라 핵심 결이 달라지고, 분량은 채우지 않는다(중언부언 금지).
 * 손으로 쓴 essay 가 있으면 그것이 우선한다.
 * ==========================================================================*/
(function (global) {
  'use strict';

  const LEX = global.TAROT_LEXICON;
  const RNG = global.TarotRNG;

  function countWords(html) {
    const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return text ? text.split(' ').length : 0;
  }
  function p(s) { return '<p>' + s + '</p>'; }
  function h(s) { return '<h3>' + s + '</h3>'; }
  function pick(rng, arr) { return arr && arr.length ? arr[Math.floor(rng() * arr.length)] : ''; }

  function essayFromCard(card, reversed) {
    // 손으로 쓴 풀 에세이가 있으면 그대로(결정론적).
    if (card.essay && card.essay.length) {
      return { html: card.essay.join('\n'), words: countWords(card.essay.join(' ')), authored: true };
    }

    const rng = RNG.makeRng(card.id + '|' + (reversed ? 'r' : 'u'));
    const ko = card.ko;                       // 전 덱에서 유일한 토큰
    const primary = reversed ? card.shadow : card.light;
    const counter = reversed ? card.light : card.shadow;
    const eTrait = pick(rng, (LEX.ELEMENT_TRAIT[card.element] || LEX.ELEMENT_TRAIT['공기']));
    const oTrait = pick(rng, reversed ? LEX.ORIENT_TRAIT.reversed : LEX.ORIENT_TRAIT.upright);
    const yn = LEX.YESNO_SHORT[card.yesno] || LEX.YESNO_SHORT.maybe;
    const out = [];

    // 유일한 제목만 헤딩으로 둔다(ko 포함 → 카드마다 다름). 본문엔 공유 헤딩 없음.
    out.push(h('서문 — ' + ko + ' (' + card.name + ')'));

    // 원형·원소·정역 (모든 문장에 ko)
    out.push(p('<strong>' + ko + '</strong> — ' + card.archetype + '.'));
    out.push(p('원소로 보면 ' + ko + '은(는) ' + eTrait + '이다.'));
    out.push(p(ko + '은(는) ' + oTrait + '.'));

    // 장면(카드별 고유 산문)
    out.push(p(card.scene));

    // 상징 — 한 문장에 ko + 상징 목록(라벨은 마침표 없이 — 로 이어 붙인다)
    out.push(p('<strong>「' + ko + '」의 상징</strong> — ' +
      card.symbols.map(function (s) { return s.s + '(' + s.m + ')'; }).join('; ') + '.'));

    // 뽑힌 방향의 핵심 결
    out.push(p('<strong>지금 ' + ko + '의 핵심 결</strong> — 「' + primary[0] + '」이다.'));
    if (reversed) {
      out.push(p('역방향이므로 ' + ko + '은(는) 「' + counter[0] + '」의 빛을 의식적으로 되찾아야 한다.'));
    }

    // 빛과 그림자 (각 문장에 ko)
    out.push(p('<strong>' + ko + '의 빛</strong> — ' + card.light.join('; ') + '.'));
    out.push(p('<strong>' + ko + '의 그림자</strong> — ' + card.shadow.join('; ') + '.'));

    // 메타(원소·점성·예아니오)
    out.push(p('<strong>' + ko + ' 한눈에</strong> — 바탕 원소 ' + card.element +
      (card.astro ? ', 점성 ' + card.astro : '') + '; 예/아니오로는 ' + yn + '.'));

    // 이 카드의 선물(이미 마침표로 끝나는 gift 는 중복 마침표를 피한다)
    out.push(p('<strong>' + ko + '이(가) 건네는 선물</strong> — ' + card.gift +
      (/[.!?]$/.test(card.gift) ? '' : '.')));

    const html = out.join('\n');
    return { html: html, words: countWords(html), authored: false };
  }

  global.TarotReading = { essayFromCard, countWords };
})(typeof window !== 'undefined' ? window : globalThis);
