// === BookSpritz Core ===
// Globals, helpers, and initialization bootstrap
// All definitions are top-level so they're shared across script tags.
// Scripts are loaded at end of <body>, so DOM is ready when these run.

const $ = id => document.getElementById(id);
const firebaseConfig={apiKey:"AIzaSyBt3A8YQaYE1fMdXwlh7AvPu0w_7F8f-e4",authDomain:"spreadapoteck.firebaseapp.com",databaseURL:"https://spreadapoteck-default-rtdb.europe-west1.firebasedatabase.app",projectId:"spreadapoteck",storageBucket:"spreadapoteck.firebasestorage.app",messagingSenderId:"1060961337221",appId:"1:1060961337221:web:78c2a19fe6197a29e8ceec",measurementId:"G-39VC7GKE4N"};
// Firebase init is wrapped in try-catch so the app works even if Firebase CDN is blocked (ad blockers, etc.)
let auth = null, db = null;
try {
    if (typeof firebase !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
        auth = firebase.auth();
        db = firebase.database();
        console.log('Firebase loaded successfully');
    } else {
        console.warn('Firebase SDK not loaded — cloud sync disabled. App still works locally.');
    }
} catch(e) {
    console.error('Firebase init failed:', e);
}
const DB_KEY='bookSpritzData', HISTORY_KEY='bookSpritzHistory';
let appData={books:[],activeBookId:null,colorPresets:['#000000','#FFFFFF','#FF0000','#0000FF','#008000','#FFFF00','#FFA500','#800080','#FFC0CB','#008080']};
let activeChapterId=null, saveTimeout=null, savedToolbarRange=null, currentUser=null, findMatches=[], findIndex=-1, reviewCallback=null, highlightTimeout=null;
const POST_IT_COLORS=['#F0E6B1','#D9946B','#C9D6D3','#E8D4C8','#D4C5E2'];
const chapterList=$('chapterList'), canvasContainer=$('canvasContainer'), pagesWrapper=$('pagesWrapper'), findPanel=$('findPanel'), findInput=$('findInput'), findCounter=$('findCounter');
document.execCommand("defaultParagraphSeparator", false, "p");

const CustomUI = {
    modalContainer: null, init() { this.modalContainer = document.createElement('div'); this.modalContainer.className = 'modal hidden'; this.modalContainer.id = 'customModal'; this.modalContainer.innerHTML = `<div class="modal-content"><h2 id="customModalTitle"></h2><p id="customModalMsg" style="margin-bottom:15px;"></p><input type="text" id="customModalInput" class="custom-input" style="display:none;"><div class="modal-actions"><button id="customModalCancel" class="add-btn">Cancel</button><button id="customModalOk" class="add-btn primary-btn">OK</button></div></div>`; document.body.appendChild(this.modalContainer); },
    show(title, msg, inputVal, hasCancel, callback) { $('customModalTitle').innerText = title; $('customModalMsg').innerText = msg; const input = $('customModalInput'), cancelBtn = $('customModalCancel'); if (inputVal !== undefined) { input.style.display = 'block'; input.value = inputVal; } else { input.style.display = 'none'; } cancelBtn.style.display = hasCancel ? 'block' : 'none'; this.modalContainer.classList.remove('hidden'); const okBtn = $('customModalOk'); const newOk = okBtn.cloneNode(true); okBtn.parentNode.replaceChild(newOk, okBtn); const newCancel = cancelBtn.cloneNode(true); cancelBtn.parentNode.replaceChild(newCancel, cancelBtn); newOk.onclick = () => { this.modalContainer.classList.add('hidden'); if (callback) callback(input.style.display === 'none' ? true : input.value); }; newCancel.onclick = () => { this.modalContainer.classList.add('hidden'); if (callback) callback(null); }; },
    alert(msg, title="Alert") { this.show(title, msg, undefined, false, null); }, confirm(msg, callback, title="Confirm") { this.show(title, msg, undefined, true, res => callback(res)); }, prompt(msg, defaultText, callback, title="Input") { this.show(title, msg, defaultText, true, res => callback(res)); }
}; CustomUI.init();

// --- Safety & accessibility helpers ---
const escapeHTML = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeStorage = {
    get(k) { try { return localStorage.getItem(k); } catch(e) { console.warn('read failed:', e); return null; } },
    set(k, v) { try { localStorage.setItem(k, v); return true; } catch(e) { console.warn('write failed:', e); CustomUI.alert('Could not save — local storage may be full. Try restoring and deleting old Time Machine snapshots.'); return false; } },
    getJSON(k, fallback) { try { const v = localStorage.getItem(k); if (!v) return fallback; try { return JSON.parse(v); } catch(e) { console.warn('parse failed:', k, e); return fallback; } } catch(e) { console.warn('read failed:', e); return fallback; } }
};
// Auto-add aria-label from title for accessibility (icon buttons have titles but no aria-label)
document.querySelectorAll('button[title]').forEach(b => { if (!b.getAttribute('aria-label')) b.setAttribute('aria-label', b.title); });
// Mark all modals as dialogs for screen readers
document.querySelectorAll('.modal').forEach(m => { m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); });
// Global error handler — prevents silent crashes
window.addEventListener('error', e => { console.error('Unhandled error:', e.error || e.message); try { CustomUI.alert('Something went wrong: ' + (e.message || 'unknown error') + '\n\nYour work is auto-saved. Try refreshing if the app seems stuck.'); } catch(_){} });
window.addEventListener('unhandledrejection', e => { console.error('Unhandled promise rejection:', e.reason); });

// --- Service Worker registration (PWA: offline + installable) ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').then(reg => {
            console.log('BookSpritz SW registered (offline enabled).');
        }).catch(err => console.warn('SW registration failed:', err));
    });
}

// --- PWA Install Prompt ---
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    if (!safeStorage.get('bookspritz_install_dismissed')) $('installBanner').classList.add('show');
});
window.addEventListener('DOMContentLoaded', () => {
    const installBtn = $('installBtn');
    const installClose = $('installClose');
    if (installBtn) installBtn.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        $('installBanner').classList.remove('show');
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log('Install outcome:', outcome);
        deferredPrompt = null;
    });
    if (installClose) installClose.addEventListener('click', () => { $('installBanner').classList.remove('show'); safeStorage.set('bookspritz_install_dismissed', '1'); });
});
window.addEventListener('appinstalled', () => { $('installBanner').classList.remove('show'); deferredPrompt = null; console.log('BookSpritz installed!'); });

// --- Mobile tap-to-view lore (keyword tooltip) ---
function showLorePopover(keywordSpan) {
    const notes = keywordSpan.dataset.notes;
    if (!notes) return;
    const pop = $('lorePopover');
    $('lorePopoverText').textContent = notes;
    pop.classList.add('show');
    const rect = keywordSpan.getBoundingClientRect();
    const popRect = pop.getBoundingClientRect();
    let left = rect.left + window.scrollX - 10;
    let top = rect.bottom + window.scrollY + 8;
    if (left + popRect.width > window.innerWidth - 10) left = window.innerWidth - popRect.width - 10;
    if (left < 10) left = 10;
    pop.style.left = left + 'px';
    pop.style.top = top + 'px';
}
function hideLorePopover() { $('lorePopover').classList.remove('show'); }
window.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('click', e => {
        const span = e.target.closest('.keyword-span');
        if (span) { e.stopPropagation(); showLorePopover(span); }
        else if (!e.target.closest('.lore-popover')) hideLorePopover();
    });
    const closeBtn = $('lorePopoverClose');
    if (closeBtn) closeBtn.addEventListener('click', e => { e.stopPropagation(); hideLorePopover(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') hideLorePopover(); });
    const cc = $('canvasContainer');
    if (cc) cc.addEventListener('scroll', hideLorePopover, { passive: true });
});







