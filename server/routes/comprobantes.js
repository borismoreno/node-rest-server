const express = require('express');
const { verificaToken } = require('../middlewares/autenticacion');
const { envioMail } = require('../middlewares/enviomail');
const { crearXML, generarPdf } = require('../middlewares/trabajoxml');
const { firma } = require('../middlewares/firma');
const { envioComprobante, obtenerAutorizacion } = require('../middlewares/enviocomprobantes');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
app = express();

let FacturaEmitida = require('../models/facturaemitida');
let Cliente = require('../models/cliente');
let Empresa = require('../models/empresa');
let TipoIdentificacion = require('../models/tipoIdentificacion');
let ImpuestoComprobante = require('../models/impuestocomprobante');
let DetalleFacturaEmitida = require('../models/detallefacturaemitida');
let FormaPagoFactura = require('../models/formapagofactura');
let DatoAdicionalFactura = require('../models/datoadicionalfactura');
let ErrorRegistro = require('../models/errorregistro');

app.post('/comprobante', [verificaToken], (req, res) => {
    let body = req.body;
    let usuario = req.usuario;
    guardarFactura(body, usuario, res);
});

let guardarFactura = async(body, usuario, res) => {
    let facturaDB;
    try {
        let pad = '000000000';
        let padSecuencia = '00000000';
        let fecha = body.fechaEmision.split('/');
        let impuestoComprobante = new ImpuestoComprobante();
        let fechaAuxiliar = `${fecha[2]}/${fecha[1]}/${fecha[0]}`;
        let empresaDB = await getEmpresa(body.empresa);
        let tipoIdentificacion = await getTipoIdentificacion(body.cliente.tipoIdentificacion);
        let clienteEmision = await consultarCliente(body.cliente.numeroIdentificacion);
        let secuencial = pad.substring(0, pad.length - empresaDB.secuencialFactura.length) + empresaDB.secuencialFactura;
        let numeroFacturas = await getNumeroFacturasEmitidas();
        let aleatorio = padSecuencia.substring(0, padSecuencia.length - numeroFacturas.toString().length) + numeroFacturas.toString();
        let claveAcceso = fecha[2] + fecha[1] + fecha[0] +
            '01' + empresaDB.ruc + empresaDB.ambiente + empresaDB.establecimiento + empresaDB.puntoEmision +
            secuencial +
            aleatorio + empresaDB.tipoEmision;
        claveAcceso = claveAcceso + obtenerSumaPorDigitos(invertirCadena(claveAcceso));
        let factura = new FacturaEmitida({
            ambiente: empresaDB.ambiente,
            tipoEmision: empresaDB.tipoEmision,
            razonSocial: empresaDB.razonSocial,
            nombreComercial: empresaDB.nombreComercial,
            ruc: empresaDB.ruc,
            claveAcceso: claveAcceso,
            codDoc: '01',
            estab: empresaDB.establecimiento,
            ptoEmi: empresaDB.puntoEmision,
            secuencial: secuencial,
            dirMatriz: empresaDB.direccionMatriz,
            fechaEmision: fechaAuxiliar,
            dirEstablecimiento: empresaDB.direccionEstablecimiento,
            contribuyenteEspecial: empresaDB.contribuyenteEspecial,
            obligadoContabilidad: empresaDB.obligadoContabilidad,
            tipoIdentificacionComprador: tipoIdentificacion.codigo,
            razonSocialComprador: body.cliente.razonSocial,
            identificacionComprador: body.cliente.numeroIdentificacion,
            totalSinImpuestos: body.detalleValores.subtotalDoce,
            totalDescuento: body.detalleValores.totalDescuento,
            propina: '0.00',
            totalIva: body.detalleValores.totalIva,
            importeTotal: body.detalleValores.totalGeneral,
            moneda: 'DOLAR',
            estadoComprobante: 'PPR',
            fechaRegistro: moment().format('YYYY-MM-DD\THH:mm:ssZ'),
            usuario: usuario._id,
            empresa: empresaDB._id,
            cliente: clienteEmision._id
        });
        facturaDB = await guardarFacturaEmitida(factura);
        impuestoComprobante = new ImpuestoComprobante({
            impuestoPadre: facturaDB._id,
            codigoImpuesto: '2',
            codigoPorcentaje: '2',
            baseImponible: body.detalleValores.subtotalDoce,
            valor: body.detalleValores.totalIva,
            tarifa: '12',
            tipoImpuesto: 'FAC',
            emitidaRecibida: 'EMI'
        });
        let impuesto = await guardarImpuestoComprobante(impuestoComprobante);
        let detalles = await guardarDetallesFactura(body, facturaDB);
        let formasPago = await guardarFormasPago(body.formasPago, facturaDB);
        let datosAdicionales;
        if (Array.isArray(body.datosAdicionales) && body.datosAdicionales.length) {
            datosAdicionales = await guardarDatosAdicionales(body.datosAdicionales, facturaDB);
        }
        await generarPdf(claveAcceso, facturaDB, clienteEmision, detalles, formasPago, datosAdicionales, res)
        let xmlGenerado = await crearXML(facturaDB, impuesto, formasPago, detalles, datosAdicionales);
        let pathXML = path.resolve(__dirname, `../../uploads/${claveAcceso}.xml`);
        await actualizarSecuencial(empresaDB._id);
        fs.writeFileSync(pathXML, xmlGenerado);
        let respuesta = await firma(claveAcceso, empresaDB.claveFirma, empresaDB.pathCertificado);
        let respEnvio = await envioComprobante(empresaDB.ambiente, respuesta, facturaDB);
        let respAutorizacion;
        if (respEnvio.ok === 'true' && respEnvio.statusCode === 200) {
            respAutorizacion = await obtenerAutorizacion(empresaDB.ambiente, claveAcceso, facturaDB);
            if (respAutorizacion === 'AUTORIZADO') {
                envioMail(claveAcceso, facturaDB);
            }
        }

    } catch (err) {
        let idFactura = '0';
        if (facturaDB !== undefined) { idFactura = facturaDB._id }
        let nuevoError = new ErrorRegistro({
            facturaEmitida: idFactura,
            mensajeError: err,
            fechaCreacion: moment().format('YYYY-MM-DD\THH:mm:ssZ')
        });
        await nuevoError.save();
        return res.status(500).json({
            ok: false,
            err
        });
    }
}

let getEmpresa = async(id) => {
    let empresa;
    await Empresa.findById(id, (err, empresaDB) => {
        empresa = empresaDB;
    });
    return empresa;
}

let getNumeroFacturasEmitidas = async() => {
    let numero;
    await FacturaEmitida.countDocuments((err, conteo) => {
        numero = conteo;
    });
    return numero;
}

let getTipoIdentificacion = async(tipoIdentificacion) => {
    let tipo;
    await TipoIdentificacion.findById(tipoIdentificacion, (err, tipoIdentificacionDB) => {
        tipo = tipoIdentificacionDB;
    });
    return tipo;
}

let guardarFacturaEmitida = async(factura) => {
    try {
        let fac = await factura.save();
        return fac;
    } catch (error) {
        console.log('error factura emitida: ', error);
        throw (new Error(`Error al guardar factura emitida-${error}`));
    }
}

let guardarImpuestoComprobante = async(impuestoComprobante) => {
    try {
        let impuestoComprobanteDB = await impuestoComprobante.save();
        return impuestoComprobanteDB;
    } catch (error) {
        throw (error);
    }
}

let guardarDetalle = async(detalle) => {
    try {
        let detalleDB = await detalle.save();
        return detalleDB;
    } catch (error) {
        throw (error);
    }
}

let guardarDetallesFactura = async(body, facturaDB) => {
    try {
        let det;
        let guardado = [];
        let impuestoComprobanteDet;
        for (let i = 0; i < body.detalles.length; i++) {
            detalleFacturaEmitida = new DetalleFacturaEmitida({
                facturaEmitida: facturaDB._id,
                codigoPrincipal: body.detalles[i].codigoPrincipal,
                descripcion: body.detalles[i].descripcion,
                cantidad: body.detalles[i].cantidad,
                precioUnitario: body.detalles[i].precioUnitario,
                descuento: body.detalles[i].valorDescuento,
                totalSinImpuesto: body.detalles[i].valorTotal,
                valorImpuesto: body.detalles[i].valorImpuesto,
                emitidaRecibida: 'EMI'
            });
            det = await guardarDetalle(detalleFacturaEmitida);
            impuestoComprobanteDet = new ImpuestoComprobante({
                impuestoPadre: det._id,
                codigoImpuesto: '2',
                codigoPorcentaje: '2',
                baseImponible: det.totalSinImpuesto,
                valor: det.valorImpuesto,
                tarifa: '12',
                tipoImpuesto: 'DET',
                emitidaRecibida: 'EMI'
            });
            let imp = await guardarImpuestoComprobante(impuestoComprobanteDet);
            let obj = {
                det,
                imp
            }
            guardado.push(obj);
        }
        return guardado;
    } catch (error) {
        console.log('error detalles factura: ', error);
        throw (new Error(`Error al guardar el detalle-${error}`));
    }
}

let guardarFormasPago = async(formasPago, facturaDB) => {
    try {
        let formasPagoFactura = [];
        let formaPagoFactura = new FormaPagoFactura();
        for (let i = 0; i < formasPago.length; i++) {
            formaPagoFactura = new FormaPagoFactura({
                facturaEmitida: facturaDB._id,
                formaPago: formasPago[i].formaPagoCodigo,
                formaPagoDescripcion: formasPago[i].formaPagoDescripcion,
                total: formasPago[i].total,
                plazo: formasPago[i].plazo,
                unidadTiempo: formasPago[i].unidadTiempo,
                emitidaRecibida: 'EMI'
            });
            formasPagoFactura.push(formaPagoFactura);
            await formaPagoFactura.save();
        }
        return formasPagoFactura;
    } catch (error) {
        console.log('error formas de pago: ', error);
        throw (new Error(`Error al guardar la forma de pago-${error}`));
    }
}

let actualizarSecuencial = async(idEmpresa) => {
    Empresa.findById(idEmpresa, (err, empresaActualizar) => {
        if (err) {
            console.log(err);
        }
        let secuencial = Number(empresaActualizar.secuencialFactura) + 1;
        empresaActualizar.secuencialFactura = secuencial.toString();
        empresaActualizar.save();
    });
}

let guardarDatosAdicionales = async(datosAdicionales, facturaDB) => {
    try {
        let datosAdicionalesResp = [];
        let datoAdicionalFactura = new DatoAdicionalFactura();
        for (let i = 0; i < datosAdicionales.length; i++) {
            datoAdicionalFactura = new DatoAdicionalFactura({
                facturaEmitida: facturaDB._id,
                nombreAdicional: datosAdicionales[i].nombreAdicional,
                valorAdicional: datosAdicionales[i].valorAdicional,
                emitidaRecibida: 'EMI'
            });
            datosAdicionalesResp.push(datoAdicionalFactura);
            await datoAdicionalFactura.save();
        }
        return datosAdicionalesResp;
    } catch (error) {
        console.log('error datos adicionales: ', error);
        throw (new Error(`Error al guardar los datos adiciionales-${error}`));
    }
}

let consultarCliente = async(identificacion) => {
    let clienteFactura = await Cliente.find({ numeroIdentificacion: identificacion });
    return clienteFactura[0];
}

function invertirCadena(cadena) {
    let cadenaInvertida = '';
    for (let index = cadena.length - 1; index >= 0; index--) {
        cadenaInvertida = cadenaInvertida + cadena.charAt(index);
    }
    return cadenaInvertida;
}

function obtenerSumaPorDigitos(cadena) {
    let pivote = 2;
    let longitudCadena = cadena.length;
    let cantidadTotal = 0;
    for (let i = 0; i < longitudCadena; i++) {
        if (pivote === 8) {
            pivote = 2;
        }
        let temporal = Number(cadena.substring(i, i + 1));
        temporal *= pivote;
        pivote++;
        cantidadTotal += temporal;
    }
    cantidadTotal = 11 - cantidadTotal % 11;
    if (cantidadTotal == 11)
        cantidadTotal = 0;
    else if (cantidadTotal == 10)
        cantidadTotal = 1;
    return cantidadTotal;
}

module.exports = app;