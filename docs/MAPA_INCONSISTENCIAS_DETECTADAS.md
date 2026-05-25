# SIGEH - Mapa de inconsistencias detectadas

## 1. Desalineacion entre rutas del frontend y del backend

- Inconsistencia: el navegador entraba a rutas como `/usuarios` esperando contenido directo.
- Efecto: `Ruta no encontrada`.
- Resolucion: el backend quedo expuesto bajo `/api/...` y el frontend consume esa API.

## 2. Logica de negocio duplicada entre Node.js y PostgreSQL

- Inconsistencia: reglas criticas repetidas en controladores y en SQL.
- Efecto: riesgo de divergencia funcional.
- Resolucion: la logica sensible se movio a procedimientos y vistas de PostgreSQL.

## 3. Objetos SQL creados sin uso real

- Inconsistencia: habia vistas, triggers y objetos de apoyo sin consumo efectivo.
- Efecto: complejidad aparente sin valor operativo.
- Resolucion: los reportes, auditoria, facturacion y operaciones clinicas quedaron enlazados a esos objetos.

## 4. Respaldos declarativos sin respaldo real

- Inconsistencia: el sistema registraba respaldos, pero no siempre generaba archivos verificables.
- Efecto: falso positivo de proteccion.
- Resolucion: `pg_dump`, `psql` y `pg_restore` quedaron integrados con evidencia de archivo real.

## 5. Continuidad y monitoreo no conectados al runtime

- Inconsistencia: la parte de replica/monitoreo existia como idea, no como servicio operativo.
- Efecto: visibilidad limitada del estado de la infraestructura.
- Resolucion: se expusieron endpoints de monitoreo y scripts de continuidad basados en snapshot/refresh.

## 6. Seguridad operativa incompleta

- Inconsistencia: faltaban medidas de contencion frente a intentos repetidos, cabeceras y limitacion basica.
- Efecto: superficie de ataque mas amplia.
- Resolucion: se agregaron `helmet`, rate limiting, bloqueo temporal y sesion en `sessionStorage`.

## 7. Dependencia fisica de tablespaces PostgreSQL

- Inconsistencia: las rutas de tablespaces estaban fijadas como `C:/...` en el DDL.
- Efecto: baja portabilidad del bootstrap.
- Resolucion: las rutas ahora se inyectan como variables de `psql` y se crean con `scripts/setup-db.ps1`.
- Residual aceptado: PostgreSQL sigue requiriendo una ruta fisica real; eso se parametriza por despliegue, no por codigo.

## 8. Respaldo documental no reproducible

- Inconsistencia: habia descripciones parciales sin un recorrido de instalacion, operacion y cierre.
- Efecto: dificil defensa tecnica del proyecto.
- Resolucion: README y docs por bloque cubren arquitectura, operacion, DBA, troubleshooting, despliegue y evidencias.
