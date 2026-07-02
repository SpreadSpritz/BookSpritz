// === BookSpritz: Multi-book management ===

// --- Multi-book support ---
function getActiveBook() {
    if (!appData.books || appData.books.length === 0) return null;
    return appData.books.find(b => b.id === appData.activeBookId) || appData.books[0];
}
function migrateToMultiBook() {
    if (appData.books) {
        // Ensure each book has keywords (older migrations might have missed it)
        appData.books.forEach(b => { if (!b.keywords) b.keywords = {}; if (!b.chapters) b.chapters = []; });
        return;
    }
    // Legacy single-book → multi-book migration
    const oldChapters = appData.chapters || [];
    const oldKeywords = appData.keywords || {};
    appData.books = [{ id: 'bk_' + Date.now(), title: 'My First Book', chapters: oldChapters, keywords: oldKeywords }];
    appData.activeBookId = appData.books[0].id;
    delete appData.chapters;
    delete appData.keywords;
}
function renderBookSelect() {
    const sel = $('bookSelect');
    if (!sel) return;
    sel.innerHTML = '';
    appData.books.forEach(b => {
        const opt = document.createElement('option');
        opt.value = b.id;
        opt.textContent = b.title;
        sel.appendChild(opt);
    });
    sel.value = appData.activeBookId;
}
function switchBook(bookId) {
    if (bookId === appData.activeBookId) return;
    saveData();
    appData.activeBookId = bookId;
    const book = getActiveBook();
    activeChapterId = (book.chapters[0] && book.chapters[0].id) || null;
    renderBookSelect();
    renderUI();
}
function newBook() {
    CustomUI.prompt('Name for new book:', 'Untitled Book', name => {
        if (!name || !name.trim()) return;
        const id = 'bk_' + Date.now();
        const chId = 'ch_' + Date.now();
        appData.books.push({ id, title: name.trim(), chapters: [{ id: chId, title: 'Chapter 1', pages: [{ id: 'pg_' + Date.now(), content: '<h2 class="page-title">Chapter 1</h2><p><br></p>' }], flags: [] }], keywords: {} });
        appData.activeBookId = id;
        activeChapterId = chId;
        saveData();
        renderBookSelect();
        renderUI();
        CustomUI.alert('Created new book: ' + name.trim(), 'New Book');
    });
}
function renameBook() {
    const book = getActiveBook();
    if (!book) return;
    CustomUI.prompt('Rename book:', book.title, name => {
        if (name && name.trim()) { book.title = name.trim(); saveData(); renderBookSelect(); }
    });
}
function deleteBook() {
    if (appData.books.length <= 1) { CustomUI.alert('You must have at least one book.'); return; }
    const book = getActiveBook();
    CustomUI.confirm('Delete "' + book.title + '" and all its chapters? This cannot be undone.', c => {
        if (!c) return;
        appData.books = appData.books.filter(b => b.id !== book.id);
        appData.activeBookId = appData.books[0].id;
        activeChapterId = appData.books[0].chapters[0] && appData.books[0].chapters[0].id;
        saveData();
        renderBookSelect();
        renderUI();
    });
}

// Global error handler — prevents silent crashes
window.addEventListener('error', e => { console.error('Unhandled error:', e.error || e.message); try { CustomUI.alert('Something went wrong: ' + (e.message || 'unknown error') + '\n\nYour work is auto-saved. Try refreshing if the app seems stuck.'); } catch(_){} });
window.addEventListener('unhandledrejection', e => { console.error('Unhandled promise rejection:', e.reason); });
