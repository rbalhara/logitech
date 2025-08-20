async function fetchExternalHeader() {
  const response = await fetch('/public/ext/header.html', { credentials: 'same-origin' });
  return response.ok ? response.text() : null;
}

function htmlToFragment(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const root = doc.body.childElementCount ? doc.body : doc;
  root.querySelectorAll('script').forEach((s) => s.remove()); // safety

  const fragment = document.createDocumentFragment();
  [...root.children].forEach((el) => fragment.appendChild(el.cloneNode(true)));
  return fragment;
}

/** @param {Element} block */
export default async function decorate(block) {
  block.innerHTML = ''; // clear existing content
  const wrapper = document.createElement('div');
  wrapper.className = 'nav-wrapper';

  try {
    const externalHTML = await fetchExternalHeader();
    if (externalHTML) {
      const frag = htmlToFragment(externalHTML);
      const el = frag.firstElementChild;
      wrapper.appendChild(el);
      block.appendChild(wrapper);
    }
  } catch (err) {
    /* eslint-disable-next-line no-console */
    console.warn('[header] external/static failed, falling back to fragment:', err);
  }

  /* minor UI fixes */
  const header = block.querySelector('header');
  header.style = '--header-height: 97px;';

  const mainLogoLink = block.querySelector('.main-nav-logo-anim');
  mainLogoLink.href = '/';
}
