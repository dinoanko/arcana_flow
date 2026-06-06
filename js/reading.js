/* reading.js — essays.js의 손글 에세이 우선, 없으면 카드 데이터로 조립 */
(function (global) {
  'use strict';
  const LEX = global.TAROT_LEXICON;
  const RNG = global.TarotRNG;
  const ESSAYS = global.TAROT_ESSAYS || {};

  function countWords(html) {
    return html.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().split(' ').length;
  }
  function p(s){ return '<p>'+s+'</p>'; }
  function h(s){ return '<h3>'+s+'</h3>'; }
  function pick(rng,arr){ return arr&&arr.length?arr[Math.floor(rng()*arr.length)]:''; }

  function essayFromCard(card, reversed) {
    // 손글 에세이 우선
    const bucket = ESSAYS[card.id];
    if (bucket) {
      const data = reversed ? (bucket.reversed || bucket.upright) : bucket.upright;
      if (data && data.length) {
        return { html: data.join('\n'), words: countWords(data.join(' ')), authored: true };
      }
    }
    // 구형 essay 필드 호환
    if (card.essay && card.essay.length) {
      return { html: card.essay.join('\n'), words: countWords(card.essay.join(' ')), authored: true };
    }

    // ── 폴백 엔진: 카드 고유 데이터로만 조립 ──────────────────────────────
    const rng = RNG.makeRng(card.id+'|'+(reversed?'r':'u'));
    const ko = card.ko;
    const primary = reversed ? card.shadow : card.light;
    const counter = reversed ? card.light : card.shadow;
    const eTrait = pick(rng,(LEX.ELEMENT_TRAIT[card.element]||LEX.ELEMENT_TRAIT['공기']));
    const oTrait = pick(rng,reversed?LEX.ORIENT_TRAIT.reversed:LEX.ORIENT_TRAIT.upright);
    const yn = LEX.YESNO_SHORT[card.yesno]||LEX.YESNO_SHORT.maybe;
    const out = [];

    out.push(h('서문 — '+ko+' ('+card.name+')'));
    out.push(p('<strong>'+ko+'</strong> — '+card.archetype+'.'));
    out.push(p('원소로 보면 '+ko+'은(는) '+eTrait+'이다.'));
    out.push(p(ko+'은(는) '+oTrait+'.'));
    out.push(p(card.scene));
    out.push(p('<strong>「'+ko+'」의 상징</strong> — '+
      card.symbols.map(s=>s.s+'('+s.m+')').join('; ')+'.'));
    out.push(p('<strong>지금 '+ko+'의 핵심 결</strong> — 「'+primary[0]+'」이다.'));
    if(reversed) out.push(p('역방향이므로 '+ko+'은(는) 「'+counter[0]+'」의 빛을 의식적으로 되찾아야 한다.'));
    out.push(p('<strong>'+ko+'의 빛</strong> — '+card.light.join('; ')+'.'));
    out.push(p('<strong>'+ko+'의 그림자</strong> — '+card.shadow.join('; ')+'.'));
    out.push(p('<strong>'+ko+' 한눈에</strong> — 바탕 원소 '+card.element+
      (card.astro?', 점성 '+card.astro:'')+'; 예/아니오로는 '+yn+'.'));
    out.push(p('<strong>'+ko+'이(가) 건네는 선물</strong> — '+card.gift+(/[.!?]$/.test(card.gift)?'':'.')));

    const html = out.join('\n');
    return { html, words: countWords(html), authored: false };
  }

  global.TarotReading = { essayFromCard, countWords };
})(typeof window !== 'undefined' ? window : globalThis);
