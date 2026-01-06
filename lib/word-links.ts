export type WordLink = {
  label: string;
  href: string;
};

export const WORD_LINKS: WordLink[] = [
  {
    label: "Vocabulary",
    href: "https://www.vocabulary.com/dictionary/{name}"
  },
  {
    label: "Pronounce",
    href: "https://youglish.com/pronounce/{name}/english"
  },
  {
    label: "Dictionary",
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

export function resolveHref(template: string, name: string) {
  const encodedName = encodeURIComponent(name);
  return template.replaceAll("{name}", encodedName);
}
