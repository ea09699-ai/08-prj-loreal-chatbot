/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const sendBtn = document.getElementById("sendBtn");
// Paste the Cloudflare Worker URL from your deployment (it ends in .workers.dev).
// The OpenAI key stays in the Worker secret OPENAI_API_KEY, never in this file.
const WORKER_URL = "https://calm-snow-4f9b.ea09699.workers.dev/";
const SYSTEM_PROMPT = `You are the L'Oréal Beauty Advisor, a concise assistant for L'Oréal products and routines.
You only help with:
- L'Oréal Group products and brands (including L'Oréal Paris, Garnier, Maybelline, NYX Professional Makeup, Lancôme, Kiehl's, La Roche-Posay, CeraVe, Vichy, Yves Saint Laurent Beauté, Giorgio Armani Beauty, Urban Decay, IT Cosmetics, Essie, Redken, Kérastase, and Matrix)
- Makeup, skincare, haircare, and fragrance routines and recommendations tied to those products
- How to choose or use those products for skin type, hair type, shade, or concern
If a question is not about L'Oréal products, routines, or beauty recommendations, politely refuse in one or two sentences and invite a L'Oréal beauty question. Do not answer off-topic requests, including general knowledge, homework, coding, news, math, or other brands' products.
Remember details from earlier in the conversation, such as the user's name, skin type, hair type, shade preferences, and concerns, and use them in later replies. Keep answers warm, practical, and under 120 words. Do not claim to diagnose medical conditions; suggest a dermatologist when a concern sounds medical.`;
const messages = [{ role: "system", content: SYSTEM_PROMPT }];
addBubble(
  "ai",
  "Hello. I'm the L'Oréal Beauty Advisor. Ask me about makeup, skincare, haircare, fragrance, or a routine built from L'Oréal products."
);
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = userInput.value.trim();
  if (!text) return;
  userInput.value = "";
  addBubble("user", text);
  messages.push({ role: "user", content: text });
  if (!WORKER_URL) {
    addBubble(
      "ai",
      "The assistant is ready, but it still needs your Cloudflare Worker URL. Open script.js, set WORKER_URL to the URL from your deployment, and keep your OpenAI key only in the Worker's OPENAI_API_KEY secret."
    );
    messages.pop();
    return;
  }
  const typing = addBubble("ai", "Looking through L'Oréal routines…");
  typing.classList.add("typing");
  setBusy(true);
  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });
    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content?.trim();
    typing.remove();
    if (!reply) {
      const detail =
        data?.error?.message ||
        "I couldn't get a reply. Check that the Worker is deployed and OPENAI_API_KEY is set.";
      addBubble("ai", detail);
      messages.pop();
      return;
    }
    messages.push({ role: "assistant", content: reply });
    addBubble("ai", reply);
  } catch (error) {
    typing.remove();
    messages.pop();
    addBubble(
      "ai",
      "I couldn't reach the L'Oréal assistant. Confirm the Cloudflare Worker URL and try again."
    );
  } finally {
    setBusy(false);
    userInput.focus();
  }
});
function addBubble(role, text) {
  const row = document.createElement("div");
  row.className = `msg ${role}`;
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  const label = document.createElement("span");
  label.className = "msg-label";
  label.textContent = role === "user" ? "You asked" : "L'Oréal";
  const body = document.createElement("p");
  body.textContent = text;
  bubble.append(label, body);
  row.append(bubble);
  chatWindow.append(row);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return row;
}
function setBusy(isBusy) {
  sendBtn.disabled = isBusy;
  userInput.disabled = isBusy;
}