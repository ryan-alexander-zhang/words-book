const DEFAULT_API_BASE = "http://localhost:3000";
const apiBaseInput = document.getElementById("apiBaseUrl");
const apiTokenInput = document.getElementById("apiToken");
const status = document.getElementById("status");
const saveButton = document.getElementById("save");

function showStatus(message, isError = false) {
  status.style.color = isError ? "#b91c1c" : "#047857";
  status.textContent = message;
  setTimeout(() => {
    status.textContent = "";
  }, 2000);
}

function isLoopbackHost(hostname) {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

function normalizeApiBaseUrl(value) {
  try {
    const url = new URL(value);
    const isAllowedHttp = url.protocol === "http:" && isLoopbackHost(url.hostname);

    if (url.protocol !== "https:" && !isAllowedHttp) {
      return null;
    }

    return url.origin;
  } catch {
    return null;
  }
}

async function loadStoredOptions() {
  const [localResult, syncResult] = await Promise.all([
    chrome.storage.local.get(["apiBaseUrl", "apiToken"]),
    chrome.storage.sync.get(["apiBaseUrl", "apiToken"])
  ]);

  const apiBaseUrl = localResult.apiBaseUrl || syncResult.apiBaseUrl || DEFAULT_API_BASE;
  const apiToken = localResult.apiToken || syncResult.apiToken || "";

  if ((!localResult.apiBaseUrl && syncResult.apiBaseUrl) || (!localResult.apiToken && syncResult.apiToken)) {
    await chrome.storage.local.set({ apiBaseUrl, apiToken });
    await chrome.storage.sync.remove(["apiBaseUrl", "apiToken"]);
  }

  return { apiBaseUrl, apiToken };
}

async function restoreOptions() {
  const result = await loadStoredOptions();

  apiBaseInput.value = result.apiBaseUrl || DEFAULT_API_BASE;
  apiTokenInput.value = result.apiToken || "";
}

async function saveOptions() {
  const apiBaseUrl = normalizeApiBaseUrl(apiBaseInput.value.trim() || DEFAULT_API_BASE);
  const apiToken = apiTokenInput.value.trim();

  if (!apiBaseUrl) {
    showStatus("Use HTTPS for hosted deployments, or HTTP only for localhost.", true);
    return;
  }

  await chrome.storage.local.set({ apiBaseUrl, apiToken });
  await chrome.storage.sync.remove(["apiBaseUrl", "apiToken"]);
  showStatus("Saved securely on this device.");
}

document.addEventListener("DOMContentLoaded", restoreOptions);
saveButton.addEventListener("click", saveOptions);
