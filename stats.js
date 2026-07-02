// === BookSpritz: Word count, stats, writing goals ===

// --- Word count & stats ---
function countWords(html) {
    const text = html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
    if (!text) return 0;
    return text.split(/\s+/).length;
}
function countChars(html, includeSpaces = true) {
    const text = html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ');
    return includeSpaces ? text.length : text.replace(/\s/g, '').length;
}
function readingTime(words) {
    const mins = Math.ceil(words / 250);
    if (mins < 60) return mins + ' min';
    const h = Math.floor(mins / 60), m = mins % 60;
    return h + 'h ' + m + 'm';
}
function computeStats() {
    const book = getActiveBook();
    if (!book) return { totals: { words: 0, chars: 0, charsNoSpaces: 0, chapters: 0, keywords: 0 }, perChapter: [] };
    const totals = { words: 0, chars: 0, charsNoSpaces: 0, chapters: book.chapters.length, keywords: Object.keys(book.keywords || {}).length };
    const perChapter = book.chapters.map(ch => {
        const html = ch.pages.map(p => p.content || '').join(' ');
        const w = countWords(html), c = countChars(html, true), cns = countChars(html, false);
        totals.words += w; totals.chars += c; totals.charsNoSpaces += cns;
        return { id: ch.id, title: ch.title, words: w, chars: c, readingTime: readingTime(w) };
    });
    return { totals, perChapter };
}
function renderStats() {
    const s = computeStats();
    const bn = $('statsBookName'); if (bn) bn.textContent = 'Book: ' + (getActiveBook() ? getActiveBook().title : 'Unknown');
    let html = `<div class="stats-total">
        <div class="stat-box"><div class="stat-num">${s.totals.words.toLocaleString()}</div><div class="stat-label">Total Words</div></div>
        <div class="stat-box"><div class="stat-num">${s.totals.chapters}</div><div class="stat-label">Chapters</div></div>
        <div class="stat-box"><div class="stat-num">${s.totals.chars.toLocaleString()}</div><div class="stat-label">Characters</div></div>
        <div class="stat-box"><div class="stat-num">${readingTime(s.totals.words)}</div><div class="stat-label">Reading Time</div></div>
    </div>`;
    if (s.totals.keywords > 0) html += `<div class="stat-box" style="margin-bottom:14px;font-size:0.85rem;color:var(--text-muted);text-align:center">${s.totals.keywords} tracked ${s.totals.keywords === 1 ? 'keyword' : 'keywords'} in your lore database</div>`;
    html += `<table class="stats-table"><thead><tr><th>Chapter</th><th>Words</th><th>Chars</th><th>Read</th></tr></thead><tbody>`;
    s.perChapter.forEach(c => { html += `<tr class="${c.id === activeChapterId ? 'active-chapter' : ''}"><td>${escapeHTML(c.title)}</td><td>${c.words.toLocaleString()}</td><td>${c.chars.toLocaleString()}</td><td>${c.readingTime}</td></tr>`; });
    html += '</tbody></table>';
    html += renderWritingGoal();
    html += '<h3 style="font-family:Merriweather,serif;color:var(--accent-orange);margin-top:24px;margin-bottom:12px;font-size:1.1rem;">Word Frequency</h3>';
    html += '<div id="freqAnalysisContent">' + renderWordFrequency() + '</div>';
    $('statsContent').innerHTML = html;
    const goalInput = $('dailyGoalInput');
    if (goalInput) goalInput.addEventListener('change', e => { if (!appData.settings) appData.settings = {}; appData.settings.dailyGoal = Math.max(50, parseInt(e.target.value) || 500); saveData(); renderStats(); });
}

// --- Writing goal & streak tracking ---
function todayKey() { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); }
function dateKey(d) { return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); }
function getDailyGoal() { return (appData.settings && appData.settings.dailyGoal) || 500; }
function getWritingLog() { if (!appData.writingLog) appData.writingLog = {}; return appData.writingLog; }
function recordDailyWords(delta) {
    if (!delta || delta <= 0) return;
    const log = getWritingLog();
    const k = todayKey();
    log[k] = (log[k] || 0) + delta;
    // Cap log at 365 days to avoid unbounded growth
    const keys = Object.keys(log).sort();
    if (keys.length > 365) { for (let i = 0; i < keys.length - 365; i++) delete log[keys[i]]; }
}
function computeStreak() {
    const log = getWritingLog();
    const goal = getDailyGoal();
    let streak = 0;
    const today = new Date();
    // If today not met yet, start from yesterday
    const todayMet = (log[todayKey()] || 0) >= goal;
    let d = new Date(today);
    if (!todayMet) d.setDate(d.getDate() - 1);
    while (true) {
        const k = dateKey(d);
        if ((log[k] || 0) >= goal) { streak++; d.setDate(d.getDate() - 1); }
        else break;
        if (streak > 365) break; // safety
    }
    return { streak, todayMet, todayWords: log[todayKey()] || 0, goal };
}
function updateDailyBadge() {
    const { todayWords, goal, todayMet } = computeStreak();
    const badge = $('dailyBadge');
    if (!badge) return;
    if (todayWords > 0) {
        badge.classList.add('show');
        badge.classList.toggle('met', todayMet);
        badge.textContent = todayWords >= 1000 ? (todayWords/1000).toFixed(1) + 'k' : todayWords;
    } else {
        badge.classList.remove('show');
    }
}
function renderWritingGoal() {
    const { streak, todayMet, todayWords, goal } = computeStreak();
    const log = getWritingLog();
    const pct = Math.min(100, Math.round((todayWords / goal) * 100));
    const flameSvg = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c1 3 4 5 4 9a4 4 0 0 1-8 0c0-2 1-3 2-4-2 1-4 3-4 7a6 6 0 0 0 12 0c0-5-4-8-6-12z"/></svg>';
    // Build last 7 days
    const days = [];
    const today = new Date();
    const dayLabels = ['S','M','T','W','T','F','S'];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today); d.setDate(d.getDate() - i);
        const k = dateKey(d);
        const words = log[k] || 0;
        const met = words >= goal;
        const isToday = k === todayKey();
        days.push(`<div class="goal-day ${met?'met':''} ${isToday?'today':''}"><span class="goal-day-label">${dayLabels[d.getDay()]}</span><span class="goal-day-count">${words}</span></div>`);
    }
    return `<div class="writing-goal-section">
        <div class="writing-goal-header">
            <span class="writing-goal-title">Daily Writing Goal</span>
            ${streak > 0 ? `<span class="streak-badge">${flameSvg} ${streak} day${streak===1?'':'s'}</span>` : ''}
        </div>
        <div class="goal-progress-bar"><div class="goal-progress-fill" style="width:${pct}%"></div></div>
        <div class="goal-progress-text"><span><strong>${todayWords.toLocaleString()}</strong> / ${goal.toLocaleString()} words today</span><span>${pct}%</span></div>
        <div class="goal-7day">${days.join('')}</div>
        <div class="goal-setting-row"><label>Daily goal:</label><input type="number" id="dailyGoalInput" min="50" max="10000" step="50" value="${goal}"><span>words</span></div>
        ${todayMet ? '<p style="font-size:0.85rem;color:#4CAF50;margin-top:10px;text-align:center;font-weight:600;">Goal met! Keep the streak alive.</p>' : ''}
    </div>`;
}
// Track word count changes for daily log
let lastWordCount = 0;
function trackWordDelta() {
    const current = computeStats().totals.words;
    if (lastWordCount > 0 && current > lastWordCount) {
        recordDailyWords(current - lastWordCount);
        updateDailyBadge();
    }
    lastWordCount = current;
}
