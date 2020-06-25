var mongoose = require('mongoose');
var Schema = mongoose.Schema;

let tipoImpuestoValidos = {
    values: ['FAC', 'DET'],
    message: '{VALUE} no es un tipo de impuesto valido'
};

let emitidaRecibidaValidos = {
    values: ['EMI', 'REC'],
    message: '{VALUE} debe ser emitida o recibida'
};

var impuestoComprobanteSchema = new Schema({
    impuestoPadre: { type: String, required: true },
    codigoImpuesto: { type: String, required: true },
    codigoPorcentaje: { type: String, required: true },
    baseImponible: { type: String, required: true },
    valor: { type: String, required: true },
    tarifa: { type: String, required: true },
    tipoImpuesto: { type: String, required: true, enum: tipoImpuestoValidos },
    emitidaRecibida: { type: String, required: true, enum: emitidaRecibidaValidos }
});

module.exports = mongoose.model('ImpuestoComprobante', impuestoComprobanteSchema);