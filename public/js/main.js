// تنشيط القائمة المنسدلة للهواتف
document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    const searchBox = document.querySelector('.search-box');
    
    menuToggle.addEventListener('click', function() {
        navLinks.classList.toggle('active');
        searchBox.classList.toggle('active');
        menuToggle.classList.toggle('active');
    });
    
    // إغلاق القائمة عند النقر على رابط
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            menuToggle.classList.remove('active');
        });
    });
    
    // تنشيط البحث
    const searchInput = document.querySelector('.search-box input');
    const searchSuggestions = document.querySelector('.search-suggestions');
    
    searchInput.addEventListener('focus', function() {
        searchSuggestions.classList.add('active');
    });
    
    searchInput.addEventListener('blur', function() {
        setTimeout(() => {
            searchSuggestions.classList.remove('active');
        }, 200);
    });
    
    // تنشيط الأسئلة الشائعة
    document.querySelectorAll('.faq-question').forEach(question => {
        question.addEventListener('click', () => {
            const answer = question.nextElementSibling;
            const icon = question.querySelector('i');
            
            question.classList.toggle('active');
            answer.classList.toggle('active');
            icon.classList.toggle('fa-chevron-down');
            icon.classList.toggle('fa-chevron-up');
        });
    });
    
    // عداد تنازلي للعروض
    function updateOfferTimer() {
        const now = new Date();
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 0);
        
        const diff = endOfDay - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
        document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
        document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
    }
    
    setInterval(updateOfferTimer, 1000);
    updateOfferTimer();
    
    // عدادات الإحصائيات
    function animateCounters() {
        const statNumbers = document.querySelectorAll('.stat-number');
        
        statNumbers.forEach(stat => {
            const target = parseInt(stat.getAttribute('data-count'));
            const duration = 2000;
            const step = target / (duration / 16);
            let current = 0;
            
            const counter = setInterval(() => {
                current += step;
                if (current >= target) {
                    clearInterval(counter);
                    stat.textContent = target;
                } else {
                    stat.textContent = Math.floor(current);
                }
            }, 16);
        });
    }
    
    // تنشيط عند التمرير
    window.addEventListener('scroll', function() {
        // شريط التنقل
        if (window.scrollY > 50) {
            document.querySelector('.navbar').classList.add('scrolled');
        } else {
            document.querySelector('.navbar').classList.remove('scrolled');
        }
        
        // زر العودة للأعلى
        if (window.scrollY > 300) {
            document.querySelector('.back-to-top').classList.add('active');
        } else {
            document.querySelector('.back-to-top').classList.remove('active');
        }
        
        // تحريك العدادات عند ظهورها
        const statsSection = document.querySelector('.hero-stats');
        if (isElementInViewport(statsSection)) {
            animateCounters();
            window.removeEventListener('scroll', this);
        }
    });
    
    function isElementInViewport(el) {
        const rect = el.getBoundingClientRect();
        return (
            rect.top <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.bottom >= 0
        );
    }
    
    // تنشيط ويدجت الدردشة
    const chatToggle = document.querySelector('.chat-toggle');
    const chatWidget = document.querySelector('.chat-widget');
    
    chatToggle.addEventListener('click', function() {
        chatWidget.classList.toggle('active');
    });
    
    // زر العودة للأعلى
    document.querySelector('.back-to-top').addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    // تصفية المنتجات
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const filter = this.getAttribute('data-filter');
            const products = document.querySelectorAll('.product-card');
            
            products.forEach(product => {
                if (filter === 'all' || product.classList.contains(filter)) {
                    product.style.display = 'block';
                } else {
                    product.style.display = 'none';
                }
            });
        });
    });
    
    // تحميل المنتجات
    function loadProducts() {
        fetch('data/products.json')
            .then(response => response.json())
            .then(data => {
                const latestProductsContainer = document.getElementById('latest-products');
                const specialOffersContainer = document.getElementById('special-offers');
                
                // عرض أحدث المنتجات
                data.latest.forEach(product => {
                    latestProductsContainer.appendChild(createProductCard(product));
                });
                
                // عرض العروض الخاصة
                data.specialOffers.forEach(product => {
                    specialOffersContainer.appendChild(createProductCard(product));
                });
            })
            .catch(error => console.error('Error loading products:', error));
    }
    
    function createProductCard(product) {
        const card = document.createElement('div');
        card.className = `product-card ${product.category}`;
        
        let badge = '';
        if (product.badge) {
            badge = `<div class="product-badge">${product.badge}</div>`;
        }
        
        card.innerHTML = `
            ${badge}
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}" loading="lazy">
                <div class="product-actions">
                    <button class="action-btn" aria-label="إضافة إلى المفضلة"><i class="far fa-heart"></i></button>
                    <button class="action-btn" aria-label="عرض سريع"><i class="far fa-eye"></i></button>
                    <button class="action-btn" aria-label="مقارنة"><i class="fas fa-exchange-alt"></i></button>
                </div>
            </div>
            <div class="product-info">
                <h3 class="product-title">${product.name}</h3>
                <div class="product-meta">
                    <span>${product.brand}</span>
                    <span>${product.condition}</span>
                </div>
                <span class="product-price">${product.price} ر.س</span>
                <div class="product-rating">
                    ${generateRatingStars(product.rating)}
                    <span>(${product.reviews})</span>
                </div>
                <button class="add-to-cart">
                    <i class="fas fa-shopping-cart"></i> أضف إلى السلة
                </button>
            </div>
        `;
        
        return card;
    }
    
    function generateRatingStars(rating) {
        let stars = '';
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        
        for (let i = 1; i <= 5; i++) {
            if (i <= fullStars) {
                stars += '<i class="fas fa-star"></i>';
            } else if (i === fullStars + 1 && hasHalfStar) {
                stars += '<i class="fas fa-star-half-alt"></i>';
            } else {
                stars += '<i class="far fa-star"></i>';
            }
        }
        
        return stars;
    }
    
    // تحميل المنتجات عند بدء التشغيل
    loadProducts();
});













// عداد التنازل للعروض
function updateTimer() {
    const now = new Date();
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 0);
    
    const diff = endOfDay - now;
    
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    document.getElementById('hours').textContent = String(hours).padStart(2, '0');
    document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
    document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
}

setInterval(updateTimer, 1000);
updateTimer();

// تصفية المنتجات
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        // إزالة النشط من جميع الأزرار
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        
        // إضافة النشط للزر المحدد
        this.classList.add('active');
        
        const filter = this.dataset.filter;
        const products = document.querySelectorAll('#latest-products .product-card');
        
        products.forEach(product => {
            if (filter === 'all' || product.dataset.category === filter) {
                product.style.display = 'block';
            } else {
                product.style.display = 'none';
            }
        });
    });
});

// تفعيل الأزرار التفاعلية
document.querySelectorAll('.wishlist-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        this.classList.toggle('active');
        this.querySelector('i').classList.toggle('fas');
        this.querySelector('i').classList.toggle('far');
    });
});

document.querySelectorAll('.quick-view-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const productCard = this.closest('.product-card');
        const productTitle = productCard.querySelector('.product-title').textContent;
        alert(`عرض سريع لـ: ${productTitle}`);
    });
});








// تفعيل ويدجت واتساب
document.addEventListener('DOMContentLoaded', function() {
    const whatsappToggle = document.getElementById('whatsappToggle');
    const whatsappOptions = document.querySelector('.whatsapp-options');
    
    // تبديل خيارات واتساب
    whatsappToggle.addEventListener('click', function() {
        this.classList.toggle('active');
        whatsappOptions.classList.toggle('active');
    });
    
    // إغلاق الخيارات عند النقر خارجها
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.whatsapp-widget')) {
            whatsappToggle.classList.remove('active');
            whatsappOptions.classList.remove('active');
        }
    });
    
    // تحديث العداد (يمكن استبداله ببيانات حقيقية)
    function updateUnreadCount() {
        // هنا يمكنك إضافة اتصال بAPI لمعرفة عدد الرسائل غير المقروءة
        const badge = document.querySelector('.notification-badge');
        // badge.textContent = newUnreadCount;
    }
    
    // تحديث كل 30 ثانية (اختياري)
    setInterval(updateUnreadCount, 30000);
});




// تفعيل زر العودة للأعلى
document.addEventListener('DOMContentLoaded', function() {
    const backToTopButton = document.querySelector('.back-to-top');
    
    // ظهور/اختفاء الزر عند التمرير
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            backToTopButton.classList.add('active');
        } else {
            backToTopButton.classList.remove('active');
        }
    });
    
    // التمرير السلس عند النقر
    backToTopButton.addEventListener('click', function(e) {
        e.preventDefault();
        
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
        
        // طريقة بديلة للتوافق مع المتصفحات القديمة
        // document.documentElement.scrollTop = 0;
    });
});


































