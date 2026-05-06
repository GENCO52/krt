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

    // Logo Double Click
    const logo = document.getElementById('nav-logo');
    if(logo) {
        logo.addEventListener('dblclick', (e) => {
            e.preventDefault();
            window.location.href = 'admin.html';
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
        }
    }

    async function loadPublicReferences() {
        try {
            const { data, error } = await supabase
                .from('references')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data.length === 0) {
                portfolioGrid.innerHTML = '<div class="w-100 text-center py-5">Henüz referans eklenmemiş.</div>';
                return;
            }

            portfolioGrid.innerHTML = '';
            data.forEach(ref => {
                const item = document.createElement('div');
                item.className = 'portfolio-item';
                item.style.cursor = 'pointer';
                item.innerHTML = `
                    <div class="portfolio-img-wrap">
                        <img src="${ref.cover_image_url}" alt="${ref.title}" class="portfolio-img">
                        <div class="portfolio-overlay">
                            <span class="portfolio-category">${ref.category}</span>
                            <h3 class="portfolio-title">${ref.title}</h3>
                        </div>
                    </div>
                `;
                
                item.addEventListener('click', () => openProjectDetail(ref));
                portfolioGrid.appendChild(item);
            });
        } catch (error) {
            console.error('Referanslar yüklenemedi:', error);
            portfolioGrid.innerHTML = '<div class="w-100 text-center py-5 text-orange">Referanslar yüklenirken bir hata oluştu.</div>';
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
            thumb.innerHTML = `<img src="${url}" alt="${project.title}">`;
            
            thumb.addEventListener('click', () => {
                updateGalleryView(index);
            });
            
            thumbnailsGrid.appendChild(thumb);
        });

        // Set Initial View
        updateGalleryView(0);

        projectModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
});



