async function fetchExternalFooter() {
  const r = await fetch('/public/ext/footer.html', { credentials: 'same-origin' });
  return r.ok ? r.text() : null;
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
    const externalHTML = await fetchExternalFooter();
    if (externalHTML) {
      const frag = htmlToFragment(externalHTML);
      const el = frag.firstElementChild;
      wrapper.appendChild(el);
      block.appendChild(wrapper);
    }
  } catch (err) {
    console.warn('[footer] external/static failed, falling back to fragment:', err);
  }
}
