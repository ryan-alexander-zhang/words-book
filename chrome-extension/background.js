const DEFAULT_API_BASE = "http://localhost:3000";
const MENU_ROOT_ID = "words-book-root";
const MENU_ADD_ID = "words-book-add";
const LINK_PREFIX = "words-book-link-";
const WORD_LINKS = [
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

function normalizeSelection(text) {
  if (!text) return null;
  const trimmed = text.trim();
  if (!trimmed) return null;
  const wordMatch = trimmed.match(/[A-Za-zÀ-ÖØ-öø-ÿ'-]+/);
  const word = wordMatch ? wordMatch[0] : trimmed.split(/\s+/)[0];
  return word ? word.toLowerCase() : null;
}

function resolveHref(template, name) {
  const encodedName = encodeURIComponent(name);
  return template.replaceAll("{name}", encodedName);
}

async function getApiBase() {
  const result = await chrome.storage.sync.get({ apiBaseUrl: DEFAULT_API_BASE });
  return result.apiBaseUrl || DEFAULT_API_BASE;
}

async function addWordToBook(word) {
  const apiBase = await getApiBase();
  const response = await fetch(`${apiBase}/api/words`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ name: word })
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Failed to save word: ${message}`);
  }

  return response.json();
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: MENU_ROOT_ID,
    title: "Words Book",
    contexts: ["selection"]
  });

  chrome.contextMenus.create({
    id: MENU_ADD_ID,
    parentId: MENU_ROOT_ID,
    title: "Add to Words Book",
    contexts: ["selection"]
  });

  WORD_LINKS.forEach((link) => {
    chrome.contextMenus.create({
      id: `${LINK_PREFIX}${link.label.toLowerCase()}`,
      parentId: MENU_ROOT_ID,
      title: link.label,
      contexts: ["selection"]
    });
  });
});

chrome.contextMenus.onClicked.addListener(async (info) => {
  const word = normalizeSelection(info.selectionText || "");
  if (!word) return;

  if (info.menuItemId === MENU_ADD_ID) {
    try {
      await addWordToBook(word);
      console.log(`Saved word: ${word}`);
    } catch (error) {
      console.error("Failed to save word", error);
    }
    return;
  }

  if (typeof info.menuItemId === "string" && info.menuItemId.startsWith(LINK_PREFIX)) {
    const label = info.menuItemId.replace(LINK_PREFIX, "");
    const link = WORD_LINKS.find((item) => item.label.toLowerCase() === label);
    if (!link) return;
    const url = resolveHref(link.href, word);
    chrome.tabs.create({ url });
  }
});
