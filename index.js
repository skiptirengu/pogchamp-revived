// ==UserScript==
// @name            PogChamp Revived
// @description     Good old PogChamp, back for all your pogchamping needs
// @namespace       org.champ.pog
// @include         *://www.twitch.tv/*
// @include         *://twitch.tv/*
// @grant           none
// @version         1.68.419
// @author          midnight_pretender
// @downloadURL     https://raw.githubusercontent.com/skiptirengu/pogchamp-revived/master/index.js
// @updateURL       https://gitcdn.xyz/cdn/skiptirengu/pogchamp-revived/master/index.js
// @homepageURL     https://github.com/skiptirengu/pogchamp-revived
// @run-at          document-end
// ==/UserScript==

(function () {
  const PogChampions = Object.freeze({
    Size1x: "https://image.prntscr.com/image/YClI5iQ3QE6947gP5Fq-ug.png",
    Size2x: "https://image.prntscr.com/image/dIsmKUMHQL2ePixsTjMLUg.png",
    Size4x: "https://image.prntscr.com/image/ciKCrQhCRGeF1EVQwrFnYw.png",
  });

  // https://example.com/1x.png 1x,https://example.com/2x.png 2x,https://example.com/4x.png 4x
  const PogChampionsSourceSet = [
    `${PogChampions.Size1x} 1x`,
    `${PogChampions.Size2x} 2x`,
    `${PogChampions.Size4x} 4x`,
  ].join(",");

  /**
   * Twitch selectors
   */
  const Selectors = Object.freeze({
    // class name only
    ChatLineMessage: "chat-line__message",
    Chat: "div.chat-scrollable-area__message-container",
    PogChamp: "img.chat-image[alt='PogChamp']",
    EmotePopout: "div.chat-room__viewer-card > div.viewer-card-layer",
    Root: "#root",
    ChatRoom: "section.chat-room",
  });

  /**
   * @param {HTMLElement} element
   */
  function tryReplaceChatLineNode(element) {
    if (element === null) return;

    /** @type {HTMLImageElement} */
    const emoteElement = element.querySelector(Selectors.PogChamp);
    if (emoteElement === null) return;

    emoteElement.src = PogChampions.Size1x;
    emoteElement.srcset = PogChampionsSourceSet;
    return true;
  }

  /**
   * @param {NodeList} nodes
   */
  function replaceChatLineNodes(nodes) {
    nodes.forEach((node) => {
      /** @type {HTMLElement} */
      const element = node;
      if (
        element.classList &&
        element.classList.contains(Selectors.ChatLineMessage)
      ) {
        return tryReplaceChatLineNode(node);
      }
    });
  }

  /**
   * @param {NodeList} nodes
   */
  function replaceEmotePopoutNodes(nodes) {}

  /**
   * @param {MutationRecord[]} mutations
   * @param {MutationObserver} observer
   * @param {(NodeList) => any} dispatcher
   */
  function dispatchMutationForEachChild(mutations, observer, dispatcher) {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") continue;
      if (dispatcher(mutation.addedNodes, observer) === true) break;
    }
  }

  /**
   * @param {HTMLElement} element
   * @param {Function} dispatcher
   * @param {string} message
   * @param {MutationObserverInit} options
   */
  function listenToChildMutations(
    element,
    dispatcher,
    message,
    options = { childList: true }
  ) {
    if (element === null) {
      console.warn(message);
      return;
    }

    /** @type {MutationObserver} */
    const observer = new MutationObserver((mutations) =>
      dispatchMutationForEachChild(mutations, observer, dispatcher)
    );

    observer.observe(element, options);
    return observer;
  }

  /**
   * @param {NodeList} nodes
   * @param {MutationObserver} observer
   */
  function registerMutationListeners(nodes, observer) {
    const chatRoom = document.querySelector(Selectors.ChatRoom);
    console.warn("[PogChamp Revived] chat room not mounted yet");

    // Wait for the chat room component to be mounted before registering
    // the other observers
    if (chatRoom !== null) {
      console.info("[PogChamp Revived] chat room mounted! Starting observers");
      // Stop listening to changes on the root node
      // and delegate to child nodes instead
      observer.disconnect();

      // Chat message observer
      listenToChildMutations(
        chatRoom.querySelector(Selectors.Chat),
        replaceChatLineNodes,
        "[PogChamp Revived] unable to load chat container"
      );

      // Emote popout observer
      listenToChildMutations(
        chatRoom.querySelector(Selectors.EmotePopout),
        replaceEmotePopoutNodes,
        "[PogChamp Revived] unable to load emote popout container"
      );

      return true;
    }
  }

  // Wait for chat room to be mounted
  listenToChildMutations(
    document.querySelector(Selectors.Root),
    registerMutationListeners,
    "[PogChamp Revived] WTF? Not even root was mounted",
    { childList: true, subtree: true }
  );
})();
