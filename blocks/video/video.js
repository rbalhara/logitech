/*
 * Video Block
 * Show a video referenced by a link
 * https://www.hlx.live/developer/block-collection/video
 */

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function embedYoutube(url, autoplay, background) {
  const usp = new URLSearchParams(url.search);
  let suffix = '';
  if (background || autoplay) {
    const suffixParams = {
      autoplay: autoplay ? '1' : '0',
      mute: background ? '1' : '0',
      controls: background ? '0' : '1',
      disablekb: background ? '1' : '0',
      loop: background ? '1' : '0',
      playsinline: background ? '1' : '0',
    };
    suffix = `&${Object.entries(suffixParams).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')}`;
  }
  let vid = usp.get('v') ? encodeURIComponent(usp.get('v')) : '';
  const embed = url.pathname;
  if (url.origin.includes('youtu.be')) {
    [, vid] = url.pathname.split('/');
  }

  const temp = document.createElement('div');
  temp.innerHTML = `<div style="left: 0; width: 100%; height: 0; position: relative; padding-bottom: 56.25%;">
      <iframe src="https://www.youtube.com${vid ? `/embed/${vid}?rel=0&v=${vid}${suffix}` : embed}" style="border: 0; top: 0; left: 0; width: 100%; height: 100%; position: absolute;" 
      allow="autoplay; fullscreen; picture-in-picture; encrypted-media; accelerometer; gyroscope; picture-in-picture" allowfullscreen="" scrolling="no" title="Content from Youtube" loading="lazy"></iframe>
    </div>`;
  return temp.children.item(0);
}

function embedVimeo(url, autoplay, background) {
  const [, video] = url.pathname.split('/');
  let suffix = '';
  if (background || autoplay) {
    const suffixParams = {
      autoplay: autoplay ? '1' : '0',
      background: background ? '1' : '0',
    };
    suffix = `?${Object.entries(suffixParams).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')}`;
  }
  const temp = document.createElement('div');
  temp.innerHTML = `<div style="left: 0; width: 100%; height: 0; position: relative; padding-bottom: 56.25%;">
      <iframe src="https://player.vimeo.com/video/${video}${suffix}" 
      style="border: 0; top: 0; left: 0; width: 100%; height: 100%; position: absolute;" 
      frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen  
      title="Content from Vimeo" loading="lazy"></iframe>
    </div>`;
  return temp.children.item(0);
}

function getVideoElement(source, autoplay, background) {
  const video = document.createElement('video');
  video.setAttribute('controls', '');
  if (autoplay) video.setAttribute('autoplay', '');
  if (background) {
    video.setAttribute('loop', '');
    video.setAttribute('playsinline', '');
    video.removeAttribute('controls');
    video.addEventListener('canplay', () => {
      video.muted = true;
      if (autoplay) video.play();
    });
  }

  const sourceEl = document.createElement('source');
  sourceEl.setAttribute('src', source);
  sourceEl.setAttribute('type', `video/${source.split('.').pop()}`);
  video.append(sourceEl);

  return video;
}

/**
 * Per-item embed: state lives on mountEl, not the block
 */
const loadVideoEmbed = (mountEl, link, autoplay, background) => {
  if (mountEl.dataset.embedLoaded === 'true') return;

  const url = new URL(link);
  const isYoutube = link.includes('youtube') || link.includes('youtu.be');
  const isVimeo = link.includes('vimeo');

  if (isYoutube) {
    const embedWrapper = embedYoutube(url, autoplay, background);
    mountEl.append(embedWrapper);
    embedWrapper.querySelector('iframe').addEventListener('load', () => {
      mountEl.dataset.embedLoaded = 'true';
    });
  } else if (isVimeo) {
    const embedWrapper = embedVimeo(url, autoplay, background);
    mountEl.append(embedWrapper);
    embedWrapper.querySelector('iframe').addEventListener('load', () => {
      mountEl.dataset.embedLoaded = 'true';
    });
  } else {
    const videoEl = getVideoElement(link, autoplay, background);
    mountEl.append(videoEl);
    videoEl.addEventListener('canplay', () => {
      mountEl.dataset.embedLoaded = 'true';
    });
  }
};

export default async function decorate(block) {
  const autoplay = block.classList.contains('autoplay');

  // Capture original "items" (top-level direct children of the block)
  const rawItems = Array.from(block.querySelectorAll(':scope > div'));

  // Build the list container
  const list = document.createElement('div');
  list.className = 'video-list'; // your CSS can grid/flex this

  // We’ll rebuild the block, so clear it first
  block.textContent = '';

  rawItems.forEach((item) => {
    // Each item might have an extra wrapper <div>, normalize:
    const inner = item.querySelector(':scope > div') || item;

    // Extract links and placeholder (scoped to this item)
    const anchors = Array.from(inner.querySelectorAll('a'));
    const videoLinkEl = anchors[0];
    const ctaLinkEl = anchors[1] || null;

    if (!videoLinkEl) return; // skip malformed item

    const videoHref = videoLinkEl.href;
    const placeholder = inner.querySelector('picture');

    // Identify the original CTA container node (to preserve exact HTML)
    let originalCtaNode = null;
    if (ctaLinkEl) {
      // choose the nearest parent inside the item; if none, use the anchor itself
      originalCtaNode = ctaLinkEl.closest('p, .button-container, div, span') || ctaLinkEl;
    }

    // Create a card container for this item
    const card = document.createElement('div');
    card.className = 'video-item';

    // Dedicated mount for the video region
    const mount = document.createElement('div');
    mount.className = 'video-mount';
    mount.dataset.embedLoaded = 'false';
    card.append(mount);

    // If there's a placeholder, render it inside the mount
    if (placeholder) {
      const wrapper = document.createElement('div');
      wrapper.className = 'video-placeholder';
      wrapper.append(placeholder); // moves original <picture>

      if (!autoplay) {
        wrapper.insertAdjacentHTML(
          'beforeend',
          '<div class="video-placeholder-play"><button type="button" title="Play"></button></div>',
        );
        wrapper.addEventListener('click', () => {
          wrapper.remove();
          loadVideoEmbed(mount, videoHref, true, false);
        });
      }
      mount.append(wrapper);
    }

    // Move the original CTA node (unaltered) under the video mount
    if (originalCtaNode) {
      const ctaHolder = document.createElement('div');
      ctaHolder.className = 'video-cta';
      ctaHolder.append(originalCtaNode); // move original DOM, no cloning
      card.append(ctaHolder);
    }

    // Lazy-load / autoplay handling per item
    if (!placeholder || autoplay) {
      const observer = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          observer.disconnect();
          const playOnLoad = autoplay && !prefersReducedMotion.matches;
          loadVideoEmbed(mount, videoHref, playOnLoad, autoplay);
        }
      });
      observer.observe(mount);
    }

    list.append(card);
  });

  block.append(list);
}
