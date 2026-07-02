// === BookSpritz: Settings & Color Palette ===

// --- Settings (typography & editor) ---
const DEFAULT_SETTINGS = { fontFamily: "Merriweather, serif", fontSize: 1.1, lineHeight: 1.8, pageWidth: 700, pageHeight: 800, autosave: 2000 };
function getSettings() {
    if (!appData.settings) appData.settings = {};
    return Object.assign({}, DEFAULT_SETTINGS, appData.settings);
}
function applySettings() {
    const s = getSettings();
    const ss = document.documentElement.style;
    ss.setProperty('--page-font-family', s.fontFamily);
    ss.setProperty('--page-font-size', s.fontSize + 'rem');
    ss.setProperty('--page-line-height', String(s.lineHeight));
    ss.setProperty('--page-width', s.pageWidth + 'px');
    ss.setProperty('--page-height', s.pageHeight + 'px');
    // Apply to existing pages
    document.querySelectorAll('#pagesWrapper .page').forEach(p => {
        p.style.fontFamily = s.fontFamily;
        p.style.fontSize = s.fontSize + 'rem';
        p.style.lineHeight = String(s.lineHeight);
        p.style.height = s.pageHeight + 'px';
        p.style.maxHeight = s.pageHeight + 'px';
    });
    const pw = $('pagesWrapper');
    if (pw) pw.style.maxWidth = s.pageWidth + 'px';
    // Adjust mobile page height if smaller than desktop setting
    if (window.matchMedia('(max-width: 768px)').matches) {
        const mobileH = Math.min(s.pageHeight, 600);
        document.querySelectorAll('#pagesWrapper .page').forEach(p => { p.style.height = mobileH + 'px'; p.style.maxHeight = mobileH + 'px'; });
    }
}
function populateSettingsUI() {
    const s = getSettings();
    $('settingFontFamily').value = s.fontFamily;
    $('settingFontSize').value = s.fontSize;
    $('fontSizeVal').textContent = s.fontSize + 'rem';
    $('settingLineHeight').value = s.lineHeight;
    $('lineHeightVal').textContent = s.lineHeight;
    $('settingPageWidth').value = s.pageWidth;
    $('pageWidthVal').textContent = s.pageWidth + 'px';
    $('settingPageHeight').value = s.pageHeight;
    $('pageHeightVal').textContent = s.pageHeight + 'px';
    $('settingAutosave').value = s.autosave;
    $('autosaveVal').textContent = (s.autosave / 1000) + 's';
}
function setupSettingsListeners() {
    const upd = (key, val, labelId, labelFn) => {
        if (!appData.settings) appData.settings = {};
        appData.settings[key] = val;
        if (labelId) $(labelId).textContent = labelFn ? labelFn(val) : val;
        applySettings();
        debouncedSave();
    };
    $('settingFontFamily').addEventListener('change', e => upd('fontFamily', e.target.value));
    $('settingFontSize').addEventListener('input', e => upd('fontSize', parseFloat(e.target.value), 'fontSizeVal', v => v + 'rem'));
    $('settingLineHeight').addEventListener('input', e => upd('lineHeight', parseFloat(e.target.value), 'lineHeightVal', v => String(v)));
    $('settingPageWidth').addEventListener('input', e => upd('pageWidth', parseInt(e.target.value), 'pageWidthVal', v => v + 'px'));
    $('settingPageHeight').addEventListener('input', e => upd('pageHeight', parseInt(e.target.value), 'pageHeightVal', v => v + 'px'));
    $('settingAutosave').addEventListener('input', e => upd('autosave', parseInt(e.target.value), 'autosaveVal', v => (v/1000) + 's'));
    $('resetSettingsBtn').addEventListener('click', () => {
        CustomUI.confirm('Reset all settings to defaults?', c => {
            if (c) { appData.settings = Object.assign({}, DEFAULT_SETTINGS); populateSettingsUI(); applySettings(); saveData(); }
        });
    });
}

// --- Import (Markdown / TXT / HTML → new chapter(s)) ---
function markdownToHtml(md) {
    // Escape HTML first
    let h = md.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    // Headings (### before ## before #)
    h = h.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    h = h.replace(/^## (.+)$/gm, '<h2 class="page-title">$1</h2>');
    h = h.replace(/^# (.+)$/gm, '<h2 class="page-title">$1</h2>');
    // Bold / italic
    h = h.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    h = h.replace(/\*(.+?)\*/g, '<em>$1</em>');
    // Links [text](url)
    h = h.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
    // Horizontal rules
    h = h.replace(/^---+$/gm, '<hr>');
    // Paragraphs: split on blank lines
    const blocks = h.split(/\n\n+/);
    return blocks.map(b => {
        if (b.match(/^<(h\d|hr)/i)) return b;
        return '<p>' + b.replace(/\n/g, '<br>') + '</p>';
    }).join('');
}
function splitByHeadings(html) {
    // If the imported content has multiple <h2> headings, split into multiple chapters
    const temp = document.createElement('div');
    temp.innerHTML = html;
    const headings = temp.querySelectorAll('h2');
    if (headings.length <= 1) return [{ title: 'Imported Chapter', content: html }];
    const chapters = [];
    let current = null;
    Array.from(temp.childNodes).forEach(node => {
        if (node.nodeType === 1 && node.tagName === 'H2') {
            if (current) chapters.push(current);
            current = { title: node.textContent.trim() || 'Untitled', content: node.outerHTML };
        } else if (current) {
            current.content += node.nodeType === 1 ? node.outerHTML : node.textContent;
        } else {
            // Content before first heading — prepend to first chapter
            if (!chapters._pre) chapters._pre = '';
            chapters._pre += node.nodeType === 1 ? node.outerHTML : node.textContent;
        }
    });
    if (current) chapters.push(current);
    if (chapters._pre) { chapters[0].content = chapters._pre + chapters[0].content; delete chapters._pre; }
    return chapters;
}
function handleImport(file) {
    if (!file) return;
    const reader = new FileReader();
    $('importProgress').classList.add('show');
    reader.onload = e => {
        try {
            const text = e.target.result;
            const ext = file.name.split('.').pop().toLowerCase();
            let html;
            if (ext === 'md' || ext === 'markdown') html = markdownToHtml(text);
            else if (ext === 'txt') html = text.split(/\n\n+/).map(b => '<p>' + b.replace(/\n/g, '<br>') + '</p>').join('');
            else if (ext === 'html') html = text.replace(/<\/?html|<\/?body|<\/?head|<meta[^>]*>|<title[^>]*>[^<]*<\/title>|<style[^>]*>[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/gi, '').trim();
            else { CustomUI.alert('Unsupported file type. Use .md, .txt, or .html'); $('importProgress').classList.remove('show'); return; }

            const chapters = splitByHeadings(html);
            let firstId = null;
            chapters.forEach(ch => {
                const id = 'ch_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
                const cleanTitle = ch.title.replace(/[#*]/g, '').trim() || 'Imported Chapter';
                getActiveBook().chapters.push({ id, title: cleanTitle, pages: [{ id: 'pg_' + Date.now() + '_' + Math.random().toString(36).slice(2,5), content: ch.content }], flags: [] });
                if (!firstId) firstId = id;
            });
            saveData();
            renderUI();
            if (firstId) switchChapter(firstId);
            $('importProgress').classList.remove('show');
            CustomUI.alert('Imported ' + chapters.length + ' chapter' + (chapters.length === 1 ? '' : 's') + ' from ' + file.name + '.', 'Import Complete');
        } catch (err) {
            console.error('Import failed:', err);
            $('importProgress').classList.remove('show');
            CustomUI.alert('Import failed: ' + err.message);
        }
    };
    reader.onerror = () => { $('importProgress').classList.remove('show'); CustomUI.alert('Could not read the file.'); };
    reader.readAsText(file);
}

function setupColorPalette() {
    const palette = $('colorPalette'); palette.innerHTML = ''; 
    appData.colorPresets.forEach((color, i) => { const btn = document.createElement('button'); btn.className = 'preset-color'; btn.style.backgroundColor = color; btn.addEventListener('click', e => { e.preventDefault(); if (e.altKey) { const inp = document.createElement('input'); inp.type = 'color'; inp.addEventListener('change', ev => { appData.colorPresets[i] = ev.target.value; saveData(); setupColorPalette(); }); inp.click(); } else { if (savedToolbarRange) { const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(savedToolbarRange); } document.execCommand('foreColor', false, color); } }); palette.appendChild(btn); }); 
    const wrap = document.createElement('div'); wrap.className = 'popover-actions'; wrap.innerHTML = `<input type="color" id="customColorPicker" value="#D9946B"><select id="presetSlotSelect"><option value="0">Slot 1</option><option value="1">Slot 2</option><option value="2">Slot 3</option><option value="3">Slot 4</option><option value="4">Slot 5</option><option value="5">Slot 6</option><option value="6">Slot 7</option><option value="7">Slot 8</option><option value="8">Slot 9</option><option value="9">Slot 10</option></select><button class="confirm-color-btn" id="confirmColorBtn">Done</button>`; palette.appendChild(wrap); 
    $('customColorPicker').addEventListener('input', e => { if (savedToolbarRange) { const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(savedToolbarRange); } document.execCommand('foreColor', false, e.target.value); }); 
    $('confirmColorBtn').addEventListener('click', () => { const c = $('customColorPicker').value; const s = $('presetSlotSelect').value; appData.colorPresets[s] = c; saveData(); setupColorPalette(); palette.classList.add('hidden'); }); 
}
