# Pro Vet

Aplicación de gestión comercial veterinaria, dividida en frontend React/Vite y API Express/Turso.

## Modelo implementado

- `users`: administradores con contraseña hasheada, rol y estado activo.
- `products`: catálogo y existencias; proveedor y laboratorio se conservan como atributos porque no existe una pantalla para administrarlos.
- `cash_registers`: apertura/cierre diario, responsables, fondo y arqueo.
- `sales` y `sale_items`: tickets y líneas con una instantánea del nombre/precio de venta.

Las ventas y el descuento de stock se realizan dentro de una transacción. Sólo existe una caja por día, una decisión conservadora basada en la interfaz “Caja del día”.

## Puesta en marcha

1. Copiá `backend/.env.example` a `backend/.env` y configurá Turso (para desarrollo local se puede mantener `file:local.db`).
2. Copiá `frontend/.env.example` a `frontend/.env`.
3. En `backend`, instalá dependencias, ejecutá `pnpm db:generate`, `pnpm db:migrate`, `pnpm seed` y `pnpm dev`.
4. En `frontend`, instalá dependencias y ejecutá `pnpm dev`.

Las credenciales de desarrollo generadas por el seed son `admin` / `admin123`; cambialas antes de desplegar.
