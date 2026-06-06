/* ============================================================================
 * reading.js — 카드 1장을 '중복 없는' 구조적 해석(HTML)으로 빚는 엔진
 * ----------------------------------------------------------------------------
 * 설계 원칙 = 좋은 타로 리딩의 best practice 10가지 (이 엔진이 강제한다):
 *   1. 카드 우선   카드 고유 재료(서사·상징·빛/그림자·선물)를 먼저, 공용 수사는 보조.
 *   2. 무중복      한 리딩 안에서 같은 문장·단락을 두 번 쓰지 않는다(taker가 강제).
 *   3. 분량은 결과 글자 수 목표로 채우지 않는다 — 할 말이 끝나면 멈춘다(중언부언 금지).
 *   4. 방향 반영   정/역방향에 따라 직접 해석이 실제로 달라진다.
 *   5. 균형        빛과 그림자를 함께 — 역방향은 불길함이 아니라 방향이 바뀐 같은 힘.
 *   6. 절제된 바넘 보편 문장은 최대 2개, '단정'이 아니라 '스스로 비춰 볼 질문'으로 제시.
 *   7. 주체성      카드는 운명을 선고하지 않는다 — 거울일 뿐, 선택은 읽는 이의 몫.
 *   8. 행동가능    성찰에서 멈추지 않고 '오늘 해 볼 한 걸음'으로 닫는다(NEXT_STEP).
 *   9. 재현성      같은 카드+방향 → 항상 같은 글(시드 결정론). 공유·검증 가능.
 *  10. 정직한 표기 오락·성찰용 합성 해석임을 흐리지 않는다(의학·법률·재정 조언 아님).
 *
 * 구조: 서문 → 카드의 서사 → 상징의 해부 → 빛과 그림자 → 지금 이 카드는
 *        → 당신에게 → 더 깊은 거울 → 시간 속에서 → 한 걸음 → 맺음
 * 손으로 쓴 essay 배열이 있으면 엔진을 건너뛰고 그것을 그대로 쓴다.
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

  // best practice #2: 한 리딩 안에서 어떤 풀의 항목도 재사용하지 않는 추출기.
  // 풀이 바닥나면 빈 값을 돌려주므로, 호출부는 없으면 그 문장을 생략한다.
  function makeTaker(rng) {
    const used = new Set();
    function take(arr, n) {
      const avail = RNG.shuffle(arr.filter((x) => !used.has(x)), rng);
      const out = avail.slice(0, n);
      out.forEach((x) => used.add(x));
      return out;
    }
    return {
      take,
      one(arr) { return take(arr, 1)[0] || ''; }
    };
  }

  function essayFromCard(card, reversed) {
    // best practice #1·#9: 손으로 쓴 풀 에세이가 있으면 그대로(결정론적).
    if (card.essay && card.essay.length) {
      return { html: card.essay.join('\n'), words: countWords(card.essay.join(' ')), authored: true };
    }

    const rng = RNG.makeRng(card.id + '|' + (reversed ? 'r' : 'u'));
    const t = makeTaker(rng);
    const ev = LEX.ELEMENT_VOICE[card.element] || LEX.ELEMENT_VOICE['공기'];
    const out = [];

    // 1) 서문 — 원형 + 원소의 목소리 + 정역 프레이밍 (best practice #4)
    out.push(h('서문 — ' + card.ko + ' (' + card.name + ')'));
    out.push(p('<strong>' + card.archetype + '.</strong> ' + t.one(ev)));
    out.push(p(t.one(reversed ? LEX.ORIENTATION.reversed : LEX.ORIENTATION.upright) +
      ' ' + t.one(LEX.REFLECTION)));

    // 2) 카드의 서사 — 그림을 이야기로 (카드 고유 재료, best practice #1)
    out.push(h('카드의 서사'));
    out.push(p(card.scene));
    out.push(p('장면은 멈춘 그림이 아니라 정지된 한 순간이다. 그 순간은 「' + card.archetype +
      '」이라는 한 문장으로 압축되며, 지금 당신이 통과하는 어떤 국면과 겹쳐진다.'));

    // 3) 상징의 해부 — 상징마다 '서로 다른' 다리 (best practice #2)
    out.push(h('상징의 해부'));
    card.symbols.forEach(function (sym) {
      const bridge = t.one(LEX.SYMBOL_BRIDGES); // 바닥나면 ''
      out.push(p('<strong>「' + sym.s + '」</strong> — ' + sym.m + '.' + (bridge ? ' ' + bridge : '')));
    });

    // 4) 빛과 그림자 — 균형 (best practice #5)
    out.push(h('빛과 그림자'));
    out.push(p('<em>빛의 결.</em> 이 카드가 환히 설 때는 이렇게 나타난다 — ' +
      card.light.join('; ') + '. 그 밑바닥에는 하나의 약속이 흐른다: ' + card.gift));
    out.push(p('<em>그림자의 결.</em> 같은 에너지가 막히거나 뒤틀릴 때는 이렇게 드러난다 — ' +
      card.shadow.join('; ') + '. 그러나 그림자는 적이 아니라, 아직 빛으로 번역되지 못한 같은 힘이다.'));

    // 5) 지금 이 카드는 — 뽑힌 방향에 맞춘 직접 해석 (best practice #4·#7)
    out.push(h(reversed ? '지금, 거꾸로 선 이 카드는' : '지금, 똑바로 선 이 카드는'));
    if (reversed) {
      out.push(p('당신에게 온 ' + card.ko + '은(는) 역방향이다. ' + card.shadow[0] +
        '의 기운이 표면 가까이 와 있다는 뜻이지만, 동시에 그것을 의식의 빛 아래로 끌어낼 기회다. ' +
        '밖에서 답을 구하려던 시선을 안으로 돌릴 때, 막혀 있던 흐름이 다시 길을 찾는다.'));
    } else {
      out.push(p('당신에게 온 ' + card.ko + '은(는) 정방향이다. ' + card.light[0] +
        '의 기운이 막힘없이 흐르고 있으니, 의심으로 그 흐름을 거스르기보다 한 걸음 더 신뢰해도 좋다. ' +
        '이 카드는 지금이 망설일 때가 아니라 살아 낼 때임을 일러 준다.'));
    }

    // 6) 당신에게 — 절제된 바넘(최대 2), '단정' 아닌 '질문'으로 (best practice #6)
    out.push(h('당신에게'));
    out.push(p('아래는 당신에 대한 단정이 아니라, 이 카드가 스스로에게 비춰 보라고 건네는 질문이다. ' +
      '맞다고 느껴지는 만큼만 가져가라.'));
    t.take(LEX.BARNUM, 2).forEach(function (b) { out.push(p(b)); });

    // 7) 더 깊은 거울 — 사색 1단락만 (best practice #3: 채우지 않는다)
    const depth = t.one(LEX.DEPTH);
    if (depth) {
      out.push(h('더 깊은 거울'));
      out.push(p(depth));
    }

    // 8) 시간 속에서 — 과거·현재·미래 (현재는 카드 고유 결로)
    out.push(h('시간 속에서 — 과거 · 현재 · 미래'));
    out.push(p('<strong>과거.</strong> ' + LEX.TIME_FRAME.past));
    out.push(p('<strong>현재.</strong> ' + card.archetype + '의 에너지가 지금 당신의 하루하루에 스며 있다. ' +
      (reversed ? card.shadow[Math.min(1, card.shadow.length - 1)] : card.light[Math.min(1, card.light.length - 1)]) +
      ' — 이것이 오늘의 당신을 가장 정확하게 비추는 한 문장이다.'));
    out.push(p('<strong>미래.</strong> ' + LEX.TIME_FRAME.future));

    // 9) 한 걸음 — 행동 처방으로 닫기 (best practice #8)
    out.push(h('한 걸음'));
    out.push(p('<strong>' + card.gift + '</strong> ' + t.one(LEX.NEXT_STEP)));

    // 10) 맺음 — 주체성으로 봉인 (best practice #7·#10)
    out.push(h('맺음'));
    out.push(p(t.one(LEX.CODA)));

    const html = out.join('\n');
    return { html: html, words: countWords(html), authored: false };
  }

  global.TarotReading = { essayFromCard, countWords };
})(typeof window !== 'undefined' ? window : globalThis);
