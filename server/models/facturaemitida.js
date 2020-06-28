var mongoose = require('mongoose');
var Schema = mongoose.Schema;

let estadosValidos = {
    values: ['PPR', 'AUT', 'NAT', 'REC', 'DEV', 'EMA'],
    message: '{VALUE} no es un estado de comprobante valido'
};

var facturaEmitidaSchema = new Schema({
    ambiente: { type: String, required: [true, 'Ambiente es requerido'] },
    tipoEmision: { type: String, required: [true, 'Tipo emision es requerida'] },
    razonSocial: { type: String, required: [true, 'Razon Social es requerida'] },
    nombreComercial: { type: String, required: [true, 'Nombre comercial es requerido'] },
    ruc: { type: String, required: [true, 'Ruc es requerido'] },
    claveAcceso: { type: String, required: [true, 'Clave Acceso es requerida'] },
    codDoc: { type: String, required: [true, 'Codigo documento es requerido'] },
    estab: { type: String, required: [true, 'Establecimiento es requerido'] },
    ptoEmi: { type: String, required: [true, 'Punto Emision es requerido'] },
    secuencial: { type: String, required: [true, 'Secuencial es requerido'] },
    dirMatriz: { type: String, required: [true, 'Direccion matriz es requerida'] },
    fechaEmision: { type: String, required: [true, 'Fecha emision es requerida'] },
    dirEstablecimiento: { type: String, required: [true, 'Direccion establecimiento es requerida'] },
    contribuyenteEspecial: { type: String, required: false, default: ' ' },
    obligadoContabilidad: { type: String, required: [true, 'Obligado contabilidad es requerido'] },
    tipoIdentificacionComprador: { type: String, required: [true, 'Tipo identificacion comprador es requerido'] },
    razonSocialComprador: { type: String, required: [true, 'Razon social comprador es requerida'] },
    identificacionComprador: { type: String, required: [true, 'Identificacion comprador es requerida'] },
    totalSinImpuestos: { type: String, required: [true, 'Total sin impuestos es requerido'] },
    totalDescuento: { type: String, required: true },
    propina: { type: String, required: true },
    importeTotal: { type: String, required: true },
    totalIva: { type: String, required: true },
    moneda: { type: String, required: true },
    estadoComprobante: { type: String, required: true, enum: estadosValidos },
    fechaRegistro: { type: Date, required: true },
    fechaRecibido: { type: Date, required: false },
    fechaAutorizacion: { type: Date, required: false },
    empresa: { type: Schema.Types.ObjectId, ref: 'Empresa' },
    cliente: { type: Schema.Types.ObjectId, ref: 'Cliente' },
    usuario: { type: Schema.Types.ObjectId, ref: 'Usuario' }
})

module.exports = mongoose.model('FacturaEmitida', facturaEmitidaSchema);