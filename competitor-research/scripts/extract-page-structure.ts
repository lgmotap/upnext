import type { PageCapture } from "./types";

const VISIBLE_TEXT_LIMIT = 12_000;

export const EXTRACT_PAGE_STRUCTURE_SCRIPT = `
(() => {
  const norm = (s) => (s || "").replace(/\\s+/g, " ").trim();

  const isVisible = (el) => {
    if (!el || el.nodeType !== 1) return false;
    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
      return false;
    }
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  };

  const labelFor = (el) => {
    const id = el.getAttribute("id");
    if (id) {
      const lbl = document.querySelector('label[for="' + id + '"]');
      if (lbl) return norm(lbl.textContent);
    }
    const aria = el.getAttribute("aria-label");
    if (aria) return norm(aria);
    const labelledBy = el.getAttribute("aria-labelledby");
    if (labelledBy) {
      const parts = labelledBy.split(/\\s+/).map((x) => document.getElementById(x)?.textContent || "").join(" ");
      if (parts.trim()) return norm(parts);
    }
    const parentLabel = el.closest("label");
    if (parentLabel) return norm(parentLabel.textContent);
    return "";
  };

  const collectNav = (selector) =>
    Array.from(document.querySelectorAll(selector))
      .filter(isVisible)
      .map((el) => ({
        text: norm(el.textContent || el.getAttribute("title") || ""),
        href: el.getAttribute("href") || "",
        ariaLabel: norm(el.getAttribute("aria-label") || ""),
      }))
      .filter((x) => x.text || x.href || x.ariaLabel)
      .slice(0, 200);

  const headings = Array.from(document.querySelectorAll("h1,h2,h3,h4,h5,h6"))
    .filter(isVisible)
    .map((el) => ({
      level: Number(el.tagName.slice(1)),
      text: norm(el.textContent),
    }))
    .filter((h) => h.text)
    .slice(0, 100);

  const breadcrumbs = Array.from(
    document.querySelectorAll('[aria-label*="breadcrumb" i], nav.breadcrumb, .breadcrumb, [class*="breadcrumb"]'),
  )
    .flatMap((root) =>
      Array.from(root.querySelectorAll("a, span, li"))
        .filter(isVisible)
        .map((el) => norm(el.textContent))
        .filter(Boolean),
    )
    .slice(0, 30);

  const forms = Array.from(document.querySelectorAll("form"))
    .filter(isVisible)
    .map((form, idx) => {
      const fields = Array.from(
        form.querySelectorAll("input, select, textarea, button[type='submit']"),
      )
        .filter(isVisible)
        .map((field) => {
          const tag = field.tagName.toLowerCase();
          const options =
            tag === "select"
              ? Array.from(field.querySelectorAll("option"))
                  .map((o) => norm(o.textContent))
                  .filter(Boolean)
                  .slice(0, 50)
              : [];
          return {
            tag,
            type: field.getAttribute("type") || "",
            name: field.getAttribute("name") || "",
            id: field.getAttribute("id") || "",
            label: labelFor(field),
            placeholder: norm(field.getAttribute("placeholder") || ""),
            required: field.hasAttribute("required"),
            disabled: field.hasAttribute("disabled"),
            options,
            ariaLabel: norm(field.getAttribute("aria-label") || ""),
          };
        });
      return {
        id: form.getAttribute("id") || "form-" + idx,
        name: form.getAttribute("name") || "",
        action: form.getAttribute("action") || "",
        method: (form.getAttribute("method") || "get").toLowerCase(),
        fields,
      };
    })
    .slice(0, 30);

  const tables = Array.from(document.querySelectorAll("table"))
    .filter(isVisible)
    .map((table, idx) => {
      const columns = Array.from(table.querySelectorAll("thead th, tr:first-child th, tr:first-child td"))
        .map((c) => norm(c.textContent))
        .filter(Boolean)
        .slice(0, 40);
      const bodyRows = table.querySelectorAll("tbody tr, tr").length;
      return {
        id: table.getAttribute("id") || "table-" + idx,
        caption: norm(table.querySelector("caption")?.textContent || ""),
        columns,
        rowCountVisible: bodyRows,
      };
    })
    .slice(0, 30);

  const modals = Array.from(
    document.querySelectorAll('[role="dialog"], [aria-modal="true"], .modal, [class*="modal"]'),
  )
    .filter(isVisible)
    .map((el) => ({
      text: norm(el.textContent).slice(0, 500),
      role: el.getAttribute("role") || "",
    }))
    .slice(0, 20);

  const lockPatterns = /upgrade|pro plan|enterprise|locked|premium|subscribe|add-on|paid feature/i;
  const badges = Array.from(document.querySelectorAll('[class*="badge"], [class*="tag"], [class*="chip"], [class*="pill"]'))
    .filter(isVisible)
    .map((el) => norm(el.textContent))
    .filter((t) => t.length > 0 && t.length < 80)
    .slice(0, 100);

  const lockIndicators = Array.from(document.querySelectorAll("body *"))
    .filter(isVisible)
    .map((el) => norm(el.textContent))
    .filter((t) => t && lockPatterns.test(t))
    .slice(0, 50);

  const emptyPatterns = /no (bookings|jobs|customers|results|data)|get started|nothing here|empty/i;
  const emptyStates = Array.from(document.querySelectorAll("main *, [role='main'] *, .empty-state, [class*='empty']"))
    .filter(isVisible)
    .map((el) => norm(el.textContent))
    .filter((t) => t && emptyPatterns.test(t))
    .slice(0, 20);

  const meta = document.querySelector('meta[name="description"]');
  const bodyText = norm(document.body?.innerText || "").slice(0, ${VISIBLE_TEXT_LIMIT});

  return {
    title: document.title || "",
    metaDescription: meta ? norm(meta.getAttribute("content") || "") : "",
    breadcrumbs,
    headings,
    navigation: {
      primary: collectNav("nav a, nav button, header nav a, [role='navigation'] a"),
      secondary: collectNav("aside a, aside button, [class*='sidebar'] a, [class*='sidebar'] button"),
      tabs: collectNav("[role='tablist'] [role='tab'], .tabs a, [class*='tab-list'] a, [class*='tab-list'] button"),
    },
    actions: {
      buttons: collectNav("button, [role='button'], input[type='button'], input[type='submit']"),
      links: collectNav("a[href]"),
    },
    forms,
    tables,
    modals,
    badges,
    lockIndicators,
    emptyStates,
    visibleTextSample: bodyText,
  };
})()
`;

export type ExtractedDom = Omit<
  PageCapture,
  | "pageId"
  | "url"
  | "finalUrl"
  | "role"
  | "phase"
  | "label"
  | "capturedAt"
  | "viewport"
  | "errors"
>;
