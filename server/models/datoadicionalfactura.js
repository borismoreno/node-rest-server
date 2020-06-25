var mongoose = require('mongoose');
var Schema = mongoose.Schema;

let emitidaRecibidaValidos = {
    values: ['EMI', 'REC'],
    message: '{VALUE} debe ser emitida o recibida'
};

var datoAdicionalFacturaSchema = new Schema({
    facturaEmitida: { type: Schema.Types.ObjectId, ref: 'FacturaEmitida' },
    nombreAdicional: { type: String, required: true },
    valorAdicional: { type: String, required: true },
    emitidaRecibida: { type: String, required: true, enum: emitidaRecibidaValidos }
});

module.exports = mongoose.model('DatoAdicionalFactura', datoAdicionalFacturaSchema);