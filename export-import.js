// === BookSpritz: Export & Import ===

// --- Export ---
function htmlToMarkdown(html) {
    let md = html;
    md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '\n# $1\n');
    md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n## $1\n');
    md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\n### $1\n');
    md = md.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
    md = md.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
    md = md.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
    md = md.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');
    md = md.replace(/<u[^>]*>(.*?)<\/u>/gi, '$1');
    md = md.replace(/<br\s*\/?>/gi, '\n');
    md = md.replace(/<\/p>/gi, '\n\n');
    md = md.replace(/<p[^>]*>/gi, '');
    md = md.replace(/<span[^>]*>(.*?)<\/span>/gi, '$1');
    md = md.replace(/<div[^>]*>/gi, '').replace(/<\/div>/gi, '\n');
    md = md.replace(/<[^>]+>/g, '');
    md = md.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    md = md.replace(/\n{3,}/g, '\n\n').trim();
    return md;
}
function htmlToPlain(html) {
    let t = html.replace(/<br\s*\/?>/gi, '\n');
    t = t.replace(/<\/p>/gi, '\n\n').replace(/<p[^>]*>/gi, '');
    t = t.replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, '\n$1\n\n');
    t = t.replace(/<[^>]+>/g, '');
    t = t.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    t = t.replace(/\n{3,}/g, '\n\n').trim();
    return t;
}
function downloadFile(filename, content, mime) {
    const blob = new Blob([content], { type: mime || 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function exportBook(format) {
    const book = getActiveBook();
    const chapters = book ? book.chapters : [];
    let title = book ? book.title : 'My Book';
    if (format === 'print') {
        const w = window.open('', '_blank');
        if (!w) { CustomUI.alert('Pop-up blocked. Please allow pop-ups for BookSpritz to export PDF.'); return; }
        let body = '';
        chapters.forEach(ch => {
            const content = ch.pages.map(p => p.content || '').join('');
            body += `<h1>${escapeHTML(ch.title)}</h1>${content}<div style="page-break-after:always"></div>`;
        });
        w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${escapeHTML(title)}</title><style>body{font-family:Georgia,'Times New Roman',serif;max-width:700px;margin:40px auto;line-height:1.7;color:#222;font-size:14px}h1{page-break-before:always;border-bottom:2px solid #ccc;padding-bottom:8px}h1:first-child{page-break-before:avoid}@media print{body{margin:20mm}}</style></head><body>${body}</body></html>`);
        w.document.close();
        setTimeout(() => { try { w.focus(); w.print(); } catch(e){} }, 400);
        return;
    }
    let content, ext, mime;
    if (format === 'markdown') {
        content = `# ${title}\n\n` + chapters.map(ch => {
            const html = ch.pages.map(p => p.content || '').join(' ');
            return `## ${ch.title}\n\n${htmlToMarkdown(html)}`;
        }).join('\n\n---\n\n');
        ext = 'md'; mime = 'text/markdown;charset=utf-8';
    } else if (format === 'txt') {
        content = title.toUpperCase() + '\n' + '='.repeat(Math.max(3, title.length)) + '\n\n' + chapters.map(ch => {
            const html = ch.pages.map(p => p.content || '').join(' ');
            return ch.title.toUpperCase() + '\n' + '-'.repeat(Math.max(3, ch.title.length)) + '\n\n' + htmlToPlain(html);
        }).join('\n\n');
        ext = 'txt'; mime = 'text/plain;charset=utf-8';
    } else if (format === 'html') {
        content = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${escapeHTML(title)}</title><style>body{font-family:Georgia,'Times New Roman',serif;max-width:700px;margin:40px auto;line-height:1.7;color:#222;padding:20px}h1{color:#D9946B;border-bottom:2px solid #E2DCCF;padding-bottom:8px}h2{color:#D9946B;margin-top:40px}</style></head><body><h1>${escapeHTML(title)}</h1>` + chapters.map(ch => {
            const html = ch.pages.map(p => p.content || '').join('');
            return `<h2>${escapeHTML(ch.title)}</h2>${html}`;
        }).join('') + `</body></html>`;
        ext = 'html'; mime = 'text/html;charset=utf-8';
    } else return;
    const safeTitle = title.replace(/[^a-zA-Z0-9-_ ]/g, '').trim().replace(/\s+/g, '_') || 'My_Book';
    downloadFile(safeTitle + '.' + ext, content, mime);
    CustomUI.alert(`Exported as ${ext.toUpperCase()}! Check your downloads folder.`, 'Export Complete');
}
