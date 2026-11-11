import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import type { DemoSite } from "../types";

/** Demo comercial Cannatrol. El CSS y el script se leen al armar el documento. */

const demoDir = join(process.cwd(), "src/demos/cannatrol");
const css = readFileSync(join(demoDir, "styles.css"), "utf8");
const clientJs = readFileSync(join(demoDir, "client.js"), "utf8").replace(
  /<\/script/gi,
  "<\\/script",
);

const ICON_MENU = `<svg class="icon-open" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>`;
const ICON_CLOSE = `<svg class="icon-close" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>`;
const ICON_GRID = `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/></svg>`;
const ICON_BOX = `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M3 8l9-4 9 4-9 4-9-4zM3 8v8l9 4 9-4V8M12 12v8"/></svg>`;
const ICON_LIST = `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M8 7h12M8 12h12M8 17h12M4 7h.01M4 12h.01M4 17h.01"/></svg>`;

function imageMapJson(): string {
  const bases = ["CC LTD", "CC", "CC+", "CC2"];
  const map: Record<string, string> = {};
  let files: string[] = [];
  try {
    files = readdirSync(join(process.cwd(), "public", "demos"));
  } catch {
    files = [];
  }

  for (const base of bases) {
    const match = files.find((name) => {
      const dot = name.lastIndexOf(".");
      return dot > 0 && name.slice(0, dot) === base;
    });
    if (match) map[base] = `/demos/${encodeURIComponent(match)}`;
  }

  return JSON.stringify(map).replaceAll("<", "\\u003c");
}

function sharedTail(): string {
  return `<script type="application/json" id="cannatrol-images">${imageMapJson()}</script>
<div id="toast" class="toast" role="status" aria-live="polite"></div>
<div id="modal-root"></div>
<script>${clientJs}</script>`;
}

const publicHtml = `<a class="skip" href="#contenido">Saltar al contenido</a>
<div class="app" data-demo-app="public">
  <div class="topbar"></div>
  <p class="demo-banner">Demostración comercial. Las solicitudes no se envían y quedan guardadas solo en este navegador.</p>
  <header class="site-header">
    <div class="wrap header-row">
      <a class="brand" href="/demo/cannatrol">Cannatrol</a>
      <div class="header-actions">
        <button type="button" class="nav-toggle" id="nav-toggle" aria-expanded="false" aria-controls="site-nav">
          <span class="sr-only">Abrir menú</span>
          ${ICON_MENU}
          ${ICON_CLOSE}
        </button>
        <nav id="site-nav" aria-label="Secciones">
          <a href="#equipos">Equipos</a>
          <a href="#como-funciona">Cómo funciona</a>
          <a href="#contacto">Contacto</a>
          <a class="btn btn-primary menu-cta" href="#equipos">Explorar equipos</a>
        </nav>
        <a class="btn btn-primary header-cta" href="#equipos">Explorar equipos</a>
      </div>
    </div>
  </header>
  <main id="contenido">
    <section class="hero">
      <div class="wrap hero-grid">
        <div class="hero-copy">
          <p class="eyebrow">Alquiler de equipos</p>
          <h1>Tecnología profesional de secado y curado, ahora a tu alcance.</h1>
          <p class="lede">Los cultivadores pueden solicitar equipos Cannatrol durante el período que necesiten, sin adquirirlos.</p>
          <div class="hero-actions">
            <a class="btn btn-primary" href="#equipos">Explorar equipos</a>
            <a class="btn btn-secondary" href="#como-funciona">Cómo funciona</a>
          </div>
          <p class="help">La disponibilidad se confirma después de enviar la solicitud. Tarifa de alquiler a consultar.</p>
        </div>
        <div class="hero-visual">
          <div class="hero-frame media">
            <img data-base="CC" alt="Equipo Cool Cure de Cannatrol">
            <p class="media-fallback">Fotografía del equipo Cool Cure</p>
          </div>
          <div class="hero-chip">
            <strong>Cool Cure</strong>
            <span>Secado y curado profesional, por el tiempo que lo necesites.</span>
          </div>
        </div>
      </div>
    </section>
    <section class="section section-muted" id="equipos">
      <div class="wrap">
        <div class="section-head">
          <p class="eyebrow">Catálogo</p>
          <h2>Equipos Cool Cure</h2>
          <p class="lede">Cuatro modelos de secado y curado. Elegí uno para ver el detalle o dejar una solicitud.</p>
        </div>
        <div class="catalog-grid" id="catalog"></div>
      </div>
    </section>
    <section class="section" id="como-funciona">
      <div class="wrap">
        <div class="section-head">
          <p class="eyebrow eyebrow-violet">Proceso</p>
          <h2>Cómo funciona</h2>
          <p class="lede">Cuatro pasos para pedir un equipo. La empresa confirma después la disponibilidad: enviar la solicitud no reserva unidades.</p>
        </div>
        <ol class="steps">
          <li>
            <span class="step-index">01</span>
            <h3>Elegí tu equipo.</h3>
            <p>Recorré la línea Cool Cure y abrí la ficha del modelo que necesitás.</p>
          </li>
          <li>
            <span class="step-index">02</span>
            <h3>Seleccioná las fechas.</h3>
            <p>Indicá el inicio, el final y cuántas unidades querés solicitar.</p>
          </li>
          <li>
            <span class="step-index">03</span>
            <h3>Enviá tu solicitud.</h3>
            <p>Queda registrada como pendiente. En esta demo se guarda solo en tu navegador.</p>
          </li>
          <li>
            <span class="step-index">04</span>
            <h3>Coordiná el alquiler.</h3>
            <p>Cannatrol confirma la disponibilidad y las condiciones. La tarifa se consulta en ese momento.</p>
          </li>
        </ol>
      </div>
    </section>
    <section class="section section-muted" id="contacto">
      <div class="wrap">
        <div class="form-card">
          <div class="section-head">
            <p class="eyebrow">Solicitud</p>
            <h2>Solicitar alquiler</h2>
            <p class="lede">Usá datos ficticios. Es una simulación: no se envía ningún correo ni se guarda información fuera de este navegador.</p>
          </div>
          <form id="rental-form" novalidate>
            <div id="form-alert" class="form-alert" role="alert" hidden></div>
            <div class="form-grid">
              <div class="field span-2">
                <label for="product">Equipo <span class="req">*</span></label>
                <select id="product" name="product" required>
                  <option value="">Seleccionar equipo</option>
                </select>
                <p class="field-error" id="product-error"></p>
              </div>
              <div class="field">
                <label for="start">Fecha de inicio <span class="req">*</span></label>
                <input id="start" name="start" type="date" required autocomplete="off">
                <p class="field-error" id="start-error"></p>
              </div>
              <div class="field">
                <label for="end">Fecha de finalización <span class="req">*</span></label>
                <input id="end" name="end" type="date" required autocomplete="off">
                <p class="field-error" id="end-error"></p>
              </div>
              <div class="field">
                <label for="qty">Cantidad de equipos <span class="req">*</span></label>
                <input id="qty" name="qty" type="number" min="1" max="20" step="1" value="1" inputmode="numeric" required>
                <p class="field-error" id="qty-error"></p>
              </div>
              <div class="field">
                <label for="full-name">Nombre y apellido <span class="req">*</span></label>
                <input id="full-name" name="full-name" type="text" autocomplete="off" required>
                <p class="field-error" id="full-name-error"></p>
              </div>
              <div class="field">
                <label for="email">Correo electrónico <span class="req">*</span></label>
                <input id="email" name="email" type="email" autocomplete="off" required>
                <p class="field-error" id="email-error"></p>
              </div>
              <div class="field">
                <label for="phone">Teléfono <span class="req">*</span></label>
                <input id="phone" name="phone" type="tel" autocomplete="off" inputmode="tel" required>
                <p class="field-error" id="phone-error"></p>
              </div>
              <div class="field span-2">
                <label for="notes">Comentarios adicionales</label>
                <textarea id="notes" name="notes" maxlength="500"></textarea>
              </div>
            </div>
            <button class="btn btn-primary" type="submit">Revisar solicitud</button>
          </form>
        </div>
      </div>
    </section>
  </main>
  <footer class="site-footer">
    <div class="wrap footer-grid">
      <p><strong>Cannatrol</strong> · Demostración comercial de alquiler de equipos</p>
      <p>Los datos de esta simulación son ficticios y no salen de este navegador.</p>
      <p><a href="/demo/cannatrol/admin">Abrir panel de gestión</a></p>
    </div>
  </footer>
  ${sharedTail()}
</div>`;

const adminHtml = `<a class="skip" href="#contenido">Saltar al contenido</a>
<div class="app" data-demo-app="admin">
  <div class="admin">
    <aside class="sidebar">
      <div class="sidebar-head">
        <a class="brand" href="/demo/cannatrol">Cannatrol</a>
        <button type="button" class="nav-toggle" id="admin-toggle" aria-expanded="false" aria-controls="admin-nav">
          <span class="sr-only">Abrir secciones</span>
          ${ICON_MENU}
          ${ICON_CLOSE}
        </button>
      </div>
      <nav id="admin-nav" aria-label="Secciones del panel">
        <button type="button" class="nav-item" data-nav="resumen" aria-current="page">${ICON_GRID}Resumen</button>
        <button type="button" class="nav-item" data-nav="equipos">${ICON_BOX}Equipos</button>
        <button type="button" class="nav-item" data-nav="alquileres">${ICON_LIST}Alquileres</button>
        <a class="side-link" href="/demo/cannatrol">Ver sitio público</a>
        <button type="button" class="btn btn-secondary reset-btn" id="reset-demo">Restablecer demo</button>
      </nav>
    </aside>
    <div class="admin-main" id="contenido">
      <header class="admin-top">
        <p class="eyebrow">Panel de gestión</p>
        <h1 id="admin-title">Resumen</h1>
        <p class="lede" id="admin-intro">Solicitudes, alquileres activos y equipos libres en esta demostración.</p>
      </header>
      <section data-view="resumen">
        <div class="metrics" id="metrics"></div>
        <h2 class="block-title">Solicitudes recientes</h2>
        <div id="recent-table"></div>
      </section>
      <section data-view="equipos" hidden>
        <p class="help">Comprometidas es el máximo de unidades que coinciden en las mismas fechas entre alquileres confirmados o en curso. Las pendientes no descuentan stock. La tarifa de alquiler está a consultar.</p>
        <div class="stack" id="equipment-list"></div>
      </section>
      <section data-view="alquileres" hidden>
        <div class="filters">
          <div class="field">
            <label for="filter-status">Estado</label>
            <select id="filter-status">
              <option value="todos">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="confirmado">Confirmado</option>
              <option value="en_curso">En curso</option>
              <option value="finalizado">Finalizado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
          <div class="field">
            <label for="filter-query">Buscar</label>
            <input id="filter-query" type="search" placeholder="Nombre o número de solicitud" autocomplete="off">
          </div>
          <button type="button" class="btn btn-secondary" id="clear-filters">Limpiar</button>
        </div>
        <p class="help" id="rental-count"></p>
        <div id="rental-table"></div>
      </section>
    </div>
  </div>
  ${sharedTail()}
</div>`;

export const cannatrolDemo: DemoSite = {
  slug: "cannatrol",
  css,
  pages: [
    {
      segments: [],
      title: "Cannatrol | Alquiler de equipos de secado y curado",
      description:
        "Demostración comercial para solicitar equipos Cannatrol de secado y curado por el período necesario.",
      bodyHtml: publicHtml,
    },
    {
      segments: ["admin"],
      title: "Cannatrol | Panel de gestión",
      description:
        "Demostración del panel para revisar solicitudes de alquiler y el stock de equipos Cannatrol.",
      bodyHtml: adminHtml,
    },
  ],
};
