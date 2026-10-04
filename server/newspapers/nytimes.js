// The New York Times — official RSS feeds. NYT has no Bangladesh feed, so World (incl. Asia
// Pacific), Business and Opinion are used. Many articles are behind NYT's paywall; the
// portal only links to them. `sections` is an allowlist.
const f = (path, section) => ({ url: `https://rss.nytimes.com/services/xml/rss/nyt/${path}.xml`, section });

export default {
  id: 'nytimes',
  name: 'The New York Times',
  nativeName: 'The New York Times',
  language: 'en',
  logo: null,
  monogram: 'NY',
  brandColor: '#4a4a4a',
  homepage: 'https://www.nytimes.com',

  sections: ['world', 'business', 'opinion'],

  // NYT's RSS "category" is usually a topic tag (e.g. a person's name), so show the section name.
  useRssCategory: false,

  // Busy feeds: no Telegram alerts by default (set to true to enable).
  notify: false,

  feeds: [
    f('AsiaPacific', 'world'), // listed first; duplicates with World are dropped
    f('World', 'world'),
    f('Business', 'business'),
    f('Opinion', 'opinion'),
  ],
};
