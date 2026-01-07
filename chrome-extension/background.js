const DEFAULT_API_BASE = "http://localhost:3000";
const MENU_ID = "words-book-add";

function normalizeSelection(text) {
  if (!text) return null;
  const trimmed = text.trim();
  if (!trimmed) return null;
  const wordMatch = trimmed.match(/[A-Za-zÀ-ÖØ-öø-ÿ'-]+/);
  const word = wordMatch ? wordMatch[0] : trimmed.split(/\s+/)[0];
  return word ? word.toLowerCase() : null;
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
    id: MENU_ID,
    title: "Add to Words Book",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId !== MENU_ID) return;
  const word = normalizeSelection(info.selectionText || "");
  if (!word) return;

  try {
    await addWordToBook(word);
    console.log(`Saved word: ${word}`);
  } catch (error) {
    console.error("Failed to save word", error);
  }
});
