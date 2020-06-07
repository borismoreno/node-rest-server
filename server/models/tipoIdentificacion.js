var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var tipoIdentificacionSchema = new Schema({
    tipoIdentificacion: { type: String, required: [true, 'El tipo de identificacion es requerido'] },
    codigo: { type: String, required: [true, 'El codigo es requerido'] },
    activo: { type: Boolean, required: false, default: true },
    usuario: { type: Schema.Types.ObjectId, ref: 'Usuario' },
    fechaModificacion: { type: Date, required: false }
});

module.exports = mongoose.model('TipoIdentificacion', tipoIdentificacionSchema);