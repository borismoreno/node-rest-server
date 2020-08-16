//  ====================
//  Puerto
//  ====================
process.env.PORT = process.env.PORT || 3000;

//  ====================
//  Puerto
//  ====================
process.env.NODE_ENV = process.env.NODE_ENV || 'dev';

//  ====================
//  Vencimiento del token
//  ====================
//  60 segundos
//  60 minutos
//  24 horas
//  30 dias
process.env.CADUCIDAD_TOKEN = 60 * 60 * 1 * 1;

//  ====================
//  Semilla
//  ====================
process.env.SEED = process.env.SEED || 'este-es-el-seed-desarrollo';

let urlDB;
if (process.env.NODE_ENV === 'dev') {
    urlDB = 'mongodb://localhost:27017/cafe';
} else {
    urlDB = process.env.MONGO_URI;
}

process.env.URL_DB = urlDB;

let apiKeySes;
if (process.env.NODE_ENV === 'dev') {
    apiKeySes = '******************';
} else {
    apiKeySes = process.env.API_KEY_SES;
}

process.env.API_KEY_SES = apiKeySes;

let secretSes;
if (process.env.NODE_ENV === 'dev') {
    secretSes = '************************';
} else {
    secretSes = process.env.SECRET_SES;
}

process.env.SECRET_SES = secretSes;

let apiChat;
if (process.env.NODE_ENV === 'dev') {
    apiChat = '************************';
} else {
    apiChat = process.env.API_CHAT;
}

process.env.API_CHAT = apiChat;

let apiChatToken;
if (process.env.NODE_ENV === 'dev') {
    apiChatToken = '************************';
} else {
    apiChatToken = process.env.API_CHAT_TOKEN;
}

process.env.API_CHAT_TOKEN = apiChatToken;