import { directusClient } from "boot/directus";
import { readItem, readItems, createItem, updateItem, authentication } from "@directus/sdk";
import { importModel } from "src/common/utils/modelUtils";
import { Notify, Dialog } from "quasar";
import { usePromptStore } from "stores/prompt-store";
import { isRef, ref } from "vue";
import { useCurrentUser } from "vuefire";
import { exportPromptToJson } from "src/common/helpers/promptHelper";
import { createDirectus, rest } from "@directus/sdk";

// Cache authenticated client to persist tokens across share operations
let cachedSyncClient = null;

// Runtime credentials (configured via dialog) - shared across all useMarketplace() calls
const runtimeSyncEmail = ref(null);
const runtimeSyncPassword = ref(null);

export function useMarketplace() {

  /**
   * Check if sync credentials are configured
   * @returns {boolean}
   */
  function isSyncConfigured() {
    return runtimeSyncEmail.value !== null && runtimeSyncPassword.value !== null;
  }

  /**
   * Show dialog to configure sync credentials
   * @returns {Promise<boolean>} True if credentials were configured
   */
  async function configureSyncCredentials() {
    return new Promise((resolve) => {
      // First dialog: Get email
      Dialog.create({
        title: 'Configure Marketplace Sync',
        message: 'Enter email for the account with permission to sync to Inscriptor Hub',
        prompt: {
          model: runtimeSyncEmail.value || '',
          type: 'text',
          isValid: val => val && val.length > 0
        },
        cancel: true,
        persistent: true
      }).onOk(email => {
        runtimeSyncEmail.value = email;

        // Second dialog: Get password
        Dialog.create({
          title: 'Configure Marketplace Sync',
          message: 'Enter password for the sync account',
          prompt: {
            model: runtimeSyncPassword.value || '',
            type: 'password',
            isValid: val => val && val.length > 0
          },
          cancel: true,
          persistent: true
        }).onOk(password => {
          runtimeSyncPassword.value = password;
          cachedSyncClient = null; // Clear cache to force re-authentication
          Notify.create({
            message: 'Sync credentials configured',
            color: 'positive',
            position: 'top'
          });
          resolve(true);
        }).onCancel(() => {
          resolve(false);
        });
      }).onCancel(() => {
        resolve(false);
      });
    });
  }

  /**
   * Get an authenticated Directus client for sync operations
   * @returns {Promise<Object|null>} Authenticated client or null if not configured
   */
  async function getAuthenticatedClient() {
    const email = runtimeSyncEmail.value;
    const password = runtimeSyncPassword.value;

    if (!email || !password) {
      return null;
    }

    // Return cached client if already authenticated
    if (cachedSyncClient) {
      return cachedSyncClient;
    }

    const client = createDirectus('https://cms.inscriptor.io')
      .with(authentication('json'))
      .with(rest());

    try {
      // Use client.login() - this automatically manages tokens
      await client.login(email, password);

      // Cache the authenticated client
      cachedSyncClient = client;
      return client;
    } catch (error) {
      console.error('Failed to authenticate sync account:', error);
      cachedSyncClient = null; // Clear cache on failure
      throw error;
    }
  }

  /**
   * Import an item from the Inscriptor Hub marketplace
   * @param {string} packId - ID of the package to import
   * @param {string} category - Category type (e.g., 'Models', 'Prompt_Packages', 'Packs')
   * @param {Object} options - Optional configuration
   * @param {boolean} options.skipDialog - Skip import confirmation dialog
   * @param {Array|Ref} options.importedTracker - Array or ref to track imported items
   * @returns {Promise<void>}
   */
  async function importFromMarketplace(packId, category, options = {}) {
    const { skipDialog, importedTracker } = options;
    const client = directusClient;

    // Helper to push to either array or ref
    const pushToImported = (value) => {
      if (importedTracker) {
        if (isRef(importedTracker)) {
          importedTracker.value.push(value);
        } else {
          importedTracker.push(value);
        }
      }
    };

    // Helper to get imported length
    const getImportedLength = () => {
      if (!importedTracker) return 0;
      return isRef(importedTracker) ? importedTracker.value.length : importedTracker.length;
    };

    const itemDetail = await client.request(readItem(category, packId));
    if (!itemDetail) return;

    // Support new promptIds structure at top level - fetch prompts from Prompts collection
    if (itemDetail.data.promptIds && itemDetail.data.promptIds.length > 0) {
      const promptIds = itemDetail.data.promptIds.map(p => p.promptId);
      const fetchedPrompts = await client.request(
        readItems('Prompts', {
          filter: {
            promptId: { _in: promptIds }
          }
        })
      );
      // Data is already deserialized from Directus, no need to JSON.parse
      itemDetail.data.prompts = fetchedPrompts.map(p => p.data);
    }

    await importModel(itemDetail.data, async (status) => {
      if (status === true) {
        pushToImported(packId);

        const totalCount = (itemDetail.data.modelPackages ? itemDetail.data.modelPackages.length : 0) +
                          (itemDetail.data.promptPackages ? itemDetail.data.promptPackages.length : 0);
        const showStatus = totalCount > 1;

        let notif = null;
        if (showStatus) {
          notif = Notify.create({
            group: false, // required to be updatable
            timeout: 0, // we want to be in control when it gets dismissed
            spinner: true,
            color: 'positive',
            position: 'top',
            message: 'Importing from Inscriptor Hub...',
            caption: '0%'
          });
        }

        // Process model packages
        if (itemDetail.data.modelPackages && itemDetail.data.modelPackages.length > 0) {
          for (const pack of itemDetail.data.modelPackages) {
            const nestedPack = await client.request(readItem("Models", pack.packId));

            await importModel(nestedPack.data, (status) => {
              if (status === true) {
                pushToImported(pack.id);
              }
            }, true, null, showStatus);

            if (notif) {
              notif({
                caption: `${Math.round((getImportedLength() / (totalCount + 1)) * 100)}%`
              });
            }
          }
        }

        // Process prompt packages
        if (itemDetail.data.promptPackages && itemDetail.data.promptPackages.length > 0) {
          for (const pack of itemDetail.data.promptPackages) {
            const nestedPack = await client.request(readItem("Prompt_Packages", pack.packId));

            // Support new promptIds structure - fetch prompts from Prompts collection
            if (nestedPack.data.promptIds && nestedPack.data.promptIds.length > 0) {
              const promptIds = nestedPack.data.promptIds.map(p => p.promptId);
              const fetchedPrompts = await client.request(
                readItems('Prompts', {
                  filter: {
                    promptId: { _in: promptIds }
                  }
                })
              );
              // Data is already deserialized from Directus, no need to JSON.parse
              nestedPack.data.prompts = fetchedPrompts.map(p => p.data);
            }

            await importModel(nestedPack.data, (status) => {
              if (status === true) {
                pushToImported(pack.id);
              }
            }, true, pack.modelIdToUse, showStatus);

            if (notif) {
              notif({
                caption: `${Math.round((getImportedLength() / (totalCount + 1)) * 100)}%`
              });
            }
          }
        }

        // Finish progress notification
        if (notif) {
          notif({
            icon: 'done', // we add an icon
            spinner: false, // we reset the spinner setting so the icon can be displayed
            message: 'Import finished!',
            timeout: 2500 // we will timeout it in 2.5s
          });
        }

        const promptStore = usePromptStore();

        // Process prompt agents
        if (itemDetail.data.promptAgents && itemDetail.data.promptAgents.length > 0) {
          for (const agent of itemDetail.data.promptAgents) {
            const existingAgent = promptStore.promptAgents.find(a => a.id === agent.id);
            if (!existingAgent) {
              promptStore.addPromptAgent(agent);
            }
          }
        }

        // Process project agents
        if (itemDetail.data.projectAgents && itemDetail.data.projectAgents.length > 0) {
          for (const agent of itemDetail.data.projectAgents) {
            const existingAgent = promptStore.projectAgents.find(a => a.id === agent.id);
            if (!existingAgent) {
              promptStore.addProjectAgent(agent);
            }
          }
        }

        // Process settings overrides
        if (itemDetail.data.settingsOverrides) {
          if (itemDetail.data.settingsOverrides.predefinedPrompts) {
            for (const prompt of itemDetail.data.settingsOverrides.predefinedPrompts) {
              promptStore.addPredefinedPrompt(prompt.promptType, prompt.promptId);
            }
          }

          if (itemDetail.data.settingsOverrides.analysisPrompts) {
            for (const promptId of itemDetail.data.settingsOverrides.analysisPrompts) {
              const prompt = promptStore.getPromptById(promptId);
              if (prompt) {
                promptStore.addAnalysisPrompt({
                  value: prompt.id
                });
              }
            }
          }

          if (itemDetail.data.settingsOverrides.modelForChat) {
            promptStore.currentModelForChatId = itemDetail.data.settingsOverrides.modelForChat;
          }

          if (itemDetail.data.settingsOverrides.promptForChat) {
            promptStore.currentPromptForChatId = itemDetail.data.settingsOverrides.promptForChat;
          }

          if (itemDetail.data.settingsOverrides.brainstormingPrompt) {
            const prompt = promptStore.getPromptById(itemDetail.data.settingsOverrides.brainstormingPrompt);
            promptStore.brainstormingPrompt = {
              label: prompt.title,
              value: prompt.id,
            };
          }

          if (itemDetail.data.settingsOverrides.suggestPrompt) {
            const prompt = promptStore.getPromptById(itemDetail.data.settingsOverrides.suggestPrompt);
            promptStore.suggestingPrompt = {
              label: prompt.title,
              value: prompt.id,
            };
          }
        }
      }
    }, skipDialog);
  }

  /**
   * Share a prompt to the Inscriptor Hub marketplace
   * @param {Object} prompt - The prompt object to share
   * @returns {Promise<void>}
   */
  async function sharePromptToMarketplace(prompt) {
    // Get current user ID
    const user = useCurrentUser();
    const userId = user?.value?.uid;

    if (!userId) {
      Notify.create({
        message: 'You must be logged in to share prompts',
        color: 'negative',
        position: 'top'
      });
      throw new Error('User not logged in');
    }

    // Export prompt data
    let json = exportPromptToJson([prompt]);
    const obj = JSON.parse(json);
    const promptData = obj.length === 1 ? obj[0] : obj;

    // Prepare data for Directus
    // Use the normalized promptId from exported data (which replaces model name with [model])
    const data = {
      promptId: promptData.id,
      name: prompt.title,
      data: JSON.stringify(promptData),
      created_by: userId
    };

    // Get authenticated client for sync operations
    const client = await getAuthenticatedClient();
    if (!client) {
      Notify.create({
        message: 'Sync credentials not configured',
        color: 'negative',
        position: 'top'
      });
      throw new Error('Sync credentials not configured');
    }

    // Check if prompt already exists (using normalized promptId)
    const existingPrompts = await client.request(
      readItems('Prompts', {
        filter: {
          promptId: {
            _eq: promptData.id
          }
        }
      })
    );

    if (existingPrompts && existingPrompts.length > 0) {
      // Update existing prompt
      const existingPrompt = existingPrompts[0];
      await client.request(
        updateItem('Prompts', existingPrompt.id, data)
      );

      Notify.create({
        message: 'Prompt updated successfully in Inscriptor Hub',
        color: 'positive',
        position: 'top',
        icon: 'mdi-cloud-check'
      });
    } else {
      // Create new prompt
      await client.request(
        createItem('Prompts', data)
      );

      Notify.create({
        message: 'Prompt shared successfully to Inscriptor Hub',
        color: 'positive',
        position: 'top',
        icon: 'mdi-cloud-upload'
      });
    }
  }

  return {
    importFromMarketplace,
    sharePromptToMarketplace,
    isSyncConfigured,
    configureSyncCredentials
  };
}
