const express = require('express');
const app = express();
const produkRoutes = require('./routes/produkdb.js'); 
require('dotenv').config();
const port = process.env.PORT;
const db = require('./database/db');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const authRoutes = require('./routes/authRoutes');
const { isAuthenticated } = require('./middlewares/middleware.js');


app.use('/public', express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(expressLayouts);
app.use(express.json());
app.use('/uploads', express.static('uploads'));


app.use(session({
    secret: process.env.SESSION_SECRET, 
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));


app.use('/', authRoutes);


app.use('/produk', produkRoutes); 

app.set('view engine', 'ejs');


app.get('/', isAuthenticated, (req, res) => {
    res.render('index', {
        layout: 'layouts/main-layout'
    });
});

app.get('/contact', isAuthenticated, (req, res) => {
    res.render('contact', {
        layout: 'layouts/main-layout'
    });
});


app.get('/produk-view', isAuthenticated, (req, res) => {
    db.query('SELECT * FROM produk', (err, produk) => {
        if (err) return res.status(500).send('Internal Server Error');
        res.render('produk', {
            layout: 'layouts/main-layout',
            produk: produk
        });
    });
});


app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
