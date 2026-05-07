document.addEventListener('DOMContentLoaded', () => {
    // Admin logo çift tıkla → ana sayfaya git
    const adminLogo = document.getElementById('admin-nav-logo');
    if (adminLogo) {
        adminLogo.addEventListener('dblclick', (e) => {
            e.preventDefault();
            window.location.href = '../index.html';
        });
    }

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

    let editingId = null;

    const closeModal = () => {
        modal.classList.remove('show');
        form.reset();
        editingId = null;
    };

    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);

    // Load existing references
    async function loadReferences() {
        if (sessionStorage.getItem('adminLoggedIn') !== 'true') return;
        
        try {
            const { data, error } = await supabase
                .from('references')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            listContainer.innerHTML = '';
            if (data.length === 0) {
                listContainer.innerHTML = '<div class="loading-text">Henüz referans eklenmemiş.</div>';
                return;
            }

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
                        <button class="btn btn-outline btn-sm" onclick="editReference('${ref.id}')"><i class="fas fa-edit text-orange"></i> Düzenle</button>
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

    // Edit Reference
    window.editReference = async (id) => {
        try {
            const { data, error } = await supabase
                .from('references')
                .select('*')
                .eq('id', id)
                .single();
            
            if (error) throw error;

            editingId = id;
            document.getElementById('modal-title').innerText = 'Referansı Düzenle';
            document.getElementById('save-btn').innerHTML = '<i class="fas fa-save"></i> Güncelle';
            
            document.getElementById('ref-title').value = data.title;
            document.getElementById('ref-category').value = data.category;
            document.getElementById('ref-desc').value = data.description;
            document.getElementById('is-client-logo').checked = data.is_client_logo || false;
            
            // Show Previews
            const coverPreview = document.getElementById('current-cover-preview');
            const galleryPreview = document.getElementById('current-gallery-preview');
            const coverImg = document.getElementById('current-cover-img');
            const galleryImages = document.getElementById('current-gallery-images');

            if (data.cover_image_url) {
                coverImg.src = data.cover_image_url;
                coverPreview.classList.remove('hidden');
            } else {
                coverPreview.classList.add('hidden');
            }

            if (data.gallery_urls && data.gallery_urls.length > 0) {
                galleryImages.innerHTML = data.gallery_urls.map(url => `<img src="${url}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">`).join('');
                galleryPreview.classList.remove('hidden');
            } else {
                galleryPreview.classList.add('hidden');
            }
            
            modal.classList.add('show');
        } catch (error) {
            alert('Hata: ' + error.message);
        }
    };

    // Open Add Modal
    addBtn.addEventListener('click', () => {
        editingId = null;
        form.reset();
        document.getElementById('modal-title').innerText = 'Yeni Referans Ekle';
        document.getElementById('save-btn').innerHTML = '<i class="fas fa-save"></i> Kaydet';
        document.getElementById('current-cover-preview').classList.add('hidden');
        document.getElementById('current-gallery-preview').classList.add('hidden');
        modal.classList.add('show');
    });

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

        overlay.classList.remove('hidden');
        
        try {
            let coverUrl = null;
            let galleryUrls = null;

            // 1. Upload Cover Image (Optional if editing)
            if (coverFile) {
                statusText.innerText = 'Kapak resmi yükleniyor...';
                const coverPath = `covers/${generateFileName(coverFile)}`;
                const { error: coverError } = await supabase.storage
                    .from('portfolio-images')
                    .upload(coverPath, coverFile);
                
                if (coverError) throw coverError;
                
                const { data: { publicUrl } } = supabase.storage
                    .from('portfolio-images')
                    .getPublicUrl(coverPath);
                coverUrl = publicUrl;
            }

            // 2. Upload Gallery Images (Optional if editing)
            if (galleryFiles.length > 0) {
                statusText.innerText = 'Detay resimleri yükleniyor...';
                galleryUrls = [];
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

            // 3. Save/Update in Database
            statusText.innerText = 'Veriler kaydediliyor...';
            
            const updateData = {
                title,
                category,
                description,
                is_client_logo: isClientLogo
            };

            if (coverUrl) updateData.cover_image_url = coverUrl;
            if (galleryUrls) updateData.gallery_urls = galleryUrls;

            if (editingId) {
                const { error: dbError } = await supabase
                    .from('references')
                    .update(updateData)
                    .eq('id', editingId);
                if (dbError) throw dbError;
            } else {
                if (!coverUrl) throw new Error('Yeni kayıt için kapak resmi zorunludur!');
                const { error: dbError } = await supabase
                    .from('references')
                    .insert([{ ...updateData, gallery_urls: galleryUrls || [] }]);
                if (dbError) throw dbError;
            }

            // Success
            overlay.classList.add('hidden');
            closeModal();
            loadReferences();

        } catch (error) {
            console.error('Hata:', error);
            alert('Hata oluştu: ' + error.message);
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

