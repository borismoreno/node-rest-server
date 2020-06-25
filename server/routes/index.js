const express = require('express');
const app = express();


app.use(require('./login'));
app.use(require('./usuario'));
app.use(require('./categoria'));
app.use(require('./producto'));
app.use(require('./upload'));
app.use(require('./imagenes'));
app.use(require('./generador'));
app.use(require('./empresa'));
app.use(require('./configuracion'));
app.use(require('./cliente'));
app.use(require('./comprobantes'));

module.exports = app;