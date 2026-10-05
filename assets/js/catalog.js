(() => {
    'use strict';

    const root = document.documentElement;
    const body = document.body;
    const base = body.dataset.base || '../';
    const fixedYear = body.dataset.year || '';
    let resources = [];
    let filtered = [];

    const $ = id => document.getElementById(id);
    const format = value => new Intl.NumberFormat('ar-DZ').format(value);

    function applyTheme(theme, persist = true) {
        const normalized = theme === 'light' ? 'light' : 'dark';
        root.dataset.theme = normalized;
        root.style.colorScheme = normalized;
        const icon = $('themeIcon');
        if (icon) icon.className = normalized === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
        if (persist) {
            try { localStorage.setItem('snv-theme', normalized); } catch (_) {}
        }
    }

    function initTheme() {
        let saved = 'dark';
        try { saved = localStorage.getItem('snv-theme') || 'dark'; } catch (_) {}
        applyTheme(saved, false);
    }

    window.toggleCatalogTheme = () => {
        applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark');
    };

    window.toggleCatalogMenu = () => {
        const menu = $('mobileMenu');
        const overlay = $('mobileOverlay');
        const trigger = document.querySelector('.menu-toggle');
        if (!menu || !overlay) return;
        const open = menu.classList.toggle('active');
        overlay.classList.toggle('active', open);
        menu.setAttribute('aria-hidden', String(!open));
        if (trigger) trigger.setAttribute('aria-expanded', String(open));
        document.body.style.overflow = open ? 'hidden' : '';
    };

    function typeClass(type) {
        return ({'فرض':'card-type-frd','اختبار':'card-type-ekht','تمارين':'card-type-tam','درس':'card-type-drs'})[type] || 'card-type-frd';
    }

    function typeIcon(type) {
        return ({'فرض':'fa-file-alt','اختبار':'fa-clipboard-check','تمارين':'fa-pen-fancy','درس':'fa-book-open'})[type] || 'fa-file';
    }

    function updateStats(data) {
        const streams = new Set(data.map(r => r.stream).filter(Boolean));
        const types = new Set(data.map(r => r.type).filter(Boolean));
        if ($('statResources')) $('statResources').textContent = format(data.length);
        if ($('statStreams')) $('statStreams').textContent = format(streams.size);
        if ($('statTypes')) $('statTypes').textContent = format(types.size);
    }

    function render(data) {
        const grid = $('catalogGrid');
        if (!grid) return;
        grid.innerHTML = '';

        if (!data.length) {
            grid.innerHTML = '<div class="catalog-empty"><i class="fas fa-folder-open"></i><strong>لا توجد موارد مطابقة حاليًا</strong><p>سيتم تحديث هذه الصفحة تلقائيًا عند إضافة الموارد إلى قاعدة البيانات.</p></div>';
            return;
        }

        const fragment = document.createDocumentFragment();
        data.forEach(res => {
            const card = document.createElement('a');
            card.className = 'resource-card';
            card.href = base + 'resources/resource.html?id=' + encodeURIComponent(res.id);
            card.innerHTML = `
                <div class="card-top-bar"></div>
                <div class="card-body">
                    <div class="card-header">
                        <span class="card-type ${typeClass(res.type)}"><i class="fas ${typeIcon(res.type)}"></i> ${res.type}</span>
                        <span class="card-date">${res.date || ''}</span>
                    </div>
                    <h2 class="card-title">${res.title}</h2>
                    <p class="card-desc">${res.desc || ''}</p>
                    <div class="card-meta">
                        <span><i class="fas fa-file-alt"></i> ${res.pages || 0} صفحة</span>
                        <span><i class="fas fa-layer-group"></i> ${res.stream || ''}</span>
                    </div>
                    <div class="catalog-status ${res.status === 'draft' ? 'is-draft' : ''}">
                        <i class="fas ${res.status === 'draft' ? 'fa-clock' : 'fa-circle-check'}"></i>
                        ${res.status === 'draft' ? 'المورد قيد الإضافة' : 'متاح'}
                    </div>
                </div>`;
            fragment.appendChild(card);
        });
        grid.appendChild(fragment);
    }

    function filter() {
        const q = ($('catalogSearch')?.value || '').trim().toLowerCase();
        const stream = $('streamFilter')?.value || '';
        const type = $('typeFilter')?.value || '';

        filtered = resources.filter(r => {
            const matchYear = !fixedYear || r.year === fixedYear;
            const matchStream = !stream || r.stream === stream;
            const matchType = !type || r.type === type;
            const haystack = [r.title, r.desc, r.stream, r.type].filter(Boolean).join(' ').toLowerCase();
            return matchYear && matchStream && matchType && (!q || haystack.includes(q));
        });

        render(filtered);
        updateStats(filtered);
    }

    function fillStreamOptions(data) {
        const select = $('streamFilter');
        if (!select) return;
        const current = select.value;
        const streams = [...new Set(data.map(r => r.stream).filter(Boolean))].sort((a,b) => a.localeCompare(b,'ar'));
        select.innerHTML = '<option value="">كل الشعب</option>' + streams.map(s => `<option value="${s}">${s}</option>`).join('');
        if (streams.includes(current)) select.value = current;
    }

    async function initCatalog() {
        initTheme();

        try {
            const response = await fetch(base + 'assets/data/resources.json', { cache: 'no-cache' });
            if (!response.ok) throw new Error('HTTP ' + response.status);
            const payload = await response.json();
            resources = Array.isArray(payload) ? payload : (payload.resources || []);
            const scoped = fixedYear ? resources.filter(r => r.year === fixedYear) : resources;
            fillStreamOptions(scoped);
            filter();
        } catch (error) {
            console.error('تعذر تحميل الموارد:', error);
            const grid = $('catalogGrid');
            if (grid) grid.innerHTML = '<div class="catalog-empty"><i class="fas fa-triangle-exclamation"></i><strong>تعذر تحميل قاعدة الموارد</strong><p>أعد المحاولة لاحقًا.</p></div>';
        }

        $('catalogSearch')?.addEventListener('input', filter);
        $('streamFilter')?.addEventListener('change', filter);
        $('typeFilter')?.addEventListener('change', filter);

        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && $('mobileMenu')?.classList.contains('active')) window.toggleCatalogMenu();
        });
    }

    async function initResourceDetail() {
        initTheme();
        const container = $('resourceDetail');
        if (!container) return;
        const id = new URLSearchParams(location.search).get('id');

        try {
            const response = await fetch(base + 'assets/data/resources.json', { cache: 'no-cache' });
            const payload = await response.json();
            const list = Array.isArray(payload) ? payload : (payload.resources || []);
            const resource = list.find(r => String(r.id) === String(id));
            if (!resource) {
                container.innerHTML = '<div class="catalog-empty"><i class="fas fa-circle-question"></i><strong>المورد غير موجود</strong><p>قد يكون الرابط قديمًا أو لم يعد المورد متاحًا.</p></div>';
                return;
            }

            document.title = resource.title + ' | علوم الطبيعة';
            const title = $('resourceTitle');
            if (title) title.textContent = resource.title;
            container.innerHTML = `
                <article class="resource-detail-card">
                    <span class="card-type ${typeClass(resource.type)}"><i class="fas ${typeIcon(resource.type)}"></i> ${resource.type}</span>
                    <h2 style="margin-top:16px">${resource.title}</h2>
                    <p style="color:var(--text-secondary);margin-top:10px">${resource.desc || ''}</p>
                    <div class="resource-detail-meta">
                        <span>السنة ${resource.year}</span>
                        <span>${resource.stream}</span>
                        <span>${resource.pages || 0} صفحة</span>
                        <span>${resource.size || ''}</span>
                    </div>
                    ${resource.download
                        ? `<a class="btn-primary" href="${resource.download}" target="_blank" rel="noopener noreferrer"><i class="fas fa-download"></i> تحميل الملف</a>`
                        : '<div class="catalog-status is-draft"><i class="fas fa-clock"></i> الملف قيد الإضافة وسيظهر رابط التحميل تلقائيًا بعد اعتماده.</div>'}
                </article>`;
        } catch (error) {
            container.innerHTML = '<div class="catalog-empty"><i class="fas fa-triangle-exclamation"></i><strong>تعذر تحميل المورد</strong></div>';
        }
    }

    if ($('catalogGrid')) {
        document.addEventListener('DOMContentLoaded', initCatalog, { once: true });
    } else if ($('resourceDetail')) {
        document.addEventListener('DOMContentLoaded', initResourceDetail, { once: true });
    } else {
        document.addEventListener('DOMContentLoaded', initTheme, { once: true });
    }
})();