const { crearApp } = require('./app');
const puerto = process.env.PORT || 3000;
crearApp().listen(puerto, () => console.log(`API escuchando en http://localhost:${puerto}`));
