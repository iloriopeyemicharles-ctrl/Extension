const BACKEND_URL = "https://llamaserver-e4sg.onrender.com/analyze"; // change to your deployed URL later

const analyzeBtn = document.getElementById("analyze-button");
const resultBox = document.getElementById("result-box");
const resultText = document.getElementById("result-text");
const confidenceText = document.getElementById("confidence-text");
const explanation = document.getElementById("explanation");
const sourcesEl = document.getElementById("sources");

// Listen for Analyze button click
analyzeBtn.addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs?.[0]?.id;
    if (!tabId) {
      show("No active tab found.", "status-false", null, null);
      return;
    }
    chrome.tabs.sendMessage(
      tabId,
      { action: "get_selected_text" },
      async (response) => {
        const text = response?.text?.trim();
        if (!text) {
          show("Please highlight some text on the page first.", null, null, null);
          return;
        }
        const pageUrl = tabs?.[0]?.url || null;
        await analyzeText(text, pageUrl);
      }
    );
  });
});

// Display results in popup
function show(message, status, confidence, details) {
  resultBox.classList.remove("hidden", "status-true", "status-review", "status-false");
  if (status) resultBox.classList.add(status);
  resultText.textContent = message || "";
  confidenceText.textContent = confidence ? `Confidence: ${confidence}` : "";
  explanation.textContent = details || "";
  const detailsEl = document.querySelector(".details");
  if (details && detailsEl) detailsEl.open = true;
}

function renderSources(sources) {
  if (!sourcesEl) return;
  sourcesEl.innerHTML = "";
  if (!Array.isArray(sources) || sources.length === 0) {
    sourcesEl.textContent = "No sources found for this claim.";
    return;
  }
  const frag = document.createDocumentFragment();
  sources.forEach((s) => {
    const item = document.createElement("div");
    item.className = "source-item";

    const a = document.createElement("a");
    a.href = s.url || "#";
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = s.title || s.url || "Source";

    const snip = document.createElement("div");
    snip.className = "source-snippet";
    snip.textContent = s.snippet || "";

    item.appendChild(a);
    item.appendChild(snip);
    frag.appendChild(item);
  });
  sourcesEl.appendChild(frag);
}

function toPercent(score) {
  if (score == null) return null;
  let n = Number(score);
  if (Number.isNaN(n)) return null;
  if (n <= 1) n = n * 100; // accept 0-1 or 0-100
  n = Math.max(0, Math.min(100, n));
  return `${Math.round(n)}%`;
}

function extractTextCandidate(data, keys) {
  for (const k of keys) {
    const v = k.split(".").reduce((o, part) => (o ? o[part] : undefined), data);
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

function tryParseJsonString(str) {
  if (typeof str !== "string") return null;
  const s = str.trim();
  if (!s.startsWith("{") && !s.startsWith("[")) return null;
  try { return JSON.parse(s); } catch { return null; }
}

function formatStructured(value, depth = 0) {
  const indent = depth ? "  ".repeat(depth) : "";
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        const formatted = formatStructured(item, depth + 1);
        return formatted ? `${indent}- ${formatted}` : "";
      })
      .filter(Boolean)
      .join("\n");
  }
  if (typeof value === "object") {
    return Object.entries(value)
      .map(([key, val]) => {
        const formatted = formatStructured(val, depth + 1);
        if (!formatted) return `${indent}${key}:`;
        if (formatted.includes("\n")) {
          const nested = formatted
            .split("\n")
            .map((line) => `${"  ".repeat(depth + 1)}${line}`)
            .join("\n");
          return `${indent}${key}:\n${nested}`;
        }
        return `${indent}${key}: ${formatted}`;
      })
      .join("\n");
  }
  return String(value);
}

function findEmbeddedJson(data) {
  const candidate = extractTextCandidate(data, [
    "explanation",
    "rawContent",
    "response",
    "text",
    "message",
    "output_text"
  ]);
  return tryParseJsonString(candidate);
}

function extractDetails(data) {
  if (!data || typeof data !== "object") return "";
  const text = extractTextCandidate(data, [
    "explanation",
    "reason",
    "reasons",
    "reasoning",
    "analysis",
    "rationale",
    "details",
    "why",
    "message",
    "note",
    "choices.0.message.content",
    "output_text",
    "text",
    "rawContent",
    "response",
  ]);
  if (text) {
    const parsed = tryParseJsonString(text);
    if (parsed) {
      const inner = extractTextCandidate(parsed, ["explanation", "reason", "analysis", "details"]);
      if (inner) return inner;
      const formatted = formatStructured(parsed);
      return formatted || String(text);
    }
    if (text.trim().startsWith("{") || text.trim().startsWith("[")) {
      return "Model returned structured data that could not be parsed cleanly.";
    }
    return text;
  }
  const embedded = findEmbeddedJson(data);
  if (embedded) return extractDetails(embedded) || formatStructured(embedded);
  const fallback = formatStructured(data);
  return fallback || "No explanation provided.";
}

function extractLabel(data) {
  let label = extractTextCandidate(data, [
    "label",
    "verdict",
    "result",
    "classification",
    "status",
  ]);
  if (!label) {
    const embedded = findEmbeddedJson(data);
    if (embedded) label = extractLabel(embedded);
  }
  return label || "Needs More Investigation";
}

function extractConfidenceRaw(data) {
  let raw = extractTextCandidate(data, [
    "confidence",
    "score",
    "probability",
    "confidence_score",
    "metrics.confidence",
  ]);
  if (raw == null) {
    const embedded = findEmbeddedJson(data);
    if (embedded) return extractConfidenceRaw(embedded);
  }
  const num = raw != null ? Number(String(raw).match(/\d+(?:\.\d+)?/)) : null;
  if (num == null || Number.isNaN(num)) return null;
  return num > 1 ? Math.max(0, Math.min(1, num / 100)) : Math.max(0, Math.min(1, num));
}

function extractConfidence(data) {
  const raw = extractConfidenceRaw(data);
  return { raw, display: toPercent(raw) };
}

// Analyze selected text via backend
async function analyzeText(text, pageUrl) {
  show("Analyzing…", "status-review", null, null);

  try {
    const res = await fetch(BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, url: pageUrl }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();

    // Log the full response from your backend for debugging
    console.log("Full backend response:", data);

    // Extract values safely
    let label = extractLabel(data);
    const { raw: confRaw, display: conf } = extractConfidence(data);
    let details = extractDetails(data);

    const l = label.toLowerCase();
    let status = /likely\s*true|true|real|support|accurate/.test(l)
      ? "status-true"
      : /likely\s*false|false|fake|misinfo|misinformation|disinfo|disinformation|unsupported|inaccurate/.test(l)
      ? "status-false"
      : "status-review";

    // Confidence-based override when label is ambiguous
    if (status === "status-review" && confRaw != null) {
      if (confRaw >= 0.75) {
        status = "status-true";
        label = label && label.toLowerCase() !== "needs more investigation" ? label : "Likely True";
        details = details || "High confidence score from the model.";
      } else if (confRaw <= 0.25) {
        status = "status-false";
        label = label && label.toLowerCase() !== "needs more investigation" ? label : "Likely False";
        details = details || "Low confidence score from the model.";
      }
    }

    if (!details) {
      details = "No explanation provided by the model.";
    }

    // Render sources list in the UI if present
    const srcArr = Array.isArray(data.sources) ? data.sources : [];
    renderSources(srcArr);

    show(label, status, conf, details);
  } catch (err) {
    console.error("Error during analysis:", err);
    show("Error during analysis. Please try again.", "status-false", null, String(err));
  }
}
