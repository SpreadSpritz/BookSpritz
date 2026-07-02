// === BookSpritz Core ===
// Globals, helpers, and initialization bootstrap
document.addEventListener('DOMContentLoaded', () => {

const $ = id => document.getElementById(id);
const firebaseConfig={apiKey:"AIzaSyBt3A8YQaYE1fMdXwlh7AvPu0w_7F8f-e4",authDomain:"spreadapoteck.firebaseapp.com",databaseURL:"https://spreadapoteck-default-rtdb.europe-west1.firebasedatabase.app",projectId:"spreadapoteck",storageBucket:"spreadapoteck.firebasestorage.app",messagingSenderId:"1060961337221",appId:"1:1060961337221:web:78c2a19fe6197a29e8ceec",measurementId:"G-39VC7GKE4N"};
firebase.initializeApp(firebaseConfig);
const auth=firebase.auth(), db=firebase.database();
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







