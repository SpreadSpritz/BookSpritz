// === BookSpritz: Word Frequency Analyzer ===
// Finds overused words — helps writers spot repetition.

const STOP_WORDS = new Set([
    'the','a','an','and','or','but','in','on','at','to','for','of','with','by','from','up','about','into','through','during',
    'before','after','above','below','between','under','over','is','are','was','were','be','been','being','have','has','had',
    'do','does','did','will','would','could','should','may','might','must','shall','can','need','dare','ought','used',
    'that','this','these','those','i','you','he','she','it','we','they','me','him','her','us','them','my','your','his','its',
    'our','their','mine','yours','hers','ours','theirs','myself','yourself','himself','herself','itself','ourselves',
    'themselves','what','which','who','whom','whose','where','when','why','how','all','each','every','both','few','more',
    'most','other','some','such','no','nor','not','only','own','same','so','than','too','very','just','also','as','if','then',
    'there','here','out','so','said','says','say','one','two','three','am','ok','okay','yes','no','not','now','still','again',
    'get','got','go','went','gone','come','came','make','made','take','took','taken','see','saw','seen','know','knew','known',
    'think','thought','feel','felt','want','wanted','like','well','even','back','way','thing','things','much','many'
]);

function analyzeWordFrequency(includeStopWords) {
    const book = getActiveBook();
    if (!book) return { total: 0, unique: 0, top: [] };
    const counts = {};
    let total = 0;
    book.chapters.forEach(ch => {
        const html = (ch.pages || []).map(p => p.content || '').join(' ');
        const text = html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, ' ').replace(/[^a-zA-Z']/g, ' ').toLowerCase();
        const words = text.split(/\s+/).filter(w => w.length > 1);
        words.forEach(w => {
            if (includeStopWords || !STOP_WORDS.has(w)) {
                counts[w] = (counts[w] || 0) + 1;
                total++;
            }
        });
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return {
        total: total,
        unique: Object.keys(counts).length,
        top: sorted.slice(0, 25)
    };
}

function renderWordFrequency() {
    const includeStop = $('freqIncludeStop') && $('freqIncludeStop').checked;
    const analysis = analyzeWordFrequency(includeStop);
    if (analysis.total === 0) {
        return '<div class="search-empty">No words to analyze yet. Start writing!</div>';
    }
    const maxCount = analysis.top[0] ? analysis.top[0][1] : 1;
    let html = `<div style="display:flex;justify-content:space-between;margin-bottom:12px;font-size:0.85rem;color:var(--text-muted);">
        <span><strong style="color:var(--accent-orange);">${analysis.unique.toLocaleString()}</strong> unique words</span>
        <label style="display:flex;align-items:center;gap:4px;cursor:pointer;">
            <input type="checkbox" id="freqIncludeStop" ${includeStop ? 'checked' : ''}> Include common words (the, a, and...)
        </label>
    </div>`;
    html += '<div class="freq-list">';
    analysis.top.forEach(([word, count], i) => {
        const pct = ((count / analysis.total) * 100).toFixed(1);
        const barWidth = (count / maxCount) * 100;
        const isOverused = count >= 10 && i < 5;
        html += `<div class="freq-item${isOverused ? ' overused' : ''}">
            <span class="freq-rank">${i + 1}</span>
            <span class="freq-word">${escapeHTML(word)}</span>
            <div class="freq-bar-wrap"><div class="freq-bar" style="width:${barWidth}%"></div></div>
            <span class="freq-count">${count}</span>
            <span class="freq-pct">${pct}%</span>
        </div>`;
    });
    html += '</div>';
    if (analysis.top.length >= 5 && analysis.top[4][1] >= 10) {
        html += '<div class="freq-warning">The top 5 words each appear 10+ times — consider varying your vocabulary.</div>';
    }
    return html;
}

document.addEventListener('DOMContentLoaded', () => {
    // Delegate clicks on the freqIncludeStop checkbox to re-render
    document.addEventListener('change', e => {
        if (e.target.id === 'freqIncludeStop') {
            const container = $('freqAnalysisContent');
            if (container) container.innerHTML = renderWordFrequency();
        }
    });
});
