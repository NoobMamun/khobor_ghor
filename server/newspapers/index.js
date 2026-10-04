// Newspaper registry. To add a paper: create a config file next to this one
// (see prothom-alo.js / daily-star.js) and add it to the list below.
// Nothing else in the server or the UI needs to change.
import prothomAlo from './prothom-alo.js';
import dailyStar from './daily-star.js';

export const newspapers = [prothomAlo, dailyStar];
// export const newspapers = [prothomAlo, dailyStar, ittefaq, jugantor, ...];

export const getNewspaper = (id) => newspapers.find((n) => n.id === id);

// Public (browser-safe) description of each newspaper.
export const publicInfo = (n) => ({
  id: n.id,
  name: n.name,
  nativeName: n.nativeName,
  language: n.language,
  logo: n.logo,
  monogram: n.monogram,
  brandColor: n.brandColor,
  homepage: n.homepage,
});
