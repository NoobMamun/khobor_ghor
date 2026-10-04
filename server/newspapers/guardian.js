// The Guardian — official RSS feeds (UK paper; included for its Bangladesh coverage plus
// world, business and opinion). `sections` is an allowlist.
const f = (path, section) => ({ url: `https://www.theguardian.com/${path}/rss`, section });

export default {
  id: 'guardian',
  name: 'The Guardian',
  nativeName: 'The Guardian',
  language: 'en',
  logo: null,
  monogram: 'G',
  brandColor: '#052962',
  homepage: 'https://www.theguardian.com',

  sections: ['bangladesh', 'world', 'business', 'opinion'],

  // Its world/business/opinion feeds are busy, so no Telegram alerts by default.
  // Set to true (or remove this line) to get alerts for it as well.
  notify: false,

  feeds: [
    f('world/bangladesh', 'bangladesh'), // listed first so Bangladesh stories win over the generic world feed
    f('world', 'world'),
    f('business', 'business'),
    f('commentisfree', 'opinion'),
  ],
};
