const DEFAULT_API_BASE = "http://localhost:3000";
const input = document.getElementById("apiBaseUrl");
const status = document.getElementById("status");
const saveButton = document.getElementById("save");

function showStatus(message) {
  status.textContent = message;
  setTimeout(() => {
    status.textContent = "";
  }, 2000);
}

async function restoreOptions() {
  const result = await chrome.storage.sync.get({ apiBaseUrl: DEFAULT_API_BASE });
  input.value = result.apiBaseUrl || DEFAULT_API_BASE;
}

async function saveOptions() {
  const value = input.value.trim() || DEFAULT_API_BASE;
  await chrome.storage.sync.set({ apiBaseUrl: value });
  showStatus("Saved.");
}

document.addEventListener("DOMContentLoaded", restoreOptions);
saveButton.addEventListener("click", saveOptions);
