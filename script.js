// ================================================================
//  MOBİL UYGULAMA DAVRANIŞLARI
// ================================================================
(function() {
    const isMobile = () => window.innerWidth <= 768;

    // --- Screen 1: Splash ---
    const splash = document.getElementById('mobile-splash');
    const splashBtn = document.getElementById('splash-enter-btn');
    if (splash && isMobile() && !sessionStorage.getItem('krt_splash')) {
        splash.style.display = 'flex';
        const dismiss = () => {
            splash.classList.add('hidden');
            setTimeout(() => { splash.style.display = 'none'; }, 600);
            sessionStorage.setItem('krt_splash', '1');
        };
        if (splashBtn) splashBtn.addEventListener('click', dismiss);
        setTimeout(dismiss, 6000);
    } else if (splash) {
        splash.style.display = 'none';
    }

    // --- Screen 2: Featured Slider ---
    const mobSlider = document.getElementById('mob-featured-slider');
    if (mobSlider) {
        const slides = mobSlider.querySelectorAll('.mob-featured-slide');
        const dots   = mobSlider.querySelectorAll('.mob-featured-dot');
        let cur = 0;
        const goTo = (i) => {
            slides[cur].classList.remove('active');
            dots[cur].classList.remove('active');
            cur = (i + slides.length) % slides.length;
            slides[cur].classList.add('active');
            dots[cur].classList.add('active');
        };
        let iv = setInterval(() => goTo(cur + 1), 4200);
        dots.forEach((d, i) => d.addEventListener('click', () => { clearInterval(iv); goTo(i); iv = setInterval(() => goTo(cur + 1), 4200); }));
        // Touch swipe
        let tx = 0;
        mobSlider.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
        mobSlider.addEventListener('touchend', e => {
            const diff = tx - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 45) { clearInterval(iv); goTo(diff > 0 ? cur + 1 : cur - 1); iv = setInterval(() => goTo(cur + 1), 4200); }
        }, { passive: true });
    }

    // --- Screen 2/3: Grid ↔ Liste toggle ---
    const mobViewBtns  = document.querySelectorAll('.mob-view-btn');
    const mobGrid      = document.getElementById('mob-service-grid');
    const mobList      = document.getElementById('mob-service-list');
    mobViewBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            mobViewBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (btn.dataset.view === 'grid') {
                if (mobGrid) mobGrid.style.display = 'grid';
                if (mobList) mobList.style.display = 'none';
            } else {
                if (mobGrid) mobGrid.style.display = 'none';
                if (mobList) { mobList.style.display = 'flex'; }
            }
        });
    });

    // --- Alt Navigasyon: scroll ile aktif sekme güncelle ---
    const bottomNav = document.getElementById('mobile-bottom-nav');
    if (bottomNav) {
        const sections = [
            { id: 'anasayfa',    el: document.getElementById('anasayfa') },
            { id: 'hizmetler',   el: document.getElementById('hizmetler') },
            { id: 'referanslar', el: document.getElementById('referanslar') },
            { id: 'mob-iletisim', el: document.getElementById('mob-iletisim') },
        ];
        const navItems = bottomNav.querySelectorAll('.mob-nav-item[data-section]');
        const setActive = (id) => {
            navItems.forEach(it => {
                it.classList.toggle('active', it.dataset.section === id);
            });
        };
        const onScroll = () => {
            let active = sections[0].id;
            sections.forEach(s => {
                if (s.el && window.scrollY + window.innerHeight / 2 >= s.el.offsetTop) {
                    active = s.id;
                }
            });
            setActive(active);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    // --- Mobil referans filtre chip'leri → referanslar.html yönlendir ---
    const mobRefFilter = document.getElementById('mob-ref-filter');
    if (mobRefFilter) {
        mobRefFilter.querySelectorAll('.mob-filter-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                mobRefFilter.querySelectorAll('.mob-filter-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                window.location.href = 'referanslar.html';
            });
        });
    }

    // --- Teklif Form Modalı ---
    const quoteModal  = document.getElementById('quote-modal');
    const openQuoteBtn  = document.getElementById('open-quote-form');
    const closeQuoteBtn = document.getElementById('close-quote-modal');
    const quoteForm   = document.getElementById('quote-form');
    const quoteSuccess = document.getElementById('quote-success');
    const quoteSubmitBtn = document.getElementById('qf-submit-btn');

    const openQuote = () => {
        if (!quoteModal) return;
        // Başarı ekranını sıfırla
        if (quoteSuccess) quoteSuccess.style.display = 'none';
        if (quoteForm)    { quoteForm.style.display = ''; quoteForm.reset(); }
        if (quoteSubmitBtn) { quoteSubmitBtn.disabled = false; quoteSubmitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Teklif Talep Et'; }
        quoteModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    };
    const closeQuote = () => {
        if (!quoteModal) return;
        quoteModal.classList.remove('active');
        document.body.style.overflow = '';
    };

    if (openQuoteBtn)  openQuoteBtn.addEventListener('click', openQuote);
    if (closeQuoteBtn) closeQuoteBtn.addEventListener('click', closeQuote);
    if (quoteModal)    quoteModal.addEventListener('click', e => { if (e.target === quoteModal) closeQuote(); });

    // Google Apps Script URL — deploy sonrası buraya yapıştır
    const GAS_URL = 'https://script.google.com/macros/s/AKfycbxiyRUybZ88fAuk5gxenlSyGTkhdJMD8RuTcFZN6fdp1dOF7SXROu9jXD9pSecY8D3Raw/exec';

    if (quoteForm) {
        quoteForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (quoteSubmitBtn) {
                quoteSubmitBtn.disabled = true;
                quoteSubmitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gönderiliyor...';
            }
            try {
                // no-cors: GAS'a istek gider, CORS hatası olmadan mail gönderilir
                await fetch(GAS_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    body: new URLSearchParams(new FormData(quoteForm))
                });
                // no-cors modunda response okunamaz, mail gittiğini varsay
                if (quoteForm)    quoteForm.style.display = 'none';
                if (quoteSuccess) quoteSuccess.style.display = 'flex';
                setTimeout(closeQuote, 4000);
            } catch (err) {
                if (quoteSubmitBtn) {
                    quoteSubmitBtn.disabled = false;
                    quoteSubmitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Teklif Talep Et';
                }
                alert('Form gönderilemedi, lütfen tekrar deneyin veya bizi arayın: 0543 126 58 78');
            }
        });
    }

    // --- Mobil hamburger menü (mobile-header'daki) ---
    const mobMenuBtn = document.getElementById('mob-menu-btn');
    if (mobMenuBtn) {
        mobMenuBtn.addEventListener('click', () => {
            // Mevcut nav-menu'yu toggle et
            const navMenu = document.querySelector('.nav-menu');
            if (navMenu) {
                navMenu.classList.toggle('active');
                const icon = mobMenuBtn.querySelector('i');
                icon.className = navMenu.classList.contains('active') ? 'fas fa-times' : 'fas fa-bars';
            }
        });
    }
})();

// ================================================================
//  ANA SAYFA KODU (mevcut)
// ================================================================
// Mobil menü açma kapama
document.addEventListener('DOMContentLoaded', () => {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navMenu = document.querySelector('.nav-menu');
    
    if(mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            const icon = mobileMenuBtn.querySelector('i');
            if(navMenu.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    }

    // Scroll olduğunda header stilini değiştirme
    const header = document.querySelector('.header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Menü linklerine tıklandığında mobilde menüyü kapat
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            const icon = mobileMenuBtn.querySelector('i');
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        });
    });

    // Hero Accordion
    const accItems = document.querySelectorAll('.hero-acc-item');
    accItems.forEach(item => {
        item.addEventListener('click', () => {
            accItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });

    // Logo Double Click
    const logo = document.getElementById('nav-logo');
    if(logo) {
        logo.addEventListener('dblclick', (e) => {
            e.preventDefault();
            window.location.href = 'admin/admin.html';
        });
    }

    // Load References
    const portfolioGrid = document.getElementById('portfolio-grid');
    const projectModal = document.getElementById('project-modal');
    const closeProjectModal = document.querySelector('.close-project-modal');

    if (projectModal) {
        closeProjectModal.addEventListener('click', () => {
            projectModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        });

        // Close on outside click
        projectModal.addEventListener('click', (e) => {
            if (e.target === projectModal) {
                projectModal.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        });
    }

    if (portfolioGrid && typeof supabase !== 'undefined') {
        if (SUPABASE_URL.includes('BURAYA')) {
            portfolioGrid.innerHTML = '<div class="w-100 text-center py-5">Referansları görmek için Supabase ayarlarını yapınız.</div>';
        } else {
            loadPublicReferences();
            loadClientLogos(); // Load logos for the slider
        }
    }

    async function loadPublicReferences() {
        const isSlider = !!document.getElementById('portfolio-prev');
        const ITEMS_PER_PAGE = 3;
        let currentPage = 0;
        let allRefs = [];

        try {
            const { data, error } = await supabase
                .from('references')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            allRefs = data || [];

            if (allRefs.length === 0) {
                portfolioGrid.innerHTML = '<div class="w-100 text-center py-5">Henüz referans eklenmemiş.</div>';
                return;
            }

            if (isSlider) {
                portfolioGrid.classList.remove('full-grid');
                buildDots();
                renderPage();

                document.getElementById('portfolio-prev').addEventListener('click', () => {
                    if (currentPage > 0) { currentPage--; renderPage(); }
                });
                document.getElementById('portfolio-next').addEventListener('click', () => {
                    if ((currentPage + 1) * ITEMS_PER_PAGE < allRefs.length) { currentPage++; renderPage(); }
                });
            } else {
                portfolioGrid.classList.add('full-grid');
                renderItems(allRefs);
                setupFilters();
            }
        } catch (error) {
            console.error('Referanslar yüklenemedi:', error);
            portfolioGrid.innerHTML = '<div class="w-100 text-center py-5 text-orange">Referanslar yüklenirken bir hata oluştu.</div>';
        }

        function renderPage() {
            const start = currentPage * ITEMS_PER_PAGE;
            renderItems(allRefs.slice(start, start + ITEMS_PER_PAGE));
            updateDots();
            updateNavBtns();
        }

        function renderItems(refs) {
            portfolioGrid.innerHTML = '';
            refs.forEach(ref => {
                const item = document.createElement('div');
                item.className = 'portfolio-item';
                item.style.cursor = 'pointer';
                item.innerHTML = `
                    <div class="portfolio-img-wrap">
                        <img src="${ref.cover_image_url}" alt="${ref.title}" class="portfolio-img" loading="lazy">
                        <div class="portfolio-overlay">
                            <span class="portfolio-category">${ref.category}</span>
                            <h3 class="portfolio-title">${ref.title}</h3>
                        </div>
                    </div>
                `;
                item.addEventListener('click', () => openProjectDetail(ref));
                portfolioGrid.appendChild(item);
            });
        }

        function buildDots() {
            const dotsEl = document.getElementById('portfolio-dots');
            if (!dotsEl) return;
            const total = Math.ceil(allRefs.length / ITEMS_PER_PAGE);
            dotsEl.innerHTML = '';
            for (let i = 0; i < total; i++) {
                const btn = document.createElement('button');
                btn.className = 'portfolio-dot' + (i === 0 ? ' active' : '');
                btn.setAttribute('aria-label', `Sayfa ${i + 1}`);
                btn.setAttribute('aria-current', i === 0 ? 'page' : 'false');
                btn.addEventListener('click', () => {
                    currentPage = i;
                    renderPage();
                    // Update aria-current for accessibility
                    document.querySelectorAll('.portfolio-dot').forEach((d, idx) => {
                        d.setAttribute('aria-current', idx === i ? 'page' : 'false');
                    });
                });
                dotsEl.appendChild(btn);
            }
        }

        function updateDots() {
            document.querySelectorAll('.portfolio-dot').forEach((d, i) =>
                d.classList.toggle('active', i === currentPage));
        }

        function updateNavBtns() {
            const prev = document.getElementById('portfolio-prev');
            const next = document.getElementById('portfolio-next');
            if (prev) prev.disabled = currentPage === 0;
            if (next) next.disabled = (currentPage + 1) * ITEMS_PER_PAGE >= allRefs.length;
        }

        function setupFilters() {
            const filterBar = document.getElementById('filter-bar');
            if (!filterBar) return;

            // Add aria-labels to filter buttons
            const filterBtns = filterBar.querySelectorAll('.filter-btn');
            filterBtns.forEach((btn) => {
                const cat = btn.dataset.cat;
                btn.setAttribute('aria-label', `${cat} kategorisine göre filtrele`);
            });

            filterBar.addEventListener('click', (e) => {
                const btn = e.target.closest('.filter-btn');
                if (!btn) return;

                filterBar.querySelectorAll('.filter-btn').forEach(b => {
                    b.classList.remove('active');
                    b.setAttribute('aria-pressed', 'false');
                });
                btn.classList.add('active');
                btn.setAttribute('aria-pressed', 'true');

                const cat = btn.dataset.cat;
                const filtered = cat === 'Tümü' ? allRefs : allRefs.filter(r => r.category === cat);

                if (filtered.length === 0) {
                    portfolioGrid.innerHTML = '<div class="w-100 text-center py-5" style="color:var(--text-muted)">Bu kategoride henüz proje yok.</div>';
                } else {
                    renderItems(filtered);
                }
            });
        }
    }

    async function loadClientLogos() {
        const logoTrack = document.getElementById('logo-track');
        if (!logoTrack) return;

        try {
            const { data, error } = await supabase
                .from('references')
                .select('cover_image_url, title')
                .eq('is_client_logo', true);

            if (error) throw error;
            if (!data || data.length === 0) {
                const section = document.querySelector('.clients-section');
                if (section) section.style.display = 'none';
                return;
            }

            // Function to create logo item
            const createLogoItem = (logo) => {
                const div = document.createElement('div');
                div.className = 'client-logo-item';
                div.innerHTML = `<img src="${logo.cover_image_url}" alt="${logo.title}" title="${logo.title}" loading="lazy">`;
                return div;
            };

            // Populate and clone for infinite loop
            const populate = () => {
                logoTrack.innerHTML = '';
                // Clone items multiple times to ensure the track is always longer than the screen
                // 6 times is usually enough to cover even large screens with few logos
                for(let i=0; i<6; i++) {
                    data.forEach(logo => {
                        logoTrack.appendChild(createLogoItem(logo));
                    });
                }
            };

            populate();

        } catch (error) {
            console.error('Logolar yüklenemedi:', error);
        }
    }

    function openProjectDetail(project) {
        const mainImageContainer = document.getElementById('main-image-container');
        const thumbnailsGrid = document.getElementById('thumbnails-grid');
        const title = document.getElementById('project-title');
        const category = document.getElementById('project-category');
        const description = document.getElementById('project-description');

        title.innerText = project.title;
        category.innerText = project.category;
        description.innerText = project.description;

        // Populate Images
        const allImages = [project.cover_image_url, ...(project.gallery_urls || [])];
        let currentIndex = 0;
        
        // Function to update the view
        const updateGalleryView = (index) => {
            currentIndex = index;
            mainImageContainer.innerHTML = `<img src="${allImages[currentIndex]}" alt="${project.title}" id="modal-main-img" style="cursor: pointer;">`;
            
            // Update Active State in Thumbnails
            document.querySelectorAll('.thumbnail-item').forEach((t, i) => {
                if (i === currentIndex) t.classList.add('active');
                else t.classList.remove('active');
            });

            // Add click event to main image for cycling
            document.getElementById('modal-main-img').addEventListener('click', () => {
                let nextIndex = (currentIndex + 1) % allImages.length;
                updateGalleryView(nextIndex);
            });
        };
        
        // Initial Populate Thumbnails
        thumbnailsGrid.innerHTML = '';
        allImages.forEach((url, index) => {
            const thumb = document.createElement('div');
            thumb.className = `thumbnail-item ${index === 0 ? 'active' : ''}`;
            thumb.setAttribute('role', 'button');
            thumb.setAttribute('tabindex', '0');
            thumb.setAttribute('aria-label', `Resim ${index + 1}`);
            thumb.innerHTML = `<img src="${url}" alt="${project.title}" loading="lazy">`;

            thumb.addEventListener('click', () => {
                updateGalleryView(index);
            });

            thumb.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    updateGalleryView(index);
                }
            });

            thumbnailsGrid.appendChild(thumb);
        });

        // Set Initial View
        updateGalleryView(0);

        projectModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
});



