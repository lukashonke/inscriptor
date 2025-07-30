# Inscriptor | ✨ AI Text Editor

<p align="center">
  <a href="https://inscriptor.io/download"><img src="https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Web-lightgrey?style=flat-square" alt="Platform"></a>
</p>

Our goal is to create an open-source and free alternative to tools like NovelCrafter, Scrivener or Notion.

Inscriptor has cleverly integrated AI tools designed to enhance creativity, brainstorm, refine and analyze writing, provide suggestions and much more. All while being fully customizable.

**Website**: https://inscriptor.io/

![Inscriptor Interface](https://inscriptor.io/images/inscriptor/2/intro.png)

## 📑 Table of Contents

- [Key Features](#key-features)
- [Recommended Use Cases](#recommended-use-cases)
- [Screenshots](#screenshots)
- [Getting Started](#getting-started)
- [Development](#development)
- [License](#license)

## Key Features

### Core Capabilities
- 🖥️ 100% Offline mode - Use our desktop application to save your projects locally or sync them to the cloud.
- 🛠️ Flexible AI prompts & UIs - Create your own prompts, import prompt packs from our Inscriptor Hub or even use AI to generate additional prompts for you!
- 🤖 Smart AI integration - Receive multiple AI responses, reply to AI, seamlessly insert AI reply into your project, track differences, run automatic analyses and more!
- 💬 AI Agent Chat - An intelligent assistant that understands your entire project. It navigates files, analyzes characters and plot, suggests context-aware edits you can preview, and maintains your writing style across all interactions
- 🔗 Prompt Agents - Used to iteratively improve outputs of your prompts by feeding them into predefined AI agents, such as word style refiner, critique, etc. Create powerful AI workflows where each agent has a specialized purpose
- 🌍 Use Any AI Model - Connect an API key for OpenAI's ChatGPT, Anthropic's Claude or OpenRouter, run local AI models with Ollama or LM Studio or use Inscriptor Cloud to run any AI model without additional setup
- 🧠AI Context Selector - You decide what context gets included in AI prompts
- 📌 Outlining and Planning - Get a bird's-eye view of your project on a planning board, generate summaries, write notes, and feed them all into AI for enhanced context.
- ✍️ Writing Style definition - Customize how AI adapts to your personal writing style. Let it learn from your text or define the style of writing when you begin.
- 🔍 Word Finder - Find the perfect word with our word & phrase finder. Get contextually relevant suggestions with a click
- ✨ Auto Complete - Quickly autocomplete your sentences with context relevant AI suggestions. Just press tab to accept
- ⚡ Advanced AI tools: Chain prompts, run multiple prompts simultaneously, get instant text analysis, generate synopses with one click, create follow-up questions, and more—all fully customizable!

## Recommended Use Cases
- 📖 Fiction Writing: Short stories, novels. Use AI to refine writing, correct grammar, brainstorm plot ideas, and develop characters.
- 📰 Non-fiction writing: Articles, blog posts, marketing materials. Expand knowledge, fact-check, generate entire articles from disorganized notes, or rewrite content in different styles.
- 🧩 Second Brain: Organize projects, business ideas, and knowledge bases. Chat with AI for insights, ask questions, or brainstorm new ideas.
- 📚 Story Generation: Love an existing story but wish it were longer? Feed it into Inscriptor and let AI continue it!
- 🎓 Research & Academic Work - Use AI for research assistance, idea expansion, and content refinement.

## Screenshots
See https://inscriptor.io for more screenshots and videos.

### AI Brainstorming Interface
![Brainstorm UI](https://inscriptor.io/images/inscriptor/2/brainstormui.png)

### Project Planning Board
![Planning Board](https://inscriptor.io/images/inscriptor/2/board3.png)


## Getting Started

### Option 1: Use Web Version
Run from web: https://app.inscriptor.io/

### Option 2: Download Desktop Client
Download desktop client (Windows & Mac): https://inscriptor.io/download

### Option 3: Build from Source
See [Development](#development) section below.

## Development

### Prerequisites
- Node.js and Yarn installed
- For desktop builds: Rust and Tauri prerequisites

### Build Instructions

### 1) Install the dependencies
```bash
yarn
```

### 2a) Start the app in development mode (AS WEB APP)
```bash
yarn dev
```

### 2b) Start the app in development mode (AS DESKTOP APP)
```bash
yarn tauri dev
```

### 3a) Build the app for production (AS WEB APP)
```bash
yarn build
```

### 3b) Build the app for production (AS DESKTOP APP)
```bash
yarn tauri build
```


### Additional Notes

- See https://v2.tauri.app/distribute/ for distribution details
- In `tauri.conf.json` remove the "plugins.updater" part to disable the certificate check required for auto-update

## License

This project is open-source. Please check the LICENSE file for details.

---

<p align="center">
  <a href="https://inscriptor.io/">Website</a> • 
  <a href="https://app.inscriptor.io/">Try Online</a> • 
  <a href="https://inscriptor.io/download">Download</a>
</p>


