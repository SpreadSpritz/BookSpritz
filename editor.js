// === BookSpritz: Editor (chapters, pages, pagination, flags, find, readonly) ===

function getCleanHTML(el) { const cl = el.cloneNode(true); cl.querySelectorAll('span.keyword-span,mark.find-match,mark.find-active').forEach(m => m.replaceWith(document.createTextNode(m.textContent))); cl.querySelectorAll('.canvas-flag').forEach(f => f.remove()); return cl.innerHTML; }

function loadData() {
    const sd = safeStorage.get(DB_KEY);
    if (sd) {
        try { appData = JSON.parse(sd); } catch(e) { console.error('Corrupt save data, starting fresh:', e); appData = {books:[],colorPresets:['#000000','#FFFFFF','#FF0000','#0000FF','#008000','#FFFF00','#FFA500','#800080','#FFC0CB','#008080']}; } if (!appData.colorPresets) appData.colorPresets = ['#000000','#FFFFFF','#FF0000','#0000FF','#008000','#FFFF00','#FFA500','#800080','#FFC0CB','#008080'];
        // Migration: Move global postIts to chapter scopes
        if (appData.postIts && appData.postIts.length) {
            const book = getActiveBook(); if (book) book.chapters.forEach(ch => {
                ch.flags = appData.postIts.filter(f => f.pageId && ch.pages.some(p => p.id === f.pageId));
            });
            delete appData.postIts;
        }
        const book1 = getActiveBook(); if (book1) book1.chapters.forEach(ch => { if (ch.content && !ch.pages) { ch.pages = [{id:'pg_'+Date.now(), content:ch.content}]; delete ch.content; } if (!ch.pages) ch.pages = []; if (!ch.flags) ch.flags = []; });
    } else {
        migrateToMultiBook();
        const dId = 'ch_' + Date.now();
        const eb = getActiveBook(); eb.chapters.push({id:dId, title:"Chapter 1: The Beginning", pages:[{id:'pg_'+Date.now(), content:"<h2 class='page-title'>Chapter 1: The Beginning</h2><p>Start writing your masterpiece here... Try adding 'John' as a keyword, then replace it with 'Jack'.</p>"}], flags:[]});
        activeChapterId = dId; saveData();
    }
    const book2 = getActiveBook(); if (!book2.chapters || book2.chapters.length === 0) { const nId = 'ch_' + Date.now(); book2.chapters.push({id:nId, title:"Chapter 1", pages:[{id:'pg_'+Date.now(), content:"<h2 class='page-title'>Chapter 1</h2><p><br></p>"}], flags:[]}); activeChapterId = nId; saveData(); }
    const book3 = getActiveBook(); if (!activeChapterId || !book3.chapters.find(c => c.id === activeChapterId)) activeChapterId = book3.chapters[0].id;
}

function saveData() {
    const ac = getActiveBook().chapters.find(c => c.id === activeChapterId);
    if (ac && !document.body.classList.contains('readonly-mode')) {
        ac.pages = []; 
        document.querySelectorAll('#pagesWrapper .page').forEach(el => ac.pages.push({id:el.dataset.id, content:getCleanHTML(el)}));
        ac.flags = [];
        document.querySelectorAll('.canvas-flag').forEach(el => {
            ac.flags.push({ id: el.dataset.id, pageId: el.dataset.pageId, y: parseFloat(el.style.top), isRight: el.classList.contains('right'), color: el.querySelector('.flag-body').style.backgroundColor, text: el.querySelector('.flag-text').value });
        });
    }
    const saved = safeStorage.set(DB_KEY, JSON.stringify(appData));
    if (currentUser && db) db.ref('users/' + currentUser.uid + '/appData').set(appData).then(() => updateSaveIndicator('saved')).catch(err => { console.error("Sync failed:", err); updateSaveIndicator('error'); });
    else if (saved) updateSaveIndicator('saved');
    else updateSaveIndicator('error');
}
function debouncedSave() { clearTimeout(saveTimeout); updateSaveIndicator('saving'); const ms = (appData.settings && appData.settings.autosave) || 2000; saveTimeout = setTimeout(() => { saveData(); trackWordDelta(); }, ms); }

function renderUI() { renderBookSelect(); renderChapters(); if (!document.body.classList.contains('readonly-mode')) { renderActiveChapterContent(); renderCanvasPostIts(); } LoreSystem.renderKeywords(); LoreSystem.highlightKeywords(); }

function switchChapter(newId) {
    if (newId === activeChapterId || document.body.classList.contains('readonly-mode')) return;
    saveData(); // 1. Save current text and flags to the old chapter
    activeChapterId = newId; // 2. Set new active ID
    if (window.matchMedia('(max-width: 768px)').matches) $('sidebar').classList.add('collapsed'); // 3. Close sidebar on mobile so user sees the editor
    renderUI(); // 4. Re-render editor with new chapter's data and flags
}

function renderChapters() {
    chapterList.innerHTML = '';
    const dragHandleSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="18" r="1"/></svg>';
    getActiveBook().chapters.forEach((chapter, idx) => {
        const li = document.createElement('li');
        li.className = 'chapter-item' + (chapter.id === activeChapterId ? ' active' : '');
        li.dataset.id = chapter.id;
        li.dataset.idx = idx;
        li.draggable = false;
        li.innerHTML = `<span class="chapter-drag-handle" title="Drag to reorder">${dragHandleSvg}</span><span class="chapter-title-text">${escapeHTML(chapter.title)}</span><div class="chapter-actions"><button class="chapter-icon-btn" data-action="rename" data-id="${chapter.id}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button><button class="chapter-icon-btn" data-action="delete" data-id="${chapter.id}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button></div>`;
        li.addEventListener('click', e => { if (!e.target.closest('.chapter-actions') && !e.target.closest('.chapter-drag-handle')) switchChapter(chapter.id); });
        li.querySelector('[data-action="rename"]').addEventListener('click', e => { e.stopPropagation(); const ch = getActiveBook().chapters.find(c => c.id === chapter.id); CustomUI.prompt('Rename Chapter:', ch.title, newTitle => { if (newTitle && newTitle.trim()) { ch.title = newTitle.trim(); saveData(); renderUI(); } }); });
        li.querySelector('[data-action="delete"]').addEventListener('click', e => { e.stopPropagation(); CustomUI.confirm(`Delete "${chapter.title}"?`, confirmed => { if (confirmed) { getActiveBook().chapters = getActiveBook().chapters.filter(c => c.id !== chapter.id); if (getActiveBook().chapters.length === 0) { const nId = 'ch_' + Date.now(); getActiveBook().chapters.push({id:nId, title:"Chapter 1", pages:[{id:'pg_'+Date.now(), content:"<h2 class='page-title'>Chapter 1</h2><p><br></p>"}], flags:[]}); activeChapterId = nId; } else { activeChapterId = getActiveBook().chapters[0].id; } saveData(); renderUI(); } }); });
        const handle = li.querySelector('.chapter-drag-handle');
        handle.addEventListener('mousedown', () => { li.draggable = true; });
        li.addEventListener('dragstart', e => { li.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', chapter.id); });
        li.addEventListener('dragend', () => { li.classList.remove('dragging'); li.draggable = false; document.querySelectorAll('.chapter-item').forEach(c => c.classList.remove('drag-over-top','drag-over-bottom')); });
        li.addEventListener('dragover', e => { e.preventDefault(); const r = li.getBoundingClientRect(); const before = e.clientY < r.top + r.height / 2; li.classList.toggle('drag-over-top', before); li.classList.toggle('drag-over-bottom', !before); });
        li.addEventListener('dragleave', () => { li.classList.remove('drag-over-top','drag-over-bottom'); });
        li.addEventListener('drop', e => {
            e.preventDefault();
            const draggedId = e.dataTransfer.getData('text/plain');
            if (draggedId === chapter.id) return;
            const r = li.getBoundingClientRect();
            const before = e.clientY < r.top + r.height / 2;
            const fromIdx = getActiveBook().chapters.findIndex(c => c.id === draggedId);
            let toIdx = getActiveBook().chapters.findIndex(c => c.id === chapter.id);
            if (fromIdx < 0 || toIdx < 0) return;
            const [moved] = getActiveBook().chapters.splice(fromIdx, 1);
            if (fromIdx < toIdx) toIdx--;
            if (!before) toIdx++;
            getActiveBook().chapters.splice(toIdx, 0, moved);
            saveData(); renderChapters();
        });
        chapterList.appendChild(li);
    });
    setupChapterTouchReorder();
}

// --- Touch-based chapter reordering (mobile) ---
let touchDragChapter = null;
function setupChapterTouchReorder() {
    const list = chapterList;
    if (!list) return;
    if (list._touchReorderBound) return;
    list._touchReorderBound = true;
    list.addEventListener('touchstart', e => {
        const handle = e.target.closest('.chapter-drag-handle');
        if (!handle) return;
        const li = handle.closest('.chapter-item');
        if (!li) return;
        const t = e.touches[0];
        touchDragChapter = { id: li.dataset.id, li, startX: t.clientX, startY: t.clientY, started: false };
        e.preventDefault();
    }, { passive: false });
    list.addEventListener('touchmove', e => {
        if (!touchDragChapter) return;
        const t = e.touches[0];
        const dx = t.clientX - touchDragChapter.startX;
        const dy = t.clientY - touchDragChapter.startY;
        if (!touchDragChapter.started && Math.abs(dy) > 8) touchDragChapter.started = true;
        if (!touchDragChapter.started) return;
        e.preventDefault();
        touchDragChapter.li.classList.add('dragging');
        // Find the chapter item under the finger
        const targetEl = document.elementFromPoint(t.clientX, t.clientY);
        const targetLi = targetEl && targetEl.closest('.chapter-item');
        document.querySelectorAll('.chapter-item').forEach(c => c.classList.remove('drag-over-top','drag-over-bottom'));
        if (targetLi && targetLi !== touchDragChapter.li) {
            const r = targetLi.getBoundingClientRect();
            const before = t.clientY < r.top + r.height / 2;
            targetLi.classList.toggle('drag-over-top', before);
            targetLi.classList.toggle('drag-over-bottom', !before);
        }
    }, { passive: false });
    list.addEventListener('touchend', e => {
        if (!touchDragChapter) return;
        const t = e.changedTouches[0];
        touchDragChapter.li.classList.remove('dragging');
        document.querySelectorAll('.chapter-item').forEach(c => c.classList.remove('drag-over-top','drag-over-bottom'));
        if (touchDragChapter.started) {
            const targetEl = document.elementFromPoint(t.clientX, t.clientY);
            const targetLi = targetEl && targetEl.closest('.chapter-item');
            if (targetLi && targetLi !== touchDragChapter.li) {
                const draggedId = touchDragChapter.id;
                const targetId = targetLi.dataset.id;
                const r = targetLi.getBoundingClientRect();
                const before = t.clientY < r.top + r.height / 2;
                const fromIdx = getActiveBook().chapters.findIndex(c => c.id === draggedId);
                let toIdx = getActiveBook().chapters.findIndex(c => c.id === targetId);
                if (fromIdx >= 0 && toIdx >= 0) {
                    const [moved] = getActiveBook().chapters.splice(fromIdx, 1);
                    if (fromIdx < toIdx) toIdx--;
                    if (!before) toIdx++;
                    getActiveBook().chapters.splice(toIdx, 0, moved);
                    saveData(); renderChapters();
                }
            }
        }
        touchDragChapter = null;
    }, { passive: true });
}

function createPageElement(id, content) { const el = document.createElement('div'); el.className = 'page'; el.id = id || 'pg_' + Date.now(); el.dataset.id = el.id; el.contentEditable = true; el.spellcheck = appData.spellcheck !== false; el.innerHTML = content || '<p><br></p>'; return el; }
function renderActiveChapterContent() { const ac = getActiveBook().chapters.find(c => c.id === activeChapterId); pagesWrapper.innerHTML = ''; if (ac && ac.pages.length > 0) { ac.pages.forEach(pg => pagesWrapper.appendChild(createPageElement(pg.id, pg.content))); } else { const np = createPageElement(); pagesWrapper.appendChild(np); if (ac) ac.pages = [{id:np.dataset.id, content:np.innerHTML}]; } }
function renderCanvasPostIts() { document.querySelectorAll('.canvas-flag').forEach(el => el.remove()); if (document.body.classList.contains('readonly-mode')) return; const ac = getActiveBook().chapters.find(c => c.id === activeChapterId); if (!ac || !ac.flags) return; ac.flags.forEach(f => { const pe = document.querySelector(`.page[data-id="${f.pageId}"]`); if (pe) createCanvasFlag(f.y, f, pe); }); }

let dragData = null;
function createCanvasFlag(y, data = {}, pageEl) {
    const flag = document.createElement('div'); flag.className = 'canvas-flag' + (data.isRight ? ' right' : ''); flag.setAttribute('contenteditable', 'false'); flag.style.top = `${y}px`; flag.style.left = data.isRight ? 'auto' : '10px'; flag.style.right = data.isRight ? '10px' : 'auto'; const color = data.color || POST_IT_COLORS[0];
    flag.innerHTML = `<div class="flag-body" style="background-color:${color}"></div><div class="flag-popover"><textarea class="flag-text" placeholder="Lore note...">${data.text || ''}</textarea><div class="flag-colors">${POST_IT_COLORS.map(c => `<span class="flag-dot" style="background:${c}" data-color="${c}"></span>`).join('')}</div><button class="flag-delete-btn">Delete Note</button></div>`; 
    flag.dataset.id = data.id || 'pit_' + Date.now(); flag.dataset.pageId = pageEl.dataset.id;
    flag.querySelectorAll('.flag-dot').forEach(dot => { dot.addEventListener('mousedown', e => e.stopPropagation()); dot.addEventListener('touchstart', e => e.stopPropagation()); dot.addEventListener('click', e => { e.stopPropagation(); flag.querySelector('.flag-body').style.backgroundColor = dot.dataset.color; debouncedSave(); }); });
    const ta = flag.querySelector('.flag-text'); ta.addEventListener('input', e => { e.stopPropagation(); debouncedSave(); }); ta.addEventListener('mousedown', e => e.stopPropagation()); ta.addEventListener('touchstart', e => e.stopPropagation()); ta.addEventListener('keydown', e => { if (e.target.tagName === 'TEXTAREA') { e.stopPropagation(); return; } }); ta.addEventListener('keyup', e => { if (e.target.tagName === 'TEXTAREA') e.stopPropagation(); });
    const dbtn = flag.querySelector('.flag-delete-btn'); dbtn.addEventListener('mousedown', e => e.stopPropagation()); dbtn.addEventListener('click', e => { e.stopPropagation(); const ac = getActiveBook().chapters.find(c => c.id === activeChapterId); ac.flags = ac.flags.filter(f => f.id !== flag.dataset.id); flag.remove(); saveData(); });
    flag.addEventListener('mousedown', e => startDrag(e, false, flag, pageEl)); flag.addEventListener('touchstart', e => startDrag(e, true, flag, pageEl), {passive:false});
    pageEl.appendChild(flag); 
    const ac = getActiveBook().chapters.find(c => c.id === activeChapterId);
    if (!data.id) { ac.flags.push({id:flag.dataset.id, pageId:pageEl.dataset.id, text:'', color:POST_IT_COLORS[0], y:y, isRight:data.isRight || false}); debouncedSave(); } 
    return flag;
}
function startDrag(e, isTouch, el, pageEl) { e.preventDefault(); const cY = isTouch ? e.touches[0].clientY : e.clientY; dragData = {el, pageEl, startY:cY, moved:false}; el.style.zIndex = 100; }
function moveDrag(e, isTouch) { if (!dragData) return; e.preventDefault(); const cY = isTouch ? e.touches[0].clientY : e.clientY, cX = isTouch ? e.touches[0].clientX : e.clientX; if (Math.abs(cY - dragData.startY) > 3) dragData.moved = true; const pr = dragData.pageEl.getBoundingClientRect(); let nT = cY - pr.top; nT = Math.max(0, Math.min(nT, pr.height - 40)); dragData.el.style.top = `${nT}px`; const pc = pr.left + pr.width / 2; if (cX < pc) { dragData.el.style.left = '10px'; dragData.el.style.right = 'auto'; dragData.el.classList.remove('right'); } else { dragData.el.style.left = 'auto'; dragData.el.style.right = '10px'; dragData.el.classList.add('right'); } }
function endDrag() { if (!dragData) return; if (!dragData.moved) { document.querySelectorAll('.canvas-flag.expanded').forEach(f => { if (f !== dragData.el) f.classList.remove('expanded'); }); dragData.el.classList.toggle('expanded'); } dragData.el.style.zIndex = 10; debouncedSave(); dragData = null; }

function handlePagination(pageEl) { if (pageEl.scrollHeight <= pageEl.clientHeight) return; const sel = window.getSelection(); let marker = null; if (sel.rangeCount > 0 && pageEl.contains(sel.anchorNode)) { const range = sel.getRangeAt(0); marker = document.createElement('span'); marker.id = '__caret_marker__'; range.insertNode(marker); } let nextPage = pageEl.nextElementSibling; if (!nextPage || !nextPage.classList.contains('page')) { nextPage = createPageElement('pg_' + Date.now(), '<p><br></p>'); pageEl.after(nextPage); } while (pageEl.scrollHeight > pageEl.clientHeight && pageEl.childNodes.length > 0) { const lc = pageEl.lastElementChild; if (!lc) break; if (lc.id === '__caret_marker__') break; nextPage.insertBefore(lc, nextPage.firstChild); } if (marker) { const nm = document.getElementById('__caret_marker__'); if (nm) { const te = nm.parentElement; const nr = document.createRange(); nr.setStartAfter(nm); nr.collapse(true); sel.removeAllRanges(); sel.addRange(nr); nm.remove(); te.focus(); } } handlePagination(nextPage); }
function handlePageDeletion(e) { if (e.key === 'Backspace' || e.key === 'Delete') { const pe = e.target.closest('.page'); if (!pe) return; const ac = getActiveBook().chapters.find(c => c.id === activeChapterId); if (ac && ac.pages.length > 1) { const isEmpty = pe.innerText.trim() === ''; if (isEmpty) { e.preventDefault(); const pi = ac.pages.findIndex(p => p.id === pe.dataset.id); ac.flags = ac.flags.filter(f => f.pageId !== pe.dataset.id); pe.remove(); ac.pages.splice(pi, 1); const pp = pagesWrapper.children[pi - 1]; if (pp) { pp.focus(); const r = document.createRange(); r.selectNodeContents(pp); r.collapse(false); const s = window.getSelection(); s.removeAllRanges(); s.addRange(r); } saveData(); } } } }

function toggleReadOnly() {
    const isRO = document.body.classList.toggle('readonly-mode');
    const tb = document.querySelector('.editor-toolbar');
    if (isRO) {
        saveData(); tb.style.display = 'none';
        pagesWrapper.innerHTML = '<div class="compiled-view"></div>';
        const cv = pagesWrapper.querySelector('.compiled-view');
        getActiveBook().chapters.forEach(ch => {
            const content = ch.pages.map(p => p.content).join('');
            const chDiv = document.createElement('div');
            chDiv.innerHTML = `<h2>${escapeHTML(ch.title)}</h2><div class="compiled-content">${content}</div>`;
            cv.appendChild(chDiv);
        });
        $('readonlyToggle').classList.add('active');
    } else {
        tb.style.display = 'flex';
        $('readonlyToggle').classList.remove('active');
        renderActiveChapterContent(); renderCanvasPostIts(); LoreSystem.highlightKeywords();
    }
}

function clearFindHighlights() { const marks = pagesWrapper.querySelectorAll('mark.find-match, mark.find-active'); marks.forEach(m => { const t = document.createTextNode(m.textContent); m.parentNode.replaceChild(t, m); }); pagesWrapper.normalize(); findMatches = []; findIndex = -1; }
function performFind(query) { clearFindHighlights(); if (!query) { findCounter.innerText = "0 of 0"; return; } const walker = document.createTreeWalker(pagesWrapper, NodeFilter.SHOW_TEXT, null, false); const textNodes = []; let node; while (node = walker.nextNode()) { if (node.parentNode.nodeName !== 'MARK' && node.nodeValue.trim() !== '') textNodes.push(node); } const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'); textNodes.forEach(tn => { const text = tn.nodeValue; let li = 0, m; const frag = document.createDocumentFragment(); let hm = false; while ((m = regex.exec(text)) !== null) { hm = true; frag.appendChild(document.createTextNode(text.substring(li, m.index))); const mark = document.createElement('mark'); mark.className = 'find-match'; mark.textContent = m[0]; frag.appendChild(mark); findMatches.push(mark); li = regex.lastIndex; } if (hm) { frag.appendChild(document.createTextNode(text.substring(li))); tn.parentNode.replaceChild(frag, tn); } }); if (findMatches.length > 0) { findIndex = 0; updateFindActive(); } else { findCounter.innerText = "0 of 0"; } }
function updateFindActive() { findMatches.forEach((m, i) => m.classList.toggle('find-active', i === findIndex)); findCounter.innerText = `${findIndex + 1} of ${findMatches.length}`; if (findMatches[findIndex]) findMatches[findIndex].scrollIntoView({behavior:'smooth', block:'center'}); }
function navigateFind(dir) { if (findMatches.length === 0) return; findIndex += dir; if (findIndex >= findMatches.length) findIndex = 0; if (findIndex < 0) findIndex = findMatches.length - 1; updateFindActive(); }
