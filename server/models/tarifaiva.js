var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var tarifaIvaSchema = new Schema({
    porcentaje: { type: String, required: [true, 'El porcentaje es requerido'] },
    codigo: { type: String, required: [true, 'El codigo es requerido'] },
    activo: { type: Boolean, required: false, default: true },
    usuario: { type: Schema.Types.ObjectId, ref: 'Usuario' },
    fechaModificacion: { type: Date, required: false }
});

module.exports = mongoose.model('TarifaIva', tarifaIvaSchema);