var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var tipoProductoSchema = new Schema({
    descripcion: { type: String, required: [true, 'La descripcion es requerida'] },
    codigo: { type: String, required: [true, 'El codigo es requerido'] },
    activo: { type: Boolean, required: false, default: true },
    usuario: { type: Schema.Types.ObjectId, ref: 'Usuario' },
    fechaModificacion: { type: Date, required: false }
});

module.exports = mongoose.model('TipoProducto', tipoProductoSchema);