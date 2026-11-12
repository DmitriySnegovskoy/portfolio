const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
const tabList = document.querySelector('.gallery-tabs');
const tabs = Array.from(tabList.querySelectorAll('button'));
const panels = tabs.map((tab) => document.getElementById(tab.getAttribute('aria-controls')));

tabList.setAttribute('role', 'tablist');
tabs.forEach((tab, index) => {
  tab.setAttribute('role', 'tab');
  panels[index].setAttribute('role', 'tabpanel');
  panels[index].setAttribute('aria-labelledby', tab.id);
});

function selectTab(tab, { focus = false, animate = false } = {}) {
  if (tab.getAttribute('aria-selected') === 'true') {
    if (focus) tab.focus();
    return;
  }

  tabs.forEach((button, index) => {
    const active = button === tab;
    button.setAttribute('aria-selected', String(active));
    button.tabIndex = active ? 0 : -1;
    panels[index].hidden = !active;
  });

  if (focus) tab.focus();
  if (animate && !motion.matches && 'animate' in Element.prototype) {
    document.getElementById(tab.getAttribute('aria-controls')).animate(
      [{ opacity: 0.55, transform: 'translateY(5px)' }, { opacity: 1, transform: 'translateY(0)' }],
      { duration: 210, easing: 'ease-out' }
    );
  }
}

function tabFromHash(hash) {
  return tabs.find((tab) => '#' + tab.getAttribute('aria-controls') === hash);
}

selectTab(tabFromHash(window.location.hash) || document.getElementById('tab-catalog'));
tabList.hidden = false;

tabs.forEach((tab) => {
  tab.addEventListener('click', () => selectTab(tab, { animate: true }));
});
tabList.addEventListener('keydown', (event) => {
  const current = tabs.indexOf(event.target);
  if (current < 0) return;

  const destinations = {
    ArrowLeft: (current + tabs.length - 1) % tabs.length,
    ArrowRight: (current + 1) % tabs.length,
    Home: 0,
    End: tabs.length - 1,
  };
  const destination = destinations[event.key];
  if (destination === undefined) return;

  event.preventDefault();
  selectTab(tabs[destination], { focus: true, animate: true });
});

document.querySelectorAll('[data-gallery-link]').forEach((link) => {
  link.addEventListener('click', (event) => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const tab = tabFromHash(link.hash);
    if (!tab) return;
    event.preventDefault();
    selectTab(tab, { focus: true, animate: true });
  });
});

window.addEventListener('hashchange', () => {
  const tab = tabFromHash(window.location.hash);
  if (tab) {
    selectTab(tab);
    document.getElementById(tab.getAttribute('aria-controls')).scrollIntoView();
  }
});

const viewer = document.querySelector('.image-viewer');

if (typeof viewer.showModal === 'function') {
  const viewerImage = viewer.querySelector('img');
  const viewerCaption = viewer.querySelector('#image-caption');
  let opener;

  document.querySelectorAll('.shot-link').forEach((link) => {
    link.setAttribute('aria-haspopup', 'dialog');
    link.addEventListener('click', (event) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();

      opener = link;
      viewerImage.src = link.href;
      viewerImage.alt = link.querySelector('img').alt;
      viewerCaption.textContent = link.closest('.gallery-panel').querySelector('h3').textContent;
      viewer.showModal();
    });
  });

  viewer.addEventListener('click', (event) => {
    if (event.target === viewer) viewer.close();
  });
  viewer.addEventListener('close', () => opener?.focus());
}

const search = document.querySelector('#product-search');
const availableOnly = document.querySelector('#available-only');
const categoryButtons = Array.from(document.querySelectorAll('[data-category-filter]'));
const resetCatalog = document.querySelector('#reset-catalog');
const products = Array.from(document.querySelectorAll('#search-results li'), (element) => ({
  element,
  searchText: normalize(element.querySelector('.product-name').textContent),
}));
const emptyMessage = document.querySelector('.search-empty');
const searchStatus = document.querySelector('#search-status');
let selectedCategory = '';

function normalize(text) {
  return text.normalize('NFC').toLocaleLowerCase('ru').replaceAll('ё', 'е').trim();
}

function updateSearch() {
  const words = normalize(search.value).split(/\s+/).filter(Boolean);
  let visible = 0;

  products.forEach(({ element, searchText }) => {
    const matchesQuery = words.every((word) => searchText.includes(word));
    const matchesCategory = !selectedCategory || element.dataset.category === selectedCategory;
    const matchesAvailability = !availableOnly.checked || element.hasAttribute('data-in-stock');

    element.hidden = !(matchesQuery && matchesCategory && matchesAvailability);
    if (!element.hidden) visible += 1;
  });

  emptyMessage.hidden = visible > 0;
  searchStatus.textContent = `Найдено: ${visible}`;
  resetCatalog.hidden = !(search.value || selectedCategory || availableOnly.checked);
}

function setCategory(category) {
  selectedCategory = category;
  categoryButtons.forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.categoryFilter === category));
  });
  updateSearch();
}

search.addEventListener('input', updateSearch);
availableOnly.addEventListener('change', updateSearch);
categoryButtons.forEach((button) => {
  button.addEventListener('click', () => setCategory(button.dataset.categoryFilter));
});
resetCatalog.addEventListener('click', () => {
  search.value = '';
  availableOnly.checked = false;
  search.focus();
  setCategory('');
});
updateSearch();
search.closest('.search-widget').hidden = false;
document.querySelector('.catalog-example-tip').hidden = false;

if (!motion.matches && 'IntersectionObserver' in window && 'animate' in Element.prototype) {
  const appear = new IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting }) => {
      if (!isIntersecting) return;
      appear.unobserve(target);
      if (motion.matches) return;
      target.animate(
        [{ opacity: 0.75, transform: 'translateY(9px)' }, { opacity: 1, transform: 'translateY(0)' }],
        { duration: 360, easing: 'ease-out' }
      );
    });
  }, { threshold: 0.18 });

  document.querySelectorAll('.case-intro, .search-example, .services-grid, .steps, .contact-card').forEach(
    (element) => appear.observe(element)
  );
}
