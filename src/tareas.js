// Reglas de negocio (funciones puras, sin Express)
const ESTADOS = ['pendiente', 'en_progreso', 'completada'];

function validarTarea(datos) {
  const errores = [];
  const titulo = (datos.titulo || '').trim();
  if (titulo.length < 3 || titulo.length > 100) errores.push('El título debe tener entre 3 y 100 caracteres');
  if (!datos.responsable) errores.push('La tarea debe tener un responsable');
  if (datos.prioridad && !['baja', 'media', 'alta'].includes(datos.prioridad)) errores.push('Prioridad no válida');
  return errores;
}

function filtrar(tareas, { estado, responsable } = {}) {
  return tareas.filter(t =>
    (!estado || t.estado === estado) && (!responsable || t.responsable === responsable));
}

// Operario: solo sus tareas. Supervisor: todas.
function puedeEditar(usuario, tarea) {
  if (!usuario) return false;
  if (usuario.rol === 'supervisor') return true;
  return usuario.rol === 'operario' && tarea.responsable === usuario.id;
}

function cambiarEstado(tarea, nuevo) {
  if (!ESTADOS.includes(nuevo)) throw new Error('Estado no válido');
  if (tarea.estado === 'completada') throw new Error('Una tarea completada no se puede reabrir');
  return { ...tarea, estado: nuevo };
}

module.exports = { ESTADOS, validarTarea, filtrar, puedeEditar, cambiarEstado };
