const express = require('express');
const { verificaToken } = require('../middlewares/autenticacion');
const { envioMail } = require('../middlewares/enviomail');
const fs = require('fs');
const builder = require('xmlbuilder');
const forge = require('node-forge');
const path = require('path');
const pdf = require('pdf-creator-node');
const btoa = require('btoa');
const moment = require('moment');
const soapRequest = require('easy-soap-request');

//const FileReader = require('filereader');
const FileAPI = require('file-api'),
    File = FileAPI.File,
    FileReader = FileAPI.FileReader;
app = express();

let FacturaEmitida = require('../models/facturaemitida');
let Cliente = require('../models/cliente');
let Empresa = require('../models/empresa');
let TipoIdentificacion = require('../models/tipoIdentificacion');
let ImpuestoComprobante = require('../models/impuestocomprobante');
let DetalleFacturaEmitida = require('../models/detallefacturaemitida');
let FormaPagoFactura = require('../models/formapagofactura');
let DatoAdicionalFactura = require('../models/datoadicionalfactura');

let getEmpresa = async(id) => {
    let empresa;
    await Empresa.findById(id, (err, empresaDB) => {
        empresa = empresaDB;
    });
    return empresa;
}

function borraArchivo(claveAcceso) {
    let pathImg = path.resolve(__dirname, `../../uploads/${claveAcceso}.xml`);
    if (fs.existsSync(pathImg)) {
        fs.unlinkSync(pathImg);
    }
}

let firma = async(clave, res) => {
    var p12_path = path.resolve(__dirname, '../../uploads/certificados/boris_marco_moreno_guallichico.p12');
    var facturaPath = path.resolve(__dirname, `../../uploads/${clave}.xml`);
    let infoAFirmar = await leerXML(facturaPath);
    var p12File = new File(p12_path, 'binary');

    var reader = new FileReader();
    var arrayBuffer = null;
    reader.readAsArrayBuffer(p12File);

    await reader.addEventListener('loadend', function(e) {
        arrayBuffer = reader.result;
        var comprobanteFirmado = firmarComprobante(arrayBuffer, 'Mateito810', infoAFirmar);
        let url = 'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl';
        let xml = "<?xml version=\"1.0\" encoding=\"utf-8\"?>" +
            " <SOAP-ENV:Envelope xmlns:SOAP-ENV=\"http://schemas.xmlsoap.org/soap/envelope/\"" +
            " xmlns:ns1=\"http://ec.gob.sri.ws.recepcion\">" +
            "  <SOAP-ENV:Body>" +
            "    <ns1:validarComprobante>" +
            "      <xml>" + Buffer.from(comprobanteFirmado).toString('base64') + "</xml>" +
            "    </ns1:validarComprobante>" +
            "  </SOAP-ENV:Body>" +
            "</SOAP-ENV:Envelope>";
        // usage of module
        (async() => {
            const { response } = await soapRequest({ url: url, xml: xml, timeout: 30000 }); // Optional timeout parameter(milliseconds)
            const { body, statusCode } = response;
            console.log('Respuesta recpecion:', response);
            console.log('Respuesta statusCode:', statusCode);
            console.log('Respuesta body:', body);
            if (statusCode == '200') {
                setTimeout(() => {
                    url = 'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl';
                    xml = "<?xml version=\"1.0\" encoding=\"utf-8\"?>" +
                        " <SOAP-ENV:Envelope xmlns:SOAP-ENV=\"http://schemas.xmlsoap.org/soap/envelope/\"" +
                        " xmlns:ns1=\"http://ec.gob.sri.ws.autorizacion\">" +
                        "  <SOAP-ENV:Body>" +
                        "    <ns1:autorizacionComprobante>" +
                        "      <claveAccesoComprobante>" + clave + "</claveAccesoComprobante>" +
                        "    </ns1:autorizacionComprobante>" +
                        "  </SOAP-ENV:Body>" +
                        "</SOAP-ENV:Envelope>";
                    (async() => {
                        const { response } = await soapRequest({ url: url, xml: xml, timeout: 30000 }); // Optional timeout parameter(milliseconds)
                        const { body, statusCode } = response;
                        let resultado = body.toString();
                        // console.log(resultado);
                        let respuestaAutorizacion = await GetRespuestaAutorizacion(resultado);
                        if (respuestaAutorizacion.estadoRespuesta === 'AUTORIZADO') {
                            var xmlString = '<?xml version=\"1.0\" encoding=\"UTF-8\"?><autorizacion>' +
                                `<estado>${respuestaAutorizacion.estadoRespuesta}</estado>` +
                                `<numeroAutorizacion>${respuestaAutorizacion.numeroAutorizacion}</numeroAutorizacion>` +
                                `<fechaAutorizacion>${respuestaAutorizacion.fechaAutorizacion}</fechaAutorizacion>` +
                                `<comprobante><![CDATA[${respuestaAutorizacion.comprobante.split('&lt;').join('<')}]]></comprobante>` +
                                `</autorizacion>`;
                            let pathXML = path.resolve(__dirname, `../../uploads/${clave}.xml`);
                            fs.writeFileSync(pathXML, xmlString);
                        }
                        // res.status(200).json({
                        //     ok: true,
                        //     message: 'Factura Generada',
                        //     body
                        // });
                        await envioMail(clave, res);
                        //borraArchivo(clave);
                    })();
                }, 3000);
            }
        })();
    }, false);
    return 0;
}

let GetRespuestaAutorizacion = async(respuesta) => {
    var aux1 = respuesta.indexOf('<estado>');
    var aux2 = respuesta.indexOf('</estado>');
    var estadoRespuesta = respuesta.substring(aux1 + 8, aux2);

    if (estadoRespuesta === 'AUTORIZADO') {
        var numeroAutorizacion;
        var fechaAutorizacion;
        var comprobante;
        aux1 = respuesta.indexOf('<numeroAutorizacion>');
        aux2 = respuesta.indexOf('</numeroAutorizacion>');
        if ((aux1 > 0) && (aux2 > 0))
            numeroAutorizacion = respuesta.substring(aux1 + 20, aux2);
        aux1 = respuesta.indexOf('<fechaAutorizacion>');
        aux2 = respuesta.indexOf('</fechaAutorizacion>');
        if ((aux1 > 0) && (aux2 > 0))
            fechaAutorizacion = respuesta.substring(aux1 + 19, aux2);
        aux1 = respuesta.indexOf('<comprobante>');
        aux2 = respuesta.indexOf('</comprobante>');
        if ((aux1 > 0) && (aux2 > 0))
            comprobante = `${respuesta.substring(aux1 + 13, aux2)}`;
        var respuesta = {
            estadoRespuesta,
            numeroAutorizacion,
            fechaAutorizacion,
            comprobante
        }

        return respuesta;
    }
}

let getTipoIdentificacion = async(tipoIdentificacion) => {
    let tipo;
    await TipoIdentificacion.findById(tipoIdentificacion, (err, tipoIdentificacionDB) => {
        tipo = tipoIdentificacionDB;
    });
    return tipo;
}

let getTipoIdentificacionCodigo = async(codigoTipoIdentificacion) => {
    let tipo = await TipoIdentificacion.find({ codigo: codigoTipoIdentificacion });
    return tipo[0];
}

let guardarFacturaEmitida = async(factura) => {
    let fac = await factura.save();
    return fac;
}

let guardarImpuestoComprobante = async(impuestoComprobante) => {
    let impuestoComprobanteDB = await impuestoComprobante.save();
    return impuestoComprobanteDB;
}

let guardarDetalle = async(detalle) => {
    let detalleDB = await detalle.save();
    return detalleDB;
}

let guardarDetallesFactura = async(body, facturaDB) => {
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
            emitidaRecibida: 'EMI'
        });
        det = await guardarDetalle(detalleFacturaEmitida);
        let valorImp = Number(det.totalSinImpuesto) * 0.12;
        impuestoComprobanteDet = new ImpuestoComprobante({
            impuestoPadre: det._id,
            codigoImpuesto: '2',
            codigoPorcentaje: '2',
            baseImponible: det.totalSinImpuesto,
            valor: valorImp,
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
}

let guardarFormasPago = async(formasPago, facturaDB) => {
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
}

let crearXML = (facturaEmitida, impuestoComprobante, formasPagoFactura, detalles, datosAdicionales) => {
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

    for (let k = 0; k < datosAdicionales.length; k++) {
        let dat = {
            '@nombre': datosAdicionales[k].nombreAdicional,
            '#text': datosAdicionales[k].valorAdicional
        }
        datos.push(dat);
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
            infoAdicional: {
                campoAdicional: datos
            }
        })
        .end({ pretty: true });

    return xml;
}

let generarPdf = async(claveAcceso, informacion, detallesAux, formasPagoAux, adicionalesAux, res) => {
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

    for (let j = 0; j < adicionalesAux.length; j++) {
        let adicion = {
            nombreAdicional: adicionalesAux[j].nombreAdicional,
            valorAdicional: adicionalesAux[j].valorAdicional
        }
        adicionales.push(adicion);
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
            // res.status(200).json({
            //     ok: true,
            //     message: 'Archivo generado',
            //     resp: respuesta
            // });
        })
        .catch(error => {
            res.status(500).json({
                ok: false,
                error
            });
        });
}

let guardarFactura = async(body, usuario, res) => {
    let pad = '000000000';
    let fecha = body.fechaEmision.split('/');
    let impuestoComprobante = new ImpuestoComprobante();
    let fechaAuxiliar = `${fecha[2]}/${fecha[1]}/${fecha[0]}`;
    let empresaDB = await getEmpresa(body.empresa);
    let tipoIdentificacion = await getTipoIdentificacion(body.cliente.tipoIdentificacion);
    let clienteEmision = await consultarCliente(body.cliente.numeroIdentificacion);
    let secuencial = pad.substring(0, pad.length - empresaDB.secuencialFactura.length) + empresaDB.secuencialFactura;
    let claveAcceso = fecha[2] + fecha[1] + fecha[0] +
        '01' + empresaDB.ruc + empresaDB.ambiente + empresaDB.establecimiento + empresaDB.puntoEmision +
        secuencial +
        '00000001' + empresaDB.tipoEmision;
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
        fechaRegistro: new Date(),
        usuario: usuario._id,
        empresa: empresaDB._id,
        cliente: clienteEmision._id
    });
    let facturaDB = await guardarFacturaEmitida(factura);
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
    let datosAdicionales = await guardarDatosAdicionales(body.datosAdicionales, facturaDB);
    let xmlGenerado = crearXML(facturaDB, impuesto, formasPago, detalles, datosAdicionales);
    let pathXML = path.resolve(__dirname, `../../uploads/${claveAcceso}.xml`);
    await actualizarSecuencial(empresaDB._id);
    fs.writeFileSync(pathXML, xmlGenerado);
    let respuesta = await firma(claveAcceso, res)
    let identificacion = facturaDB.identificacionComprador;
    // let clienteDB = await consultarCliente(identificacion);
    let informacionPdf = await cargarInformacion(facturaDB, clienteEmision);

    let pdf = await generarPdf(claveAcceso, informacionPdf, detalles, formasPago, datosAdicionales, res)

    return claveAcceso;
}

let consultarCliente = async(identificacion) => {
    let clienteFactura = await Cliente.find({ numeroIdentificacion: identificacion });
    return clienteFactura[0];
}

let cargarInformacion = async(facturaDB, clienteFactura2) => {
    var tipoIdentificacionComp = await getTipoIdentificacionCodigo(facturaDB.tipoIdentificacionComprador);
    var informacion = {
        razonSocial: facturaDB.razonSocial,
        ruc: facturaDB.ruc,
        nombreComercial: facturaDB.nombreComercial,
        numeroFactura: facturaDB.estab + '-' + facturaDB.ptoEmi + '-' + facturaDB.secuencial,
        direccionEstablecimiento: facturaDB.dirEstablecimiento,
        contribuyenteEspecial: facturaDB.contribuyenteEspecial,
        obligadoContabilidad: facturaDB.obligadoContabilidad,
        claveAcceso: facturaDB.claveAcceso,
        ambiente: facturaDB.ambiente === '1' ? 'PRUEBAS' : 'PRODUCCION',
        tipoEmision: facturaDB.tipoEmision === '1' ? 'NORMAL' : '',
        razonCliente: facturaDB.razonSocialComprador,
        tipoIdentificacionCliente: tipoIdentificacionComp.tipoIdentificacion,
        identificacionCliente: facturaDB.identificacionComprador,
        direccionCliente: clienteFactura2.direccion,
        telefonoCliente: clienteFactura2.telefono,
        emailCliente: clienteFactura2.mail,
        fecha: facturaDB.fechaRegistro,
        subTotalDoce: facturaDB.totalSinImpuestos,
        valorIva: facturaDB.totalIva,
        valorTotal: facturaDB.importeTotal
    };
    return informacion;
}

app.post('/comprobante', [verificaToken], (req, res) => {
    let body = req.body;
    let usuario = req.usuario;
    let clave = guardarFactura(body, usuario, res);
});

app.post('/mail', [verificaToken], (req, res) => {
    let body = req.body;
    let claveAcceso = body.claveAcceso;
    envioMail(claveAcceso, res);
});

function invertirCadena(cadena) {
    let cadenaInvertida = '';
    for (let index = cadena.length - 1; index >= 0; index--) {
        cadenaInvertida = cadenaInvertida + cadena.charAt(index);
    }
    return cadenaInvertida;
}

function p_obtener_aleatorio() {
    return Math.floor(Math.random() * 999000) + 990;
}

let leerXML = async(facturaPath) => {
    const data = fs.readFileSync(facturaPath);
    return data.toString();
}

function bigint2base64(bigint) {
    var base64 = '';
    base64 = btoa(bigint.toString(16).match(/\w{2}/g).map(function(a) { return String.fromCharCode(parseInt(a, 16)); }).join(""));

    base64 = base64.match(/.{1,76}/g).join("\n");

    return base64;
}

function hexToBase64(str) {
    var hex = ('00' + str).slice(0 - str.length - str.length % 2);

    return btoa(String.fromCharCode.apply(null,
        hex.replace(/\r|\n/g, "").replace(/([\da-fA-F]{2}) ?/g, "0x$1 ").replace(/ +$/, "").split(" ")));
}

function sha1_base64(txt) {
    var md = forge.md.sha1.create();
    md.update(txt);
    return new Buffer(md.digest().toHex(), 'hex').toString('base64');
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

function firmarComprobante(mi_contenido_p12, mi_pwd_p12, comprobante) {
    var arrayUint8 = new Uint8Array(mi_contenido_p12);
    var p12B64 = forge.util.binary.base64.encode(arrayUint8);
    var p12Der = forge.util.decode64(p12B64);
    var p12Asn1 = forge.asn1.fromDer(p12Der);

    var p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, mi_pwd_p12);
    var certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
    var cert = certBags[forge.oids.certBag][3].cert;
    var pkcs8bags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
    var pkcs8 = pkcs8bags[forge.oids.pkcs8ShroudedKeyBag][3];
    var key = pkcs8.key;
    if (key == null) {
        key = pkcs8.asn1;
    }

    certificateX509_pem = forge.pki.certificateToPem(cert);

    certificateX509 = certificateX509_pem;
    certificateX509 = certificateX509.substr(certificateX509.indexOf('\n'));
    certificateX509 = certificateX509.substr(0, certificateX509.indexOf('\n-----END CERTIFICATE-----'));

    certificateX509 = certificateX509.replace(/\r?\n|\r/g, '').replace(/([^\0]{76})/g, '$1\n');

    //Pasar certificado a formato DER y sacar su hash:
    certificateX509_asn1 = forge.pki.certificateToAsn1(cert);
    certificateX509_der = forge.asn1.toDer(certificateX509_asn1).getBytes();
    certificateX509_der_hash = sha1_base64(certificateX509_der);

    //Serial Number
    var X509SerialNumber = parseInt(cert.serialNumber, 16);

    exponent = hexToBase64(key.e.data[0].toString(16));
    modulus = bigint2base64(key.n);


    var sha1_comprobante = sha1_base64(comprobante.replace('<?xml version="1.0" encoding="UTF-8"?>\n', ''));

    var xmlns = 'xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:etsi="http://uri.etsi.org/01903/v1.3.2#"';

    //numeros involucrados en los hash:

    //var Certificate_number = 1217155;//p_obtener_aleatorio(); //1562780 en el ejemplo del SRI
    var Certificate_number = p_obtener_aleatorio(); //1562780 en el ejemplo del SRI

    //var Signature_number = 1021879;//p_obtener_aleatorio(); //620397 en el ejemplo del SRI
    var Signature_number = p_obtener_aleatorio(); //620397 en el ejemplo del SRI

    //var SignedProperties_number = 1006287;//p_obtener_aleatorio(); //24123 en el ejemplo del SRI
    var SignedProperties_number = p_obtener_aleatorio(); //24123 en el ejemplo del SRI

    //numeros fuera de los hash:

    //var SignedInfo_number = 696603;//p_obtener_aleatorio(); //814463 en el ejemplo del SRI
    var SignedInfo_number = p_obtener_aleatorio(); //814463 en el ejemplo del SRI

    //var SignedPropertiesID_number = 77625;//p_obtener_aleatorio(); //157683 en el ejemplo del SRI
    var SignedPropertiesID_number = p_obtener_aleatorio(); //157683 en el ejemplo del SRI

    //var Reference_ID_number = 235824;//p_obtener_aleatorio(); //363558 en el ejemplo del SRI
    var Reference_ID_number = p_obtener_aleatorio(); //363558 en el ejemplo del SRI

    //var SignatureValue_number = 844709;//p_obtener_aleatorio(); //398963 en el ejemplo del SRI
    var SignatureValue_number = p_obtener_aleatorio(); //398963 en el ejemplo del SRI

    //var Object_number = 621794;//p_obtener_aleatorio(); //231987 en el ejemplo del SRI
    var Object_number = p_obtener_aleatorio(); //231987 en el ejemplo del SRI



    var SignedProperties = '';

    SignedProperties += '<etsi:SignedProperties Id="Signature' + Signature_number + '-SignedProperties' + SignedProperties_number + '">'; //SignedProperties
    SignedProperties += '<etsi:SignedSignatureProperties>';
    SignedProperties += '<etsi:SigningTime>';

    //SignedProperties += '2016-12-24T13:46:43-05:00';//moment().format('YYYY-MM-DD\THH:mm:ssZ');
    SignedProperties += moment().format('YYYY-MM-DD\THH:mm:ssZ');

    SignedProperties += '</etsi:SigningTime>';
    SignedProperties += '<etsi:SigningCertificate>';
    SignedProperties += '<etsi:Cert>';
    SignedProperties += '<etsi:CertDigest>';
    SignedProperties += '<ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1">';
    SignedProperties += '</ds:DigestMethod>';
    SignedProperties += '<ds:DigestValue>';

    SignedProperties += certificateX509_der_hash;

    SignedProperties += '</ds:DigestValue>';
    SignedProperties += '</etsi:CertDigest>';
    SignedProperties += '<etsi:IssuerSerial>';
    SignedProperties += '<ds:X509IssuerName>';
    SignedProperties += 'CN=AC BANCO CENTRAL DEL ECUADOR,L=QUITO,OU=ENTIDAD DE CERTIFICACION DE INFORMACION-ECIBCE,O=BANCO CENTRAL DEL ECUADOR,C=EC';
    SignedProperties += '</ds:X509IssuerName>';
    SignedProperties += '<ds:X509SerialNumber>';

    SignedProperties += X509SerialNumber;

    SignedProperties += '</ds:X509SerialNumber>';
    SignedProperties += '</etsi:IssuerSerial>';
    SignedProperties += '</etsi:Cert>';
    SignedProperties += '</etsi:SigningCertificate>';
    SignedProperties += '</etsi:SignedSignatureProperties>';
    SignedProperties += '<etsi:SignedDataObjectProperties>';
    SignedProperties += '<etsi:DataObjectFormat ObjectReference="#Reference-ID-' + Reference_ID_number + '">';
    SignedProperties += '<etsi:Description>';

    SignedProperties += 'contenido comprobante';

    SignedProperties += '</etsi:Description>';
    SignedProperties += '<etsi:MimeType>';
    SignedProperties += 'text/xml';
    SignedProperties += '</etsi:MimeType>';
    SignedProperties += '</etsi:DataObjectFormat>';
    SignedProperties += '</etsi:SignedDataObjectProperties>';
    SignedProperties += '</etsi:SignedProperties>'; //fin SignedProperties

    SignedProperties_para_hash = SignedProperties.replace('<etsi:SignedProperties', '<etsi:SignedProperties ' + xmlns);

    var sha1_SignedProperties = sha1_base64(SignedProperties_para_hash);


    var KeyInfo = '';

    KeyInfo += '<ds:KeyInfo Id="Certificate' + Certificate_number + '">';
    KeyInfo += '\n<ds:X509Data>';
    KeyInfo += '\n<ds:X509Certificate>\n';

    //CERTIFICADO X509 CODIFICADO EN Base64 
    KeyInfo += certificateX509;

    KeyInfo += '\n</ds:X509Certificate>';
    KeyInfo += '\n</ds:X509Data>';
    KeyInfo += '\n<ds:KeyValue>';
    KeyInfo += '\n<ds:RSAKeyValue>';
    KeyInfo += '\n<ds:Modulus>\n';

    //MODULO DEL CERTIFICADO X509
    KeyInfo += modulus;

    KeyInfo += '\n</ds:Modulus>';
    KeyInfo += '\n<ds:Exponent>';

    //KeyInfo += 'AQAB';
    KeyInfo += exponent;

    KeyInfo += '</ds:Exponent>';
    KeyInfo += '\n</ds:RSAKeyValue>';
    KeyInfo += '\n</ds:KeyValue>';
    KeyInfo += '\n</ds:KeyInfo>';

    KeyInfo_para_hash = KeyInfo.replace('<ds:KeyInfo', '<ds:KeyInfo ' + xmlns);

    var sha1_certificado = sha1_base64(KeyInfo_para_hash);


    var SignedInfo = '';

    SignedInfo += '<ds:SignedInfo Id="Signature-SignedInfo' + SignedInfo_number + '">';
    SignedInfo += '\n<ds:CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315">';
    SignedInfo += '</ds:CanonicalizationMethod>';
    SignedInfo += '\n<ds:SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1">';
    SignedInfo += '</ds:SignatureMethod>';
    SignedInfo += '\n<ds:Reference Id="SignedPropertiesID' + SignedPropertiesID_number + '" Type="http://uri.etsi.org/01903#SignedProperties" URI="#Signature' + Signature_number + '-SignedProperties' + SignedProperties_number + '">';
    SignedInfo += '\n<ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1">';
    SignedInfo += '</ds:DigestMethod>';
    SignedInfo += '\n<ds:DigestValue>';

    //HASH O DIGEST DEL ELEMENTO <etsi:SignedProperties>';
    SignedInfo += sha1_SignedProperties;

    SignedInfo += '</ds:DigestValue>';
    SignedInfo += '\n</ds:Reference>';
    SignedInfo += '\n<ds:Reference URI="#Certificate' + Certificate_number + '">';
    SignedInfo += '\n<ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1">';
    SignedInfo += '</ds:DigestMethod>';
    SignedInfo += '\n<ds:DigestValue>';

    //HASH O DIGEST DEL CERTIFICADO X509
    SignedInfo += sha1_certificado;

    SignedInfo += '</ds:DigestValue>';
    SignedInfo += '\n</ds:Reference>';
    SignedInfo += '\n<ds:Reference Id="Reference-ID-' + Reference_ID_number + '" URI="#comprobante">';
    SignedInfo += '\n<ds:Transforms>';
    SignedInfo += '\n<ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature">';
    SignedInfo += '</ds:Transform>';
    SignedInfo += '\n</ds:Transforms>';
    SignedInfo += '\n<ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1">';
    SignedInfo += '</ds:DigestMethod>';
    SignedInfo += '\n<ds:DigestValue>';

    //HASH O DIGEST DE TODO EL ARCHIVO XML IDENTIFICADO POR EL id="comprobante" 
    SignedInfo += sha1_comprobante;

    SignedInfo += '</ds:DigestValue>';
    SignedInfo += '\n</ds:Reference>';
    SignedInfo += '\n</ds:SignedInfo>';

    SignedInfo_para_firma = SignedInfo.replace('<ds:SignedInfo', '<ds:SignedInfo ' + xmlns);

    var md = forge.md.sha1.create();
    md.update(SignedInfo_para_firma, 'utf8');

    var signature = btoa(key.sign(md)).match(/.{1,76}/g).join("\n");


    var xades_bes = '';

    //INICIO DE LA FIRMA DIGITAL 
    xades_bes += '<ds:Signature ' + xmlns + ' Id="Signature' + Signature_number + '">';
    xades_bes += '\n' + SignedInfo;

    xades_bes += '\n<ds:SignatureValue Id="SignatureValue' + SignatureValue_number + '">\n';

    //VALOR DE LA FIRMA (ENCRIPTADO CON LA LLAVE PRIVADA DEL CERTIFICADO DIGITAL) 
    xades_bes += signature;

    xades_bes += '\n</ds:SignatureValue>';

    xades_bes += '\n' + KeyInfo;

    xades_bes += '\n<ds:Object Id="Signature' + Signature_number + '-Object' + Object_number + '">';
    xades_bes += '<etsi:QualifyingProperties Target="#Signature' + Signature_number + '">';

    //ELEMENTO <etsi:SignedProperties>';
    xades_bes += SignedProperties;

    xades_bes += '</etsi:QualifyingProperties>';
    xades_bes += '</ds:Object>';
    xades_bes += '</ds:Signature>';

    //FIN DE LA FIRMA DIGITAL 

    return comprobante.replace(/(<[^<]+)$/, xades_bes + '$1');
    //return comprobante;
}

module.exports = app;