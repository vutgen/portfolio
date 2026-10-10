const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/* ---------- Telegram-ссылки ---------- */
const tgUrl = `https://t.me/${SITE.telegram}`;
$$("[data-tg]").forEach((a) => { a.href = tgUrl; a.target = "_blank"; a.rel = "noopener"; });
$$("[data-tg-handle]").forEach((el) => (el.textContent = "@" + SITE.telegram));
$("#year").textContent = new Date().getFullYear();

/* ---------- Цифры ---------- */
$("#stats").innerHTML = SITE.stats.map((s) => `
  <div class="stat reveal">
    <div class="stat-value" data-count="${s.value}" data-decimals="${s.decimals || 0}">0</div>
    <span class="stat-suffix">${esc(s.suffix)}</span>
    <p>${esc(s.label)}</p>
  </div>`).join("");

function countUp(el) {
  const target = +el.dataset.count, dec = +el.dataset.decimals;
  if (reduceMotion) return (el.textContent = target.toFixed(dec));
  const start = performance.now(), dur = 1400;
  const tick = (t) => {
    const p = Math.min((t - start) / dur, 1);
    el.textContent = (target * (1 - Math.pow(1 - p, 3))).toFixed(dec);
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/* ---------- Стек ---------- */
const stackHtml = SITE.stack.map((t) => `<span>${esc(t)}</span><i>✦</i>`).join("");
$("#stack").innerHTML = stackHtml + stackHtml;

/* ---------- Работы ---------- */
function placeholder(p) {
  if (p.image) return `<img src="${esc(p.image)}" alt="${esc(p.title)}" loading="lazy">`;
  if (p.category === "bot") {
    return `<div class="ph ph-bot">
      <div class="b b1"></div><div class="b b2 me"></div><div class="b b3"></div>
      <div class="kb"><i></i><i></i></div></div>`;
  }
  return `<div class="ph ph-site">
    <div class="bar"><i></i><i></i><i></i></div>
    <div class="hero-blk"></div>
    <div class="row"><i></i><i></i><i></i></div></div>`;
}

function renderWorks(filter = "all") {
  const list = SITE.projects.map((p, i) => ({ ...p, i }))
    .filter((p) => filter === "all" || p.category === filter);
  if (!list.length) {
    $("#worksGrid").innerHTML = `<p class="empty">Здесь скоро появятся Telegram-боты. А пока можно <a href="${tgUrl}" target="_blank" rel="noopener">обсудить вашего бота</a>.</p>`;
    return;
  }
  $("#worksGrid").innerHTML = list.map((p) => `
    <article class="work reveal" style="--c:${p.color}" data-i="${p.i}" tabindex="0">
      <div class="work-media">${placeholder(p)}</div>
      <div class="work-body">
        <span class="tag">${p.category === "bot" ? "Telegram-бот" : "Сайт"}</span>
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.short)}</p>
        <span class="more">Подробнее →</span>
      </div>
    </article>`).join("");
  observeReveal();
  bindTilt();
}

$$(".filter").forEach((b) => b.addEventListener("click", () => {
  $$(".filter").forEach((x) => x.classList.toggle("active", x === b));
  renderWorks(b.dataset.filter);
}));

$("#worksGrid").addEventListener("click", (e) => {
  const card = e.target.closest(".work");
  if (card) openModal(SITE.projects[card.dataset.i]);
});
$("#worksGrid").addEventListener("keydown", (e) => {
  const card = e.target.closest(".work");
  if (card && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); openModal(SITE.projects[card.dataset.i]); }
});

/* ---------- Модалка ---------- */
const modal = $("#modal");
function openModal(p) {
  $("#modalContent").innerHTML = `
    <div class="modal-media" style="--c:${p.color}">${placeholder(p)}</div>
    <span class="tag" style="--c:${p.color}">${p.category === "bot" ? "Telegram-бот" : "Сайт"}</span>
    <h3>${esc(p.title)}</h3>
    <div class="case">
      <div><b>Задача</b><p>${esc(p.task)}</p></div>
      <div><b>Решение</b><p>${esc(p.solution)}</p></div>
      <div class="result"><b>Результат</b><p>${esc(p.result)}</p></div>
    </div>
    <div class="chips">${p.stack.map((s) => `<span>${esc(s)}</span>`).join("")}</div>
    <div class="modal-actions">
      ${p.link ? `<a class="btn btn-ghost" href="${esc(p.link)}" target="_blank" rel="noopener">Открыть проект ↗</a>` : ""}
      <a class="btn" href="${tgUrl}" target="_blank" rel="noopener">Хочу так же</a>
    </div>`;
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  $(".modal-close").focus();
}
function closeModal() {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}
modal.addEventListener("click", (e) => { if (e.target === modal || e.target.closest(".modal-close")) closeModal(); });
addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

/* ---------- Услуги, этапы, отзывы ---------- */
$("#servicesGrid").innerHTML = SITE.services.map((s) => `
  <div class="service reveal">
    <div class="service-icon">${s.icon}</div>
    <h3>${esc(s.title)}</h3>
    <p>${esc(s.text)}</p>
    <div class="service-foot"><b>${esc(s.price)}</b><span>${esc(s.time)}</span></div>
  </div>`).join("");

$("#steps").innerHTML = SITE.steps.map((s, i) => `
  <li class="step reveal">
    <span class="step-num">0${i + 1}</span>
    <h3>${esc(s.title)}</h3>
    <p>${esc(s.text)}</p>
  </li>`).join("");

$("#reviewsGrid").innerHTML = SITE.reviews.map((r) => `
  <figure class="review reveal">
    <div class="stars">${"★".repeat(r.rating)}</div>
    <blockquote>«${esc(r.text)}»</blockquote>
    <figcaption><span class="ava">${esc(r.name[0])}</span><b>${esc(r.name)}</b><small>${esc(r.role)}</small></figcaption>
  </figure>`).join("");

/* ---------- Чат на первом экране ---------- */
const chat = $("#heroChat");
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
function addMsg(m) {
  const el = document.createElement("div");
  el.className = `msg ${m.from}`;
  el.innerHTML = esc(m.text).replace(/\n/g, "<br>") +
    (m.buttons ? `<div class="msg-btns">${m.buttons.map((b) => `<span>${esc(b)}</span>`).join("")}</div>` : "");
  chat.appendChild(el);
  chat.scrollTop = chat.scrollHeight;
}
async function playChat() {
  if (reduceMotion) return SITE.heroChat.forEach(addMsg);
  while (true) {
    chat.innerHTML = "";
    for (const m of SITE.heroChat) {
      if (m.from === "bot") {
        const t = document.createElement("div");
        t.className = "msg bot typing";
        t.innerHTML = "<i></i><i></i><i></i>";
        chat.appendChild(t);
        await wait(900);
        t.remove();
      } else await wait(700);
      addMsg(m);
    }
    await wait(4000);
  }
}
playChat();

/* ---------- Появление при прокрутке ---------- */
const io = new IntersectionObserver((entries) => entries.forEach((e) => {
  if (!e.isIntersecting) return;
  e.target.classList.add("in");
  $$("[data-count]", e.target).forEach(countUp);
  io.unobserve(e.target);
}), { threshold: 0.15 });
function observeReveal() { $$(".reveal:not(.in)").forEach((el) => io.observe(el)); }
observeReveal();

/* ---------- Курсор, магнитные кнопки, наклон карточек ---------- */
const fine = matchMedia("(pointer: fine)").matches && !reduceMotion;
if (fine) {
  const cur = $(".cursor");
  document.body.classList.add("has-cursor");
  addEventListener("mousemove", (e) => {
    cur.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    cur.classList.toggle("hover", !!e.target.closest("a, button, .work"));
  });
  $$(".magnetic").forEach((b) => {
    b.addEventListener("mousemove", (e) => {
      const r = b.getBoundingClientRect();
      b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.25}px, ${(e.clientY - r.top - r.height / 2) * 0.35}px)`;
    });
    b.addEventListener("mouseleave", () => (b.style.transform = ""));
  });
}
function bindTilt() {
  if (!fine) return;
  $$(".work").forEach((c) => {
    c.addEventListener("mousemove", (e) => {
      const r = c.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      c.style.transform = `perspective(800px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-6px)`;
      c.style.setProperty("--mx", `${(x + 0.5) * 100}%`);
      c.style.setProperty("--my", `${(y + 0.5) * 100}%`);
    });
    c.addEventListener("mouseleave", () => (c.style.transform = ""));
  });
}

renderWorks();

/* ---------- Шапка при прокрутке ---------- */
addEventListener("scroll", () => $(".nav").classList.toggle("scrolled", scrollY > 20), { passive: true });
