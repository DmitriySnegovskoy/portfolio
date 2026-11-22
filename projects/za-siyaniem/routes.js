(() => {
  const stops = {
    city: {
      name: 'Мурманск', point: [102, 275], photo: 'tundra.jpg',
      alt: 'Зимняя дорога в тундру',
      description: 'В Мурманске встречаемся перед выездом. Сюда же возвращаемся после последней ночёвки. На иллюстрации — дорога из города к плато.'
    },
    tundra: {
      name: 'Тундровое плато', point: [231, 182], photo: 'tundra.jpg',
      alt: 'Снежная дорога в сумерках',
      description: 'Открытый горизонт вдали от городских огней. Отсюда наблюдаем за небом в первый вечер короткого маршрута.'
    },
    house: {
      name: 'Дом в тундре', point: [231, 182], photo: 'tundra.jpg',
      alt: 'Заснеженное тундровое плато',
      description: 'Первая база расширенной экспедиции. После ночёвки здесь едем через Териберку к побережью.'
    },
    village: {
      name: 'Териберка', point: [405, 155], photo: 'cabin.jpg',
      alt: 'Дом с освещёнными окнами у моря',
      description: 'Посёлок на Баренцевом море. Здесь ночует группа маршрута на две ночи, а участники длинного маршрута делают остановку по пути в лагерь.'
    },
    bay: {
      name: 'Каменистая бухта', point: [524, 107], photo: 'coast.jpg',
      alt: 'Морской прибой у каменистого берега',
      description: 'Дневная прогулка второго дня маршрута на две ночи. Со скал открывается вид на бухту и прибой.'
    },
    camp: {
      name: 'Прибрежный лагерь', point: [467, 231], photo: 'hero.jpg',
      alt: 'Тёмное заснеженное побережье',
      description: 'База на вторую и третью ночь длинного маршрута. Отсюда начинается прогулка к дальнему мысу.'
    },
    cape: {
      name: 'Дальний мыс', point: [561, 100], photo: 'coast.jpg',
      alt: 'Высокий заснеженный мыс над морем',
      description: 'Главная остановка расширенной экспедиции. На третий день идём вдоль берега к мысу, если позволяет погода.'
    }
  };

  const routes = [
    {
      id: 1, duration: '1 ночь', title: 'Первая ночь в тундре', format: 'Короткий выезд',
      stay: 'Гостевой дом у плато', walk: 'до 1 км у плато',
      description: 'Выезд из Мурманска к открытому горизонту. Вечером смотрим на небо над плато, утром возвращаемся в город.',
      main: 'tundra', stops: ['city', 'tundra'],
      days: [
        ['Из города в тундру', 'Вечерний выезд из Мурманска на тундровое плато. Прогулка до 1 км, наблюдение за небом и ночёвка в гостевом доме у плато.'],
        ['Обратно в Мурманск', 'Завтрак и возвращение в город к полудню.']
      ]
    },
    {
      id: 2, duration: '2 ночи', title: 'Две ночи у моря', format: 'Поездка на побережье',
      stay: 'Дом у моря в Териберке', walk: 'до 3 км к бухте и обратно',
      description: 'Две ночёвки в прибрежном посёлке. Днём идём к бухте и чёрным скалам, вечером наблюдаем за небом над морем.',
      main: 'bay', cover: 'village', stops: ['city', 'village', 'bay'],
      days: [
        ['По дороге к морю', 'Переезд из Мурманска в Териберку. Размещаемся в доме у моря на две ночи и вечером наблюдаем за небом.'],
        ['Скалы и прибой', 'Дневная прогулка к каменистой бухте и обратно, до 3 км. Вторая ночь в том же доме в Териберке.'],
        ['Утро на побережье', 'Завтрак с видом на бухту и возвращение в Мурманск.']
      ]
    },
    {
      id: 3, duration: '3 ночи', title: 'Дальнее побережье', format: 'Расширенная экспедиция',
      stay: 'Дом в тундре и лагерь у моря', walk: 'до 6 км к мысу и обратно',
      description: 'Переезжаем с тундрового плато в прибрежный лагерь. Три вечера оставляем для наблюдений, один день — для выхода к мысу.',
      main: 'cape', stops: ['city', 'house', 'village', 'camp', 'cape'],
      days: [
        ['Ночь на плато', 'Из Мурманска едем в дом в тундре. Вечером смотрим на небо над плато и ночуем в доме.'],
        ['Через Териберку к берегу', 'Останавливаемся в Териберке по дороге в прибрежный лагерь. Здесь проведём вторую и третью ночи.'],
        ['День на дальнем мысе', 'Если позволяет погода, идём к дальнему мысу и обратно, до 6 км. Третья ночь — в лагере у моря.'],
        ['Возвращение', 'Собираем лагерь и возвращаемся в Мурманск через Териберку.']
      ]
    }
  ];

  const kit = [
    'Термобельё, тёплая куртка, шапка и запасные варежки',
    'Зимние ботинки с цепкой подошвой и сухие носки',
    'Налобный фонарь и запасные батарейки',
    'Термос и внешний аккумулятор'
  ];

  const byId = id => document.getElementById(id);
  const section = document.querySelector('.route-section');
  const copy = byId('copy-plan');
  const download = byId('download-plan');
  const feedback = byId('copy-status');
  const fallback = byId('copy-fallback');
  const textField = byId('plan-text');
  let selectedRoute;
  let stopControls = [];
  let downloadUrl;

  function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    if (className) node.className = className;
    return node;
  }

  function setPhoto(id, stop) {
    const photo = byId(id);
    photo.src = 'assets/' + stop.photo;
    photo.alt = stop.alt;
  }

  function selectStop(index, source) {
    const stop = stops[selectedRoute.stops[index]];
    setPhoto('stop-photo', stop);
    byId('stop-counter').textContent = 'Остановка ' + (index + 1) + ' из ' + selectedRoute.stops.length;
    byId('stop-name').textContent = stop.name;
    byId('stop-description').textContent = stop.description;
    for (const [i, controls] of stopControls.entries()) {
      for (const button of controls) button.setAttribute('aria-pressed', String(i === index));
    }
    if (source === 'map') {
      const strip = byId('stop-strip');
      const card = stopControls[index][1];
      if (strip.clientWidth && card.offsetLeft + card.offsetWidth > strip.scrollLeft + strip.clientWidth) {
        strip.scrollLeft = card.offsetLeft - 4;
      } else if (card.offsetLeft < strip.scrollLeft) {
        strip.scrollLeft = card.offsetLeft - 4;
      }
    }
  }

  function renderMap(route) {
    const nodes = byId('map-nodes');
    const strip = byId('stop-strip');
    const mapStops = route.stops.map(key => stops[key]);
    const points = mapStops.map(stop => stop.point.join(','));
    byId('map-line').setAttribute('points', points.join(' '));
    nodes.replaceChildren();
    strip.replaceChildren();
    stopControls = mapStops.map((stop, index) => {
      const [x, y] = stop.point;
      const marker = element('button', '', 'map-marker');
      marker.type = 'button';
      marker.style.left = (x / 640 * 100) + '%';
      marker.style.top = (y / 380 * 100) + '%';
      marker.dataset.edge = x > 450 ? 'left' : 'right';
      marker.setAttribute('aria-label', stop.name);
      marker.append(element('span', String(index + 1), 'marker-dot'), element('span', stop.name, 'marker-name'));
      marker.addEventListener('click', () => selectStop(index, 'map'));
      nodes.append(marker);

      const card = element('button', '', 'stop-card');
      card.type = 'button';
      card.append(element('span', String(index + 1)), element('strong', stop.name));
      card.addEventListener('click', () => selectStop(index, 'card'));
      strip.append(card);
      return [marker, card];
    });
    strip.scrollLeft = 0;
    selectStop(0);
  }

  function planText(route) {
    const itinerary = [...route.stops, 'city'].map(key => stops[key].name).join(' → ');
    return [
      'За сиянием · Демонстрационный маршрут',
      route.title + ' — ' + route.duration,
      'Формат: ' + route.format,
      'Ночуем: ' + route.stay,
      'Пешком: ' + route.walk,
      'Остановки: ' + itinerary,
      '',
      ...route.days.map(([title, details], index) => 'День ' + (index + 1) + '. ' + title + '\n' + details),
      ''
    ].join('\n');
  }

  function renderRoute(route) {
    selectedRoute = route;
    section.dataset.route = route.id;
    byId('route-meta').textContent = route.duration + ' / ' + route.days.length + ' дня';
    byId('route-name').textContent = route.title;
    byId('route-description').textContent = route.description;
    const cover = stops[route.cover || route.main];
    setPhoto('route-photo', cover);
    byId('photo-caption').textContent = cover.name + ' · Иллюстрация';
    byId('route-stops').replaceChildren(...[...route.stops, 'city'].map(key => element('li', stops[key].name)));
    byId('program-days').replaceChildren(...route.days.map(([title, detail], index) => {
      const item = document.createElement('li');
      item.append(element('span', 'День ' + (index + 1)), element('h4', title), element('p', detail));
      return item;
    }));
    byId('plan-title').textContent = route.duration + ' · ' + route.title;
    renderMap(route);

    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    const packing = ['Что взять с собой', ...kit.map(item => '• ' + item), ''].join('\n');
    downloadUrl = URL.createObjectURL(new Blob([planText(route), '\n', packing], { type: 'text/plain;charset=utf-8' }));
    download.href = downloadUrl;
    download.download = 'За сиянием — ' + route.title + '.txt';
    feedback.textContent = '';
    fallback.hidden = true;
  }

  for (const route of routes) {
    const radio = element('input', '', 'sr-only');
    radio.type = 'radio';
    radio.name = 'route';
    radio.id = 'route-' + route.id;
    radio.value = route.id;
    radio.checked = route.id === 1;
    radio.setAttribute('aria-labelledby', 'duration-' + route.id);
    radio.setAttribute('aria-describedby', 'compare-' + route.id);
    radio.addEventListener('change', () => {
      if (radio.checked) renderRoute(route);
    });

    const label = element('label');
    label.htmlFor = radio.id;
    label.dataset.option = route.id;
    const heading = element('span', '', 'route-option-heading');
    const duration = element('strong', route.duration);
    duration.id = 'duration-' + route.id;
    const check = element('span', '✓', 'route-check');
    check.setAttribute('aria-hidden', 'true');
    heading.append(duration, check);
    const info = element('span', '', 'route-option-info');
    info.id = 'compare-' + route.id;
    info.append(
      element('span', route.format, 'route-format'),
      element('span', 'Ночуем: ' + route.stay),
      element('span', 'Главная остановка: ' + stops[route.main].name)
    );
    label.append(heading, info);
    byId('route-options').append(radio, label);
  }

  byId('kit-list').replaceChildren(...kit.map(item => element('li', item)));
  byId('stay-list').replaceChildren(...routes.map(route => element('li', route.duration + ' — ' + route.stay + '.')));
  byId('walk-list').replaceChildren(...routes.map(route => element('li', route.duration + ' — ' + route.walk + '.')));
  renderRoute(routes[0]);
  byId('route-experience').hidden = false;
  copy.disabled = false;

  copy.addEventListener('click', async () => {
    const route = selectedRoute;
    const plan = planText(route);
    feedback.textContent = '';
    try {
      await navigator.clipboard.writeText(plan);
      if (selectedRoute !== route) return;
      fallback.hidden = true;
      feedback.textContent = 'План скопирован.';
    } catch {
      if (selectedRoute !== route) return;
      fallback.hidden = false;
      textField.value = plan;
      textField.focus();
      textField.select();
      feedback.textContent = 'Скопируйте выделенный текст.';
    }
  });
})();
