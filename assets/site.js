for (const gallery of document.querySelectorAll('.gallery')) {
  const slides = Array.from(gallery.querySelectorAll('figure'));
  if (slides.length < 2) continue;

  const controls = gallery.querySelector('.gallery-controls');
  const count = gallery.querySelector('.gallery-count');
  let activeIndex = 0;

  function showSlide(index) {
    activeIndex = (index + slides.length) % slides.length;
    slides.forEach((slide, position) => {
      slide.hidden = position !== activeIndex;
    });
    const caption = slides[activeIndex].querySelector('figcaption').textContent;
    count.textContent = `${activeIndex + 1} / ${slides.length}`;
    count.setAttribute('aria-label', `Кадр ${activeIndex + 1} из ${slides.length}. ${caption}`);
  }

  for (const button of controls.querySelectorAll('button')) {
    button.addEventListener('click', () => {
      showSlide(activeIndex + Number(button.dataset.step));
    });
  }

  showSlide(0);
  controls.hidden = false;
}

const viewer = document.querySelector('.image-viewer');

if (viewer && typeof viewer.showModal === 'function') {
  const viewerImage = viewer.querySelector('img');
  const viewerCaption = viewer.querySelector('#image-caption');
  let opener;

  for (const link of document.querySelectorAll('.screenshot-link')) {
    link.addEventListener('click', (event) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();

      opener = link;
      viewerImage.src = link.href;
      viewerImage.alt = link.querySelector('img').alt;
      viewerCaption.textContent = link.closest('figure').querySelector('figcaption').textContent;
      viewer.showModal();
    });
  }

  viewer.addEventListener('close', () => {
    opener?.focus();
  });
}
