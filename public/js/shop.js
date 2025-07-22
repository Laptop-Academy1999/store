// حالة التطبيق
const appState = {
    products: [],
    filteredProducts: [],
    currentPage: 1,
    itemsPerPage: 12,
    isLoading: false,
    filters: {
        searchQuery: '',
        sort: 'newest',
        category: 'all'
    }
};

// عناصر DOM
const elements = {
    productsContainer: document.getElementById('productsContainer'),
    searchInput: document.getElementById('searchInput'),
    sortSelect: document.getElementById('sortSelect'),
    resultsCount: document.getElementById('resultsCount'),
    paginationContainer: document.getElementById('paginationContainer'),
    filterButtons: document.querySelectorAll('.filter-btn')
};

// تهيئة المتجر
async function initStore() {
    try {
        appState.isLoading = true;
        showLoading();
        
        const response = await fetch('/api/products');
        
        if (!response.ok) {
            throw new Error(`خطأ في الشبكة: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.products || !Array.isArray(data.products)) {
            throw new Error('تنسيق البيانات غير صحيح');
        }
        
        appState.products = data.products;
        appState.filteredProducts = [...appState.products];
        
        renderProducts();
        renderPagination();
        updateResultsCount();
        
    } catch (error) {
        console.error('فشل تحميل المنتجات:', error);
        showError(error.message);
    } finally {
        appState.isLoading = false;
    }
}

// عرض المنتجات
function renderProducts() {
    const start = (appState.currentPage - 1) * appState.itemsPerPage;
    const end = start + appState.itemsPerPage;
    const productsToShow = appState.filteredProducts.slice(start, end);
    
    if (productsToShow.length === 0) {
        elements.productsContainer.innerHTML = `
            <div class="no-products">
                <i class="fas fa-box-open"></i>
                <h3>لا توجد منتجات متاحة</h3>
                <p>لم نتمكن من العثور على منتجات تطابق معايير البحث</p>
            </div>
        `;
        return;
    }
    
    elements.productsContainer.innerHTML = productsToShow.map(product => `
        <div class="product-card" data-id="${product.id}">
            <div class="product-image">
                <img src="${getProductImageUrl(product)}" 
                     alt="${product.name}" 
                     loading="lazy"
                     onerror="this.src='images/products/default-product.webp'">
                <div class="product-badges">
                    ${product.discount > 0 ? `
                        <span class="badge discount">خصم ${product.discount}%</span>
                    ` : ''}
                    ${product.condition === 'مستعمل' ? `
                        <span class="badge used">مستعمل</span>
                    ` : '<span class="badge new">جديد</span>'}
                </div>
            </div>
            <div class="product-info">
                <h3 class="product-title">${product.name}</h3>
                <div class="product-meta">
                    <span class="product-brand">${product.brand || 'غير محدد'}</span>
                    <span class="product-stock">${product.stock || 0} متوفر</span>
                </div>
                <div class="product-price">
                    ${product.discount > 0 ? `
                        <span class="original-price">${product.originalPrice?.toLocaleString() || product.price.toLocaleString()} ج.م</span>
                    ` : ''}
                    <span class="current-price">${calculateFinalPrice(product).toLocaleString()} ج.م</span>
                </div>
                <button class="btn btn-primary add-to-cart-btn">
                    <i class="fas fa-shopping-cart"></i> أضف إلى السلة
                </button>
            </div>
        </div>
    `).join('');
    
    initProductEvents();
}

// مساعدات العرض
function getProductImageUrl(product) {
    if (!product.image) return '/images/products/default-product.webp';

    let image = product.image.replace(/\\/g, '/');

    if (image.startsWith('/public/')) {
        image = image.replace('/public', '');
    } else if (image.startsWith('public/')) {
        image = image.replace('public/', '');
    }

    if (image.startsWith('/uploads') || image.startsWith('uploads')) {
        return image.startsWith('/') ? image : '/' + image;
    }

    if (image.startsWith('http')) {
        return image;
    }

    return `/uploads/${image}`;
}

function calculateFinalPrice(product) {
    if (product.discount > 0) {
        return product.price * (1 - product.discount / 100);
    }
    return product.price;
}

// الترقيم
function renderPagination() {
    const totalPages = Math.ceil(appState.filteredProducts.length / appState.itemsPerPage);
    
    if (totalPages <= 1) {
        elements.paginationContainer.innerHTML = '';
        return;
    }
    
    let paginationHTML = `
        <button class="page-btn prev-btn" ${appState.currentPage === 1 ? 'disabled' : ''}>
            <i class="fas fa-chevron-right"></i> السابق
        </button>
    `;
    
    for (let i = 1; i <= totalPages; i++) {
        paginationHTML += `
            <button class="page-number ${i === appState.currentPage ? 'active' : ''}" 
                    data-page="${i}">${i}</button>
        `;
    }
    
    paginationHTML += `
        <button class="page-btn next-btn" ${appState.currentPage === totalPages ? 'disabled' : ''}>
            التالي <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    elements.paginationContainer.innerHTML = paginationHTML;
    
    // أحداث الترقيم
    document.querySelector('.prev-btn')?.addEventListener('click', goToPrevPage);
    document.querySelector('.next-btn')?.addEventListener('click', goToNextPage);
    
    document.querySelectorAll('.page-number').forEach(btn => {
        btn.addEventListener('click', () => {
            appState.currentPage = parseInt(btn.dataset.page);
            renderProducts();
            renderPagination();
            window.scrollTo({top: 0, behavior: 'smooth'});
        });
    });
}

function goToPrevPage() {
    if (appState.currentPage > 1) {
        appState.currentPage--;
        renderProducts();
        renderPagination();
    }
}

function goToNextPage() {
    const totalPages = Math.ceil(appState.filteredProducts.length / appState.itemsPerPage);
    if (appState.currentPage < totalPages) {
        appState.currentPage++;
        renderProducts();
        renderPagination();
    }
}

// البحث والتصفية
function initSearchAndSort() {
    elements.searchInput.addEventListener('input', () => {
        appState.filters.searchQuery = elements.searchInput.value.trim().toLowerCase();
        filterProducts();
    });
    
    elements.sortSelect.addEventListener('change', () => {
        appState.filters.sort = elements.sortSelect.value;
        filterProducts();
    });
}

function filterProducts() {
    // تصفية حسب البحث
    appState.filteredProducts = appState.products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(appState.filters.searchQuery) ||
                            (product.brand && product.brand.toLowerCase().includes(appState.filters.searchQuery));
        
        return matchesSearch;
    });
    
    // الترتيب
    sortProducts();
    
    // إعادة التعيين إلى الصفحة الأولى
    appState.currentPage = 1;
    
    // إعادة العرض
    renderProducts();
    renderPagination();
    updateResultsCount();
}

function sortProducts() {
    switch(appState.filters.sort) {
        case 'price-asc':
            appState.filteredProducts.sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            appState.filteredProducts.sort((a, b) => b.price - a.price);
            break;
        default: // newest
            appState.filteredProducts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
}

// تحديث العداد
function updateResultsCount() {
    const count = appState.filteredProducts.length;
    elements.resultsCount.textContent = `عرض ${count} منتج${count !== 1 ? 'ات' : ''}`;
}

// أحداث المنتجات
function initProductEvents() {
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const productId = this.closest('.product-card').dataset.id;
            addToCart(productId);
        });
    });
}

function addToCart(productId) {
    const product = appState.products.find(p => p.id == productId);
    if (!product) return;
    
    console.log('تمت إضافة المنتج إلى السلة:', product.name);
    // هنا يمكنك إضافة منطق إضافة إلى السلة الحقيقية
    
    // عرض تنبيه
    showToast(`تمت إضافة ${product.name} إلى السلة`);
    
    // تحديث عداد السلة
    updateCartCount();
}

function updateCartCount() {
    // هنا يمكنك تحديث العداد بناءً على سلة التسوق الفعلية
    const cartCount = document.querySelector('.cart-count');
    const currentCount = parseInt(cartCount.textContent) || 0;
    cartCount.textContent = currentCount + 1;
}

// مساعدات الواجهة
function showLoading() {
    elements.productsContainer.innerHTML = `
        <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <p>جاري تحميل المنتجات...</p>
        </div>
    `;
}

function showError(message) {
    elements.productsContainer.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>حدث خطأ</h3>
            <p>${message}</p>
            <button class="btn btn-outline retry-btn">إعادة المحاولة</button>
        </div>
    `;
    
    document.querySelector('.retry-btn').addEventListener('click', initStore);
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// تهيئة الأحداث
function initEventListeners() {
    // إظهار/إخفاء زر العودة للأعلى
    window.addEventListener('scroll', () => {
        const scrollBtn = document.querySelector('.back-to-top');
        if (window.scrollY > 300) {
            scrollBtn.style.display = 'block';
        } else {
            scrollBtn.style.display = 'none';
        }
    });
    
    // زر العودة للأعلى
    document.querySelector('.back-to-top').addEventListener('click', () => {
        window.scrollTo({top: 0, behavior: 'smooth'});
    });
}

// بدء التطبيق
document.addEventListener('DOMContentLoaded', () => {
    initStore();
    initSearchAndSort();
    initEventListeners();
});

















// تهيئة المتجر
async function initStore() {
    try {
        appState.isLoading = true;
        showLoading();
        
        const response = await fetch('/api/products');
        
        if (!response.ok) {
            throw new Error(`خطأ في الشبكة: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.products || !Array.isArray(data.products)) {
            throw new Error('تنسيق البيانات غير صحيح');
        }
        
        appState.products = data.products;
        appState.filteredProducts = [...appState.products];
        
        renderProducts();
        renderPagination();
        updateResultsCount();
        
    } catch (error) {
        console.error('فشل تحميل المنتجات:', error);
        showError(error.message);
    } finally {
        appState.isLoading = false;
    }
}

// عرض المنتجات
function renderProducts() {
    const start = (appState.currentPage - 1) * appState.itemsPerPage;
    const end = start + appState.itemsPerPage;
    const productsToShow = appState.filteredProducts.slice(start, end);
    
    if (productsToShow.length === 0) {
        elements.productsContainer.innerHTML = `
            <div class="no-products">
                <i class="fas fa-box-open"></i>
                <h3>لا توجد منتجات متاحة</h3>
                <p>لم نتمكن من العثور على منتجات تطابق معايير البحث</p>
            </div>
        `;
        return;
    }
    
    elements.productsContainer.innerHTML = productsToShow.map(product => {
        const imageUrl = getProductImageUrl(product);
        console.log(`صورة المنتج ${product.id}:`, {
            name: product.name,
            storedPath: product.image,
            resolvedUrl: imageUrl
        });
        
        return `
        <div class="product-card" data-id="${product.id}">
            <div class="product-image">
                <img src="${getProductImageUrl(product)}" 
                    alt="${product.name}" 
                    loading="lazy"
                    onerror="this.onerror=null;this.src='/images/products/default-product.webp'">
                <div class="product-badges">
                    ${product.discount > 0 ? `
                        <span class="badge discount">خصم ${product.discount}%</span>
                    ` : ''}
                    ${product.condition === 'مستعمل' ? `
                        <span class="badge used">مستعمل</span>
                    ` : '<span class="badge new">جديد</span>'}
                </div>
            </div>
            <div class="product-info">
                <h3 class="product-title">${product.name}</h3>
                <div class="product-meta">
                    <span class="product-brand">${product.brand || 'غير محدد'}</span>
                    <span class="product-stock">${product.stock || 0} متوفر</span>
                </div>
                <div class="product-price">
                    ${product.discount > 0 ? `
                        <span class="original-price">${product.originalPrice?.toLocaleString() || product.price.toLocaleString()} ج.م</span>
                    ` : ''}
                    <span class="current-price">${calculateFinalPrice(product).toLocaleString()} ج.م</span>
                </div>
                <button class="btn btn-primary add-to-cart-btn">
                    <i class="fas fa-shopping-cart"></i> أضف إلى السلة
                </button>
            </div>
        </div>
        `;
    }).join('');
    
    initProductEvents();
}


function calculateFinalPrice(product) {
    if (product.discount > 0) {
        return product.price * (1 - product.discount / 100);
    }
    return product.price;
}

// الترقيم
function renderPagination() {
    const totalPages = Math.ceil(appState.filteredProducts.length / appState.itemsPerPage);
    
    if (totalPages <= 1) {
        elements.paginationContainer.innerHTML = '';
        return;
    }
    
    let paginationHTML = `
        <button class="page-btn prev-btn" ${appState.currentPage === 1 ? 'disabled' : ''}>
            <i class="fas fa-chevron-right"></i> السابق
        </button>
    `;
    
    // إظهار 5 صفحات كحد أقصى مع نقاط إذا كانت الصفحات كثيرة
    const maxVisiblePages = 5;
    let startPage, endPage;
    
    if (totalPages <= maxVisiblePages) {
        startPage = 1;
        endPage = totalPages;
    } else {
        const maxPagesBeforeCurrent = Math.floor(maxVisiblePages / 2);
        const maxPagesAfterCurrent = Math.ceil(maxVisiblePages / 2) - 1;
        
        if (appState.currentPage <= maxPagesBeforeCurrent) {
            startPage = 1;
            endPage = maxVisiblePages;
        } else if (appState.currentPage + maxPagesAfterCurrent >= totalPages) {
            startPage = totalPages - maxVisiblePages + 1;
            endPage = totalPages;
        } else {
            startPage = appState.currentPage - maxPagesBeforeCurrent;
            endPage = appState.currentPage + maxPagesAfterCurrent;
        }
    }
    
    // إضافة زر الصفحة الأولى إذا لزم الأمر
    if (startPage > 1) {
        paginationHTML += `<button class="page-number" data-page="1">1</button>`;
        if (startPage > 2) {
            paginationHTML += `<span class="page-dots">...</span>`;
        }
    }
    
    // إضافة أرقام الصفحات
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <button class="page-number ${i === appState.currentPage ? 'active' : ''}" 
                    data-page="${i}">${i}</button>
        `;
    }
    
    // إضافة زر الصفحة الأخيرة إذا لزم الأمر
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHTML += `<span class="page-dots">...</span>`;
        }
        paginationHTML += `<button class="page-number" data-page="${totalPages}">${totalPages}</button>`;
    }
    
    paginationHTML += `
        <button class="page-btn next-btn" ${appState.currentPage === totalPages ? 'disabled' : ''}>
            التالي <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    elements.paginationContainer.innerHTML = paginationHTML;
    
    // أحداث الترقيم
    document.querySelector('.prev-btn')?.addEventListener('click', goToPrevPage);
    document.querySelector('.next-btn')?.addEventListener('click', goToNextPage);
    
    document.querySelectorAll('.page-number').forEach(btn => {
        btn.addEventListener('click', () => {
            appState.currentPage = parseInt(btn.dataset.page);
            renderProducts();
            renderPagination();
            window.scrollTo({top: 0, behavior: 'smooth'});
        });
    });
}

function goToPrevPage() {
    if (appState.currentPage > 1) {
        appState.currentPage--;
        renderProducts();
        renderPagination();
    }
}

function goToNextPage() {
    const totalPages = Math.ceil(appState.filteredProducts.length / appState.itemsPerPage);
    if (appState.currentPage < totalPages) {
        appState.currentPage++;
        renderProducts();
        renderPagination();
    }
}

// البحث والتصفية
function initSearchAndSort() {
    // البحث
    elements.searchInput.addEventListener('input', () => {
        appState.filters.searchQuery = elements.searchInput.value.trim().toLowerCase();
        filterProducts();
    });
    
    // الترتيب
    elements.sortSelect.addEventListener('change', () => {
        appState.filters.sort = elements.sortSelect.value;
        filterProducts();
    });
    
    // تصفية حسب الفئة
    elements.filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            elements.filterButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            appState.filters.category = this.dataset.filter;
            filterProducts();
        });
    });
}

function filterProducts() {
    // تصفية حسب البحث
    appState.filteredProducts = appState.products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(appState.filters.searchQuery) ||
                            (product.brand && product.brand.toLowerCase().includes(appState.filters.searchQuery));
        
        // تصفية حسب الفئة
        let matchesCategory = true;
        if (appState.filters.category !== 'all') {
            if (appState.filters.category === 'new') {
                matchesCategory = product.condition === 'جديد';
            } else if (appState.filters.category === 'used') {
                matchesCategory = product.condition === 'مستعمل';
            } else if (appState.filters.category === 'gaming') {
                matchesCategory = product.category === 'gaming';
            } else if (appState.filters.category === 'offers') {
                matchesCategory = product.discount > 0;
            }
        }
        
        return matchesSearch && matchesCategory;
    });
    
    // الترتيب
    sortProducts();
    
    // إعادة التعيين إلى الصفحة الأولى
    appState.currentPage = 1;
    
    // إعادة العرض
    renderProducts();
    renderPagination();
    updateResultsCount();
}

function sortProducts() {
    switch(appState.filters.sort) {
        case 'price-asc':
            appState.filteredProducts.sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            appState.filteredProducts.sort((a, b) => b.price - a.price);
            break;
        case 'rating':
            appState.filteredProducts.sort((a, b) => b.rating - a.rating);
            break;
        default: // newest
            appState.filteredProducts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
}

// تحديث العداد
function updateResultsCount() {
    const count = appState.filteredProducts.length;
    elements.resultsCount.textContent = `عرض ${count} منتج${count !== 1 ? 'ات' : ''}`;
}

// أحداث المنتجات
function initProductEvents() {
    // إضافة إلى السلة
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const productId = this.closest('.product-card').dataset.id;
            addToCart(productId);
        });
    });
    
    // إضافة إلى المفضلة
    document.querySelectorAll('.wishlist-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const icon = this.querySelector('i');
            icon.classList.toggle('far');
            icon.classList.toggle('fas');
            this.classList.toggle('active');
            
            const productId = this.closest('.product-card').dataset.id;
            toggleWishlist(productId);
        });
    });
    
    // عرض سريع
    document.querySelectorAll('.quick-view-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const productId = this.closest('.product-card').dataset.id;
            showQuickView(productId);
        });
    });
}

function addToCart(productId) {
    const product = appState.products.find(p => p.id == productId);
    if (!product) return;
    
    // هنا يمكنك إضافة منطق إضافة إلى السلة الحقيقية
    console.log('تمت إضافة المنتج إلى السلة:', product.name);
    
    // عرض تنبيه
    showToast(`تمت إضافة ${product.name} إلى السلة`);
    
    // تحديث عداد السلة
    updateCartCount();
}

function toggleWishlist(productId) {
    const product = appState.products.find(p => p.id == productId);
    if (!product) return;
    
    // هنا يمكنك إضافة منطق إضافة/إزالة من المفضلة
    console.log('تم تحديث قائمة المفضلة:', product.name);
    
    // عرض تنبيه
    const isInWishlist = document.querySelector(`.wishlist-btn[data-id="${productId}"]`).classList.contains('active');
    showToast(isInWishlist ? 
        `تمت إضافة ${product.name} إلى المفضلة` : 
        `تمت إزالة ${product.name} من المفضلة`);
    
    // تحديث عداد المفضلة
    updateWishlistCount();
}

function showQuickView(productId) {
    const product = appState.products.find(p => p.id == productId);
    if (!product) return;
    
    // هنا يمكنك إضافة منطق العرض السريع
    console.log('عرض سريع للمنتج:', product.name);
    
    // يمكنك فتح modal أو عرض تفاصيل المنتج
    alert(`عرض سريع لـ: ${product.name}\nالسعر: ${calculateFinalPrice(product).toLocaleString()} ج.م`);
}

function updateCartCount() {
    // هنا يمكنك تحديث العداد بناءً على سلة التسوق الفعلية
    const cartCount = document.querySelector('.cart-count');
    const currentCount = parseInt(cartCount.textContent) || 0;
    cartCount.textContent = currentCount + 1;
}

function updateWishlistCount() {
    // هنا يمكنك تحديث العداد بناءً على المفضلة الفعلية
    const wishlistCount = document.querySelector('.wishlist-count');
    const currentCount = parseInt(wishlistCount.textContent) || 0;
    const isAdding = document.querySelector('.wishlist-btn.active') !== null;
    wishlistCount.textContent = isAdding ? currentCount + 1 : Math.max(0, currentCount - 1);
}

// مساعدات الواجهة
function showLoading() {
    elements.productsContainer.innerHTML = `
        <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <p>جاري تحميل المنتجات...</p>
        </div>
    `;
}

function showError(message) {
    elements.productsContainer.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>حدث خطأ</h3>
            <p>${message}</p>
            <button class="btn btn-outline retry-btn">إعادة المحاولة</button>
        </div>
    `;
    
    document.querySelector('.retry-btn').addEventListener('click', initStore);
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// تهيئة الأحداث
function initEventListeners() {
    // إظهار/إخفاء زر العودة للأعلى
    window.addEventListener('scroll', () => {
        const scrollBtn = document.querySelector('.back-to-top');
        if (window.scrollY > 300) {
            scrollBtn.style.display = 'block';
        } else {
            scrollBtn.style.display = 'none';
        }
    });
    
    // زر العودة للأعلى
    document.querySelector('.back-to-top').addEventListener('click', () => {
        window.scrollTo({top: 0, behavior: 'smooth'});
    });
}

// بدء التطبيق
document.addEventListener('DOMContentLoaded', () => {
    initStore();
    initSearchAndSort();
    initEventListeners();
});