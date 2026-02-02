## <img width="30" height="30" alt="image" src="https://github.com/user-attachments/assets/f4d9fd3a-f750-4aa5-bac8-62329c29f2f7" />  BuzzGuard – Chrome Extension
BuzzGuard is a lightweight Chrome extension designed to help users quickly fact-check any highlighted text on a webpage using AI and real-time web evidence. 
It empowers everyday readers to evaluate claims instantly—without leaving the page or opening new tabs.
BuzzGuard makes fact-checking effortless, empowering users to navigate the web with confidence and clarity.

## 🔍 How It Works
1.	Highlight any text on a webpage.
2.	Open BuzzGuard and click Analyze.
3.	Behind the scenes, BuzzGuard: 
      - Sends the selected text securely to its backend.
      - Searches the web for credible, authoritative sources.
      - Processes the text and evidence through an AI model.
4.	You receive: 
      -	A clear classification label: Likely True, Likely Misinformation, or Needs More Investigation.
      -	A confidence score.
      -	A concise explanation.
      -	A list of sources used.
All results are generated in real time for immediate feedback.

## 🚀 Key Features
   -	One-click analysis of highlighted text.
   -	Transparent results: classification label, confidence score, and explanation.
   -	Colour-coded output for quick interpretation.
   -	Source list so users can verify evidence themselves.

## 📦 Installation
1.	Clone the repository.
2.	Ensure the following files are present: 
      -	manifest.json
      -	popup.html
      -	styles.css
      -	popup.js
      -	content.js
      -	icons/icon16.png, icon48.png, icon128.png
3.	In Chrome, enable Developer Mode → Load Unpacked → select the extension folder.

## 📡 API Response Format
BuzzGuard’s backend returns results in a simple JSON structure:

```json
{
  "label": "True",
  "confidence": 0.92,
  "explanation": "The statement matches verified sources."
}
