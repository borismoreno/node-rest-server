const soapRequest = require('easy-soap-request');
const fs = require('fs');
const path = require('path');

let envioComprobante = async(ambiente, comprobanteFirmado) => {
    return new Promise((resolve) => {
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
            var respuestaFirma
            try {
                const { response } = await soapRequest({ url: url, xml: xml, timeout: 30000 }); // Optional timeout parameter(milliseconds)
                const { statusCode } = response;
                respuestaFirma = {
                    ok: 'true',
                    statusCode
                }
            } catch (error) {
                respuestaFirma = {
                    ok: 'false',
                    error
                }
            }
            resolve(respuestaFirma);
        })();
    });
}

let obtenerAutorizacion = async(clave) => {
    return new Promise((resolve) => {
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
                resolve(respuestaAutorizacion.estadoRespuesta);
            })();
        }, 3000);
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
            estadoRespuesta,
            numeroAutorizacion,
            fechaAutorizacion,
            comprobante
        }

        return respuesta;
    }
}

module.exports = {
    envioComprobante,
    obtenerAutorizacion
}