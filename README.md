## 🌐 BuzzGuard (Chrome Extension)
BuzzGuard is a simple Chrome extension that allows users to quickly fact-check highlighted text on any webpage using AI and real-time web evidence.

This tool is built to help everyday users evaluate claims without leaving the page or switching tabs.

## 🔍 How It Works
1. Highlight any text on a webpage
2. Open the extension and click Analyze
3. The extension:
   - Sends the selected text to a secure backend
   - Searches the web for credible sources
   - Runs the text + evidence through an AI model
3. You receive:
   - A clear label (Likely True, Likely Misinformation, or Needs More Investigation)
   - A confidence score
   - A simple explanation
   - A list of sources used
Everything is done in real time.

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
