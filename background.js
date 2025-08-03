
chrome.webRequest.onHeadersReceived.addListener(
  (details) => {
    const isCloudflare = details.responseHeaders.some(h =>
      h.name.toLowerCase().includes("cf-") || h.value.toLowerCase().includes("cloudflare"));
    if (isCloudflare) {
      chrome.tabs.sendMessage(details.tabId, { cloudflareDetected: true });
    }
  },
  { urls: ["<all_urls>"] },
  ["responseHeaders"]
);
