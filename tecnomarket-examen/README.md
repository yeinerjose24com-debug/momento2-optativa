# TecnoMarket

Portal web para consultar y administrar un catálogo tecnológico consumiendo la API de DummyJSON.

## Ejecución
Abrir la carpeta en Visual Studio Code y lanzar `index.html` con Live Server.

## Arquitectura
```
tecnomarket-examen/
├── index.html      Estructura (contenedores vacíos, sin productos escritos)
├── css/styles.css  Estilos
└── js/
    ├── api.js      Comunicación con la API (fetch)
    └── app.js      Estado, eventos, filtros y DOM
```
- **api.js**: `request()` (fetch + validación de `response.ok` + `response.json()`), `getProducts()`, `addProduct()`, `deleteProduct()`.
- **app.js**: `state.products` (fuente de verdad), `normalize()`, `getVisible()` (búsqueda + categoría + precio), `render()`, `loadProducts()`, `onSubmit()`, `onDelete()`.

## Flujo de datos
`API → fetch() → JSON → normalize() → state.products → getVisible() → render() → DOM`

- **GET**: al iniciar se muestra "Cargando…", se consulta `/products?limit=12`, se normalizan los campos (id, title, category, price, stock, brand, thumbnail) y se renderiza.
- **POST**: el formulario usa `preventDefault()`, valida, envía JSON con `JSON.stringify` a `/products/add`; la respuesta se agrega al estado y se vuelve a renderizar.
- **DELETE**: confirma, envía `DELETE /products/{id}`; si responde bien, se quita del estado y se renderiza.
- **Filtros**: se aplican sobre el arreglo local; no se vuelve a consultar la API.

## async/await
Cada función de `api.js` es `async` y usa `await fetch()` y `await response.json()`. En `app.js` se usa `try/catch/finally` para mostrar errores comprensibles al usuario y reactivar los botones.

## Notas
- DummyJSON simula POST y DELETE: no persiste cambios. El POST devuelve siempre el mismo id, por eso los productos nuevos reciben un id local; al eliminarlos no se llama a la API porque no existen allí (daría 404).
- Reto adicional: botón "Recargar catálogo".
- Simular error: en DevTools → Network → "Offline" y pulsar "Recargar catálogo".

## Pruebas (adjuntar capturas)
1 Carga · 2 Búsqueda · 3 Categoría · 4 Búsqueda + precio · 5 POST · 6 DELETE · 7 Error · 8 Contador
