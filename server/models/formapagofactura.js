var mongoose = require('mongoose');
var Schema = mongoose.Schema;

let emitidaRecibidaValidos = {
    values: ['EMI', 'REC'],
    message: '{VALUE} debe ser emitida o recibida'
};

var formaPagoFacturaSchema = new Schema({
    facturaEmitida: { type: Schema.Types.ObjectId, ref: 'FacturaEmitida' },
    formaPago: { type: String, required: true },
    formaPagoDescripcion: { type: String, required: true },
    total: { type: String, required: true },
    plazo: { type: String, required: true },
    unidadTiempo: { type: String, required: true },
    emitidaRecibida: { type: String, required: true, enum: emitidaRecibidaValidos }
});

module.exports = mongoose.model('FormaPagoFactura', formaPagoFacturaSchema);