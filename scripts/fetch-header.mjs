/* eslint-disable */
import { parse } from "node-html-parser";
import { writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const ORIGIN = "https://www.logitech.com";
const URL = `${ORIGIN}/en-us`;

const r = await fetch(URL, { headers: { "user-agent": "Mozilla/5.0" } });
if (!r.ok) throw new Error(`Upstream error: ${r.status}`);
const html = await r.text();

const root = parse(html);
const header = root.querySelector("header");
if (!header) throw new Error("No <header> found");

// remove scripts inside header (safety)
header.querySelectorAll("script").forEach((s) => s.remove());

// rewrite relative src/href to absolute
header.querySelectorAll("[src]").forEach((el) => {
  const v = el.getAttribute("src");
  if (v?.startsWith("/")) el.setAttribute("src", ORIGIN + v);
});
header.querySelectorAll("[href]").forEach((el) => {
  const v = el.getAttribute("href");
  if (v?.startsWith("/")) el.setAttribute("href", ORIGIN + v);
});

// ensure output dir exists, then write file
await mkdir(__dirname + "/../public/ext", { recursive: true });
await writeFile(__dirname + "/../public/ext/header.html", header.toString(), "utf8");
console.log("✅ Wrote public/ext/header.html");
