'use strict';

try {
  importScripts("shared/constant.js", "shared/utils.js");
} catch (e) {
  console.log(e);
}

chrome.runtime.onMessage.addListener(handleMessages)

chrome.tabs.onActivated.addListener(handleTabActivation);
chrome.tabs.onUpdated.addListener(handleTabUpdate);

chrome.runtime.onInstalled.addListener(() => {
  // store initial options
  const defaultOptions = {
    delay: 0,
    decDelayKey: "a",
    incDelayKey: "d"
  }
  storeUtils.storeOptions(generateOptions(defaultOptions));
});

function handleMessages(data, details, sendResponse) {
  switch (data.action) {
    case globalActions.INIT:
    case globalActions.POPUP_INIT:
      storeUtils.loadOptions((res) => {
        sendResponse(res);
      })
      return true;
    case globalActions.SET_OPTIONS:
      const options = generateOptions(data.options);
      storeUtils.storeOptions(options);
      messagingUtils.sendMessageToCurrentTab({
        action: globalActions.OPTIONS_UPDATE,
        options
      });
      chrome.action.setBadgeText({text: generateBadgeText(options.delay)});
      sendResponse(options);
      return true;
  }

}

function handleTabActivation(tabInfo) {
  const tabId = tabInfo.tabId || tabInfo.id;
  chrome.tabs.get(tabId, ({url} = {}) => {
    updateExtStatusInTab(tabId, url)
  })
}

function handleTabUpdate(tabId, {status}) {
  if (status === "complete")
    handleTabActivation({tabId})
}

function updateExtStatusInTab(tabId, url) {
  if (!tabId) return;

  const youtubeRegEx = /https:\/\/(www.)?youtube\.com.*/gm
  const isAllowed = !!url && youtubeRegEx.test(url)

  let iconPath = {
    "16": `icons/${isAllowed ? "" : "d_"}16x16.png`,
    "32": `icons/${isAllowed ? "" : "d_"}32x32.png`,
    "48": `icons/${isAllowed ? "" : "d_"}48x48.png`,
    "128": `icons/${isAllowed ? "" : "d_"}128x128.png`
  }

  chrome.action.disable(tabId);
  chrome.action.setBadgeText({text: ""});
  chrome.action.setBadgeBackgroundColor({color: '#6448a9'});

  if (isAllowed) {
    chrome.action.enable(tabId);
    storeUtils.loadOptions(({options = {}}) => {
      chrome.action.setBadgeText({text: generateBadgeText(options.delay)});
    })
  }

  // update icon
  chrome.action.setIcon({tabId: tabId, path: iconPath});
}
