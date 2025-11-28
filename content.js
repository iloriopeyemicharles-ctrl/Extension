// Returns the current selection to the popup on request
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "get_selected_text") {
    const text = window.getSelection().toString();
    sendResponse({ text });
  }
});
