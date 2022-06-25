'use strict';

const {sendGlobalMessage} = messagingUtils;

let saveBtn = document.getElementById('save-btn');
let delayInput = document.getElementById("delay")

// find active tab and init popup
getActiveTabInfo(() => {
  initPopup();
})

saveBtn.onclick = function () {
  let delay = delayInput.value

  let options = {delay}
  sendGlobalMessage({action: globalActions.SET_OPTIONS, options}, () => {
    window.close()
  })
}

function initPopup() {
  sendGlobalMessage({action: globalActions.POPUP_INIT}, ({options = {}}) => {
    delayInput.value = options.delay || defaultDelay
  });
}

function getActiveTabInfo(cb) {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    const activeTab = tabs ? tabs[0] : {};
    cb && typeof cb === "function" && cb(activeTab)
  });
}
