const request = require('supertest');
const { crearApp } = require('../src/app');

let app;
beforeEach(() => { app = crearApp(); });
const como = (u) => ({ 'x-usuario': u });

async function crearTarea(responsable = 'op1') {
  return request(app).post('/tareas').set(como('sup1')).send({ titulo: 'Revisar extrusora 2', responsable, prioridad: 'alta' });
}

test('CP-05 sin sesión responde 401', async () => {
  await request(app).get('/tareas').expect(401);
});

test('CP-05 el supervisor asigna una tarea (201)', async () => {
  const r = await crearTarea();
  expect(r.status).toBe(201);
  expect(r.body).toMatchObject({ responsable: 'op1', estado: 'pendiente' });
});

test('CP-05 un operario no puede asignar tareas (403)', async () => {
  await request(app).post('/tareas').set(como('op1')).send({ titulo: 'X tarea', responsable: 'op1' }).expect(403);
});

test('CP-05 datos inválidos devuelven 400 con errores', async () => {
  const r = await request(app).post('/tareas').set(como('sup1')).send({ titulo: 'a', responsable: 'nadie' });
  expect(r.status).toBe(400);
  expect(r.body.errores).toEqual(expect.arrayContaining(['Responsable inexistente']));
});

test('CP-06 cada operario solo ve sus tareas', async () => {
  await crearTarea('op1'); await crearTarea('op2');
  const r = await request(app).get('/tareas').set(como('op1'));
  expect(r.body).toHaveLength(1);
  const s = await request(app).get('/tareas').set(como('sup1'));
  expect(s.body).toHaveLength(2);
});

test('CP-06 un operario no cambia el estado de una tarea ajena (403)', async () => {
  const { body } = await crearTarea('op1');
  await request(app).patch(`/tareas/${body.id}/estado`).set(como('op2')).send({ estado: 'completada' }).expect(403);
});

test('CP-07 flujo completo: asignar, avanzar, completar y no reabrir', async () => {
  const { body } = await crearTarea('op1');
  await request(app).patch(`/tareas/${body.id}/estado`).set(como('op1')).send({ estado: 'en_progreso' }).expect(200);
  await request(app).patch(`/tareas/${body.id}/estado`).set(como('op1')).send({ estado: 'completada' }).expect(200);
  await request(app).patch(`/tareas/${body.id}/estado`).set(como('op1')).send({ estado: 'pendiente' }).expect(409);
  const r = await request(app).get('/tareas?estado=completada').set(como('op1'));
  expect(r.body).toHaveLength(1);
});

test('CP-08 la búsqueda devuelve JSON y no refleja HTML', async () => {
  await crearTarea();
  const r = await request(app).get('/buscar?q=<script>alert(1)</script>').set(como('op1'));
  expect(r.headers['content-type']).toMatch(/application\/json/);
  expect(r.body.resultados).toHaveLength(0);
});

test('eliminar: 404 si no existe, 204 si existe, 403 operario', async () => {
  const { body } = await crearTarea();
  await request(app).delete(`/tareas/${body.id}`).set(como('op1')).expect(403);
  await request(app).delete(`/tareas/${body.id}`).set(como('sup1')).expect(204);
  await request(app).delete(`/tareas/${body.id}`).set(como('sup1')).expect(404);
  await request(app).patch('/tareas/999/estado').set(como('sup1')).send({ estado: 'en_progreso' }).expect(404);
  await request(app).get('/salud').expect(200);
});
