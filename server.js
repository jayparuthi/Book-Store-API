const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const fs = require('fs');

const app = express();
app.use(express.json());
const PORT = 3000;
const SECRET_KEY = 'your_secret_key';

let books = JSON.parse(fs.readFileSync('books.json', 'utf8'));
let users = JSON.parse(fs.readFileSync('users.json', 'utf8'));

// Task 1: Get book list
app.get('/books', (req, res) => {
    res.json(books);
});

// Task 2: Get book by ISBN
app.get('/books/isbn/:isbn', (req, res) => {
    const book = books.find(b => b.isbn === req.params.isbn);
    book ? res.json(book) : res.status(404).send('Book not found');
});

// Task 3: Get books by Author
app.get('/books/author/:author', (req, res) => {
    const filteredBooks = books.filter(b => b.author === req.params.author);
    filteredBooks.length ? res.json(filteredBooks) : res.status(404).send('No books found');
});

// Task 4: Get books by Title
app.get('/books/title/:title', (req, res) => {
    const filteredBooks = books.filter(b => b.title.includes(req.params.title));
    filteredBooks.length ? res.json(filteredBooks) : res.status(404).send('No books found');
});

// Task 5: Get book review
app.get('/books/review/:isbn', (req, res) => {
    const book = books.find(b => b.isbn === req.params.isbn);
    book ? res.json({ review: book.review || 'No reviews yet' }) : res.status(404).send('Book not found');
});

// Task 6: Register new user
app.post('/register', (req, res) => {
    const { username, password } = req.body;
    if (users.find(u => u.username === username)) {
        return res.status(400).send('User already exists');
    }
    users.push({ username, password });
    fs.writeFileSync('users.json', JSON.stringify(users));
    res.send('User registered successfully');
});

// Task 7: Login user
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) return res.status(401).send('Invalid credentials');
    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token });
});

// Middleware for authentication
const authenticate = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).send('Token required');
    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).send('Invalid token');
        req.user = user;
        next();
    });
};

// Task 8: Add/Modify book review (Authenticated)
app.post('/books/review/:isbn', authenticate, (req, res) => {
    const { review } = req.body;
    const book = books.find(b => b.isbn === req.params.isbn);
    if (!book) return res.status(404).send('Book not found');
    book.review = review;
    fs.writeFileSync('books.json', JSON.stringify(books));
    res.send('Review added/updated successfully');
});

// Task 9: Delete book review (Authenticated)
app.delete('/books/review/:isbn', authenticate, (req, res) => {
    const book = books.find(b => b.isbn === req.params.isbn);
    if (!book) return res.status(404).send('Book not found');
    delete book.review;
    fs.writeFileSync('books.json', JSON.stringify(books));
    res.send('Review deleted successfully');
});

// Task 10: Get all books using async callback
const getAllBooks = async (callback) => {
    callback(null, books);
};
app.get('/async/books', (req, res) => {
    getAllBooks((err, data) => {
        if (err) return res.status(500).send('Error fetching books');
        res.json(data);
    });
});

// Task 11: Search by ISBN using Promises
const getBookByISBN = (isbn) => {
    return new Promise((resolve, reject) => {
        const book = books.find(b => b.isbn === isbn);
        book ? resolve(book) : reject('Book not found');
    });
};
app.get('/promise/book/:isbn', (req, res) => {
    getBookByISBN(req.params.isbn)
        .then(book => res.json(book))
        .catch(err => res.status(404).send(err));
});

// Task 12: Search by Author using async/await
app.get('/async/author/:author', async (req, res) => {
    try {
        const filteredBooks = books.filter(b => b.author === req.params.author);
        if (filteredBooks.length === 0) throw 'No books found';
        res.json(filteredBooks);
    } catch (err) {
        res.status(404).send(err);
    }
});

// Task 13: Search by Title using async/await
app.get('/async/title/:title', async (req, res) => {
    try {
        const filteredBooks = books.filter(b => b.title.includes(req.params.title));
        if (filteredBooks.length === 0) throw 'No books found';
        res.json(filteredBooks);
    } catch (err) {
        res.status(404).send(err);
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
