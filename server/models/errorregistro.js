var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var errorSchema = new Schema({
    facturaEmitida: { type: String, required: true },
    mensajeError: { type: String, required: true },
    fechaCreacion: { type: Date, required: true }
});

module.exports = mongoose.model('ErrorRegistro', errorSchema);