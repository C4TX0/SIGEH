# SIGEH - Guia operativa

## Levantar desde cero

1. Instalar dependencias.
2. Configurar `.env`.
3. Crear la base con `database.sql`.
4. Levantar backend con `npm run dev`.
5. Abrir `frontend/index.html`.

## Operacion diaria

- Login normal en el frontend.
- Navegar por modulos segun rol.
- Verificar auditoria y reportes.
- Generar respaldos cuando sea necesario.
- Revisar monitoreo antes de una defensa o entrega.

## Comandos utiles

```powershell
npm run dev
npm run backup:db
npm run restore:db
npm run replica:setup
npm run replica:refresh
npm run replica:check
npm run monitor:db
```

## Mantenimiento

- Revisar `backups/` y limpiar respaldos muy antiguos si ya fueron documentados.
- Verificar que `sigeh_app` siga con acceso funcional.
- Controlar que el JWT siga expirando segun `JWT_EXPIRES_IN`.
- Revisar logs de backend cuando un endpoint devuelva 500.
