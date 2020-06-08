var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var tipoFormaPagoSchema = new Schema({
    formaPago: { type: String, required: [true, 'La forma de pago es requerida'] },
    codigo: { type: String, required: [true, 'El codigo es requerido'] },
    activo: { type: Boolean, required: false, default: true },
    usuario: { type: Schema.Types.ObjectId, ref: 'Usuario' },
    fechaModificacion: { type: Date, required: false }
});

module.exports = mongoose.model('TipoFormaPago', tipoFormaPagoSchema);