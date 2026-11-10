// Prueba de carga: 20 usuarios virtuales simulan un cambio de turno
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 20 }, // llegan los operarios
    { duration: '20s', target: 20 }, // consultan y actualizan tareas
    { duration: '5s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<300'], // 95 % de respuestas en menos de 300 ms
    http_req_failed: ['rate<0.01'],   // menos de 1 % de errores
    checks: ['rate>0.99'],
  },
};

const BASE = 'http://localhost:3000';

export default function () {
  const sup = { headers: { 'Content-Type': 'application/json', 'x-usuario': 'sup1' } };
  const op = { headers: { 'Content-Type': 'application/json', 'x-usuario': 'op1' } };

  const nueva = http.post(`${BASE}/tareas`, JSON.stringify({ titulo: `Turno ${__VU}-${__ITER}`, responsable: 'op1' }), sup);
  check(nueva, { 'tarea creada (201)': (r) => r.status === 201 });

  const lista = http.get(`${BASE}/tareas?estado=pendiente`, op);
  check(lista, { 'listado OK (200)': (r) => r.status === 200 });

  if (nueva.status === 201) {
    const id = nueva.json('id');
    const avance = http.patch(`${BASE}/tareas/${id}/estado`, JSON.stringify({ estado: 'en_progreso' }), op);
    check(avance, { 'estado actualizado (200)': (r) => r.status === 200 });
  }
  sleep(1);
}
