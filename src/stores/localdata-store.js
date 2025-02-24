import { defineStore } from 'pinia';

export const useLocalDataStore = defineStore('localData', {
  state: () => ({
    apiKeys: [
      { "name": "OpenAI API Key", "key": "", description: 'OpenAI API Key for GPT models.' },
      { "name": "Anthropic API Key", "key": "", description: 'Antropic API Key for Claude models.' },
      { "name": "OpenRouter API Key", "key": "", description: 'OpenRouter API Key for the other cloud models.' },
    ]
  }),
  getters: {

  },
  actions: {
    setApiKey(name, key) {
      const index = this.apiKeys.findIndex((apiKey) => apiKey.name === name);
      if (index !== -1) {
        this.apiKeys[index].key = key;
      }

      this.saveLocalData();
    },
    getApiKey(name) {
      return this.apiKeys.find((apiKey) => apiKey.name === name);
    },
    async loadLocalData() {
      const keys = JSON.parse(localStorage.getItem('api-keys'));

      if(keys) {
        for (const key of keys) {
          this.setApiKey(key.name, key.key);
        }
      }
    },
    saveLocalData() {
      localStorage.setItem('api-keys', JSON.stringify(this.apiKeys.map((apiKey) => ({ name: apiKey.name, key: apiKey.key }))));
    }
  }
});
