'use strict';

const {sendGlobalMessage} = messagingUtils;

let saveBtn = document.getElementById('save-btn');
let delayInput = document.getElementById("delay")
let decDelaySkElm = document.getElementById("dec-delay-sk")
let incDelaySkElm = document.getElementById("inc-delay-sk")
let currentOptions = {}
// let selectorInput = document.getElementById("elementSelector")

// find active tab and init popup
getActiveTabInfo(() => {
  initPopup();
})

saveBtn.onclick = updateOptions.bind(null, window.close)

decDelaySkElm.onclick = onShortcutElmClick
incDelaySkElm.onclick = onShortcutElmClick

decDelaySkElm.oninput = onShortcutElmInputChange
incDelaySkElm.oninput = onShortcutElmInputChange
decDelaySkElm.onblur = function () {
  if (!this.innerText) {
    this.innerText = currentOptions.decDelayKey
  }
}
incDelaySkElm.onblur = function () {
  if (!this.innerText) {
    this.innerText = currentOptions.incDelayKey
  }
}

function initPopup() {
  sendGlobalMessage({action: globalActions.POPUP_INIT}, ({options = {}}) => {
    currentOptions = options
    delayInput.value = options.delay || defaultDelay
    decDelaySkElm.innerText = options.decDelayKey || "a"
    incDelaySkElm.innerText = options.incDelayKey || "d"

    // selectorInput.value = options.elementSelector || defaultSelector
  });
}

function getActiveTabInfo(cb) {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    const activeTab = tabs ? tabs[0] : {};
    cb && typeof cb === "function" && cb(activeTab)
  });
}

function onShortcutElmClick() {
  this.setAttribute("contentEditable", "true")
  this.innerText = ""
  this.focus()
}

function onShortcutElmInputChange() {
  this.innerText = this.innerText.trim().toUpperCase()

  if (this.innerText.length > 1)
    this.innerText = this.innerText.substring(0, 1)
  this.removeAttribute("contentEditable")

  if (!!this.innerText) {
    updateOptions()
  }
}

function updateOptions(cb) {
  let delay = delayInput.value
  let decDelayKey = decDelaySkElm.innerText.toLowerCase()
  let incDelayKey = incDelaySkElm.innerText.toLowerCase()
  // let elementSelector = selectorInput.value

  let options = {
    delay,
    decDelayKey,
    incDelayKey
  }
  sendGlobalMessage({action: globalActions.SET_OPTIONS, options}, (savedOptions) => {
    currentOptions = savedOptions
    if (cb) cb()
  })
}