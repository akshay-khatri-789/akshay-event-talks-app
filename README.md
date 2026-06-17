# BigQuery Release Notes Dashboard & Social Sharer

A modern, glassmorphic Single Page Application (SPA) dashboard built using **Python Flask** and **Vanilla HTML/CSS/JS** that fetches, caches, categorizes, and tracks Google Cloud BigQuery release updates. It includes a custom social media composer to easily preview, edit, and share updates on X (Twitter).

---

## ✨ Features

- **Real-Time Feed Parsing**: Automatically pulls and parses Google's official BigQuery Atom release feed.
- **Smart Memory Caching**: Caches feed responses for **5 minutes** to optimize network traffic and page load times.
- **Dynamic Category Tagging**: Client-side categorization scans release HTML content for indicators and displays custom badges:
  - 🟢 **Feature**: New features and capabilities.
  - 🔵 **Fix**: Bug fixes and updates.
  - 🟡 **Change**: Changed or modified functionalities.
  - 🔴 **Deprecation**: Deprecations and warnings.
- **Unified Filter & Search**: Instantly filter updates by type (Features, Fixes, etc.) or search the entire text using search keyword.
- **Post to X (Twitter) Modal**: Custom modal helper that auto-prepares a formatted tweet, calculates character limits (including shortened links), and links to the official Twitter Web Intent for sharing.

---

## 🛠️ Technology Stack

- **Backend**: Python 3.13, Flask, Requests, Feedparser
- **Frontend**: Vanilla HTML5, Vanilla CSS3 (with responsive layouts and glassmorphism styling), Vanilla JavaScript (ES6)

---

## 🚀 Getting Started

### Prerequisites

Make sure you have **Python 3** installed on your system.

### Installation

1. Clone or download the repository to your local machine:
   ```bash
   cd bigquery-notes
   ```

2. Create a virtual environment:
   ```powershell
   # Windows (PowerShell)
   python -m venv .venv
   
   # macOS/Linux
   python3 -m venv .venv
   ```

3. Activate the virtual environment and install the dependencies:
   ```powershell
   # Windows (PowerShell)
   .\.venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   
   # macOS/Linux
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

### Running the Application

Start the Flask development server:

```bash
# Windows / macOS / Linux
python app.py
```

By default, the application runs in debug mode and is available at:
👉 **[http://127.0.0.1:5000](http://127.0.0.1:5000)**

---

## 📂 Project Structure

```
bigquery-notes/
├── .venv/                 # Python virtual environment
├── static/
│   ├── css/
│   │   └── style.css      # Custom styles (theme variables, glassmorphism, responsive grid)
│   └── js/
│       └── app.js         # Frontend logic, parsing, modal controls, and social sharing
├── templates/
│   └── index.html         # Main dashboard template layout & Tweet modal
├── .gitignore             # Git ignore configuration
├── app.py                 # Flask server, Atom RSS feed fetching & cache management
├── README.md              # Project documentation (this file)
└── requirements.txt       # Frozen python dependencies list
```
