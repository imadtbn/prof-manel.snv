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
// SAMPLE RESOURCES DATA (Expandable)
// ════════════════════════════════════════
let resources = [
    { id: 1, title: "فرض الفصل الأول - التنظيم الهرموني", year: "2", stream: "رياضيات", type: "فرض", date: "2025", download: "https://drive.google.com/file/d/sample1/view", desc: "مع التصحيح الكامل PDF - 12 صفحة", size: "2.4 MB", pages: 12 },
    { id: 2, title: "اختبار البكالوريا - الجهاز المناعي", year: "3", stream: "تقني", type: "اختبار", date: "2024", download: "https://drive.google.com/file/d/sample2/view", desc: "نموذج وزاري مع التصحيح", size: "1.8 MB", pages: 8 },
    { id: 3, title: "تمارين الفصل الثاني - الوراثة", year: "1", stream: "اداب", type: "تمارين", date: "2025", download: "https://drive.google.com/file/d/sample3/view", desc: "٢٥ تمرين + حلول مفصلة", size: "3.1 MB", pages: 25 },
    { id: 4, title: "فرض تكميلي - التنوع البيولوجي", year: "2", stream: "رياضيات", type: "فرض", date: "2025", download: "https://drive.google.com/file/d/sample4/view", desc: "شعبة علوم تجريبية", size: "1.5 MB", pages: 6 },
    { id: 5, title: "درس - التنفس الخلوي", year: "2", stream: "علوم", type: "درس", date: "2025", download: "https://drive.google.com/file/d/sample5/view", desc: "ملخص شامل مع رسوم توضيحية", size: "4.2 MB", pages: 18 },
    { id: 6, title: "فرض الفصل الثالث - التكاثر", year: "1", stream: "رياضيات", type: "فرض", date: "2025", download: "https://drive.google.com/file/d/sample6/view", desc: "مع التصحيح والتقييم", size: "2.0 MB", pages: 10 },
    { id: 7, title: "اختبار الفصل الأول - الغدد الصماء", year: "3", stream: "علوم", type: "اختبار", date: "2024", download: "https://drive.google.com/file/d/sample7/view", desc: "نموذج تحضيري للبكالوريا", size: "2.8 MB", pages: 14 },
    { id: 8, title: "تمارين - البيئة والتطور", year: "2", stream: "تقني", type: "تمارين", date: "2025", download: "https://drive.google.com/file/d/sample8/view", desc: "تمارين تطبيقية مع حلول", size: "1.9 MB", pages: 15 },
    { id: 9, title: "فرض - التغذية عند النبات", year: "1", stream: "اداب", type: "فرض", date: "2025", download: "https://drive.google.com/file/d/sample9/view", desc: "فرض الفصل الأول", size: "1.2 MB", pages: 5 },
    { id: 10, title: "اختبار موحد - علم الأحياء", year: "3", stream: "رياضيات", type: "اختبار", date: "2024", download: "https://drive.google.com/file/d/sample10/view", desc: "اختبار شهادة البكالوريا", size: "3.5 MB", pages: 20 },
    { id: 11, title: "درس - الجهاز العصبي", year: "2", stream: "اداب", type: "درس", date: "2025", download: "https://drive.google.com/file/d/sample11/view", desc: "درس تفاعلي مع فيديو", size: "5.1 MB", pages: 22 },
    { id: 12, title: "فرض - الهرمونات والتنظيم", year: "2", stream: "علوم", type: "فرض", date: "2025", download: "https://drive.google.com/file/d/sample12/view", desc: "فرض الفصل الثاني", size: "2.3 MB", pages: 11 },
];

let filteredResources = [...resources];
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
    let width, height, stars = [];

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    }

    class Star {
        constructor() { this.reset(); }
        reset() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.size = Math.random() * 2.2 + 0.6;
            this.speed = Math.random() * 0.5 + 0.1;
            this.brightness = Math.random() * 0.5 + 0.5;
        }
        update() {
            this.y += this.speed;
            if (this.y > height) this.reset();
        }
        draw() {
            ctx.fillStyle = '#f5e8c7';
            ctx.globalAlpha = this.brightness * (Math.random() * 0.4 + 0.6);
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function initStars(count) {
        stars = [];
        for (let i = 0; i < count; i++) stars.push(new Star());
    }

    function connectStars() {
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 0.6;
        for (let i = 0; i < stars.length; i++) {
            for (let j = i + 1; j < stars.length; j++) {
                const dx = stars[i].x - stars[j].x;
                const dy = stars[i].y - stars[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < 130) {
                    ctx.globalAlpha = (130 - distance) / 130 * 0.12;
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
        ctx.fillStyle = 'rgba(10, 10, 15, 0.08)';
        ctx.fillRect(0, 0, width, height);
        stars.forEach(star => { star.update(); star.draw(); });
        connectStars();
        requestAnimationFrame(animate);
    }

    window.addEventListener('resize', () => { resize(); initStars(220); });
    resize();
    initStars(220);
    animate();
}

// ════════════════════════════════════════
// HOLOGRAPHIC CELLS
// ════════════════════════════════════════
function createHoloCells() {
    const container = document.getElementById('holoCellContainer');
    if (!container) return;

    const cellCount = 8;

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
    menu.classList.toggle('active');
    overlay.classList.toggle('active');
    document.body.style.overflow = menu.classList.contains('active') ? 'hidden' : '';
}

// ════════════════════════════════════════
// HEADER SCROLL EFFECT
// ════════════════════════════════════════
function initHeaderScroll() {
    const header = document.getElementById('mainHeader');
    if (!header) return;

    window.addEventListener('scroll', () => {
        const scrollY = window.pageYOffset;
        const inner = header.querySelector('.header-inner');
        if (scrollY > 100) {
            inner.style.background = 'rgba(10, 10, 15, 0.95)';
        } else {
            inner.style.background = 'var(--glass)';
        }
    }, { passive: true });
}

// ════════════════════════════════════════
// THEME TOGGLE
// ════════════════════════════════════════
function toggleDarkMode() {
    const icon = document.getElementById('themeIcon');
    if (!icon) return;

    CONFIG.isDarkMode = !CONFIG.isDarkMode;
    if (CONFIG.isDarkMode) {
        icon.className = 'fas fa-moon';
        showToast('تم تفعيل الوضع الليلي', 'fa-moon');
    } else {
        icon.className = 'fas fa-sun';
        showToast('تم تفعيل الوضع النهاري', 'fa-sun');
    }
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

const INLINE_ADS = [
    { after: 3, slot: '8546947691', layoutKey: '-h9-h+8-jr+r8' },
    { after: 6, slot: '6152718642', layoutKey: '-h6-l+d-jc+qd' }
];

function createInlineAd(adConfig) {
    const wrapper = document.createElement('div');
    wrapper.className = 'resource-ad-card';
    wrapper.setAttribute('aria-label', 'إعلان داخل الموارد');

    const shell = document.createElement('div');
    shell.className = 'ad-shell ad-shell--fluid';

    const label = document.createElement('span');
    label.className = 'ad-label';
    label.textContent = 'إعلان';

    const ad = document.createElement('ins');
    ad.className = 'adsbygoogle ad-unit';
    ad.style.display = 'block';
    ad.dataset.adFormat = 'fluid';
    ad.dataset.adLayoutKey = adConfig.layoutKey;
    ad.dataset.adClient = 'ca-pub-5656416032906373';
    ad.dataset.adSlot = adConfig.slot;

    shell.append(label, ad);
    wrapper.appendChild(shell);
    return wrapper;
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
        card.onclick = function() { openPreview(res); };
        card.onkeydown = function(event) {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openPreview(res);
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
                        <a href="${res.download}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()" class="card-btn card-btn-download" title="تحميل" aria-label="تحميل ${res.title}">
                            <i class="fas fa-download"></i>
                        </a>
                    </div>
                </div>
            </div>
        `;
        grid.appendChild(card);

        // فاصل إعلاني خفيف بعد كل ثلاث بطاقات، ولا يظهر في حالة عدم وجود نتائج.
        const inlineAd = INLINE_ADS.find(adConfig => adConfig.after === index + 1);
        if (inlineAd) grid.appendChild(createInlineAd(inlineAd));
    });

    // تهيئة الوحدات التي أُنشئت بعد التصفية أو الانتقال بين الصفحات.
    if (typeof AdsManager !== 'undefined') AdsManager.observe();

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
    if (modalDownload) modalDownload.href = res.download;

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

    if (navigator.share) {
        navigator.share({
            title: currentPreviewResource.title,
            text: currentPreviewResource.desc,
            url: currentPreviewResource.download
        });
    } else if (navigator.clipboard) {
        navigator.clipboard.writeText(currentPreviewResource.download).then(() => {
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
            <div style="display:flex;flex-direction:column;gap:24px;">
                <p style="color:var(--text-secondary);">نحن هنا لمساعدتك! يمكنك التواصل معنا عبر أي من القنوات التالية:</p>

                <div style="display:flex;flex-direction:column;gap:12px;">
                    <div style="display:flex;align-items:center;gap:16px;background:var(--card-bg);border-radius:12px;padding:16px;">
                        <div style="width:48px;height:48px;background:rgba(212,175,55,0.2);border-radius:12px;display:flex;align-items:center;justify-content:center;"><i class="fas fa-envelope" style="color:var(--gold);"></i></div>
                        <div>
                            <div style="font-size:13px;color:var(--text-secondary);">البريد الإلكتروني</div>
                            <div style="font-weight:600;">contact@sciencesnaturelles.dz</div>
                        </div>
                    </div>
                    <div style="display:flex;align-items:center;gap:16px;background:var(--card-bg);border-radius:12px;padding:16px;">
                        <div style="width:48px;height:48px;background:rgba(16,185,129,0.2);border-radius:12px;display:flex;align-items:center;justify-content:center;"><i class="fab fa-whatsapp" style="color:var(--emerald);"></i></div>
                        <div>
                            <div style="font-size:13px;color:var(--text-secondary);">واتساب</div>
                            <div style="font-weight:600;direction:ltr;text-align:right;">+213 555 123 456</div>
                        </div>
                    </div>
                    <div style="display:flex;align-items:center;gap:16px;background:var(--card-bg);border-radius:12px;padding:16px;">
                        <div style="width:48px;height:48px;background:rgba(59,130,246,0.2);border-radius:12px;display:flex;align-items:center;justify-content:center;"><i class="fab fa-facebook" style="color:#60a5fa;"></i></div>
                        <div>
                            <div style="font-size:13px;color:var(--text-secondary);">صفحة الفيسبوك</div>
                            <div style="font-weight:600;">Sciences Naturelles</div>
                        </div>
                    </div>
                </div>

                <div style="background:var(--card-bg);border-radius:16px;padding:24px;">
                    <h4 style="font-weight:700;margin-bottom:16px;">أرسل رسالة</h4>
                    <form onsubmit="event.preventDefault(); showToast('تم إرسال رسالتك!', 'fa-paper-plane'); closePageModal();" style="display:flex;flex-direction:column;gap:12px;">
                        <input type="text" placeholder="الاسم" required style="width:100%;background:var(--void);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:12px 16px;color:var(--text-primary);font-family:'Cairo',sans-serif;font-size:14px;outline:none;transition:var(--transition);">
                        <input type="email" placeholder="البريد الإلكتروني" required style="width:100%;background:var(--void);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:12px 16px;color:var(--text-primary);font-family:'Cairo',sans-serif;font-size:14px;outline:none;transition:var(--transition);">
                        <textarea placeholder="رسالتك" rows="4" required style="width:100%;background:var(--void);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:12px 16px;color:var(--text-primary);font-family:'Cairo',sans-serif;font-size:14px;outline:none;transition:var(--transition);resize:none;"></textarea>
                        <button type="submit" style="width:100%;padding:14px;background:var(--gold);color:var(--void);font-weight:600;border-radius:12px;border:none;cursor:pointer;font-family:'Cairo',sans-serif;font-size:15px;transition:var(--transition);">إرسال</button>
                    </form>
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
// GOOGLE ADSENSE MANAGER
// ════════════════════════════════════════
const AdsManager = (() => {
    const CONFIG = {
        selector: '.adsbygoogle',
        rootMargin: '360px 0px',
        statusCheckMs: 250,
        statusChecks: 48
    };

    const states = new WeakMap();
    let observer;

    function whenAdSenseReady() {
        // إنشاء الطابور محلياً يسمح للسكربت الخارجي بمعالجة الطلب لاحقاً دون حجب الصفحة.
        window.adsbygoogle = window.adsbygoogle || [];
        return Promise.resolve(true);
    }

    function collapseIfUnfilled(ad) {
        const shell = ad.closest('.ad-shell');
        if (!shell) return;

        let checks = 0;
        const checkStatus = () => {
            const status = ad.getAttribute('data-ad-status');
            if (status === 'unfilled') {
                shell.classList.add('is-collapsed');
                return;
            }
            if (status === 'filled') {
                shell.classList.add('is-filled');
                return;
            }
            if (checks < CONFIG.statusChecks) {
                checks += 1;
                window.setTimeout(checkStatus, CONFIG.statusCheckMs);
            } else {
                shell.classList.add('is-collapsed');
            }
        };

        checkStatus();
    }

    async function mount(ad) {
        if (states.has(ad)) return;
        states.set(ad, 'loading');

        const ready = await whenAdSenseReady();
        if (!ready || !document.documentElement.contains(ad)) {
            const shell = ad.closest('.ad-shell');
            if (shell) shell.classList.add('is-collapsed');
            states.set(ad, 'unavailable');
            return;
        }

        try {
            window.adsbygoogle = window.adsbygoogle || [];
            window.adsbygoogle.push({});
            states.set(ad, 'mounted');
            collapseIfUnfilled(ad);
        } catch (error) {
            const shell = ad.closest('.ad-shell');
            if (shell) shell.classList.add('is-collapsed');
            states.set(ad, 'failed');
            console.warn('تعذر تهيئة وحدة AdSense:', error);
        }
    }

    function observe() {
        const ads = [...document.querySelectorAll(CONFIG.selector)].filter(ad => !states.has(ad));
        if (!ads.length) return;

        if (!('IntersectionObserver' in window)) {
            ads.forEach(mount);
            return;
        }

        if (!observer) {
            observer = new IntersectionObserver(entries => {
                entries.forEach(entry => {
                    if (!entry.isIntersecting) return;
                    observer.unobserve(entry.target);
                    mount(entry.target);
                });
            }, { rootMargin: CONFIG.rootMargin, threshold: 0.01 });
        }

        ads.forEach(ad => observer.observe(ad));
    }

    function init() {
        const schedule = window.requestIdleCallback || ((callback) => window.setTimeout(callback, 0));
        schedule(observe, { timeout: 1200 });
    }

    return { init, observe };
})();

// ════════════════════════════════════════
// INITIALIZE
// ════════════════════════════════════════
document.addEventListener('DOMContentLoaded', function() {
    createStarField();
    createHoloCells();
    initHeaderScroll();
    initSmoothScroll();
    updateDynamicStats();

    const initialQuery = new URLSearchParams(window.location.search).get('q');
    const searchInput = document.getElementById('searchInput');
    if (initialQuery && searchInput) searchInput.value = initialQuery;

    filterResources();
    initScrollAnimations();
    AdsManager.init();

    console.log('%c🔬 موقع علوم الطبيعة جاهز!', 'color:#d4af37; font-size:14px; font-weight:bold;');
    console.log('%cتم تطويره بواسطة فريق علوم الطبيعة - 2026', 'color:#666; font-size:10px;');
});