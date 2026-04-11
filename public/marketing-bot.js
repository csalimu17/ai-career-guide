(() => {
  const config = {
    apiPath: "/api/marketing-bot",
    brandName: "Dan | AI Career Guide",
    title: "Need help choosing the right tool?",
    greeting:
      "Hi! I'm Dan, your AI Career Guide. I can help you improve your CV, increase ATS fit, or plan your next career move. What's on your mind today?",
    quickActions: [
      "Help me pick a tool",
      "Improve my ATS score",
      "Fix my CV copy",
      "Plan my AI career path",
    ],
    ...window.AICareerGuideBotConfig,
  };

  const state = {
    open: false,
    sending: false,
    previousResponseId: null,
    sessionId: `acg_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
  };

  const MOBILE_BREAKPOINT = 768;
  const hidePaths = [
    "/signup",
    "/login",
    "/forgot-password",
    "/reset-password",
    "/qa",
    "/workspace",
    "/dashboard",
    "/editor",
    "/resumes",
    "/jobs",
    "/ats",
    "/tracker",
    "/cover-letters",
    "/chat",
    "/onboarding",
    "/settings",
  ];

  const styles = `
    .acg-bot-root { 
      position: fixed; 
      right: 20px; 
      bottom: max(20px, calc(env(safe-area-inset-bottom) + 20px)); 
      z-index: 9999; 
      font-family: 'Plus Jakarta Sans', Inter, sans-serif; 
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 12px;
    }
    .acg-bot-button { 
      border: 0; 
      border-radius: 999px; 
      padding: 8px 20px 8px 8px !important; 
      cursor: pointer; 
      background: linear-gradient(135deg, #6558f5, #f97316); 
      color: #fff; 
      font-size: 14px; 
      font-weight: 600;
      box-shadow: 0 8px 24px rgba(101, 88, 245, 0.3); 
      display: flex; 
      align-items: center; 
      justify-content: center;
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .acg-bot-button:hover { transform: scale(1.05) translateY(-2px); box-shadow: 0 12px 32px rgba(101, 88, 245, 0.4); }
    .acg-bot-button:active { transform: scale(0.95); }
    
    .acg-bot-fab-avatar { width: 36px; height: 36px; border-radius: 50%; margin-right: 10px; border: 2px solid rgba(255,255,255,0.2); background: #f3f4f6; }
    
    .acg-bot-panel { 
      width: 380px; 
      height: 600px; 
      max-height: calc(100vh - 120px); 
      background: #fff; 
      border-radius: 20px; 
      overflow: hidden; 
      box-shadow: 0 20px 50px rgba(0,0,0,0.15); 
      display: none; 
      flex-direction: column; 
      opacity: 0;
      transform: translateY(20px) scale(0.95);
      transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      border: 1px solid rgba(0,0,0,0.05);
    }
    .acg-bot-panel.open { 
      display: flex; 
      opacity: 1;
      transform: translateY(0) scale(1);
    }
    
    .acg-bot-header { 
      padding: 16px 20px; 
      background: linear-gradient(135deg, #6558f5, #f97316); 
      color: #fff; 
      display: flex; 
      align-items: center; 
      gap: 12px; 
      position: relative;
    }
    .acg-bot-header-avatar { width: 44px; height: 44px; border-radius: 12px; object-fit: cover; border: 1px solid rgba(255,255,255,0.2); background: #fff; }
    .acg-bot-header-titles { flex: 1; }
    .acg-bot-header-title { font-size: 15px; font-weight: 700; margin: 0 0 2px; line-height: 1.2; }
    .acg-bot-header-copy { font-size: 12px; opacity: .9; margin: 0; }
    
    .acg-bot-close-x {
      background: rgba(255,255,255,0.15);
      border: 0;
      color: #fff;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 18px;
      transition: background 0.2s;
    }
    .acg-bot-close-x:hover { background: rgba(255,255,255,0.25); }

    .acg-bot-messages { flex: 1; overflow-y: auto; padding: 20px; background: #fff; scroll-behavior: smooth; }
    .acg-bot-msg { max-width: 85%; padding: 12px 16px; border-radius: 16px; margin: 0 0 16px; font-size: 14px; line-height: 1.5; white-space: pre-wrap; animation: acgFadeIn 0.3s ease-out forwards; }
    @keyframes acgFadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    
    .acg-bot-msg.assistant { background: #f3f4f6; color: #1f2937; border-bottom-left-radius: 4px; }
    .acg-bot-msg.user { background: #6558f5; color: #fff; margin-left: auto; border-bottom-right-radius: 4px; }
    
    .acg-bot-actions { display: flex; flex-wrap: wrap; gap: 8px; margin: 0 0 16px; }
    .acg-bot-chip, .acg-bot-cta { 
      border: 1.5px solid #e5e7eb; 
      background: #fff; 
      color: #374151; 
      border-radius: 99px; 
      padding: 7px 14px; 
      cursor: pointer; 
      font-size: 13px; 
      font-weight: 500;
      transition: all 0.2s;
    }
    .acg-bot-chip:hover { border-color: #6558f5; color: #6558f5; background: #f5f3ff; }
    .acg-bot-cta { background: #f97316; color: #fff; border-color: #f97316; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; }
    .acg-bot-cta:hover { opacity: 0.9; transform: translateY(-1px); }

    .acg-bot-footer { border-top: 1px solid #f3f4f6; background: #fff; padding: 16px; }
    .acg-bot-row { display: flex; gap: 10px; }
    .acg-bot-input { flex: 1; border: 1.5px solid #e5e7eb; border-radius: 12px; padding: 10px 14px; font-size: 14px; transition: border-color 0.2s; }
    .acg-bot-input:focus { outline: 0; border-color: #6558f5; }
    .acg-bot-send { border: 0; border-radius: 12px; padding: 0 16px; cursor: pointer; background: #6558f5; color: #fff; font-size: 14px; font-weight: 600; transition: background 0.2s; }
    .acg-bot-send:hover { background: #4f46e5; }
    
    .acg-bot-input:disabled, .acg-bot-send:disabled, .acg-bot-chip:disabled { opacity: .6; cursor: not-allowed; }
    .acg-bot-hidden { display: none !important; }

    @media (max-width: 767px) {
      .acg-bot-root {
        right: 12px;
        left: auto;
        bottom: max(12px, calc(env(safe-area-inset-bottom) + 12px));
        gap: 10px;
      }
      .acg-bot-button {
        align-self: flex-end;
        width: 58px;
        height: 58px;
        padding: 0 !important;
        border-radius: 999px;
        box-shadow: 0 14px 32px rgba(101, 88, 245, 0.26);
      }
      .acg-bot-button span {
        display: none;
      }
      .acg-bot-fab-avatar {
        width: 42px;
        height: 42px;
        margin-right: 0;
      }
      .acg-bot-panel {
        width: min(calc(100vw - 24px), 400px);
        height: min(72vh, 620px);
        max-height: calc(100vh - 96px);
        border-radius: 24px;
      }
    }

    @media (max-width: 500px) {
      .acg-bot-root { right: 16px; bottom: 16px; left: 16px; align-items: stretch; }
      .acg-bot-panel { width: 100%; height: calc(100vh - 120px); max-height: none; }
      .acg-bot-button { align-self: flex-end; }
    }
  `;

  const root = document.createElement("div");
  root.className = "acg-bot-root";

  const styleTag = document.createElement("style");
  styleTag.textContent = styles;
  document.head.appendChild(styleTag);

  const panel = document.createElement("div");
  panel.className = "acg-bot-panel";

  const button = document.createElement("button");
  button.className = "acg-bot-button";
  button.type = "button";
  button.setAttribute("aria-label", "Ask Dan");
  button.setAttribute("title", "Ask Dan");
  button.innerHTML = `
    <img src="/dan-avatar.png" class="acg-bot-fab-avatar" alt="Dan" />
    <span>Ask Dan</span>
  `;

  panel.innerHTML = `
    <div class="acg-bot-header">
      <img src="/dan-avatar.png" class="acg-bot-header-avatar" alt="Dan" />
      <div class="acg-bot-header-titles">
        <p class="acg-bot-header-title">${escapeHtml(config.title)}</p>
        <p class="acg-bot-header-copy">Personal Assistant: Dan</p>
      </div>
      <button class="acg-bot-close-x" type="button" aria-label="Close">&times;</button>
    </div>
    <div class="acg-bot-messages" id="acg-bot-messages"></div>
    <div class="acg-bot-footer">
      <div class="acg-bot-row">
        <input class="acg-bot-input" id="acg-bot-input" placeholder="Type your question..." />
        <button class="acg-bot-send" id="acg-bot-send" type="button">Send</button>
      </div>
    </div>
  `;

  root.appendChild(panel);
  root.appendChild(button);
  document.body.appendChild(root);

  function isMobileViewport() {
    return window.innerWidth < MOBILE_BREAKPOINT;
  }

  function hasVisibleBottomDock() {
    const selectors = [
      "nav.fixed.bottom-0",
      "nav.fixed.inset-x-0.bottom-0",
      ".fixed.bottom-0",
      "[data-mobile-bottom-nav]",
      "[data-sticky-mobile-actions]",
    ];

    return selectors.some((selector) =>
      Array.from(document.querySelectorAll(selector)).some((element) => {
        if (!(element instanceof HTMLElement) || element === root || root.contains(element)) {
          return false;
        }

        const styles = window.getComputedStyle(element);
        if (styles.display === "none" || styles.visibility === "hidden" || styles.position !== "fixed") {
          return false;
        }

        const rect = element.getBoundingClientRect();
        return rect.height >= 48 && rect.bottom >= window.innerHeight - 4 && rect.top <= window.innerHeight - 32;
      }),
    );
  }

  function isHiddenPathname(pathname) {
    return hidePaths.some((path) => pathname === path || pathname.startsWith(path + "/"));
  }

  function updateVisibility() {
    const shouldHide = isMobileViewport() && (isHiddenPathname(window.location.pathname) || hasVisibleBottomDock());

    if (shouldHide) {
      closePanel();
      root.classList.add("acg-bot-hidden");
    } else {
      root.classList.remove("acg-bot-hidden");
    }
  }

  // Initial check
  updateVisibility();

  // Re-check on navigation (MutationObserver on body to detect Next.js client-side route changes)
  let lastPathname = window.location.pathname;
  const observer = new MutationObserver(() => {
    if (window.location.pathname !== lastPathname) {
      lastPathname = window.location.pathname;
      updateVisibility();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  const originalPushState = window.history.pushState;
  const originalReplaceState = window.history.replaceState;
  window.history.pushState = function (...args) {
    const result = originalPushState.apply(this, args);
    window.requestAnimationFrame(updateVisibility);
    return result;
  };
  window.history.replaceState = function (...args) {
    const result = originalReplaceState.apply(this, args);
    window.requestAnimationFrame(updateVisibility);
    return result;
  };

  // Fallback for browser back/forward
  window.addEventListener('popstate', updateVisibility);
  window.addEventListener("resize", updateVisibility);
  window.addEventListener("orientationchange", updateVisibility);

  const messagesEl = panel.querySelector("#acg-bot-messages");
  const inputEl = panel.querySelector("#acg-bot-input");
  const sendEl = panel.querySelector("#acg-bot-send");

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function scrollToBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function appendMessage(role, text) {
    const el = document.createElement("div");
    el.className = `acg-bot-msg ${role}`;
    el.textContent = text;
    messagesEl.appendChild(el);
    scrollToBottom();
    return el;
  }

  function appendActionButtons(labels) {
    const wrap = document.createElement("div");
    wrap.className = "acg-bot-actions";
    labels.forEach((label) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "acg-bot-chip";
      chip.textContent = label;
      chip.addEventListener("click", () => sendMessage(label));
      wrap.appendChild(chip);
    });
    messagesEl.appendChild(wrap);
    scrollToBottom();
  }

  function appendCtas(actions) {
    if (!Array.isArray(actions) || !actions.length) return;
    const wrap = document.createElement("div");
    wrap.className = "acg-bot-actions";

    actions.forEach((action) => {
      if (!action || action.type !== "cta") return;
      const link = document.createElement("a");
      link.className = "acg-bot-cta";
      link.href = action.url;
      link.textContent = action.label;
      link.addEventListener("click", () => {
        window.dispatchEvent(
          new CustomEvent("aicareerguide-bot:cta-click", {
            detail: {
              sessionId: state.sessionId,
              previousResponseId: state.previousResponseId,
              action,
            },
          }),
        );
      });
      wrap.appendChild(link);
    });

    messagesEl.appendChild(wrap);
    scrollToBottom();
  }

  function setSendingState(isSending) {
    state.sending = isSending;
    inputEl.disabled = isSending;
    sendEl.disabled = isSending;
    sendEl.textContent = isSending ? "Sending..." : "Send";
  }

  async function sendMessage(text) {
    const trimmed = String(text || "").trim();
    if (!trimmed || state.sending) return;

    setSendingState(true);
    inputEl.value = "";
    appendMessage("user", trimmed);
    const typingEl = appendMessage("assistant", "Thinking...");
    let timeoutId = null;

    try {
      const controller = new AbortController();
      timeoutId = window.setTimeout(() => controller.abort(), 20000);
      const response = await fetch(config.apiPath, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          message: trimmed,
          previousResponseId: state.previousResponseId,
          sessionId: state.sessionId,
          page: {
            path: window.location.pathname,
            title: document.title,
            url: window.location.href,
            referrer: document.referrer || "",
          },
        }),
      });
      if (timeoutId) {
        window.clearTimeout(timeoutId);
        timeoutId = null;
      }

      const raw = await response.text();
      let data = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        data = {
          reply: raw || "Sorry, the assistant returned an unreadable response.",
          actions: [],
        };
      }
      typingEl.remove();

      if (!response.ok) {
        appendMessage("assistant", data.reply || data.error || "Something went wrong.");
        return;
      }

      if (data.responseId) {
        state.previousResponseId = data.responseId;
      }

      appendMessage("assistant", data.reply || "How can I help next?");
      appendCtas(data.actions || []);

      if (data.leadSaved) {
        window.dispatchEvent(
          new CustomEvent("aicareerguide-bot:lead-saved", {
            detail: {
              sessionId: state.sessionId,
              previousResponseId: state.previousResponseId,
            },
          }),
        );
      }
    } catch (error) {
      typingEl.remove();
      appendMessage("assistant", "The assistant is taking longer than expected. You can try again now or use the suggested next step.");
      console.error("[marketing-bot]", error);
    } finally {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
      setSendingState(false);
      inputEl.focus();
    }
  }

  function openPanel() {
    state.open = true;
    panel.classList.add("open");
    inputEl.focus();

    if (!messagesEl.dataset.initialised) {
      messagesEl.dataset.initialised = "1";
      appendMessage("assistant", config.greeting);
      appendActionButtons(config.quickActions);
    }
  }

  function closePanel() {
    state.open = false;
    panel.classList.remove("open");
  }

  button.addEventListener("click", () => {
    if (state.open) closePanel();
    else openPanel();
  });

  const closeButton = panel.querySelector(".acg-bot-close-x");
  if (closeButton) {
    closeButton.addEventListener("click", (e) => {
      e.stopPropagation();
      closePanel();
    });
  }

  sendEl.addEventListener("click", () => sendMessage(inputEl.value));
  inputEl.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      sendMessage(inputEl.value);
    }
  });
})();
