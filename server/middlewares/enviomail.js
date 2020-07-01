let FacturaEmitida = require('../models/facturaemitida');
const path = require('path');
const fs = require('fs');
const mailComposer = require('mailcomposer');
var nodeses = require('node-ses'),
    client = nodeses.createClient({ key: process.env.API_KEY_SES, secret: process.env.SECRET_SES });

let envioMail = async(claveAcceso, res) => {
    var pdf_path = path.resolve(__dirname, `../../uploads/${claveAcceso}.pdf`);
    var xml_path = path.resolve(__dirname, `../../uploads/${claveAcceso}.xml`);

    let datos = await obtenerDatos(claveAcceso);

    var email = `${datos.empresa.nombreNotificacion} <${datos.empresa.mailEnvioComprobantes}>`;
    var emailEnvio = datos.cliente.mail;

    mailComposer({
        from: email,
        to: emailEnvio,
        subject: `Documento Electrónico Factura# ${datos.estab}-${datos.ptoEmi}-${datos.secuencial}`,
        text: `Estimado cliente ${datos.razonSocialComprador}\r\n\r\n` +
            `Nos complace adjuntar su e-factura con el siguiente detalle:\r\n\r\n` +
            `e - FACTURA No: ${datos.estab}-${datos.ptoEmi}-${datos.secuencial}\r\n\r\n` +
            `Fecha emisión: ${datos.fechaEmision}\r\n\r\n` +
            `Total: ${datos.importeTotal}\r\n\r\n` +
            `El documento pdf y xml de su factura se encuentra adjunto a este correo.\r\n\r\n` +
            `Atentamente:\r\n${datos.empresa.nombreComercial}\r\nRUC: ${datos.empresa.ruc}`,
        attachments: [{
                path: pdf_path,
                filename: `${claveAcceso}.pdf`
            },
            {
                path: xml_path,
                filename: `${claveAcceso}.xml`
            },
        ],
    }).build((err, message) => {
        if (err) {
            res.send(err);
        } else {
            client.sendRawEmail({
                    from: email,
                    rawMessage: message
                },
                function(err, data, respuesta) {

                    if (err) {
                        console.log(err);
                        res.status(500).json({
                            ok: false,
                            err
                        });
                    } else {
                        const { statusCode, statusMessage, body } = respuesta;
                        res.sendFile(pdf_path);
                        //borraArchivos(claveAcceso);
                        // res.status(200).json({
                        //     ok: true,
                        //     message: 'Factura Generada',
                        //     statusCode,
                        //     statusMessage
                        // });
                    }
                }
            )
        }

    });
}

let borraArchivos = async(claveAcceso) => {
    let pathPdf = path.resolve(__dirname, `../../uploads/${claveAcceso}.pdf`);
    if (fs.existsSync(pathPdf)) {
        fs.unlinkSync(pathPdf);
    }

    // let pathXml = path.resolve(__dirname, `../../uploads/${claveAcceso}.xml`);
    // if (fs.existsSync(pathXml)) {
    //     fs.unlinkSync(pathXml);
    // }
}

let obtenerDatos = async(claveAcceso) => {
    let datosFactura = await FacturaEmitida.find({ claveAcceso: claveAcceso })
        .populate('empresa')
        .populate('cliente')
        .exec();
    return datosFactura[0];
}

module.exports = {
    envioMail
}