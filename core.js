/* Deterministic question forms, clocks and statistics. No browser dependencies. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.StepCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const VERSION = 1;
  const QUOTAS = Object.freeze({ human_development: 5, blood_immune: 30, behavioral_neuro: 33, msk_skin: 28, cardiovascular: 25, respiratory_renal: 36, gastrointestinal: 22, reproductive_endocrine: 39, multisystem: 27, biostatistics: 14, communication: 21 });
  const LABELS = Object.freeze({ human_development: 'Desarrollo humano', blood_immune: 'Sangre e inmunología', behavioral_neuro: 'Conducta y neurociencias', msk_skin: 'Músculo, esqueleto y piel', cardiovascular: 'Cardiovascular', respiratory_renal: 'Respiratorio y renal', gastrointestinal: 'Gastrointestinal', reproductive_endocrine: 'Reproductivo y endocrino', multisystem: 'Procesos multisistémicos', biostatistics: 'Bioestadística y epidemiología', communication: 'Comunicación y habilidades sociales' });
  const BLOCK_SIZE = 20, BLOCK_MS = 30 * 60 * 1000, TUTORIAL_MS = 5 * 60 * 1000, BREAK_MS = 55 * 60 * 1000, DAY_MS = 8 * 60 * 60 * 1000;
  function hash32(text) { let h = 2166136261; for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { let a = hash32(String(seed)); return function () { a += 0x6D2B79F5; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function shuffle(values, seed) { const out = values.slice(), random = typeof seed === 'function' ? seed : rng(seed); for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; } return out; }
  function validateBank(questions, expected = 2800) {
    const errors = [], ids = new Set(), counts = Object.fromEntries(Object.keys(QUOTAS).map(k => [k, 0]));
    if (!Array.isArray(questions)) return ['El banco no contiene una lista de preguntas.'];
    if (expected && questions.length !== expected) errors.push(`Hay ${questions.length} preguntas; se esperaban ${expected}.`);
    for (const q of questions) {
      if (!q || typeof q.id !== 'string' || !q.id || ids.has(q.id)) errors.push(`ID ausente o repetido: ${q && q.id}.`);
      if (q && typeof q.id === 'string') ids.add(q.id);
      if (!q || !Object.prototype.hasOwnProperty.call(counts, q.category)) errors.push(`Categoría inválida: ${q && q.id}.`); else counts[q.category]++;
      if (!q || !Array.isArray(q.options) || q.options.length !== 5 || q.options.some(x => typeof x !== 'string' || !x.trim()) || new Set(q.options.map(x => String(x).trim().toLowerCase())).size !== 5) errors.push(`Opciones inválidas: ${q && q.id}.`);
      if (!q || !Number.isInteger(q.answer) || q.answer < 0 || q.answer >= (q.options || []).length) errors.push(`Clave inválida: ${q && q.id}.`);
      if (!q || !Array.isArray(q.distractors) || q.distractors.length !== 5 || q.distractors.some(x => typeof x !== 'string' || !x.trim())) errors.push(`Explicaciones de opciones inválidas: ${q && q.id}.`);
      for (const field of ['chapter', 'topic', 'objective', 'stem', 'explanation', 'takeaway']) if (!q || typeof q[field] !== 'string' || !q[field].trim()) errors.push(`Campo ${field} ausente: ${q && q.id}.`);
      if (!q || !Array.isArray(q.sourcePages) || !q.sourcePages.length || q.sourcePages.some(p => !Number.isInteger(p) || p < 1 || p > 869)) errors.push(`Página de referencia inválida: ${q && q.id}.`);
    }
    if (expected === 2800) for (const [k, quota] of Object.entries(QUOTAS)) if (counts[k] !== quota * 10) errors.push(`La categoría ${k} tiene ${counts[k]}; se esperaban ${quota * 10}.`);
    return errors;
  }
  function formGenerator(questions) {
    const pools = Object.fromEntries(Object.keys(QUOTAS).map(category => [category, questions.filter(q => q.category === category).map(q => q.id).sort()]));
    for (const [category, quota] of Object.entries(QUOTAS)) if (pools[category].length !== quota * 10) throw new Error(`Balance incorrecto en ${category}.`);
    const partitions = Object.fromEntries(Object.entries(pools).map(([k, ids]) => [k, shuffle(ids, `step1-partition-v1:${k}`)]));
    return function (number) {
      if (!Number.isInteger(number) || number < 1 || number > 280) throw new Error('La versión debe estar entre 1 y 280.');
      const selected = [];
      for (const [category, quota] of Object.entries(QUOTAS)) {
        const part = number <= 10 ? partitions[category].slice((number - 1) * quota, number * quota) : shuffle(pools[category], `step1-form-v1:${number}:${category}`).slice(0, quota);
        selected.push(...part);
      }
      return shuffle(selected, `step1-order-v1:${number}`);
    };
  }
  function generateForms(questions) { const get = formGenerator(questions); return Array.from({ length: 280 }, (_, i) => ({ number: i + 1, questionIds: get(i + 1) })); }
  function createExamSession(questionIds, formNumber, now, id) {
    if (questionIds.length !== 280 || new Set(questionIds).size !== 280) throw new Error('Se requieren 280 preguntas diferentes.');
    return { id, mode: 'exam', formNumber, status: 'active', questionIds: questionIds.slice(), responses: {}, blockIndex: 0, currentIndex: 0, stage: 'tutorial', startedAt: now, stageStartedAt: now, deadlineAt: now + TUTORIAL_MS, dayDeadlineAt: now + DAY_MS, breakBankMs: BREAK_MS, closedBlocks: [], finishedAt: null };
  }
  function createStudySession(questionIds, timed, now, id, title) {
    if (!questionIds.length || new Set(questionIds).size !== questionIds.length) throw new Error('La sesión debe tener preguntas diferentes.');
    return { id, mode: 'study', title: title || 'Práctica', status: 'active', questionIds: questionIds.slice(), responses: {}, currentIndex: 0, stage: 'study', startedAt: now, deadlineAt: timed ? now + questionIds.length * 90 * 1000 : null, pausedRemainingMs: null, closedBlocks: [], finishedAt: null };
  }
  function commitQuestion(s, qid, at, forceUnanswered) {
    const r = s.responses[qid] || (s.responses[qid] = {});
    if (r.committed) return;
    if (forceUnanswered || !Number.isInteger(r.answer)) r.answer = null;
    r.committed = true; r.submittedAt = at;
  }
  function closeBlock(s, at) {
    if (s.closedBlocks.includes(s.blockIndex)) return;
    const start = s.blockIndex * BLOCK_SIZE;
    for (const qid of s.questionIds.slice(start, start + BLOCK_SIZE)) commitQuestion(s, qid, at, false);
    s.closedBlocks.push(s.blockIndex);
  }
  function completeSession(s, at, reason) {
    for (const qid of s.questionIds) commitQuestion(s, qid, at, s.mode === 'study');
    s.status = 'complete'; s.stage = 'complete'; s.finishedAt = at; s.finishReason = reason || 'submitted'; s.deadlineAt = null;
    return s;
  }
  function startBlock(s, at) { s.stage = 'block'; s.stageStartedAt = at; s.deadlineAt = at + BLOCK_MS; s.currentIndex = s.blockIndex * BLOCK_SIZE; }
  function endTutorial(s, at) {
    if (s.stage !== 'tutorial') return s;
    const boundary = Math.min(at, s.deadlineAt);
    s.breakBankMs += Math.max(0, s.deadlineAt - boundary);
    startBlock(s, boundary); return s;
  }
  function endExamBlock(s, at) {
    if (s.stage !== 'block' || s.status !== 'active') return s;
    const boundary = Math.min(at, s.deadlineAt);
    s.breakBankMs += Math.max(0, s.deadlineAt - boundary); closeBlock(s, boundary);
    if (s.blockIndex === 13) return completeSession(s, boundary, 'submitted');
    s.blockIndex++; s.stage = 'break'; s.stageStartedAt = boundary; s.deadlineAt = boundary + s.breakBankMs;
    return s;
  }
  function endBreak(s, at) {
    if (s.stage !== 'break') return s;
    const boundary = Math.min(at, s.deadlineAt);
    s.breakBankMs = Math.max(0, s.breakBankMs - (boundary - s.stageStartedAt)); startBlock(s, boundary); return s;
  }
  function advanceSession(s, now) {
    if (!s || s.status !== 'active') return s;
    if (s.mode === 'study') { if (s.deadlineAt !== null && now >= s.deadlineAt) completeSession(s, s.deadlineAt, 'time'); return s; }
    // Boundaries come from saved absolute deadlines, never from the refresh time.
    let guard = 0;
    while (s.status === 'active' && now >= s.deadlineAt && guard++ < 40) {
      if (s.stage === 'tutorial') endTutorial(s, s.deadlineAt);
      else if (s.stage === 'block') endExamBlock(s, s.deadlineAt);
      else if (s.stage === 'break') endBreak(s, s.deadlineAt);
      else break;
    }
    if (s.status === 'active' && now >= s.dayDeadlineAt) completeSession(s, s.dayDeadlineAt, 'day_time');
    return s;
  }
  function pauseStudy(s, now) { if (s.mode !== 'study' || s.status !== 'active' || s.pausedRemainingMs !== null) return s; advanceSession(s, now); if (s.status !== 'active') return s; s.pausedRemainingMs = s.deadlineAt === null ? -1 : Math.max(0, s.deadlineAt - now); s.deadlineAt = null; return s; }
  function resumeStudy(s, now) { if (s.mode !== 'study' || s.pausedRemainingMs === null) return s; s.deadlineAt = s.pausedRemainingMs === -1 ? null : now + s.pausedRemainingMs; s.pausedRemainingMs = null; return s; }
  function attemptFor(s, q, r) { return { id: `${s.id}:${q.id}`, sessionId: s.id, questionId: q.id, answer: r.answer, correct: r.answer === q.answer, unanswered: r.answer === null, mode: s.mode, timestamp: r.submittedAt, category: q.category, chapter: q.chapter, topic: q.topic }; }
  function ingestAttempts(profile, session, questionsById) {
    if (session.mode === 'exam' && session.status !== 'complete') return 0;
    const existing = new Set(profile.attempts.map(a => a.id)); let added = 0;
    for (const qid of session.questionIds) { const r = session.responses[qid], q = questionsById.get(qid); if (r && r.committed && q) { const a = attemptFor(session, q, r); if (!existing.has(a.id)) { profile.attempts.push(a); existing.add(a.id); added++; } } }
    return added;
  }
  function firstAttempts(attempts) { const first = new Map(); for (const a of attempts) { const old = first.get(a.questionId); if (!old || a.timestamp < old.timestamp) first.set(a.questionId, a); } return [...first.values()]; }
  function calculateStats(attempts, firstOnly) {
    const selected = firstOnly ? firstAttempts(attempts) : attempts, categories = {}, topics = {};
    const add = (obj, key, a) => { const row = obj[key] || (obj[key] = { total: 0, correct: 0, incorrect: 0, unanswered: 0 }); row.total++; row.correct += a.correct ? 1 : 0; row.incorrect += a.correct ? 0 : 1; row.unanswered += a.unanswered ? 1 : 0; };
    for (const a of selected) { add(categories, a.category, a); const topicKey = `${a.category}\u0000${a.topic}`; add(topics, topicKey, a); topics[topicKey].category = a.category; topics[topicKey].topic = a.topic; }
    const correct = selected.reduce((n, a) => n + Number(a.correct), 0), unanswered = selected.filter(a => a.unanswered).length;
    return { total: selected.length, correct, incorrect: selected.length - correct, unanswered, accuracy: selected.length ? correct / selected.length : null, categories, topics };
  }
  function orderedQuestions(questions) { return questions.slice().sort((a, b) => Math.min(...a.sourcePages) - Math.min(...b.sourcePages) || a.chapter.localeCompare(b.chapter) || a.id.localeCompare(b.id)); }
  function filterQuestions(questions, filters, profile) {
    const last = new Map(); for (const a of profile.attempts) { const old = last.get(a.questionId); if (!old || a.timestamp >= old.timestamp) last.set(a.questionId, a); }
    const starred = new Set(profile.bookmarks);
    return questions.filter(q => (!filters.category || q.category === filters.category) && (!filters.chapter || q.chapter === filters.chapter) && (!filters.topic || q.topic === filters.topic) && (!filters.search || `${q.topic} ${q.objective} ${q.id}`.toLowerCase().includes(filters.search.toLowerCase())) && (filters.status === 'unseen' ? !last.has(q.id) : filters.status === 'incorrect' ? last.has(q.id) && !last.get(q.id).correct : filters.status === 'bookmarked' ? starred.has(q.id) : true));
  }
  function newProfile(username) { return { version: VERSION, username, createdAt: Date.now(), attempts: [], bookmarks: [], activeSession: null, completedSessions: [], preferences: { firstStats: true, fontSize: 'normal' } }; }
  function validateProfile(p, username, questionsById) {
    if (!p || p.version !== VERSION || p.username !== username) throw new Error('El respaldo pertenece a otro usuario o usa un formato incompatible.');
    if (!Array.isArray(p.attempts) || !Array.isArray(p.bookmarks) || !Array.isArray(p.completedSessions) || typeof p.preferences !== 'object' || !p.preferences) throw new Error('El respaldo está incompleto.');
    if (p.preferences.fontSize !== undefined && !['normal', 'large', 'xlarge'].includes(p.preferences.fontSize)) throw new Error('La preferencia de texto es inválida.');
    if (p.attempts.length > 300000 || p.completedSessions.length > 10000 || p.bookmarks.length > questionsById.size) throw new Error('El respaldo excede los límites permitidos.');
    const ids = new Set();
    for (const a of p.attempts) { const q = a && questionsById.get(a.questionId); if (!q || typeof a.id !== 'string' || ids.has(a.id) || typeof a.sessionId !== 'string' || a.id !== `${a.sessionId}:${a.questionId}` || !(a.answer === null || (Number.isInteger(a.answer) && a.answer >= 0 && a.answer < q.options.length)) || !Number.isFinite(a.timestamp) || a.timestamp < 0 || a.correct !== (a.answer === q.answer) || a.unanswered !== (a.answer === null) || a.category !== q.category || a.chapter !== q.chapter || a.topic !== q.topic || !['study', 'exam'].includes(a.mode)) throw new Error('El respaldo contiene intentos inconsistentes.'); ids.add(a.id); }
    if (new Set(p.bookmarks).size !== p.bookmarks.length || p.bookmarks.some(qid => !questionsById.has(qid))) throw new Error('Los marcadores son inválidos.');
    const sessions = p.completedSessions.concat(p.activeSession ? [p.activeSession] : []), sessionIds = new Set(), sessionMap = new Map();
    for (const s of sessions) {
      if (!s || typeof s.id !== 'string' || sessionIds.has(s.id) || !['study', 'exam'].includes(s.mode) || !['active', 'complete'].includes(s.status) || !Array.isArray(s.questionIds) || s.questionIds.length < 1 || s.questionIds.length > 280 || new Set(s.questionIds).size !== s.questionIds.length || s.questionIds.some(id => !questionsById.has(id)) || !Number.isInteger(s.currentIndex) || s.currentIndex < 0 || s.currentIndex >= s.questionIds.length || !s.responses || typeof s.responses !== 'object' || !Number.isFinite(s.startedAt)) throw new Error('El respaldo contiene una sesión inválida.');
      sessionIds.add(s.id); sessionMap.set(s.id, s);
      if (s.mode === 'exam' && (s.questionIds.length !== 280 || !Number.isInteger(s.formNumber) || s.formNumber < 1 || s.formNumber > 280 || !Number.isInteger(s.blockIndex) || s.blockIndex < 0 || s.blockIndex > 13 || !Array.isArray(s.closedBlocks) || s.closedBlocks.some(i => !Number.isInteger(i) || i < 0 || i > 13) || !Number.isFinite(s.dayDeadlineAt) || s.dayDeadlineAt !== s.startedAt + DAY_MS || !Number.isFinite(s.breakBankMs) || s.breakBankMs < 0 || !['tutorial', 'block', 'break', 'complete'].includes(s.stage))) throw new Error('La estructura del examen no es válida.');
      if (s.status === 'active' && s.mode === 'exam' && (!Number.isFinite(s.deadlineAt) || !Number.isFinite(s.stageStartedAt))) throw new Error('El reloj del examen es inválido.');
      if (s.mode === 'study' && !(s.deadlineAt === null || Number.isFinite(s.deadlineAt))) throw new Error('El reloj de la práctica es inválido.');
      if (s.mode === 'exam') {
        const counts = Object.fromEntries(Object.keys(QUOTAS).map(k => [k, 0])); for (const qid of s.questionIds) counts[questionsById.get(qid).category]++;
        if (Object.entries(QUOTAS).some(([category, quota]) => counts[category] !== quota) || new Set(s.closedBlocks).size !== s.closedBlocks.length || (s.status === 'active' && s.deadlineAt > s.dayDeadlineAt) || (s.stage === 'block' && (s.currentIndex < s.blockIndex * 20 || s.currentIndex >= (s.blockIndex + 1) * 20))) throw new Error('El balance o el estado del examen es inválido.');
      }
      if (s.mode === 'study' && (!['study', 'complete'].includes(s.stage) || !(s.pausedRemainingMs === null || Number.isFinite(s.pausedRemainingMs) && s.pausedRemainingMs >= -1) || (s.pausedRemainingMs !== null && s.deadlineAt !== null))) throw new Error('La pausa de la práctica es inválida.');
      if (s.status === 'complete' && (!Number.isFinite(s.finishedAt) || s.finishedAt < s.startedAt || s.stage !== 'complete' || s.deadlineAt !== null || s.questionIds.some(qid => !s.responses[qid] || !s.responses[qid].committed))) throw new Error('La sesión finalizada está incompleta.');
      for (const [qid, r] of Object.entries(s.responses)) if (!s.questionIds.includes(qid) || !r || !(r.answer === undefined || r.answer === null || (Number.isInteger(r.answer) && r.answer >= 0 && r.answer < 5)) || (r.committed && (!Number.isFinite(r.submittedAt) || r.answer === undefined)) || (r.excluded && (!Array.isArray(r.excluded) || r.excluded.some(i => !Number.isInteger(i) || i < 0 || i >= 5)))) throw new Error('Las respuestas de la sesión no son válidas.');
    }
    if (p.activeSession && p.activeSession.status !== 'active') throw new Error('La sesión pendiente no está activa.');
    if (p.completedSessions.some(s => s.status !== 'complete')) throw new Error('El historial contiene sesiones pendientes.');
    for (const a of p.attempts) {
      const s = sessionMap.get(a.sessionId), r = s && s.responses[a.questionId];
      if (!s || !r || !r.committed || r.answer !== a.answer || r.submittedAt !== a.timestamp || s.mode !== a.mode || (s.mode === 'exam' && s.status !== 'complete')) throw new Error('Los intentos no coinciden con sus sesiones.');
    }
    return true;
  }
  function clock(ms) { const seconds = Math.max(0, Math.ceil(ms / 1000)), h = Math.floor(seconds / 3600), m = Math.floor(seconds % 3600 / 60), s = seconds % 60; return h ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`; }
  return { VERSION, QUOTAS, LABELS, BLOCK_SIZE, BLOCK_MS, TUTORIAL_MS, BREAK_MS, DAY_MS, hash32, rng, shuffle, validateBank, formGenerator, generateForms, createExamSession, createStudySession, commitQuestion, completeSession, endTutorial, endExamBlock, endBreak, advanceSession, pauseStudy, resumeStudy, attemptFor, ingestAttempts, firstAttempts, calculateStats, orderedQuestions, filterQuestions, newProfile, validateProfile, clock };
});
