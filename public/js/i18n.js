// UI strings follow the selected newspaper's language.
const dict = {
  bn: {
    home: 'প্রথম পাতা', topStories: 'শীর্ষ খবর', latest: 'সর্বশেষ', viewAll: 'সব দেখুন →',
    search: 'খবর খুঁজুন…', refresh: 'রিফ্রেশ', updated: 'সর্বশেষ আপডেট', loadMore: 'আরও দেখুন',
    errorTitle: 'খবর লোড করা যায়নি', errorBody: 'ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন।', retry: 'আবার চেষ্টা করুন',
    staleNotice: 'নতুন খবর আনা যায়নি। আগের খবর দেখানো হচ্ছে।',
    noResults: (q) => `“${q}” এর জন্য কিছু পাওয়া যায়নি`, noResultsHint: 'অন্য শব্দ দিয়ে চেষ্টা করুন।',
    results: (n, q) => `“${q}” — ${n.toLocaleString('bn-BD')}টি ফল`, empty: 'এই বিভাগে এখন কোনো খবর নেই।',
    readOriginal: 'মূল প্রতিবেদন পড়ুন',
  },
  en: {
    home: 'Home', topStories: 'Top Stories', latest: 'Latest News', viewAll: 'View all →',
    search: 'Search news…', refresh: 'Refresh', updated: 'Last updated', loadMore: 'Load more',
    errorTitle: "Couldn't load the news", errorBody: 'Check your connection and try again.', retry: 'Retry',
    staleNotice: "Couldn't fetch new stories. Showing earlier news.",
    noResults: (q) => `No results for “${q}”`, noResultsHint: 'Try a different keyword.',
    results: (n, q) => `${n} result${n === 1 ? '' : 's'} for “${q}”`, empty: 'No stories in this section right now.',
    readOriginal: 'Read original',
  },
};
export const t = (lang) => dict[lang] || dict.en;
