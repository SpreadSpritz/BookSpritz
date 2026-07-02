// === BookSpritz: Auto-save Indicator ===
// Shows "Saving..." / "Saved at HH:MM" / "Error" in the header.

function updateSaveIndicator(status) {
    const el = $('saveIndicator');
    if (!el) return;
    el.classList.remove('saving', 'saved', 'error');
    if (status === 'saving') {
        el.textContent = 'Saving...';
        el.classList.add('saving');
    } else if (status === 'saved') {
        const now = new Date();
        const time = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
        el.textContent = 'Saved ' + time;
        el.classList.add('saved');
    } else if (status === 'error') {
        el.textContent = 'Save failed';
        el.classList.add('error');
    }
}
