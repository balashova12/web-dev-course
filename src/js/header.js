document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("header");
  if (!container) return;

  fetch("components/header.html")
    .then(r => r.text())
    .then(html => {
      container.innerHTML = html;

      const header = container.querySelector(".header");
      const burger = header.querySelector(".burger");
      const menu = header.querySelector(".menu");

      burger.addEventListener("click", () => {
        menu.classList.toggle("open");
      });

      document.addEventListener("click", (e) => {
        if (!header.contains(e.target)) {
          menu.classList.remove("open");
        }
      });
    });
});
