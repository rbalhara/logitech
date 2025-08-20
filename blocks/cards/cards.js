/* eslint-disable */
import { createOptimizedPicture } from '../../scripts/aem.js';

export default async function decorate(block) {
  const queryIndex = block.querySelector('a')?.href;
  if (!queryIndex) return;

  let data = [];
  try {
    const resp = await fetch(queryIndex);
    if (!resp.ok) throw new Error(`Could not fetch query index (${resp.status})`);
    const json = await resp.json();
    data = Array.isArray(json?.data) ? json.data : [];
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    return;
  }

  const BATCH_SIZE = 3;

  // Build <ul> of cards from data
  const ul = document.createElement('ul');

  data.forEach((item, idx) => {
    const { path, title, category, image, lastModified } = item;

    const li = document.createElement('li');
    li.dataset.index = idx;

    const a = document.createElement('a');
    a.href = path;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';

    // IMAGE
    const imgWrap = document.createElement('div');
    imgWrap.className = 'cards-card-image';
    const pic = createOptimizedPicture(image, title || '', false, [{ width: '750' }]);
    imgWrap.append(pic);

    if (category) {
      const eyebrow = document.createElement('span');
      eyebrow.className = 'eyebrow';
      eyebrow.textContent = category;
      imgWrap.append(eyebrow);
    }

    // BODY
    const body = document.createElement('div');
    body.className = 'cards-card-body';

    const h5 = document.createElement('h5');
    const titleLink = document.createElement('a');
    titleLink.href = path;
    titleLink.textContent = title || '';
    titleLink.target = '_blank';
    titleLink.rel = 'noopener noreferrer';
    h5.append(titleLink);
    body.append(h5);

    if (lastModified) {
      const dateObj = new Date(parseInt(lastModified, 10) * 1000);
      const formatted = dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      const date = document.createElement('span');
      date.className = 'last-modified';
      date.innerHTML = `&#x1F550; ${formatted}`;
      body.append(date);
    }

    a.append(imgWrap, body);
    li.append(a);

    // Hide beyond first batch
    if (idx >= BATCH_SIZE) {
      li.hidden = true;
      li.classList.add('is-hidden');
    }

    ul.append(li);
  });

  block.textContent = '';
  block.append(ul);

  // Only add toggle if block has EXACTLY ["block", "cards"]
  const isPlainCardsBlock =
    block.classList.length === 2 &&
    block.classList.contains('block') &&
    block.classList.contains('cards');

  if (isPlainCardsBlock && data.length > BATCH_SIZE) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'button secondary load';
    btn.textContent = 'LOAD MORE';
    block.append(btn);

    let shown = BATCH_SIZE;
    const items = [...ul.children];

    const updateState = () => {
      if (shown >= items.length) {
        btn.textContent = 'SHOW LESS';
      } else {
        btn.textContent = 'LOAD MORE';
      }
    };

    btn.addEventListener('click', () => {
      if (shown >= items.length) {
        // collapse back
        items.forEach((li, idx) => {
          if (idx >= BATCH_SIZE) {
            li.hidden = true;
            li.classList.add('is-hidden');
          }
        });
        shown = BATCH_SIZE;
      } else {
        // show next batch
        const nextEnd = Math.min(shown + BATCH_SIZE, items.length);
        for (let i = shown; i < nextEnd; i += 1) {
          items[i].hidden = false;
          items[i].classList.remove('is-hidden');
        }
        shown = nextEnd;
      }
      updateState();
    });

    updateState();
  }
}
