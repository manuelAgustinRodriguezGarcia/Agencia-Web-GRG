(() => {
  "use strict";

  const STORAGE_KEY = "grg.demo.cannatrol.v1";
  const EXTENSIONS = ["webp", "png", "jpg", "jpeg", "avif"];
  const BLOCKING = new Set(["confirmado", "en_curso"]);
  const STATUS_LABEL = {
    pendiente: "Pendiente",
    confirmado: "Confirmado",
    en_curso: "En curso",
    finalizado: "Finalizado",
    cancelado: "Cancelado",
  };

  const PRODUCTS = [
    {
      id: "cle",
      name: "Cool Cure C Edición Limitada (CLE)",
      imageBase: "CC LTD",
      short:
        "Edición limitada del sistema Cool Cure para secar y curar la cosecha en un entorno controlado.",
      summary:
        "El Cool Cure C Edición Limitada reúne la tecnología de secado y curado de Cannatrol en una serie acotada. Se solicita por el período de la cosecha, sin comprar el equipo. La tarifa se define cuando se confirma la disponibilidad.",
      features: [
        "Secado y curado en un mismo equipo",
        "Serie limitada de la línea Cool Cure",
        "Uso por el período que necesites",
        "Tarifa de alquiler a consultar",
      ],
    },
    {
      id: "cc",
      name: "Cool Cure C",
      imageBase: "CC",
      short:
        "El modelo de referencia de Cannatrol para secar y curar sin adquirir el equipo.",
      summary:
        "Cool Cure C es el equipo de referencia de la línea para secar y curar en un entorno controlado. Lo pedís para las fechas de tu cosecha y Cannatrol confirma después si hay unidades disponibles.",
      features: [
        "Secado y curado en un mismo equipo",
        "Modelo de referencia de la línea",
        "Solicitud por fechas concretas",
        "Tarifa de alquiler a consultar",
      ],
    },
    {
      id: "cc-plus",
      name: "Cool Cure C+",
      imageBase: "CC+",
      short:
        "Variante Cool Cure C+ para el mismo proceso profesional de secado y curado.",
      summary:
        "Cool Cure C+ forma parte de la línea de equipos de secado y curado de Cannatrol. Se alquila por el período necesario, sin convertir el equipo en una compra. La disponibilidad se valida al confirmar la solicitud.",
      features: [
        "Secado y curado en un mismo equipo",
        "Variante de la línea Cool Cure",
        "Coordinación posterior de la entrega",
        "Tarifa de alquiler a consultar",
      ],
    },
    {
      id: "cc2",
      name: "Cool Cure C2",
      imageBase: "CC2",
      short:
        "Cool Cure C2 para cubrir la cosecha con tecnología profesional de secado y curado.",
      summary:
        "Cool Cure C2 acompaña a cultivadores que quieren la tecnología Cannatrol durante el secado y el curado. La solicitud queda pendiente hasta que el equipo confirma unidades y fechas.",
      features: [
        "Secado y curado en un mismo equipo",
        "Configuración Cool Cure C2",
        "Reserva sujeta a confirmación",
        "Tarifa de alquiler a consultar",
      ],
    },
  ];

  const PRODUCT_IDS = PRODUCTS.map((product) => product.id);
  const SEED_STOCK = { cle: 2, cc: 5, "cc-plus": 4, cc2: 3 };
  const VIEW_COPY = {
    resumen: {
      title: "Resumen",
      intro:
        "Solicitudes, alquileres activos y equipos libres en esta demostración.",
    },
    equipos: {
      title: "Equipos",
      intro:
        "Stock ficticio de la línea Cool Cure. Las unidades comprometidas salen de los alquileres confirmados o en curso.",
    },
    alquileres: {
      title: "Alquileres",
      intro:
        "Revisá cada solicitud y cambiá su estado. Confirmar o activar un alquiler exige stock libre en esas fechas.",
    },
  };

  let state = seedState();
  let lastFocus = null;
  let toastTimer = 0;
  let savingRequest = false;

  const app = document.querySelector("[data-demo-app]");
  if (!app) return;
  const page = app.getAttribute("data-demo-app");

  if (page === "public") initPublic();
  if (page === "admin") initAdmin();

  document.addEventListener("keydown", onKeydown);

  function initPublic() {
    state = loadState();
    renderCatalog();
    fillProductSelect();
    mountImages(document);
    const start = document.querySelector("#start");
    const end = document.querySelector("#end");
    const today = todayIso();
    start.min = today;
    end.min = today;
    start.addEventListener("change", () => {
      end.min = start.value || today;
      if (end.value && end.value < end.min) end.value = "";
    });
    document.querySelector("#rental-form").addEventListener("submit", onReview);
    document.querySelector("#catalog").addEventListener("click", onCatalogClick);
    setupDisclosure("#nav-toggle", "#site-nav");
    window.addEventListener("storage", onStorage);
  }

  function initAdmin() {
    state = loadState();
    setupDisclosure("#admin-toggle", "#admin-nav");
    document.querySelectorAll("[data-nav]").forEach((button) => {
      button.addEventListener("click", () => {
        showView(button.getAttribute("data-nav"));
        closeDisclosure("#admin-toggle", "#admin-nav");
      });
    });
    document.querySelector("#reset-demo").addEventListener("click", openReset);
    document.querySelector("#filter-status").addEventListener("change", renderRentalTable);
    document.querySelector("#filter-query").addEventListener("input", renderRentalTable);
    document.querySelector("#clear-filters").addEventListener("click", () => {
      document.querySelector("#filter-status").value = "todos";
      document.querySelector("#filter-query").value = "";
      renderRentalTable();
    });
    document.querySelector("#recent-table").addEventListener("click", onRentalAction);
    document.querySelector("#rental-table").addEventListener("click", onRentalAction);
    document.querySelector("#equipment-list").addEventListener("submit", onStockSubmit);
    const initial = location.hash.replace("#", "");
    showView(initial === "equipos" || initial === "alquileres" ? initial : "resumen");
    window.addEventListener("hashchange", () => {
      const name = location.hash.replace("#", "");
      showView(name === "equipos" || name === "alquileres" ? name : "resumen");
    });
    window.addEventListener("storage", onStorage);
  }

  function onStorage(event) {
    if (event.key !== STORAGE_KEY) return;
    state = loadState();
    if (page === "public") {
      renderCatalog();
      return;
    }
    renderAdmin();
  }

  function onKeydown(event) {
    if (event.key !== "Escape") return;
    if (document.querySelector(".modal")) {
      closeModal();
      return;
    }
    closeDisclosure("#nav-toggle", "#site-nav");
    closeDisclosure("#admin-toggle", "#admin-nav");
  }

  function setupDisclosure(toggleSelector, navSelector) {
    const toggle = document.querySelector(toggleSelector);
    const nav = document.querySelector(navSelector);
    if (!toggle || !nav) return;
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      nav.classList.toggle("is-open", !open);
    });
    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => closeDisclosure(toggleSelector, navSelector));
    });
  }

  function closeDisclosure(toggleSelector, navSelector) {
    const toggle = document.querySelector(toggleSelector);
    const nav = document.querySelector(navSelector);
    if (!toggle || !nav) return;
    toggle.setAttribute("aria-expanded", "false");
    nav.classList.remove("is-open");
  }

  function seedState() {
    const today = todayIso();
    return {
      stock: { ...SEED_STOCK },
      rentals: [
        rentalSeed("CT-2401", "cc", -45, -24, 1, "Lucía Fernández", "finalizado", -20, "Cosecha ya retirada."),
        rentalSeed("CT-2402", "cc-plus", -8, 14, 1, "Martín Acosta", "en_curso", -12, "Equipo en el cultivo durante el secado."),
        rentalSeed("CT-2403", "cc2", 6, 30, 1, "Sofía Herrera", "confirmado", -4, ""),
        rentalSeed("CT-2404", "cle", 21, 36, 1, "Diego Palacios", "pendiente", -1, "Consulta por la edición limitada."),
        rentalSeed("CT-2405", "cc", 3, 18, 2, "Camila Ruiz", "confirmado", -3, "Dos equipos para la misma semana."),
        rentalSeed("CT-2406", "cc-plus", -60, -40, 1, "Andrés Molina", "cancelado", -30, "Reprogramó la cosecha."),
        rentalSeed("CT-2407", "cc2", -3, 9, 1, "Valentina Soto", "en_curso", -2, ""),
        rentalSeed("CT-2408", "cc", 6, 16, 4, "Nicolás Pereyra", "pendiente", 0, "Pide cuatro equipos para la misma semana. Con el stock inicial no alcanza mientras el alquiler de Camila Ruiz sigue confirmado."),
      ].map((item) => ({
        ...item,
        start: addDays(today, item.startOffset),
        end: addDays(today, item.endOffset),
        createdAt: `${addDays(today, item.createdOffset)}T15:00:00.000Z`,
      })),
    };
  }

  function rentalSeed(id, productId, startOffset, endOffset, qty, name, status, createdOffset, notes) {
    return {
      id,
      productId,
      startOffset,
      endOffset,
      createdOffset,
      qty,
      name,
      email: `${slugMail(name)}@example.com`,
      phone: "11 5555-0100",
      notes,
      status,
    };
  }

  function slugMail(name) {
    return name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z]+/g, ".");
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return seedState();
      return sanitize(JSON.parse(raw));
    } catch {
      return seedState();
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        stock: state.stock,
        rentals: state.rentals.map(storedRental),
      }));
    } catch {
      toast("No se pudo guardar la demo en este navegador.");
    }
  }

  function storedRental(rental) {
    return {
      id: rental.id,
      productId: rental.productId,
      start: rental.start,
      end: rental.end,
      qty: rental.qty,
      name: rental.name,
      email: rental.email,
      phone: rental.phone,
      notes: rental.notes,
      status: rental.status,
      createdAt: rental.createdAt,
    };
  }

  function sanitize(raw) {
    const seed = seedState();
    if (!raw || typeof raw !== "object") return seed;
    const stock = { ...seed.stock };
    PRODUCT_IDS.forEach((id) => {
      const value = Number(raw.stock?.[id]);
      if (Number.isInteger(value) && value >= 0 && value <= 999) stock[id] = value;
    });
    if (!Array.isArray(raw.rentals)) return { stock, rentals: seed.rentals };
    const rentals = [];
    const seen = new Set();
    raw.rentals.forEach((item) => {
      const rental = sanitizeRental(item);
      if (!rental || seen.has(rental.id)) return;
      seen.add(rental.id);
      rentals.push(rental);
    });
    return { stock, rentals };
  }

  function sanitizeRental(item) {
    if (!item || typeof item !== "object") return null;
    if (!PRODUCT_IDS.includes(item.productId)) return null;
    if (!Object.prototype.hasOwnProperty.call(STATUS_LABEL, item.status)) return null;
    if (!isIsoDate(item.start) || !isIsoDate(item.end) || item.end < item.start) return null;
    const qty = Number(item.qty);
    if (!Number.isInteger(qty) || qty < 1 || qty > 99) return null;
    if (typeof item.id !== "string" || !item.id.trim()) return null;
    if (typeof item.name !== "string" || !item.name.trim()) return null;
    return {
      id: item.id.trim(),
      productId: item.productId,
      start: item.start,
      end: item.end,
      qty,
      name: item.name.trim(),
      email: typeof item.email === "string" ? item.email : "",
      phone: typeof item.phone === "string" ? item.phone : "",
      notes: typeof item.notes === "string" ? item.notes : "",
      status: item.status,
      createdAt: typeof item.createdAt === "string" ? item.createdAt : `${item.start}T12:00:00.000Z`,
    };
  }

  function isIsoDate(value) {
    return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
  }

  function todayIso() {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }

  function addDays(iso, days) {
    const [year, month, day] = iso.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + days);
    const monthText = String(date.getMonth() + 1).padStart(2, "0");
    const dayText = String(date.getDate()).padStart(2, "0");
    return `${date.getFullYear()}-${monthText}-${dayText}`;
  }

  function formatDate(iso) {
    const [year, month, day] = iso.split("-");
    return `${day}/${month}/${year}`;
  }

  function productById(id) {
    return PRODUCTS.find((product) => product.id === id) || null;
  }

  function blockingIntervals(productId, ignoreId) {
    return state.rentals
      .filter((rental) => (
        rental.productId === productId
        && BLOCKING.has(rental.status)
        && rental.id !== ignoreId
      ))
      .map((rental) => ({ start: rental.start, end: rental.end, qty: rental.qty }));
  }

  function peakDuring(intervals, windowStart, windowEnd) {
    const events = [];
    intervals.forEach((interval) => {
      events.push({ day: interval.start, delta: interval.qty });
      events.push({ day: addDays(interval.end, 1), delta: -interval.qty });
    });
    events.sort((a, b) => {
      if (a.day === b.day) return a.delta - b.delta;
      return a.day < b.day ? -1 : 1;
    });
    let current = 0;
    let peak = 0;
    for (let index = 0; index < events.length; index += 1) {
      current += events[index].delta;
      const from = events[index].day;
      const until = index + 1 < events.length ? events[index + 1].day : "9999-12-31";
      if (from <= windowEnd && until > windowStart) peak = Math.max(peak, current);
      if (from > windowEnd) break;
    }
    return peak;
  }

  function peakOverall(intervals) {
    if (intervals.length === 0) return 0;
    const start = intervals.reduce((min, item) => (item.start < min ? item.start : min), intervals[0].start);
    const end = intervals.reduce((max, item) => (item.end > max ? item.end : max), intervals[0].end);
    return peakDuring(intervals, start, end);
  }

  function committedPeak(productId) {
    return peakOverall(blockingIntervals(productId, null));
  }

  function availableUnits(productId) {
    return Math.max(0, state.stock[productId] - committedPeak(productId));
  }

  function totalAvailable() {
    return PRODUCT_IDS.reduce((sum, id) => sum + availableUnits(id), 0);
  }

  function countStatus(status) {
    return state.rentals.filter((rental) => rental.status === status).length;
  }

  function blockingConflict(rental) {
    const product = productById(rental.productId);
    const peak = peakDuring(blockingIntervals(rental.productId, rental.id), rental.start, rental.end);
    const stock = state.stock[rental.productId];
    if (peak + rental.qty <= stock) return "";
    const free = Math.max(0, stock - peak);
    const committed = peak === 1 ? "1 unidad comprometida" : `${peak} unidades comprometidas`;
    const freeText = free === 1 ? "1 unidad libre" : `${free} unidades libres`;
    return `No se puede confirmar ni activar: entre el ${formatDate(rental.start)} y el ${formatDate(rental.end)} ya hay ${committed} de ${product.name}. El stock es ${stock} y esta solicitud pide ${rental.qty}. Quedan ${freeText} en ese período.`;
  }

  function fillProductSelect() {
    const select = document.querySelector("#product");
    if (!select || select.dataset.ready === "true") return;
    select.dataset.ready = "true";
    PRODUCTS.forEach((product) => {
      const option = document.createElement("option");
      option.value = product.id;
      option.textContent = product.name;
      select.append(option);
    });
  }

  function renderCatalog() {
    const mount = document.querySelector("#catalog");
    if (!mount) return;
    mount.replaceChildren(...PRODUCTS.map(renderCard));
    mountImages(mount);
  }

  function renderCard(product) {
    const free = availableUnits(product.id);
    const media = el("div", { class: "media" }, [
      el("img", { alt: product.name, "data-base": product.imageBase }),
      el("p", { class: "media-fallback", text: "Fotografía del equipo" }),
    ]);
    const freeCopy = free === 0
      ? "Sin unidades libres en el pico actual. La solicitud puede quedar pendiente."
      : free === 1
        ? "1 unidad libre en el pico de ocupación actual."
        : `${free} unidades libres en el pico de ocupación actual.`;
    return el("article", { class: "card", "data-product": product.id }, [
      media,
      el("div", { class: "card-body" }, [
        el("h3", { text: product.name }),
        el("p", { class: "desc", text: product.short }),
        el("p", { class: "tariff", text: "Tarifa de alquiler a consultar" }),
        el("span", {
          class: free > 0 ? "badge badge-disponible" : "badge badge-agotado",
          text: free > 0 ? "Disponible" : "Sin unidades libres",
        }),
        el("p", { class: "help", text: freeCopy }),
        el("div", { class: "card-actions" }, [
          el("button", { type: "button", class: "btn btn-secondary", "data-action": "details", text: "Ver detalles" }),
          el("button", { type: "button", class: "btn btn-primary", "data-action": "rent", text: "Solicitar alquiler" }),
        ]),
      ]),
    ]);
  }

  function onCatalogClick(event) {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const card = button.closest("[data-product]");
    if (!card) return;
    const product = productById(card.getAttribute("data-product"));
    if (!product) return;
    if (button.getAttribute("data-action") === "details") openDetails(product);
    if (button.getAttribute("data-action") === "rent") startRequest(product.id);
  }

  function openDetails(product) {
    const free = availableUnits(product.id);
    const list = el("ul", { class: "feature-list" });
    product.features.forEach((feature) => list.append(el("li", { text: feature })));
    const dialog = modalShell(product.name, [
      el("div", { class: "media modal-media" }, [
        el("img", { alt: product.name, "data-base": product.imageBase }),
        el("p", { class: "media-fallback", text: "Fotografía del equipo" }),
      ]),
      el("p", { text: product.summary }),
      list,
      el("p", { class: "tariff", text: "Tarifa de alquiler a consultar" }),
      el("p", {
        class: "help",
        text: free > 0
          ? `${free === 1 ? "Hay 1 unidad libre" : `Hay ${free} unidades libres`} según el pico actual de alquileres confirmados o en curso. Cannatrol confirma la fecha antes de coordinar.`
          : "No quedan unidades libres en el pico actual. Igual podés enviar la solicitud: queda pendiente y no reserva equipos.",
      }),
      el("div", { class: "modal-actions" }, [
        el("button", {
          type: "button",
          class: "btn btn-primary",
          text: "Solicitar alquiler",
          onClick: () => startRequest(product.id),
        }),
        el("button", { type: "button", class: "btn btn-secondary", text: "Cerrar", onClick: () => closeModal() }),
      ]),
    ]);
    openModal(dialog);
    mountImages(dialog);
  }

  function startRequest(productId) {
    const select = document.querySelector("#product");
    if (select) select.value = productId;
    closeModal();
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    document.querySelector("#contacto")?.scrollIntoView({ behavior: motion, block: "start" });
    select?.focus();
  }

  function onReview(event) {
    event.preventDefault();
    const data = readForm();
    const errors = validateForm(data);
    showErrors(errors);
    const fields = Object.keys(errors);
    if (fields.length > 0) {
      document.getElementById(fields[0])?.focus();
      return;
    }
    openSummary(data);
  }

  function readForm() {
    return {
      productId: document.querySelector("#product").value,
      start: document.querySelector("#start").value,
      end: document.querySelector("#end").value,
      qty: Number(document.querySelector("#qty").value),
      name: document.querySelector("#full-name").value.trim(),
      email: document.querySelector("#email").value.trim(),
      phone: document.querySelector("#phone").value.trim(),
      notes: document.querySelector("#notes").value.trim(),
    };
  }

  function validateForm(data) {
    const errors = {};
    const today = todayIso();
    if (!productById(data.productId)) errors.product = "Elegí un equipo.";
    if (!data.start) errors.start = "Indicá la fecha de inicio.";
    else if (data.start < today) errors.start = "La fecha de inicio no puede ser anterior a hoy.";
    if (!data.end) errors.end = "Indicá la fecha de finalización.";
    else if (data.start && data.end < data.start) errors.end = "La finalización no puede ser anterior al inicio.";
    if (!Number.isInteger(data.qty) || data.qty < 1 || data.qty > 20) {
      errors.qty = "Indicá una cantidad entre 1 y 20.";
    }
    if (data.name.split(/\s+/).filter(Boolean).length < 2) errors["full-name"] = "Ingresá nombre y apellido.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = "Ingresá un correo válido.";
    if ((data.phone.match(/\d/g) || []).length < 6) errors.phone = "Ingresá un teléfono de contacto.";
    return errors;
  }

  function showErrors(errors) {
    ["product", "start", "end", "qty", "full-name", "email", "phone"].forEach((field) => {
      const input = document.getElementById(field);
      const error = document.getElementById(`${field}-error`);
      const message = errors[field] || "";
      if (error) error.textContent = message;
      if (!input) return;
      if (message) input.setAttribute("aria-invalid", "true");
      else input.removeAttribute("aria-invalid");
    });
    const alert = document.querySelector("#form-alert");
    if (!alert) return;
    const messages = Object.values(errors);
    alert.hidden = messages.length === 0;
    alert.textContent = messages.length ? "Revisá los campos marcados antes de continuar." : "";
  }

  function openSummary(data) {
    const product = productById(data.productId);
    const dialog = modalShell("Revisá la solicitud", [
      el("p", { class: "help", text: "Si confirmás, queda como Pendiente. Cannatrol valida la disponibilidad después. Esta simulación no envía correos." }),
      el("dl", { class: "summary" }, [
        summaryRow("Equipo", product.name),
        summaryRow("Inicio", formatDate(data.start)),
        summaryRow("Finalización", formatDate(data.end)),
        summaryRow("Cantidad", data.qty === 1 ? "1 equipo" : `${data.qty} equipos`),
        summaryRow("Nombre", data.name),
        summaryRow("Correo", data.email),
        summaryRow("Teléfono", data.phone),
        summaryRow("Comentarios", data.notes || "Sin comentarios"),
        summaryRow("Tarifa", "Tarifa de alquiler a consultar"),
        summaryRow("Estado inicial", "Pendiente"),
      ]),
      el("div", { class: "modal-actions" }, [
        el("button", {
          type: "button",
          class: "btn btn-primary",
          text: "Confirmar solicitud",
          onClick: (event) => confirmRequest(data, event.currentTarget),
        }),
        el("button", { type: "button", class: "btn btn-secondary", text: "Volver a editar", onClick: () => closeModal() }),
      ]),
    ]);
    openModal(dialog);
  }

  function confirmRequest(data, button) {
    if (savingRequest) return;
    savingRequest = true;
    button.disabled = true;
    const rental = {
      id: nextId(state.rentals),
      productId: data.productId,
      start: data.start,
      end: data.end,
      qty: data.qty,
      name: data.name,
      email: data.email,
      phone: data.phone,
      notes: data.notes.slice(0, 500),
      status: "pendiente",
      createdAt: new Date().toISOString(),
    };
    state.rentals.push(rental);
    saveState();
    renderCatalog();
    document.querySelector("#rental-form").reset();
    showErrors({});
    const today = todayIso();
    document.querySelector("#start").min = today;
    document.querySelector("#end").min = today;
    savingRequest = false;
    openSuccess(rental);
  }

  function openSuccess(rental) {
    const product = productById(rental.productId);
    const dialog = modalShell("Solicitud registrada", [
      el("p", { class: "request-number", text: rental.id }),
      el("p", { text: "Estado: Pendiente" }),
      el("p", { class: "help", text: `${product.name}, del ${formatDate(rental.start)} al ${formatDate(rental.end)}, ${rental.qty === 1 ? "1 equipo" : `${rental.qty} equipos`}.` }),
      el("p", { text: "Cannatrol confirma después la disponibilidad y la tarifa. La solicitud ya está en el panel de gestión de este navegador." }),
      el("p", { class: "help", text: "Simulación: no se envió ningún correo y los datos no salen de este navegador." }),
      el("div", { class: "modal-actions" }, [
        el("button", { type: "button", class: "btn btn-primary", text: "Cerrar", onClick: () => closeModal() }),
      ]),
    ]);
    openModal(dialog);
  }

  function nextId(rentals) {
    let max = 2400;
    rentals.forEach((rental) => {
      const match = /^CT-(\d+)$/.exec(rental.id);
      if (match) max = Math.max(max, Number(match[1]));
    });
    return `CT-${String(max + 1).padStart(4, "0")}`;
  }

  function showView(name) {
    const view = name === "equipos" || name === "alquileres" ? name : "resumen";
    document.querySelectorAll("[data-view]").forEach((section) => {
      section.hidden = section.getAttribute("data-view") !== view;
    });
    document.querySelectorAll("[data-nav]").forEach((button) => {
      if (button.getAttribute("data-nav") === view) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
    const copy = VIEW_COPY[view];
    document.querySelector("#admin-title").textContent = copy.title;
    document.querySelector("#admin-intro").textContent = copy.intro;
    const nextHash = view === "resumen" ? location.pathname : `${location.pathname}#${view}`;
    if (`${location.pathname}${location.hash}` !== nextHash) {
      history.replaceState(null, "", nextHash);
    }
    renderAdmin();
  }

  function renderAdmin() {
    renderMetrics();
    renderRecent();
    renderEquipment();
    renderRentalTable();
  }

  function renderMetrics() {
    const mount = document.querySelector("#metrics");
    if (!mount) return;
    const items = [
      ["Solicitudes pendientes", countStatus("pendiente"), "tone-violet", ""],
      ["Alquileres confirmados", countStatus("confirmado"), "tone-blue", ""],
      ["Alquileres en curso", countStatus("en_curso"), "tone-cyan", ""],
      ["Equipos disponibles", totalAvailable(), "tone-ink", "Unidades libres"],
    ];
    mount.replaceChildren(...items.map(([label, value, tone, hint]) => {
      const card = el("article", { class: "metric" }, [
        el("p", { class: "metric-label", text: label }),
        el("p", { class: `metric-value ${tone}`, text: String(value) }),
      ]);
      if (hint) card.append(el("p", { class: "metric-hint", text: hint }));
      return card;
    }));
  }

  function renderRecent() {
    const mount = document.querySelector("#recent-table");
    if (!mount) return;
    const rows = sortedRentals().slice(0, 5);
    mount.replaceChildren(rows.length ? renderTable(rows) : el("p", { class: "empty", text: "Todavía no hay solicitudes." }));
  }

  function renderEquipment() {
    const mount = document.querySelector("#equipment-list");
    if (!mount) return;
    mount.replaceChildren(...PRODUCTS.map((product) => {
      const committed = committedPeak(product.id);
      const available = availableUnits(product.id);
      return el("article", { class: "equip-card" }, [
        el("div", { class: "media media-sm" }, [
          el("img", { alt: product.name, "data-base": product.imageBase }),
          el("p", { class: "media-fallback", text: "Foto" }),
        ]),
        el("div", { class: "equip-copy" }, [
          el("h3", { text: product.name }),
          el("dl", { class: "stat-list" }, [
            statItem("Comprometidas", String(committed)),
            statItem("Disponibles", String(available)),
          ]),
        ]),
        el("form", { "data-stock-form": product.id, class: "stock-form" }, [
          el("div", { class: "field" }, [
            el("label", { for: `stock-${product.id}`, text: "Stock total" }),
            el("input", {
              id: `stock-${product.id}`,
              name: "stock",
              type: "number",
              min: "0",
              max: "999",
              step: "1",
              value: String(state.stock[product.id]),
              required: "true",
            }),
          ]),
          el("button", { type: "submit", class: "btn btn-primary btn-small", text: "Actualizar" }),
          el("p", { class: "stock-error", role: "alert" }),
        ]),
      ]);
    }));
    mountImages(mount);
  }

  function statItem(term, value) {
    return el("div", {}, [
      el("dt", { text: term }),
      el("dd", { text: value }),
    ]);
  }

  function onStockSubmit(event) {
    const form = event.target.closest("[data-stock-form]");
    if (!form) return;
    event.preventDefault();
    const productId = form.getAttribute("data-stock-form");
    const product = productById(productId);
    const input = form.querySelector("input");
    const errorNode = form.querySelector(".stock-error");
    const next = Number(input.value);
    if (!Number.isInteger(next) || next < 0 || next > 999) {
      errorNode.textContent = "Ingresá un número entero entre 0 y 999.";
      input.focus();
      return;
    }
    const peak = committedPeak(productId);
    if (next < peak) {
      errorNode.textContent = `El stock de ${product.name} no puede bajar de ${peak}, el pico de unidades comprometidas por alquileres confirmados o en curso.`;
      input.focus();
      return;
    }
    state.stock[productId] = next;
    saveState();
    renderAdmin();
    toast("Stock actualizado.");
  }

  function renderRentalTable() {
    const mount = document.querySelector("#rental-table");
    const count = document.querySelector("#rental-count");
    if (!mount || !count) return;
    const rows = filteredRentals();
    count.textContent = rows.length === 1 ? "1 solicitud" : `${rows.length} solicitudes`;
    mount.replaceChildren(rows.length
      ? renderTable(rows)
      : el("p", { class: "empty", text: "No hay solicitudes que coincidan con la búsqueda." }));
  }

  function filteredRentals() {
    const status = document.querySelector("#filter-status").value;
    const query = normalize(document.querySelector("#filter-query").value.trim());
    return sortedRentals().filter((rental) => {
      if (status !== "todos" && rental.status !== status) return false;
      if (!query) return true;
      return normalize(`${rental.id} ${rental.name}`).includes(query);
    });
  }

  function sortedRentals() {
    return [...state.rentals].sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
  }

  function renderTable(rentals) {
    const table = el("table", { class: "data-table" }, [
      el("caption", { class: "sr-only", text: "Solicitudes de alquiler" }),
    ]);
    const head = document.createElement("tr");
    ["Solicitud", "Cliente", "Equipo", "Inicio", "Fin", "Cantidad", "Estado", "Acción"].forEach((label) => {
      head.append(el("th", { scope: "col", text: label }));
    });
    const thead = document.createElement("thead");
    thead.append(head);
    const tbody = document.createElement("tbody");
    rentals.forEach((rental) => {
      const product = productById(rental.productId);
      const row = document.createElement("tr");
      row.append(el("td", { class: "mono", "data-label": "Solicitud", text: rental.id }));
      row.append(el("td", { "data-label": "Cliente", text: rental.name }));
      row.append(el("td", { "data-label": "Equipo", text: product ? product.name : rental.productId }));
      row.append(el("td", { "data-label": "Inicio", text: formatDate(rental.start) }));
      row.append(el("td", { "data-label": "Fin", text: formatDate(rental.end) }));
      row.append(el("td", { "data-label": "Cantidad", text: String(rental.qty) }));
      const statusCell = el("td", { "data-label": "Estado" });
      statusCell.append(el("span", { class: `badge badge-${rental.status}`, text: STATUS_LABEL[rental.status] }));
      row.append(statusCell);
      const action = el("td", { class: "actions", "data-label": "Acción" });
      action.append(el("button", {
        type: "button",
        class: "btn btn-secondary btn-small",
        "data-rental": rental.id,
        "aria-label": `Ver detalles de la solicitud ${rental.id}`,
        text: "Ver detalles",
      }));
      row.append(action);
      tbody.append(row);
    });
    table.append(thead, tbody);
    return el("div", { class: "table-wrap panel" }, [table]);
  }

  function onRentalAction(event) {
    const button = event.target.closest("[data-rental]");
    if (!button) return;
    openRental(button.getAttribute("data-rental"));
  }

  function openRental(id) {
    const rental = state.rentals.find((item) => item.id === id);
    if (!rental) return;
    const product = productById(rental.productId);
    const select = document.createElement("select");
    select.id = "status-select";
    Object.entries(STATUS_LABEL).forEach(([value, label]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      option.selected = value === rental.status;
      select.append(option);
    });
    const message = el("p", { class: "stock-error", role: "alert" });
    const save = el("button", { type: "button", class: "btn btn-primary", text: "Guardar estado" });
    select.addEventListener("change", () => {
      const error = select.value !== rental.status && BLOCKING.has(select.value)
        ? blockingConflict(rental)
        : "";
      message.textContent = error;
      save.disabled = Boolean(error);
    });
    save.addEventListener("click", () => {
      const next = select.value;
      if (!Object.prototype.hasOwnProperty.call(STATUS_LABEL, next)) return;
      if (next !== rental.status && BLOCKING.has(next)) {
        const error = blockingConflict(rental);
        if (error) {
          message.textContent = error;
          save.disabled = true;
          return;
        }
      }
      rental.status = next;
      saveState();
      closeModal();
      renderAdmin();
      toast(`Solicitud ${rental.id}: ${STATUS_LABEL[next]}.`);
    });
    const dialog = modalShell(`Solicitud ${rental.id}`, [
      el("dl", { class: "summary" }, [
        summaryRow("Cliente", rental.name),
        summaryRow("Correo", rental.email || "—"),
        summaryRow("Teléfono", rental.phone || "—"),
        summaryRow("Equipo", product ? product.name : rental.productId),
        summaryRow("Inicio", formatDate(rental.start)),
        summaryRow("Finalización", formatDate(rental.end)),
        summaryRow("Cantidad", String(rental.qty)),
        summaryRow("Comentarios", rental.notes || "Sin comentarios"),
        summaryRow("Tarifa", "Tarifa de alquiler a consultar"),
      ]),
      el("div", { class: "field" }, [
        el("label", { for: "status-select", text: "Estado" }),
        select,
      ]),
      el("p", { class: "help", text: "Las pendientes no reservan unidades. Al confirmar o activar se controla que el stock alcance en todo el período." }),
      message,
      el("div", { class: "modal-actions" }, [
        save,
        el("button", { type: "button", class: "btn btn-secondary", text: "Cerrar", onClick: () => closeModal() }),
      ]),
    ], true);
    openModal(dialog);
  }

  function openReset() {
    const dialog = modalShell("Restablecer demo", [
      el("p", { text: "Se borran las solicitudes creadas y el stock modificado en este navegador. Vuelven los ocho alquileres y el stock iniciales." }),
      el("div", { class: "modal-actions" }, [
        el("button", {
          type: "button",
          class: "btn btn-primary",
          text: "Restablecer datos",
          onClick: () => {
            state = seedState();
            saveState();
            closeModal();
            renderAdmin();
            toast("Demo restablecida.");
          },
        }),
        el("button", { type: "button", class: "btn btn-secondary", text: "Cancelar", onClick: () => closeModal() }),
      ]),
    ]);
    openModal(dialog);
  }

  function summaryRow(term, value) {
    return el("div", {}, [
      el("dt", { text: term }),
      el("dd", { text: value }),
    ]);
  }

  function modalShell(title, nodes, wide) {
  const titleId = `modal-title-${Math.random().toString(36).slice(2, 8)}`;
  const close = el("button", {
    type: "button",
    class: "icon-btn",
    "aria-label": "Cerrar",
    onClick: () => closeModal(),
  }, [closeIcon()]);
  const bodyNodes = [];
  const actionNodes = [];
  nodes.forEach((node) => {
    if (node.classList.contains("modal-actions")) actionNodes.push(node);
    else bodyNodes.push(node);
  });
  return el("div", {
    class: wide ? "modal-dialog modal-wide" : "modal-dialog",
    role: "dialog",
    "aria-modal": "true",
    "aria-labelledby": titleId,
    tabindex: "-1",
  }, [
    el("div", { class: "modal-head" }, [
      el("h2", { id: titleId, text: title }),
      close,
    ]),
    el("div", { class: "modal-body" }, bodyNodes),
    ...actionNodes,
  ]);
}

  function openModal(dialog) {
    if (!document.querySelector(".modal")) lastFocus = document.activeElement;
    const wrap = el("div", { class: "modal" }, [
      el("div", { class: "modal-backdrop" }),
    ]);
    wrap.firstChild.addEventListener("click", () => closeModal());
    wrap.append(dialog);
    document.querySelector("#modal-root").replaceChildren(wrap);
    document.documentElement.classList.add("modal-open");
    trapFocus(dialog);
  }

  function closeModal() {
    const root = document.querySelector("#modal-root");
    if (!root || !root.firstChild) return;
    root.replaceChildren();
    document.documentElement.classList.remove("modal-open");
    if (lastFocus instanceof HTMLElement) lastFocus.focus();
    lastFocus = null;
  }

  function trapFocus(dialog) {
    dialog.focus();
    dialog.addEventListener("keydown", (event) => {
      if (event.key !== "Tab") return;
      const list = [...dialog.querySelectorAll("button, a[href], input, select, textarea")]
        .filter((node) => !node.disabled);
      if (list.length === 0) {
        event.preventDefault();
        return;
      }
      const first = list[0];
      const last = list[list.length - 1];
      const onEdge = event.shiftKey
        ? document.activeElement === first || document.activeElement === dialog
        : document.activeElement === last;
      if (!onEdge) return;
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
    });
  }

  function toast(message) {
    const node = document.querySelector("#toast");
    if (!node) return;
    node.textContent = message;
    node.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => node.classList.remove("is-visible"), 3200);
  }

  function readImageMap() {
    const node = document.querySelector("#cannatrol-images");
    if (!node) return {};
    try {
      const parsed = JSON.parse(node.textContent || "{}");
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }

  function mountImages(root) {
    const map = readImageMap();
    root.querySelectorAll("img[data-base]").forEach((img) => {
      if (img.dataset.bound === "true") return;
      img.dataset.bound = "true";
      const base = img.getAttribute("data-base");
      if (map[base]) useMappedImage(img, map[base], base);
      else probeImage(img, base, 0);
    });
  }

  function markLoaded(img) {
    img.closest(".media")?.classList.add("has-image");
  }

  function useMappedImage(img, src, base) {
    img.onerror = () => {
      img.onerror = null;
      img.removeAttribute("src");
      probeImage(img, base, 0);
    };
    img.onload = () => markLoaded(img);
    img.src = src;
    if (img.complete && img.naturalWidth > 0) markLoaded(img);
  }

  function probeImage(img, base, index) {
    if (index >= EXTENSIONS.length) return;
    const probe = new Image();
    const src = `/demos/${encodeURIComponent(base)}.${EXTENSIONS[index]}`;
    probe.onload = () => {
      img.onload = () => markLoaded(img);
      img.src = src;
      if (img.complete && img.naturalWidth > 0) markLoaded(img);
    };
    probe.onerror = () => probeImage(img, base, index + 1);
    probe.src = src;
  }

  function normalize(value) {
    return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }

  function closeIcon() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("width", "18");
    svg.setAttribute("height", "18");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "1.8");
    svg.setAttribute("stroke-linecap", "round");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M6 6l12 12M18 6L6 18");
    svg.append(path);
    return svg;
  }

  function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    Object.entries(attrs).forEach(([key, value]) => {
      if (value == null || value === false) return;
      if (key === "class") {
        node.className = String(value);
        return;
      }
      if (key === "text") {
        node.textContent = String(value);
        return;
      }
      if (key.startsWith("on") && typeof value === "function") {
        node.addEventListener(key.slice(2).toLowerCase(), value);
        return;
      }
      node.setAttribute(key, value === true ? "" : String(value));
    });
    children.forEach((child) => node.append(child));
    return node;
  }
})();
