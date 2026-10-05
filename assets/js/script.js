// ════════════════════════════════════════
// CONFIGURATION
// ════════════════════════════════════════
const CONFIG = {
    itemsPerPage: 9,
    cloudBaseUrl: 'https://drive.google.com/file/d/',
    currentPage: 1,
    isDarkMode: true,
};

// ════════════════════════════════════════
// RESOURCE DATA
// ════════════════════════════════════════
let resources = [];
let filteredResources = [];

async function loadResources() {
    const loadingState = document.getElementById('loadingState');
    if (loadingState) loadingState.style.display = 'grid';
    try {
        const response = await fetch('assets/data/resources.json', { cache: 'no-cache' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = await response.json();
        resources = Array.isArray(payload) ? payload : (payload.resources || []);
        filteredResources = [...resources];
    } catch (error) {
        console.error('تعذر تحميل بيانات الموارد:', error);
        resources = [];
        filteredResources = [];
        showToast('تعذر تحميل الموارد حاليًا', 'fa-triangle-exclamation');
    } finally {
        if (loadingState) loadingState.style.display = 'none';
    }
}

let currentPreviewResource = null;

// ════════════════════════════════════════
// DYNAMIC RESOURCE STATISTICS
// ════════════════════════════════════════
function getResourceStats(data = resources) {
    const years = new Set(data.map(resource => resource.year).filter(Boolean));
    const streams = new Set(data.map(resource => resource.stream).filter(Boolean));
    const types = new Set(data.map(resource => resource.type).filter(Boolean));
    const pages = data.reduce((total, resource) => total + (Number(resource.pages) || 0), 0);

    return {
        resources: data.length,
        years: years.size,
        streams: streams.size,
        types: types.size,
        pages
    };
}

function formatStat(value) {
    return new Intl.NumberFormat('ar-DZ').format(value);
}

function setStatText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = formatStat(value);
}

function updateDynamicStats() {
    const stats = getResourceStats();

    setStatText('heroYearCount', stats.years);
    setStatText('heroStreamCount', stats.streams);
    setStatText('heroResourceCount', stats.resources);
    setStatText('aboutResourceCount', stats.resources);
    setStatText('aboutTypeCount', stats.types);
    setStatText('aboutPageCount', stats.pages);
    setStatText('aboutStreamCount', stats.streams);

    const resourceCount = document.getElementById('resourceCount');
    if (resourceCount) resourceCount.textContent = `${formatStat(stats.resources)} مورد متاح`;

    document.querySelectorAll('[data-year-card]').forEach(card => {
        const year = card.dataset.yearCard;
        const yearStats = getResourceStats(resources.filter(resource => resource.year === year));
        const totalElement = card.querySelector('[data-year-total]');
        const typesElement = card.querySelector('[data-year-types]');
        const streamsElement = card.querySelector('[data-year-streams]');

        if (totalElement) totalElement.textContent = `${formatStat(yearStats.resources)} مورد`;
        if (typesElement) typesElement.textContent = `${formatStat(yearStats.types)} أنواع`;
        if (streamsElement) streamsElement.textContent = `${formatStat(yearStats.streams)} شعب`;
    });
}


// ════════════════════════════════════════
// STAR FIELD CANVAS
// ════════════════════════════════════════
function createStarField() {
    const canvas = document.getElementById('starCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let width = 0;
    let height = 0;
    let stars = [];
    let animationId = null;
    let isVisible = !document.hidden;

    const getStarCount = () => reducedMotion ? 0 : (window.innerWidth <= 768 ? 36 : window.innerWidth <= 1200 ? 60 : 84);
    const shouldConnectStars = () => window.innerWidth > 768 && !reducedMotion;

    class Star {
        constructor() { this.reset(); }
        reset() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.size = Math.random() * 1.6 + 0.4;
            this.speed = Math.random() * 0.25 + 0.05;
            this.brightness = Math.random() * 0.4 + 0.35;
        }
        update() { this.y += this.speed; if (this.y > height) this.reset(); }
        draw() {
            ctx.fillStyle = '#f5e8c7';
            ctx.globalAlpha = this.brightness;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function initStars() { stars = Array.from({ length: getStarCount() }, () => new Star()); }

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
        canvas.width = Math.floor(width * ratio);
        canvas.height = Math.floor(height * ratio);
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        initStars();
    }

    function connectStars() {
        if (!shouldConnectStars()) return;
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < stars.length; i++) {
            for (let j = i + 1; j < stars.length; j++) {
                const dx = stars[i].x - stars[j].x;
                const dy = stars[i].y - stars[j].y;
                const distanceSquared = dx * dx + dy * dy;
                if (distanceSquared < 10000) {
                    ctx.globalAlpha = (10000 - distanceSquared) / 10000 * 0.08;
                    ctx.beginPath();
                    ctx.moveTo(stars[i].x, stars[i].y);
                    ctx.lineTo(stars[j].x, stars[j].y);
                    ctx.stroke();
                }
            }
        }
        ctx.globalAlpha = 1;
    }

    function animate() {
        if (!isVisible || reducedMotion) { animationId = null; return; }
        ctx.clearRect(0, 0, width, height);
        stars.forEach(star => { star.update(); star.draw(); });
        connectStars();
        animationId = requestAnimationFrame(animate);
    }

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(resize, 150);
    }, { passive: true });

    document.addEventListener('visibilitychange', () => {
        isVisible = !document.hidden;
        if (isVisible && !animationId && !reducedMotion) animate();
        if (!isVisible && animationId) { cancelAnimationFrame(animationId); animationId = null; }
    });

    resize();
    if (!reducedMotion) animate();
}

// ════════════════════════════════════════
// HOLOGRAPHIC CELLS
// ════════════════════════════════════════
function createHoloCells() {
    const container = document.getElementById('holoCellContainer');
    if (!container || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const cellCount = window.innerWidth <= 768 ? 2 : 5;

    for (let i = 0; i < cellCount; i++) {
        const cell = document.createElement('div');
        cell.className = 'holo-cell';
        const size = Math.random() * 60 + 40;
        cell.style.width = size + 'px';
        cell.style.height = size + 'px';
        cell.style.left = Math.random() * 100 + '%';
        cell.style.animationDuration = (Math.random() * 20 + 15) + 's';
        cell.style.animationDelay = (Math.random() * 15) + 's';

        const nucleus = document.createElement('div');
        nucleus.className = 'nucleus';
        cell.appendChild(nucleus);

        const organelleCount = Math.floor(Math.random() * 3) + 2;
        for (let j = 0; j < organelleCount; j++) {
            const organelle = document.createElement('div');
            organelle.className = 'organelle';
            const oSize = Math.random() * 8 + 4;
            organelle.style.width = oSize + 'px';
            organelle.style.height = oSize + 'px';
            organelle.style.top = Math.random() * 60 + 20 + '%';
            organelle.style.left = Math.random() * 60 + 20 + '%';
            organelle.style.animationDuration = (Math.random() * 4 + 3) + 's';
            organelle.style.animationDelay = (Math.random() * 2) + 's';
            cell.appendChild(organelle);
        }

        container.appendChild(cell);
    }
}

// ════════════════════════════════════════
// MOBILE MENU
// ════════════════════════════════════════
function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    const overlay = document.getElementById('mobileOverlay');
    const toggle = document.querySelector('.menu-toggle');
    if (!menu || !overlay) return;

    const isOpen = menu.classList.toggle('active');
    overlay.classList.toggle('active', isOpen);
    menu.setAttribute('aria-hidden', String(!isOpen));
    if (toggle) toggle.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
}

// ════════════════════════════════════════
// HEADER SCROLL EFFECT
// ════════════════════════════════════════
function initHeaderScroll() {
    const header = document.getElementById('mainHeader');
    if (!header) return;

    let ticking = false;
    const update = () => {
        header.classList.toggle('is-scrolled', window.scrollY > 64);
        ticking = false;
    };

    update();
    window.addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(update);
    }, { passive: true });
}

// ════════════════════════════════════════
// THEME TOGGLE
// ════════════════════════════════════════
function applyTheme(theme, persist = true) {
    const normalized = theme === 'light' ? 'light' : 'dark';
    CONFIG.isDarkMode = normalized === 'dark';
    document.documentElement.dataset.theme = normalized;
    document.documentElement.style.colorScheme = normalized;
    const icon = document.getElementById('themeIcon');
    if (icon) icon.className = CONFIG.isDarkMode ? 'fas fa-moon' : 'fas fa-sun';
    if (persist) {
        try { localStorage.setItem('snv-theme', normalized); } catch (_) {}
    }
}

function initTheme() {
    let saved = null;
    try { saved = localStorage.getItem('snv-theme'); } catch (_) {}
    applyTheme(saved === 'light' ? 'light' : 'dark', false);
}

function toggleDarkMode() {
    const nextTheme = CONFIG.isDarkMode ? 'light' : 'dark';
    applyTheme(nextTheme);
    showToast(nextTheme === 'dark' ? 'تم تفعيل الوضع الليلي' : 'تم تفعيل الوضع النهاري', nextTheme === 'dark' ? 'fa-moon' : 'fa-sun');
}

// ════════════════════════════════════════
// RESOURCE RENDERING
// ════════════════════════════════════════
function getTypeClass(type) {
    const classes = {
        'فرض': 'card-type-frd',
        'اختبار': 'card-type-ekht',
        'تمارين': 'card-type-tam',
        'درس': 'card-type-drs'
    };
    return classes[type] || 'card-type-frd';
}

function getTypeIcon(type) {
    const icons = {
        'فرض': 'fa-file-alt',
        'اختبار': 'fa-clipboard-check',
        'تمارين': 'fa-pen-fancy',
        'درس': 'fa-book-open'
    };
    return icons[type] || 'fa-file';
}

function renderResources(data, page) {
    const grid = document.getElementById('resourcesGrid');
    const pagination = document.getElementById('pagination');
    if (!grid) return;

    grid.innerHTML = '';

    const start = (page - 1) * CONFIG.itemsPerPage;
    const end = start + CONFIG.itemsPerPage;
    const pageData = data.slice(start, end);
    const totalPages = Math.ceil(data.length / CONFIG.itemsPerPage);

    if (pageData.length === 0) {
        grid.innerHTML = `
            <div class="no-results">
                <div class="no-results-icon">🔍</div>
                <p class="no-results-text">لا توجد نتائج مطابقة</p>
                <button onclick="resetFilters()" class="btn-reset">إعادة ضبط الفلاتر</button>
            </div>
        `;
        if (pagination) pagination.innerHTML = '';
        return;
    }

    pageData.forEach((res, index) => {
        const card = document.createElement('article');
        card.className = 'resource-card';
        card.tabIndex = 0;
        card.setAttribute('aria-label', `${res.title} - سنة ${res.year} - ${res.stream}`);
        card.onclick = function() {
            if (res.permalink) window.location.href = res.permalink;
            else openPreview(res);
        };
        card.onkeydown = function(event) {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                if (res.permalink) window.location.href = res.permalink; else openPreview(res);
            }
        };

        card.innerHTML = `
            <div class="card-shine"></div>
            <div class="card-top-bar"></div>
            <div class="card-body">
                <div class="card-header">
                    <span class="card-type ${getTypeClass(res.type)}">
                        <i class="fas ${getTypeIcon(res.type)}"></i> ${res.type}
                    </span>
                    <span class="card-date">${res.date}</span>
                </div>
                <h3 class="card-title">${res.title}</h3>
                <p class="card-desc">${res.desc}</p>
                <div class="card-meta">
                    <span><i class="fas fa-file-alt"></i> ${res.pages} صفحة</span>
                    <span><i class="fas fa-weight-hanging"></i> ${res.size}</span>
                </div>
                <div class="card-footer">
                    <div class="card-info">
                        <span class="card-year">سنة ${res.year}</span>
                        <span class="card-sep">•</span>
                        <span class="card-stream">${res.stream}</span>
                    </div>
                    <div class="card-actions">
                        <button onclick="event.stopPropagation(); openPreviewById(${res.id})" class="card-btn card-btn-preview" title="معاينة" aria-label="معاينة ${res.title}">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${res.downloadUrl
                            ? `<a href="${res.downloadUrl}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()" class="card-btn card-btn-download" title="تحميل" aria-label="تحميل ${res.title}"><i class="fas fa-download"></i></a>`
                            : `<button type="button" class="card-btn card-btn-disabled" disabled title="الملف قيد الإضافة" aria-label="الملف قيد الإضافة"><i class="fas fa-clock"></i></button>`}
                    </div>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });

    // Pagination
    if (pagination) {
        if (totalPages > 1) {
            let html = '';
            for (let i = 1; i <= totalPages; i++) {
                html += `<button onclick="changePage(${i})" class="page-btn ${i === page ? 'active' : ''}">${i}</button>`;
            }
            pagination.innerHTML = html;
        } else {
            pagination.innerHTML = '';
        }
    }
}

function changePage(page) {
    CONFIG.currentPage = page;
    renderResources(filteredResources, page);
    const resourcesSection = document.getElementById('resources');
    if (resourcesSection) {
        resourcesSection.scrollIntoView({ behavior: 'smooth' });
    }
}

function openPreviewById(id) {
    const res = resources.find(r => r.id === id);
    if (res) openPreview(res);
}

// ════════════════════════════════════════
// FILTERING
// ════════════════════════════════════════
let filterTimeout;
function debounceFilter() {
    clearTimeout(filterTimeout);
    filterTimeout = setTimeout(filterResources, 300);
}

function filterResources() {
    const yearVal = document.getElementById('yearFilter')?.value || '';
    const streamVal = document.getElementById('streamFilter')?.value.toLowerCase() || '';
    const typeVal = document.getElementById('typeFilter')?.value || '';
    const searchVal = document.getElementById('searchInput')?.value.trim().toLowerCase() || '';

    // Keep the shareable search state in the URL without forcing a reload.
    const url = new URL(window.location.href);
    if (searchVal) url.searchParams.set('q', searchVal);
    else url.searchParams.delete('q');
    window.history.replaceState({}, '', url);

    filteredResources = resources.filter(res => {
        const matchYear = !yearVal || res.year === yearVal;
        const matchStream = !streamVal || res.stream.toLowerCase().includes(streamVal);
        const matchType = !typeVal || res.type === typeVal;
        const matchSearch = !searchVal ||
            res.title.toLowerCase().includes(searchVal) ||
            res.desc.toLowerCase().includes(searchVal);
        return matchYear && matchStream && matchType && matchSearch;
    });

    CONFIG.currentPage = 1;
    renderResources(filteredResources, 1);
}

function resetFilters() {
    const yearFilter = document.getElementById('yearFilter');
    const streamFilter = document.getElementById('streamFilter');
    const typeFilter = document.getElementById('typeFilter');
    const searchInput = document.getElementById('searchInput');

    if (yearFilter) yearFilter.value = '';
    if (streamFilter) streamFilter.value = '';
    if (typeFilter) typeFilter.value = '';
    if (searchInput) searchInput.value = '';

    filterResources();
}

function selectYear(year) {
    const yearFilter = document.getElementById('yearFilter');
    if (yearFilter) yearFilter.value = year;
    filterResources();
    navigateToSection('resources');
}

// ════════════════════════════════════════
// NAVIGATION
// ════════════════════════════════════════
function navigateToSection(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }
}

// ════════════════════════════════════════
// PREVIEW MODAL
// ════════════════════════════════════════
function openPreview(res) {
    if (typeof res === 'string') {
        try { res = JSON.parse(res.replace(/&quot;/g, '"')); } catch(e) { return; }
    }
    currentPreviewResource = res;

    const modalTitle = document.getElementById('modalTitle');
    const modalMeta = document.getElementById('modalMeta');
    const previewDocTitle = document.getElementById('previewDocTitle');
    const modalDownload = document.getElementById('modalDownload');

    if (modalTitle) modalTitle.textContent = res.title;
    if (modalMeta) modalMeta.textContent = `سنة ${res.year} • ${res.stream} • ${res.type} • ${res.pages} صفحة`;
    if (previewDocTitle) previewDocTitle.textContent = res.title;
    if (modalDownload) {
        if (res.downloadUrl) {
            modalDownload.href = res.downloadUrl;
            modalDownload.removeAttribute('aria-disabled');
            modalDownload.classList.remove('is-disabled');
        } else {
            modalDownload.removeAttribute('href');
            modalDownload.setAttribute('aria-disabled', 'true');
            modalDownload.classList.add('is-disabled');
        }
    }

    const modal = document.getElementById('previewModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closePreviewModal(event) {
    if (!event || event.target.id === 'previewModal' || event.target.closest('.modal-close')) {
        const modal = document.getElementById('previewModal');
        if (modal) modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function printResource() {
    if (currentPreviewResource) {
        showToast('جاري فتح نافذة الطباعة...', 'fa-print');
        setTimeout(() => {
            window.print();
        }, 500);
    }
}

function shareResource() {
    if (!currentPreviewResource) return;
    const shareUrl = currentPreviewResource.permalink
        ? new URL(currentPreviewResource.permalink, window.location.href).href
        : (currentPreviewResource.downloadUrl || window.location.href);

    if (navigator.share) {
        navigator.share({
            title: currentPreviewResource.title,
            text: currentPreviewResource.desc,
            url: shareUrl
        });
    } else if (navigator.clipboard) {
        navigator.clipboard.writeText(shareUrl).then(() => {
            showToast('تم نسخ الرابط!', 'fa-link');
        });
    }
}

// ════════════════════════════════════════
// PAGE MODAL (Privacy, Contact, About)
// ════════════════════════════════════════
const pageContents = {
    'privacy': {
        title: 'سياسة الخصوصية',
        content: `
            <div style="display:flex;flex-direction:column;gap:24px;">
                <div>
                    <h4 style="color:var(--gold);font-size:18px;font-weight:700;margin-bottom:12px;">1. مقدمة</h4>
                    <p style="color:var(--text-secondary);">نحن نولي أهمية كبيرة لخصوصية مستخدمي موقع علوم الطبيعة. تهدف هذه السياسة إلى توضيح كيفية جمع واستخدام وحماية بياناتك الشخصية.</p>
                </div>
                <div>
                    <h4 style="color:var(--gold);font-size:18px;font-weight:700;margin-bottom:12px;">2. البيانات التي نجمعها</h4>
                    <ul style="color:var(--text-secondary);padding-right:20px;display:flex;flex-direction:column;gap:8px;">
                        <li>معلومات التصفح (عنوان IP، نوع المتصفح، الصفحات المزورة)</li>
                        <li>بيانات Google Analytics لتحسين الأداء</li>
                        <li>ملفات تعريف الارتباط (Cookies) لتخصيص التجربة</li>
                    </ul>
                </div>
                <div>
                    <h4 style="color:var(--gold);font-size:18px;font-weight:700;margin-bottom:12px;">3. استخدام البيانات</h4>
                    <p style="color:var(--text-secondary);">نستخدم بياناتك فقط لتحسين تجربة المستخدم وتقديم محتوى ملائم. لا نشارك بياناتك مع أطراف ثالثة إلا بموافقتك.</p>
                </div>
                <div>
                    <h4 style="color:var(--gold);font-size:18px;font-weight:700;margin-bottom:12px;">4. ملفات تعريف الارتباط</h4>
                    <p style="color:var(--text-secondary);">يستخدم الموقع ملفات تعريف الارتباط لتحسين الأداء وتذكر تفضيلاتك. يمكنك تعطيلها من إعدادات المتصفح.</p>
                </div>
                <div>
                    <h4 style="color:var(--gold);font-size:18px;font-weight:700;margin-bottom:12px;">5. حقوقك</h4>
                    <p style="color:var(--text-secondary);">لديك الحق في الوصول إلى بياناتك وتصحيحها أو حذفها. للاستفسارات، تواصل معنا عبر صفحة "اتصل بنا".</p>
                </div>
                <p style="color:var(--text-muted);font-size:13px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.1);">آخر تحديث: يونيو ٢٠٢٦</p>
            </div>
        `
    },
    'terms': {
        title: 'شروط الاستخدام',
        content: `
            <div style="display:flex;flex-direction:column;gap:24px;">
                <div>
                    <h4 style="color:var(--gold);font-size:18px;font-weight:700;margin-bottom:12px;">1. قبول الشروط</h4>
                    <p style="color:var(--text-secondary);">باستخدامك لموقع علوم الطبيعة، فإنك توافق على هذه الشروط والأحكام. إذا كنت لا توافق، يرجى عدم استخدام الموقع.</p>
                </div>
                <div>
                    <h4 style="color:var(--gold);font-size:18px;font-weight:700;margin-bottom:12px;">2. الاستخدام المسموح</h4>
                    <ul style="color:var(--text-secondary);padding-right:20px;display:flex;flex-direction:column;gap:8px;">
                        <li>الموقع مخصص للاستخدام الشخصي والتعليمي فقط</li>
                        <li>يحظر إعادة نشر المحتوى دون إذن كتابي</li>
                        <li>يحظر استخدام الموقع لأغراض تجارية</li>
                    </ul>
                </div>
                <div>
                    <h4 style="color:var(--gold);font-size:18px;font-weight:700;margin-bottom:12px;">3. الملكية الفكرية</h4>
                    <p style="color:var(--text-secondary);">جميع المحتويات والمواد المنشورة على الموقع محمية بموجب قوانين الملكية الفكرية. الأستاذة بوسنة منال تحتفظ بجميع الحقوق.</p>
                </div>
                <div>
                    <h4 style="color:var(--gold);font-size:18px;font-weight:700;margin-bottom:12px;">4. إخلاء المسؤولية</h4>
                    <p style="color:var(--text-secondary);">المحتوى التعليمي مقدم كمساعدة دراسية ولا يغني عن المتابعة مع الأساتذة. نحن غير مسؤولين عن أي استخدام خاطئ للمواد.</p>
                </div>
                <p style="color:var(--text-muted);font-size:13px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.1);">آخر تحديث: يونيو ٢٠٢٦</p>
            </div>
        `
    },
    'about-page': {
        title: 'من نحن',
        content: `
            <div style="display:flex;flex-direction:column;gap:24px;">
                <div style="text-align:center;margin-bottom:16px;">
                    <div style="width:80px;height:80px;background:linear-gradient(135deg,var(--gold),var(--parchment));border-radius:24px;display:flex;align-items:center;justify-content:center;font-size:40px;margin:0 auto 16px;">🔬</div>
                    <h3 style="font-size:24px;font-weight:700;color:var(--gold);margin-bottom:8px;">علوم الطبيعة</h3>
                    <p style="color:var(--text-secondary);">منصة تعليمية جزائرية متخصصة</p>
                </div>
                <div>
                    <h4 style="color:var(--gold);font-size:18px;font-weight:700;margin-bottom:12px;">رؤيتنا</h4>
                    <p style="color:var(--text-secondary);">نسعى لتقديم محتوى تعليمي عالي الجودة يساعد طلاب الثانوي على التفوق في مادة العلوم الطبيعية، من خلال نماذج فروض واختبارات مدروسة ومنظمة.</p>
                </div>
                <div style="background:var(--card-bg);border-radius:16px;padding:24px;">
                    <div style="display:flex;align-items:center;gap:16px;">
                        <div style="width:56px;height:56px;background:rgba(212,175,55,0.2);border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:28px;">👩‍🏫</div>
                        <div>
                            <div style="font-weight:700;">الأستاذة بوسنة منال</div>
                            <div style="color:var(--text-secondary);font-size:14px;">مؤسسة الموقع ومعدة المحتوى</div>
                        </div>
                    </div>
                </div>
                <div>
                    <h4 style="color:var(--gold);font-size:18px;font-weight:700;margin-bottom:12px;">إنجازاتنا</h4>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
                        <div style="background:var(--card-bg);border-radius:12px;padding:16px;text-align:center;">
                            <div id="modalResourceCount" style="font-size:24px;font-weight:700;color:var(--gold);">0</div>
                            <div style="color:var(--text-secondary);font-size:14px;">مورد فعلي</div>
                        </div>
                        <div style="background:var(--card-bg);border-radius:12px;padding:16px;text-align:center;">
                            <div id="modalPageCount" style="font-size:24px;font-weight:700;color:var(--emerald);">0</div>
                            <div style="color:var(--text-secondary);font-size:14px;">صفحة تعليمية</div>
                        </div>
                    </div>
                </div>
            </div>
        `
    },
    'contact': {
        title: 'اتصل بنا',
        content: `
            <div style="display:flex;flex-direction:column;gap:20px;">
                <div style="background:var(--card-bg);border-radius:16px;padding:24px;text-align:center;">
                    <div style="font-size:42px;margin-bottom:12px;">✉️</div>
                    <h4 style="color:var(--gold);font-size:18px;font-weight:700;margin-bottom:8px;">وسائل الاتصال الرسمية قيد الإعداد</h4>
                    <p style="color:var(--text-secondary);">لن نعرض بريدًا أو رقم هاتف غير متحقق منه. ستُضاف قنوات التواصل الرسمية هنا فور اعتمادها.</p>
                </div>
            </div>
        `
    }
};

function openPageModal(pageKey) {
    const page = pageContents[pageKey];
    if (!page) return;

    const titleEl = document.getElementById('pageModalTitle');
    const contentEl = document.getElementById('pageModalContent');
    const modal = document.getElementById('pageModal');

    if (titleEl) titleEl.textContent = page.title;
    if (contentEl) contentEl.innerHTML = page.content;
    updateDynamicStats();
    const modalResourceCount = document.getElementById('modalResourceCount');
    const modalPageCount = document.getElementById('modalPageCount');
    if (modalResourceCount) modalResourceCount.textContent = formatStat(getResourceStats().resources);
    if (modalPageCount) modalPageCount.textContent = formatStat(getResourceStats().pages);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closePageModal(event) {
    if (!event || event.target.id === 'pageModal' || event.target.closest('.modal-close')) {
        const modal = document.getElementById('pageModal');
        if (modal) modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// ════════════════════════════════════════
// TOAST NOTIFICATION
// ════════════════════════════════════════
function showToast(message, icon) {
    const toast = document.getElementById('toast');
    const toastIcon = document.getElementById('toastIcon');
    const toastMessage = document.getElementById('toastMessage');

    if (!toast || !toastIcon || !toastMessage) return;

    toastMessage.textContent = message;
    toastIcon.className = 'fas ' + (icon || 'fa-check-circle');
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ════════════════════════════════════════
// SMOOTH SCROLL (Native)
// ════════════════════════════════════════
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;

            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

// ════════════════════════════════════════
// ANIMATIONS ON SCROLL (Intersection Observer)
// ════════════════════════════════════════
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.year-card, .resource-card, .feature-box').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// Add animation class styles
const style = document.createElement('style');
style.textContent = `
    .animate-in {
        opacity: 1 !important;
        transform: translateY(0) !important;
    }
`;
document.head.appendChild(style);

// ════════════════════════════════════════
// KEYBOARD SHORTCUTS
// ════════════════════════════════════════
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closePreviewModal();
        closePageModal();
        const mobileMenu = document.getElementById('mobileMenu');
        if (mobileMenu && mobileMenu.classList.contains('active')) {
            toggleMobileMenu();
        }
    }
    if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.focus();
    }
});



// ════════════════════════════════════════
// INITIALIZE
// ════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async function() {
    initTheme();
    createStarField();
    createHoloCells();
    initHeaderScroll();
    initSmoothScroll();
    await loadResources();
    updateDynamicStats();

    const initialQuery = new URLSearchParams(window.location.search).get('q');
    const searchInput = document.getElementById('searchInput');
    if (initialQuery && searchInput) searchInput.value = initialQuery;

    filterResources();
    initScrollAnimations();

    console.log('%c🔬 موقع علوم الطبيعة جاهز!', 'color:#d4af37; font-size:14px; font-weight:bold;');
    console.log('%cتم تطويره بواسطة فريق علوم الطبيعة - 2026', 'color:#666; font-size:10px;');
});