// Background script for BrandedQR Chrome Extension

chrome.runtime.onInstalled.addListener(() => {
  console.log('BrandedQR Extension installed');
});

// Handle action button click to open sidebar
chrome.action.onClicked.addListener((tab) => {
  // Open the side panel for the current tab
  chrome.sidePanel.open({ tabId: tab.id });
});

// Handle sidebar opening
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });