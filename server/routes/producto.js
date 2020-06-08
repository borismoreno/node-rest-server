const express = require('express');
const { verificaToken } = require('../middlewares/autenticacion');
app = express();
let Producto = require('../models/producto');

// ===========================
// Obtener todos los productos
// ===========================
app.get('/producto', verificaToken, (req, res) => {
    let desde = req.query.desde || 0;
    desde = Number(desde);
    Producto.find({ activo: true })
        .skip(desde)
        .limit(5)
        .populate('usuario', 'nombre email')
        .populate('tipoProducto', 'descripcion codigo')
        .populate('tarifaIva', 'porcentaje codigo')
        .exec((err, productos) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    err
                });
            }
            res.json({
                ok: true,
                productos
            });
        })
});

// ==========================
// Obtener un producto por ID
// ==========================
app.get('/producto/:id', verificaToken, (req, res) => {
    let id = req.params.id;
    Producto.findById(id)
        .populate('usuario', 'nombre email')
        .populate('tipoProducto', 'descripcion codigo')
        .populate('tarifaIva', 'porcentaje codigo')
        .exec((err, productoDB) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    err
                });
            }

            if (!productoDB) {
                return res.status(400).json({
                    ok: false,
                    err: {
                        message: 'Producto con ese ID no existe'
                    }
                });
            }
            res.json({
                ok: true,
                producto: productoDB
            });
        });
});

// ==========================
// Buscar productos
// ==========================
app.get('/productos/buscar/:termino', verificaToken, (req, res) => {
    let termino = req.params.termino;
    let regex = new RegExp(termino, 'i');
    Producto.find({ nombre: regex })
        .populate('categoria', 'descripcion')
        .exec((err, productos) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    err
                });
            }


            res.json({
                ok: true,
                productos
            });
        })
});

// ==========================
// Buscar producto por codigo
// ==========================
app.get('/producto/buscarCodigo/:codigo', verificaToken, (req, res) => {
    let codigo = req.params.codigo;
    Producto.find({ codigoPrincipal: codigo })
        .populate('usuario', 'nombre email')
        .populate('tipoProducto', 'descripcion codigo')
        .populate('tarifaIva', 'porcentaje codigo')
        .exec((err, producto) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    err
                });
            }
            res.json({
                ok: true,
                producto
            });
        })
});

// ==========================
// Crear producto
// ==========================
app.post('/producto', verificaToken, (req, res) => {
    let body = req.body;

    let producto = new Producto({
        codigoPrincipal: body.codigoPrincipal,
        codigoAuxiliar: body.codigoAuxiliar,
        tipoProducto: body.tipoProducto,
        tarifaIva: body.tarifaIva,
        usuario: req.usuario._id,
        descripcion: body.descripcion,
        descuento: body.descuento,
        valorUnitario: body.valorUnitario,
        fechaModificacion: new Date()
    });

    producto.save((err, productoDB) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }
        res.status(201).json({
            ok: true,
            producto: productoDB
        });
    })
});

// ==========================
// Actualizar un producto
// ==========================
app.put('/producto/:id', verificaToken, (req, res) => {
    let id = req.params.id;
    let body = req.body;
    Producto.findById(id, (err, productoDB) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }
        if (!productoDB) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'El producto con el ID no existe'
                }
            });
        }

        productoDB.codigoPrincipal = body.codigoPrincipal,
            productoDB.codigoAuxiliar = body.codigoAuxiliar,
            productoDB.tipoProducto = body.tipoProducto,
            productoDB.tarifaIva = body.tarifaIva,
            productoDB.usuario = req.usuario._id,
            productoDB.descripcion = body.descripcion,
            productoDB.descuento = body.descuento,
            productoDB.valorUnitario = body.valorUnitario,
            productoDB.fechaModificacion = new Date()

        productoDB.save((err, productoGuardado) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    err
                });
            }
            res.json({
                ok: true,
                producto: productoGuardado
            });
        });

    });
});

// ==========================
// Eliminar un producto
// ==========================
app.delete('/producto/:id', verificaToken, (req, res) => {
    let id = req.params.id;
    Producto.findByIdAndRemove(id, (err, productoDB) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }
        if (!productoDB) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'El producto con ese ID no existe'
                }
            });
        }
        res.json({
            ok: true,
            mensaje: 'Producto Borrado'
        });
    });
});

module.exports = app;