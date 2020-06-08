const express = require('express');
const { verificaToken, verificaAdminRol } = require('../middlewares/autenticacion');
app = express();

let TipoIdentificacion = require('../models/tipoIdentificacion');
let TipoProducto = require('../models/tipoproducto');
let TarifaIva = require('../models/tarifaiva');
let TipoFormaPago = require('../models/tipoformapago');

app.post('/configuracion/tipoidentificacion', [verificaToken, verificaAdminRol], (req, res) => {
    let body = req.body;
    let tipoIden = new TipoIdentificacion({
        tipoIdentificacion: body.tipoIdentificacion,
        codigo: body.codigo,
        fechaModificacion: new Date(),
        usuario: req.usuario._id,
    });

    tipoIden.save((err, tipoIdentificacionDB) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }
        res.status(201).json({
            ok: true,
            tipoIdentificacion: tipoIdentificacionDB
        });
    });
});

app.get('/configuracion/tipoidentificacion', [verificaToken], (req, res) => {
    TipoIdentificacion.find({ activo: true })
        .populate('usuario', 'nombre email')
        .exec((err, tiposIdentificacion) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    err
                });
            }
            // res.status(400).json({
            //     ok: false,
            //     err: {
            //         message: 'Error en el servidor'
            //     }
            // });
            res.json({
                ok: true,
                tiposIdentificacion
            });
        })
});

app.post('/configuracion/tipoproducto', [verificaToken, verificaAdminRol], (req, res) => {
    let body = req.body;
    let tipoProducto = new TipoProducto({
        descripcion: body.descripcion,
        codigo: body.codigo,
        fechaModificacion: new Date(),
        usuario: req.usuario._id,
    });

    tipoProducto.save((err, tipoProductoDB) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }
        res.status(201).json({
            ok: true,
            tipoProducto: tipoProductoDB
        });
    });
});

app.get('/configuracion/tipoproducto', [verificaToken], (req, res) => {
    TipoProducto.find({ activo: true })
        .exec((err, tiposProducto) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    err
                });
            }
            res.json({
                ok: true,
                tiposProducto
            });
        })
});

app.post('/configuracion/tarifaiva', [verificaToken, verificaAdminRol], (req, res) => {
    let body = req.body;
    let tarifaIva = new TarifaIva({
        porcentaje: body.porcentaje,
        codigo: body.codigo,
        fechaModificacion: new Date(),
        usuario: req.usuario._id,
    });

    tarifaIva.save((err, tarifaIvaDB) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }
        res.status(201).json({
            ok: true,
            tarifaIva: tarifaIvaDB
        });
    });
});

app.get('/configuracion/tarifaiva', [verificaToken], (req, res) => {
    TarifaIva.find({ activo: true })
        .exec((err, tarifasIva) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    err
                });
            }
            res.json({
                ok: true,
                tarifasIva
            });
        })
});

app.post('/configuracion/tipoformapago', [verificaToken, verificaAdminRol], (req, res) => {
    let body = req.body;
    let tipoformapago = new TipoFormaPago({
        formaPago: body.formaPago,
        codigo: body.codigo,
        fechaModificacion: new Date(),
        usuario: req.usuario._id,
    });

    tipoformapago.save((err, tipoformapagoDB) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }
        res.status(201).json({
            ok: true,
            tipoformapago: tipoformapagoDB
        });
    });
});

app.get('/configuracion/tipoformapago', [verificaToken], (req, res) => {
    TipoFormaPago.find({ activo: true })
        .exec((err, tiposFormaPago) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    err
                });
            }
            res.json({
                ok: true,
                tiposFormaPago
            });
        })
});

module.exports = app;