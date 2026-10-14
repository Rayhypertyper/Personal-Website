import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "../styles.css";
import "./all-overview.css";
import "./search-header.css";

const resetDocumentScroll = () => {
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: "auto",
  });
};

if ("scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}

resetDocumentScroll();
window.requestAnimationFrame(resetDocumentScroll);
window.addEventListener("load", resetDocumentScroll, { once: true });
window.addEventListener("pageshow", resetDocumentScroll);

document.addEventListener(
  "click",
  (event) => {
    if (event.button !== 0) {
      return;
    }

    resetDocumentScroll();

    if (event.defaultPrevented) {
      return;
    }

    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const anchor = target.closest("a");
    if (anchor?.getAttribute("href")?.startsWith("#")) {
      event.preventDefault();
    }
  },
  true,
);

const root = document.getElementById("portfolioSearchRoot");

if (!root) {
  throw new Error("Missing portfolio search mount point");
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

document.documentElement.dataset.appReady = "true";
