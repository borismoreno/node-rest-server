var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var respuestaSchema = new Schema({
    sent: {type: Boolean, required: false},
    message: {type: String, required: false},
    id: {type: String, required: false},
});

module.exports = mongoose.model('Respuesta', respuestaSchema);