/* ============================================================================
 * archive.js — 뽑았던 카드 기록 보관소 (localStorage 기반)
 * ----------------------------------------------------------------------------
 *  - 추첨 1건 = { id, seed, drawnAt, count, picks:[{index, reversed}], note }
 *  - 시드를 함께 저장하므로 언제든 똑같은 스프레드를 복원/공유할 수 있다.
 *  - 최신순으로 정렬해 리스트업한다. 용량 보호를 위해 최대 300건 유지.
 * ==========================================================================*/
(function (global) {
  'use strict';
  const KEY = 'tarot.archive.v1';
  const MAX = 300;

  function _read() {
    try {
      const raw = global.localStorage.getItem(KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }
  function _write(arr) {
    try { global.localStorage.setItem(KEY, JSON.stringify(arr.slice(0, MAX))); }
    catch (e) { /* 사적/꽉 찬 저장소 — 조용히 무시 */ }
  }

  function add(entry) {
    const list = _read();
    const id = 'd' + entry.drawnAt.toString(36) + Math.floor(Math.random() * 1e4).toString(36);
    const rec = Object.assign({ id, note: '' }, entry);
    list.unshift(rec);          // 최신이 맨 앞
    _write(list);
    return rec;
  }

  function all() { return _read(); }

  function get(id) { return _read().find((r) => r.id === id) || null; }

  function remove(id) { _write(_read().filter((r) => r.id !== id)); }

  function setNote(id, note) {
    const list = _read();
    const r = list.find((x) => x.id === id);
    if (r) { r.note = String(note || '').slice(0, 280); _write(list); }
  }

  function clear() { _write([]); }

  global.TarotArchive = { add, all, get, remove, setNote, clear };
})(typeof window !== 'undefined' ? window : globalThis);
