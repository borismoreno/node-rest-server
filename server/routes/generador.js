const express = require('express');
const fs = require('fs');
const pdf = require('pdf-creator-node');
const path = require('path');
let app = express();

var detalles = [{
        codigo: '001',
        descripcion: 'Servicio de prueba uno',
        cantidad: '2',
        precioUnitario: '$104.00',
        total: '$208.00'
    },
    {
        codigo: '002',
        descripcion: 'Servicio de prueba dos',
        cantidad: '3',
        precioUnitario: '$100.00',
        total: '$300.00'
    },
    {
        codigo: '003',
        descripcion: 'Servicio de prueba',
        cantidad: '1',
        precioUnitario: '$100.00',
        total: '$100.00'
    },
    {
        codigo: '003',
        descripcion: 'Servicio de prueba',
        cantidad: '1',
        precioUnitario: '$100.00',
        total: '$100.00'
    },
    {
        codigo: '003',
        descripcion: 'Servicio de prueba',
        cantidad: '1',
        precioUnitario: '$100.00',
        total: '$100.00'
    },
    {
        codigo: '003',
        descripcion: 'Servicio de prueba',
        cantidad: '1',
        precioUnitario: '$100.00',
        total: '$100.00'
    }
];

var formasPago = [{
        formaPago: 'OTROS CON UTILIZACION DEL SISTEMA FINANCIERO',
        valor: '$1200.00'
    },
    {
        formaPago: 'TARJETA DE CREDITO',
        valor: '$100.00'
    }
];

var adicionales = [{
        nombre: 'ORDEN DE COMPRA',
        valor: '1246555'
    },
    {
        nombre: 'OTRO ADICIIONAL',
        valor: '$100.00'
    }
];

var imgSrc = 'file://' + __dirname + '../../assets/templates/';
imgSrc = path.normalize(imgSrc);
let pathLogo = path.resolve(__dirname, `../assets/templates/logo.png`);

var informacion = {
    razonSocial: 'MARCO ARNALDO MORENO GUAMAN',
    ruc: '1708051634001',
    nombreComercial: 'INMAIN',
    numeroFactura: '001-003-000000133',
    direccionEstablecimiento: 'PASAJE MARIA GODOY OE1-25 Y AV. CACHA (CALDERON)',
    contribuyenteEspecial: '',
    obligadoContabilidad: 'NO',
    claveAcceso: '1506202001170805163400120010010000007470000021911',
    ambiente: 'PRUEBAS',
    tipoEmision: 'NORMAL',
    razonCliente: 'BORIS MORENO',
    tipoIdentificacionCliente: 'CEDULA',
    identificacionCliente: '1718363938',
    direccionCliente: 'LA VICENTINA',
    telefonoCliente: '0992703156',
    emailCliente: 'boris_marco_moreno@hotmail.com',
    fecha: '21 junio 2020',
    subTotalDoce: '$1200.00',
    valorIva: '$120.00',
    valorTotal: '$1320.00',
    pathLogo,
    imgSrc
};

app.put('/generador', (req, res) => {
    let pathTemplate = path.resolve(__dirname, `../assets/templates/pdf-template.html`);
    let html = fs.readFileSync(pathTemplate, 'utf8');
    let options = {
        format: 'A4',
        orientation: 'portrait',
        base: imgSrc
    };
    console.log(options);
    let pathImg = path.resolve(__dirname, `../../uploads/output.pdf`);
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
    console.log(document);
    pdf.create(document, options)
        .then(respuesta => {
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

module.exports = app;