var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var productoSchema = new Schema({
    codigoPrincipal: { type: String, required: [true, 'El codigo principal es necesario'] },
    codigoAuxiliar: { type: String, required: false, default: '' },
    tipoProducto: { type: Schema.Types.ObjectId, ref: 'TipoProducto' },
    tarifaIva: { type: Schema.Types.ObjectId, ref: 'TarifaIva' },
    descripcion: { type: String, required: false },
    descuento: { type: Schema.Types.Decimal128, required: false, default: 0 },
    valorUnitario: { type: Schema.Types.Decimal128, required: true },
    activo: { type: Boolean, required: false, default: true },
    usuario: { type: Schema.Types.ObjectId, ref: 'Usuario' },
    fechaModificacion: { type: Date, required: false }
});

module.exports = mongoose.model('Producto', productoSchema);