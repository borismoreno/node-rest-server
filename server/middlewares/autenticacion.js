const jwt = require('jsonwebtoken');

let verificaToken = (req, res, next) => {
    let token = req.get('Authorization');
    jwt.verify(token, process.env.SEED, (err, decoded) => {
        if (err) {
            res.status(401).json({
                ok: false,
                err: {
                    message: 'Token no valido'
                }
            });
        }
        req.usuario = decoded.usuario;
        next();
    });
};

let verificaAdminRol = (req, res, next) => {
    let usuario = req.usuario;
    if (usuario.rol === 'ADMIN_ROLE') {
        next();
    } else {
        res.status(401).json({
            ok: false,
            err: {
                message: 'Usuario no es administrador'
            }
        });
    }
}

let verificaTokenImg = (req, res, next) => {
    let token = req.query.token;
    jwt.verify(token, process.env.SEED, (err, decoded) => {
        if (err) {
            res.status(401).json({
                ok: false,
                err: {
                    message: 'Token no valido'
                }
            });
        }
        req.usuario = decoded.usuario;
        next();
    });
}

module.exports = {
    verificaToken,
    verificaAdminRol,
    verificaTokenImg
}