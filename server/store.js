const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// مسار لوحة التحكم
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/admin/index.html'));
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));
app.use(express.static('public'));

// تهيئة multer لرفع الملفات
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'public/uploads/'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, uniqueSuffix + ext);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('نوع الملف غير مدعوم. يرجى رفع صورة بصيغة JPEG, JPG, PNG أو WEBP'));
        }
    }
});

// الاتصال بقاعدة البيانات
const db = new sqlite3.Database('./store.db', (err) => {
    if (err) {
        console.error('Error connecting to database:', err.message);
    } else {
        console.log('✅ Connected to SQLite database');
    }
});

// إنشاء الجداول
db.serialize(() => {
    // جدول المنتجات
    db.run(`
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            brand TEXT,
            condition TEXT CHECK(condition IN ('جديد', 'مستعمل')),
            price REAL NOT NULL,
            original_price REAL,
            discount REAL DEFAULT 0,
            stock INTEGER DEFAULT 0,
            image TEXT,
            description TEXT,
            ram INTEGER,
            storage INTEGER,
            cpu TEXT,
            gpu TEXT,
            screen_size REAL,
            rating REAL DEFAULT 0,
            reviews_count INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
    
    // جدول العروض الخاصة
    db.run(`
        CREATE TABLE IF NOT EXISTS special_offers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER,
            discount REAL NOT NULL,
            start_date DATETIME NOT NULL,
            end_date DATETIME NOT NULL,
            FOREIGN KEY(product_id) REFERENCES products(id)
        )
    `);
    
    // جدول المفضلة (يمكن الاحتفاظ به أو حذفه حسب الحاجة)
    db.run(`
        CREATE TABLE IF NOT EXISTS wishlist (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            product_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(product_id) REFERENCES products(id),
            UNIQUE(user_id, product_id)
        )
    `);
});

// Routes

// جلب جميع المنتجات
app.get('/api/products', (req, res) => {
    const { page = 1, limit = 12, sort = 'newest', search, minPrice, maxPrice, brands, condition } = req.query;
    const offset = (page - 1) * limit;
    
    let query = 'SELECT * FROM products WHERE 1=1';
    let params = [];
    
    if (search) {
        query += ' AND name LIKE ?';
        params.push(`%${search}%`);
    }
    
    if (minPrice) {
        query += ' AND price >= ?';
        params.push(minPrice);
    }
    
    if (maxPrice) {
        query += ' AND price <= ?';
        params.push(maxPrice);
    }
    
    if (brands && brands.length > 0) {
        const brandsArray = brands.split(',');
        query += ` AND brand IN (${brandsArray.map(() => '?').join(',')})`;
        params = params.concat(brandsArray);
    }
    
    if (condition) {
        query += ' AND condition = ?';
        params.push(condition);
    }
    
    switch(sort) {
        case 'price-asc':
            query += ' ORDER BY price ASC';
            break;
        case 'price-desc':
            query += ' ORDER BY price DESC';
            break;
        case 'rating':
            query += ' ORDER BY rating DESC';
            break;
        default:
            query += ' ORDER BY created_at DESC';
    }
    
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    db.all(query, params, (err, products) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        db.get('SELECT COUNT(*) as total FROM products', (err, count) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            
            res.json({
                products,
                total: count.total,
                totalPages: Math.ceil(count.total / limit),
                currentPage: parseInt(page)
            });
        });
    });
});

// جلب منتج معين
app.get('/api/products/:id', (req, res) => {
    const { id } = req.params;
    
    db.get('SELECT * FROM products WHERE id = ?', [id], (err, product) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        if (!product) {
            return res.status(404).json({ error: 'المنتج غير موجود' });
        }
        
        res.json(product);
    });
});

// إضافة منتج جديد
app.post('/api/products', upload.single('image'), (req, res) => {
    const { 
        name, 
        brand, 
        condition, 
        price, 
        originalPrice, 
        discount, 
        stock, 
        description,
        ram,
        storage,
        cpu,
        gpu,
        screenSize
    } = req.body;
    
    const image = req.file ? `/uploads/${req.file.filename}` : null;
    
    if (!name || !price) {
        return res.status(400).json({ error: 'الاسم والسعر مطلوبان' });
    }
    
    db.run(`
        INSERT INTO products (
            name, brand, condition, price, original_price, discount, stock, 
            image, description, ram, storage, cpu, gpu, screen_size
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
        name, brand, condition, price, originalPrice, discount, stock, 
        image, description, ram, storage, cpu, gpu, screenSize
    ], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        res.json({ 
            id: this.lastID,
            message: 'تمت إضافة المنتج بنجاح'
        });
    });
});

// تحديث منتج
app.put('/api/products/:id', upload.single('image'), (req, res) => {
    const { id } = req.params;
    const { 
        name, 
        brand, 
        condition, 
        price, 
        originalPrice, 
        discount, 
        stock, 
        description,
        ram,
        storage,
        cpu,
        gpu,
        screenSize
    } = req.body;
    
    let image;
    if (req.file) {
        image = `/uploads/${req.file.filename}`;
    }
    
    db.run(`
        UPDATE products SET 
            name = ?, 
            brand = ?, 
            condition = ?, 
            price = ?, 
            original_price = ?, 
            discount = ?, 
            stock = ?, 
            ${image ? 'image = ?,' : ''}
            description = ?,
            ram = ?,
            storage = ?,
            cpu = ?,
            gpu = ?,
            screen_size = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `, [
        name, brand, condition, price, originalPrice, discount, stock,
        ...(image ? [image] : []),
        description, ram, storage, cpu, gpu, screenSize, id
    ], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        res.json({ 
            message: 'تم تحديث المنتج بنجاح',
            changes: this.changes
        });
    });
});

// حذف منتج
app.delete('/api/products/:id', (req, res) => {
    const { id } = req.params;
    
    db.run('DELETE FROM products WHERE id = ?', [id], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'المنتج غير موجود' });
        }
        
        res.json({ message: 'تم حذف المنتج بنجاح' });
    });
});

// جلب العروض الخاصة
app.get('/api/special-offers', (req, res) => {
    const currentDate = new Date().toISOString();
    
    db.all(`
        SELECT p.*, o.discount 
        FROM products p
        JOIN special_offers o ON p.id = o.product_id
        WHERE o.start_date <= ? AND o.end_date >= ?
        ORDER BY o.discount DESC
        LIMIT 5
    `, [currentDate, currentDate], (err, offers) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        res.json(offers.map(offer => ({
            ...offer,
            price: offer.price * (1 - offer.discount / 100)
        })));
    });
});

// البحث عن المنتجات
app.get('/api/search', (req, res) => {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
        return res.json([]);
    }
    
    db.all(`
        SELECT id, name, image, price 
        FROM products 
        WHERE name LIKE ? 
        ORDER BY name 
        LIMIT 5
    `, [`%${q}%`], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        res.json(results);
    });
});

// معالجة الأخطاء
app.use((err, req, res, next) => {
    console.error(err.stack);
    
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: 'خطأ في رفع الملف: ' + err.message });
    } else if (err) {
        return res.status(500).json({ error: err.message });
    }
    
    next();
});

// بدء الخادم
app.listen(port, () => {
    console.log(`✅ الخادم يعمل على: http://localhost:${port}`);
});