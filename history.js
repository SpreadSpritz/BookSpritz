// === BookSpritz: Time Machine & toolbar sync ===

function startAutoVersioning() {
    setInterval(() => {
        saveData();
        let h = safeStorage.getJSON(HISTORY_KEY, []) || [];
        h.push({ timestamp: new Date().toLocaleString(), note: 'Auto-save', manual: false, data: JSON.parse(JSON.stringify(appData)) });
        if (h.length > 20) h.shift();
        safeStorage.set(HISTORY_KEY, JSON.stringify(h));
    }, 600000);
}

function snapshotNow(note) {
    saveData();
    let h = safeStorage.getJSON(HISTORY_KEY, []) || [];
    h.push({ timestamp: new Date().toLocaleString(), note: note || 'Manual snapshot', manual: true, data: JSON.parse(JSON.stringify(appData)) });
    if (h.length > 20) h.shift();
    safeStorage.set(HISTORY_KEY, JSON.stringify(h));
    renderHistory();
}

function renderHistory() {
    let h = safeStorage.getJSON(HISTORY_KEY, []) || [];
    const hl = $('historyList');
    hl.innerHTML = '';
    if (h.length === 0) {
        hl.innerHTML = '<li class="history-item" style="text-align:center;color:var(--text-muted);">No snapshots yet. Click "Snapshot Now" to create one.</li>';
        return;
    }
    h.slice().reverse().forEach((entry, ri) => {
        const ai = h.length - 1 - ri;
        const li = document.createElement('li');
        li.className = 'history-item' + (entry.manual ? ' manual' : '');
        const noteText = entry.note || (entry.manual ? 'Manual snapshot' : 'Auto-save');
        const noteClass = entry.note ? '' : ' empty';
        li.innerHTML = `<div class="history-item-header">
            <span class="history-item-time">${escapeHTML(entry.timestamp)}</span>
            <div class="history-item-actions">
                <button class="add-btn" data-action="edit" data-index="${ai}" title="Edit note">Edit</button>
                <button class="add-btn primary-btn" data-action="restore" data-index="${ai}">Restore</button>
            </div>
        </div>
        <div class="history-item-note${noteClass}">${escapeHTML(noteText)}</div>`;
        li.querySelector('[data-action="restore"]').addEventListener('click', e => {
            const idx = parseInt(e.target.dataset.index);
            CustomUI.confirm("Overwrite current state with this snapshot?", c => {
                if (c) {
                    appData = h[idx].data;
                    migrateToMultiBook();
                    const rb = getActiveBook();
                    if (rb && rb.chapters[0] && !rb.chapters[0].flags) rb.chapters.forEach(ch => ch.flags = []);
                    if (rb && rb.chapters[0]) activeChapterId = rb.chapters[0].id;
                    saveData();
                    renderBookSelect();
                    renderUI();
                    $('historyModal').classList.add('hidden');
                }
            });
        });
        li.querySelector('[data-action="edit"]').addEventListener('click', e => {
            const idx = parseInt(e.target.dataset.index);
            const noteDiv = li.querySelector('.history-item-note');
            const currentNote = h[idx].note || '';
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'history-note-edit';
            input.value = currentNote;
            input.placeholder = 'Add a note...';
            noteDiv.replaceWith(input);
            input.focus();
            input.select();
            const save = () => {
                h[idx].note = input.value.trim() || (h[idx].manual ? 'Manual snapshot' : 'Auto-save');
                safeStorage.set(HISTORY_KEY, JSON.stringify(h));
                renderHistory();
            };
            input.addEventListener('blur', save);
            input.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); input.blur(); } if (ev.key === 'Escape') { renderHistory(); } });
        });
        hl.appendChild(li);
    });
}

function syncToolbarState() {
    const sel = window.getSelection();
    if (!sel.rangeCount || !pagesWrapper.contains(sel.anchorNode)) {
        $('boldBtn').classList.remove('active');
        $('italicBtn').classList.remove('active');
        return;
    }
    try { $('boldBtn').classList.toggle('active', document.queryCommandState('bold')); } catch (e) {}
    try { $('italicBtn').classList.toggle('active', document.queryCommandState('italic')); } catch (e) {}
}

function handleViewportResize() {
    if (window.visualViewport) {
        const vh = window.visualViewport.height;
        document.documentElement.style.setProperty('--app-height', `${vh}px`);
        const sel = window.getSelection();
        if (sel.rangeCount > 0 && pagesWrapper.contains(sel.anchorNode)) {
            const range = sel.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            const vv = window.visualViewport;
            const kt = vv.offsetTop + vv.height;
            const th = kt - (vv.height * 0.20);
            if (rect.bottom > th) {
                canvasContainer.scrollBy({ top: rect.bottom - th, behavior: 'smooth' });
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    $('snapshotNowBtn').addEventListener('click', () => {
        CustomUI.prompt('Add a note for this snapshot:', '', note => {
            snapshotNow(note);
        });
    });
    $('clearHistoryBtn').addEventListener('click', () => {
        CustomUI.confirm('Delete ALL snapshots? This cannot be undone.', c => {
            if (c) { safeStorage.set(HISTORY_KEY, '[]'); renderHistory(); }
        });
    });
});
