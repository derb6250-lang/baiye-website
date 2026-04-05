/**
 * Left dial: window pointerdown (right + clientX < 300), vertical drag rotates wheel.
 */
window.addEventListener("contextmenu", (e) => e.preventDefault());

const DRAG_ZONE_X = 300;
const CROWN_DEG = 90;
const ROTATION_SENSITIVITY = 0.4;

const page = document.getElementById("page");
const ring = document.getElementById("baiye-ring");
const links = [...document.querySelectorAll(".baiye-nav__link")];
const wheel = document.getElementById("baiye-wheel");
const ticksSvg = document.getElementById("baiye-ticks");

let isDragging = false;
let startY = 0;
let currentRotation = 0;
let arcDegs = [];

function normalizeDeg180(deg) {
  let x = deg % 360;
  if (x > 180) x -= 360;
  if (x <= -180) x += 360;
  return x;
}

function layoutArc() {
  const n = links.length;
  if (n < 2) return;
  const span = 72;
  const step = span / (n - 1);
  const start = CROWN_DEG - span / 2;
  arcDegs = [];
  ring.querySelectorAll(":scope > li").forEach((li, i) => {
    const deg = start + i * step;
    arcDegs[i] = deg;
    li.style.setProperty("--arc-deg", `${deg}deg`);
  });
}

function getNearestSnapDelta() {
  if (arcDegs.length === 0) return { offset: 0, bestI: 0 };
  let bestI = 0;
  let bestAbs = Infinity;
  for (let i = 0; i < arcDegs.length; i += 1) {
    const pos = arcDegs[i] + currentRotation;
    const d = normalizeDeg180(pos - CROWN_DEG);
    const a = Math.abs(d);
    if (a < bestAbs) {
      bestAbs = a;
      bestI = i;
    }
  }
  const offset = normalizeDeg180(arcDegs[bestI] + currentRotation - CROWN_DEG);
  return { offset, bestI };
}

function updateCenteredClass() {
  const { bestI } = getNearestSnapDelta();
  links.forEach((a, i) => {
    a.classList.toggle("is-centered", i === bestI);
  });
}

function applyWheelTransform() {
  if (!wheel) return;
  wheel.style.setProperty("--rotation-angle", `${currentRotation}deg`);
  wheel.style.transform = `translateY(-50%) rotate(${currentRotation}deg)`;
  if (page) {
    page.style.setProperty("--bg-kanji-rot", `${currentRotation * -0.05}deg`);
    page.style.setProperty("--bg-kanji-nudge", `${currentRotation * 0.12}px`);
  }
  updateCenteredClass();
}

function buildZoomTicks() {
  if (!ticksSvg) return;
  ticksSvg.replaceChildren();
  const NS = "http://www.w3.org/2000/svg";
  const cx = 100;
  const cy = 100;
  const rOuter = 92;
  const rInnerMinor = 89.2;
  const rInnerMajor = 88.2;
  for (let t = -50; t <= 50; t += 2) {
    const theta = CROWN_DEG + t;
    const rad = (theta * Math.PI) / 180;
    const s = Math.sin(rad);
    const c = Math.cos(rad);
    const major = t % 8 === 0;
    const rIn = major ? rInnerMajor : rInnerMinor;
    const line = document.createElementNS(NS, "line");
    line.setAttribute("x1", String(cx + rIn * s));
    line.setAttribute("y1", String(cy - rIn * c));
    line.setAttribute("x2", String(cx + rOuter * s));
    line.setAttribute("y2", String(cy - rOuter * c));
    line.setAttribute("stroke", "currentColor");
    line.setAttribute("stroke-width", major ? "0.5" : "0.28");
    line.setAttribute("stroke-linecap", "round");
    ticksSvg.appendChild(line);
  }
}

function endDrag() {
  if (!isDragging) return;
  isDragging = false;
  startY = 0;
  wheel.classList.remove("is-dragging");
  const { offset } = getNearestSnapDelta();
  currentRotation -= offset;
  applyWheelTransform();
}

function onPointerDown(e) {
  if (e.button !== 2) return;
  if (e.clientX >= DRAG_ZONE_X) return;
  e.preventDefault();
  isDragging = true;
  startY = e.clientY;
  wheel.classList.add("is-dragging");
  try {
    wheel.setPointerCapture(e.pointerId);
  } catch (_) {
    /* ignore */
  }
}

function onPointerMove(e) {
  if (!isDragging) return;
  if ((e.buttons & 2) === 0) {
    endDrag();
    return;
  }
  const deltaY = e.clientY - startY;
  currentRotation += deltaY * ROTATION_SENSITIVITY;
  startY = e.clientY;
  applyWheelTransform();
}

function onPointerUp(e) {
  if (e.button !== 2 || !isDragging) return;
  try {
    if (wheel.hasPointerCapture?.(e.pointerId)) {
      wheel.releasePointerCapture(e.pointerId);
    }
  } catch (_) {
    /* ignore */
  }
  endDrag();
}

window.addEventListener("pointerdown", onPointerDown, { capture: true });
window.addEventListener("pointermove", onPointerMove);
window.addEventListener("pointerup", onPointerUp);
window.addEventListener("pointercancel", () => {
  if (isDragging) endDrag();
});

links.forEach((a) => {
  a.addEventListener("click", (e) => {
    if (e.button !== 0) return;
    const href = a.getAttribute("href");
    if (!href?.startsWith("#")) return;
    e.preventDefault();
    history.pushState(null, "", href);
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
    updateCenteredClass();
  });
});

window.addEventListener("hashchange", updateCenteredClass);

layoutArc();
buildZoomTicks();
applyWheelTransform();
