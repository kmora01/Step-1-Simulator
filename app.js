(function () {
  'use strict';
  const C = window.StepCore;
  const app = document.getElementById('app'), modal = document.getElementById('modal'), toastElement = document.getElementById('toast');
  const encoder = new TextEncoder(), decoder = new TextDecoder();
  const DATA_CACHE = 'stepone-content-v1';
  let credentials, user, profile, profileKey, contentKey, bank, byId, getForm, book, toc, bookPromise;
  let route = 'home', saveQueue = Promise.resolve(), saving = 0, saveError = '', toastTimeout, clockInterval, searchTimeout, modalRevision = 0;
  let statsFirst = true, statsCategory = '', bookPage = 1, bookSearch = '', bookZoom = 100, reviewFilter = 'all';
  let reviewIndex = 0, bookResults = [], pageURLs = new Map(), pendingPageURLs = new Map(), currentPageToken = 0, authEpoch = 0, offlineDownloading = false;
  const defaultStudyFilters = () => ({ category: '', chapter: '', topic: '', status: 'unseen', search: '', order: 'book', count: 20, timed: false });
  let studyFilters = defaultStudyFilters();
  const paths = { home: 'Tu progreso', study: 'Practicar', exams: 'Simulacros', stats: 'Estadísticas', book: 'Libro', settings: 'Ajustes', session: 'Sesión', review: 'Revisión' };
  const icons = {
    home: '<path d="M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/>',
    study: '<path d="M4 4h6a3 3 0 0 1 3 3v14a4 4 0 0 0-3-2H4Zm16 0h-4a3 3 0 0 0-3 3v14a4 4 0 0 1 3-2h4Z"/>',
    exams: '<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M8 3v4m8-4v4M8 11h8m-8 5h5"/>',
    stats: '<path d="M4 20V10m8 10V4m8 16v-7M2 22h20"/>',
    book: '<path d="M6 3h14v18H6a3 3 0 0 1 0-6h14M6 3a3 3 0 0 0-3 3v12M9 7h7m-7 4h5"/>',
    settings: '<path d="m9 3-1 3-3 1-2 3 2 2-1 3 2 3 3-1 3 2 3-2 3 1 2-3-1-3 2-2-2-3-3-1-1-3Z"/><circle cx="12" cy="12" r="3"/>',
    arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    star: '<path d="m12 3 2.8 5.8 6.4.9-4.6 4.5 1.1 6.3L12 17.5l-5.7 3 1.1-6.3L2.8 9.7l6.4-.9Z"/>',
    lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
    download: '<path d="M12 3v12m-5-5 5 5 5-5M4 15v6h16v-6"/>',
    search: '<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>',
    logout: '<path d="M10 3H4v18h6m5-15 6 6-6 6m-7-6h13"/>',
    chevron: '<path d="m9 5 7 7-7 7"/>',
    pause: '<path d="M8 4v16m8-16v16"/>',
    play: '<path d="m7 3 14 9-14 9Z"/>',
    flag: '<path d="M5 21V3m0 1h14l-3 5 3 5H5"/>',
    cloud: '<path d="M7 18a5 5 0 1 1 0-10 6 6 0 0 1 12 1 4 4 0 0 1 0 8h-2m-5-5v10m-4-4 4 4 4-4"/>'
  };
  function icon(name, css = '') { return `<svg class="icon ${css}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.study}</svg>`; }
  function e(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function percent(n, total) { return total ? `${Math.round(n / total * 100)}%` : '—'; }
  function number(n) { return Number(n).toLocaleString('es-CO'); }
  function date(at) { return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(at)); }
  function examActive() { return profile && profile.activeSession && profile.activeSession.mode === 'exam'; }
  function randomId() { return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${crypto.getRandomValues(new Uint32Array(2)).join('-')}`; }
  function base64(bytes) { const array = new Uint8Array(bytes); let binary = ''; for (let i = 0; i < array.length; i += 16384) binary += String.fromCharCode(...array.subarray(i, i + 16384)); return btoa(binary); }
  function unbase64(value) { return Uint8Array.from(atob(value), c => c.charCodeAt(0)); }
  async function openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('stepone-encrypted-profiles-v1', 1);
      request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains('profiles')) request.result.createObjectStore('profiles', { keyPath: 'username' }); };
      request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error || new Error('No se pudo abrir el almacenamiento.'));
    });
  }
  async function dbRead(username) { const db = await openDB(); return new Promise((resolve, reject) => { const tx = db.transaction('profiles', 'readonly'), req = tx.objectStore('profiles').get(username); req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error); tx.oncomplete = () => db.close(); tx.onerror = () => { db.close(); reject(tx.error); }; }); }
  async function dbWrite(record) { const db = await openDB(); return new Promise((resolve, reject) => { const tx = db.transaction('profiles', 'readwrite'); tx.objectStore('profiles').put(record); tx.oncomplete = () => { db.close(); resolve(); }; tx.onerror = () => { db.close(); reject(tx.error); }; tx.onabort = () => { db.close(); reject(tx.error || new Error('La escritura se interrumpió.')); }; }); }
  async function encryptText(text, key) { const iv = crypto.getRandomValues(new Uint8Array(12)); return { iv, data: await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(text)) }; }
  async function decryptRecord(record, key) { return JSON.parse(decoder.decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: record.iv }, key, record.data))); }
  async function decryptFile(path) {
    const key = contentKey;
    if (!key) throw new Error('Inicia sesión para abrir el contenido.');
    const response = await fetch(path); if (!response.ok) throw new Error(`No se pudo cargar ${path} (${response.status}).`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.length < 32 || decoder.decode(bytes.subarray(0, 4)) !== 'S1E1') throw new Error('El archivo cifrado no tiene el formato esperado.');
    return crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes.subarray(4, 16) }, key, bytes.subarray(16));
  }
  async function loadData(path) { return JSON.parse(decoder.decode(await decryptFile(path))); }
  function updateSaveIndicator() {
    const el = document.getElementById('save-status'); if (!el) return;
    el.textContent = saveError ? 'Error al guardar' : saving ? 'Guardando…' : 'Guardado en este navegador'; el.classList.toggle('save-error', Boolean(saveError));
    if (saveError) el.title = saveError;
  }
  function saveProfile() {
    if (!profile || !profileKey || !user) return Promise.resolve();
    const snapshot = JSON.stringify(profile), key = profileKey, username = user.username;
    saving++; updateSaveIndicator();
    const operation = saveQueue.catch(() => {}).then(async () => { const payload = await encryptText(snapshot, key); await dbWrite({ username, iv: payload.iv, data: payload.data }); saveError = ''; });
    saveQueue = operation;
    operation.catch(error => { saveError = error.message || 'El navegador no pudo guardar el progreso.'; toast('No se pudo guardar. Exporta un respaldo antes de cerrar.', true); }).finally(() => { saving--; updateSaveIndicator(); });
    return operation;
  }
  // Keep the current session usable in memory when a browser rejects a write.
  // Logout and resetting the history still wait for a successful write.
  function persistProgress() { return saveProfile().catch(() => {}); }
  function sameAccount(epoch) { return Boolean(profile && user && epoch === authEpoch); }
  function toast(message, error = false) { clearTimeout(toastTimeout); toastElement.textContent = message; toastElement.className = `toast visible${error ? ' error' : ''}`; toastTimeout = setTimeout(() => toastElement.classList.remove('visible'), 5500); }
  function progressMetric(label, value, detail, css = '') { return `<article class="metric ${css}"><p>${e(label)}</p><strong>${e(value)}</strong><span>${e(detail)}</span></article>`; }
  function bar(value, css = '') { return `<div class="bar ${css}" role="img" aria-label="${Math.round(value)} por ciento"><span style="width:${Math.min(100, Math.max(0, Number(value) || 0))}%"></span></div>`; }
  function pageTitle(eyebrow, title, description, action = '') { return `<div class="page-heading"><div><p class="eyebrow">${e(eyebrow)}</p><h1>${e(title)}</h1>${description ? `<p class="page-description">${e(description)}</p>` : ''}</div>${action}</div>`; }
  function button(label, action, css = 'btn-primary', iconName = '') { return `<button class="btn ${css}" data-action="${e(action)}">${iconName ? icon(iconName) : ''}${e(label)}</button>`; }
  function selectOptions(values, selected, firstLabel) { return `${firstLabel ? `<option value="">${e(firstLabel)}</option>` : ''}${values.map(v => { const value = typeof v === 'object' ? v.value : v, label = typeof v === 'object' ? v.label : v; return `<option value="${e(value)}" ${value === selected ? 'selected' : ''}>${e(label)}</option>`; }).join('')}`; }
  async function boot() {
    try {
      if (!window.crypto || !crypto.subtle || !window.indexedDB) throw new Error('Abre esta página en HTTPS o localhost y permite el almacenamiento del navegador.');
      const response = await fetch('./credentials.json'); if (!response.ok) throw new Error('No se encontró credentials.json. Publica todos los archivos del paquete.');
      credentials = await response.json();
      if (!credentials || !Array.isArray(credentials.users) || !credentials.users.length || !Number.isInteger(credentials.iterations)) throw new Error('El archivo de usuarios es inválido.');
      renderLogin();
      if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('./service-worker.js').catch(() => {});
    } catch (error) { app.innerHTML = `<main class="boot"><div class="brand-mark">S<span>1</span></div><h1>No pudimos abrir el simulador</h1><p>${e(error.message)}</p><button class="btn btn-primary" data-action="reload">Intentar de nuevo</button></main>`; }
  }
  function renderLogin() {
    app.innerHTML = `<main class="login-layout" id="main-content"><section class="login-story"><a href="#" class="wordmark"><span class="brand-mark">S<span>1</span></span><span>Step One<br><small>STUDIO</small></span></a><div class="login-story-content"><p class="eyebrow">TU PRÓXIMO PASO, CON CLARIDAD</p><h1>Aprende el concepto.<br>Domina la pregunta.</h1><p>Un espacio de estudio para comprender, practicar y llegar preparado al USMLE Step 1.</p><div class="login-pill-list"><span>2.800 preguntas originales</span><span>280 versiones de simulación</span><span>Progreso individual</span></div></div><div class="login-bottom">Casos en inglés · Explicaciones en español</div><div class="orbit orbit-one"></div><div class="orbit orbit-two"></div></section><section class="login-panel"><div class="login-card"><span class="tag">PREPARACIÓN STEP 1</span><h2>Bienvenido a tu estudio</h2><p>Selecciona tu perfil y continúa donde lo dejaste.</p><form id="login-form"><label for="username">Usuario</label><select id="username" name="username" autocomplete="username">${credentials.users.map(u => `<option value="${e(u.username)}">${e(u.displayName || u.username)} · ${e(u.username)}</option>`).join('')}</select><label for="password">Contraseña</label><div class="password-field"><input id="password" name="password" type="password" autocomplete="current-password" required minlength="1"><button type="button" class="password-toggle" data-action="show-password" aria-label="Mostrar contraseña">Ver</button></div><p id="login-error" class="form-error" role="alert"></p><button class="btn btn-primary login-submit" type="submit">Entrar al simulador ${icon('arrow')}</button></form><div class="login-note">${icon('lock')}<p>Contenido y progreso cifrados. Cada perfil conserva su historial en este navegador. Exporta un respaldo para continuar en otro dispositivo.</p></div><small class="login-credit">Material de preparación independiente. No afiliado a USMLE, NBME ni UWorld.</small></div></section></main>`;
    document.getElementById('login-form').addEventListener('submit', login);
  }
  async function login(event) {
    event.preventDefault(); const submit = event.currentTarget.querySelector('button[type=submit]'), err = document.getElementById('login-error'); submit.disabled = true; submit.textContent = 'Abriendo tu espacio…'; err.textContent = '';
    try {
      const selected = credentials.users.find(u => u.username === document.getElementById('username').value), password = document.getElementById('password').value;
      const material = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
      const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: unbase64(selected.salt), iterations: credentials.iterations, hash: 'SHA-256' }, material, 256);
      const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bits))].map(x => x.toString(16).padStart(2, '0')).join('');
      if (hash !== selected.verifier) throw new Error('La contraseña no coincide con este usuario.');
      const pkey = await crypto.subtle.importKey('raw', bits, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
      if (!selected.wrappedContentKey || !selected.wrappedContentKey.iv || !selected.wrappedContentKey.data) throw new Error('No se encontró la clave de contenido de este usuario.');
      const rawContentKey = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unbase64(selected.wrappedContentKey.iv) }, pkey, unbase64(selected.wrappedContentKey.data));
      contentKey = await crypto.subtle.importKey('raw', rawContentKey, { name: 'AES-GCM' }, false, ['decrypt']);
      const data = await loadData('./data/questions.bin'); const errors = C.validateBank(data.questions); if (errors.length) throw new Error(`El banco necesita revisión: ${errors.slice(0, 3).join(' ')}`);
      bank = data; byId = new Map(bank.questions.map(q => [q.id, q])); getForm = C.formGenerator(bank.questions);
      const stored = await dbRead(selected.username), loaded = stored ? await decryptRecord(stored, pkey) : C.newProfile(selected.username);
      C.validateProfile(loaded, selected.username, byId); user = selected; profileKey = pkey; profile = loaded; authEpoch++; statsFirst = profile.preferences.firstStats !== false;
      document.getElementById('password').value = ''; reconcileSession(); await persistProgress();
      route = profile.activeSession ? 'session' : 'home'; location.hash = route; render(); startClock();
      if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
    } catch (error) { contentKey = null; bank = null; byId = null; user = null; profile = null; profileKey = null; err.textContent = error.message || 'No pudimos abrir el perfil. Revisa los archivos y la contraseña.'; submit.disabled = false; submit.innerHTML = `Entrar al simulador ${icon('arrow')}`; }
  }
  function reconcileSession() {
    const s = profile && profile.activeSession; if (!s) return false;
    const before = `${s.status}:${s.stage}:${s.blockIndex}:${s.deadlineAt}`; C.advanceSession(s, Date.now());
    // A closed examination block is stored, but never graded in statistics early.
    if (s.mode === 'study' || s.status === 'complete') C.ingestAttempts(profile, s, byId);
    if (s.status === 'complete') { if (!profile.completedSessions.some(x => x.id === s.id)) profile.completedSessions.push(s); profile.activeSession = null; if (route === 'session') { route = `review/${s.id}`; location.hash = route; } }
    return before !== `${s.status}:${s.stage}:${s.blockIndex}:${s.deadlineAt}`;
  }
  function navLink(name, label, disabled) { return `<a class="nav-link ${route.split('/')[0] === name ? 'active' : ''}${disabled ? ' nav-disabled' : ''}" href="#${name}" ${disabled ? 'aria-disabled="true" title="Disponible al terminar el examen"' : ''}>${icon(name)}<span>${e(label)}</span></a>`; }
  function shell(content) {
    const locked = examActive(), session = profile.activeSession;
    app.innerHTML = `<div class="app-shell"><aside class="sidebar"><a href="#home" class="wordmark"><span class="brand-mark">S<span>1</span></span><span>Step One<br><small>STUDIO</small></span></a><p class="nav-caption">TU ESPACIO DE ESTUDIO</p><nav aria-label="Navegación principal">${navLink('home', 'Tu progreso')}${navLink('study', 'Practicar', locked)}${navLink('exams', 'Simulacros')}${navLink('stats', 'Estadísticas', locked)}${navLink('book', 'Libro', locked)}${navLink('settings', 'Ajustes')}</nav>${session ? `<a class="sidebar-session" href="#session">${icon('clock')}<span>${session.mode === 'exam' ? 'Examen en curso' : 'Práctica en curso'}<small>Continuar sesión ${icon('arrow')}</small></span></a>` : ''}<div class="sidebar-bottom"><span class="edition-dot"></span>EDICIÓN 2026<small>Casos en inglés.<br>Aprendizaje en español.</small></div></aside><div class="main-shell"><header class="topbar"><div class="mobile-wordmark"><span class="brand-mark">S<span>1</span></span><b>Step One</b></div><span class="breadcrumb">PREPARACIÓN USMLE <span>/</span> ${e(paths[route.split('/')[0]] || 'Estudio')}</span><div class="topbar-end"><span class="save-status" id="save-status">Guardado en este navegador</span><span class="network-badge ${navigator.onLine ? '' : 'offline'}" id="network-status">${navigator.onLine ? 'En línea' : 'Sin conexión'}</span><button class="profile-chip" data-action="account" aria-label="Ajustes del perfil ${e(user.displayName)}"><span>${e((user.displayName || user.username).slice(0, 1).toUpperCase())}</span><b>${e(user.displayName || user.username)}</b></button></div></header><main id="main-content" class="main-content ${route.startsWith('session') ? 'session-content' : ''}" tabindex="-1">${content}</main><footer class="app-footer">Preparación independiente · La dificultad es editorial; los porcentajes no equivalen a una puntuación ni probabilidad oficial de aprobación.</footer></div><nav class="mobile-nav" aria-label="Navegación móvil">${navLink('home', 'Inicio')}${navLink('study', 'Practicar', locked)}${navLink('exams', 'Examen')}${navLink('stats', 'Análisis', locked)}${navLink('book', 'Libro', locked)}${navLink('settings', 'Ajustes')}</nav></div>`;
    document.body.dataset.font = profile.preferences.fontSize || 'normal'; updateSaveIndicator(); updateClock(); hydrateImages();
  }
  function render() {
    if (!profile) return;
    if (examActive() && ['study', 'book', 'review', 'stats'].includes(route.split('/')[0])) { route = 'session'; location.hash = route; }
    if (route === 'session' && !profile.activeSession) route = 'home';
    if (route.startsWith('review/')) { const session = profile.completedSessions.find(s => s.id === route.slice(7)); shell(session ? renderReview(session) : renderHome()); }
    else if (route === 'study') shell(renderStudy());
    else if (route === 'exams') shell(renderExams());
    else if (route === 'stats') shell(renderStats());
    else if (route === 'book') { shell(renderBookLoading()); loadBook().then(() => { if (route === 'book') shell(renderBook()); }).catch(error => toast(error.message, true)); }
    else if (route === 'settings') shell(renderSettings());
    else if (route === 'session') shell(renderSession());
    else shell(renderHome());
  }
  function renderHome() {
    const stats = C.calculateStats(profile.attempts, true), completion = stats.total / bank.questions.length * 100, sessions = profile.completedSessions.slice(-6).reverse(), active = profile.activeSession;
    const weakest = Object.entries(stats.categories).filter(([, v]) => v.total >= 5).sort((a, b) => a[1].correct / a[1].total - b[1].correct / b[1].total).slice(0, 3);
    const greeting = stats.total ? 'Continúa construyendo tu preparación.' : 'Tu preparación comienza aquí.';
    return `${pageTitle('APRENDER. PRACTICAR. AVANZAR.', `Hola, ${user.displayName || user.username}.`, greeting)}<section class="home-hero"><div class="hero-copy"><span class="tag tag-dark">USMLE STEP 1 · 2026</span><h2>Un concepto a la vez.<br>Un paso más cerca.</h2><p>Estudia en el orden del libro, recibe una explicación de cada opción y entrena tu ritmo con bloques cronometrados.</p><div class="hero-actions">${active ? button('Continuar sesión', 'continue', 'btn-light', 'arrow') : button('Comenzar práctica', 'go-study', 'btn-light', 'arrow')}${button('Explorar simulacros', 'go-exams', 'btn-hero-outline')}</div></div><div class="hero-progress"><div class="progress-ring" style="--progress:${completion}"><div><strong>${Math.round(completion)}<span>%</span></strong><small>del banco explorado</small></div></div><p>${number(stats.total)} / ${number(bank.questions.length)} preguntas únicas</p></div></section><div class="metrics-grid">${progressMetric('Aciertos iniciales', percent(stats.correct, stats.total), `${number(stats.correct)} de ${number(stats.total)} primeros intentos`, 'metric-accent')}${progressMetric('Sesiones completadas', number(profile.completedSessions.length), `${profile.completedSessions.filter(s => s.mode === 'exam').length} simulacros completos`)}${progressMetric('Para reforzar', number(stats.incorrect), `${stats.unanswered} sin responder en primeros intentos`)}${progressMetric('Preguntas marcadas', number(profile.bookmarks.length), 'Tu lista personal para repasar')}</div><div class="two-columns"><section class="panel"><div class="panel-heading"><div><p class="eyebrow">PRÓXIMO PASO</p><h2>${weakest.length ? 'Enfoca tu próximo bloque' : 'Construye una base sólida'}</h2></div>${icon('study', 'panel-symbol')}</div>${weakest.length ? weakest.map(([cat, v]) => `<div class="focus-row"><div><b>${e(C.LABELS[cat])}</b><span>${v.total} preguntas · ${percent(v.correct, v.total)} de aciertos</span>${bar(v.correct / v.total * 100)}</div><button class="icon-btn" data-action="practice-category" data-category="${e(cat)}" aria-label="Practicar ${e(C.LABELS[cat])}">${icon('arrow')}</button></div>`).join('') : `<p class="muted">Empieza con 20 preguntas en modo estudio. Las fortalezas y los temas por reforzar aparecerán al completar tus primeros intentos.</p><div class="quick-options">${button('Orden del libro', 'book-order-study', 'btn-outline', 'study')}${button('Abrir el libro', 'go-book', 'btn-outline', 'book')}</div>`}</section><section class="panel"><div class="panel-heading"><div><p class="eyebrow">TU HISTORIAL</p><h2>Sesiones recientes</h2></div></div>${sessions.length ? `<div class="history-list">${sessions.map(s => { const result = sessionResult(s); return `<${examActive() ? 'div' : 'a'} ${examActive() ? '' : `href="#review/${e(s.id)}"`} class="history-row"><span class="history-icon">${icon(s.mode === 'exam' ? 'exams' : 'study')}</span><div><b>${s.mode === 'exam' ? `Simulacro ${s.formNumber}` : e(s.title || 'Práctica')}</b><small>${date(s.finishedAt)} · ${s.questionIds.length} preguntas</small></div><strong>${percent(result.correct, result.total)}</strong>${icon('chevron')}</${examActive() ? 'div' : 'a'}>`; }).join('')}</div>` : `<div class="empty-small">${icon('clock')}<p>Tu historial se empieza a escribir<br>con tu primera sesión.</p></div>`}</section></div><section class="panel bank-note"><span class="note-icon">${icon('exams')}</span><div><h2>280 versiones, un banco de 2.800 preguntas</h2><p>Las versiones 1–10 cubren todo el banco sin repetir ninguna pregunta entre ellas. Las versiones 11–280 combinan las mismas preguntas con otras selecciones y órdenes; cada examen contiene 280 preguntas diferentes.</p></div>${button('Ver balance', 'blueprint', 'btn-outline')}</section>`;
  }
  function matchingStudy() { return C.filterQuestions(bank.questions, studyFilters, profile); }
  function renderStudy() {
    const chapterQuestions = bank.questions.filter(q => !studyFilters.category || q.category === studyFilters.category);
    const chapters = [...new Set(C.orderedQuestions(chapterQuestions).map(q => q.chapter))], topics = [...new Set(chapterQuestions.filter(q => !studyFilters.chapter || q.chapter === studyFilters.chapter).map(q => q.topic))].sort();
    const found = matchingStudy(), active = profile.activeSession;
    return `${pageTitle('PRÁCTICA GUIADA', 'Aprende con cada respuesta.', 'Casos y opciones en inglés. Explicaciones, razonamiento y objetivo de aprendizaje en español.')}<div class="study-layout"><section class="panel study-builder"><div class="panel-heading"><div><p class="eyebrow">CONFIGURA TU BLOQUE</p><h2>¿Qué quieres practicar?</h2></div><span class="tag">${number(found.length)} disponibles</span></div><div class="form-grid"><div class="field"><label for="filter-category">Categoría del examen</label><select id="filter-category" data-filter="category">${selectOptions(Object.entries(C.LABELS).map(([value, label]) => ({ value, label })), studyFilters.category, 'Todas las categorías')}</select></div><div class="field"><label for="filter-chapter">Capítulo del libro</label><select id="filter-chapter" data-filter="chapter">${selectOptions(chapters, studyFilters.chapter, 'Todos los capítulos')}</select></div><div class="field full-span"><label for="filter-topic">Tema</label><select id="filter-topic" data-filter="topic">${selectOptions(topics, studyFilters.topic, 'Todos los temas')}</select></div><div class="field"><label for="filter-status">Preguntas</label><select id="filter-status" data-filter="status">${selectOptions([{ value: 'all', label: 'Todas' }, { value: 'unseen', label: 'Sin intentar' }, { value: 'incorrect', label: 'Último intento incorrecto' }, { value: 'bookmarked', label: 'Marcadas para repaso' }], studyFilters.status)}</select></div><div class="field"><label for="filter-order">Orden de estudio</label><select id="filter-order" data-filter="order">${selectOptions([{ value: 'book', label: 'Orden del libro' }, { value: 'random', label: 'Mezcla aleatoria' }], studyFilters.order)}</select></div><div class="field"><label for="filter-count">Preguntas por sesión</label><select id="filter-count" data-filter="count">${[5, 10, 20, 40, 80, 280].map(v => `<option value="${v}" ${studyFilters.count === v ? 'selected' : ''}>${v} preguntas</option>`).join('')}</select></div><div class="field"><label>Tiempo</label><label class="checkbox-card"><input id="filter-timed" type="checkbox" data-filter="timed" ${studyFilters.timed ? 'checked' : ''}><span>90 segundos por pregunta<small>El modo estudio permite pausar.</small></span></label></div></div><div class="builder-bottom"><p>La explicación aparece después de confirmar tu respuesta. ${found.length && found.length < studyFilters.count ? `Este bloque tendrá ${found.length} preguntas.` : 'Las preguntas de la sesión no se repiten.'}</p><button class="btn btn-primary" data-action="start-study" ${!found.length || (active && active.mode === 'exam') ? 'disabled' : ''}>${icon('play')} Empezar bloque</button></div>${active && active.mode === 'study' ? `<p class="inline-note">Tienes una práctica pendiente. ${button('Continuar', 'continue', 'btn-text')} Puedes finalizarla antes de crear otro bloque.</p>` : ''}</section><aside class="study-side"><section class="panel soft-panel"><span class="large-icon">${icon('book')}</span><h2>Comprende el porqué</h2><p>Cada pregunta incluye una explicación de la respuesta correcta, de cada distractor y un concepto clave para recordar.</p><ul class="check-list"><li>Referencias a las páginas originales</li><li>Texto y diagramas del libro</li><li>Marcadores para volver después</li></ul></section><section class="panel"><p class="eyebrow">RECORRIDO POR EL LIBRO</p><h3>${chapters.length} capítulos</h3><p class="muted">Selecciona un capítulo y «Orden del libro» para avanzar siguiendo las páginas de referencia.</p>${button('Explorar libro', 'go-book', 'btn-outline', 'arrow')}</section></aside></div>`;
  }
  function renderExams() {
    const attempted = new Set(profile.completedSessions.filter(s => s.mode === 'exam').map(s => s.formNumber)), pending = profile.activeSession;
    const recommendation = Array.from({ length: 280 }, (_, i) => i + 1).find(n => !attempted.has(n)) || 1;
    return `${pageTitle('SIMULACIÓN CRONOMETRADA', 'Entrena el día del examen.', 'Formato Step 1 vigente desde el 14 de mayo de 2026: 14 bloques, hasta 20 preguntas por bloque.')}<div class="exam-overview"><section class="exam-card"><div class="exam-card-top"><span class="tag tag-dark">SIMULACRO COMPLETO</span>${icon('exams')}</div><h2>280 preguntas.<br>Una jornada real de práctica.</h2><div class="exam-facts"><div><strong>14</strong><span>bloques</span></div><div><strong>30<span>min</span></strong><span>por bloque</span></div><div><strong>8<span>h</span></strong><span>máximo total</span></div></div><p>5 minutos de tutorial y 55 minutos iniciales de descanso. El tiempo que ahorres en tutorial o bloques se suma al descanso disponible.</p><label for="exam-form">Versión del simulacro</label><select id="exam-form">${Array.from({ length: 280 }, (_, i) => i + 1).map(n => `<option value="${n}" ${n === recommendation ? 'selected' : ''}>Simulacro ${String(n).padStart(3, '0')}${attempted.has(n) ? ' · completado' : n <= 10 ? ' · recorrido sin repetición' : ''}</option>`).join('')}</select><button class="btn btn-light" data-action="start-exam" ${pending ? 'disabled' : ''}>${icon('play')} Comenzar simulacro</button>${pending ? `<p class="exam-pending">Hay una sesión pendiente. ${button('Continuar sesión', 'continue', 'btn-text')}</p>` : ''}</section><section class="panel exam-rules"><p class="eyebrow">ASÍ FUNCIONA</p><h2>Practica con las reglas del formato.</h2><div class="rule"><span>01</span><div><h3>Responde y revisa el bloque actual</h3><p>Puedes cambiar tus respuestas y volver a cualquier pregunta del bloque abierto. Al cerrarlo, sus respuestas quedan definitivas.</p></div></div><div class="rule"><span>02</span><div><h3>El reloj continúa</h3><p>Salir de la página, bloquear el móvil o recargar no pausa el examen. La sesión se restaura usando el plazo guardado.</p></div></div><div class="rule"><span>03</span><div><h3>Revisa al terminar</h3><p>La calificación y las explicaciones aparecen al concluir el examen. Las preguntas sin responder se cuentan como incorrectas.</p></div></div><div class="rule"><span>04</span><div><h3>Consulta valores de laboratorio</h3><p>Las tablas de referencia están disponibles durante todos los bloques. El libro completo se habilita para la revisión final.</p></div></div>${button('Ver distribución de preguntas', 'blueprint', 'btn-outline')}</section></div><section class="panel bank-note"><span class="note-icon">${icon('study')}</span><div><h2>Qué significa «280 simulacros»</h2><p>Son 280 versiones balanceadas. Con 2.800 preguntas hay capacidad para 10 exámenes completos de 280 sin reutilizar preguntas. Crear 280 exámenes completos totalmente distintos exigiría 78.400 preguntas.</p></div></section><section class="panel"><div class="panel-heading"><h2>Tu recorrido inicial sin repetición</h2><span class="muted">Versiones 1–10</span></div><div class="form-grid-ten">${Array.from({ length: 10 }, (_, i) => i + 1).map(n => `<button class="form-tile ${attempted.has(n) ? 'done' : ''}" data-action="choose-form" data-form="${n}" aria-label="Elegir simulacro ${n}"><span>${String(n).padStart(2, '0')}</span><small>${attempted.has(n) ? 'Completado' : 'Disponible'}</small>${attempted.has(n) ? icon('check') : icon('arrow')}</button>`).join('')}</div></section>`;
  }
  function renderSession() {
    const s = profile.activeSession; if (!s) return renderHome();
    if (s.mode === 'exam' && s.stage === 'tutorial') return renderTutorial(s);
    if (s.mode === 'exam' && s.stage === 'break') return renderBreak(s);
    if (s.mode === 'study' && s.pausedRemainingMs !== null) return renderPaused(s);
    return renderQuestion(s);
  }
  function renderTutorial(s) { return `<div class="stage-wrap"><div class="stage-card"><span class="stage-icon">${icon('exams')}</span><p class="eyebrow">SIMULACRO ${s.formNumber} · TUTORIAL</p><h1>Todo listo para empezar.</h1><p class="stage-intro">Tienes 5 minutos para familiarizarte con los controles. El tiempo que ahorres se añade a tus descansos.</p><div class="stage-timer" data-clock="stage">${C.clock(s.deadlineAt - Date.now())}</div><div class="tutorial-grid"><div><b>Seleccionar respuesta</b><p>Haz clic en una opción o usa las teclas 1–5.</p></div><div><b>Moverte por el bloque</b><p>Usa el panel de números o las flechas anterior y siguiente.</p></div><div><b>Marcar y tachar</b><p>La estrella marca para repaso. «Tachar» descarta una opción visualmente.</p></div><div><b>Cerrar el bloque</b><p>Las respuestas se guardan definitivamente al cerrar o agotarse sus 30 minutos.</p></div></div><p class="inline-note">Las explicaciones estarán disponibles al terminar. El reloj continúa incluso si sales o recargas la página.</p>${button('Comenzar bloque 1', 'skip-tutorial', 'btn-primary', 'play')}</div></div>`; }
  function renderBreak(s) { return `<div class="stage-wrap"><div class="stage-card break-card"><span class="stage-icon">${icon('pause')}</span><p class="eyebrow">BLOQUE ${s.blockIndex} DE 14 COMPLETADO</p><h1>Respira. Recarga. Continúa.</h1><p class="stage-intro">Puedes tomar un descanso o comenzar el próximo bloque. Este reloj muestra todo tu descanso disponible.</p><div class="stage-timer" data-clock="stage">${C.clock(s.deadlineAt - Date.now())}</div><p class="muted">Si se agota el descanso, el siguiente bloque comienza automáticamente.</p><div class="break-summary"><span>Siguiente: bloque ${s.blockIndex + 1}</span><span>20 preguntas · 30 minutos</span><span>Jornada restante: <b data-clock="day">${C.clock(s.dayDeadlineAt - Date.now())}</b></span></div>${button(`Comenzar bloque ${s.blockIndex + 1}`, 'end-break', 'btn-primary', 'play')}</div></div>`; }
  function renderPaused(s) { return `<div class="stage-wrap"><div class="stage-card"><span class="stage-icon">${icon('pause')}</span><p class="eyebrow">PRÁCTICA PAUSADA</p><h1>A tu ritmo.</h1><p class="stage-intro">Tu sesión está guardada. Continúa cuando estés listo.</p>${s.pausedRemainingMs >= 0 ? `<div class="stage-timer">${C.clock(s.pausedRemainingMs)}</div>` : ''}${button('Reanudar práctica', 'resume-study', 'btn-primary', 'play')}</div></div>`; }
  function currentQuestion(s) { return byId.get(s.questionIds[s.currentIndex]); }
  function renderQuestion(s) {
    const q = currentQuestion(s), r = s.responses[q.id] || {}, starred = profile.bookmarks.includes(q.id), study = s.mode === 'study', feedback = study && r.committed;
    const start = study ? 0 : s.blockIndex * 20, end = study ? s.questionIds.length : start + 20, answered = s.questionIds.slice(start, end).filter(id => { const response = s.responses[id]; return response && (study ? response.committed : Number.isInteger(response.answer)); }).length;
    const options = q.options.map((option, i) => { const selected = r.answer === i, excluded = (r.excluded || []).includes(i), correct = feedback && i === q.answer, wrong = feedback && selected && !correct; return `<div class="option-row ${selected ? 'selected' : ''}${excluded ? ' excluded' : ''}${correct ? ' correct' : ''}${wrong ? ' wrong' : ''}"><button class="answer-option" data-action="select-option" data-index="${i}" role="radio" aria-checked="${selected}" ${feedback ? 'disabled' : ''}><span class="option-letter">${String.fromCharCode(65 + i)}</span><span class="option-text">${e(option)}</span>${correct ? icon('check') : wrong ? icon('close') : selected ? '<span class="selected-dot"></span>' : ''}</button>${!feedback ? `<button class="exclude-option" data-action="exclude-option" data-index="${i}" aria-label="${excluded ? 'Restaurar' : 'Tachar'} opción ${String.fromCharCode(65 + i)}" title="${excluded ? 'Restaurar' : 'Tachar'}">${excluded ? 'Restaurar' : 'Tachar'}</button>` : ''}</div>`; }).join('');
    return `<div class="session-top"><div><p class="eyebrow">${study ? 'MODO ESTUDIO' : `SIMULACRO ${s.formNumber} · BLOQUE ${s.blockIndex + 1} / 14`}</p><h1>${study ? e(s.title || 'Práctica guiada') : 'Pon a prueba tu preparación.'}</h1></div><div class="session-top-actions">${study ? button('Pausar', 'pause-study', 'btn-outline btn-small', 'pause') : button('Laboratorio', 'laboratory', 'btn-outline btn-small', 'book')}<div class="clock-pill" aria-label="Tiempo restante">${icon('clock')}<span data-clock="stage">${s.deadlineAt === null ? 'Sin límite' : C.clock(s.deadlineAt - Date.now())}</span></div></div></div><div class="question-layout"><section class="question-main"><article class="question-card"><div class="question-meta"><span class="tag">${study ? e(C.LABELS[q.category]) : `PREGUNTA ${s.currentIndex - start + 1} / 20`}</span><span class="question-id">${e(q.id)}</span><button class="bookmark-btn ${starred ? 'marked' : ''}" data-action="bookmark" data-id="${e(q.id)}" aria-pressed="${starred}" aria-label="${starred ? 'Quitar' : 'Añadir'} marcador">${icon('star')}<span>${starred ? 'Marcada' : 'Marcar'}</span></button></div>${study ? `<p class="question-topic">${e(q.chapter)}${feedback ? ` <span>›</span> ${e(q.topic)}` : ''}</p>` : ''}<div class="question-stem" lang="en">${e(q.stem).replace(/\n/g, '<br>')}</div><div class="answer-options" role="radiogroup" aria-label="Opciones de respuesta" lang="en">${options}</div>${study && !feedback ? `<div class="submit-row"><span>Selecciona una opción y confirma tu respuesta.</span><button class="btn btn-primary" data-action="submit-answer" ${!Number.isInteger(r.answer) ? 'disabled' : ''}>Responder ${icon('arrow')}</button></div>` : ''}${feedback ? renderExplanation(q, r) : ''}</article><div class="question-navigation"><button class="btn btn-outline" data-action="previous" ${s.currentIndex <= start ? 'disabled' : ''}>${icon('arrow', 'flip')} Anterior</button><span>${study ? `${s.currentIndex + 1} de ${s.questionIds.length}` : `${answered} de 20 seleccionadas`}</span><button class="btn btn-primary" data-action="next" ${s.currentIndex >= end - 1 ? 'disabled' : ''}>Siguiente ${icon('arrow')}</button></div></section><aside class="question-aside"><section class="panel navigator-panel"><div class="panel-heading"><h2>${study ? 'Tu bloque' : `Bloque ${s.blockIndex + 1}`}</h2><span>${answered}/${end - start}</span></div>${bar(answered / (end - start) * 100)}<div class="question-grid">${s.questionIds.slice(start, end).map((id, i) => { const response = s.responses[id] || {}, selected = Number.isInteger(response.answer), committed = response.committed, correct = study && committed && response.answer === byId.get(id).answer; return `<button class="question-tile ${s.currentIndex === start + i ? 'current' : ''}${study && committed ? correct ? 'answered-correct' : 'answered-wrong' : selected ? 'answered' : ''}${profile.bookmarks.includes(id) ? 'marked' : ''}" data-action="jump" data-index="${start + i}" aria-label="Pregunta ${i + 1}${selected ? ', respondida' : ', sin responder'}${profile.bookmarks.includes(id) ? ', marcada' : ''}" ${s.currentIndex === start + i ? 'aria-current="true"' : ''}>${i + 1}</button>`; }).join('')}</div><div class="navigator-legend"><span><i class="legend-selected"></i>${study ? 'Respondida' : 'Seleccionada'}</span><span><i class="legend-marked"></i>Marcada</span></div><button class="btn btn-outline full-width" data-action="${study ? 'finish-study' : 'finish-block'}">${study ? 'Finalizar práctica' : 'Cerrar bloque'} ${icon('arrow')}</button>${!study ? `<p class="navigator-note">Una vez cerrado, no puedes volver a este bloque durante el examen.</p><p class="day-time">Jornada: <b data-clock="day">${C.clock(s.dayDeadlineAt - Date.now())}</b></p>` : `<p class="navigator-note">Las preguntas no confirmadas se contarán como incorrectas al finalizar.</p>`}</section><div class="keyboard-note">Atajos: <kbd>1</kbd>–<kbd>5</kbd> elegir · <kbd>←</kbd><kbd>→</kbd> navegar${study ? ' · Enter confirmar' : ''}</div></aside></div>`;
  }
  function additionalReferences(q) {
    const references = [];
    for (const reference of Array.isArray(q.externalReferences) ? q.externalReferences : []) {
      if (!reference || typeof reference.title !== 'string' || !reference.title.trim() || typeof reference.url !== 'string') continue;
      try { const url = new URL(reference.url); if (url.protocol === 'https:' && !url.username && !url.password) references.push({ title: reference.title, url: url.href }); }
      catch (_) { /* Ignore malformed or unsafe links. */ }
    }
    return references.length ? `<div class="additional-sources"><b>Fuentes complementarias</b><ul>${references.map(reference => `<li><a href="${e(reference.url)}" target="_blank" rel="noopener noreferrer">${e(reference.title)} ${icon('arrow')}</a></li>`).join('')}</ul></div>` : '';
  }
  function renderExplanation(q, r) {
    const correct = r.answer === q.answer;
    return `<section class="explanation" aria-label="Explicación"><div class="answer-result ${correct ? 'result-correct' : 'result-wrong'}">${icon(correct ? 'check' : 'close')}<div><b>${correct ? 'Respuesta correcta' : r.answer === null ? 'Pregunta sin responder' : 'Respuesta incorrecta'}</b><span>Respuesta correcta: ${String.fromCharCode(65 + q.answer)}. ${e(q.options[q.answer])}</span></div></div><div class="explanation-content"><p class="eyebrow">EL RAZONAMIENTO</p><p>${e(q.explanation).replace(/\n/g, '<br>')}</p><div class="takeaway"><span>${icon('study')}</span><div><b>Concepto clave</b><p>${e(q.takeaway)}</p></div></div><details class="distractors" ${correct ? '' : 'open'}><summary>Por qué cada opción es correcta o incorrecta</summary>${q.options.map((option, i) => `<div class="distractor-row ${i === q.answer ? 'distractor-correct' : ''}"><b>${String.fromCharCode(65 + i)}. ${e(option)}</b><p>${e(q.distractors[i])}</p></div>`).join('')}</details><div class="learning-objective"><b>Objetivo de aprendizaje</b><p>${e(q.objective)}</p></div><div class="source-box"><div><b>${icon('book')} Comprueba el concepto en el libro</b><p>Consulta su texto, tablas y diagramas originales. Abre la vista previa para ampliar.</p></div><button class="inline-source-preview" data-action="source-page" data-page="${q.sourcePages[0]}" aria-label="Ampliar página PDF ${q.sourcePages[0]}"><span class="page-image-scroll"><img class="book-page-image" data-book-image="${q.sourcePages[0]}" alt="Texto, tablas y diagramas originales de la página PDF ${q.sourcePages[0]}" loading="lazy"><span class="image-loading">Abriendo referencia original…</span></span><span>Ampliar página original ${icon('search')}</span></button><div class="source-buttons">${q.sourcePages.map(n => `<button class="btn btn-outline btn-small" data-action="source-page" data-page="${n}">PDF ${n}${book && book.pages[n - 1].printedPage ? ` · libro ${e(book.pages[n - 1].printedPage)}` : ''} ${icon('arrow')}</button>`).join('')}</div></div>${additionalReferences(q)}<p class="editorial-note">Dificultad editorial: ${q.difficulty === 'hard' ? 'alta' : q.difficulty === 'easy' ? 'básica' : 'intermedia'} · ${e((q.disciplines || []).join(' · '))}</p></div></section>`;
  }
  function sessionResult(s) { let correct = 0, unanswered = 0; for (const id of s.questionIds) { const r = s.responses[id] || {}; if (r.answer === byId.get(id).answer && r.committed) correct++; if (!Number.isInteger(r.answer) || !r.committed) unanswered++; } return { total: s.questionIds.length, correct, unanswered, incorrect: s.questionIds.length - correct }; }
  function reviewQuestions(s) { return s.questionIds.filter(id => { const r = s.responses[id], correct = r && r.answer === byId.get(id).answer; return reviewFilter === 'incorrect' ? !correct : reviewFilter === 'bookmarked' ? profile.bookmarks.includes(id) : true; }); }
  function renderReview(s) {
    const result = sessionResult(s), ids = reviewQuestions(s); reviewIndex = Math.max(0, Math.min(reviewIndex, ids.length - 1)); const q = ids.length ? byId.get(ids[reviewIndex]) : null;
    return `${pageTitle('SESIÓN COMPLETADA', s.mode === 'exam' ? `Revisión del simulacro ${s.formNumber}` : 'Revisión de tu práctica', `${date(s.finishedAt)} · ${s.questionIds.length} preguntas · ${s.finishReason === 'time' || s.finishReason === 'day_time' ? 'Finalizó al agotarse el tiempo' : 'Finalizada'}`, button('Nuevo bloque', 'go-study', 'btn-outline', 'study'))}<div class="metrics-grid review-metrics">${progressMetric('Aciertos', percent(result.correct, result.total), `${result.correct} / ${result.total} preguntas`, 'metric-accent')}${progressMetric('Respuestas correctas', result.correct, 'Conceptos para consolidar')}${progressMetric('Respuestas incorrectas', result.incorrect, `${result.unanswered} sin responder`)}${progressMetric('Duración de sesión', C.clock(s.finishedAt - s.startedAt), s.mode === 'exam' ? 'Incluye tutorial y descansos' : 'Incluye pausas de estudio')}</div><div class="review-toolbar"><div class="segmented" role="group" aria-label="Filtrar revisión">${[{ key: 'all', label: 'Todas' }, { key: 'incorrect', label: 'Incorrectas' }, { key: 'bookmarked', label: 'Marcadas' }].map(f => `<button class="${reviewFilter === f.key ? 'active' : ''}" data-action="review-filter" data-filter="${f.key}">${f.label}</button>`).join('')}</div><span>${ids.length} preguntas en esta vista</span><div class="review-jump"><label for="review-position">Ir a</label><select id="review-position" data-review-jump>${ids.map((id, i) => `<option value="${i}" ${i === reviewIndex ? 'selected' : ''}>${i + 1} · ${e(id)}</option>`).join('')}</select></div></div>${q ? `<article class="question-card review-question"><div class="question-meta"><span class="tag">${e(C.LABELS[q.category])}</span><span class="question-id">${e(q.id)}</span><button class="bookmark-btn ${profile.bookmarks.includes(q.id) ? 'marked' : ''}" data-action="bookmark" data-id="${e(q.id)}" aria-pressed="${profile.bookmarks.includes(q.id)}">${icon('star')} Marcar</button></div><p class="question-topic">${e(q.chapter)} <span>›</span> ${e(q.topic)}</p><div class="question-stem" lang="en">${e(q.stem).replace(/\n/g, '<br>')}</div><div class="review-options" lang="en">${q.options.map((option, i) => `<div class="review-option ${i === q.answer ? 'correct' : s.responses[q.id].answer === i ? 'wrong' : ''}"><span>${String.fromCharCode(65 + i)}</span><p>${e(option)}</p>${i === q.answer ? icon('check') : s.responses[q.id].answer === i ? icon('close') : ''}</div>`).join('')}</div>${renderExplanation(q, s.responses[q.id])}</article><div class="question-navigation"><button class="btn btn-outline" data-action="review-prev" ${reviewIndex === 0 ? 'disabled' : ''}>${icon('arrow', 'flip')} Anterior</button><span>${reviewIndex + 1} / ${ids.length}</span><button class="btn btn-primary" data-action="review-next" ${reviewIndex >= ids.length - 1 ? 'disabled' : ''}>Siguiente ${icon('arrow')}</button></div>` : `<div class="empty-state">${icon('check')}<h2>No hay preguntas en este filtro.</h2><p>Elige «Todas» para revisar la sesión completa.</p></div>`}`;
  }
  function renderStats() {
    const stats = C.calculateStats(profile.attempts, statsFirst), unique = C.firstAttempts(profile.attempts).length;
    const categories = Object.keys(C.QUOTAS), rows = Object.values(stats.topics).filter(v => !statsCategory || v.category === statsCategory).sort((a, b) => { const aRate = a.correct / a.total, bRate = b.correct / b.total; return aRate - bRate || b.total - a.total || a.topic.localeCompare(b.topic); });
    return `${pageTitle('TU APRENDIZAJE, EN DATOS', 'Descubre dónde avanzar.', 'Compara áreas y temas. El primer intento ayuda a distinguir comprensión inicial de mejora por repetición.')}<div class="stats-controls"><div class="segmented" role="group" aria-label="Tipo de intentos"><button class="${statsFirst ? 'active' : ''}" data-action="stats-first">Primer intento por pregunta</button><button class="${!statsFirst ? 'active' : ''}" data-action="stats-all">Todos los intentos</button></div><span>${statsFirst ? 'Cada pregunta cuenta una vez.' : 'Cada sesión cuenta; cambiar una selección no suma intentos.'}</span></div><div class="metrics-grid">${progressMetric('Precisión', percent(stats.correct, stats.total), statsFirst ? 'Solo primeros intentos' : 'Todas las sesiones', 'metric-accent')}${progressMetric('Intentos contabilizados', number(stats.total), `${number(unique)} preguntas únicas`)}${progressMetric('Correctas', number(stats.correct), 'Respuestas con la opción correcta')}${progressMetric('Incorrectas', number(stats.incorrect), `${number(stats.unanswered)} sin responder incluidas`)}</div><section class="panel"><div class="panel-heading"><div><p class="eyebrow">BALANCE POR CATEGORÍA</p><h2>Fortalezas y oportunidades</h2></div>${button('Ver preguntas erradas', 'study-incorrect', 'btn-outline btn-small')}</div><div class="category-stats">${categories.map(category => { const row = stats.categories[category] || { correct: 0, total: 0, incorrect: 0 }; const coverage = C.firstAttempts(profile.attempts.filter(a => a.category === category)).length; return `<div class="category-stat-row"><div class="category-stat-name"><b>${e(C.LABELS[category])}</b><small>${coverage}/${C.QUOTAS[category] * 10} preguntas únicas</small></div><div class="category-stat-bar">${bar(row.total ? row.correct / row.total * 100 : 0)}<span>${percent(row.correct, row.total)}</span></div><div class="stat-counts"><span class="positive">${row.correct} <small>aciertos</small></span><span>${row.incorrect} <small>errores</small></span></div><button class="icon-btn" data-action="practice-category" data-category="${e(category)}" aria-label="Practicar ${e(C.LABELS[category])}">${icon('arrow')}</button></div>`; }).join('')}</div><p class="inline-note">Los porcentajes con pocos intentos son inestables. No se calcula una nota USMLE ni una probabilidad de aprobar.</p></section><section class="panel"><div class="panel-heading"><div><p class="eyebrow">DETALLE POR TEMA</p><h2>Empieza por lo que más necesita repaso.</h2></div><select id="stats-category" aria-label="Filtrar temas por categoría">${selectOptions(Object.entries(C.LABELS).map(([value, label]) => ({ value, label })), statsCategory, 'Todas las categorías')}</select></div>${rows.length ? `<div class="table-scroll"><table class="topics-table"><thead><tr><th>Tema</th><th>Intentos</th><th>Aciertos</th><th>Errores</th><th>Precisión</th><th><span class="sr-only">Acción</span></th></tr></thead><tbody>${rows.map(row => `<tr><td><b>${e(row.topic)}</b><small>${e(C.LABELS[row.category])}</small></td><td>${row.total}</td><td class="positive">${row.correct}</td><td>${row.incorrect}</td><td><span class="accuracy-tag ${row.total < 5 ? 'limited' : row.correct / row.total >= .75 ? 'strong' : row.correct / row.total < .5 ? 'weak' : ''}">${percent(row.correct, row.total)}</span>${row.total < 5 ? '<small>Pocos intentos</small>' : ''}</td><td><button class="btn btn-text btn-small" data-action="practice-topic" data-category="${e(row.category)}" data-topic="${e(row.topic)}">Repasar ${icon('arrow')}</button></td></tr>`).join('')}</tbody></table></div>` : `<div class="empty-small"><p>Completa preguntas para ver resultados por tema.</p></div>`}</section>`;
  }
  async function loadBook() {
    if (book && toc) return;
    if (bookPromise) return bookPromise;
    const epoch = authEpoch;
    const operation = (async () => {
      const [b, t] = await Promise.all([loadData('./data/book.bin'), loadData('./data/toc.bin')]);
      if (epoch !== authEpoch || !profile) throw new Error('La sesión cambió mientras se abría el libro.');
      if (!b || !Array.isArray(b.pages) || b.pages.length !== b.pageCount || !Array.isArray(t)) throw new Error('Los archivos del libro están incompletos.'); book = b; toc = t;
    })();
    bookPromise = operation;
    try { await operation; } finally { if (bookPromise === operation) bookPromise = null; }
  }
  function renderBookLoading() { return `${pageTitle('BIBLIOTECA DE ESTUDIO', 'El libro, a tu alcance.', 'Páginas originales, diagramas y búsqueda de texto.')}<div class="loading-panel"><div class="spinner"></div><p>Abriendo el libro cifrado…</p></div>`; }
  function bookContents() { return toc.filter(t => t.level <= 2); }
  function renderBook() {
    bookPage = Math.max(1, Math.min(book.pageCount, bookPage)); const page = book.pages[bookPage - 1];
    return `${pageTitle('BIBLIOTECA DE ESTUDIO', 'Explora el libro completo.', 'Consulta las páginas originales y sus diagramas, o busca un concepto en el texto extraído.')}<div class="book-layout"><aside class="panel book-sidebar"><label class="search-label" for="book-search">Buscar en todo el libro</label><div class="search-field">${icon('search')}<input id="book-search" type="search" placeholder="Concepto, enfermedad, mecanismo…" value="${e(bookSearch)}" autocomplete="off"></div><p id="book-search-summary" class="search-summary">${bookSearch ? `${bookResults.length} páginas encontradas` : `${book.pageCount} páginas disponibles`}</p><div class="book-chapter-nav" id="book-nav">${bookSearch ? renderBookSearchResults() : bookContents().map(t => `<button data-action="book-page" data-page="${t.pdfPage}" class="book-toc-link ${t.pdfPage === bookPage ? 'active' : ''}"><span>${e(t.title.replace(/[▶\u2009]/g, '').trim())}</span><small>${e(t.printedPage || t.pdfPage)}</small></button>`).join('')}</div></aside><section class="book-viewer"><div class="book-toolbar"><div class="page-stepper"><button class="icon-btn" data-action="book-prev" aria-label="Página anterior" ${bookPage <= 1 ? 'disabled' : ''}>${icon('chevron', 'flip')}</button><label for="book-page-input">PDF</label><input id="book-page-input" type="number" min="1" max="${book.pageCount}" value="${bookPage}" aria-label="Número de página PDF"><span>/ ${book.pageCount}</span><button class="icon-btn" data-action="book-next" aria-label="Página siguiente" ${bookPage >= book.pageCount ? 'disabled' : ''}>${icon('chevron')}</button></div><span class="printed-page">Página impresa ${e(page.printedPage || 'sin numeración')}</span><label class="zoom-label">Zoom<select id="book-zoom">${[75, 100, 125, 150, 200].map(z => `<option value="${z}" ${bookZoom === z ? 'selected' : ''}>${z}%</option>`).join('')}</select></label></div><div class="page-image-scroll"><img class="book-page-image" data-book-image="${bookPage}" alt="Página PDF ${bookPage}, página impresa ${e(page.printedPage)} del libro First Aid for the USMLE Step 1 2026" style="width:${bookZoom}%" loading="lazy"><div class="image-loading">Descifrando página…</div></div><details class="book-text"><summary>Texto extraído de esta página</summary><pre>${e(page.text)}</pre></details><div class="book-page-study"><p>${questionsForPage(bookPage).length} preguntas con referencia a esta página.</p>${button('Practicar esta página', 'practice-page', 'btn-outline btn-small', 'study')}</div></section></div>`;
  }
  function searchBook(text) { const query = text.trim().toLowerCase(); if (!query) return []; const words = query.split(/\s+/).filter(Boolean); return book.pages.filter(page => words.every(word => page.text.toLowerCase().includes(word))).map(page => { const lower = page.text.toLowerCase(), offset = Math.max(0, lower.indexOf(words[0]) - 60); return { ...page, snippet: page.text.slice(offset, offset + 210).replace(/\s+/g, ' ') }; }); }
  function renderBookSearchResults() { return bookResults.length ? bookResults.slice(0, 200).map(p => `<button class="book-search-result" data-action="book-page" data-page="${p.pdfPage}"><b>PDF ${p.pdfPage} · libro ${e(p.printedPage)}</b><span>${e(p.snippet)}…</span></button>`).join('') + (bookResults.length > 200 ? '<p class="muted">Se muestran las primeras 200 páginas. Añade palabras para afinar la búsqueda.</p>' : '') : '<p class="muted">No encontramos páginas. Prueba otro término, preferentemente en inglés.</p>'; }
  async function pageURL(n) {
    if (pageURLs.has(n)) return pageURLs.get(n);
    if (pendingPageURLs.has(n)) return pendingPageURLs.get(n);
    const epoch = authEpoch;
    const operation = (async () => {
      const page = book.pages[n - 1]; if (!page || typeof page.image !== 'string' || !/^assets\/book\/page-\d{4}\.webp$/.test(page.image)) throw new Error('La referencia de imagen es inválida.');
      const path = './' + page.image.replace(/\.webp$/, '.bin'), bytes = await decryptFile(path);
      if (epoch !== authEpoch || !profile) throw new Error('La sesión cambió mientras se abría la página.');
      const url = URL.createObjectURL(new Blob([bytes], { type: 'image/webp' })); pageURLs.set(n, url);
      if (pageURLs.size > 15) { const first = pageURLs.keys().next().value; if (first !== n) { URL.revokeObjectURL(pageURLs.get(first)); pageURLs.delete(first); } }
      return url;
    })();
    pendingPageURLs.set(n, operation);
    try { return await operation; } finally { pendingPageURLs.delete(n); }
  }
  async function hydrateImages() {
    const token = ++currentPageToken;
    const images = [...document.querySelectorAll('[data-book-image]')]; if (!images.length) return;
    try { await loadBook(); } catch (error) { for (const img of images) { const loading = img.parentElement.querySelector('.image-loading'); if (loading) { loading.textContent = 'La referencia necesita conexión o una descarga previa.'; loading.classList.add('image-error'); } } return; }
    for (const img of images) {
      try { const url = await pageURL(Number(img.dataset.bookImage)); if (token !== currentPageToken || !img.isConnected) continue; img.onload = () => { const loading = img.parentElement.querySelector('.image-loading'); if (loading) loading.remove(); }; img.src = url; }
      catch (error) { if (!img.isConnected) continue; const loading = img.parentElement.querySelector('.image-loading'); if (loading) { loading.textContent = 'No se pudo abrir la imagen. Si no hay conexión, consulta una página descargada previamente.'; loading.classList.add('image-error'); } }
    }
  }
  function questionsForPage(n) { return bank.questions.filter(q => q.sourcePages.includes(n)); }
  function renderSettings() {
    return `${pageTitle('TU ESPACIO PERSONAL', 'Ajustes y respaldos.', 'Mantén tu avance disponible y elige cómo estudiar.')}<div class="two-columns settings-columns"><section class="panel"><div class="panel-heading"><div><p class="eyebrow">PROGRESO PERSONAL</p><h2>Tu historial te acompaña.</h2></div>${icon('lock', 'panel-symbol')}</div><p>El progreso de <b>${e(user.displayName || user.username)}</b> se guarda cifrado en este navegador con la clave de este perfil. No existe sincronización automática entre móvil y computador.</p><p>Exporta un respaldo después de estudiar. En el otro dispositivo, entra con el mismo usuario y contraseña e importa ese archivo.</p><div class="settings-actions">${button('Exportar respaldo cifrado', 'export-backup', 'btn-primary', 'download')}${button('Importar respaldo', 'import-backup', 'btn-outline', 'cloud')}</div><input type="file" id="backup-input" accept="application/json,.json" hidden><p class="inline-note">La importación sustituye el progreso actual de este usuario después de tu confirmación. El respaldo no puede abrirse con el otro perfil.</p><div class="storage-status" id="storage-status">Consultando almacenamiento…</div></section><section class="panel"><p class="eyebrow">TU PERFIL</p><h2>${e(user.displayName || user.username)}</h2><dl class="profile-details"><div><dt>Usuario</dt><dd>${e(user.username)}</dd></div><div><dt>Preguntas únicas intentadas</dt><dd>${C.firstAttempts(profile.attempts).length}</dd></div><div><dt>Sesiones completadas</dt><dd>${profile.completedSessions.length}</dd></div></dl><label for="font-size">Tamaño del texto de las preguntas</label><select id="font-size">${selectOptions([{ value: 'normal', label: 'Normal' }, { value: 'large', label: 'Grande' }, { value: 'xlarge', label: 'Muy grande' }], profile.preferences.fontSize || 'normal')}</select><div class="settings-actions">${button('Cerrar sesión', 'logout', 'btn-outline', 'logout')}</div><p class="muted">El contenido del banco y del libro está cifrado. Los perfiles son un acceso personal en una web estática, con almacenamiento local; no son cuentas de un servidor.</p></section><section class="panel"><p class="eyebrow">ESTUDIO SIN CONEXIÓN</p><h2>Descarga lo que necesitas.</h2><p>La aplicación guarda los archivos cifrados del banco y las páginas que consultas. Para tener todo el libro disponible sin conexión, puedes descargar sus 869 páginas.</p><div class="settings-actions">${button('Preparar banco sin conexión', 'offline-bank', 'btn-outline', 'download')}${button('Descargar libro completo', 'offline-book', 'btn-outline', 'book')}</div><div id="offline-progress" class="offline-progress" role="status"></div><p class="inline-note">Mantén esta pestaña abierta durante la descarga. El libro completo ocupa espacio considerable; el navegador puede borrar cachés si necesita espacio.</p></section><section class="panel"><p class="eyebrow">CUIDA TU AVANCE</p><h2>Antes de limpiar el navegador</h2><p>Eliminar los datos del sitio, usar modo privado o cambiar de navegador puede borrar tu progreso local. Guarda un respaldo para poder restaurarlo.</p><div class="settings-actions">${button('Reiniciar mi progreso', 'reset-progress', 'btn-danger-outline')}</div><p class="inline-note">Esta opción afecta únicamente a tu perfil. El historial del otro usuario conserva su propia clave y almacenamiento.</p></section></div>`;
  }
  async function updateStorageStatus() {
    const target = document.getElementById('storage-status'); if (!target) return;
    try {
      if (navigator.storage && navigator.storage.estimate) {
        const value = await navigator.storage.estimate();
        if (target.isConnected) target.textContent = `Datos del sitio: aproximadamente ${Math.round((value.usage || 0) / 1048576)} MB${Number.isFinite(value.quota) ? `; cuota aproximada de ${(value.quota / 1073741824).toFixed(1)} GB para este origen.` : '.'}`;
      } else target.textContent = 'Usa respaldos para proteger tu progreso.';
    } catch (_) { if (target.isConnected) target.textContent = 'No se pudo consultar el espacio. Guarda un respaldo de tu progreso.'; }
  }
  function showModal(title, content, css = '') { modalRevision++; modal.className = `app-modal ${css}`; modal.innerHTML = `<div class="modal-header"><h2 id="modal-title">${e(title)}</h2><button class="icon-btn" data-action="close-modal" aria-label="Cerrar">${icon('close')}</button></div><div class="modal-body">${content}</div>`; if (!modal.open) modal.showModal(); }
  async function confirmAction(title, content, label = 'Confirmar', danger = false) {
    return new Promise(resolve => {
      showModal(title, `<p>${e(content)}</p><div class="modal-actions"><button class="btn btn-outline" data-action="close-modal">Cancelar</button><button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" id="confirm-modal">${e(label)}</button></div>`, 'confirm-modal');
      let resolved = false; const finish = answer => { if (resolved) return; resolved = true; modal.removeEventListener('close', cancelled); resolve(answer); };
      const cancelled = () => finish(false); modal.addEventListener('close', cancelled); document.getElementById('confirm-modal').addEventListener('click', () => { finish(true); modal.close(); }, { once: true });
    });
  }
  async function showBookPage(n, laboratory = false) {
    if (examActive() && !laboratory) return;
    showModal(laboratory ? 'Valores de laboratorio' : `Referencia · página PDF ${n}`, '<div class="loading-panel"><div class="spinner"></div><p>Abriendo página…</p></div>', 'source-modal');
    const revision = modalRevision;
    try {
      await loadBook(); if (!modal.open || modalRevision !== revision || (examActive() && !laboratory)) return;
      const pages = laboratory ? [20, 21] : [Number(n)];
      showModal(laboratory ? 'Valores de laboratorio' : `Referencia · PDF ${n} · libro ${book.pages[n - 1].printedPage}`, `<p class="source-caption">${laboratory ? 'Tablas de referencia del libro, disponibles durante el examen.' : 'Página original: incluye sus tablas, figuras y diagramas. Usa el zoom para leer con detalle.'}</p><label class="zoom-label">Zoom<select id="source-zoom"><option value="100">100%</option><option value="125">125%</option><option value="150">150%</option><option value="200">200%</option></select></label>${pages.map(p => `<div class="source-page"><h3>PDF ${p} · página impresa ${e(book.pages[p - 1].printedPage)}</h3><div class="page-image-scroll"><img class="book-page-image" data-book-image="${p}" alt="Página PDF ${p}, valores o diagramas originales del libro" loading="lazy"><div class="image-loading">Descifrando página…</div></div><details class="book-text"><summary>Texto extraído</summary><pre>${e(book.pages[p - 1].text)}</pre></details></div>`).join('')}${!laboratory ? `<div class="modal-actions"><button class="btn btn-outline" data-action="open-book-page" data-page="${n}">Abrir en el explorador ${icon('arrow')}</button></div>` : ''}`, 'source-modal');
      hydrateImages();
    } catch (error) { if (modal.open && modalRevision === revision) showModal('No se pudo abrir la página', `<p>${e(error.message)}</p>`); }
  }
  function showBlueprint() { showModal('Distribución de cada simulacro', `<p>Una distribución editorial situada dentro de los intervalos publicados para Step 1. Cada pregunta tiene una categoría principal y etiquetas adicionales de disciplina.</p><div class="table-scroll"><table><thead><tr><th>Categoría</th><th>Por examen</th><th>Banco</th></tr></thead><tbody>${Object.entries(C.QUOTAS).map(([cat, count]) => `<tr><td>${e(C.LABELS[cat])}</td><td>${count}</td><td>${count * 10}</td></tr>`).join('')}</tbody><tfoot><tr><th>Total</th><th>280</th><th>2.800</th></tr></tfoot></table></div><p>La dificultad se estima por revisión editorial. No se ha realizado calibración psicométrica con una población de examinandos.</p>`); }
  function focusContent() { const main = document.getElementById('main-content'); if (main) { main.tabIndex = -1; main.focus({ preventScroll: true }); main.scrollIntoView({ block: 'start' }); } }
  function navigate(name) { route = name; location.hash = name; render(); window.scrollTo({ top: 0, behavior: 'instant' }); if (route === 'settings') updateStorageStatus(); }
  async function startStudy(customIds, title) {
    if (examActive()) return;
    const epoch = authEpoch;
    if (profile.activeSession) { const answer = await confirmAction('Hay una práctica pendiente', 'Para empezar otra sesión, la práctica pendiente debe finalizar. Sus preguntas no confirmadas se contarán como incorrectas. ¿Quieres finalizarla?', 'Finalizar y continuar'); if (!answer) return; await finishStudy(false); }
    if (!sameAccount(epoch) || examActive()) return;
    let selected;
    if (customIds) selected = customIds.slice(0, 280);
    else { let found = matchingStudy(); found = studyFilters.order === 'book' ? C.orderedQuestions(found) : C.shuffle(found, randomId()); selected = found.slice(0, Number(studyFilters.count)).map(q => q.id); }
    if (!selected.length) { toast('No hay preguntas disponibles con estos filtros.'); return; }
    profile.activeSession = C.createStudySession(selected, studyFilters.timed, Date.now(), randomId(), title || studyFilters.chapter || (studyFilters.category && C.LABELS[studyFilters.category]) || 'Práctica guiada'); await persistProgress(); if (sameAccount(epoch)) navigate('session');
  }
  async function startExam() {
    if (profile.activeSession) { toast('Finaliza la sesión pendiente antes de iniciar un examen.'); return; }
    const epoch = authEpoch;
    const number = Number(document.getElementById('exam-form').value);
    if (!(await confirmAction(`Comenzar simulacro ${number}`, 'Son 280 preguntas en 14 bloques de 30 minutos. El reloj continúa al salir o recargar. Las explicaciones aparecen al terminar. ¿Estás listo para iniciar?', 'Iniciar examen'))) return;
    if (!sameAccount(epoch) || profile.activeSession) return;
    profile.activeSession = C.createExamSession(getForm(number), number, Date.now(), randomId()); await persistProgress(); if (sameAccount(epoch)) navigate('session');
  }
  async function commitStudyAnswer() {
    const s = profile.activeSession; if (!s || s.mode !== 'study' || s.pausedRemainingMs !== null) return;
    reconcileSession(); if (!profile.activeSession) { await persistProgress(); render(); return; }
    const q = currentQuestion(s), r = s.responses[q.id]; if (!r || !Number.isInteger(r.answer) || r.committed) return;
    C.commitQuestion(s, q.id, Date.now(), false); C.ingestAttempts(profile, s, byId); await persistProgress(); render();
    const explanation = document.querySelector('.explanation'); if (explanation) explanation.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  async function finishStudy(ask = true) {
    const s = profile.activeSession; if (!s || s.mode !== 'study') return;
    const epoch = authEpoch;
    if (ask && !(await confirmAction('Finalizar práctica', 'Las preguntas no confirmadas se contarán como incorrectas. Después podrás revisar toda la sesión.', 'Finalizar práctica'))) return;
    if (!sameAccount(epoch) || profile.activeSession?.id !== s.id) return;
    C.completeSession(s, Date.now(), 'submitted'); C.ingestAttempts(profile, s, byId); profile.completedSessions.push(s); profile.activeSession = null; await persistProgress(); if (ask && sameAccount(epoch)) navigate(`review/${s.id}`);
  }
  async function finishBlock() {
    const s = profile.activeSession; if (!s || s.mode !== 'exam' || s.stage !== 'block') return;
    const epoch = authEpoch;
    const confirmedBlockIndex = s.blockIndex, confirmedSessionId = s.id;
    const unanswered = s.questionIds.slice(s.blockIndex * 20, s.blockIndex * 20 + 20).filter(id => !s.responses[id] || !Number.isInteger(s.responses[id].answer)).length;
    if (!(await confirmAction(`Cerrar bloque ${s.blockIndex + 1}`, `${unanswered ? `Quedan ${unanswered} preguntas sin respuesta; se contarán como incorrectas. ` : 'Has seleccionado respuesta para las 20 preguntas. '}No podrás volver a este bloque durante el examen.`, 'Cerrar bloque'))) return;
    if (!sameAccount(epoch)) return;
    reconcileSession();
    if (profile.activeSession && profile.activeSession.id === confirmedSessionId && s.stage === 'block' && s.blockIndex === confirmedBlockIndex) C.endExamBlock(s, Date.now());
    reconcileSession(); await persistProgress(); render();
  }
  async function moveQuestion(index) {
    const s = profile.activeSession; if (!s) return; const before = sessionSignature(s); reconcileSession(); if (!profile.activeSession || sessionSignature(s) !== before) { await persistProgress(); render(); return; }
    const start = s.mode === 'exam' ? s.blockIndex * 20 : 0, end = s.mode === 'exam' ? start + 20 : s.questionIds.length;
    if (s.mode === 'exam' && s.stage !== 'block') return;
    if (index < start || index >= end) return;
    s.currentIndex = index; await persistProgress(); render(); window.scrollTo({ top: 0, behavior: 'instant' });
  }
  async function selectOption(index) {
    if (!Number.isInteger(index) || index < 0 || index > 4) return;
    const s = profile.activeSession; if (!s || s.status !== 'active' || !(s.stage === 'block' || s.stage === 'study') || s.pausedRemainingMs !== undefined && s.pausedRemainingMs !== null) return;
    const before = sessionSignature(s); reconcileSession(); if (!profile.activeSession || sessionSignature(s) !== before) { await persistProgress(); render(); return; }
    const q = currentQuestion(s), r = s.responses[q.id] || (s.responses[q.id] = {}); if (r.committed) return;
    r.answer = index; r.excluded = (r.excluded || []).filter(i => i !== index); await persistProgress(); render();
  }
  async function toggleExcluded(index) {
    if (!Number.isInteger(index) || index < 0 || index > 4) return;
    const s = profile.activeSession; if (!s || s.status !== 'active' || !['block', 'study'].includes(s.stage) || s.pausedRemainingMs !== undefined && s.pausedRemainingMs !== null) return;
    const before = sessionSignature(s); reconcileSession(); if (!profile.activeSession || sessionSignature(s) !== before) { await persistProgress(); render(); return; }
    const q = currentQuestion(s), r = s.responses[q.id] || (s.responses[q.id] = {}); if (r.committed) return;
    r.excluded = r.excluded || []; const at = r.excluded.indexOf(index);
    if (at >= 0) r.excluded.splice(at, 1); else { r.excluded.push(index); if (r.answer === index) r.answer = null; }
    await persistProgress(); render();
  }
  function sessionSignature(s) { return `${s.id}:${s.status}:${s.stage}:${s.blockIndex}:${s.currentIndex}`; }
  async function toggleBookmark(qid) { if (!byId.has(qid)) return; const i = profile.bookmarks.indexOf(qid); if (i >= 0) profile.bookmarks.splice(i, 1); else profile.bookmarks.push(qid); await persistProgress(); render(); }
  async function exportBackup() {
    try {
      reconcileSession();
      // Rescue uses the in-memory snapshot and never waits for IndexedDB.
      const username = user.username, snapshot = JSON.stringify(profile), key = profileKey;
      const encrypted = await encryptText(snapshot, key);
      const payload = { format: 'StepOneBackup', version: 1, username, createdAt: new Date().toISOString(), iv: base64(encrypted.iv), data: base64(encrypted.data) };
      download(JSON.stringify(payload), `step-one-${username}-${new Date().toISOString().slice(0, 10)}.json`, 'application/json'); toast('Respaldo cifrado exportado. Guárdalo para continuar en otro dispositivo.');
    } catch (error) { toast(`No se pudo exportar: ${error.message}`, true); }
  }
  function download(content, filename, type) { const url = URL.createObjectURL(new Blob([content], { type })), a = document.createElement('a'); a.href = url; a.download = filename; a.style.display = 'none'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000); }
  async function importBackup(file) {
    try {
      const epoch = authEpoch, username = user.username, key = profileKey;
      if (!file || file.size > 100 * 1048576) throw new Error('El archivo no es válido o excede 100 MB.');
      const payload = JSON.parse(await file.text()); if (!sameAccount(epoch)) return; if (payload.format !== 'StepOneBackup' || payload.version !== 1 || payload.username !== username || typeof payload.iv !== 'string' || typeof payload.data !== 'string') throw new Error('Este respaldo no pertenece al perfil actual o usa otro formato.');
      const restored = await decryptRecord({ iv: unbase64(payload.iv), data: unbase64(payload.data) }, key); if (!sameAccount(epoch)) return; C.validateProfile(restored, username, byId);
      if (!(await confirmAction('Restaurar respaldo', `Este archivo tiene ${restored.attempts.length} intentos y ${restored.completedSessions.length} sesiones. Sustituirá todo el progreso actual de ${user.displayName || user.username}. Exporta el actual antes si deseas conservarlo.`, 'Sustituir progreso'))) return;
      await saveQueue.catch(() => {}); if (!sameAccount(epoch)) return; profile = restored; reconcileSession(); await persistProgress(); if (!sameAccount(epoch)) return; statsFirst = profile.preferences.firstStats !== false; navigate(profile.activeSession ? 'session' : 'home'); toast(saveError ? 'Respaldo abierto en memoria. El navegador no lo guardó; conserva el archivo antes de cerrar.' : 'Respaldo restaurado. Los relojes de examen conservaron sus plazos originales.', Boolean(saveError));
    } catch (error) { toast(`No se importó el respaldo: ${error.message}`, true); }
  }
  async function downloadOffline(includeBook) {
    if (offlineDownloading) { toast('Ya hay una descarga en curso.'); return; }
    if (!('caches' in window)) { toast('Este navegador no ofrece caché sin conexión. Usa HTTPS.', true); return; }
    if (includeBook && !(await confirmAction('Descargar libro completo', 'Se descargarán 869 páginas cifradas. La descarga puede ocupar cientos de MB y varios minutos. Mantén abierta esta pestaña y usa una conexión estable.', 'Descargar libro'))) return;
    offlineDownloading = true; let done = 0;
    const status = message => { const el = document.getElementById('offline-progress'); if (el) el.textContent = message; };
    try {
      await loadBook(); const paths = ['./data/questions.bin', './data/book.bin', './data/toc.bin']; if (includeBook) paths.push(...book.pages.map(p => './' + p.image.replace(/\.webp$/, '.bin')));
      const cache = await caches.open(DATA_CACHE); let next = 0, failed = false;
      const results = await Promise.allSettled(Array.from({ length: 3 }, async () => {
        try { while (!failed && next < paths.length) { const path = paths[next++]; if (!(await cache.match(path))) { const response = await fetch(path); if (!response.ok) throw new Error(`Faltó descargar ${path}`); await cache.put(path, response); } done++; status(`Descargado ${done}/${paths.length} archivos (${Math.round(done / paths.length * 100)}%).`); } }
        catch (error) { failed = true; throw error; }
      }));
      const problem = results.find(result => result.status === 'rejected'); if (problem) throw problem.reason;
      status(`${includeBook ? 'Libro completo y banco' : 'Banco y texto del libro'} disponibles sin conexión. La aplicación también necesita haberse abierto antes en este navegador.`); toast('Descarga completada.'); updateStorageStatus();
    } catch (error) { status(`Descarga interrumpida después de ${done} archivos. Los completados se conservaron. Puedes volver a intentarlo.`); toast(error.message, true); }
    finally { offlineDownloading = false; }
  }
  async function logout() {
    try { await saveProfile(); await saveQueue; }
    catch (_) { toast('El progreso no se guardó. Exporta un respaldo antes de cerrar.', true); return; }
    clearInterval(clockInterval); clearTimeout(searchTimeout); currentPageToken++;
    for (const url of pageURLs.values()) URL.revokeObjectURL(url);
    pageURLs.clear(); pendingPageURLs.clear(); authEpoch++; bookPromise = null;
    user = null; profile = null; profileKey = null; contentKey = null; bank = null; byId = null; getForm = null; book = null; toc = null;
    studyFilters = defaultStudyFilters(); statsCategory = ''; bookSearch = ''; bookResults = []; bookPage = 1; bookZoom = 100; reviewIndex = 0; reviewFilter = 'all';
    modal.close(); route = 'home'; location.hash = ''; renderLogin();
  }
  async function act(action, el) {
    if (action === 'reload') return location.reload();
    if (action === 'show-password') { const input = document.getElementById('password'); input.type = input.type === 'password' ? 'text' : 'password'; el.textContent = input.type === 'password' ? 'Ver' : 'Ocultar'; return; }
    if (action === 'close-modal') return modal.close();
    if (!profile) return;
    if (action === 'book-order-study') { studyFilters = { ...studyFilters, category: '', chapter: '', topic: '', search: '', status: 'unseen', order: 'book' }; return navigate('study'); }
    if (['go-study', 'go-exams', 'go-book', 'account'].includes(action)) return navigate({ 'go-study': 'study', 'go-exams': 'exams', 'go-book': 'book', account: 'settings' }[action]);
    if (action === 'continue') return navigate('session');
    if (action === 'blueprint') return showBlueprint();
    if (action === 'start-study') return startStudy();
    if (action === 'start-exam') return startExam();
    if (action === 'choose-form') { const target = document.getElementById('exam-form'); target.value = el.dataset.form; target.focus(); target.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
    if (action === 'select-option') return selectOption(Number(el.dataset.index));
    if (action === 'submit-answer') return commitStudyAnswer();
    if (action === 'bookmark') return toggleBookmark(el.dataset.id);
    if (action === 'jump') return moveQuestion(Number(el.dataset.index));
    if (action === 'previous' || action === 'next') return profile.activeSession && moveQuestion(profile.activeSession.currentIndex + (action === 'previous' ? -1 : 1));
    if (action === 'finish-study') return finishStudy();
    if (action === 'finish-block') return finishBlock();
    if (action === 'exclude-option') return toggleExcluded(Number(el.dataset.index));
    if (['skip-tutorial', 'end-break', 'pause-study', 'resume-study'].includes(action)) { const s = profile.activeSession; if (!s) return; reconcileSession(); if (!profile.activeSession) { await persistProgress(); render(); return; } ({ 'skip-tutorial': C.endTutorial, 'end-break': C.endBreak, 'pause-study': C.pauseStudy, 'resume-study': C.resumeStudy })[action](s, Date.now()); reconcileSession(); await persistProgress(); render(); return; }
    if (action === 'source-page') return showBookPage(Number(el.dataset.page));
    if (action === 'laboratory') return showBookPage(20, true);
    if (action === 'open-book-page') { bookPage = Number(el.dataset.page); modal.close(); return navigate('book'); }
    if (action === 'book-page' || action === 'book-prev' || action === 'book-next') { bookPage = action === 'book-page' ? Number(el.dataset.page) : bookPage + (action === 'book-prev' ? -1 : 1); shell(renderBook()); return; }
    if (action === 'practice-page') { const ids = questionsForPage(bookPage).map(q => q.id); if (!ids.length) return toast('Esta página no tiene preguntas vinculadas.'); return startStudy(ids, `Referencia PDF ${bookPage}`); }
    if (action === 'practice-category') { studyFilters = { ...studyFilters, category: el.dataset.category, chapter: '', topic: '', status: 'all' }; return navigate('study'); }
    if (action === 'practice-topic') { studyFilters = { ...studyFilters, category: el.dataset.category, chapter: '', topic: el.dataset.topic, status: 'all' }; return navigate('study'); }
    if (action === 'study-incorrect') { studyFilters.status = 'incorrect'; studyFilters.category = ''; studyFilters.topic = ''; studyFilters.chapter = ''; return navigate('study'); }
    if (action === 'stats-first' || action === 'stats-all') { statsFirst = action === 'stats-first'; profile.preferences.firstStats = statsFirst; await persistProgress(); render(); return; }
    if (action === 'review-filter') { reviewFilter = el.dataset.filter; reviewIndex = 0; return render(); }
    if (action === 'review-prev' || action === 'review-next') { reviewIndex += action === 'review-prev' ? -1 : 1; render(); window.scrollTo({ top: 0, behavior: 'instant' }); return; }
    if (action === 'export-backup') return exportBackup();
    if (action === 'import-backup') return document.getElementById('backup-input').click();
    if (action === 'offline-bank' || action === 'offline-book') return downloadOffline(action === 'offline-book');
    if (action === 'logout') return logout();
    if (action === 'reset-progress') {
      if (examActive()) return toast('Finaliza el examen antes de reiniciar el progreso.');
      const epoch = authEpoch;
      if (!(await confirmAction('Reiniciar tu progreso', `Se borrarán todos los intentos, marcadores y sesiones de ${user.displayName || user.username} de este navegador. Guarda un respaldo antes si quieres conservarlos.`, 'Borrar mi progreso', true))) return;
      await saveQueue.catch(() => {}); if (!sameAccount(epoch)) return;
      const previous = profile; profile = C.newProfile(user.username);
      try { await saveProfile(); }
      catch (error) { if (sameAccount(epoch)) { profile = previous; render(); } throw error; }
      if (!sameAccount(epoch)) return;
      navigate('home'); return toast('El progreso de tu perfil se reinició.');
    }
  }
  document.addEventListener('click', event => {
    const skip = event.target.closest('a.skip-link'); if (skip) { event.preventDefault(); focusContent(); return; }
    const link = event.target.closest('a.nav-disabled'); if (link) { event.preventDefault(); toast('El libro, las estadísticas y otras prácticas se habilitan al terminar el examen.'); return; }
    const el = event.target.closest('[data-action]'); if (!el || el.disabled) return; event.preventDefault(); act(el.dataset.action, el).catch(error => toast(error.message || 'No se pudo completar la acción.', true));
  });
  document.addEventListener('change', async event => {
    const el = event.target;
    try {
      if (el.dataset.filter) {
        const key = el.dataset.filter; studyFilters[key] = key === 'timed' ? el.checked : key === 'count' ? Number(el.value) : el.value;
        if (key === 'category') {
          if (studyFilters.chapter && !bank.questions.some(q => (!studyFilters.category || q.category === studyFilters.category) && q.chapter === studyFilters.chapter)) studyFilters.chapter = '';
          studyFilters.topic = '';
        } else if (key === 'chapter') studyFilters.topic = '';
        shell(renderStudy());
      }
      else if (el.id === 'stats-category') { statsCategory = el.value; render(); }
      else if (el.id === 'book-page-input') { bookPage = Math.max(1, Math.min(book.pageCount, Number(el.value) || 1)); shell(renderBook()); }
      else if (el.id === 'book-zoom') { bookZoom = Number(el.value); document.querySelector('.book-page-image').style.width = `${bookZoom}%`; }
      else if (el.id === 'source-zoom') { modal.querySelectorAll('.book-page-image').forEach(img => img.style.width = `${Number(el.value)}%`); }
      else if (el.hasAttribute('data-review-jump')) { reviewIndex = Number(el.value); render(); }
      else if (el.id === 'font-size') { profile.preferences.fontSize = el.value; await persistProgress(); document.body.dataset.font = el.value; }
      else if (el.id === 'backup-input') { await importBackup(el.files[0]); el.value = ''; }
    } catch (error) { toast(error.message, true); }
  });
  document.addEventListener('input', event => {
    if (event.target.id !== 'book-search') return; bookSearch = event.target.value; clearTimeout(searchTimeout); searchTimeout = setTimeout(() => { if (!book || route !== 'book') return; bookResults = searchBook(bookSearch); const nav = document.getElementById('book-nav'), summary = document.getElementById('book-search-summary'); if (nav) nav.innerHTML = bookSearch ? renderBookSearchResults() : bookContents().map(t => `<button data-action="book-page" data-page="${t.pdfPage}" class="book-toc-link"><span>${e(t.title)}</span><small>${e(t.printedPage)}</small></button>`).join(''); if (summary) summary.textContent = bookSearch ? `${bookResults.length} páginas encontradas` : `${book.pageCount} páginas disponibles`; }, 220);
  });
  document.addEventListener('keydown', event => {
    if (!profile || modal.open || /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName) || event.ctrlKey || event.altKey || event.metaKey) return;
    if (route === 'session' && profile.activeSession) { const s = profile.activeSession; if (!(s.stage === 'block' || s.stage === 'study') || s.pausedRemainingMs !== undefined && s.pausedRemainingMs !== null) return; if (/^[1-5]$/.test(event.key)) { event.preventDefault(); selectOption(Number(event.key) - 1).catch(err => toast(err.message, true)); } else if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); moveQuestion(s.currentIndex + (event.key === 'ArrowRight' ? 1 : -1)).catch(err => toast(err.message, true)); } else if (event.key === 'Enter' && s.mode === 'study' && event.target.tagName !== 'BUTTON') { event.preventDefault(); commitStudyAnswer().catch(err => toast(err.message, true)); } }
  });
  window.addEventListener('hashchange', () => { const next = location.hash.slice(1) || 'home'; if (next === 'main-content') { focusContent(); return; } if (!profile) return; if (route !== next) { route = next; if (route.startsWith('review/')) { reviewIndex = 0; reviewFilter = 'all'; } render(); if (route === 'settings') updateStorageStatus(); window.scrollTo({ top: 0, behavior: 'instant' }); } });
  function updateClock() {
    if (!profile || !profile.activeSession) return; const s = profile.activeSession, now = Date.now();
    for (const el of document.querySelectorAll('[data-clock="stage"]')) { el.textContent = s.deadlineAt === null ? 'Sin límite' : C.clock(s.deadlineAt - now); el.closest('.clock-pill')?.classList.toggle('clock-warning', s.deadlineAt !== null && s.deadlineAt - now < 5 * 60000); }
    for (const el of document.querySelectorAll('[data-clock="day"]')) el.textContent = C.clock(s.dayDeadlineAt - now);
  }
  function tick() {
    if (!profile || !profile.activeSession) return;
    if (reconcileSession()) { if (modal.open) modal.close(); saveProfile().catch(() => {}); render(); toast(profile.activeSession ? 'El tiempo terminó. La sesión avanzó según su reloj.' : 'Sesión finalizada. Ya puedes revisar tus respuestas.'); }
    updateClock();
  }
  function startClock() { clearInterval(clockInterval); clockInterval = setInterval(tick, 1000); tick(); }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });
  window.addEventListener('focus', tick);
  window.addEventListener('online', updateNetwork); window.addEventListener('offline', updateNetwork);
  function updateNetwork() { const el = document.getElementById('network-status'); if (el) { el.textContent = navigator.onLine ? 'En línea' : 'Sin conexión'; el.classList.toggle('offline', !navigator.onLine); } }
  window.addEventListener('beforeunload', event => { if (saving || saveError) { event.preventDefault(); event.returnValue = ''; } });
  modal.addEventListener('click', event => { if (event.target === modal) { const rect = modal.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) modal.close(); } });
  boot();
})();
