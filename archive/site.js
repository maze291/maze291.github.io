const navLinks = Array.from(document.querySelectorAll("nav a[href^='#']"));
const navSections = navLinks
  .map((link) => {
    const section = document.querySelector(link.getAttribute("href"));
    return section ? { link, section } : null;
  })
  .filter(Boolean);

function setActiveLink(activeLink) {
  navLinks.forEach((link) => {
    const isActive = link === activeLink;
    link.classList.toggle("is-active", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "true");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

function updateActiveNav() {
  const headerHeight = document.querySelector(".site-header")?.offsetHeight || 0;
  const navLine = Math.max(headerHeight + 30, window.innerHeight * 0.35);
  const active = navSections.find(({ section }) => {
    const rect = section.getBoundingClientRect();
    return rect.top <= navLine && rect.bottom > navLine;
  });

  setActiveLink(active?.link || null);
}

let ticking = false;
function requestNavUpdate() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    updateActiveNav();
    ticking = false;
  });
}

window.addEventListener("scroll", requestNavUpdate, { passive: true });
window.addEventListener("resize", requestNavUpdate);
window.addEventListener("hashchange", requestNavUpdate);
window.addEventListener("load", requestNavUpdate);
requestNavUpdate();
