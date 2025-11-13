// Utility functions extracted for testing

export const normalizeText = (str: string) => {
  return str.toLowerCase()
    .replace(/[.,;:!?()\[\]{}"']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

export const generateNgrams = (text: string) => {
  const normalizedText = normalizeText(text);
  const words = normalizedText.split(' ');
  const bigrams = words.slice(0, -1).map((word, i) => `${word} ${words[i + 1]}`);
  const trigrams = words.slice(0, -2).map((word, i) => `${word} ${words[i + 1]} ${words[i + 2]}`);
  return { words, bigrams, trigrams, allNgrams: [...words, ...bigrams, ...trigrams] };
};

export const getEditDistance = (str1: string, str2: string): number => {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0]![i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j]![0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j]![i] = Math.min(
        matrix[j]![i - 1]! + 1,
        matrix[j - 1]![i]! + 1,
        matrix[j - 1]![i - 1]! + indicator
      );
    }
  }
  
  return matrix[str2.length]![str1.length]!;
};