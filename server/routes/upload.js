const express = require('express');
const fileUpLoad = require('express-fileupload');
const Usuario = require('../models/usuario');
const Producto = require('../models/producto');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(fileUpLoad({ useTempFiles: true }));

app.put('/upload/:tipo/:id', (req, res) => {
    let tipo = req.params.tipo;
    let id = req.params.id;
    if (!req.files) {
        return res.status(400).json({
            ok: false,
            err: {
                message: 'No se ha enviado ningun archivo'
            }
        });
    }

    let tiposValidos = ['productos', 'usuarios'];
    if (tiposValidos.indexOf(tipo) < 0) {
        return res.status(400).json({
            ok: false,
            message: 'Tipo no permitido ' + tiposValidos.join(' ')
        });
    }

    let extensionesValidas = ['png', 'jpg', 'gif', 'jpeg'];
    let sampleFile = req.files.archivo;
    let nombreArchivo = sampleFile.name.split('.');
    let extension = nombreArchivo[nombreArchivo.length - 1];
    if (extensionesValidas.indexOf(extension.toLowerCase()) < 0) {
        return res.status(400).json({
            ok: false,
            message: 'Tipo de archivo no permitido ' + extensionesValidas.join(' '),
            ext: extension
        });
    }

    //Cambiar nombre archivo
    let nombreArch = `${id}-${new Date().getMilliseconds()}.${extension}`;

    sampleFile.mv(`uploads/${tipo}/${nombreArch}`, (err) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }

        //Aqui ya se carga la imagen
        if (tipo === 'usuarios')
            imagenUsuario(id, res, nombreArch);
        else
            imagenProducto(id, res, nombreArch);
    })
});

function imagenUsuario(id, res, nombreArch) {
    Usuario.findById(id, (err, usuarioBD) => {
        if (err) {
            borraArchivo(nombreArch, 'usuarios');
            return res.status(500).json({
                ok: false,
                err
            })
        }

        if (!usuarioBD) {
            borraArchivo(nombreArch, 'usuarios');
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'Usuario no existe'
                }
            })
        }

        borraArchivo(usuarioBD.img, 'usuarios');

        usuarioBD.img = nombreArch;
        usuarioBD.save((err, usuarioGuardado) => {
            res.json({
                ok: true,
                message: 'Usuario guardado',
                img: nombreArch
            })
        })
    });
}

function imagenProducto(id, res, nombreArch) {
    Producto.findById(id, (err, productoBD) => {
        if (err) {
            borraArchivo(nombreArch, 'productos');
            return res.status(500).json({
                ok: false,
                err
            })
        }

        if (!productoBD) {
            borraArchivo(nombreArch, 'productos');
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'Producto no existe'
                }
            })
        }

        borraArchivo(productoBD.img, 'productos');

        productoBD.img = nombreArch;
        productoBD.save((err, productoGuardado) => {
            res.json({
                ok: true,
                message: 'Producto guardado',
                img: nombreArch,
                producto: productoGuardado
            })
        })
    });
}

function borraArchivo(nombreArchivo, tipo) {
    let pathImg = path.resolve(__dirname, `../../uploads/${tipo}/${nombreArchivo}`);
    if (fs.existsSync(pathImg)) {
        fs.unlinkSync(pathImg);
    }
}

module.exports = app;