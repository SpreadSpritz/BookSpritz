// === BookSpritz: Global Search ===
// Search across all books and chapters, with context previews.

function stripHtmlForSearch(html) {
    return html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
}

function performGlobalSearch(query) {
    const results = [];
    if (!query || !query.trim()) return results;
    const q = query.trim();
    const book = getActiveBook ? getActiveBook() : null;
    const books = appData.books || (book ? [book] : []);

    books.forEach(b => {
        (b.chapters || []).forEach(ch => {
            const html = (ch.pages || []).map(p => p.content || '').join(' ');
            const text = stripHtmlForSearch(html);
            if (!text) return;
            // Case-insensitive search
            const lowerText = text.toLowerCase();
            const lowerQ = q.toLowerCase();
            let idx = 0;
            while ((idx = lowerText.indexOf(lowerQ, idx)) !== -1) {
                const start = Math.max(0, idx - 40);
                const end = Math.min(text.length, idx + q.length + 40);
                const context = (start > 0 ? '...' : '') + text.substring(start, end) + (end < text.length ? '...' : '');
                results.push({
                    bookTitle: b.title,
                    bookId: b.id,
                    chapterTitle: ch.title,
                    chapterId: ch.id,
                    context: context,
                    matchStart: idx - start,
                    matchLength: q.length
                });
                idx += q.length;
                if (results.length >= 100) return; // Cap at 100 results
            }
        });
    });
    return results;
}

function renderSearchResults(query) {
    const container = $('globalSearchResults');
    if (!query || !query.trim()) {
        container.innerHTML = '<div class="search-empty">Type a search query and click Search.</div>';
        return;
    }
    const results = performGlobalSearch(query);
    if (results.length === 0) {
        container.innerHTML = '<div class="search-empty">No results found.</div>';
        return;
    }
    let html = `<div style="font-size:0.85rem;color:var(--text-muted);margin-bottom:12px;">${results.length} result${results.length === 1 ? '' : 's'} found</div>`;
    results.forEach((r, i) => {
        // Highlight the match in the context
        const before = escapeHTML(r.context.substring(0, r.matchStart));
        const match = escapeHTML(r.context.substring(r.matchStart, r.matchStart + r.matchLength));
        const after = escapeHTML(r.context.substring(r.matchStart + r.matchLength));
        const highlighted = before + '<mark>' + match + '</mark>' + after;
        html += `<div class="search-result-item" data-book-id="${r.bookId}" data-chapter-id="${r.chapterId}" data-idx="${i}">
            <div class="search-result-meta"><strong>${escapeHTML(r.bookTitle)}</strong> › ${escapeHTML(r.chapterTitle)}</div>
            <div class="search-result-context">${highlighted}</div>
        </div>`;
    });
    container.innerHTML = html;
    // Wire up click to jump to result
    container.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', () => {
            const bookId = item.dataset.bookId;
            const chapterId = item.dataset.chapterId;
            $('globalSearchModal').classList.add('hidden');
            // Switch to the book and chapter
            if (appData.activeBookId !== bookId) switchBook(bookId);
            setTimeout(() => {
                if (activeChapterId !== chapterId) switchChapter(chapterId);
                setTimeout(() => {
                    // Open find panel with the query for in-page navigation
                    findPanel.classList.add('active');
                    findInput.value = query;
                    performFind(query);
                }, 100);
            }, 100);
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    $('globalSearchBtn').addEventListener('click', () => {
        $('globalSearchModal').classList.remove('hidden');
        setTimeout(() => $('globalSearchInput').focus(), 100);
    });
    $('closeGlobalSearchBtn').addEventListener('click', () => $('globalSearchModal').classList.add('hidden'));
    $('runGlobalSearchBtn').addEventListener('click', () => renderSearchResults($('globalSearchInput').value));
    $('globalSearchInput').addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); renderSearchResults(e.target.value); }
    });
});
