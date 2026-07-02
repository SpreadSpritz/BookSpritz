// === BookSpritz: Focus Mode ===
// When enabled, dims all paragraphs except the one containing the caret.

let focusModeEnabled = false;

function toggleFocusMode() {
    focusModeEnabled = !focusModeEnabled;
    document.body.classList.toggle('focus-mode', focusModeEnabled);
    $('focusToggle').classList.toggle('active', focusModeEnabled);
    if (focusModeEnabled) {
        updateFocusedParagraph();
    } else {
        document.querySelectorAll('#pagesWrapper .page p, #pagesWrapper .page h1, #pagesWrapper .page h2, #pagesWrapper .page h3').forEach(el => el.classList.remove('focused'));
    }
}

function updateFocusedParagraph() {
    if (!focusModeEnabled) return;
    const sel = window.getSelection();
    const allParas = document.querySelectorAll('#pagesWrapper .page p, #pagesWrapper .page h1, #pagesWrapper .page h2, #pagesWrapper .page h3');
    allParas.forEach(el => el.classList.remove('focused'));
    if (!sel.rangeCount) return;
    let node = sel.anchorNode;
    // Walk up to find the paragraph element
    while (node && node.nodeType !== 1) node = node.parentNode;
    while (node && node !== pagesWrapper) {
        if (node.tagName === 'P' || node.tagName === 'H1' || node.tagName === 'H2' || node.tagName === 'H3') {
            node.classList.add('focused');
            return;
        }
        node = node.parentNode;
    }
}

// Wire up the button + listen for caret movement
document.addEventListener('DOMContentLoaded', () => {
    $('focusToggle').addEventListener('click', toggleFocusMode);
    // Update focused paragraph on caret movement (selectionchange is frequent but cheap here)
    document.addEventListener('selectionchange', () => { if (focusModeEnabled) updateFocusedParagraph(); });
    // Also update on input (typing may create new paragraphs)
    pagesWrapper.addEventListener('input', () => { if (focusModeEnabled) setTimeout(updateFocusedParagraph, 50); });
});
