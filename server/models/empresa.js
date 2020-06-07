var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var empresaSchema = new Schema({
    ambiente: { type: Number, required: [true, 'El ambiente es necesario'] },
    tipoEmision: { type: Number, required: [true, 'El tipo de emision es necesario'] },
    razonSocial: { type: String, required: [true, 'La razon social es requerida'] },
    nombreComercial: { type: String, required: [true, 'El nombre comercial es requerido'] },
    ruc: { type: String, unique: true, required: [true, 'El ruc es requerido'] },
    establecimiento: { type: String, required: [true, 'EL establecimiento es requerido'] },
    puntoEmision: { type: String, required: [true, 'El punto de emision es requerido'] },
    direccionMatriz: { type: String, required: [true, 'La direccion matriz es requerida'] },
    direccionEstablecimiento: { type: String, required: [true, 'La direccion de establecimiento es requerida'] },
    contribuyenteEspecial: { type: String, required: false },
    obligadoContabilidad: { type: String, default: 'NO', required: false },
    secuencialFactura: { type: String, required: [true, 'El secuencial de la factura es requerido'] },
    secuencialNotaCredito: { type: String, required: false, default: '1' },
    secuencialRetencion: { type: String, required: false, default: '1' },
    claveFirma: { type: String, required: [true, 'La clave de la firma es requerida'] },
    pathCertificado: { type: String, required: false },
    mailEnvioComprobantes: { type: String, required: [true, 'El correo es requerido'] },
    claveMail: { type: String, required: [true, 'La clave del correo es requerida'] },
    pathLogo: { type: String, required: false },
    nombreNotificacion: { type: String, required: [true, 'El nombre de notificacion es requerido'] },
    servidor: { type: String, required: [true, 'El servidor es requerido'] },
    puerto: { type: Number, required: [true, 'El puerto es requerido'] },
    ssl: { type: Boolean, required: false, default: false },
    activo: { type: Boolean, required: false, default: true },
    usuario: { type: Schema.Types.ObjectId, ref: 'Usuario' },
    fechaModificacion: { type: Date, required: false }
});

module.exports = mongoose.model('Empresa', empresaSchema);