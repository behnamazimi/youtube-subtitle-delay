'use strict';

chrome.runtime.onMessage.addListener(handleMessages)
document.addEventListener("DOMContentLoaded", init)
document.addEventListener("keyup", handleKeyup)

const {sendGlobalMessage} = messagingUtils;

let options = null;
let subtitleElm = null;
let delayedSubtitleElm = null;
let toastVisibilityInterval = null;

const orgElmObserver = new MutationObserver((mutationsList) => {
  for (const mutation of mutationsList) {
    // get the width of the first element of subtitleElm
    updateDelayedSubtitle(subtitleElm.innerHTML, subtitleElm.getAttribute("style"))
  }
})

function init() {
  sendGlobalMessage({action: globalActions.INIT}, (res) => {
    options = res.options
    startObservation();
  })
}

function startObservation() {

  if (delayedSubtitleElm) {
    delayedSubtitleElm.remove()
    delayedSubtitleElm = null
  }

  let checkCount = 0
  showToast("Looking for the subtitle mechanism...", 0)

  // find original subtitle element on the document
  // and clone it within its parent
  // and start observe
  let checkElementInterval = setInterval(() => {
    checkCount++;
    subtitleElm = document.querySelector(options.elementSelector)
    if (subtitleElm && !delayedSubtitleElm) {
      delayedSubtitleElm = subtitleElm.cloneNode(true)
      delayedSubtitleElm.id = delayedSubtitleElm.id + "-delayed"
      delayedSubtitleElm.classList.add("delayed")
      subtitleElm.parentNode.insertBefore(delayedSubtitleElm, subtitleElm)
      orgElmObserver.observe(subtitleElm, {attributes: true, childList: true, subtree: true});

      // add style to hide original styles
      let style = document.createElement("style")
      style.innerText = `body ${options.elementSelector}:not(.delayed) *{display:none!important;text-shadow:none!important;color:transparent!important}`
      document.head.appendChild(style)

      clearInterval(checkElementInterval)
      if (!!+options.delay) {
        showToast(`Subtitle delay set as ${options.delay} sec !`)
      } else {
        showToast("Delay functionality added :)")
      }
    }

    // in the case of not finding the subtitle element
    if (checkCount > 5 && !delayedSubtitleElm) {
      clearInterval(checkElementInterval)
      showToast("Could not find the subtitle mechanism, maybe it's not available for this content!", 5000)
    }
  }, 2000)
}

function updateDelayedSubtitle(nextContent, nextStyles) {
  let delay = (+options.delay * 1000) || 0

  setTimeout(() => {
    delayedSubtitleElm.innerHTML = nextContent.replaceAll("translateY", "translateYFake");
    delayedSubtitleElm.setAttribute("style", nextStyles)
    delayedSubtitleElm.firstChild.id = ""

    delayedSubtitleElm.firstChild.style.width = `calc(${subtitleElm.clientWidth}px - ${delayedSubtitleElm.firstChild.style.left} + 50px)`;
  }, delay);
}

function handleMessages(data) {
  if (data.action === globalActions.OPTIONS_UPDATE) {
    options = data.options
    if (!+options.delay) {
      showToast(`No subtitle delay!`)
    } else {
      showToast(`Subtitle delay set as ${options.delay} sec !`)
    }
  }
}

function handleKeyup(e) {
  const tagName = e.path && e.path[0].tagName;
  if (tagName && ["input", "textarea"].includes(tagName.toLowerCase())) {
    return;
  }

  let updatedDelay = null
  if (e.key === options.decDelayKey) {
    updatedDelay = +options.delay - 0.2
  } else if (e.key === options.incDelayKey) {
    updatedDelay = +options.delay + 0.2
  }

  if (updatedDelay !== null) {
    sendGlobalMessage({
      action: globalActions.SET_OPTIONS,
      options: {
        ...options,
        delay: Math.min(5, Math.max(0, updatedDelay.toFixed(1)))
      }
    })
  }
}

function showToast(msg, hideDelay = 3000) {
  if (!msg) return

  let msgElm = document.getElementById("dyst-toast")
  if (!msgElm) {
    msgElm = document.createElement("div")
    msgElm.setAttribute("id", "dyst-toast")
    msgElm.classList.add("dyst-toast")
  }
  msgElm.innerText = msg;

  // append as a sibling of delayed element or as an element of body
  (delayedSubtitleElm?.parentNode || document.body).appendChild(msgElm)
  if (delayedSubtitleElm?.parentNode) {
    msgElm.classList.add("on-video")
  }

  if (!hideDelay) {
    return msgElm
  }

  if (toastVisibilityInterval) {
    clearTimeout(toastVisibilityInterval)
  }

  toastVisibilityInterval = setTimeout(() => {
    msgElm.remove()
    msgElm = null
  }, hideDelay)
}

// start subtitle observation on url change
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    startObservation()
  }
}).observe(document, {childList: true, subtree: true});

