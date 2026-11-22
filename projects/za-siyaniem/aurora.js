(() => {
  function mountAurora(scene, light, paintWater) {
    const canvas = scene.querySelector('.aurora');
    const ctx = canvas.getContext('2d');
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    let width = 1, height = 1, visible = true, frame = 0, last = -Infinity;
    let elapsed = 0, x = 0, y = 0, aimX = 0, aimY = 0;

    if (!ctx) return () => {};

    // A one-pixel column of the curtain, reused for each ray along the ribbon.
    function ray(stops) {
      const sprite = document.createElement('canvas');
      sprite.width = 1;
      sprite.height = 180;
      const paint = sprite.getContext('2d');
      const gradient = paint.createLinearGradient(0, 0, 0, 180);
      for (const [position, shade] of stops) gradient.addColorStop(position, shade);
      paint.fillStyle = gradient;
      paint.fillRect(0, 0, 1, 180);
      return sprite;
    }

    const green = ray([
      [0, '#a377ee00'], [.16, '#9471ed13'], [.38, '#6e91f92f'], [.60, '#2bdaaa52'],
      [.79, '#4affb99a'], [.89, '#8bffd9df'], [.925, '#7affc3ad'], [1, '#4affb900']
    ]);
    const violet = ray([
      [0, '#be77f400'], [.26, '#bd71fe20'], [.65, '#a37cf253'],
      [.88, '#c695f4a8'], [.93, '#a586e477'], [1, '#a377ee00']
    ]);

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      const narrow = width < 680;
      const t = motion.matches ? 0 : elapsed;
      const night = light() === 'night';
      const strength = night ? 1 : .57;
      const phase = t * .12;
      const driftX = motion.matches ? 0 : x * Math.min(width * .022, 26);
      const driftY = motion.matches ? 0 : y * height * .016;
      const a = (value) => Math.max(0, Math.min(1, value));

      function ribbon(config) {
        const [offset, length, level, depth, seed, sprite, weight] = config;
        const steps = Math.round(Math.min(540, Math.max(220, width * .42)));
        const start = width * offset + driftX;
        const size = width * length;
        for (let i = 0; i < steps; i++) {
          const u = i / steps;
          const taper = Math.pow(Math.sin(u * Math.PI), .72);
          const bend = Math.PI * (2.16 * u + seed) + phase * .56;
          const folds = Math.sin(bend) * .63 + Math.sin(bend * 1.68 + 1) * .22;
          const base = height * (level + depth * (folds + .22 * Math.sin(u * 14 - phase))) + driftY;
          const xp = start + u * size + width * (.028 * Math.sin(bend * 1.5));
          const nextBend = bend + Math.PI * 2.16 / steps;
          const nextX = start + (u + 1 / steps) * size + width * (.028 * Math.sin(nextBend * 1.5));
          const bands = .61 + .18 * Math.sin(u * 82 + phase * 2 + seed * 5) +
            .12 * Math.sin(u * 211 - phase * 1.5) + .08 * Math.sin(u * 491 + seed * 3);
          const rays = height * (narrow ? .215 : .24) *
            (.66 + .42 * Math.sin(u * 7 + seed - phase * .5) ** 2) * (.83 + bands * .48);
          ctx.globalAlpha = a(strength * weight * taper * (.48 + bands * .70));
          ctx.drawImage(sprite, xp, base - rays * .9, Math.max(.8, nextX - xp + .7), rays);
        }
      }

      ctx.globalCompositeOperation = 'lighter';
      if (narrow) {
        ribbon([-.20, 1.43, .37, .083, .44, violet, .62]);
        ribbon([-.34, 1.61, .35, .098, .09, green, .73]);
        ribbon([.12, 1.17, .30, .058, 1.07, green, .48]);
      } else {
        ribbon([.13, .99, .44, .097, .31, violet, .62]);
        ribbon([.14, .98, .37, .137, -.20, green, .81]);
        ribbon([.43, .73, .34, .072, .77, green, .55]);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      paintWater?.(canvas, width, height, t, !motion.matches);
    }

    function resize() {
      ({ width, height } = canvas.getBoundingClientRect());
      const ratio = Math.min(devicePixelRatio || 1, 1.5);
      canvas.width = Math.max(1, Math.round(width * ratio));
      canvas.height = Math.max(1, Math.round(height * ratio));
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      draw();
    }

    function animate(now) {
      if (now - last >= 40) {
        elapsed += Number.isFinite(last) ? Math.min((now - last) / 1000, .1) : 0;
        last = now;
        x += (aimX - x) * .1;
        y += (aimY - y) * .1;
        draw();
      }
      frame = requestAnimationFrame(animate);
    }

    function sync() {
      cancelAnimationFrame(frame);
      last = -Infinity;
      if (motion.matches || document.hidden || !visible) {
        frame = 0;
        if (motion.matches && visible) draw();
      } else {
        frame = requestAnimationFrame(animate);
      }
    }

    scene.addEventListener('pointermove', event => {
      if (motion.matches || event.pointerType !== 'mouse') return;
      const box = scene.getBoundingClientRect();
      aimX = (event.clientX - box.left) / box.width * 2 - 1;
      aimY = (event.clientY - box.top) / box.height * 2 - 1;
    }, { passive: true });
    scene.addEventListener('pointerleave', () => { aimX = 0; aimY = 0; });
    new ResizeObserver(resize).observe(canvas);
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    }).observe(scene);
    motion.addEventListener('change', sync);
    document.addEventListener('visibilitychange', sync);
    return draw;
  }

  function mountWater(scene, image) {
    const ripples = scene.querySelector('.water-ripples');
    const reflection = scene.querySelector('.water-reflection');
    const water = ripples.getContext('2d');
    const light = reflection.getContext('2d');
    if (!water || !light) return;

    // The water's outline on the uncropped bay photograph, from the horizon back along the rocks.
    const shoreline = [
      [.218, .717], [.334, .688], [.467, .681], [.591, .675], [.706, .669],
      [1, .669], [1, .986], [.945, .941], [.876, .907], [.816, .849],
      [.747, .832], [.681, .814], [.641, .809], [.602, .832], [.552, .817],
      [.503, .809], [.479, .786], [.431, .777], [.387, .787], [.344, .767],
      [.309, .735], [.259, .739]
    ];
    let lastWidth = 0, lastHeight = 0;
    let outline, drawnWidth, drawnHeight, left, top, waterline;

    function resize(width, height) {
      lastWidth = width;
      lastHeight = height;
      const ratio = Math.min(1.5, 900 / width);
      ripples.width = reflection.width = Math.max(1, Math.round(width * ratio));
      ripples.height = reflection.height = Math.max(1, Math.round(height * ratio));
      const viewWidth = ripples.width, viewHeight = ripples.height;
      const scale = Math.max(viewWidth / image.naturalWidth, viewHeight / image.naturalHeight);
      drawnWidth = image.naturalWidth * scale;
      drawnHeight = image.naturalHeight * scale;
      const [positionX, positionY] = getComputedStyle(image).objectPosition.split(' ').map(parseFloat);
      left = (viewWidth - drawnWidth) * positionX / 100;
      top = (viewHeight - drawnHeight) * positionY / 100;
      waterline = top + .669 * drawnHeight;
      scene.style.setProperty('--waterline', (100 * waterline / viewHeight) + '%');
      outline = new Path2D();
      for (const [index, [x, y]] of shoreline.entries()) {
        const px = left + x * drawnWidth, py = top + y * drawnHeight;
        if (index === 0) outline.moveTo(px, py);
        else outline.lineTo(px, py);
      }
      outline.closePath();
    }

    return (aurora, width, height, time, moving) => {
      if (!image.naturalWidth || width < 2 || height < 2) return;
      if (width !== lastWidth || height !== lastHeight) resize(width, height);

      const viewWidth = ripples.width, viewHeight = ripples.height;
      const scale = drawnHeight / image.naturalHeight;
      const strip = 2;
      water.clearRect(0, 0, viewWidth, viewHeight);
      light.clearRect(0, 0, viewWidth, viewHeight);
      water.save();
      light.save();
      water.clip(outline);
      light.clip(outline);

      for (let y = Math.max(0, Math.floor(waterline)); y < viewHeight; y += strip) {
        const distance = Math.max(0, y - waterline);
        const depth = distance / drawnHeight;
        const swell = Math.sin(92 * depth - 2.1 * time);
        const ripple = Math.sin(227 * depth - 3.3 * time + .7);
        const foreground = Math.min(1, depth * 10);
        const drift = foreground * (1.8 * swell + 1.2 * ripple);
        const sourceY = (y - top) / scale;

        if (moving) {
          const sample = Math.max(0, Math.min(image.naturalHeight - strip / scale, sourceY + drift));
          water.globalAlpha = .8;
          water.drawImage(image, 0, sample, image.naturalWidth, strip / scale,
            left + drift, y, drawnWidth, strip);
        }

        const mirrorDepth = distance / (viewHeight * .23);
        const mirroredY = Math.round((.54 - .52 * mirrorDepth) * aurora.height);
        if (mirroredY < 0) continue;
        const fade = Math.min(1, mirrorDepth * 8) * Math.max(0, 1 - mirrorDepth);
        light.globalAlpha = fade * (.25 + .08 * swell + .07 * ripple);
        light.drawImage(aurora, 0, mirroredY, aurora.width, 1,
          -2 + drift + 3 * ripple, y, viewWidth + 4, strip);
      }
      water.restore();
      light.restore();
    };
  }

  const root = document.documentElement;
  const paintHero = mountAurora(document.querySelector('.hero'), () => root.dataset.light);
  for (const radio of document.querySelectorAll('[name="light"]')) {
    radio.addEventListener('change', () => {
      if (radio.checked) {
        root.dataset.light = radio.value;
        paintHero();
      }
    });
    if (radio.checked) root.dataset.light = radio.value;
  }
  const sky = document.querySelector('.sky-visual');
  const image = sky.querySelector('img');
  const paintSky = mountAurora(sky, () => 'night', mountWater(sky, image));
  image.addEventListener('load', paintSky);
})();
