(() => {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.getElementById('section-menu');

  function setMenu(open) {
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
  }

  toggle.addEventListener('click', event => {
    const open = toggle.getAttribute('aria-expanded') === 'false';
    setMenu(open);
    if (open && event.detail === 0) nav.querySelector('a').focus();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setMenu(false);
      toggle.focus();
    }
  });
  document.addEventListener('click', event => {
    if (!nav.contains(event.target) && !toggle.contains(event.target)) setMenu(false);
  });
  for (const link of document.querySelectorAll('.section-menu a, .hero a[href^="#"]')) {
    link.addEventListener('click', () => {
      setMenu(false);
      document.getElementById(link.hash.slice(1))?.focus({ preventScroll: true });
    });
  }

  const input = document.getElementById('cloudiness');
  const value = document.getElementById('cloud-value');
  const state = document.getElementById('sky-state');
  const layer = document.querySelector('.cloud-layer');
  const sky = layer.parentElement;
  const paint = layer.getContext('2d');
  const width = layer.width = 300;
  const height = layer.height = 130;
  const textures = new Float32Array(width * height);

  function noise(x, y) {
    const seed = (Math.sin(x * 12.9898 + y * 78.233) * 43758.5453);
    return seed - Math.floor(seed);
  }

  function layerNoise(x, y) {
    const column = Math.floor(x), row = Math.floor(y);
    const dx = x - column, dy = y - row;
    const u = dx * dx * (3 - 2 * dx), v = dy * dy * (3 - 2 * dy);
    const top = noise(column, row) * (1 - u) + noise(column + 1, row) * u;
    const bottom = noise(column, row + 1) * (1 - u) + noise(column + 1, row + 1) * u;
    return top * (1 - v) + bottom * v;
  }

  if (paint) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        textures[y * width + x] = (
          layerNoise(x / 64 + 2, y / 26 + 5) * .56 +
          layerNoise(x / 29, y / 14 + 7) * .29 +
          layerNoise(x / 11 + 8, y / 6) * .15
        );
      }
    }
  }

  const cloudPixels = paint?.createImageData(width, height);
  const clamp = n => Math.min(1, Math.max(0, n));

  function updateSky() {
    const cloudiness = input.valueAsNumber;
    value.textContent = cloudiness + '%';
    const status = cloudiness === 0 ? 'Ясно. Сияние хорошо видно.' :
      cloudiness < 35 ? 'Редкие облака. Большая часть неба открыта.' :
      cloudiness < 70 ? 'Переменная облачность. Сияние видно в просветах.' :
      cloudiness < 100 ? 'Плотные облака. Просветы почти закрылись.' :
      'Сплошная облачность. Сияние скрыто.';
    if (state.textContent !== status) state.textContent = status;
    const strength = cloudiness / 100;
    sky.style.setProperty('--reflection-strength', String((1 - strength) ** 1.4));
    sky.classList.toggle('is-overcast', cloudiness === 100);
    layer.style.opacity = cloudiness === 0 ? '0' : '1';
    if (!paint || cloudiness === 0) return;

    const threshold = .89 - strength * .86;
    for (let y = 0; y < height; y++) {
      const edge = 1 - clamp((y / height - .62) / .33);
      for (let x = 0; x < width; x++) {
        const index = y * width + x;
        const pixel = index * 4;
        const cloud = textures[index];
        const density = clamp((cloud - threshold) * 7 + .12);
        const opacity = (strength === 1 ? 1 : density) * edge;
        cloudPixels.data[pixel] = 22 + cloud * 48;
        cloudPixels.data[pixel + 1] = 30 + cloud * 52;
        cloudPixels.data[pixel + 2] = 46 + cloud * 65;
        cloudPixels.data[pixel + 3] = opacity * 255;
      }
    }
    paint.putImageData(cloudPixels, 0, 0);
  }

  input.addEventListener('input', updateSky);
  updateSky();
})();
