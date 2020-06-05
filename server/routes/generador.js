const express = require('express');
const fs = require('fs');
const pdf = require('pdf-creator-node');
const path = require('path');
const nodeMailer = require('nodemailer');
let app = express();

var testAccount = nodeMailer.createTestAccount();

var users = [{
        name: "Shyam",
        age: "26"
    },
    {
        name: "Navjot",
        age: "26"
    },
    {
        name: "Vitthal",
        age: "26"
    }
];

var informacion = {
    nombre: 'Boris Moreno',
    identificacion: '1718363938'
};

app.put('/generador', (req, res) => {
    let pathTemplate = path.resolve(__dirname, `../assets/templates/template.html`);
    let html = fs.readFileSync(pathTemplate, 'utf8');
    let options = {
        format: 'Letter',
        orientation: 'portrait',
        border: "10mm",
        header: {
            height: "45mm",
            contents: '<div style="text-align: center;">Author: Boris Moreno</div>'
        }
    };
    let pathImg = path.resolve(__dirname, `../../uploads/output.pdf`);
    let document = {
        html: html,
        data: {
            users,
            informacion
        },
        path: pathImg
    };
    pdf.create(document, options)
        .then(respuesta => {
            enviarMail(res);
            res.json({
                ok: true,
                message: 'Archivo generado'
            });

        })
        .catch(error => {
            console.log(error);
            res.status(500).json({
                ok: false,
                error
            });
        });
});

function enviarMail(res) {
    console.log({ testAccount });
    var transporter = nodeMailer.createTransport({
        // host: "smtp.ethereal.email",
        // port: 587,
        // secure: false, // true for 465, false for other ports
        // auth: {
        //     user: testAccount.user, // generated ethereal user
        //     pass: testAccount.pass, // generated ethereal password
        // },
        service: 'Gmail',
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        requireTLS: true,
        auth: {
            user: 'borismoreno84',
            pass: 'Mateito810'
        },
    });

    var mailOptions = {
        from: 'borismoreno84@gmail.com',
        to: 'boris_marco_moreno@hotmail.com',
        subject: 'Sending Email using Node.js',
        text: 'That was easy!'
    };

    // transporter.sendMail({
    //     from: '"Fred Foo 👻" <foo@example.com>', // sender address
    //     to: "borismoreno84@gmail.com, boris_marco_moreno@hotmail.com", // list of receivers
    //     subject: "Hello ✔", // Subject line
    //     text: "Hello world?", // plain text body
    //     html: "<b>Hello world?</b>", // html body
    // });

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log('error');
            console.log({ error });
            return res.status(500).json({
                ok: false,
                error
            });
        } else {
            console.log('ok');
            return res.json({
                ok: true,
                message: 'Email sent: ' + info.response
            });
        }
    });
}

module.exports = app;