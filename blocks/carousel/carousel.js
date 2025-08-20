function updateActiveSlide(slide) {
  const block = slide.closest('.carousel');
  const slideIndex = parseInt(slide.dataset.slideIndex, 10);
  block.dataset.activeSlide = slideIndex;

  const slides = block.querySelectorAll('.carousel-slide');

  slides.forEach((aSlide, idx) => {
    aSlide.setAttribute('aria-hidden', idx !== slideIndex);
    aSlide.querySelectorAll('a').forEach((link) => {
      if (idx !== slideIndex) {
        link.setAttribute('tabindex', '-1');
      } else {
        link.removeAttribute('tabindex');
      }
    });
  });

  const indicators = block.querySelectorAll('.carousel-slide-indicator');
  indicators.forEach((indicator, idx) => {
    const btn = indicator.querySelector('button');
    if (idx !== slideIndex) {
      btn.removeAttribute('disabled');
    } else {
      btn.setAttribute('disabled', 'true');
    }
  });
}

function showSlide(block, slideIndex = 0) {
  const slides = block.querySelectorAll('.carousel-slide');
  let realSlideIndex = slideIndex < 0 ? slides.length - 1 : slideIndex;
  if (slideIndex >= slides.length) realSlideIndex = 0;

  const activeSlide = slides[realSlideIndex];

  // Ensure links in the new active slide are tabbable (others are handled in updateActiveSlide)
  activeSlide.querySelectorAll('a').forEach((link) => link.removeAttribute('tabindex'));

  block.querySelector('.carousel-slides').scrollTo({
    top: 0,
    left: activeSlide.offsetLeft,
    behavior: 'smooth',
  });

  // Immediately reflect state so the buttons/indicators update without waiting for the observer
  updateActiveSlide(activeSlide);
}

function bindEvents(block) {
  const slideIndicators = block.querySelector('.carousel-slide-indicators');
  if (slideIndicators) {
    slideIndicators.querySelectorAll('button').forEach((button) => {
      button.addEventListener('click', (e) => {
        const slideIndicator = e.currentTarget.parentElement;
        showSlide(block, parseInt(slideIndicator.dataset.targetSlide, 10));
      });
    });
  }

  // Prev/Next buttons now live INSIDE each slide
  block.querySelectorAll('.carousel-slide').forEach((slide) => {
    const prev = slide.querySelector('.slide-prev');
    const next = slide.querySelector('.slide-next');

    if (prev) {
      prev.addEventListener('click', () => {
        showSlide(block, parseInt(block.dataset.activeSlide, 10) - 1);
      });
    }
    if (next) {
      next.addEventListener('click', () => {
        showSlide(block, parseInt(block.dataset.activeSlide, 10) + 1);
      });
    }
  });

  // Keep active slide in sync when scrolling/dragging
  const slideObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) updateActiveSlide(entry.target);
    });
  }, { threshold: 0.5 });

  block.querySelectorAll('.carousel-slide').forEach((slide) => {
    slideObserver.observe(slide);
  });
}

function createSlideFromData(item, slideIndex, carouselId, isSingleSlide) {
  /* eslint-disable-next-line */
  const { path, title, category, image, description } = item;

  // Buttons will now live inside .carousel-slide-content
  const navButtons = isSingleSlide ? '' : `
    <div class="carousel-navigation-buttons">
      <button type="button" class="slide-prev" aria-label="Previous Slide"></button>
      <button type="button" class="slide-next" aria-label="Next Slide"></button>
    </div>
  `;

  const template = `
    <li 
      class="carousel-slide" 
      data-slide-index="${slideIndex}" 
      id="carousel-${carouselId}-slide-${slideIndex}"
      aria-labelledby="carousel-${carouselId}-slide-${slideIndex}-title"
    >
      <div class="carousel-slide-image">
        <picture>
          <img 
            src="${image}" 
            alt="${title || ''}" 
            loading="lazy" 
            decoding="async"
          />
        </picture>
      </div>
      <div class="carousel-slide-content" data-align="left">
        <p class="eyebrow">${category || ''}</p>
        <h2 id="carousel-${carouselId}-slide-${slideIndex}-title">
          <a href="${path}">${title || ''}</a>
        </h2>
        <p class="desc">${description || ''}</p>
        <p><a href="${path}">READ MORE</a></p>
        ${navButtons}
      </div>
    </li>
  `;

  const wrapper = document.createElement('div');
  wrapper.innerHTML = template.trim();
  return wrapper.firstElementChild;
}

let carouselId = 0;
const AUTO_SLIDE_INTERVAL = 4000; // 4 seconds
const timers = new Map(); // keep track of intervals per carousel

function stopAutoSlide(block) {
  const timer = timers.get(block.id);
  if (timer) {
    clearInterval(timer);
    timers.delete(block.id);
  }
}

function startAutoSlide(block) {
  stopAutoSlide(block); // clear any existing
  const isSingleSlide = block.querySelectorAll('.carousel-slide').length < 2;
  if (isSingleSlide) return;

  const timer = setInterval(() => {
    const currentIndex = parseInt(block.dataset.activeSlide, 10);
    showSlide(block, currentIndex + 1);
  }, AUTO_SLIDE_INTERVAL);

  timers.set(block.id, timer);
}

function restartAutoSlide(block) {
  stopAutoSlide(block);
  startAutoSlide(block);
}

export default async function decorate(block) {
  const queryIndex = block.querySelector('a')?.href;
  if (!queryIndex) return;

  const resp = await fetch(queryIndex);
  if (!resp.ok) throw new Error('Could not fetch query index');

  const { data } = await resp.json();
  if (!Array.isArray(data) || data.length === 0) return;

  carouselId += 1;
  block.id = `carousel-${carouselId}`;
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'Carousel');
  block.textContent = '';

  const isSingleSlide = data.length < 2;

  const container = document.createElement('div');
  container.classList.add('carousel-slides-container');

  const slidesWrapper = document.createElement('ul');
  slidesWrapper.classList.add('carousel-slides');

  let slideIndicators;
  if (!isSingleSlide) {
    const slideIndicatorsNav = document.createElement('nav');
    slideIndicatorsNav.setAttribute('aria-label', 'Carousel Slide Controls');

    slideIndicators = document.createElement('ol');
    slideIndicators.classList.add('carousel-slide-indicators');

    slideIndicatorsNav.append(slideIndicators);
    block.append(slideIndicatorsNav);
  }

  data.forEach((item, idx) => {
    const slide = createSlideFromData(item, idx, carouselId, isSingleSlide);
    slidesWrapper.append(slide);

    if (slideIndicators) {
      const indicator = document.createElement('li');
      indicator.classList.add('carousel-slide-indicator');
      indicator.dataset.targetSlide = idx;
      indicator.innerHTML = `<button type="button" aria-label="Show Slide ${idx + 1} of ${data.length}"></button>`;
      slideIndicators.append(indicator);
    }
  });

  container.append(slidesWrapper);
  block.prepend(container);

  if (!isSingleSlide) {
    bindEvents(block);

    // reset auto-slide on user interaction
    block.addEventListener('click', () => restartAutoSlide(block));
    block.addEventListener('keydown', () => restartAutoSlide(block));
    block.addEventListener('touchstart', () => restartAutoSlide(block));
  }

  block.dataset.activeSlide = 0;
  showSlide(block, 0);

  // start auto slide
  startAutoSlide(block);
}
