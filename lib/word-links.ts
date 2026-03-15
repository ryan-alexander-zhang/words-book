export type WordLink = {
  label: string;
  href: string;
};

export const WORD_LINKS: WordLink[] = [
  {
    label: "Vocabulary.com",
    href: "https://www.vocabulary.com/dictionary/{name}"
  },
  {
    label: "Dictionary.com",
    href: "https://www.dictionary.com/browse/{name}"
  },
  {
    label: "Youdao",
    href: "https://www.youdao.com/result?word={name}&lang=en"
  },
  {
    label: "Collins",
    href: "https://www.collinsdictionary.com/dictionary/english/{name}"
  }
];

export const YOUGLISH_ACCENTS = [
  { label: "American", value: "us" },
  { label: "British", value: "uk" },
  { label: "Australian", value: "aus" }
] as const;

export function resolveHref(template: string, name: string) {
  const encodedName = encodeURIComponent(name);
  return template.replaceAll("{name}", encodedName);
}

export function resolveYouglishPronounceHref(
  name: string,
  accent: (typeof YOUGLISH_ACCENTS)[number]["value"]
) {
  const encodedName = encodeURIComponent(name);
  return `https://youglish.com/pronounce/${encodedName}/english/${encodeURIComponent(accent)}`;
}
