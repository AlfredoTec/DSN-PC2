/**
 * Punto de arranque del servidor HTTP.
 * Carga la instancia de Express desde `app.js` y comienza a escuchar peticiones.
 */
const app = require('./app');

// Puerto de escucha configurable por entorno
const PORT = process.env.PORT || 5050;

// Inicia el servidor
app.listen(PORT, () => {
  console.log(`TechStore API escuchando en puerto ${PORT}`);
});
