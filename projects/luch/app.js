"use strict";

const byId = (id) => document.getElementById(id);

const caseText = {
  living: "Общее заполнение дополняют торшер и подсветка стены. Вечером можно оставить только локальные источники.",
  work: "Сочетаем направленное освещение стола и мягкое заполнение, чтобы рабочая зона выделялась в комнате.",
  cafe: "Подвесы выделяют посадочные места, а подсветка помогает собрать пространство вокруг стойки.",
};

const serviceText = {
  room: "Разберём привычки, зоны и задачи. Подготовим набор световых сценариев для конкретной комнаты.",
  apartment: "Свяжем освещение разных помещений в единую систему повседневных сценариев.",
  commercial: "Подберём световые акценты для кафе, небольшого офиса или другого пространства для людей.",
};

function button(label, className) {
  const control = document.createElement("button");
  control.type = "button";
  control.className = className;
  control.textContent = label;
  return control;
}

function setupMenu() {
  const menu = document.querySelector(".menu-toggle");
  const nav = byId("navigation");
  const mobile = window.matchMedia("(max-width: 41rem)");

  function close(restoreFocus = false) {
    menu.setAttribute("aria-expanded", "false");
    if (restoreFocus) menu.focus();
  }

  menu.addEventListener("click", () => {
    const expanded = menu.getAttribute("aria-expanded") === "true";
    menu.setAttribute("aria-expanded", String(!expanded));
  });

  nav.addEventListener("click", (event) => {
    const link = event.target.closest("a");
    if (!link || !mobile.matches) return;
    close();
    const section = document.querySelector(link.hash);
    section.tabIndex = -1;
    section.focus({ preventScroll: true });
  });

  menu.parentElement.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menu.getAttribute("aria-expanded") === "true") {
      event.preventDefault();
      close(true);
    }
  });

  mobile.addEventListener("change", () => close(mobile.matches && nav.contains(document.activeElement)));
  menu.parentElement.classList.add("menu-ready");
  menu.hidden = false;
}

function coordinates(element, x, y) {
  element.style.setProperty("--x", x * 100 + "%");
  element.style.setProperty("--y", y * 100 + "%");
}

function lightRenderer(photo, zones, room, temperatures, showMarkers = false) {
  photo.dataset.light = room;
  const overlay = document.createElement("div");
  overlay.className = "light-overlay";
  overlay.setAttribute("aria-hidden", "true");
  photo.append(overlay);

  const groups = Object.entries(zones).map(([id, zone]) => {
    const light = document.createElement("div");
    light.className = "glow-group";
    light.dataset.zone = id;

    const pool = document.createElement("span");
    pool.className = "pool";
    const [centerX, centerY] = zone.glow_center;
    const [radiusX, radiusY] = zone.glow_size;
    pool.style.setProperty("--cx", centerX * 100 + "%");
    pool.style.setProperty("--cy", centerY * 100 + "%");
    pool.style.setProperty("--rx", radiusX * 63 + "%");
    pool.style.setProperty("--ry", radiusY * 80 + "%");
    light.append(pool);

    const accent = {
      "living:floor": "area-floor-shade",
      "living:wall": "area-wall-line",
      "cafe:counter": "area-counter-line",
    }[room + ":" + id];
    if (accent) {
      const source = document.createElement("span");
      source.className = accent;
      light.append(source);
    } else {
      for (const [x, y] of zone.hotspots) {
        const source = document.createElement("span");
        source.className = "light-source";
        coordinates(source, x, y);
        light.append(source);
      }
    }

    overlay.append(light);
    let marker;
    if (showMarkers) {
      marker = document.createElement("span");
      marker.className = "zone-marker";
      const [x, y] = zone.hotspots.at(id === "ceiling" ? -1 : 0);
      coordinates(marker, x + .024, y + (id === "wall" ? .042 : -.034));
      overlay.append(marker);
    }
    return { id, light, marker };
  });

  return (state) => {
    photo.style.setProperty("--tint", temperatures[state.temperature].tint);
    for (const { id, light, marker } of groups) {
      const power = state.brightness / 100 * state.groups[id];
      light.style.setProperty("--power", power);
      marker?.classList.toggle("is-on", power > 0);
    }
  };
}

function setupLight(hero, temperatures, onUpdate) {
  const defaultPreset = hero.presets.find((preset) => preset.id === hero.defaultPreset);
  let active;
  let state;

  const render = lightRenderer(byId("hero-photo"), hero.zones, "living", temperatures, true);
  const brightness = byId("brightness");
  const brightnessValue = byId("brightness-value");
  const presetGroup = byId("presets");
  const switchGroup = byId("switches");
  const lightPanel = byId("light-controls").closest(".light-panel");
  const singleColumn = window.matchMedia("(max-width: 53rem)");
  const presets = new Map();
  const switches = new Map();
  const tones = new Map();

  for (const preset of hero.presets) {
    const control = button(preset.label, "preset");
    presets.set(preset.id, control);
    presetGroup.append(control);
    control.addEventListener("click", () => selectPreset(preset));
  }

  for (const [id, zone] of Object.entries(hero.zones)) {
    const control = button(zone.label, "switch");
    control.setAttribute("role", "switch");
    const track = document.createElement("span");
    track.className = "switch-track";
    track.setAttribute("aria-hidden", "true");
    control.append(track);
    switches.set(id, control);
    switchGroup.append(control);
    control.addEventListener("click", () => {
      state.groups[id] = state.groups[id] > 0 ? 0 : 1;
      manualUpdate();
    });
  }

  for (const [id, temperature] of Object.entries(temperatures)) {
    const label = document.createElement("label");
    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "temperature";
    radio.value = id;
    const dot = document.createElement("span");
    dot.className = "temperature-dot";
    dot.style.setProperty("--tone", temperature.tint);
    dot.setAttribute("aria-hidden", "true");
    label.append(radio, dot, temperature.label);
    byId("temperatures").append(label);
    tones.set(id, radio);
    radio.addEventListener("change", () => {
      state.temperature = id;
      manualUpdate();
    });
  }

  function update() {
    const name = active?.label || "Свой свет";
    byId("scene-name").textContent = name;
    byId("scene-description").textContent = active?.description || "Индивидуальная настройка гостиной.";
    brightness.value = state.brightness;
    const percent = state.brightness + "%";
    brightnessValue.textContent = percent;
    brightness.setAttribute("aria-valuetext", percent);

    for (const [id, control] of presets) control.setAttribute("aria-pressed", String(active?.id === id));
    for (const [id, control] of switches) control.setAttribute("aria-checked", String(state.groups[id] > 0));
    tones.get(state.temperature).checked = true;
    render(state);

    const groups = Object.entries(hero.zones).filter(([id]) => state.groups[id] > 0).map(([, zone]) => zone.label.toLowerCase());
    const sources = groups.length ? groups.join(", ") : "все источники выключены";
    onUpdate(name + " · " + percent + " · " + temperatures[state.temperature].label.toLowerCase() + " оттенок · " + sources);
  }

  function manualUpdate() {
    active = null;
    update();
  }

  function selectPreset(preset) {
    active = preset;
    state = { ...preset.state, groups: { ...preset.state.groups } };
    update();
  }

  brightness.addEventListener("input", () => {
    state.brightness = Number(brightness.value);
    manualUpdate();
  });
  byId("reset").addEventListener("click", () => selectPreset(defaultPreset));
  selectPreset(defaultPreset);
  function placePresets() {
    const focusedPreset = presetGroup.contains(document.activeElement) ? document.activeElement : null;
    const next = singleColumn.matches ? lightPanel : switchGroup;
    next.before(presetGroup);
    focusedPreset?.focus({ preventScroll: true });
  }
  placePresets();
  singleColumn.addEventListener("change", placePresets);
  byId("light-fallback").hidden = true;
  byId("light-controls").hidden = false;
}

function comparisonFor(example, temperatures) {
  const frame = document.createElement("div");
  frame.className = "comparison";

  for (const state of ["before", "after"]) {
    const photo = document.createElement("div");
    photo.className = "photo " + state + "-photo";
    const img = document.createElement("img");
    img.src = "./assets/" + example.image.split("/").pop().replace(/\.png$/, ".jpg");
    img.width = example.width;
    img.height = example.height;
    img.loading = "lazy";
    img.decoding = "async";
    img.alt = state === "before" ? example.room + " в двух вариантах освещения" : "";
    photo.append(img);
    frame.append(photo);
    if (state === "after") photo.setAttribute("aria-hidden", "true");
    lightRenderer(photo, example.zones, example.id, temperatures)(example[state]);

    const tag = document.createElement("span");
    tag.className = "case-tag " + state;
    tag.textContent = state === "before" ? "До" : "После";
    tag.setAttribute("aria-hidden", "true");
    frame.append(tag);
  }

  for (const className of ["compare-bar", "compare-knob"]) {
    const mark = document.createElement("span");
    mark.className = className;
    mark.setAttribute("aria-hidden", "true");
    frame.append(mark);
  }

  const range = document.createElement("input");
  range.type = "range";
  range.min = 0;
  range.max = 100;
  range.value = 50;
  range.className = "compare-range";
  range.setAttribute("aria-label", example.room + " — сравнение до и после");
  frame.append(range);

  function update() {
    const value = range.valueAsNumber;
    const valueText = { 0: "Полностью до", 100: "Полностью после" };
    frame.style.setProperty("--split", value + "%");
    range.setAttribute("aria-valuetext", valueText[value] || "После " + value + "%, до " + (100 - value) + "%");
    if (value === 0) frame.dataset.end = "before";
    else if (value === 100) frame.dataset.end = "after";
    else delete frame.dataset.end;
  }

  function setPosition(clientX) {
    const { left, width } = frame.getBoundingClientRect();
    range.value = Math.round((clientX - left) / width * 100);
    update();
  }

  range.addEventListener("input", update);
  range.addEventListener("pointerdown", (event) => {
    if (!event.isPrimary || event.button !== 0) return;
    event.preventDefault();
    range.focus({ preventScroll: true });
    range.setPointerCapture(event.pointerId);
    if (event.pointerType !== "touch") setPosition(event.clientX);
  });
  range.addEventListener("pointermove", (event) => {
    if (range.hasPointerCapture(event.pointerId)) setPosition(event.clientX);
  });
  range.addEventListener("pointerup", (event) => {
    if (range.hasPointerCapture(event.pointerId)) setPosition(event.clientX);
  });
  update();
  return frame;
}

function setupCases(cases, temperatures) {
  const list = byId("case-tabs");
  const panels = byId("case-panels");
  const entries = cases.map((example) => {
    const tab = button(example.room, "case-tab");
    tab.id = "tab-" + example.id;
    tab.setAttribute("role", "tab");
    const panel = document.createElement("div");
    panel.id = "case-" + example.id;
    panel.className = "case-panel";
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-labelledby", tab.id);
    tab.setAttribute("aria-controls", panel.id);

    const description = document.createElement("div");
    description.className = "case-description";
    const title = document.createElement("h3");
    title.textContent = example.title;
    const detail = document.createElement("p");
    detail.textContent = caseText[example.id];
    description.append(title, detail);
    panel.append(comparisonFor(example, temperatures), description);
    list.append(tab);
    panels.append(panel);
    return { tab, panel };
  });

  function show(index, focus = false) {
    entries.forEach(({ tab, panel }, current) => {
      const selected = current === index;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      panel.hidden = !selected;
    });
    if (focus) entries[index].tab.focus();
  }

  entries.forEach(({ tab }, index) => {
    tab.addEventListener("click", () => show(index));
    tab.addEventListener("keydown", (event) => {
      const positions = {
        ArrowRight: (index + 1) % entries.length,
        ArrowLeft: (index + entries.length - 1) % entries.length,
        Home: 0,
        End: entries.length - 1,
      };
      if (!Object.hasOwn(positions, event.key)) return;
      event.preventDefault();
      show(positions[event.key], true);
    });
  });
  show(0);
  list.hidden = false;
}

function setupContact(services) {
  const options = byId("service-options");
  const select = byId("contact-service");
  const premises = byId("premises");
  const wishes = byId("wishes");
  const draft = byId("draft");
  const copy = byId("copy");
  const copyStatus = byId("copy-status");
  let lightPreference = "";
  let serviceId = services.find(({ id }) => id === select.value)?.id || services[0].id;

  const optionButtons = new Map(services.map((service) => {
    const control = button(service.label, "service-option");
    options.append(control);
    control.addEventListener("click", () => chooseService(service.id));
    return [service.id, control];
  }));

  function updateDraft() {
    const service = services.find(({ id }) => id === serviceId);
    const parts = [
      "Здравствуйте! Хочу обсудить интерьерное освещение.",
      "Услуга: " + service.label + ".",
    ];
    if (premises.value.trim()) parts.push("Помещение: " + premises.value.trim());
    if (wishes.value.trim()) parts.push("Пожелания к свету: " + wishes.value.trim());
    if (lightPreference) parts.push("Пример предпочтения по свету: " + lightPreference + ".");
    draft.value = parts.join("\n");
    draft.rows = Math.min(8, Math.max(5, parts.length + 1));
    copyStatus.textContent = "";
  }

  function chooseService(id) {
    serviceId = id;
    select.value = id;
    byId("service-title").textContent = services.find((service) => service.id === id).label;
    byId("service-description").textContent = serviceText[id];
    for (const [key, control] of optionButtons) control.setAttribute("aria-pressed", String(key === id));
    updateDraft();
  }

  select.addEventListener("change", () => chooseService(select.value));
  premises.addEventListener("input", updateDraft);
  wishes.addEventListener("input", updateDraft);
  copy.addEventListener("click", async () => {
    const text = draft.value;
    try {
      await navigator.clipboard.writeText(text);
      if (draft.value === text) copyStatus.textContent = "Обращение скопировано. Его можно отправить выбранному специалисту.";
    } catch {
      copyStatus.textContent = "Скопируйте текст из поля ниже.";
      draft.focus();
      draft.select();
    }
  });

  chooseService(serviceId);
  options.hidden = false;
  copy.hidden = false;
  return (preference) => {
    lightPreference = preference;
    updateDraft();
  };
}

async function loadScenes() {
  if (window.location.protocol === "file:") {
    return JSON.parse(byId("local-scenes").textContent);
  }

  const response = await fetch("./assets/scenes.json");
  if (!response.ok) throw new Error("HTTP " + response.status);
  return response.json();
}

async function init() {
  setupMenu();

  try {
    const { hero, temperatures, cases, services } = await loadScenes();
    const updatePreference = setupContact(services);
    setupLight(hero, temperatures, updatePreference);
    setupCases(cases, temperatures);
  } catch (error) {
    byId("light-fallback").textContent = "Световые настройки не загрузились. Обновите страницу.";
    console.error("Не удалось загрузить настройки ЛУЧ:", error);
  }
}

init();
