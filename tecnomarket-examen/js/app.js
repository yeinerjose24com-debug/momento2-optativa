// app.js: estado, eventos, procesamiento y DOM.
const state = { products: [], nextLocalId: 1000 };
const $ = (id) => document.getElementById(id);

// ---- Modelo de datos: solo los campos que necesita la interfaz ----
function normalize(p) {
  return {
    id: p.id,
    title: p.title ?? "Sin título",
    category: p.category ?? "sin-categoria",
    price: Number(p.price) || 0,
    stock: Number(p.stock) || 0,
    brand: p.brand || "—",
    thumbnail: p.thumbnail || "",
    local: false // true = creado en esta sesión (no existe en la API)
  };
}

// ---- Mensajes de estado ----
function showStatus(type, text) {
  const el = $("status");
  el.className = "status " + type;
  el.textContent = text;
  el.hidden = false;
}

// ---- Filtros combinados (búsqueda + categoría + precio) ----
function getVisible() {
  const q = $("search").value.trim().toLowerCase();
  const cat = $("category").value;
  const range = $("price").value;
  return state.products.filter((p) => {
    const byName = p.title.toLowerCase().includes(q);
    const byCat = !cat || p.category === cat;
    const byPrice =
      range === "all" ||
      (range === "low" && p.price <= 500) ||
      (range === "mid" && p.price > 500 && p.price <= 1500) ||
      (range === "high" && p.price > 1500);
    return byName && byCat && byPrice;
  });
}

function render() {
  const visible = getVisible();
  const body = $("productBody");
  body.replaceChildren();

  if (visible.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 7;
    td.className = "empty";
    td.textContent = "No hay productos que cumplan los criterios.";
    tr.append(td);
    body.append(tr);
  }

  visible.forEach((p) => {
    const tr = document.createElement("tr");
    const cells = [];

    const tdImg = document.createElement("td");
    if (p.thumbnail) {
      const img = document.createElement("img");
      img.src = p.thumbnail; img.alt = p.title; img.loading = "lazy";
      tdImg.append(img);
    }
    cells.push(tdImg);

    const tdTitle = document.createElement("td");
    tdTitle.textContent = p.title;
    cells.push(tdTitle);

    const tdCat = document.createElement("td");
    const tag = document.createElement("span");
    tag.className = "tag"; tag.textContent = p.category;
    tdCat.append(tag);
    cells.push(tdCat);

    const tdBrand = document.createElement("td");
    tdBrand.textContent = p.brand;
    cells.push(tdBrand);

    const tdPrice = document.createElement("td");
    tdPrice.className = "num"; tdPrice.textContent = "$" + p.price.toFixed(2);
    cells.push(tdPrice);

    const tdStock = document.createElement("td");
    tdStock.className = "num" + (p.stock < 10 ? " low" : "");
    tdStock.textContent = p.stock;
    cells.push(tdStock);

    const tdAct = document.createElement("td");
    const btn = document.createElement("button");
    btn.type = "button"; btn.className = "btn danger"; btn.textContent = "Eliminar";
    btn.dataset.id = p.id;
    tdAct.append(btn);
    cells.push(tdAct);

    tr.append(...cells);
    body.append(tr);
  });

  $("counter").textContent = `Mostrando ${visible.length} producto${visible.length === 1 ? "" : "s"}`;
  renderKpis(visible);
}

function renderKpis(visible) {
  const all = state.products;
  const avg = all.length ? all.reduce((s, p) => s + p.price, 0) / all.length : 0;
  $("kpiTotal").textContent = all.length;
  $("kpiShown").textContent = visible.length;
  $("kpiAvg").textContent = "$" + avg.toFixed(2);
  $("kpiLow").textContent = all.filter((p) => p.stock < 10).length;
}

function refreshCategories() {
  const cats = [...new Set(state.products.map((p) => p.category))].sort();
  const select = $("category");
  const current = select.value;
  select.replaceChildren(new Option("Todas", ""));
  cats.forEach((c) => select.append(new Option(c, c)));
  select.value = cats.includes(current) ? current : "";
  $("catList").replaceChildren(...cats.map((c) => new Option(c)));
}

// ---- Carga inicial (GET) ----
async function loadProducts() {
  showStatus("loading", "Cargando productos desde la API…");
  $("btnReload").disabled = true;
  try {
    const raw = await getProducts(12);
    state.products = raw.map(normalize);
    refreshCategories();
    render();
    showStatus("ok", `Catálogo cargado: ${state.products.length} productos.`);
  } catch (err) {
    state.products = [];
    refreshCategories();
    render();
    showStatus("error", "No se pudo cargar el catálogo. " + err.message);
  } finally {
    $("btnReload").disabled = false;
  }
}

// ---- Crear (POST) ----
async function onSubmit(e) {
  e.preventDefault();
  const title = $("fTitle").value.trim();
  const category = $("fCategory").value.trim().toLowerCase();
  const price = parseFloat($("fPrice").value);
  const stock = parseInt($("fStock").value, 10);
  const brand = $("fBrand").value.trim();

  if (!title || !category || isNaN(price) || price < 0 || isNaN(stock) || stock < 0) {
    showStatus("error", "Complete título, categoría, precio y stock con valores válidos (no negativos).");
    return;
  }
  const btn = e.submitter || e.target.querySelector("button");
  btn.disabled = true;
  showStatus("loading", "Guardando producto…");
  try {
    const created = await addProduct({ title, category, price, stock, brand });
    const product = normalize({ ...created, title, category, price, stock, brand });
    // La API devuelve siempre el mismo id simulado; usamos uno local único.
    product.id = state.nextLocalId++;
    product.local = true;
    state.products.unshift(product);
    refreshCategories();
    render();
    e.target.reset();
    showStatus("ok", `Producto "${product.title}" registrado correctamente.`);
  } catch (err) {
    showStatus("error", "No se pudo registrar el producto. " + err.message);
  } finally {
    btn.disabled = false;
  }
}

// ---- Eliminar (DELETE) ----
async function onDelete(id) {
  const product = state.products.find((p) => p.id === id);
  if (!product || !confirm(`¿Eliminar "${product.title}" del catálogo?`)) return;
  showStatus("loading", "Eliminando producto…");
  try {
    // Los productos creados localmente no existen en DummyJSON (daría 404).
    if (!product.local) await deleteProduct(id);
    state.products = state.products.filter((p) => p.id !== id);
    refreshCategories();
    render();
    showStatus("ok", `Producto "${product.title}" eliminado.`);
  } catch (err) {
    showStatus("error", "No se pudo eliminar el producto. " + err.message);
  }
}

// ---- Eventos ----
$("search").addEventListener("input", render);
$("category").addEventListener("change", render);
$("price").addEventListener("change", render);
$("productForm").addEventListener("submit", onSubmit);
$("btnReload").addEventListener("click", loadProducts);
$("productBody").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-id]");
  if (btn) onDelete(Number(btn.dataset.id));
});

loadProducts();
