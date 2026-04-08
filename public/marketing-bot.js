(() => {
  const config = {
    apiPath: "/api/marketing-bot",
    brandName: "AI Career Guide",
    title: "Need help choosing the right tool?",
    greeting:
      "Hi - I can help you improve your CV, increase ATS fit, or plan your next AI career move. What are you trying to do today?",
    quickActions: [
      "Pick the right tool for me",
      "How can I improve my ATS score?",
      "Help me fix my CV",
      "Plan my next AI career move",
    ],
    ...window.AICareerGuideBotConfig,
  };

  const state = {
    open: false,
    sending: false,
    previousResponseId: null,
    sessionId: `acg_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
  };

  const styles = `
    .acg-bot-root { position: fixed; right: 20px; bottom: 20px; z-index: 9999; font-family: Inter, Arial, sans-serif; }
    .acg-bot-button { border: 0; border-radius: 999px; padding: 14px 18px; cursor: pointer; background: #111827; color: #fff; font-size: 14px; box-shadow: 0 12px 32px rgba(0,0,0,.18); }
    .acg-bot-panel { width: min(380px, calc(100vw - 24px)); height: 560px; max-height: calc(100vh - 100px); background: #fff; border: 1px solid #e5e7eb; border-radius: 18px; overflow: hidden; box-shadow: 0 24px 60px rgba(0,0,0,.18); display: none; flex-direction: column; }
    .acg-bot-panel.open { display: flex; }
    .acg-bot-header { padding: 16px; background: #111827; color: #fff; }
    .acg-bot-header-title { font-size: 15px; font-weight: 700; margin: 0 0 4px; }
    .acg-bot-header-copy { font-size: 13px; opacity: .88; margin: 0; }
    .acg-bot-messages { flex: 1; overflow: auto; padding: 14px; background: #f9fafb; }
    .acg-bot-msg { max-width: 88%; padding: 10px 12px; border-radius: 14px; margin: 0 0 10px; font-size: 14px; line-height: 1.45; white-space: pre-wrap; }
    .acg-bot-msg.assistant { background: #fff; color: #111827; border: 1px solid #e5e7eb; }
    .acg-bot-msg.user { background: #111827; color: #fff; margin-left: auto; }
    .acg-bot-actions { display: flex; flex-wrap: wrap; gap: 8px; margin: 0 0 12px; }
    .acg-bot-chip, .acg-bot-cta { border: 1px solid #d1d5db; background: #fff; color: #111827; border-radius: 999px; padding: 8px 12px; cursor: pointer; font-size: 13px; }
    .acg-bot-cta { text-decoration: none; display: inline-flex; align-items: center; }
    .acg-bot-footer { border-top: 1px solid #e5e7eb; background: #fff; padding: 12px; }
    .acg-bot-row { display: flex; gap: 8px; }
    .acg-bot-input { flex: 1; border: 1px solid #d1d5db; border-radius: 12px; padding: 10px 12px; font-size: 14px; }
    .acg-bot-send { border: 0; border-radius: 12px; padding: 10px 14px; cursor: pointer; background: #111827; color: #fff; font-size: 14px; }
    .acg-bot-input:disabled, .acg-bot-send:disabled, .acg-bot-chip:disabled { opacity: .65; cursor: not-allowed; }
    .acg-bot-note { font-size: 11px; color: #6b7280; margin-top: 8px; }
    .acg-bot-hidden { display: none !important; }
    @media (max-width: 768px) {
      .acg-bot-root { right: 12px; bottom: calc(env(safe-area-inset-bottom, 0px) + 24px); display: flex; justify-content: flex-end; }
      .acg-bot-button { max-width: min(72vw, 240px); }
      .acg-bot-panel { width: min(100%, 420px); height: min(70dvh, 560px); max-height: calc(100dvh - 132px); }
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
  button.textContent = "Ask AI Career Guide";

  panel.innerHTML = `
    <div class="acg-bot-header">
      <p class="acg-bot-header-title">${escapeHtml(config.title)}</p>
      <p class="acg-bot-header-copy">${escapeHtml(config.brandName)}</p>
    </div>
    <div class="acg-bot-messages" id="acg-bot-messages"></div>
    <div class="acg-bot-footer">
      <div class="acg-bot-row">
        <input class="acg-bot-input" id="acg-bot-input" placeholder="Type your question..." />
        <button class="acg-bot-send" id="acg-bot-send" type="button">Send</button>
      </div>
      <div class="acg-bot-note">For marketing follow-up, the bot should ask for a separate email opt-in.</div>
    </div>
  `;

  root.appendChild(panel);
  root.appendChild(button);
  document.body.appendChild(root);

  // Hide on auth/focus pages on mobile to prevent overlap with form fields or important UI
  const authPaths = ['/signup', '/login', '/forgot-password', '/reset-password', '/qa'];
  const isAuthPage = authPaths.some(path => window.location.pathname.startsWith(path));
  
  if (isAuthPage && window.innerWidth < 768) {
    root.classList.add("acg-bot-hidden");
  }

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
    button.textContent = "Close";
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
    button.textContent = "Ask AI Career Guide";
  }

  button.addEventListener("click", () => {
    if (state.open) closePanel();
    else openPanel();
  });

  sendEl.addEventListener("click", () => sendMessage(inputEl.value));
  inputEl.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      sendMessage(inputEl.value);
    }
  });
})();
