let FacturaEmitida = require('../models/facturaemitida');
let http = require('https');
const axios = require('axios').default;
const fs = require("fs");
const path = require('path');

let envioMail = async(claveAcceso, res) => {
    // let facturaEmitida = await obtenerDatos(claveAcceso);
    // console.log(`${facturaEmitida} desde midel`);
    // const options = {
    //     "method": "POST",
    //     "hostname": "api.sendgrid.com",
    //     "port": null,
    //     "path": "/v3/mail/send",
    //     "headers": {
    //         "authorization": "Bearer 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",
    //         "content-type": "application/json"
    //     }
    // };

    var pdf_path = path.resolve(__dirname, '../../uploads/output.pdf');
    var pdf_file = fs.readFileSync(pdf_path).toString("base64");

    var xml_path = path.resolve(__dirname, '../../uploads/1506202001170805163400120010010000007470000021911.xml');
    var xml_file = fs.readFileSync(xml_path).toString("base64");

    let htmlTemplate = '<!DOCTYPE html><html><body><h1>Este es un mensaje de prueba con adjunto</h1></body></html>'

    axios({
            method: "post",
            url: "https://api.sendgrid.com/v3/mail/send",
            headers: {
                Authorization: "Bearer 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"
            },
            data: {
                personalizations: [{
                    to: [
                        { email: 'boris_marco_moreno@hotmail.com' },
                        { email: 'inmain.comprobantes@gmail.com' }
                    ],
                    subject: `Factura emitida ${claveAcceso}`
                }],
                from: { email: 'borismoreno84@gmail.com', name: 'Boris Comprobantes' },
                content: [{ type: 'text/html', value: htmlTemplate }],
                attachments: [{
                        content: pdf_file,
                        filename: "1506202001170805163400120010010000007470000021911.pdf",
                        type: "application/pdf",
                        disposition: "attachment"
                    },
                    {
                        content: xml_file,
                        filename: "1506202001170805163400120010010000007470000021911.xml",
                        type: "application/xml",
                        disposition: "attachment"
                    }
                ]
            }
        })
        .then(function(response) {
            res.json({
                ok: true,
                codigo: response.status,
                mensaje: response.statusText
            });
        })
        .catch(function(error) {
            res.status(500).json({
                ok: false,
                err: error.response.data.errors
            })
        });

    // var req = http.request(options, function(res) {
    //     var chunks = [];

    //     res.addListener('data', function(chunk) {
    //         chunks.push(chunk);
    //     });

    //     res.addListener('end', function() {
    //         var body = Buffer.concat(chunks);
    //         console.log(body.toString());
    //     });
    // });

    // req.write(JSON.stringify({
    //     personalizations: [{
    //         to: [
    //             { email: 'boris_marco_moreno@hotmail.com', name: 'Boris Moreno' },
    //             { email: 'borismoreno84@gmail.com', name: 'Marco Moreno' }
    //         ],
    //         subject: 'Mensaje de prueba'
    //     }],
    //     from: { email: 'boris_marco_moreo@hotmail.com', name: 'Inmain Comprobantes' },
    //     content: [{ type: 'text/html', value: htmlTemplate }]
    // }), (err) => {
    //     console.log({ err });
    // });
    // req.end();
}

let obtenerDatos = async(claveAcceso) => {
    let datosFactura = await FacturaEmitida.find({ claveAcceso: claveAcceso })
        .populate('empresa')
        .exec();
    // .exec((err, facturaEmitidaDB) => {
    //     if (err) console.log(err);
    //     datosFactura = facturaEmitidaDB;
    //     console.log(datosFactura);
    // });
    return datosFactura;
}

module.exports = {
    envioMail
}