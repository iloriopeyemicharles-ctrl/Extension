
# LLaMA Fake News Detector – Chrome Extension

## Overview
A Chrome extension that analyzes highlighted text on any webpage using an AI-powered backend (e.g., LLaMA model) to detect misinformation or verify truthfulness.

## Features
- Highlight text and click **Analyze**.
- Displays classification label, confidence score, and explanation.
- Color-coded results for quick interpretation.

## Installation
1. Clone the repository.
2. Ensure the following files exist:
   - manifest.json
   - popup.html
   - styles.css
   - popup.js
   - content.js
   - icons/icon16.png, icon48.png, icon128.png
3. Load the extension in Chrome via **Developer Mode → Load Unpacked**.
4. Set up the backend API at `http://localhost:3000/analyze`.

## API Response Format
```json
{
  "label": "True",
  "confidence": 0.92,
  "explanation": "The statement matches verified sources."
}
### check and make sure all explanations are clear and correct
