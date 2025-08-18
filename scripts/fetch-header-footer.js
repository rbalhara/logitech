/* eslint-disable */
import { parse } from 'node-html-parser';
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const ORIGIN = 'https://www.logitech.com';
const URL = `${ORIGIN}/en-us`;
const OUT_DIR = __dirname + '/../public/ext';

const clean = (node) => {
  node.querySelectorAll('script').forEach((s) => s.remove());
  node.querySelectorAll('[src]').forEach((el) => {
    const v = el.getAttribute('src');
    if (v?.startsWith('/')) el.setAttribute('src', ORIGIN + v);
  });
  node.querySelectorAll('[href]').forEach((el) => {
    const v = el.getAttribute('href');
    if (v?.startsWith('/')) el.setAttribute('href', ORIGIN + v);
  });
  return node;
};

try {
  const r = await fetch(URL, { headers: { 'user-agent': 'Mozilla/5.0' } });
  if (!r.ok) throw new Error(`Upstream error: ${r.status}`);
  const html = await r.text();
  const root = parse(html);

  const header = root.querySelector('header');
  const footer = root.querySelector('footer');
  if (!header || !footer) throw new Error('Missing <header> or <footer>');

  await mkdir(OUT_DIR, { recursive: true });
  await Promise.all([
    writeFile(`${OUT_DIR}/header.html`, clean(header).toString(), 'utf8'),
    writeFile(`${OUT_DIR}/footer.html`, clean(footer).toString(), 'utf8'),
  ]);

  console.log('✅ Wrote header.html and footer.html');
} catch (err) {
  console.error('❌', err?.message || err);
  process.exitCode = 1;
}
