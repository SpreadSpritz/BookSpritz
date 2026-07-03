
// Global handler for onclick attribute (works even if setupEventListeners fails)
function handleViewTutorial() {
    try {
        document.getElementById('settingsModal').classList.add('hidden');
        if (typeof startTutorial === 'function') startTutorial();
        else alert('Tutorial not loaded. Please refresh the page.');
    } catch(e) { console.error('Tutorial error:', e); alert('Could not start tutorial: ' + e.message); }
}

// === BookSpritz: Interactive Tutorial (22 steps with live demos) ===

// ╔══════════════════════════════════════════════════════════════════╗
// ║  TUTORIAL DEMO CONTENT — Edit these values to customize           ║
// ║  the sample text used during the interactive demo steps           ║
// ║                                                                    ║
// ║  You can change the chapter content, the keyword used for the     ║
// ║  Lore System demo, and the word searched during the Find demo.    ║
// ╚══════════════════════════════════════════════════════════════════╝
const TUTORIAL_DEMO = {
    chapterTitle: 'Tutorial Demo',
    chapterContent: '<h2 class="page-title">Tutorial Demo</h2><p>The dragon soared over the mountains, its scales gleaming in the dawn light. With a mighty roar, the dragon descended toward the village.</p><p>A young hero named Elara stepped forward, her sword drawn. The dragon paused, sensing her courage.</p>',
    keyword: 'dragon',
    keywordNotes: 'A mighty creature that soars over the mountains.',
    findWord: 'hero'
};

// ════════════════════════════════════════════════════════════════════
//  TUTORIAL STEP DEFINITIONS
//  Each step can have: title, body, selector (element to highlight),
//  position (where the tutorial box appears), onEnter (setup function),
//  onExit (cleanup function), and noSpotlight (don't dim background)
// ════════════════════════════════════════════════════════════════════
const TUTORIAL_STEPS = [
    // --- Welcome ---
    { title: 'Welcome to BookSpritz!', body: 'A book-writing app with a lore system, margin notes, version history, and more. This tour will guide you through everything — it takes about 2 minutes. Your work is safe: the tutorial creates a temporary demo chapter and cleans up after itself. You can replay this anytime from Settings.', selector: null, position: 'center' },

    // --- Book management ---
    { title: 'Book Switcher', body: 'Switch between your books using this dropdown. Each book has its own chapters and keywords — perfect for keeping different projects separate.', selector: '#bookSelect', position: 'right', onEnter: ensureSidebarOpen },
    { title: 'Create a New Book', body: 'Click the + button to create a new book. You can rename books with the pencil icon and delete them with the trash icon. You always need at least one book.', selector: '#newBookBtn', position: 'right', onEnter: ensureSidebarOpen },

    // --- Chapters tab ---
    { title: 'Chapters Tab', body: 'The Chapters tab is where you manage your chapter list. Let\'s open it.', selector: '[data-tab="chapters"]', position: 'right', onEnter: () => { ensureSidebarOpen(); switchToTab('chapters'); } },
    { title: 'Your Chapter List', body: 'All chapters in the current book are listed here. Click any chapter to open it in the editor. The active chapter is highlighted.', selector: '#chapterList', position: 'right', onEnter: ensureSidebarOpen },
    { title: 'Adding New Chapters', body: 'Click "+ New Chapter" to add a chapter to your book. Chapters are added at the end of the list.', selector: '#addChapterBtn', position: 'right', onEnter: ensureSidebarOpen },
    { title: 'Chapter Actions', body: 'Hover over a chapter to see two icons: a pencil to rename it, and a trash can to delete it. You can also reorder chapters by dragging the grip handle on the left of each chapter.', selector: '#chapterList', position: 'right', onEnter: ensureSidebarOpen },
    { title: 'Importing Files', body: 'The "Import File" button lets you bring in existing work. It accepts Markdown (.md), plain text (.txt), and HTML (.html) files. If your file has multiple headings, it automatically creates separate chapters for each one.', selector: '#importBtn', position: 'right', onEnter: ensureSidebarOpen },

    // --- Keywords tab ---
    { title: 'Keywords Tab (Lore System)', body: 'The Lore System is BookSpritz\'s signature feature. Let\'s open the Keywords tab to see it.', selector: '[data-tab="keywords"]', position: 'right', onEnter: () => { ensureSidebarOpen(); switchToTab('keywords'); } },
    { title: 'Adding a Keyword', body: 'Type a character or place name here, add optional lore notes, then click "+ Add Keyword". The keyword will be automatically highlighted everywhere it appears in your manuscript.', selector: '.keyword-input-group', position: 'right', onEnter: () => { ensureSidebarOpen(); switchToTab('keywords'); } },
    { title: 'Live Demo: Keyword Highlighting', body: 'Watch this! I\'ve created a temporary demo chapter and added the keyword "' + TUTORIAL_DEMO.keyword + '". See how every occurrence of "' + TUTORIAL_DEMO.keyword + '" is now highlighted in the text below? Hover over a highlighted word (or tap it on mobile) to see its lore notes.', selector: '#pagesWrapper', position: 'left', onEnter: setupKeywordDemo, noSpotlight: false },

    // --- Editor ---
    { title: 'The Editor', body: 'This is where you write! Content flows across book-like pages automatically. When a page fills up, a new one is created. Press Backspace on an empty page to delete it and merge back.', selector: '#pagesWrapper', position: 'left', onEnter: () => { switchToTab('chapters'); ensureSidebarOpen(); } },
    { title: 'Formatting Toolbar', body: 'Format your text with bold, italic, font size, and text colors. The color palette has 10 customizable preset slots — Alt-click a preset to reassign it. All formatting is preserved when you export.', selector: '#editorToolbar', position: 'bottom' },
    { title: 'Live Demo: Find in Page', body: 'Let me show you the Find feature. I\'ve opened the search panel and searched for "' + TUTORIAL_DEMO.findWord + '". See the matches highlighted in the text? Use the arrow buttons to jump between matches, or press Ctrl+F anytime to open Find.', selector: '#findPanel', position: 'bottom-screen', onEnter: setupFindDemo, onExit: cleanupFindDemo },

    // --- More features ---
    { title: 'Margin Notes', body: 'Click this orange + button to add a draggable sticky note in the margin. Drag it up/down to reposition, or left/right to snap to either side. Click a note to expand it and write inside. Notes are saved per chapter.', selector: '#postItFab', position: 'left' },
    { title: 'Header Tools', body: 'The header has all your tools, left to right: Settings, Stats, Export, Spellcheck, Find, Time Machine, Fullscreen, Read-Only, Focus Mode, and Zen Mode. We\'ll look at a few of these next.', selector: '.header-right', position: 'bottom' },
    { title: 'Stats & Writing Goals', body: 'The Stats panel shows your word count, character count, reading time, per-chapter breakdown, and a word frequency analyzer (to spot overused words). It also tracks your daily writing goal and streak — try to keep your streak alive!', selector: '#statsToggle', position: 'bottom', onEnter: () => { renderStats(); $('statsModal').classList.remove('hidden'); }, onExit: () => { $('statsModal').classList.add('hidden'); }, noSpotlight: true },
    { title: 'Export Your Book', body: 'Export to Markdown, plain text, HTML, or PDF (via the browser\'s print dialog). All exports are free and run entirely in your browser — no server, no uploads.', selector: '#exportToggle', position: 'bottom', onEnter: () => { $('exportModal').classList.remove('hidden'); }, onExit: () => { $('exportModal').classList.add('hidden'); }, noSpotlight: true },
    { title: 'Settings', body: 'Customize your writing environment: font family, font size, line height, page dimensions, auto-save interval, and daily word goal. Changes apply instantly and sync across devices.', selector: '#settingsToggle', position: 'bottom' },

    // --- Account ---
    { title: 'Account & Cloud Sync', body: 'Create a free account to sync your books across devices. Your data is also saved locally, so you can write offline — it syncs automatically when you reconnect. No subscription, no cost.', selector: '[data-tab="account"]', position: 'right', onEnter: () => { ensureSidebarOpen(); switchToTab('account'); } },

    // --- Done ---
    { title: 'You\'re All Set!', body: 'That\'s everything! The temporary demo chapter has been cleaned up. Start writing your masterpiece — everything auto-saves. Check the Time Machine if you ever need to revert, and remember you can replay this tour from Settings. Happy writing!', selector: null, position: 'center', onEnter: cleanupTutorial }
];

// ════════════════════════════════════════════════════════════════════
//  TUTORIAL STATE & CONTROLLER
// ════════════════════════════════════════════════════════════════════
let tutorialCurrentStep = 0;
let tutorialOverlay = null;
let tutorialBox = null;
let tutorialState = {
    originalChapterId: null,
    originalTab: 'chapters',
    demoChapterId: null,
    demoKeywordAdded: false,
    findWasOpen: false
};

function startTutorial() {
    tutorialCurrentStep = 0;
    tutorialState = {
        originalChapterId: activeChapterId,
        originalTab: document.querySelector('.tab-btn.active') ? document.querySelector('.tab-btn.active').dataset.tab : 'chapters',
        demoChapterId: null,
        demoKeywordAdded: false,
        findWasOpen: findPanel.classList.contains('active')
    };
    document.body.classList.add('tutorial-active');
    createTutorialUI();
    showTutorialStep();
}

function createTutorialUI() {
    if (tutorialOverlay) tutorialOverlay.remove();
    tutorialOverlay = document.createElement('div');
    tutorialOverlay.id = 'tutorialOverlay';
    tutorialOverlay.addEventListener('wheel', e => e.preventDefault(), { passive: false });
    tutorialOverlay.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
    tutorialOverlay.addEventListener('click', e => { if (e.target === tutorialOverlay) { /* block click-through, do nothing */ } });
    tutorialBox = document.createElement('div');
    tutorialBox.id = 'tutorialBox';
    tutorialOverlay.appendChild(tutorialBox);
    document.body.appendChild(tutorialOverlay);
}

function showTutorialStep() {
    const step = TUTORIAL_STEPS[tutorialCurrentStep];
    if (!step) { endTutorial(); return; }

    // Run onEnter (setup actions for this step)
    if (step.onEnter) {
        try { step.onEnter(); } catch(e) { console.warn('Tutorial onEnter error:', e); }
    }

    // Wait a moment for DOM to settle, then position
    setTimeout(() => {
        // Remove old highlights
        document.querySelectorAll('.tutorial-highlight').forEach(el => el.classList.remove('tutorial-highlight'));
        let targetEl = null;
        if (step.selector) {
            targetEl = document.querySelector(step.selector);
            if (targetEl) {
                targetEl.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
                if (!step.noSpotlight) targetEl.classList.add('tutorial-highlight');
            }
        }
        // Build content
        const isLast = tutorialCurrentStep === TUTORIAL_STEPS.length - 1;
        const isFirst = tutorialCurrentStep === 0;
        tutorialBox.innerHTML =
            '<div class="tut-title">' + escapeHTML(step.title) + '</div>' +
            '<div class="tut-body">' + escapeHTML(step.body) + '</div>' +
            '<div class="tut-footer">' +
                '<span class="tut-progress">' + (tutorialCurrentStep + 1) + ' / ' + TUTORIAL_STEPS.length + '</span>' +
                '<div class="tut-buttons">' +
                    (isFirst ? '' : '<button id="tutPrev" class="tut-btn tut-btn-secondary">Back</button>') +
                    '<button id="tutSkip" class="tut-btn tut-btn-text">' + (isFirst ? 'Skip tour' : 'Skip') + '</button>' +
                    '<button id="tutNext" class="tut-btn tut-btn-primary">' + (isLast ? 'Finish' : (isFirst ? 'Start tour' : 'Next')) + '</button>' +
                '</div>' +
            '</div>';
        positionTutorialBox(targetEl, step.position);
        // Wire buttons
        $('tutNext').addEventListener('click', () => goNext());
        if (!isFirst) $('tutPrev').addEventListener('click', () => goPrev());
        $('tutSkip').addEventListener('click', () => endTutorial());
    }, 150);
}

function goNext() {
    const step = TUTORIAL_STEPS[tutorialCurrentStep];
    if (step && step.onExit) { try { step.onExit(); } catch(e) { console.warn('Tutorial onExit error:', e); } }
    tutorialCurrentStep++;
    if (tutorialCurrentStep >= TUTORIAL_STEPS.length) endTutorial();
    else showTutorialStep();
}

function goPrev() {
    const step = TUTORIAL_STEPS[tutorialCurrentStep];
    if (step && step.onExit) { try { step.onExit(); } catch(e) {} }
    tutorialCurrentStep = Math.max(0, tutorialCurrentStep - 1);
    showTutorialStep();
}

function positionTutorialBox(targetEl, position) {
    if (!tutorialBox) return;
    // Default: center
    let top = (window.innerHeight - tutorialBox.offsetHeight) / 2;
    let left = (window.innerWidth - tutorialBox.offsetWidth) / 2;
    if (targetEl && position) {
        const rect = targetEl.getBoundingClientRect();
        const boxW = tutorialBox.offsetWidth;
        const boxH = tutorialBox.offsetHeight;
        const margin = 16;
        if (position === 'right') {
            left = rect.right + margin;
            top = Math.max(margin, Math.min(rect.top, window.innerHeight - boxH - margin));
            if (left + boxW > window.innerWidth - margin) left = Math.max(margin, rect.left - boxW - margin);
        } else if (position === 'left') {
            left = rect.left - boxW - margin;
            top = Math.max(margin, Math.min(rect.top, window.innerHeight - boxH - margin));
            if (left < margin) left = rect.right + margin;
        } else if (position === 'bottom') {
            left = (window.innerWidth - boxW) / 2;
            top = rect.bottom + margin;
            if (top + boxH > window.innerHeight - margin) top = Math.max(margin, rect.top - boxH - margin);
        } else if (position === 'bottom-screen') {
            // Place at bottom-center of screen, regardless of target position
            left = (window.innerWidth - boxW) / 2;
            top = window.innerHeight - boxH - margin;
        }
    }
    top = Math.max(16, Math.min(top, window.innerHeight - tutorialBox.offsetHeight - 16));
    left = Math.max(16, Math.min(left, window.innerWidth - tutorialBox.offsetWidth - 16));
    tutorialBox.style.top = top + 'px';
    tutorialBox.style.left = left + 'px';
}

function endTutorial() {
    // Run cleanup for current step's onExit
    const step = TUTORIAL_STEPS[tutorialCurrentStep];
    if (step && step.onExit) { try { step.onExit(); } catch(e) {} }
    // Run final cleanup (remove demo chapter etc.)
    cleanupTutorial();
    // Remove UI
    if (tutorialOverlay) { tutorialOverlay.remove(); tutorialOverlay = null; tutorialBox = null; }
    document.body.classList.remove('tutorial-active');
    document.querySelectorAll('.tutorial-highlight').forEach(el => el.classList.remove('tutorial-highlight'));
    // Mark as seen
    try { safeStorage.set('bookspritz_tutorial_seen', '1'); } catch(e) {}
}

// ════════════════════════════════════════════════════════════════════
//  HELPER: Switch sidebar tab
// ════════════════════════════════════════════════════════════════════
function switchToTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    const btn = document.querySelector('[data-tab="' + tabName + '"]');
    const content = $(tabName + 'Tab');
    if (btn) btn.classList.add('active');
    if (content) content.classList.add('active');
}

function ensureSidebarOpen() {
    const sidebar = $('sidebar');
    if (sidebar && sidebar.classList.contains('collapsed')) sidebar.classList.remove('collapsed');
}

// ════════════════════════════════════════════════════════════════════
//  LIVE DEMO: Keyword highlighting
//  Creates a temporary demo chapter (by ID, not name), adds a keyword,
//  and writes sample text containing that keyword.
// ════════════════════════════════════════════════════════════════════
function setupKeywordDemo() {
    const book = getActiveBook();
    if (!book) return;
    // Create demo chapter with unique ID (not name-based)
    if (!tutorialState.demoChapterId) {
        tutorialState.demoChapterId = 'tut_demo_' + Date.now();
        const chId = tutorialState.demoChapterId;
        book.chapters.push({
            id: chId,
            title: TUTORIAL_DEMO.chapterTitle,
            pages: [{ id: 'tut_pg_' + Date.now(), content: TUTORIAL_DEMO.chapterContent }],
            flags: []
        });
        // Add the demo keyword (if not already present)
        if (!book.keywords[TUTORIAL_DEMO.keyword]) {
            book.keywords[TUTORIAL_DEMO.keyword] = {
                notes: TUTORIAL_DEMO.keywordNotes,
                active: true, partialMatch: false, bold: false, italic: false, textColor: ''
            };
            tutorialState.demoKeywordAdded = true;
        }
        // Switch to demo chapter
        activeChapterId = chId;
        renderUI();
    }
    // Switch to chapters tab so editor is visible
    switchToTab('chapters');
}

// ════════════════════════════════════════════════════════════════════
//  LIVE DEMO: Find in page
//  Opens the find panel and searches for the demo word.
// ════════════════════════════════════════════════════════════════════
function setupFindDemo() {
    // Make sure demo chapter exists and is active
    if (!tutorialState.demoChapterId) setupKeywordDemo();
    // Switch to chapters tab so editor is visible
    switchToTab('chapters');
    // Open find panel
    findPanel.classList.add('active');
    findInput.value = TUTORIAL_DEMO.findWord;
    // Trigger search, then scroll the first match to the top so it's visible
    // above the tutorial popup (which sits at the bottom of the screen)
    setTimeout(() => {
        performFind(TUTORIAL_DEMO.findWord);
        setTimeout(() => {
            const match = document.querySelector('mark.find-match');
            if (match) match.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }, 200);
}

function cleanupFindDemo() {
    // Close find panel (unless it was open before tutorial)
    if (!tutorialState.findWasOpen) {
        findPanel.classList.remove('active');
        clearFindHighlights();
        findInput.value = '';
    }
}

// ════════════════════════════════════════════════════════════════════
//  CLEANUP: Remove demo chapter and restore state
// ════════════════════════════════════════════════════════════════════
function cleanupTutorial() {
    // CRITICAL: Clear any pending debounced save so it doesn't fire
    // after we've swapped the DOM and overwrite the wrong chapter
    if (saveTimeout) { clearTimeout(saveTimeout); saveTimeout = null; }
    
    const book = getActiveBook();
    if (book) {
        // Remove demo chapter by ID (not name)
        if (tutorialState.demoChapterId) {
            book.chapters = book.chapters.filter(c => c.id !== tutorialState.demoChapterId);
        }
        // Remove demo keyword if we added it
        if (tutorialState.demoKeywordAdded && book.keywords[TUTORIAL_DEMO.keyword]) {
            delete book.keywords[TUTORIAL_DEMO.keyword];
        }
    }
    // Close find panel if we opened it
    if (!tutorialState.findWasOpen) {
        findPanel.classList.remove('active');
        clearFindHighlights();
    }
    // Close any open modals
    document.querySelectorAll('.modal:not(.hidden)').forEach(m => m.classList.add('hidden'));
    // Restore original chapter
    if (tutorialState.originalChapterId && book && book.chapters.find(c => c.id === tutorialState.originalChapterId)) {
        activeChapterId = tutorialState.originalChapterId;
    } else if (book && book.chapters[0]) {
        activeChapterId = book.chapters[0].id;
    }
    // Restore original tab
    switchToTab(tutorialState.originalTab || 'chapters');
    // CRITICAL: Render FIRST (swaps DOM from demo content to original chapter's content)
    // THEN save (so saveData reads the correct content from the DOM)
    renderUI();
    saveData();
    tutorialState.demoChapterId = null;
    tutorialState.demoKeywordAdded = false;
}

// ════════════════════════════════════════════════════════════════════
//  AUTO-START ON FIRST VISIT
// ════════════════════════════════════════════════════════════════════
function shouldShowTutorial() {
    try { return !safeStorage.get('bookspritz_tutorial_seen'); } catch(e) { return false; }
}

window.addEventListener('DOMContentLoaded', () => {
    if (shouldShowTutorial()) {
        setTimeout(startTutorial, 1200); // Wait for app to fully load
    }
});
