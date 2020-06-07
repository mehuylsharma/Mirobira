const express = require('express');
const router = express.Router();
const Book = require('../models/book');
const Author = require('../models/author');
const imageMimeTypes = ['image/jpeg', 'image/png', 'images/gif'];

//All Books route
router.get('/', async (req, res) => {
    let query = Book.find();
    if (req.query.title != null && req.query.title != ""){
        query = query.regex('title', new RegExp(req.query.title, 'i'));
    }
    if (req.query.publishedBefore != null && req.query.publishedBefore != ""){
        query = query.lte('publishDate', req.query.publishBefore);
    }
    if (req.query.publishedAfter != null && req.query.publishedAfter != ""){
        query = query.gte('publishDate', req.query.publishAfter);
    }
    try{
        const books = await query.exec();
        res.render('books/index', {
            books: books,
            searchOptions: req.query
        });
    } catch {
        res.redirect('/');
    }
})

//New Book route
router.get('/new', async (req, res) => {
    renderNewPage(res, new Book());
})

//Create Book route
router.post('/', async (req, res) => {
    const fileName = req.file != null ? req.file.filename : null;
    const book = new Book({
        title: req.body.title,
        author: req.body.author,
        publishDate: new Date(req.body.publishDate),
        pageCount: req.body.pageCount,
        description: req.body.description
    });
    saveCover(book, req.body.cover);

    try{
        const newBook = await book.save();
        // res.redirect('books/${newBook.id}');
        res.redirect('books');
    } catch {
        renderNewPage(res, book, true);
    }
})

//Open the book page
router.get('/:id', async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        res.render('books/show', {
            book: book,
            author: await Author.findById(book.author)
        })
    } catch {
        res.redirect('/');
    }
})

//Show the edit page
router.get('/:id/edit', async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        const author = await Author.findById(book.author);
        res.render('books/edit', {
            book: book,
            author: author,
            authors: await Author.find({})
        })
    } catch {
        res.redirect(`/books/${req.params.id}`)
    }
})

//Update the book
router.put('/:id', async (req, res) => {
    let book;
    try {
        book = await Book.findById(req.params.id);
        book.title = req.body.title;
        book.pageCount = req.body.pageCount;
        book.publishDate = req.body.publishDate;
        book.author = req.body.author;
        book.description = req.body.description;
        if (req.body.cover != null && req.body.cover != ''){
            saveCover(book, req.body.cover);
        }
        await book.save();
        res.redirect(`/books/${book.id}`);
    } catch {
        if (book == null){
            res.redirect('/books');
        } 
        renderNewPage(res, book, true);
    }
})

//Delete book router
router.delete('/:id', async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        await book.remove();
        res.redirect('/books')
    } catch {
        if (book = null){
            res.redirect('/books')
        } else {
            res.redirect(`/books/${req.params.id}`)
        }
    }
})

async function renderNewPage(res, book, hasError = false){
    try{
        const authors = await Author.find({});
        const params = {
            authors: authors,
            book: book
        };
        if (hasError) params.errorMessage = 'Error Creating Book';
        res.render('books/new', params);
    } catch {
        res.redirect('/books');
    }
}

function saveCover(book, coverEncoded){
    if (coverEncoded == null) return
    const cover = JSON.parse(coverEncoded);
    if (cover != null && imageMimeTypes.includes(cover.type)){
        book.coverImage = new Buffer.from(cover.data, 'base64');
        book.coverImageType = cover.type;
    }
}

module.exports = {
    router: router
}