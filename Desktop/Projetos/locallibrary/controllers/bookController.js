var Book = require('../models/book');
var Author = require('../models/author');
var BookInstance = require('../models/bookinstance');
const { body,validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

var async = require('async');

exports.index = function(req, res) {   
    
    async.parallel({
        book_count: function(callback) {
            Book.countDocuments({}, callback); // Pass an empty object as match condition to find all documents of this collection
        },
        book_instance_count: function(callback) {
            BookInstance.countDocuments({}, callback);
        },
        book_instance_available_count: function(callback) {
            BookInstance.countDocuments({status:'Available'}, callback);
        },
        author_count: function(callback) {
            Author.countDocuments({}, callback);
        },

    }, function(err, results) {
        res.render('index', { title: 'Local Library Home', error: err, data: results });
    });
};

// Display list of all books.
exports.book_list = function(req, res, next) {

    Book.find({}, 'title author')
      .populate('author')
      .exec(function (err, list_books) {
        if (err) { return next(err); }
        //Successful, so render
        res.render('book_list', { title: 'Book List', book_list: list_books });
      });
      
  };
// Display detail page for a specific book.
exports.book_detail = function(req, res, next) {

    async.parallel({
        book: function(callback) {

            Book.findById(req.params.id)
              .populate('author')
              .exec(callback);
        },
        book_instance: function(callback) {

          BookInstance.find({ 'book': req.params.id })
          .exec(callback);
        },
    }, function(err, results) {
        if (err) { return next(err); }
        if (results.book==null) { // No results.
            var err = new Error('Book not found');
            err.status = 404;
            return next(err);
        }
        // Successful, so render.
        res.render('book_detail', { title: results.book.title, book: results.book, book_instances: results.book_instance } );
    });

};

// Display book create form on GET.
exports.book_create_get = function(req, res, next) { 
      
    // Get all authors and genres, which we can use for adding to our book.
    async.parallel({
        authors: function(callback) {
            Author.find(callback);
        },

    }, function(err, results) {
        if (err) { return next(err); }
        res.render('book_form', { title: 'Create Book', authors: results.authors });
    });
    
};

// Handle book create on POST.
exports.book_create_post = [
    
    // Validate fields.
    body('title', 'Title must not be empty.').trim().isLength({ min: 1 }),
    body('author', 'Author must not be empty.').trim().isLength({ min: 1 }),
    body('summary', 'Summary must not be empty.').trim().isLength({ min: 1 }),
    body('isbn', 'ISBN must not be empty').trim().isLength({ min: 1 }),
  
    // Sanitize fields (using wildcard).
    sanitizeBody('*').escape(),

    // Process request after validation and sanitization.
    (req, res, next) => {
        
        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a Book object with escaped and trimmed data.
        var book = new Book(
          { title: req.body.title,
            author: req.body.author,
            summary: req.body.summary,
            isbn: req.body.isbn,
           });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/error messages.

            // Get all authors and genres for form.
            async.parallel({
                authors: function(callback) {
                    Author.find(callback);
                }
            }), function(err, results) {
                if (err) { return next(err); }

                res.render('book_form', { title: 'Create Book',authors:results.authors, book: book, errors: errors.array() });
            };
            return;
        }
        else {
            // Data from form is valid. Save book.
            book.save(function (err) {
                if (err) { return next(err); }
                   //successful - redirect to new book record.
                   res.redirect(book.url);
                });
        }
    }
];

// Display book delete form on GET.
exports.book_delete_get = function(req, res) {
    res.send('NOT IMPLEMENTED: Book delete GET');
};

// Handle book delete on POST.
exports.book_delete_post = function(req, res) {
    res.send('NOT IMPLEMENTED: Book delete POST');
};

// Display book update form on GET.
exports.book_update_get = function(req, res, next) {
    //Get book and authors for form
    async.parallel({
        book: function (callback){
            Book.findById(req.params.id).populate('author').exec(callback);
        },
        authors: function(callback){
            Author.find(callback);
        },
        }, function (err,results){
         if(err){return next(err);}
         if(results.book == null){
             var err = new Error('Book not found');
             err.status = 404;
             return next(err);
         }
         //Sucess
         res.render('book_form', {title: 'Update Book', authors: results.authors, book: results.book})


    });
};

// Handle book update on POST.
exports.book_update_post = [

    // Validate fields.
    body('title', 'Title must not be empty.').trim().isLength({ min: 1 }),
    body('author', 'Author must not be empty.').trim().isLength({ min: 1 }),
    body('summary', 'Summary must not be empty.').trim().isLength({ min: 1 }),
    body('isbn', 'ISBN must not be empty').trim().isLength({ min: 1 }),

    //Sanitize fields
    sanitizeBody('*').escape(),

    //Process request after validation and sanitization
    (req, res, next)=>{

        //Extract the validation errors from a request
        const errors = validationResult(req);

        //Creat book object with escaped/trimmed data and old id
        var book = new Book(
            {
                title: req.body.title,
                author: req.body.author,
                summary: req.body.summary,
                isbn: req.body.isbn,
                _id: req.params.id //This is required, or a new ID will be assigned!
            }
        )
        if(!errors.isEmpty()){
            async.parallel({
                authors: function(callback){
                    Author.find(callback);
                }
            }), function(err, results){
                if(err){return next(err);}

                res.render('book_form', {title: 'Update Book', authors: results.author, book: book, errors: errors.array()});
            }
        }
        else{
            // Data from form is valid. Update the recor
            Book.findByIdAndUpdate(req.params.id, book, {}, function(err,thebook){
                if(err){return next(err);}
                // Successful - redirect to book detail page.
                res.redirect(thebook.url);

            });
        }

    }
];