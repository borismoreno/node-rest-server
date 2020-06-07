var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var clienteSchema = new Schema({
    razonSocial: { type: String, required: [true, 'La razon social es requerida'] },
    tipoIdentificacion: { type: Schema.Types.ObjectId, ref: 'TipoIdentificacion' },
    numeroIdentificacion: { type: String, unique: true, required: [true, 'El numero de identificacion es requerido'] },
    telefono: { type: String, required: [true, 'El numero de telefono es requerido'] },
    direccion: { type: String, required: [true, 'La direccion es requerida'] },
    mail: { type: String, required: [true, 'El mail es requerido'] },
    activo: { type: Boolean, required: false, default: true },
    usuario: { type: Schema.Types.ObjectId, ref: 'Usuario' },
    fechaModificacion: { type: Date, required: false }
});

module.exports = mongoose.model('Cliente', clienteSchema);