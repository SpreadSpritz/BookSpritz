// === BookSpritz: Event listeners, auth, init ===

function setupEventListeners() {
    $('sidebarToggle').addEventListener('click', () => $('sidebar').classList.toggle('collapsed'));
    $('bookSelect').addEventListener('change', e => switchBook(e.target.value));
    $('newBookBtn').addEventListener('click', newBook);
    $('renameBookBtn').addEventListener('click', renameBook);
    $('deleteBookBtn').addEventListener('click', deleteBook);
    $('zenToggle').addEventListener('click', () => { document.body.classList.toggle('zen-mode'); $('zenToggle').classList.toggle('active'); });
    $('fullscreenToggle').addEventListener('click', () => { if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(err => console.log(err)); else if (document.exitFullscreen) document.exitFullscreen(); });
    $('readonlyToggle').addEventListener('click', toggleReadOnly);
    if (window.innerWidth <= 768) $('sidebar').classList.add('collapsed');
    if (window.visualViewport) { window.visualViewport.addEventListener('resize', handleViewportResize); window.visualViewport.addEventListener('scroll', handleViewportResize); } handleViewportResize();

    $('boldBtn').addEventListener('click', () => document.execCommand('bold'));
    $('italicBtn').addEventListener('click', () => document.execCommand('italic'));
    const sl = $('fontSizeSelect'), cw = document.querySelector('.color-popover-wrap');
    [sl, cw].forEach(el => { el.addEventListener('mousedown', () => { const sel = window.getSelection(); if (sel.rangeCount > 0 && pagesWrapper.contains(sel.anchorNode)) savedToolbarRange = sel.getRangeAt(0).cloneRange(); }); el.addEventListener('touchstart', () => { const sel = window.getSelection(); if (sel.rangeCount > 0 && pagesWrapper.contains(sel.anchorNode)) savedToolbarRange = sel.getRangeAt(0).cloneRange(); }); });
    sl.addEventListener('change', e => { if (savedToolbarRange) { const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(savedToolbarRange); } document.execCommand('fontSize', false, e.target.value); });
    $('colorToggleBtn').addEventListener('click', () => $('colorPalette').classList.toggle('hidden'));
    document.addEventListener('selectionchange', syncToolbarState);

    $('findToggle').addEventListener('click', () => { findPanel.classList.toggle('active'); if (findPanel.classList.contains('active')) findInput.focus(); });
    $('findCloseBtn').addEventListener('click', () => { findPanel.classList.remove('active'); clearFindHighlights(); });
    let searchDebounce; findInput.addEventListener('input', e => { clearTimeout(searchDebounce); searchDebounce = setTimeout(() => performFind(e.target.value), 300); });
    $('findNextBtn').addEventListener('click', () => navigateFind(1));
    $('findPrevBtn').addEventListener('click', () => navigateFind(-1));

    pagesWrapper.addEventListener('input', e => {
        if (e.target.classList.contains('page')) { const pe = e.target.closest('.page'); if (pe) handlePagination(pe); }
        clearTimeout(highlightTimeout);
        highlightTimeout = setTimeout(() => LoreSystem.highlightKeywords(), window.matchMedia('(max-width: 768px)').matches ? 800 : 500);
        if (findMatches.length > 0) performFind(findInput.value);
        debouncedSave();
    });
    pagesWrapper.addEventListener('keydown', handlePageDeletion);

    $('addChapterBtn').addEventListener('click', () => { const nId = 'ch_' + Date.now(); const cn = getActiveBook().chapters.length + 1; getActiveBook().chapters.push({id:nId, title:`Chapter ${cn}: Untitled`, pages:[{id:'pg_'+Date.now(), content:`<h2 class='page-title'>Chapter ${cn}: Untitled</h2><p><br></p>`}], flags:[]}); switchChapter(nId); });
    $('importBtn').addEventListener('click', () => $('importFileInput').click());
    $('importFileInput').addEventListener('change', e => { if (e.target.files[0]) { handleImport(e.target.files[0]); e.target.value = ''; } });

    document.addEventListener('mousemove', e => moveDrag(e, false));
    document.addEventListener('touchmove', e => moveDrag(e, true), {passive:false});
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchend', endDrag);

    const fab = $('postItFab');
    fab.addEventListener('mousedown', e => { const pe = document.querySelector('#pagesWrapper .page'); if (!pe) return; const nf = createCanvasFlag(20, {}, pe); startDrag(e, false, nf, pe); });
    fab.addEventListener('touchstart', e => { e.preventDefault(); const pe = document.querySelector('#pagesWrapper .page'); if (!pe) return; const nf = createCanvasFlag(20, {}, pe); startDrag(e, true, nf, pe); }, {passive:false});

    $('historyToggle').addEventListener('click', () => { renderHistory(); $('historyModal').classList.remove('hidden'); });
    $('closeHistoryBtn').addEventListener('click', () => $('historyModal').classList.add('hidden'));
    $('closeReviewBtn').addEventListener('click', () => $('reviewModal').classList.add('hidden'));
    $('applyReviewBtn').addEventListener('click', () => { if (reviewCallback) reviewCallback(); $('reviewModal').classList.add('hidden'); });

    // --- Stats / Export / Spellcheck (Phase 2) ---
    $('statsToggle').addEventListener('click', () => { renderStats(); $('statsModal').classList.remove('hidden'); });
    $('closeStatsBtn').addEventListener('click', () => $('statsModal').classList.add('hidden'));
    $('exportToggle').addEventListener('click', () => $('exportModal').classList.remove('hidden'));
    $('closeExportBtn').addEventListener('click', () => $('exportModal').classList.add('hidden'));
    document.querySelectorAll('.export-btn').forEach(btn => btn.addEventListener('click', () => { const fmt = btn.dataset.format; $('exportModal').classList.add('hidden'); setTimeout(() => exportBook(fmt), 100); }));
    $('spellcheckToggle').addEventListener('click', () => {
        appData.spellcheck = appData.spellcheck === false ? true : false;
        $('spellcheckToggle').classList.toggle('active', appData.spellcheck !== false);
        document.querySelectorAll('#pagesWrapper .page').forEach(p => p.spellcheck = appData.spellcheck !== false);
        const focused = document.activeElement;
        if (focused && focused.classList && focused.classList.contains('page')) { focused.blur(); setTimeout(() => focused.focus(), 0); }
        saveData();
    });
    $('settingsToggle').addEventListener('click', () => { populateSettingsUI(); $('settingsModal').classList.remove('hidden'); });
    $('closeSettingsBtn').addEventListener('click', () => $('settingsModal').classList.add('hidden'));

    document.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key === 'f') { e.preventDefault(); findPanel.classList.add('active'); findInput.focus(); } if (e.key === 'Escape') { findPanel.classList.remove('active'); clearFindHighlights(); } });

    $('signupBtn').addEventListener('click', () => { const em = $('authEmail').value, ps = $('authPass').value; if (!em || !ps) { CustomUI.alert("Please enter an email and password."); return; } auth.createUserWithEmailAndPassword(em, ps).catch(err => CustomUI.alert(err.message, "Sign Up Error")); });
    $('loginBtn').addEventListener('click', () => { const em = $('authEmail').value, ps = $('authPass').value; if (!em || !ps) { CustomUI.alert("Please enter an email and password."); return; } auth.signInWithEmailAndPassword(em, ps).catch(err => CustomUI.alert(err.message, "Login Error")); });
    $('logoutBtn').addEventListener('click', () => auth.signOut());
}

auth.onAuthStateChanged(user => {
    const af = $('authForm'), ad = $('authDetails');
    if (user) {
        currentUser = user; af.style.display = 'none'; ad.style.display = 'flex'; $('userEmail').innerText = user.email;
        db.ref('users/' + user.uid + '/appData').once('value').then(snapshot => {
            if (snapshot.exists()) { const data = snapshot.val(); if (data && (data.chapters || data.books)) { appData = data; if (!appData.colorPresets) appData.colorPresets = ['#000000','#FFFFFF','#FF0000','#0000FF','#008000','#FFFF00','#FFA500','#800080','#FFC0CB','#008080']; migrateToMultiBook(); if (appData.postIts && appData.postIts.length) { const ab1 = getActiveBook(); if (ab1) ab1.chapters.forEach(ch => { ch.flags = appData.postIts.filter(f => f.pageId && ch.pages.some(p => p.id === f.pageId)); }); delete appData.postIts; } const ab2 = getActiveBook(); if (ab2) ab2.chapters.forEach(ch => { if (ch.content && !ch.pages) { ch.pages = [{id:'pg_'+Date.now(), content:ch.content}]; delete ch.content; } if (!ch.pages) ch.pages = []; if (!ch.flags) ch.flags = []; }); const ab3 = getActiveBook(); if (ab3 && ab3.chapters.length > 0) activeChapterId = ab3.chapters[0].id; else { loadData(); saveData(); } } else { loadData(); saveData(); } } else { loadData(); db.ref('users/' + user.uid + '/appData').set(appData); }
            setupColorPalette(); renderUI();
            $('spellcheckToggle').classList.toggle('active', appData.spellcheck !== false);
            applySettings(); lastWordCount = computeStats().totals.words; updateDailyBadge();
        }).catch(err => { console.error("Error loading cloud data:", err); loadData(); renderUI(); });
    } else {
        currentUser = null; af.style.display = 'flex'; ad.style.display = 'none'; loadData(); setupColorPalette(); renderUI();
        $('spellcheckToggle').classList.toggle('active', appData.spellcheck !== false);
        applySettings(); lastWordCount = computeStats().totals.words; updateDailyBadge();
    }
});



// Init — wrapped in DOMContentLoaded to ensure all scripts + DOM are ready
document.addEventListener('DOMContentLoaded', () => {
    try {
        migrateToMultiBook();
        if (!appData.activeBookId && appData.books[0]) appData.activeBookId = appData.books[0].id;
        setupEventListeners();
        LoreSystem.init();
        startAutoVersioning();
        setupSettingsListeners();
        applySettings();
        lastWordCount = computeStats().totals.words;
        updateDailyBadge();
    } catch(err) {
        console.error('Init failed:', err);
        CustomUI.alert('Failed to initialize BookSpritz: ' + err.message);
    }
});
