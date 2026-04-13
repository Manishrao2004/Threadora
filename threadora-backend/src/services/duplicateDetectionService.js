const Thread = require('../models/Thread');

// Common English stop words filtered out before similarity comparison.
// Words that carry no topical meaning are excluded so the Jaccard score
// reflects actual subject-matter overlap rather than structural phrasing.
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'about', 'as',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
  'will', 'would', 'shall', 'should', 'can', 'could', 'may', 'might', 'must',
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'your', 'my', 'their', 'our',
  'what', 'how', 'why', 'who', 'when', 'where', 'which', 'this', 'that', 'these', 'those', 'there', 'here',
  'just', 'still', 'new', 'latest', 'some', 'any', 'all', 'from', 'into', 'very', 'much', 'many', 'so',
  'its', 'like', 'looks', 'currently', 'writing', 'searching', 'effective', 'ways', 'regarding',
  'thoughts', 'apps', 'am', 'think', 'thing', 'things', 'lot', 'really', 'also', 'got', 'get',
  'ig', 'lol', 'yeah', 'yes', 'no', 'not', 'been', 'going', 'went', 'need', 'want'
]);

// Lightweight suffix stemmer. Handles the most common English inflections
// without the overhead of a full Porter stemmer library.
const stemWord = (word) => {
  if (word.length > 5 && word.endsWith('ing')) return word.slice(0, -3);
  if (word.length > 4 && word.endsWith('ies')) return word.slice(0, -3) + 'y';
  if (word.length > 4 && word.endsWith('ed'))  return word.slice(0, -2);
  if (word.length > 3 && word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1);
  return word;
};

// Tokenises, lowercases, removes punctuation, filters stop words, and stems.
const normalize = (str) =>
  str.toLowerCase()
     .replace(/[^\w\s]/g, '')
     .split(/\s+/)
     .filter(w => w.length > 1 && !STOP_WORDS.has(w))
     .map(stemWord);

/**
 * Computes the Jaccard similarity coefficient between two strings.
 * Returns 1.0 for two empty strings (trivially identical) and 0.0
 * when only one is empty.
 */
const calculateSimilarity = (str1, str2) => {
  const set1 = new Set(normalize(str1));
  const set2 = new Set(normalize(str2));

  if (set1.size === 0 && set2.size === 0) return 1.0;
  if (set1.size === 0 || set2.size === 0) return 0.0;

  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union        = new Set([...set1, ...set2]);

  return intersection.size / union.size;
};

/**
 * Fetches the 200 most recent visible threads and returns those whose title
 * is at least `threshold` similar to the candidate title.
 *
 * Searching only recent threads keeps the check fast; the 200-doc window is
 * large enough to catch near-duplicates without a full-collection scan.
 * Only the top 5 matches are returned to keep the UI response concise.
 *
 * @param  {string} title     - The candidate thread title to check against
 * @param  {number} threshold - Minimum Jaccard score to flag as a duplicate (default 0.45)
 * @returns {Array}           - Array of similar Thread documents (at most 5)
 */
const checkDuplicates = async (title, threshold = 0.45) => {
  try {
    const recentThreads = await Thread.find({ isHidden: false })
      .sort({ createdAt: -1 })
      .limit(200)
      .populate('authorId',   'username')
      .populate('categoryId', 'name');

    return recentThreads
      .map(thread => ({ thread, score: calculateSimilarity(title, thread.title) }))
      .filter(item  => item.score >= threshold)
      .sort((a, b)  => b.score - a.score)
      .slice(0, 5)
      .map(item => item.thread);
  } catch (error) {
    console.error('duplicateDetectionService error:', error);
    throw error;
  }
};

module.exports = { checkDuplicates, calculateSimilarity };
