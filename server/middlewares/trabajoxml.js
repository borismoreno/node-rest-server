const builder = require('xmlbuilder');
let TipoIdentificacion = require('../models/tipoIdentificacion');
const path = require('path');
const pdf = require('pdf-creator-node');
const fs = require('fs');
const moment = require('moment');

let crearXML = async(facturaEmitida, impuestoComprobante, formasPagoFactura, detalles, datosAdicionales) => {
    let impues = [];
    let details = [];
    let datos = [];
    for (let i = 0; i < formasPagoFactura.length; i++) {
        let im = {
            formaPago: formasPagoFactura[i].formaPago,
            total: formasPagoFactura[i].total,
            plazo: formasPagoFactura[i].plazo,
            unidadTiempo: formasPagoFactura[i].unidadTiempo
        }
        impues.push(im);
    }
    if (Array.isArray(datosAdicionales) && datosAdicionales.length) {
        for (let k = 0; k < datosAdicionales.length; k++) {
            let dat = {
                '@nombre': datosAdicionales[k].nombreAdicional,
                '#text': datosAdicionales[k].valorAdicional
            }
            datos.push(dat);
        }
    }

    for (let j = 0; j < detalles.length; j++) {
        let detail = {
            codigoPrincipal: detalles[j].det.codigoPrincipal,
            descripcion: detalles[j].det.descripcion,
            cantidad: detalles[j].det.cantidad,
            precioUnitario: detalles[j].det.precioUnitario,
            descuento: detalles[j].det.descuento,
            precioTotalSinImpuesto: detalles[j].det.totalSinImpuesto,
            impuestos: {
                impuesto: {
                    codigo: detalles[j].imp.codigoImpuesto,
                    codigoPorcentaje: detalles[j].imp.codigoPorcentaje,
                    tarifa: detalles[j].imp.tarifa,
                    baseImponible: detalles[j].imp.baseImponible,
                    valor: detalles[j].imp.valor
                }
            }

        }
        details.push(detail);
    }
    var xml = builder.create('factura', { 'version': '1.0', 'encoding': 'UTF-8' })
        .att({
            'id': 'comprobante',
            'version': '1.0.0'
        })
        .ele({
            infoTributaria: {
                ambiente: facturaEmitida.ambiente,
                tipoEmision: facturaEmitida.tipoEmision,
                razonSocial: facturaEmitida.razonSocial,
                nombreComercial: facturaEmitida.nombreComercial,
                ruc: facturaEmitida.ruc,
                claveAcceso: facturaEmitida.claveAcceso,
                codDoc: facturaEmitida.codDoc,
                estab: facturaEmitida.estab,
                ptoEmi: facturaEmitida.ptoEmi,
                secuencial: facturaEmitida.secuencial,
                dirMatriz: facturaEmitida.dirMatriz
            },
            infoFactura: {
                fechaEmision: facturaEmitida.fechaEmision,
                dirEstablecimiento: facturaEmitida.dirEstablecimiento,
                //contribuyenteEspecial: facturaEmitida.contribuyenteEspecial,
                obligadoContabilidad: facturaEmitida.obligadoContabilidad,
                tipoIdentificacionComprador: facturaEmitida.tipoIdentificacionComprador,
                razonSocialComprador: facturaEmitida.razonSocialComprador,
                identificacionComprador: facturaEmitida.identificacionComprador,
                totalSinImpuestos: facturaEmitida.totalSinImpuestos,
                totalDescuento: facturaEmitida.totalDescuento,
                totalConImpuestos: {
                    totalImpuesto: {
                        codigo: impuestoComprobante.codigoImpuesto,
                        codigoPorcentaje: impuestoComprobante.codigoPorcentaje,
                        baseImponible: impuestoComprobante.baseImponible,
                        tarifa: impuestoComprobante.tarifa,
                        valor: impuestoComprobante.valor
                    }
                },
                propina: facturaEmitida.propina,
                importeTotal: facturaEmitida.importeTotal,
                moneda: facturaEmitida.moneda,
                pagos: {
                    pago: impues
                }
            },
            detalles: {
                detalle: details
            },
            ...(Array.isArray(datos) && datos.length) && {
                infoAdicional: {
                    campoAdicional: datos
                }
            }
        })
        .end({ pretty: true });

    return xml;
}

let generarPdf = async(claveAcceso, facturaDB, clienteEmision, detallesAux, formasPagoAux, adicionalesAux, res) => {
    try {
        let informacion = await cargarInformacion(facturaDB, clienteEmision);
        let formasPago = [];
        let detalles = [];
        let adicionales = [];
        for (let i = 0; i < formasPagoAux.length; i++) {
            let forma = {
                formaPago: formasPagoAux[i].formaPagoDescripcion,
                total: formasPagoAux[i].total
            }
            formasPago.push(forma);

        }

        if (Array.isArray(adicionalesAux) && adicionalesAux.length) {
            for (let j = 0; j < adicionalesAux.length; j++) {
                let adicion = {
                    nombreAdicional: adicionalesAux[j].nombreAdicional,
                    valorAdicional: adicionalesAux[j].valorAdicional
                }
                adicionales.push(adicion);
            }
        }

        for (let k = 0; k < detallesAux.length; k++) {
            let detalle = {
                codigoPrincipal: detallesAux[k].det.codigoPrincipal,
                descripcion: detallesAux[k].det.descripcion,
                cantidad: detallesAux[k].det.cantidad,
                precioUnitario: detallesAux[k].det.precioUnitario,
                totalSinImpuesto: detallesAux[k].det.totalSinImpuesto
            }
            detalles.push(detalle);
        }
        let pathTemplate = path.resolve(__dirname, `../assets/templates/pdf-template.html`);
        let pathLogo = path.resolve(__dirname, `../assets/templates/logo.png`);
        let html = fs.readFileSync(pathTemplate, 'utf8');
        pathLogo = `file: ${pathLogo}`;
        html = html.split('logo.png').join(pathLogo);
        html = html.split('claveBarcode').join(claveAcceso);
        let options = {
            format: 'A4',
            orientation: 'portrait'
        };
        let pathImg = path.resolve(__dirname, `../../uploads/${claveAcceso}.pdf`);
        let document = {
            html: html,
            data: {
                informacion,
                detalles,
                formasPago,
                adicionales
            },
            path: pathImg
        };
        pdf.create(document, options)
            .then(respuesta => {
                res.sendFile(pathImg);
            })
            .catch(error => {
                return res.status(500).json({
                    ok: false,
                    message: error
                });
            });
    } catch (error) {
        throw (new Error(`Error al generar el pdf-${error}`));
    }
}

let cargarInformacion = async(facturaDB, clienteFactura2) => {
    var tipoIdentificacionComp = await getTipoIdentificacionCodigo(facturaDB.tipoIdentificacionComprador);
    let emailEnviar = clienteFactura2.mail.split(',').join('\n');
    let mes = '';
    let day = moment().format('DD');
    let month = moment().format('MM');
    let year = moment().format('YYYY');

    switch (month) {
        case '01':
            mes = 'Enero'
            break;
        case '02':
            mes = 'Febrero'
            break;
        case '03':
            mes = 'Marzo'
            break;
        case '04':
            mes = 'Abril'
            break;
        case '05':
            mes = 'Mayo'
            break;
        case '06':
            mes = 'Junio'
            break;
        case '07':
            mes = 'Julio'
            break;
        case '08':
            mes = 'Agosto'
            break;
        case '09':
            mes = 'Septiembre'
            break;
        case '10':
            mes = 'Octubre'
            break;
        case '11':
            mes = 'Noviembre'
            break;
        case '12':
            mes = 'Diciembre'
            break;
        default:
            mes = ''
            break;
    }

    let fechaPresentar = `${day} ${mes} ${year}`;

    var informacion = {
        razonSocial: facturaDB.razonSocial,
        ruc: facturaDB.ruc,
        nombreComercial: facturaDB.nombreComercial,
        numeroFactura: facturaDB.estab + '-' + facturaDB.ptoEmi + '-' + facturaDB.secuencial,
        direccionEstablecimiento: facturaDB.dirEstablecimiento,
        contribuyenteEspecial: facturaDB.contribuyenteEspecial,
        obligadoContabilidad: facturaDB.obligadoContabilidad,
        claveAcceso: facturaDB.claveAcceso,
        ambiente: facturaDB.ambiente === '2' ? 'PRODUCCION' : 'PRUEBAS',
        tipoEmision: facturaDB.tipoEmision === '1' ? 'NORMAL' : '',
        razonCliente: facturaDB.razonSocialComprador,
        tipoIdentificacionCliente: tipoIdentificacionComp.tipoIdentificacion,
        identificacionCliente: facturaDB.identificacionComprador,
        direccionCliente: clienteFactura2.direccion,
        telefonoCliente: clienteFactura2.telefono,
        emailCliente: emailEnviar,
        fecha: fechaPresentar,
        subTotalDoce: facturaDB.totalSinImpuestos,
        valorIva: facturaDB.totalIva,
        valorTotal: facturaDB.importeTotal
    };
    return informacion;
}

let getTipoIdentificacionCodigo = async(codigoTipoIdentificacion) => {
    let tipo = await TipoIdentificacion.find({ codigo: codigoTipoIdentificacion });
    return tipo[0];
}

module.exports = {
    crearXML,
    generarPdf
}