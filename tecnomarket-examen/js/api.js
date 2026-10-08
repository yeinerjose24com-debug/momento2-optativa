// api.js: SOLO comunicación con la API (sin DOM).
const API_URL = "https://dummyjson.com/products";

// Función base: ejecuta fetch, valida response.ok y devuelve el JSON.
async function request(url, options = {}) {
  let response;
  try {
    response = await fetch(url, options);
  } catch (e) {
    throw new Error("No hay conexión con el servidor. Verifique su internet e intente de nuevo.");
  }
  if (!response.ok) {
    throw new Error(`El servidor respondió con error ${response.status} (${response.statusText || "sin detalle"}).`);
  }
  return await response.json();
}

async function getProducts(limit = 12) {
  const data = await request(`${API_URL}?limit=${limit}`);
  return data.products; // la API envuelve la lista en { products, total, ... }
}

async function addProduct(product) {
  return await request(`${API_URL}/add`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(product)
  });
}

async function deleteProduct(id) {
  return await request(`${API_URL}/${id}`, { method: "DELETE" });
}
