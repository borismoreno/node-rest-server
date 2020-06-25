const express = require('express');
// const fileUpLoad = require('express-fileupload');
const { verificaToken, verificaAdminRol } = require('../middlewares/autenticacion');
const path = require('path');
const fs = require('fs');
const app = express();

// app.use(fileUpLoad({ useTempFiles: true }));

let Empresa = require('../models/empresa');

// ==========================
// Crear Empresa
// ==========================
app.post('/empresa', [verificaToken, verificaAdminRol], (req, res) => {
    let body = req.body;

    let empresa = new Empresa({
        ambiente: body.ambiente,
        tipoEmision: body.tipoEmision,
        razonSocial: body.razonSocial,
        nombreComercial: body.nombreComercial,
        establecimiento: body.establecimiento,
        puntoEmision: body.puntoEmision,
        direccionMatriz: body.direccionMatriz,
        direccionEstablecimiento: body.direccionEstablecimiento,
        contribuyenteEspecial: body.contribuyenteEspecial,
        obligadoContabilidad: body.obligadoContabilidad,
        secuencialFactura: body.secuencialFactura,
        secuencialNotaCredito: body.secuencialNotaCredito,
        secuencialRetencion: body.secuencialRetencion,
        claveFirma: body.claveFirma,
        mailEnvioComprobantes: body.mailEnvioComprobantes,
        claveMail: body.claveMail,
        pathLogo: body.pathLogo,
        nombreNotificacion: body.nombreNotificacion,
        servidor: body.servidor,
        puerto: body.puerto,
        ssl: body.ssl,
        activo: body.activo,
        fechaModificacion: new Date(),
        usuario: req.usuario._id,
        ruc: body.ruc
    });

    if (!req.files) {
        return res.status(400).json({
            ok: false,
            err: {
                message: 'No se ha enviado ningun archivo'
            }
        });
    }

    if (!req.files.pathCertificado) {
        return res.status(400).json({
            ok: false,
            err: {
                message: 'No se ha enviado el certificado digital'
            }
        });
    }

    if (!req.files.pathLogo) {
        return res.status(400).json({
            ok: false,
            err: {
                message: 'No se ha enviado el logo'
            }
        });
    }

    let extensionesValidasCertificado = ['p12'];
    let extensionesValidasLogo = ['png', 'jpg', 'jpeg'];
    let sampleFile = req.files.pathCertificado;
    let archivoLogo = req.files.pathLogo;
    let nombreArchivo = sampleFile.name.split('.');
    let nombreArchivoLogo = archivoLogo.name.split('.');

    // return res.json({
    //     nombreArchivo,
    //     extensionesValidasCertificado,
    //     empresa
    // });
    let extension = nombreArchivo[nombreArchivo.length - 1];
    let extensionLogo = nombreArchivoLogo[nombreArchivoLogo.length - 1];
    if (extensionesValidasCertificado.indexOf(extension.toLowerCase()) < 0) {
        return res.status(400).json({
            ok: false,
            message: 'El certificado ingresado no es valido, debe tener la extensión ' + extensionesValidasCertificado.join(' '),
            ext: extension,
            archivo: nombreArchivo.join('.')
        });
    }
    if (extensionesValidasLogo.indexOf(extensionLogo.toLowerCase()) < 0) {
        return res.status(400).json({
            ok: false,
            message: 'El logo ingresado no es valido, debe tener la extensión ' + extensionesValidasLogo.join(' '),
            ext: extensionLogo,
            archivo: nombreArchivoLogo.join('.')
        });
    }
    // return res.json({
    //     sampleFile,
    //     empresa
    // });
    let nombreCert = `${empresa._id}.${extension}`;
    sampleFile.mv(`uploads/certificados/${nombreCert}`, (err) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        } else {

        }
    });

    //Cambiar nombre archivo
    let nombreArch = `${empresa._id}.${extensionLogo}`;
    archivoLogo.mv(`uploads/logos/${nombreArch}`, (err) => {
        if (err) {
            borrarArchivo(nombreCert, 'certificados');
            return res.status(500).json({
                ok: false,
                err
            });
        } else {

        }
    });
    // return res.json({
    //     empresa
    // });
    empresa.pathLogo = nombreArch;
    empresa.pathCertificado = nombreCert;
    empresa.save((err, empresaDB) => {
        if (err) {
            borrarArchivo(nombreCert, 'certificados');
            borrarArchivo(nombreArch, 'logos');
            return res.status(500).json({
                ok: false,
                err
            });
        }
        res.status(201).json({
            ok: true,
            empresa: empresaDB
        });
    });
});

app.put('/empresa/:tipo/:id', (req, res) => {
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

    let tiposValidos = ['logos', 'certificados'];
    if (tiposValidos.indexOf(tipo) < 0) {
        return res.status(400).json({
            ok: false,
            message: 'Tipo no permitido ' + tiposValidos.join(' ')
        });
    }

    let extensionesValidas = ['png', 'jpg', 'gif', 'jpeg', 'p12'];
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
    let nombreArch = sampleFile.name;

    console.log(nombreArch);

    sampleFile.mv(`uploads/${tipo}/${nombreArch}`, (err) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }

        //Aqui ya se carga la imagen
        if (tipo === 'certificados')
            cargaCertificado(id, res, nombreArch);
        // else
        //     imagenProducto(id, res, nombreArch);
    })
});

function cargaCertificado(id, res, nombreArch) {
    Empresa.findById(id, (err, empresaDB) => {
        if (err) {
            borraArchivo(nombreArch, 'certificados');
            return res.status(500).json({
                ok: false,
                err
            })
        }

        if (!empresaDB) {
            borraArchivo(nombreArch, 'certificados');
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'Usuario no existe'
                }
            })
        }

        borraArchivo(empresaDB.pathCertificado, 'certificados');

        empresaDB.pathCertificado = nombreArch;
        empresaDB.save((err, empresaGuardada) => {
            res.json({
                ok: true,
                message: 'Empresa guardada',
                img: nombreArch
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