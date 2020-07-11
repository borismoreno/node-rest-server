const express = require('express');
const { verificaToken, verificaAdminRol } = require('../middlewares/autenticacion');
app = express();

let Cliente = require('../models/cliente');

// Crear un cliente
app.post('/cliente', [verificaToken], (req, res) => {
    let body = req.body;
    let cliente = new Cliente({
        razonSocial: body.razonSocial,
        tipoIdentificacion: body.tipoIdentificacion,
        numeroIdentificacion: body.numeroIdentificacion,
        telefono: body.telefono,
        mail: body.mail,
        direccion: body.direccion,
        fechaModificacion: new Date(),
        usuario: req.usuario._id,
    });

    cliente.save((err, clienteDB) => {
        if (err) {
            if (err.code === 11000) {
                return res.status(500).json({
                    ok: false,
                    err: {
                        message: 'Ya existe un cliente con identificacion ' + cliente.numeroIdentificacion
                    }
                });
            }
            return res.status(500).json({
                ok: false,
                err
            });
        }
        res.status(201).json({
            ok: true,
            cliente: clienteDB
        });
    });
});

// ==========================
// Actualizar un producto
// ==========================
app.put('/cliente/:id', verificaToken, (req, res) => {
    let id = req.params.id;
    let body = req.body;
    Cliente.findById(id, (err, clienteDB) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }
        if (!clienteDB) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'El cliente con ese ID no existe'
                }
            });
        }

        clienteDB.razonSocial = body.razonSocial;
        clienteDB.tipoIdentificacion = body.tipoIdentificacion;
        clienteDB.numeroIdentificacion = body.numeroIdentificacion;
        clienteDB.telefono = body.telefono;
        clienteDB.mail = body.mail;
        clienteDB.direccion = body.direccion;
        clienteDB.fechaModificacion = new Date();
        clienteDB.usuario = req.usuario._id;

        clienteDB.save((err, clienteActualizado) => {
            if (err) {
                if (err.code === 11000) {
                    return res.status(500).json({
                        ok: false,
                        err: {
                            message: 'Ya existe un cliente con identificacion ' + clienteDB.numeroIdentificacion
                        }
                    });
                }
                return res.status(500).json({
                    ok: false,
                    err
                });
            }
            res.json({
                ok: true,
                cliente: clienteActualizado
            });
        });

    });
});

// Obtener todos los clientes
app.get('/cliente', (req, res) => {
    //app.get('/cliente', [verificaToken], (req, res) => {
    Cliente.find({ activo: true })
        .populate('tipoIdentificacion', 'tipoIdentificacion codigo')
        .exec((err, clientes) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    err
                });
            }
            // res.status(400).json({
            //     ok: false,
            //     err: {
            //         message: 'Error en el cliente'
            //     }
            // });
            res.json({
                ok: true,
                clientes
            });
        });
});

// Obtener Cliente por id
app.get('/cliente/:id', [verificaToken], (req, res) => {
    let id = req.params.id;
    Cliente.findById(id)
        .populate('tipoIdentificacion', 'tipoIdentificacion codigo')
        .exec((err, clienteDB) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    err
                });
            }

            if (!clienteDB) {
                return res.status(400).json({
                    ok: false,
                    err: {
                        message: 'Cliente con ese ID no existe'
                    }
                });
            }
            // res.status(400).json({
            //     ok: false,
            //     err: {
            //         message: 'Error en el cliente'
            //     }
            // });
            res.json({
                ok: true,
                cliente: clienteDB
            });
        });
});

// Obtener Cliente por identificacion
app.get('/cliente/buscar/:identificacion', [verificaToken], (req, res) => {
    let identificacion = req.params.identificacion;
    Cliente.find({ numeroIdentificacion: identificacion })
        .populate('tipoIdentificacion', 'tipoIdentificacion codigo')
        .exec((err, clienteDB) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    err
                });
            }

            if (!clienteDB) {
                return res.status(400).json({
                    ok: false,
                    err: {
                        message: 'Cliente con esa identificacion no existe'
                    }
                });
            }
            //console.log({ clienteDB });
            // if (clienteDB._id === undefined) {
            //     return res.status(400).json({
            //         ok: false,
            //         err: {
            //             message: 'Cliente con esa identificacion no existe'
            //         }
            //     });
            // }
            res.json({
                ok: true,
                cliente: clienteDB
            });
        });
});

// ==========================
// Eliminar un cliente
// ==========================
app.delete('/cliente/:id', verificaToken, (req, res) => {
    let id = req.params.id;
    Cliente.findByIdAndRemove(id, (err, clienteDB) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }
        if (!clienteDB) {
            return res.status(400).json({
                ok: false,
                message: 'El cliente con ese id no existe'
            });
        }
        res.json({
            ok: true,
            message: 'Cliente borrado'
        });
    });
});

module.exports = app;