const express = require('express');
const router = express.Router();
const db = require('../database/db'); // Assuming db.js exports a configured connection
const multer = require('multer');
const path = require('path');

// Setup file upload storage configuration with multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Store images in the 'uploads' folder
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
    }
});

const upload = multer({ storage: storage });

// Endpoint to get all products
router.get('/', (req, res) => {
    db.query('SELECT * FROM produk', (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Internal Server Error');
        }
        res.json(results);
    });
});

// Endpoint to get a product by ID
router.get('/:id_produk', (req, res) => {
    const produkId = req.params.id_produk;
    db.query('SELECT * FROM produk WHERE id_produk = ?', [produkId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Internal Server Error');
        }
        if (results.length === 0) {
            return res.status(404).send('Product not found');
        }
        res.json(results[0]);
    });
});

// Endpoint to add a new product with an image
router.post('/', upload.single('image'), (req, res) => {
    const { nama_produk, deskripsi, harga } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    // Validate input fields
    if (!nama_produk || !deskripsi || !harga) {
        return res.status(400).send('All fields are required.');
    }

    // Insert new product into the database
    db.query(
        'INSERT INTO produk (nama_produk, deskripsi, harga, image_url) VALUES (?, ?, ?, ?)',
        [nama_produk.trim(), deskripsi.trim(), harga.trim(), imageUrl],
        (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).send('Internal Server Error');
            }
            const newProduct = {
                id_produk: results.insertId,
                nama_produk: nama_produk.trim(),
                deskripsi: deskripsi.trim(),
                harga: harga.trim(),
                image_url: imageUrl
            };
            res.status(201).json(newProduct);
        }
    );
});

// Endpoint to update an existing product with optional image update
router.put('/:id_produk', upload.single('image'), (req, res) => {
    const { nama_produk, deskripsi, harga } = req.body;
    const produkId = req.params.id_produk;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const updateQuery = `
        UPDATE produk
        SET nama_produk = ?, deskripsi = ?, harga = ?, image_url = COALESCE(?, image_url)
        WHERE id_produk = ?
    `;
    const queryParams = [nama_produk.trim(), deskripsi.trim(), harga.trim(), imageUrl, produkId];

    db.query(updateQuery, queryParams, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Internal Server Error');
        }
        if (results.affectedRows === 0) {
            return res.status(404).send('Product not found');
        }
        res.json({
            id_produk: produkId,
            nama_produk: nama_produk.trim(),
            deskripsi: deskripsi.trim(),
            harga: harga.trim(),
            image_url: imageUrl || req.body.current_image_url, // Menggunakan gambar lama jika tidak ada yang baru
        });
    });
});


// Endpoint to delete a product by ID
router.delete('/:id_produk', (req, res) => {
    const produkId = req.params.id_produk;

    db.query('DELETE FROM produk WHERE id_produk = ?', [produkId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Internal Server Error');
        }
        if (results.affectedRows === 0) {
            return res.status(404).send('Product not found');
        }
        res.status(204).send();
    });
});

module.exports = router;
