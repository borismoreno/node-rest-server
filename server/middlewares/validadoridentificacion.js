let TipoIdentificacion = require('../models/tipoIdentificacion');
let verificaIdentificacion = async(req, res, next) => {
    let identificacion = req.body.numeroIdentificacion;
    let tipoIdentificacion = req.body.tipoIdentificacion;
    let tipoIdentificacionDB = await getTipoIdentificacion(tipoIdentificacion);
    if (tipoIdentificacionDB.codigo === '04') {
        let valido = await validaRuc(identificacion, res);
        console.log({ valido });
        if (valido) {
            next();
        }
    } else if (tipoIdentificacionDB.codigo === '05') {
        let valido = await validaCedula(identificacion, res);
        console.log({ valido });
        if (valido) {
            next();
        }
    } else {
        res.status(401).json({
            ok: false,
            err: {
                message: 'Tipo de identificacion no valido.'
            }
        });
    }
}

let validaCedula = async(identificacion, res) => {
    let valido = false;
    if (identificacion.length !== 10) {
        valido = false;
        res.status(401).json({
            ok: false,
            err: {
                message: 'La cedula debe tener 10 digitos.'
            }
        });
    } else {
        let digito_region = Number(identificacion.substring(0, 2));
        if (digito_region >= 1 && digito_region <= 24) {
            let ultimo_digito = Number(identificacion.substring(9, 10));
            let pares = Number(identificacion.substring(1, 2)) + Number(identificacion.substring(3, 4)) + Number(identificacion.substring(5, 6)) + Number(identificacion.substring(7, 8));
            let numero1 = Number(identificacion.substring(0, 1));
            numero1 = (numero1 * 2);
            if (numero1 > 9) {
                numero1 = (numero1 - 9);
            }
            let numero3 = Number(identificacion.substring(2, 3));
            numero3 = (numero3 * 2);
            if (numero3 > 9) {
                numero3 = (numero3 - 9);
            }
            let numero5 = Number(identificacion.substring(4, 5));
            numero5 = (numero5 * 2);
            if (numero5 > 9) {
                numero5 = (numero5 - 9);
            }
            let numero7 = Number(identificacion.substring(6, 7));
            numero7 = (numero7 * 2);
            if (numero7 > 9) {
                numero7 = (numero7 - 9);
            }
            let numero9 = Number(identificacion.substring(8, 9));
            numero9 = (numero9 * 2);
            if (numero9 > 9) {
                numero9 = (numero9 - 9);
            }
            let impares = numero1 + numero3 + numero5 + numero7 + numero9;
            let suma_total = (pares + impares);
            let primer_digito_suma = String(suma_total).substring(0, 1);
            let decena = (Number(primer_digito_suma) + 1) * 10;
            let digito_validador = decena - suma_total;
            if (digito_validador === 10) {
                digito_validador = 0;
            }
            if (digito_validador === ultimo_digito) {
                valido = true;
            } else {
                valido = false;
                res.status(401).json({
                    ok: false,
                    err: {
                        message: `La cedula ${identificacion} no es correcta.`
                    }
                });
            }
        } else {
            valido = false;
            res.status(401).json({
                ok: false,
                err: {
                    message: 'La cedula no pertenece a ninguna region.'
                }
            });
        }
    }
    return valido;
}

let validaRuc = async(ruc, res) => {
    let valido = false;
    if (ruc.length !== 13) {
        valido = false;
        res.status(401).json({
            ok: false,
            err: {
                message: 'El RUC debe tener 13 digitos.'
            }
        });
    } else {
        let digito_region = Number(ruc.substring(0, 2));
        if (digito_region >= 1 && digito_region <= 24) {
            let codigo_final = ruc.substring(10, 13);
            console.log({ codigo_final });
            if (codigo_final !== '001') {
                valido = false;
                res.status(401).json({
                    ok: false,
                    err: {
                        message: 'El RUC debe terminar con 001.'
                    }
                });
            } else {
                valido = true;
            }
        } else {
            valido = false;
            res.status(401).json({
                ok: false,
                err: {
                    message: 'El RUC no pertenece a ninguna region.'
                }
            });
        }
    }
    return valido;
}

let getTipoIdentificacion = async(tipoIdentificacion) => {
    let tipo;
    await TipoIdentificacion.findById(tipoIdentificacion, (err, tipoIdentificacionDB) => {
        tipo = tipoIdentificacionDB;
    });
    return tipo;
}

module.exports = {
    verificaIdentificacion
};