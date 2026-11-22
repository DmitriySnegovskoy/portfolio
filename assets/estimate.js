(() => {
  'use strict';

  const { types, groups } = estimateCatalog;
  const allServices = groups.flatMap(group => group.services);
  const servicesById = new Map(allServices.map(service => [service.id, service]));
  const selected = new Set();
  const rubles = new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  });

  const calculator = document.querySelector('#calculator');
  const typeList = document.querySelector('#site-types');
  const baseDescription = document.querySelector('#base-description');
  const basePrice = document.querySelector('#base-price');
  const baseList = document.querySelector('#base-list');
  const includedServices = document.querySelector('#included-services');
  const extraServices = document.querySelector('#extra-services');
  const typeTemplate = document.querySelector('#type-template');
  const serviceTemplate = document.querySelector('#service-template');
  const breakdown = document.querySelector('#breakdown');
  const totalPrice = document.querySelector('#total-price');
  const mobileTotal = document.querySelector('#mobile-total');

  let type = types[0];
  let eligibleIds;

  function renderTypes() {
    for (const option of types) {
      const card = typeTemplate.content.cloneNode(true);
      const radio = card.querySelector('input');
      radio.value = option.id;
      radio.checked = option === type;
      card.querySelector('.type-name').textContent = option.name;
      card.querySelector('.type-description').textContent = option.description;
      card.querySelector('.type-price').textContent = rubles.format(option.price);
      typeList.append(card);
    }
  }

  function renderService(service, included = false) {
    const card = serviceTemplate.content.cloneNode(true);
    const choice = card.querySelector('.choose-service');
    const input = choice.querySelector('input');
    const price = choice.querySelector('.service-price');
    choice.querySelector('.service-name').textContent = service.name;
    choice.querySelector('.service-description').textContent = service.description;

    if (included) {
      const entry = document.createElement('div');
      entry.className = 'choose-service';
      input.remove();
      entry.append(...choice.children);
      choice.replaceWith(entry);
      card.querySelector('.service').classList.add('service-included');
      price.textContent = 'В базе';
    } else {
      input.value = service.id;
      input.checked = selected.has(service.id);
      price.textContent = '+ ' + rubles.format(service.price);
    }

    const summary = card.querySelector('summary');
    const serviceContext = document.createElement('span');
    serviceContext.className = 'visually-hidden';
    serviceContext.textContent = ' · ' + service.name;
    summary.append(serviceContext);

    const [work, factor] = card.querySelectorAll('.service-details p');
    work.textContent = service.work;
    factor.textContent = service.factor;
    return card;
  }

  function renderBase() {
    baseDescription.textContent = type.scope;
    basePrice.textContent = rubles.format(type.price);
    baseList.replaceChildren();
    includedServices.replaceChildren();
    for (const feature of type.base) {
      const item = document.createElement('li');
      item.textContent = feature;
      baseList.append(item);
    }
    for (const id of type.included) {
      includedServices.append(renderService(servicesById.get(id), true));
    }
  }

  function renderExtras() {
    extraServices.replaceChildren();
    for (const group of groups) {
      const available = group.services.filter(service => eligibleIds.has(service.id));
      if (available.length === 0) continue;

      const section = document.createElement('div');
      section.className = 'service-group';
      const heading = document.createElement('h3');
      heading.textContent = group.name;
      const list = document.createElement('div');
      list.className = 'service-list';
      list.append(...available.map(service => renderService(service)));
      section.append(heading, list);
      extraServices.append(section);
    }
  }

  function breakdownRow(label, amount) {
    const row = document.createElement('div');
    const term = document.createElement('dt');
    const value = document.createElement('dd');
    term.textContent = label;
    value.textContent = amount;
    row.append(term, value);
    return row;
  }

  function renderEstimate() {
    const extras = allServices.filter(service => eligibleIds.has(service.id) && selected.has(service.id));
    const total = extras.reduce((sum, service) => sum + service.price, type.price);
    const formattedTotal = rubles.format(total);
    totalPrice.textContent = formattedTotal;
    mobileTotal.textContent = formattedTotal;

    breakdown.replaceChildren(breakdownRow('База · ' + type.name, rubles.format(type.price)));
    for (const service of extras) {
      breakdown.append(breakdownRow(service.name, '+ ' + rubles.format(service.price)));
    }
    if (extras.length === 0) {
      breakdown.append(breakdownRow('Дополнения', rubles.format(0)));
    }
  }

  function updateType() {
    eligibleIds = new Set(allServices
      .filter(service => Number.isFinite(service.price) && !type.included.includes(service.id) && (!service.types || service.types.includes(type.id)))
      .map(service => service.id));
    for (const id of selected) {
      if (!eligibleIds.has(id)) selected.delete(id);
    }

    renderBase();
    renderExtras();
    renderEstimate();
  }

  typeList.addEventListener('change', event => {
    type = types.find(option => option.id === event.target.value);
    updateType();
  });

  extraServices.addEventListener('change', event => {
    const { value, checked } = event.target;
    if (!eligibleIds.has(value)) return;
    if (checked) selected.add(value);
    else selected.delete(value);
    renderEstimate();
  });

  renderTypes();
  updateType();
  calculator.hidden = false;
})();
