import {directusClient} from "boot/directus";
import {readItem} from "@directus/sdk";
import {importModel} from "src/common/utils/modelUtils";
import {Notify} from "quasar";
import {usePromptStore} from "stores/prompt-store";

export async function importFromMarketplace(packId, category, skipDialog) {
  const client = directusClient;

  let imported = [];

  const itemDetail = await client.request(readItem(category, packId));
  if(itemDetail) {

    await importModel((itemDetail.data), async (status) => {
      if(status === true) {

        /*notif = Notify.create({
          message: 'Importing ...',
          spinner: true,
          group: false,
          color: 'positive',
          position: 'top',
          timeout: 3000,
        });*/

        imported.push(packId);

        const totalCount = (itemDetail.data.modelPackages ? itemDetail.data.modelPackages.length : 0) + (itemDetail.data.promptPackages ? itemDetail.data.promptPackages.length : 0);
        const showStatus = totalCount > 1;

        let notif = null;
        if(showStatus) {
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

        if(itemDetail.data.modelPackages && itemDetail.data.modelPackages.length > 0) {
          for(const pack of itemDetail.data.modelPackages) {

            const nestedPack = await client.request(readItem("Models", pack.packId));

            await importModel(nestedPack.data, (status) => {
              if(status === true) {
                imported.push(pack.id);
              }
            }, true, null, showStatus);

            if(notif) {
              notif({
                caption: `${Math.round((imported.length / (totalCount+1)) * 100)}%`
              });
            }
          }
        }

        if(itemDetail.data.promptPackages && itemDetail.data.promptPackages.length > 0) {
          for(const pack of itemDetail.data.promptPackages) {

            const nestedPack = await client.request(readItem("Prompt_Packages", pack.packId));

            await importModel(nestedPack.data, (status) => {
              if(status === true) {
                imported.push(pack.id);
              }
            }, true, pack.modelIdToUse, showStatus);

            if(notif) {
              notif({
                caption: `${Math.round((imported.length / (totalCount+1)) * 100)}%`
              });
            }
          }
        }

        if(notif) {
          notif({
            icon: 'done', // we add an icon
            spinner: false, // we reset the spinner setting so the icon can be displayed
            message: 'Import finished!',
            timeout: 2500 // we will timeout it in 2.5s
          })
        }

        const promptStore = usePromptStore();

        if(itemDetail.data.promptAgents && itemDetail.data.promptAgents.length > 0) {
          for(const agent of itemDetail.data.promptAgents) {
            const existingAgent = promptStore.promptAgents.find(a => a.id === agent.id);
            if(!existingAgent) {
              promptStore.addPromptAgent(agent);
            }
          }
        }

        if(itemDetail.data.projectAgents && itemDetail.data.projectAgents.length > 0) {
          for(const agent of itemDetail.data.projectAgents) {
            const existingAgent = promptStore.projectAgents.find(a => a.id === agent.id);
            if(!existingAgent) {
              promptStore.addProjectAgent(agent);
            }
          }
        }

        if(itemDetail.data.settingsOverrides) {
          if(itemDetail.data.settingsOverrides.predefinedPrompts) {
            for(const prompt of itemDetail.data.settingsOverrides.predefinedPrompts) {
              promptStore.addPredefinedPrompt(prompt.promptType, prompt.promptId);
            }
          }

          if(itemDetail.data.settingsOverrides.analysisPrompts) {
            for(const promptId of itemDetail.data.settingsOverrides.analysisPrompts) {
              const prompt = promptStore.getPromptById(promptId);
              if(prompt) {
                promptStore.addAnalysisPrompt({
                  value: prompt.id
                })
              }
            }
          }

          if(itemDetail.data.settingsOverrides.modelForChat) {
            promptStore.currentModelForChatId = itemDetail.data.settingsOverrides.modelForChat;
          }

          if(itemDetail.data.settingsOverrides.promptForChat) {
          }promptStore.currentPromptForChatId = itemDetail.data.settingsOverrides.promptForChat;
        }
      }
    }, skipDialog);
  }
}

export function getAssetUrl(path) {
  return 'https://taletellercms.azurewebsites.net' + '/assets/' + path;
}

