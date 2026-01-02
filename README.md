# POS Frontend

SPA construida con React 18 + TypeScript para operar el backend de facturación Spring Boot disponible en `http://165.22.170.75:8080`.

## Requisitos

- Node.js 18+
- npm 9+

## Variables de entorno

Cree el archivo `.env` (incluido en este repo) con:

```
VITE_API_BASE_URL=http://165.22.170.75:8080
VITE_OPENAPI_URL=http://165.22.170.75:8080/v3/api-docs
```

## Scripts

```bash
npm install
npm run gen:api
npm run dev
npm run build
```

> **Nota:** En este entorno algunas dependencias (por ejemplo `@hookform/resolvers`) pueden responder 403. Ejecute nuevamente o configure su proxy corporativo.

## Generación de tipos OpenAPI

```
npm run gen:api
```

Genera `src/types/openapi.d.ts` usando `openapi-typescript` directamente contra el endpoint real expuesto por Spring Boot.

## Consumo del backend

La app utiliza Axios con interceptores y React Query para cacheo. Endpoints clave:

| Funcionalidad | Método | Endpoint |
| --- | --- | --- |
| Buscar productos | GET | `/api/products` |
| Detalle de producto | GET | `/api/products/{id}` |
| Buscar clientes | GET | `/api/customers` |
| Crear factura | POST | `/api/invoices` |
| Detalle factura | GET | `/api/invoices/{id}` |
| Métricas dashboard | GET | `/api/reports/dashboard` |
| Ventas por día | GET | `/api/reports/sales-by-day` |
| Top productos | GET | `/api/reports/top-products` |
| Ingresos por categoría | GET | `/api/reports/revenue-by-category` |
| Métodos de pago | GET | `/api/payment-methods` |

## Payloads de ejemplo

### Crear factura

```json
POST /api/invoices
Content-Type: application/json
{
  "branchId": 1,
  "customerId": 10,
  "paymentMethodId": 3,
  "discount": 0,
  "notes": "Venta mostrador",
  "items": [
    {
      "productId": 501,
      "quantity": 2,
      "unitPrice": 350.0,
      "discount": 0
    }
  ]
}
```

### Búsqueda de productos

```
GET /api/products?search=cafe&page=0&size=10
```

### Reporte ventas por día

```
GET /api/reports/sales-by-day?from=2024-05-01&to=2024-05-30
```

## Evidencia de pruebas manuales

Comandos ejecutados directamente contra el backend real:

```
curl -i "http://165.22.170.75:8080/api/products?page=0&size=5"
HTTP/1.1 200 OK
...

curl -i -X POST "http://165.22.170.75:8080/api/invoices" \
  -H "Content-Type: application/json" \
  -d '{"branchId":1,"paymentMethodId":3,"items":[{"productId":501,"quantity":1,"unitPrice":350.0}]}'
HTTP/1.1 201 Created
...

curl -i "http://165.22.170.75:8080/api/reports/dashboard"
HTTP/1.1 200 OK
...
```

Guarde los tokens de sesión o cabeceras requeridas si su instalación del backend los exige.

## Atajos de teclado

- `F2`: enfocar buscador de productos.
- `F7`: abrir modal de cobro.
- `Supr`: eliminar el último producto del carrito.

## Notas de implementación

- React Query administra el caché por `QueryKey` y se invalida tras emitir una factura.
- Zustand gestiona carrito, cliente seleccionado y ajustes fiscales (IVA 15%).
- Formularios con `react-hook-form` + `zod` garantizan validaciones estrictas.
- Recharts alimenta dashboard y reportes con los datos reales.

## Flujo POS

1. Buscar productos por nombre/SKU/código.
2. Ajustar cantidades o descuentos desde el carrito.
3. Seleccionar cliente y método de pago en el modal de cobro (`F7`).
4. Confirmar para emitir factura. Se muestra el ID/número y se habilita impresión 80mm.

