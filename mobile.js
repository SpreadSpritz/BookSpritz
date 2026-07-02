// === BookSpritz: Mobile enhancements (swipe, backdrop, sidebar) ===

// --- Mobile enhancements ---
const isMobile = () => window.matchMedia('(max-width: 768px)').matches;
const sidebarEl = $('sidebar'), backdropEl = $('sidebarBackdrop');
function updateSidebarBackdrop() { if (isMobile() && !sidebarEl.classList.contains('collapsed')) backdropEl.classList.add('active'); else backdropEl.classList.remove('active'); }
new MutationObserver(updateSidebarBackdrop).observe(sidebarEl, { attributes: true, attributeFilter: ['class'] });
backdropEl.addEventListener('click', () => sidebarEl.classList.add('collapsed'));
// Close sidebar when opening any modal or find panel (mobile)
['historyModal','reviewModal','customModal'].forEach(id => { const m = $(id); if (m) new MutationObserver(() => { if (!m.classList.contains('hidden') && isMobile()) sidebarEl.classList.add('collapsed'); }).observe(m, { attributes: true, attributeFilter: ['class'] }); });
// Swipe to open (from left edge) / close (leftward swipe on sidebar) on mobile
let swipeStartX = null, swipeStartY = null, swipeTracking = false;
document.addEventListener('touchstart', e => {
    if (!isMobile()) return;
    const t = e.touches[0], collapsed = sidebarEl.classList.contains('collapsed');
    if (collapsed && t.clientX < 25) { swipeStartX = t.clientX; swipeStartY = t.clientY; swipeTracking = true; }
    else if (!collapsed && t.clientX < 320) { swipeStartX = t.clientX; swipeStartY = t.clientY; swipeTracking = true; }
}, { passive: true });
document.addEventListener('touchmove', e => {
    if (!swipeTracking) return;
    const t = e.touches[0], dx = t.clientX - swipeStartX, dy = t.clientY - swipeStartY;
    if (Math.abs(dx) > Math.abs(dy) * 1.5 && Math.abs(dx) > 40) {
        if (dx > 0 && sidebarEl.classList.contains('collapsed')) sidebarEl.classList.remove('collapsed');
        else if (dx < 0 && !sidebarEl.classList.contains('collapsed')) sidebarEl.classList.add('collapsed');
        swipeTracking = false;
    }
}, { passive: true });
document.addEventListener('touchend', () => { swipeTracking = false; }, { passive: true });
// Resize: auto-collapse sidebar when shrinking to mobile, auto-show when growing to desktop
window.addEventListener('resize', () => {
    if (isMobile()) { if (!sidebarEl.classList.contains('collapsed')) updateSidebarBackdrop(); }
    else { sidebarEl.classList.remove('collapsed'); backdropEl.classList.remove('active'); }
});
updateSidebarBackdrop();
