var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var messageSchema = new Schema({
    author: {type: String, required: false},
    body: {type: String, required: false},
    chatId: {type: String, required: false},
    senderName: {type: String, required: false},
    fecha: {type: Date, required: false}
});

module.exports = mongoose.model('Message', messageSchema);