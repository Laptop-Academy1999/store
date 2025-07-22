import { API_BASE_URL } from '../config.js';

class AdminPanel {
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 10;
        
        this.initElements();
        this.checkAuth();
        this.initEvents();
    }
    
    initElements() {
        // العناصر الرئيسية
        this.loginPage = document.getElementById('login-page');
        this.adminContainer = document.querySelector('.admin-container');
        
        // عناصر الجدول
        this.productsTableBody = document.getElementById('products-table-body');
        this.addProductBtn = document.getElementById('add-product-btn');
        
        // عناصر Modal المنتج
        this.productModal = document.getElementById('product-modal');
        this.productForm = document.getElementById('product-form');
        this.modalTitle = document.getElementById('modal-title');
        this.productIdInput = document.getElementById('product-id');
        this.productNameInput = document.getElementById('product-name');
        this.productBrandSelect = document.getElementById('product-brand');
        this.productConditionSelect = document.getElementById('product-condition');
        this.productPriceInput = document.getElementById('product-price');
        this.productOriginalPriceInput = document.getElementById('product-original-price');
        this.productDiscountInput = document.getElementById('product-discount');
        this.productStockInput = document.getElementById('product-stock');
        this.productRamInput = document.getElementById('product-ram');
        this.productStorageInput = document.getElementById('product-storage');
        this.productImageInput = document.getElementById('product-image');
        this.imagePreview = document.getElementById('image-preview');
        this.productDescriptionTextarea = document.getElementById('product-description');
        
        // عناصر الترقيم
        this.prevPageBtn = document.getElementById('prev-page');
        this.nextPageBtn = document.getElementById('next-page');
        this.pageNumbersContainer = document.getElementById('page-numbers');
    }
    
    checkAuth() {
        this.showAdminPanel();
        this.loadProducts();
    }

    initEvents() {
        // إضافة منتج جديد
        this.addProductBtn.addEventListener('click', () => {
            this.openProductModal();
        });
        
        // إغلاق Modal
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeProductModal();
            });
        });
        
        // عند النقر خارج Modal
        this.productModal.addEventListener('click', (e) => {
            if (e.target === this.productModal) {
                this.closeProductModal();
            }
        });
        
        // معاينة الصورة
        this.productImageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    this.imagePreview.innerHTML = `
                        <img src="${event.target.result}" alt="معاينة الصورة">
                        <button type="button" class="remove-image-btn">
                            <i class="fas fa-times"></i>
                        </button>
                    `;
                    
                    document.querySelector('.remove-image-btn').addEventListener('click', () => {
                        this.imagePreview.innerHTML = '';
                        this.productImageInput.value = '';
                    });
                };
                reader.readAsDataURL(file);
            }
        });
        
        // حفظ المنتج
        this.productForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProduct();
        });
        
        // الترقيم
        this.prevPageBtn.addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.loadProducts();
            }
        });
        
        this.nextPageBtn.addEventListener('click', () => {
            this.currentPage++;
            this.loadProducts();
        });
    }
    
    showAdminPanel() {
        this.adminContainer.style.display = 'flex';
    }
    
    loadProducts() {
        fetch(`${API_BASE_URL}/api/products?page=${this.currentPage}&limit=${this.itemsPerPage}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('فشل في جلب المنتجات');
            }
            return response.json();
        })
        .then(data => {
            this.renderProducts(data.products);
            this.renderPagination(data.total, data.totalPages);
        })
        .catch(error => {
            console.error('Error:', error);
            alert('حدث خطأ أثناء جلب المنتجات');
        });
    }
    
    renderProducts(products) {
        this.productsTableBody.innerHTML = products.map(product => `
            <tr>
                <td>
                    <img src="${product.image || '../images/products/default-product.webp'}" 
                         alt="${product.name}" 
                         class="product-thumbnail">
                </td>
                <td>${product.name}</td>
                <td>${product.brand || '-'}</td>
                <td>${product.price.toLocaleString()} ج.م</td>
                <td>${product.stock}</td>
                <td>
                    <span class="status-badge ${product.condition === 'جديد' ? 'new' : 'used'}">
                        ${product.condition}
                    </span>
                </td>
                <td>
                    <button class="action-btn edit-btn" data-id="${product.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" data-id="${product.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
        // تهيئة أحداث الأزرار
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.editProduct(btn.dataset.id);
            });
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.deleteProduct(btn.dataset.id);
            });
        });
    }
    
    renderPagination(totalItems, totalPages) {
        this.prevPageBtn.disabled = this.currentPage === 1;
        this.nextPageBtn.disabled = this.currentPage === totalPages;
        
        let pagesHTML = '';
        const maxVisiblePages = 5;
        let startPage, endPage;
        
        if (totalPages <= maxVisiblePages) {
            startPage = 1;
            endPage = totalPages;
        } else {
            const maxPagesBeforeCurrent = Math.floor(maxVisiblePages / 2);
            const maxPagesAfterCurrent = Math.ceil(maxVisiblePages / 2) - 1;
            
            if (this.currentPage <= maxPagesBeforeCurrent) {
                startPage = 1;
                endPage = maxVisiblePages;
            } else if (this.currentPage + maxPagesAfterCurrent >= totalPages) {
                startPage = totalPages - maxVisiblePages + 1;
                endPage = totalPages;
            } else {
                startPage = this.currentPage - maxPagesBeforeCurrent;
                endPage = this.currentPage + maxPagesAfterCurrent;
            }
        }
        
        if (startPage > 1) {
            pagesHTML += `<span class="page-number" data-page="1">1</span>`;
            if (startPage > 2) {
                pagesHTML += `<span class="page-dots">...</span>`;
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            pagesHTML += `
                <span class="page-number ${i === this.currentPage ? 'active' : ''}" data-page="${i}">
                    ${i}
                </span>
            `;
        }
        
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                pagesHTML += `<span class="page-dots">...</span>`;
            }
            pagesHTML += `<span class="page-number" data-page="${totalPages}">${totalPages}</span>`;
        }
        
        this.pageNumbersContainer.innerHTML = pagesHTML;
        
        document.querySelectorAll('.page-number').forEach(page => {
            page.addEventListener('click', () => {
                this.currentPage = parseInt(page.dataset.page);
                this.loadProducts();
            });
        });
    }
    
    openProductModal(product = null) {
        if (product) {
            this.modalTitle.textContent = 'تعديل المنتج';
            this.productIdInput.value = product.id;
            this.productNameInput.value = product.name;
            this.productBrandSelect.value = product.brand || '';
            this.productConditionSelect.value = product.condition;
            this.productPriceInput.value = product.price;
            this.productOriginalPriceInput.value = product.original_price || '';
            this.productDiscountInput.value = product.discount || '';
            this.productStockInput.value = product.stock;
            this.productRamInput.value = product.ram || '';
            this.productStorageInput.value = product.storage || '';
            this.productDescriptionTextarea.value = product.description || '';
            
            if (product.image) {
                this.imagePreview.innerHTML = `
                    <img src="${product.image}" alt="صورة المنتج">
                    <button type="button" class="remove-image-btn">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                
                document.querySelector('.remove-image-btn').addEventListener('click', () => {
                    this.imagePreview.innerHTML = '';
                });
            } else {
                this.imagePreview.innerHTML = '';
            }
        } else {
            this.modalTitle.textContent = 'إضافة منتج جديد';
            this.productForm.reset();
            this.imagePreview.innerHTML = '';
        }
        
        this.productModal.style.display = 'flex';
    }
    
    closeProductModal() {
        this.productModal.style.display = 'none';
    }
    
    editProduct(productId) {
        fetch(`${API_BASE_URL}/api/products/${productId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('فشل في جلب بيانات المنتج');
            }
            return response.json();
        })
        .then(product => {
            this.openProductModal(product);
        })
        .catch(error => {
            console.error('Error:', error);
            alert('حدث خطأ أثناء جلب بيانات المنتج');
        });
    }
    
    saveProduct() {
        const formData = new FormData();
        const productId = this.productIdInput.value;
        
        formData.append('name', this.productNameInput.value);
        formData.append('brand', this.productBrandSelect.value);
        formData.append('condition', this.productConditionSelect.value);
        formData.append('price', this.productPriceInput.value);
        formData.append('originalPrice', this.productOriginalPriceInput.value);
        formData.append('discount', this.productDiscountInput.value);
        formData.append('stock', this.productStockInput.value);
        formData.append('ram', this.productRamInput.value);
        formData.append('storage', this.productStorageInput.value);
        formData.append('description', this.productDescriptionTextarea.value);
        
        if (this.productImageInput.files[0]) {
            formData.append('image', this.productImageInput.files[0]);
        }
        
        const url = productId ? 
            `${API_BASE_URL}/api/products/${productId}` : 
            `${API_BASE_URL}/api/products`;
            
        const method = productId ? 'PUT' : 'POST';
        
        fetch(url, {
            method: method,
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('فشل في حفظ المنتج');
            }
            return response.json();
        })
        .then(data => {
            alert(productId ? 'تم تحديث المنتج بنجاح' : 'تمت إضافة المنتج بنجاح');
            this.closeProductModal();
            this.loadProducts();
        })
        .catch(error => {
            console.error('Error:', error);
            alert('حدث خطأ أثناء حفظ المنتج');
        });
    }
    
    deleteProduct(productId) {
        if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
            return;
        }
        
        fetch(`${API_BASE_URL}/api/products/${productId}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('فشل في حذف المنتج');
            }
            return response.json();
        })
        .then(data => {
            alert('تم حذف المنتج بنجاح');
            this.loadProducts();
        })
        .catch(error => {
            console.error('Error:', error);
            alert('حدث خطأ أثناء حذف المنتج');
        });
    }
}

// بدء التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    new AdminPanel();
});