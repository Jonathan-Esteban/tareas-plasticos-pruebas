const { validarTarea, filtrar, puedeEditar, cambiarEstado } = require('../src/tareas');

describe('CP-01 Validación del título (valores límite)', () => {
  test.each([
    ['ab', false], ['abc', true], ['a'.repeat(100), true], ['a'.repeat(101), false], ['   ', false],
  ])('título "%s..." válido=%s', (titulo, valido) => {
    const errores = validarTarea({ titulo, responsable: 'op1' });
    expect(errores.length === 0).toBe(valido);
  });
  test('rechaza prioridad inexistente', () => {
    expect(validarTarea({ titulo: 'Moler', responsable: 'op1', prioridad: 'urgentísima' })).toContain('Prioridad no válida');
  });
  test('exige responsable', () => {
    expect(validarTarea({ titulo: 'Moler' })).toContain('La tarea debe tener un responsable');
  });
});

describe('CP-02 Permisos por rol (tabla de decisión)', () => {
  const tarea = { responsable: 'op1' };
  test.each([
    [{ id: 'op1', rol: 'operario' }, true],
    [{ id: 'op2', rol: 'operario' }, false],
    [{ id: 'sup1', rol: 'supervisor' }, true],
    [undefined, false],
  ])('usuario %o puede editar=%s', (usuario, esperado) => {
    expect(puedeEditar(usuario, tarea)).toBe(esperado);
  });
});

describe('CP-03 Estados de la tarea (transición de estados)', () => {
  test('pendiente -> en_progreso', () => {
    expect(cambiarEstado({ estado: 'pendiente' }, 'en_progreso').estado).toBe('en_progreso');
  });
  test('no reabre una tarea completada', () => {
    expect(() => cambiarEstado({ estado: 'completada' }, 'pendiente')).toThrow('no se puede reabrir');
  });
  test('rechaza estado inventado', () => {
    expect(() => cambiarEstado({ estado: 'pendiente' }, 'archivada')).toThrow('Estado no válido');
  });
});

test('CP-04 filtro por estado y responsable', () => {
  const t = [{ estado: 'pendiente', responsable: 'op1' }, { estado: 'completada', responsable: 'op1' }, { estado: 'pendiente', responsable: 'op2' }];
  expect(filtrar(t, { estado: 'pendiente' })).toHaveLength(2);
  expect(filtrar(t, { estado: 'pendiente', responsable: 'op2' })).toHaveLength(1);
  expect(filtrar(t)).toHaveLength(3);
});
