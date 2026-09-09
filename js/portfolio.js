document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector(".site-header");
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("site-nav");
  const timeEl = document.getElementById("local-time");

  if (timeEl) {
    const clock = new Intl.DateTimeFormat("es-CL", {
      timeZone: "America/Santiago",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date());
    timeEl.textContent = `Santiago · ${clock}`;
  }

  toggle.addEventListener("click", () => {
    const open = header.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      header.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });

  const canHover = window.matchMedia("(hover: hover)").matches;
  if (canHover) {
    document.querySelectorAll(".project-card").forEach((card) => {
      card.addEventListener("pointermove", (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `translateY(-10px) rotateX(${(-y * 8).toFixed(2)}deg) rotateY(${(x * 10).toFixed(2)}deg)`;
      });
      card.addEventListener("pointerleave", () => {
        card.style.transform = "";
      });
    });
  }
});
