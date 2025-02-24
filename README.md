# Inscriptor
Open source and free alternative to tools like NovelCrafter. 

Text editor with cleverly integrated AI tools and predefined AI prompts, suitable for writing fiction and non-fiction, brainstorming or chatting with AI, supplying your project as context. 

## Run:

Run from web:
https://app.inscriptor.io/

Download desktop client (Windows & Mac):
https://inscriptor.io/download

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


