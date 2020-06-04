//Puerto
process.env.PORT = process.env.PORT || 3000;

process.env.NODE_ENV = process.env.NODE_ENV || 'dev';

let urlDB;
if (process.env.NODE_ENV === 'dev') {
    urlDB = 'mongodb://localhost:27017/cafe';
} else {
    urlDB = 'mongodb+srv://admin_user:qDbKZsXJ0kCUuEpr@cluster0-aps5b.mongodb.net/cafe?retryWrites=true&w=majority'
}

process.env.URL_DB = urlDB;