const DEFAULT_API_BASE = "http://localhost:3000";
const apiBaseInput = document.getElementById("apiBaseUrl");
const apiTokenInput = document.getElementById("apiToken");
const status = document.getElementById("status");
const saveButton = document.getElementById("save");

function showStatus(message) {
  status.textContent = message;
  setTimeout(() => {
    status.textContent = "";
  }, 2000);
}

async function restoreOptions() {
  const result = await chrome.storage.sync.get({
    apiBaseUrl: DEFAULT_API_BASE,
    apiToken: ""
  });

  apiBaseInput.value = result.apiBaseUrl || DEFAULT_API_BASE;
  apiTokenInput.value = result.apiToken || "";
}

async function saveOptions() {
  const apiBaseUrl = apiBaseInput.value.trim() || DEFAULT_API_BASE;
  const apiToken = apiTokenInput.value.trim();

  await chrome.storage.sync.set({ apiBaseUrl, apiToken });
  showStatus("Saved.");
}

document.addEventListener("DOMContentLoaded", restoreOptions);
saveButton.addEventListener("click", saveOptions);
