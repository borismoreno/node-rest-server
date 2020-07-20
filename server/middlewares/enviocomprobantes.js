const soapRequest = require('easy-soap-request');
const fs = require('fs');
const path = require('path');
let ErrorRegistro = require('../models/errorregistro');

let envioComprobante = async(ambiente, comprobanteFirmado, facturaDB) => {
    return new Promise((resolve, reject) => {
        let url = 'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl';
        if (ambiente === 2) {
            url = 'https://cel.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl';
        }
        let xml = "<?xml version=\"1.0\" encoding=\"utf-8\"?>" +
            " <SOAP-ENV:Envelope xmlns:SOAP-ENV=\"http://schemas.xmlsoap.org/soap/envelope/\"" +
            " xmlns:ns1=\"http://ec.gob.sri.ws.recepcion\">" +
            "  <SOAP-ENV:Body>" +
            "    <ns1:validarComprobante>" +
            "      <xml>" + Buffer.from(comprobanteFirmado, 'utf8').toString('base64') + "</xml>" +
            // "      <xml>" + btoa(Buffer.from(comprobanteFirmado).toString('base64')) + "</xml>" +
            "    </ns1:validarComprobante>" +
            "  </SOAP-ENV:Body>" +
            "</SOAP-ENV:Envelope>";
        // usage of module
        (async() => {
            var respuestaFirma;
            try {
                const { response } = await soapRequest({ url: url, xml: xml, timeout: 30000 }); // Optional timeout parameter(milliseconds)
                const { statusCode } = response;
                facturaDB.estadoComprobante = 'REC';
                facturaDB.save();
                respuestaFirma = {
                    ok: 'true',
                    statusCode
                }
            } catch (error) {
                let idFactura = '0';
                if (facturaDB !== undefined) { idFactura = facturaDB._id }
                let nuevoError = new ErrorRegistro({
                    facturaEmitida: idFactura,
                    mensajeError: `Error al consumir el servicio validarComprobante-${error}`,
                    fechaCreacion: new Date()
                });
                await nuevoError.save();
                respuestaFirma = {
                    ok: 'false'
                }
            }
            resolve(respuestaFirma);
        })();
    });
}

let obtenerAutorizacion = async(ambiente, clave, facturaDB) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            let url = 'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl';
            if (ambiente === 2) {
                url = 'https://cel.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl';
            }
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
                var respuestaAutorizacionEnviar;
                try {
                    const { response } = await soapRequest({ url: url, xml: xml, timeout: 30000 }); // Optional timeout parameter(milliseconds)
                    const { body, statusCode } = response;
                    let resultado = body.toString();
                    let respuestaAutorizacion = await GetRespuestaAutorizacion(resultado);
                    respuestaAutorizacionEnviar = respuestaAutorizacion.estadoRespuesta;
                    if (respuestaAutorizacion.estadoRespuesta === 'AUTORIZADO') {
                        var xmlString = '<?xml version=\"1.0\" encoding=\"UTF-8\"?><autorizacion>' +
                            `<estado>${respuestaAutorizacion.estadoRespuesta}</estado>` +
                            `<numeroAutorizacion>${respuestaAutorizacion.numeroAutorizacion}</numeroAutorizacion>` +
                            `<fechaAutorizacion>${respuestaAutorizacion.fechaAutorizacion}</fechaAutorizacion>` +
                            `<comprobante><![CDATA[${respuestaAutorizacion.comprobante.split('&lt;').join('<')}]]></comprobante>` +
                            `</autorizacion>`;
                        let pathXML = path.resolve(__dirname, `../../uploads/${clave}.xml`);
                        fs.writeFileSync(pathXML, xmlString);
                        facturaDB.estadoComprobante = 'AUT';
                        facturaDB.save();
                    } else if (respuestaAutorizacion.estadoRespuesta === 'NO AUTORIZADO') {
                        facturaDB.estadoComprobante = 'NAT';
                        facturaDB.save();
                        let nuevoError = new ErrorRegistro({
                            facturaEmitida: facturaDB._id,
                            mensajeError: `${respuestaAutorizacion.identificadorError}-${respuestaAutorizacion.mensajeErrorRespuesta}-${respuestaAutorizacion.informacionAdicional}`,
                            fechaCreacion: new Date()
                        });
                        await nuevoError.save();
                    }
                } catch (error) {
                    let idFactura = '0';
                    if (facturaDB !== undefined) { idFactura = facturaDB._id }
                    let nuevoError = new ErrorRegistro({
                        facturaEmitida: idFactura,
                        mensajeError: `Error al consumir el servicio autorizacionComprobante-${error}`,
                        fechaCreacion: new Date()
                    });
                    await nuevoError.save();
                    respuestaAutorizacionEnviar = 'NO AUTORIZADO'
                }
                resolve(respuestaAutorizacionEnviar);
            })();
        }, 5000);
    });
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
            ok: true,
            estadoRespuesta,
            numeroAutorizacion,
            fechaAutorizacion,
            comprobante
        }

        return respuesta;
    } else if (estadoRespuesta === 'NO AUTORIZADO') {
        let identificadorError;
        let mensajeErrorRespuesta;
        let informacionAdicional;
        aux1 = respuesta.indexOf('<identificador>');
        aux2 = respuesta.indexOf('</identificador>');
        if ((aux1 > 0) && (aux2 > 0))
            identificadorError = `${respuesta.substring(aux1 + 15, aux2)}`;
        aux1 = respuesta.indexOf('identificador><mensaje>');
        aux2 = respuesta.indexOf('</mensaje>');
        if ((aux1 > 0) && (aux2 > 0))
            mensajeErrorRespuesta = `${respuesta.substring(aux1 + 23, aux2)}`;
        aux1 = respuesta.indexOf('<informacionAdicional>');
        aux2 = respuesta.indexOf('</informacionAdicional>');
        if ((aux1 > 0) && (aux2 > 0))
            informacionAdicional = `${respuesta.substring(aux1 + 22, aux2)}`;
        let respuestaError = {
            ok: false,
            estadoRespuesta,
            identificadorError,
            mensajeErrorRespuesta,
            informacionAdicional
        }
        return respuestaError;
    }
}

module.exports = {
    envioComprobante,
    obtenerAutorizacion
}