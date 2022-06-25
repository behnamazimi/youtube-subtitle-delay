'use strict';

const messagingUtils = (function () {

  function sendMessageToCurrentTab(body) {
    chrome.tabs.query({currentWindow: true, active: true}, (tabs) => {
      if (tabs && tabs[0])
        chrome.tabs.sendMessage(tabs[0].id, body);
    });
  }

  function sendGlobalMessage(body, cb) {
    chrome.runtime.sendMessage(body, cb);
  }

  return {
    sendMessageToCurrentTab,
    sendGlobalMessage,
  }
})();

const storeUtils = (function () {

  function storeOptions(data, cb) {
    chrome.storage.sync.set({"options": data}, function () {
      if (cb && typeof cb === "function") cb(data)
    });
  }

  function loadOptions(cb) {
    chrome.storage.sync.get("options", function (data) {
      if (cb && typeof cb === "function")
        cb(data)
    });
  }

  return {
    storeOptions,
    loadOptions
  }
})();

function generateOptions(optionsObj = {}) {
  let delay = optionsObj.delay
  let elementSelector = optionsObj.elementSelector || defaultSelector

  if (!delay || Number.isNaN(+delay)) {
    delay = defaultDelay
  }

  return {
    delay,
    elementSelector
  }
}

function generateBadgeText(delay) {
  if (!!delay && !Number.isNaN(+delay)) {
    return delay + "s"
  }
  return ""
}