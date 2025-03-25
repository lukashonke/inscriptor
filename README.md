# Inscriptor | ✨ AI Text Editor
Our goal is to create an open-source and free alternative to tools like NovelCrafter, Scrivener or Notion.

Inscriptor has cleverly integrated AI tools designed to enhance creativity, brainstorm, refine and analyze writing, provide suggestions and much more. all while being fully customizable.

https://inscriptor.io/

![alt text](https://inscriptor.io/images/inscriptor/screenshots/full4.png)

## Key Features:
- 🖥️ 100% Offline mode - Use our desktop application to save your projects locally or sync them to the cloud.
- 🛠️ Flexible AI prompts & tools - Create your own prompts, import prompt packs from our Inscriptor Hub or even use AI to generate additional prompts for you!
- 🤖 Smart AI integration - Receive multiple AI responses, reply to AI, seamlessly insert AI reply into your project, track differences, run automatic analyses and more!
- 🌍 Use Any AI Model - Connect an API key for OpenAI's ChatGPT, Anthropic's Claude or OpenRouter, run local AI models with Ollama or LM Studio or use Inscriptor Cloud to run any AI model without additional setup
- 🧠AI Context Selector - You decide what context gets included in AI prompts
- 📌 Outlining and Planning - Get a bird's-eye view of your project on a planning board, generate summaries, write notes, and feed them all into AI for enhanced context.
- ✍️ Writing Style definition - Customize how AI adapts to your personal writing style. Let it learn from your text or define the style of writing when you begin.
- ⚡ Advanced AI tools: Chain prompts, run multiple prompts simultaneously, get instant text analysis, generate synopses with one click, create follow-up questions, and more—all fully customizable!

### Recommended use cases:
- 📖 Fiction Writing: Short stories, novels. Use AI to refine writing, correct grammar, brainstorm plot ideas, and develop characters.
- 📰 Non-fiction writing: Articles, blog posts, marketing materials. Expand knowledge, fact-check, generate entire articles from disorganized notes, or rewrite content in different styles.
- 🧩 Second Brain: Organize projects, business ideas, and knowledge bases. Chat with AI for insights, ask questions, or brainstorm new ideas.
- 📚 Story Generation: Love an existing story but wish it were longer? Feed it into Inscriptor and let AI continue it!
- 🎓 Research & Academic Work - Use AI for research assistance, idea expansion, and content refinement.

### Screenshots:
![alt text](https://inscriptor.io/images/inscriptor/screenshots/ideas.png)

![alt text](https://inscriptor.io/images/inscriptor/screenshots/write.png)

![alt text](https://inscriptor.io/images/inscriptor/screenshots/prompts3.png)

![alt text](https://inscriptor.io/images/inscriptor/screenshots/grid.png)


## How to Run Inscriptor:

Run from web:
https://app.inscriptor.io/

Download desktop client (Windows & Mac):
https://inscriptor.io/download

Demo:
https://app.supademo.com/demo/cm5qw355t0prb36cgcmnjt2sd?v_email=EMAIL



# Compile and run from sources:

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


(see https://v2.tauri.app/distribute/)

(in tauri.conf.json remove the "plugins.updater" part to disable the certificate check required for auto-update)


