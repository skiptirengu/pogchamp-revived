// ==UserScript==
// @name            PogChamp Revived
// @description     Good old PogChamp, back for all your pogchamping needs
// @namespace       org.champ.pog
// @include         *://www.twitch.tv/*
// @include         *://twitch.tv/*
// @grant           none
// @version         1.68.419
// @author          midnight_pretender
// @downloadURL     https://raw.githubusercontent.com/skiptirengu/pogchamp-revived/master/index.user.js
// @updateURL       https://gitcdn.xyz/cdn/skiptirengu/pogchamp-revived/master/index.user.js
// @homepageURL     https://github.com/skiptirengu/pogchamp-revived
// @run-at          document-end
// ==/UserScript==

(function () {
  const PogChampions = Object.freeze({
    Size1x: "https://i.imgur.com/UAiFfHS.png",
    Size2x: "https://i.imgur.com/2eLT50W.png",
    Size4x: "https://i.imgur.com/JdTFJzc.png",
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
   * @param {HTMLImageElement} element
   */
  function replaceEmoteImageSource(element) {
    if (element.src !== PogChampions.Size1x) {
      element.src = PogChampions.Size1x;
    }
    if (element.srcset !== PogChampionsSourceSet) {
      element.srcset = PogChampionsSourceSet;
    }
  }

  /**
   * @param {HTMLElement} element
   */
  function tryReplaceChatLineNode(element) {
    if (element === null) return;

    const emoteElements = element.querySelectorAll(Selectors.PogChamp);
    if (!emoteElements || !emoteElements.length) return;

    emoteElements.forEach((emote) => replaceEmoteImageSource(emote));
    return true;
  }

  /**
   * @param {HTMLElement} element
   */
  function isChatLineElement(element) {
    return (
      element.classList &&
      element.classList.value.toLowerCase().includes(Selectors.ChatLineMessage)
    );
  }

  /**
   * @param {MutationRecord} mutation
   */
  function replaceChatLineNodes(mutation) {
    /** @type {HTMLElement} */
    let element = mutation.target;

    if (isChatLineElement(element)) {
      return tryReplaceChatLineNode(element);
    }

    mutation.addedNodes.forEach((node) => {
      element = node;

      if (isChatLineElement(element)) {
        return tryReplaceChatLineNode(node);
      }
    });
  }

  /**
   * @param {MutationRecord} mutation
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
      if (dispatcher(mutation, observer) === true) break;
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
        "[PogChamp Revived] unable to load chat container",
        { childList: true, subtree: true }
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
