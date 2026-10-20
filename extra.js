/* Интерактив: демо-бот записи, калькулятор, живой просмотр, индикатор прокрутки */
(() => {
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const tg = `https://t.me/${SITE.telegram}`;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------- Индикатор прокрутки ---------- */
const bar = $("#progress");
addEventListener("scroll", () => {
  const h = document.documentElement;
  bar.style.transform = `scaleX(${h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight)})`;
}, { passive: true });

/* ---------- Живой просмотр в модалке ---------- */
$("#modalContent").addEventListener("click", (e) => {
  const live = e.target.closest(".live");
  if (!live) return;
  if (e.target.closest(".live-go")) {
    const fr = $(".live-frame", live), ifr = $("iframe", fr);
    if (!ifr.src) ifr.src = live.dataset.link;
    fr.hidden = false;
    $(".live-sw", live).hidden = false;
    e.target.closest(".live-go").hidden = true;
  }
  const w = e.target.closest("[data-w]");
  if (w) {
    $$("[data-w]", live).forEach((b) => b.classList.toggle("on", b === w));
    $("iframe", live).style.width = w.dataset.w;
  }
});

/* ---------- Демо-бот записи ---------- */
const CLASSES = [
  { id: "hatha", name: "Хатха-йога", slots: [{ t: "Пн 19:00", left: 3 }, { t: "Ср 19:00", left: 2 }] },
  { id: "stretch", name: "Растяжка", slots: [{ t: "Вт 20:00", left: 1 }, { t: "Чт 20:00", left: 4 }] },
  { id: "pilates", name: "Пилатес", slots: [{ t: "Сб 11:00", left: 2 }] },
];
let state, bookings, day;
const chat = $("#demoChat"), form = $("#demoForm"), nameIn = $("#demoName");
const fresh = () => JSON.parse(JSON.stringify(CLASSES));
function scroll() { chat.scrollTop = chat.scrollHeight; }
async function bot(text, buttons) {
  const t = document.createElement("div");
  t.className = "msg bot typing"; t.innerHTML = "<i></i><i></i><i></i>";
  chat.appendChild(t); scroll(); await wait(500); t.remove();
  const el = document.createElement("div");
  el.className = "msg bot";
  el.innerHTML = esc(text).replace(/\n/g, "<br>");
  if (buttons) {
    const box = document.createElement("div"); box.className = "msg-btns live-btns";
    buttons.forEach((b) => {
      const x = document.createElement("button");
      x.textContent = b.label; if (b.disabled) x.disabled = true;
      x.onclick = () => { $$(".live-btns button", chat).forEach((q) => (q.disabled = true)); b.run(); };
      box.appendChild(x);
    });
    el.appendChild(box);
  }
  chat.appendChild(el); scroll();
}
function me(text) {
  const el = document.createElement("div");
  el.className = "msg user"; el.textContent = text;
  chat.appendChild(el); scroll();
}
function renderAdmin() {
  $("#demoSeats").innerHTML = state.classes.map((c) => c.slots.map((s) =>
    `<div class="seat ${s.left ? "" : "full"}"><span>${esc(c.name)} · ${esc(s.t)}</span><b>${s.left ? `мест: ${s.left}` : "мест нет"}</b></div>`).join("")).join("");
  $("#demoList").innerHTML = bookings.length
    ? bookings.map((b) => `<li><b>${esc(b.name)}</b> ${esc(b.cls)}, ${esc(b.t)}${b.reminded ? ' <em>напоминание отправлено</em>' : ""}</li>`).join("")
    : '<li class="empty-li">Пока нет записей. Запишитесь в боте слева.</li>';
}
function start() {
  chat.innerHTML = ""; form.hidden = true;
  state = { classes: fresh(), pick: null }; bookings = [];
  renderAdmin(); menu(true);
}
function menu(first) {
  bot(first ? "Здравствуйте! Я бот студии «Лотос». Помогу записаться на занятие. Что выберете?" : "Что ещё выберете?",
    state.classes.map((c) => ({ label: c.name, run: () => { me(c.name); slots(c); } })));
}
function slots(c) {
  const free = c.slots.filter((s) => s.left > 0);
  if (!free.length) return bot("На это занятие мест нет. Могу записать в лист ожидания или предложить другое.", [{ label: "Выбрать другое", run: () => { me("Выбрать другое"); menu(); } }]);
  bot(`${c.name}. Выберите время:`, c.slots.map((s) => ({
    label: `${s.t}${s.left ? ` (мест: ${s.left})` : " (мест нет)"}`, disabled: !s.left,
    run: () => { me(s.t); state.pick = { c, s }; ask(); },
  })));
}
async function ask() {
  await bot("Как вас зовут?");
  form.hidden = false; nameIn.value = ""; nameIn.focus();
}
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = nameIn.value.trim(); if (!name || !state.pick) return;
  form.hidden = true; me(name);
  const { c, s } = state.pick; state.pick = null;
  if (s.left <= 0) { await bot("Только что последнее место занял другой человек. Выберите другое время."); return slots(c); }
  s.left -= 1;
  const b = { name, cls: c.name, t: s.t };
  bookings.push(b); renderAdmin();
  await bot(`Готово, ${name}! Записал вас: ${c.name}, ${s.t}.\\nНапомню за сутки. Администратор уже получил заявку.`, [
    { label: "Записаться ещё", run: () => { me("Записаться ещё"); menu(); } },
    { label: "Отменить запись", run: async () => {
        me("Отменить запись"); s.left += 1; bookings.splice(bookings.indexOf(b), 1); renderAdmin();
        await bot("Запись отменена, место освободилось для других."); menu();
    } },
  ]);
});
$("#demoRemind").onclick = async () => {
  const todo = bookings.filter((b) => !b.reminded);
  if (!todo.length) return;
  todo.forEach((b) => (b.reminded = true)); renderAdmin();
  const b = todo[todo.length - 1];
  await bot(`Напоминание, ${b.name}: завтра ${b.cls}, ${b.t}. Придёте? Если планы изменились, нажмите «Перенести».`, [
    { label: "Приду", run: () => { me("Приду"); bot("Отлично, ждём вас!"); } },
    { label: "Перенести", run: () => { me("Перенести"); bot("Запись передана администратору, он предложит другое время."); } },
  ]);
};
$("#demoReset").onclick = start;
start();

/* ---------- Калькулятор ---------- */
const C = SITE.calc; let type = C.types[0].id;
const fmt = (n) => (Math.round(n / 100) * 100).toLocaleString("ru-RU") + " ₽";
$("#calcTypes").innerHTML = C.types.map((t) => `<button class="ct${t.id === type ? " on" : ""}" data-id="${t.id}"><b>${esc(t.title)}</b><small>${esc(t.hint)}</small></button>`).join("");
$("#calcOpts").innerHTML = C.options.map((o) => `<label class="opt"><input type="checkbox" value="${o.id}"><span>${esc(o.title)}</span></label>`).join("");
function calc() {
  const t = C.types.find((x) => x.id === type);
  let price = t.price, days = t.days;
  const picked = [];
  $$("#calcOpts input:checked").forEach((i) => { const o = C.options.find((x) => x.id === i.value); price += o.price; days += o.days; picked.push(o.title); });
  const rush = $("#calcRush").checked;
  if (rush) { price *= C.rushFactor; days = Math.max(1, Math.ceil(days / 2)); }
  $("#calcPrice").textContent = `от ${fmt(price)} до ${fmt(price * 1.25)}`;
  $("#calcDays").textContent = `Срок: ${days} ${days % 10 === 1 && days % 100 !== 11 ? "день" : [2, 3, 4].includes(days % 10) && ![12, 13, 14].includes(days % 100) ? "дня" : "дней"}${rush ? " (срочно)" : ""}`;
  const msg = `Здравствуйте! Хочу обсудить: ${t.title}${picked.length ? ", " + picked.join(", ").toLowerCase() : ""}. Калькулятор показал ${$("#calcPrice").textContent}.`;
  $("#calcSend").href = `${tg}?text=${encodeURIComponent(msg)}`;
}
$("#calcTypes").addEventListener("click", (e) => {
  const b = e.target.closest(".ct"); if (!b) return;
  type = b.dataset.id; $$(".ct").forEach((x) => x.classList.toggle("on", x === b)); calc();
});
$("#calcOpts").addEventListener("change", calc); $("#calcRush").addEventListener("change", calc);
calc();
})();
