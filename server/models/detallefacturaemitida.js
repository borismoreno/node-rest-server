var mongoose = require('mongoose');
var Schema = mongoose.Schema;

let emitidaRecibidaValidos = {
    values: ['EMI', 'REC'],
    message: '{VALUE} debe ser emitida o recibida'
};

var detalleFacturaEmitidaSchema = new Schema({
    facturaEmitida: { type: Schema.Types.ObjectId, ref: 'FacturaEmitida' },
    codigoPrincipal: { type: String, required: true },
    descripcion: { type: String, required: true },
    cantidad: { type: String, required: true },
    precioUnitario: { type: String, required: true },
    descuento: { type: String, required: true },
    totalSinImpuesto: { type: String, required: true },
    emitidaRecibida: { type: String, required: true, enum: emitidaRecibidaValidos }
});

module.exports = mongoose.model('DetalleFacturaEmitida', detalleFacturaEmitidaSchema);