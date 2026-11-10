const express = require('express');
const { validarTarea, filtrar, puedeEditar, cambiarEstado } = require('./tareas');

const USUARIOS = {
  op1: { id: 'op1', nombre: 'Laura (operaria)', rol: 'operario' },
  op2: { id: 'op2', nombre: 'Andrés (operario)', rol: 'operario' },
  sup1: { id: 'sup1', nombre: 'Marta (supervisora)', rol: 'supervisor' },
};

function crearApp() {
  const app = express();
  app.use(express.json());
  let tareas = [];
  let siguienteId = 1;

  // Autenticación simplificada: cabecera x-usuario
  app.use((req, res, next) => { req.usuario = USUARIOS[req.get('x-usuario')]; next(); });
  const requiereSesion = (req, res, next) => req.usuario ? next() : res.status(401).json({ error: 'Debe iniciar sesión' });

  app.get('/salud', (req, res) => res.json({ ok: true }));

  // Búsqueda: responde en JSON (nunca HTML con el texto del usuario)
  app.get('/buscar', requiereSesion, (req, res) => {
    const q = String(req.query.q || '').toLowerCase();
    res.json({ consulta: q, resultados: tareas.filter(t => t.titulo.toLowerCase().includes(q)) });
  });

  app.get('/tareas', requiereSesion, (req, res) => {
    const visibles = req.usuario.rol === 'supervisor' ? tareas : tareas.filter(t => t.responsable === req.usuario.id);
    res.json(filtrar(visibles, { estado: req.query.estado }));
  });

  app.post('/tareas', requiereSesion, (req, res) => {
    if (req.usuario.rol !== 'supervisor') return res.status(403).json({ error: 'Solo el supervisor asigna tareas' });
    const errores = validarTarea(req.body);
    if (!USUARIOS[req.body.responsable]) errores.push('Responsable inexistente');
    if (errores.length) return res.status(400).json({ errores });
    const tarea = { id: siguienteId++, titulo: req.body.titulo.trim(), responsable: req.body.responsable,
      prioridad: req.body.prioridad || 'media', estado: 'pendiente' };
    tareas.push(tarea);
    res.status(201).json(tarea);
  });

  app.patch('/tareas/:id/estado', requiereSesion, (req, res) => {
    const i = tareas.findIndex(t => t.id === Number(req.params.id));
    if (i === -1) return res.status(404).json({ error: 'No existe' });
    if (!puedeEditar(req.usuario, tareas[i])) return res.status(403).json({ error: 'Sin permiso' });
    try { tareas[i] = cambiarEstado(tareas[i], req.body.estado); res.json(tareas[i]); }
    catch (e) { res.status(409).json({ error: e.message }); }
  });

  app.delete('/tareas/:id', requiereSesion, (req, res) => {
    if (req.usuario.rol !== 'supervisor') return res.status(403).json({ error: 'Sin permiso' });
    const antes = tareas.length;
    tareas = tareas.filter(t => t.id !== Number(req.params.id));
    res.status(antes === tareas.length ? 404 : 204).end();
  });

  return app;
}

module.exports = { crearApp, USUARIOS };
