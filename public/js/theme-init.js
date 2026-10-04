// Runs before first paint (loaded synchronously in <head>) so the saved theme doesn't flash.
// Themes: light | dark | forest. A ?theme=... link preview also works (and is remembered).
try {
  const valid = (v) => v === 'light' || v === 'dark' || v === 'forest';
  const fromUrl = new URLSearchParams(location.search).get('theme');
  if (valid(fromUrl)) localStorage.setItem('theme', fromUrl);
  const saved = localStorage.getItem('theme');
  if (valid(saved)) document.documentElement.dataset.theme = saved;
} catch { /* storage unavailable: fall back to the OS preference */ }
