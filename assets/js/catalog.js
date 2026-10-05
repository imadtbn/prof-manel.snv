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
            card.href = base + (res.permalink || ('resources/items/' + res.slug + '.html'));
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
                    <div class="catalog-status ${res.availability !== 'available' ? 'is-draft' : ''}">
                        <i class="fas ${res.availability !== 'available' ? 'fa-clock' : 'fa-circle-check'}"></i>
                        ${res.availability !== 'available' ? 'الملف قيد الاعتماد' : 'متاح'}
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
        const term = $('termFilter')?.value || '';
        const unit = $('unitFilter')?.value || '';
        const correction = $('correctionFilter')?.value || '';

        filtered = resources.filter(r => {
            const matchYear = !fixedYear || r.year === fixedYear;
            const matchStream = !stream || r.stream === stream;
            const matchType = !type || r.type === type;
            const matchTerm = !term || String(r.term || '') === term;
            const matchUnit = !unit || r.unit === unit;
            const matchCorrection = !correction || r.correctionStatus === correction;
            const haystack = [r.title, r.desc, r.stream, r.type, r.unit, r.academicYear].filter(Boolean).join(' ').toLowerCase();
            return matchYear && matchStream && matchType && matchTerm && matchUnit && matchCorrection && (!q || haystack.includes(q));
        });

        render(filtered);
        updateStats(filtered);
    }

    function fillDynamicOptions(data) {
        const unitSelect = $('unitFilter');
        if (unitSelect) {
            const units = [...new Set(data.map(r => r.unit).filter(Boolean))].sort((a,b) => a.localeCompare(b,'ar'));
            unitSelect.innerHTML = '<option value="">كل الوحدات</option>' + units.map(u => `<option value="${u}">${u}</option>`).join('');
        }
    }

    function fillStreamOptions(data) {
        const select = $('streamFilter');
        if (!select) return;
        const current = select.value;
        const streams = [...new Set(data.map(r => r.stream).filter(Boolean))].sort((a,b) => a.localeCompare(b,'ar'));
        select.innerHTML = '<option value="">كل الشعب</option>' + streams.map(s => `<option value="${s}">${s}</option>`).join('');
        if (streams.includes(current)) select.value = current;
    }

    function injectCatalogStructuredData(scoped) {
        const canonical = document.querySelector('link[rel="canonical"]')?.href || location.href;
        const isYear = Boolean(fixedYear);
        const breadcrumb = {
            '@context':'https://schema.org',
            '@type':'BreadcrumbList',
            itemListElement:[
                {'@type':'ListItem',position:1,name:'الرئيسية',item:'https://imadtbn.github.io/prof-manel.snv/'},
                {'@type':'ListItem',position:2,name:isYear ? 'الموارد التعليمية' : 'كل الموارد',item:isYear ? 'https://imadtbn.github.io/prof-manel.snv/resources/' : canonical}
            ]
        };
        const itemList = {
            '@context':'https://schema.org',
            '@type':'ItemList',
            name: document.title,
            numberOfItems: scoped.length,
            itemListElement: scoped.map((r,i)=>({
                '@type':'ListItem',
                position:i+1,
                url:new URL(base + r.permalink, location.href).href,
                name:r.title
            }))
        };
        [breadcrumb,itemList].forEach(data=>{
            const node=document.createElement('script');
            node.type='application/ld+json';
            node.textContent=JSON.stringify(data);
            document.head.appendChild(node);
        });
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
            fillDynamicOptions(scoped);
            filter();
        } catch (error) {
            console.error('تعذر تحميل الموارد:', error);
            const grid = $('catalogGrid');
            if (grid) grid.innerHTML = '<div class="catalog-empty"><i class="fas fa-triangle-exclamation"></i><strong>تعذر تحميل قاعدة الموارد</strong><p>أعد المحاولة لاحقًا.</p></div>';
        }

        const initialQuery = new URLSearchParams(location.search).get('q');
        if (initialQuery && $('catalogSearch')) $('catalogSearch').value = initialQuery;
        filter();

        injectCatalogStructuredData(scoped);

        $('catalogSearch')?.addEventListener('input', filter);
        $('streamFilter')?.addEventListener('change', filter);
        $('typeFilter')?.addEventListener('change', filter);
        $('termFilter')?.addEventListener('change', filter);
        $('unitFilter')?.addEventListener('change', filter);
        $('correctionFilter')?.addEventListener('change', filter);

        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && $('mobileMenu')?.classList.contains('active')) window.toggleCatalogMenu();
        });
    }

    async function initResourceDetail() {
        initTheme();
        const id = new URLSearchParams(location.search).get('id');
        if (!id) return;
        try {
            const response = await fetch(base + 'assets/data/resources.json', { cache: 'no-cache' });
            const payload = await response.json();
            const list = Array.isArray(payload) ? payload : (payload.resources || []);
            const resource = list.find(r => String(r.id) === String(id));
            if (resource?.slug) {
                location.replace(base + 'resources/items/' + resource.slug + '.html');
                return;
            }
        } catch (_) {}
        const container = $('resourceDetail');
        if (container) container.innerHTML = '<div class="catalog-empty"><strong>تعذر العثور على المورد</strong></div>';
    }

    if ($('catalogGrid')) {
        document.addEventListener('DOMContentLoaded', initCatalog, { once: true });
    } else if ($('resourceDetail')) {
        document.addEventListener('DOMContentLoaded', initResourceDetail, { once: true });
    } else {
        document.addEventListener('DOMContentLoaded', initTheme, { once: true });
    }
})();
// PWA bootstrap
(() => { const s=document.createElement('script'); s.src=base + 'assets/js/pwa.js'; s.defer=true; document.head.appendChild(s); })();
