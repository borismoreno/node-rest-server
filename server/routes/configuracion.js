const express = require('express');
const { verificaToken, verificaAdminRol } = require('../middlewares/autenticacion');
app = express();

let TipoIdentificacion = require('../models/tipoIdentificacion');

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

module.exports = app;