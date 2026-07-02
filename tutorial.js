// === BookSpritz: Interactive Tutorial ===
// Shows on first visit, replayable from Settings.

const TUTORIAL_STEPS = [
    {
        title: 'Welcome to BookSpritz!',
        body: 'A book-writing app with a lore system, margin notes, version history, and more. This quick tour will show you the essentials. You can replay it anytime from Settings.',
        selector: null,
        position: 'center'
    },
    {
        title: 'Book Switcher',
        body: 'Switch between books here. Click + to create a new book, the pencil to rename, or the trash to delete. Each book has its own chapters and keywords.',
        selector: '#bookSelect',
        position: 'right'
    },
    {
        title: 'Chapters Tab',
        body: 'Your chapter list lives here. Click a chapter to open it, use the rename/delete icons on hover, and drag the grip handle to reorder. The "+ New Chapter" button adds chapters, and "Import File" lets you bring in Markdown, TXT, or HTML files.',
        selector: '#chaptersTab',
        position: 'right'
    },
    {
        title: 'Keywords Tab (Lore System)',
        body: 'Add characters, places, or items as keywords. They get auto-highlighted throughout your manuscript with hover-to-read lore notes. Each keyword tracks how many times it appears. Use "Replace Word" to safely rename a character everywhere, "Bake Formats" to freeze styling, and the B/I/color buttons to format.',
        selector: '#keywordsTab',
        position: 'right'
    },
    {
        title: 'The Editor',
        body: 'Write here! Content flows across book-like pages automatically. Use the toolbar for bold, italic, font size, and text colors. Press Ctrl+F to find text. The orange + button on the right adds draggable margin notes.',
        selector: '#pagesWrapper',
        position: 'left'
    },
    {
        title: 'Header Tools',
        body: 'Left to right: Settings (typography), Stats (word count + goals + frequency analyzer), Export (Markdown/TXT/HTML/PDF), Spellcheck toggle, Find, Time Machine (auto-snapshots every 10 min), Fullscreen, Read-Only compiled view, Focus Mode (dims other paragraphs), and Zen Mode (dark theme).',
        selector: '.header-right',
        position: 'bottom'
    },
    {
        title: 'Account Tab',
        body: 'Create a free account to sync your books across devices. Your data is also saved locally, so you can write offline — it syncs when you reconnect.',
        selector: '#accountTab',
        position: 'right'
    },
    {
        title: 'You are all set!',
        body: 'Start writing your masterpiece. Everything auto-saves. Check the Stats tab for your daily word goal and streak, and the Time Machine if you ever need to revert. Happy writing!',
        selector: null,
        position: 'center'
    }
];

let tutorialCurrentStep = 0;
let tutorialOverlay = null;
let tutorialBox = null;

function startTutorial() {
    tutorialCurrentStep = 0;
    createTutorialUI();
    showTutorialStep();
}

function createTutorialUI() {
    // Remove existing if any
    if (tutorialOverlay) tutorialOverlay.remove();
    
    tutorialOverlay = document.createElement('div');
    tutorialOverlay.id = 'tutorialOverlay';
    tutorialOverlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:9999;display:flex;align-items:center;justify-content:center;pointer-events:auto;';
    
    tutorialBox = document.createElement('div');
    tutorialBox.id = 'tutorialBox';
    tutorialBox.style.cssText = 'background:var(--page-bg,#fff);border-radius:12px;padding:28px;max-width:420px;width:90%;box-shadow:0 8px 32px rgba(0,0,0,0.3);position:relative;animation:tutFadeIn 0.3s ease;';
    
    tutorialOverlay.appendChild(tutorialBox);
    document.body.appendChild(tutorialOverlay);
    
    // Close on overlay click
    tutorialOverlay.addEventListener('click', e => {
        if (e.target === tutorialOverlay) endTutorial();
    });
}

function showTutorialStep() {
    const step = TUTORIAL_STEPS[tutorialCurrentStep];
    if (!step) { endTutorial(); return; }
    
    // Highlight target element
    document.querySelectorAll('.tutorial-highlight').forEach(el => el.classList.remove('tutorial-highlight'));
    let targetEl = null;
    if (step.selector) {
        targetEl = document.querySelector(step.selector);
        if (targetEl) {
            // Make sure the element is visible (e.g. sidebar is open)
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            targetEl.classList.add('tutorial-highlight');
        }
    }
    
    // Position the tutorial box
    const isLast = tutorialCurrentStep === TUTORIAL_STEPS.length - 1;
    const isFirst = tutorialCurrentStep === 0;
    
    tutorialBox.innerHTML = `
        <div style="font-family:'Merriweather',serif;color:var(--accent-orange,#D9946B);font-size:1.3rem;font-weight:700;margin-bottom:12px;">${escapeHTML(step.title)}</div>
        <div style="font-size:0.95rem;line-height:1.6;color:var(--text-color,#4A4A4A);margin-bottom:24px;">${escapeHTML(step.body)}</div>
        <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:0.8rem;color:var(--text-muted,#8A8A8A);">${tutorialCurrentStep + 1} / ${TUTORIAL_STEPS.length}</span>
            <div style="display:flex;gap:8px;">
                ${!isFirst ? '<button id="tutPrev" style="padding:8px 16px;border:1px solid var(--border-color);border-radius:6px;background:var(--bg-color);color:var(--text-color);cursor:pointer;font-weight:600;">Back</button>' : ''}
                ${!isFirst ? '<button id="tutSkip" style="padding:8px 16px;border:none;border-radius:6px;background:none;color:var(--text-muted);cursor:pointer;font-size:0.85rem;">Skip</button>' : '<button id="tutSkip" style="padding:8px 16px;border:none;border-radius:6px;background:none;color:var(--text-muted);cursor:pointer;font-size:0.85rem;">Skip tour</button>'}
                <button id="tutNext" style="padding:8px 20px;border:none;border-radius:6px;background:var(--accent-orange,#D9946B);color:#fff;cursor:pointer;font-weight:700;">${isLast ? 'Finish' : (isFirst ? 'Start tour' : 'Next')}</button>
            </div>
        </div>
    `;
    
    // Position box near target element
    positionTutorialBox(targetEl, step.position);
    
    // Wire up buttons
    $('tutNext').addEventListener('click', () => {
        if (isLast) endTutorial();
        else { tutorialCurrentStep++; showTutorialStep(); }
    });
    if (!isFirst) {
        $('tutPrev').addEventListener('click', () => { tutorialCurrentStep = Math.max(0, tutorialCurrentStep - 1); showTutorialStep(); });
    }
    $('tutSkip').addEventListener('click', endTutorial);
}

function positionTutorialBox(targetEl, position) {
    if (!targetEl || !tutorialBox) return;
    const rect = targetEl.getBoundingClientRect();
    const boxRect = tutorialBox.getBoundingClientRect();
    const margin = 16;
    let top, left;
    
    // Default: center
    top = (window.innerHeight - boxRect.height) / 2;
    left = (window.innerWidth - boxRect.width) / 2;
    
    if (position === 'right') {
        // Place to the right of the target
        left = rect.right + margin;
        top = rect.top;
        if (left + boxRect.width > window.innerWidth - margin) {
            // Not enough space on right, place on left
            left = rect.left - boxRect.width - margin;
        }
    } else if (position === 'left') {
        left = rect.left - boxRect.width - margin;
        top = rect.top;
        if (left < margin) left = rect.right + margin;
    } else if (position === 'bottom') {
        left = (window.innerWidth - boxRect.width) / 2;
        top = rect.bottom + margin;
        if (top + boxRect.height > window.innerHeight - margin) {
            top = rect.top - boxRect.height - margin;
        }
    }
    
    // Clamp to viewport
    top = Math.max(margin, Math.min(top, window.innerHeight - boxRect.height - margin));
    left = Math.max(margin, Math.min(left, window.innerWidth - boxRect.width - margin));
    
    tutorialBox.style.position = 'fixed';
    tutorialBox.style.top = top + 'px';
    tutorialBox.style.left = left + 'px';
}

function endTutorial() {
    if (tutorialOverlay) {
        tutorialOverlay.remove();
        tutorialOverlay = null;
        tutorialBox = null;
    }
    document.querySelectorAll('.tutorial-highlight').forEach(el => el.classList.remove('tutorial-highlight'));
    // Mark as seen
    try { safeStorage.set('bookspritz_tutorial_seen', '1'); } catch(e) {}
}

// Check if first visit
function shouldShowTutorial() {
    try { return !safeStorage.get('bookspritz_tutorial_seen'); } catch(e) { return false; }
}

// Auto-start on first visit
window.addEventListener('DOMContentLoaded', () => {
    if (shouldShowTutorial()) {
        setTimeout(startTutorial, 800); // Small delay so app fully loads
    }
});
