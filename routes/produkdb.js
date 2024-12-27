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
router.get('/:id', (req, res) => {
    const produkId = req.params.id;
    db.query('SELECT * FROM produk WHERE id = ?', [produkId], (err, results) => {
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
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null; // Save file path if an image exists

    // Validate input fields
    if (!nama_produk || nama_produk.trim() === '') {
        return res.status(400).send('Product name cannot be empty');
    }
    if (!deskripsi || deskripsi.trim() === '') {
        return res.status(400).send('Description cannot be empty');
    }
    if (!harga || harga.trim() === '') {
        return res.status(400).send('Price cannot be empty');
    }

    // Insert new product into the database
    db.query('INSERT INTO produk (nama_produk, deskripsi, harga, image_url) VALUES (?, ?, ?, ?)', 
    [nama_produk.trim(), deskripsi.trim(), harga.trim(), imageUrl], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Internal Server Error');
        }
        const newProduct = { 
            id: results.insertId, 
            nama_produk: nama_produk.trim(), 
            deskripsi: deskripsi.trim(), 
            harga: harga.trim(), 
            image_url: imageUrl 
        };
        res.status(201).json(newProduct); // Respond with 201 for successful creation
    });
});

// Endpoint to update an existing product
router.put('/:id', (req, res) => {
    const { nama_produk, deskripsi, harga } = req.body;
    const produkId = req.params.id;

    // Validate input fields
    if (!nama_produk || nama_produk.trim() === '') {
        return res.status(400).send('Product name cannot be empty');
    }
    if (!deskripsi || deskripsi.trim() === '') {
        return res.status(400).send('Description cannot be empty');
    }
    if (!harga || harga.trim() === '') {
        return res.status(400).send('Price cannot be empty');
    }

    // Update the product in the database
    db.query('UPDATE produk SET nama_produk = ?, deskripsi = ?, harga = ? WHERE id = ?', 
    [nama_produk.trim(), deskripsi.trim(), harga.trim(), produkId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Internal Server Error');
        }
        if (results.affectedRows === 0) {
            return res.status(404).send('Product not found');
        }
        res.json({ 
            id: produkId, 
            nama_produk: nama_produk.trim(), 
            deskripsi: deskripsi.trim(), 
            harga: harga.trim() 
        });
    });
});

// Endpoint to delete a product by ID
router.delete('/:id', (req, res) => {
    const produkId = req.params.id;

    // Delete the product from the database
    db.query('DELETE FROM produk WHERE id = ?', [produkId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Internal Server Error');
        }
        if (results.affectedRows === 0) {
            return res.status(404).send('Product not found');
        }
        res.status(204).send(); // No content response for successful deletion
    });
});

module.exports = router;
