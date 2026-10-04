// Runs before first paint (loaded synchronously in <head>) so the saved theme doesn't flash.
try {
  const saved = localStorage.getItem('theme');
  if (saved === 'light' || saved === 'dark') document.documentElement.dataset.theme = saved;
} catch { /* storage unavailable: fall back to the OS preference */ }
