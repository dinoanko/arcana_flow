/* ============================================================================
 * reading.js — 카드 1장을 ~3000단어 구조적 에세이(HTML)로 빚는 해석 엔진
 * ----------------------------------------------------------------------------
 * 구조(노션식 섹션):
 *   1) 서문            원형·원소의 목소리·정역 프레이밍
 *   2) 카드의 서사     그림 장면을 이야기로 풀어냄 (스토리텔링)
 *   3) 상징의 해부     상징별 상세 분석
 *   4) 빛과 그림자     정방향 국면 / 역방향 그림자
 *   5) 지금 이 카드는  뽑힌 방향(정/역)에 맞춘 직접 해석
 *   6) 당신에게        바넘 효과를 유도하는 정서적 리딩
 *   7) 시간 속에서     과거·현재·미래의 결
 *   8) 맺음            카드의 선물 + 아포리즘
 * 카드 시드로 결정론적 선택 → 같은 카드·같은 방향은 늘 같은 글을 얻는다.
 * 손으로 쓴 essay 배열이 있으면 엔진을 건너뛰고 그것을 그대로 쓴다.
 * ==========================================================================*/
(function (global) {
  'use strict';

  const LEX = global.TAROT_LEXICON;
  const RNG = global.TarotRNG;
  const TARGET_WORDS = 2600; // 한국어 어절 기준 목표(긴 장문 에세이 분량)

  function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }
  function shuffled(rng, arr) { return RNG.shuffle(arr, rng); }
  function countWords(html) {
    const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return text ? text.split(' ').length : 0;
  }
  function p(s) { return '<p>' + s + '</p>'; }
  function h(s) { return '<h3>' + s + '</h3>'; }

  function essayFromCard(card, reversed) {
    // 손으로 쓴 풀 에세이가 있으면 그것을 사용.
    if (card.essay && card.essay.length) {
      return { html: card.essay.join('\n'), words: countWords(card.essay.join(' ')), authored: true };
    }
    const rng = RNG.makeRng(card.id + '|' + (reversed ? 'r' : 'u'));
    const ev = LEX.ELEMENT_VOICE[card.element] || LEX.ELEMENT_VOICE['공기'];
    const out = [];

    // 1) 서문
    out.push(h('서문 — ' + card.ko + ' (' + card.name + ')'));
    out.push(p('<strong>' + card.archetype + '.</strong> ' + pick(rng, ev)));
    out.push(p(pick(rng, reversed ? LEX.ORIENTATION.reversed : LEX.ORIENTATION.upright) +
      ' ' + pick(rng, LEX.REFLECTION)));

    // 2) 카드의 서사
    out.push(h('카드의 서사'));
    out.push(p(card.scene));
    out.push(p('장면을 가만히 들여다보면, 거기엔 멈춰 있는 그림이 아니라 하나의 순간이 정지된 채 담겨 있다. ' +
      '그 순간은 ' + card.archetype + '이라는 한 문장으로 압축되며, 동시에 당신이 지금 통과하고 있는 어떤 국면과 겹쳐진다. ' +
      pick(rng, LEX.REFLECTION)));

    // 3) 상징의 해부
    out.push(h('상징의 해부'));
    shuffled(rng, card.symbols).forEach(function (sym) {
      out.push(p('<strong>「' + sym.s + '」</strong> — ' + sym.m + '. ' +
        pick(rng, LEX.SYMBOL_BRIDGES)));
    });

    // 4) 빛과 그림자
    out.push(h('빛과 그림자'));
    out.push(p('<em>빛의 결.</em> 이 카드가 환히 설 때, 그것은 이렇게 나타난다 — ' +
      card.light.join('; ') + '. 이 모든 결의 밑바닥에는 하나의 약속이 흐른다: ' + card.gift));
    out.push(p('<em>그림자의 결.</em> 같은 에너지가 막히거나 뒤틀릴 때는 이렇게 드러난다 — ' +
      card.shadow.join('; ') + '. 그러나 그림자는 적이 아니라, 아직 빛으로 번역되지 못한 같은 힘일 뿐이다.'));

    // 5) 지금 이 카드는 (뽑힌 방향)
    out.push(h(reversed ? '지금, 거꾸로 선 이 카드는' : '지금, 똑바로 선 이 카드는'));
    if (reversed) {
      out.push(p('당신에게 온 ' + card.ko + '은(는) 역방향이다. 이는 ' + card.shadow[0] +
        '의 기운이 표면 가까이 와 있다는 뜻이지만, 동시에 그것을 의식의 빛 아래로 끌어낼 기회이기도 하다. ' +
        '밖에서 답을 구하려던 시선을 안으로 돌릴 때, 막혀 있던 흐름이 다시 길을 찾는다.'));
    } else {
      out.push(p('당신에게 온 ' + card.ko + '은(는) 정방향이다. ' + card.light[0] +
        '의 기운이 막힘없이 흐르고 있으니, 의심으로 그 흐름을 거스르기보다 한 걸음 더 신뢰해도 좋다. ' +
        '이 카드는 지금이 망설일 때가 아니라 살아 낼 때임을 일러 준다.'));
    }
    out.push(p(LEX.TIME_FRAME.present));

    // 6) 당신에게 (바넘 리딩)
    out.push(h('당신에게'));
    shuffled(rng, LEX.BARNUM).slice(0, 4).forEach(function (b) { out.push(p(b)); });

    // 7) 시간 속에서
    out.push(h('시간 속에서 — 과거 · 현재 · 미래'));
    out.push(p('<strong>과거.</strong> ' + LEX.TIME_FRAME.past));
    out.push(p('<strong>현재.</strong> ' + card.archetype + '의 에너지가 지금 당신의 하루하루에 스며 있다. ' +
      (reversed ? card.shadow[Math.min(1, card.shadow.length - 1)] : card.light[Math.min(1, card.light.length - 1)]) +
      ' — 이것이 오늘의 당신을 가장 정확하게 비추는 한 문장이다.'));
    out.push(p('<strong>미래.</strong> ' + LEX.TIME_FRAME.future));

    // 8) 맺음
    out.push(h('맺음'));
    out.push(p('<strong>' + card.gift + '</strong> ' + pick(rng, LEX.CODA)));

    // 분량 보강: '깊이' 단락과 (사색+바넘) 조합을 각 항목당 최대 1회만 써서
    // 한 카드 안에서 같은 문단이 반복되지 않도록 한다. 목표에 닿거나 풀이
    // 소진되면 멈춘다.
    const depth = shuffled(rng, LEX.DEPTH);
    const moreBarnum = shuffled(rng, LEX.BARNUM);
    const moreRefl = shuffled(rng, LEX.REFLECTION);
    const pool = [];
    depth.forEach((d, k) => {
      pool.push(p(d));
      if (k < moreBarnum.length) {
        pool.push(p(moreRefl[k % moreRefl.length] + ' ' + moreBarnum[k]));
      }
    });
    for (let k = depth.length; k < moreBarnum.length; k++) {
      pool.push(p(moreRefl[k % moreRefl.length] + ' ' + moreBarnum[k]));
    }
    const inserted = [];
    function lenOf() { return countWords(out.join('\n') + '\n' + inserted.join('\n')); }
    for (let k = 0; k < pool.length && lenOf() < TARGET_WORDS; k++) {
      inserted.push(pool[k]);
    }
    if (inserted.length) {
      // '시간 속에서' 섹션 앞에 '더 깊은 거울'로 묶어 자연스럽게 덧댄다.
      const at = out.indexOf(h('시간 속에서 — 과거 · 현재 · 미래'));
      const block = [h('더 깊은 거울')].concat(inserted);
      out.splice(at < 0 ? out.length : at, 0, block.join('\n'));
    }
    const html = out.join('\n');
    return { html: html, words: countWords(html), authored: false };
  }

  global.TarotReading = { essayFromCard, countWords };
})(typeof window !== 'undefined' ? window : globalThis);
