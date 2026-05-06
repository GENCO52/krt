document.addEventListener('DOMContentLoaded', () => {
    // Login Elements
    const loginOverlay = document.getElementById('login-overlay');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const adminPassword = document.getElementById('admin-password');

    // Admin Elements
    const modal = document.getElementById('add-modal');
    const addBtn = document.getElementById('add-reference-btn');
    const closeBtn = document.querySelector('.close-modal');
    const cancelBtn = document.querySelector('.cancel-btn');
    const form = document.getElementById('add-reference-form');
    const overlay = document.getElementById('upload-overlay');
    const statusText = document.getElementById('upload-status');
    const listContainer = document.getElementById('references-list');

    // Simple Authentication Check
    const ADMIN_PASS = 'krt123'; // Bu şifreyi istediğiniz gibi değiştirebilirsiniz

    const checkAuth = () => {
        if (sessionStorage.getItem('adminLoggedIn') === 'true') {
            loginOverlay.classList.add('hidden');
            loadReferences();
        }
    };

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (adminPassword.value === ADMIN_PASS) {
            sessionStorage.setItem('adminLoggedIn', 'true');
            loginOverlay.classList.add('hidden');
            loadReferences();
            loginError.classList.add('hidden');
        } else {
            loginError.classList.remove('hidden');
            adminPassword.value = '';
            adminPassword.focus();
        }
    });

    // Check if Supabase is configured
    if (SUPABASE_URL.includes('BURAYA')) {
        listContainer.innerHTML = '<div class="loading-text text-orange">Lütfen supabaseClient.js dosyasından URL ve Key ayarlarını yapınız.</div>';
        return;
    }

    // Modal Events
    addBtn.addEventListener('click', () => modal.classList.add('show'));
    closeBtn.addEventListener('click', () => modal.classList.remove('show'));
    cancelBtn.addEventListener('click', () => modal.classList.remove('show'));

    // Load existing references
    async function loadReferences() {
        if (sessionStorage.getItem('adminLoggedIn') !== 'true') return;
        
        try {
            const { data, error } = await supabase
                .from('references')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data.length === 0) {
                listContainer.innerHTML = '<div class="loading-text">Henüz referans eklenmemiş.</div>';
                return;
            }

            listContainer.innerHTML = '';
            data.forEach(ref => {
                const card = document.createElement('div');
                card.className = 'admin-ref-card';
                card.innerHTML = `
                    <img src="${ref.cover_image_url}" alt="${ref.title}" class="admin-ref-img">
                    <div class="admin-ref-info">
                        <div class="admin-ref-title">${ref.title} ${ref.is_client_logo ? '<span class="client-badge"><i class="fas fa-check-circle"></i> Firma Slider</span>' : ''}</div>
                        <div class="admin-ref-cat">${ref.category}</div>
                    </div>
                    <div class="admin-ref-actions">
                        <button class="btn btn-outline btn-sm" onclick="deleteReference('${ref.id}')"><i class="fas fa-trash text-orange"></i> Sil</button>
                    </div>
                `;
                listContainer.appendChild(card);
            });
        } catch (error) {
            console.error('Hata:', error);
            listContainer.innerHTML = `<div class="loading-text text-orange">Yükleme hatası: ${error.message}</div>`;
        }
    }

    // Run auth check on load
    checkAuth();

    // Generate unique file name
    const generateFileName = (file) => {
        const ext = file.name.split('.').pop();
        return `${Date.now()}_${Math.random().toString(36).substring(2)}.${ext}`;
    };

    // Form Submit
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const title = document.getElementById('ref-title').value;
        const category = document.getElementById('ref-category').value;
        const description = document.getElementById('ref-desc').value;
        const isClientLogo = document.getElementById('is-client-logo').checked;
        const coverFile = document.getElementById('ref-cover').files[0];
        const galleryFiles = document.getElementById('ref-gallery').files;

        if (!coverFile) return alert('Kapak resmi zorunludur!');

        overlay.classList.remove('hidden');
        
        try {
            // 1. Upload Cover Image
            statusText.innerText = 'Kapak resmi yükleniyor...';
            const coverPath = `covers/${generateFileName(coverFile)}`;
            const { data: coverData, error: coverError } = await supabase.storage
                .from('portfolio-images')
                .upload(coverPath, coverFile);
            
            if (coverError) throw coverError;
            
            const { data: { publicUrl: coverUrl } } = supabase.storage
                .from('portfolio-images')
                .getPublicUrl(coverPath);

            // 2. Upload Gallery Images
            let galleryUrls = [];
            if (galleryFiles.length > 0) {
                statusText.innerText = 'Detay resimleri yükleniyor...';
                for (let i = 0; i < galleryFiles.length; i++) {
                    const file = galleryFiles[i];
                    const path = `gallery/${generateFileName(file)}`;
                    const { error: galError } = await supabase.storage
                        .from('portfolio-images')
                        .upload(path, file);
                    
                    if (galError) throw galError;
                    
                    const { data: { publicUrl } } = supabase.storage
                        .from('portfolio-images')
                        .getPublicUrl(path);
                    galleryUrls.push(publicUrl);
                }
            }

            // 3. Save to Database
            statusText.innerText = 'Veritabanına kaydediliyor...';
            const { error: dbError } = await supabase
                .from('references')
                .insert([
                    {
                        title,
                        category,
                        description,
                        cover_image_url: coverUrl,
                        gallery_urls: galleryUrls,
                        is_client_logo: isClientLogo
                    }
                ]);

            if (dbError) throw dbError;

            // Success
            form.reset();
            modal.classList.remove('show');
            loadReferences();

        } catch (error) {
            console.error('Yükleme hatası:', error);
            alert(`Bir hata oluştu: ${error.message}`);
        } finally {
            overlay.classList.add('hidden');
        }
    });

    // Logout logic
    const logoutBtn = document.getElementById('logout-btn');
    logoutBtn.addEventListener('click', () => {
        if (confirm('Çıkış yapmak istediğinize emin misiniz?')) {
            sessionStorage.removeItem('adminLoggedIn');
            window.location.reload();
        }
    });

    // Delete Reference
    window.deleteReference = async (id) => {
        if(!confirm('Bu referansı silmek istediğinize emin misiniz?')) return;
        
        try {
            const { error } = await supabase.from('references').delete().eq('id', id);
            if (error) throw error;
            loadReferences();
        } catch (error) {
            console.error('Silme hatası:', error);
            alert('Silinirken bir hata oluştu.');
        }
    };
});

