# Tareas Plásticos Sustentables · API + plan de pruebas

Proyecto académico (UNIMINUTO · Pruebas de Software y Aseguramiento de la Calidad · Semana 3).

| Nivel | Herramienta | Dónde |
|---|---|---|
| Unitarias | Jest | `tests/tareas.unit.test.js` |
| Integración (API) | Supertest | `tests/api.integracion.test.js` |
| Rendimiento | k6 | `perf/carga.js` |
| Seguridad | CodeQL + Dependabot | `.github/workflows/codeql.yml` |
| Manuales | Issues (formularios) | `.github/ISSUE_TEMPLATE/` |

```bash
npm install
npm test     # Jest + cobertura
npm start    # API en http://localhost:3000
```
