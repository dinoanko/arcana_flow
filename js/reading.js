/* ============================================================================
 * reading.js — 카드 1장을 '그 카드에 대한' 해석(HTML)으로 빚는 엔진
 * ----------------------------------------------------------------------------
 * 원칙: 해석은 오직 '그 카드 자체의 재료'로만 만든다.
 *   - 누구에게나 들어맞는 범용 점술 문구(바넘)·우주적 철학 잡설은 쓰지 않는다.
 *   - 쓰는 재료는 카드 데이터뿐: 원형·장면·상징·정/역 의미·선물·원소·점성·예아니오.
 *   - 정/역방향에 따라 직접 해석이 실제로 달라진다.
 *   - 분량을 목표로 채우지 않는다(중언부언 금지). 끝나면 멈춘다.
 *   - 같은 카드+방향 → 항상 같은 글(시드 결정론). 손글 essay가 있으면 그것이 우선.
 *   - 마지막 '한 걸음'에서 행동 처방 한 줄만 보편 풀(NEXT_STEP)에서 뽑는다.
 *
 * 구조: 서문 → 카드의 서사 → 상징 읽기 → 지금 이 카드는 → 빛과 그림자
 *        → 한눈에(원소·점성·예아니오) → 한 걸음
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
  function pick(rng, arr) { return arr.length ? arr[Math.floor(rng() * arr.length)] : ''; }

  const YESNO = {
    yes: '대체로 「예」 쪽이다. 흐름이 당신을 지지하고 있으니, 신중함을 핑계로 미루지 않아도 된다.',
    no: '대체로 「아니오」 또는 「아직 아니다」 쪽이다. 지금은 밀어붙이기보다 멈춰 살필 때다.',
    maybe: '예도 아니오도 아닌 「조건부」다. 답은 카드가 아니라, 당신이 무엇을 어떻게 하느냐에 달려 있다.'
  };

  function essayFromCard(card, reversed) {
    // 손으로 쓴 풀 에세이가 있으면 그대로(결정론적).
    if (card.essay && card.essay.length) {
      return { html: card.essay.join('\n'), words: countWords(card.essay.join(' ')), authored: true };
    }

    const rng = RNG.makeRng(card.id + '|' + (reversed ? 'r' : 'u'));
    const ev = LEX.ELEMENT_VOICE[card.element] || LEX.ELEMENT_VOICE['공기'];
    // 뽑힌 방향이 '주', 반대 방향은 '그늘로 곁들임'.
    const primary = reversed ? card.shadow : card.light;
    const counter = reversed ? card.light : card.shadow;
    const out = [];

    // 1) 서문 — 원형 + 원소의 결 + 정역 프레이밍
    out.push(h('서문 — ' + card.ko + ' (' + card.name + ')'));
    out.push(p('<strong>' + card.archetype + '.</strong> ' + pick(rng, ev)));
    out.push(p(pick(rng, reversed ? LEX.ORIENTATION.reversed : LEX.ORIENTATION.upright)));

    // 2) 카드의 서사 — 그림을 이야기로(카드 고유)
    out.push(h('카드의 서사'));
    out.push(p(card.scene));
    out.push(p('이 장면이 한 문장으로 압축되면 「' + card.archetype + '」이 된다. ' +
      '카드가 지금 당신 앞에 놓였다는 것은, 바로 그 한 문장이 지금 당신의 상황과 겹쳐진다는 신호다.'));

    // 3) 상징 읽기 — 카드의 상징과 그 의미(카드 고유). 군더더기 없이 상징만.
    out.push(h('상징 읽기'));
    card.symbols.forEach(function (sym) {
      out.push(p('<strong>「' + sym.s + '」</strong> — ' + sym.m + '.'));
    });

    // 4) 지금 이 카드는 — 뽑힌 방향에 맞춘 직접 해석(카드 고유)
    out.push(h(reversed ? '지금, 거꾸로 선 이 카드는' : '지금, 똑바로 선 이 카드는'));
    if (reversed) {
      out.push(p('역방향으로 온 ' + card.ko + '의 핵심 결은 「' + primary[0] + '」이다. ' +
        '그 기운이 막혀 있거나 안으로 향하고 있다는 뜻이지만, 불길함이 아니라 의식의 빛 아래로 끌어낼 기회다. ' +
        '밖에서 답을 구하던 시선을 안으로 돌릴 때 흐름이 다시 길을 찾는다.'));
    } else {
      out.push(p('정방향으로 온 ' + card.ko + '의 핵심 결은 「' + primary[0] + '」이다. ' +
        '그 기운이 막힘없이 흐르고 있으니, 의심으로 거스르기보다 한 걸음 더 신뢰해도 좋다. ' +
        '이 카드는 지금이 망설일 때가 아니라 살아 낼 때임을 일러 준다.'));
    }

    // 5) 빛과 그림자 — 양면을 함께(카드 고유)
    out.push(h('빛과 그림자'));
    out.push(p('<em>빛의 결.</em> 이 카드가 환히 설 때는 이렇게 나타난다 — ' +
      card.light.join('; ') + '. 그 밑바닥에는 하나의 약속이 흐른다: ' + card.gift));
    out.push(p('<em>그림자의 결.</em> 같은 에너지가 막히거나 뒤틀릴 때는 이렇게 드러난다 — ' +
      card.shadow.join('; ') + '. 그림자는 적이 아니라, 아직 빛으로 번역되지 못한 같은 힘이다.'));
    if (reversed) {
      out.push(p('지금은 역방향이므로, 무엇보다 「' + counter[0] + '」 쪽의 빛을 의식적으로 되찾는 것이 과제다.'));
    }

    // 6) 한눈에 — 원소·점성·예/아니오(카드 고유 메타)
    out.push(h('한눈에'));
    out.push(p('바탕 원소는 <strong>' + card.element + '</strong>' +
      (card.astro ? ', 점성은 <strong>' + card.astro + '</strong>의 기운을 탄다' : '') + '. ' +
      '질문이 예/아니오를 묻는 것이라면 — ' + (YESNO[card.yesno] || YESNO.maybe)));

    // 7) 한 걸음 — 카드의 선물 + 오늘 해 볼 행동 한 줄
    out.push(h('한 걸음'));
    out.push(p('<strong>' + card.gift + '</strong> ' + pick(rng, LEX.NEXT_STEP)));

    const html = out.join('\n');
    return { html: html, words: countWords(html), authored: false };
  }

  global.TarotReading = { essayFromCard, countWords };
})(typeof window !== 'undefined' ? window : globalThis);
