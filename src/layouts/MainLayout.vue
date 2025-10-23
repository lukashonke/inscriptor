<template>
  <q-layout view="hHh lpR fFf" :class="layoutStore.darkMode ? 'dark-mode' : 'day-mode'">

    <q-header className="bg-primary text-white shadow-1">
      <AppToolbar />
    </q-header>

    <q-page-container class="" style="padding-top: 0px">
        <router-view/>
    </q-page-container>

    <ErrorDialog v-if="layoutStore.errorDialogOpen"/>
    <template v-else>
      <AppSettings />
      <VariableSettings />


      <AppTour />
      <AddPromptDialog />
      <InAppTutorial />
      <ConsoleDialog />
      <PromptConfirmDialog />
      <LoginDialog />
      <ProjectSelectionDialog />
      <LoadingDialog />
      <NewUserWelcomeDialog />
      <PromptMarketplaceDialog />
      <QuickPromptSettings />
      <UserInfoDialog />
      <BrowserDialog />
      <PromptActionDialog />
      <MessageUsDialog />
      <SmartSearchInputDialog />
      <LowOnCreditsDialog />
      <ExportDialog />
      <FeedbackWindow />
      <EditProjectMetadataDialog />
      <PromptUiDialog />

      <!-- Alt+P PromptSelector Dialog -->
      <q-dialog v-model="layoutStore.showPromptSelectorDialog" seamless position="bottom">
        <q-card>
          <q-card-section class="no-padding row justify-between bg-accent text-white">
            <span class="text-caption q-px-sm q-py-xs">Prompt selector (ALT + P)</span>
            <q-btn flat round dense icon="mdi-close" size="12px" v-close-popup />
          </q-card-section>
          <q-card-section class="no-padding">
            <PromptSelector prompt-types="selection" @promptClick="handlePromptSelectorClick" />
          </q-card-section>
        </q-card>
      </q-dialog>
    </template>

  </q-layout>
</template>

<script setup>
import {computed, onBeforeMount, onMounted, onUnmounted, watch} from 'vue';
import {useFileStore} from "stores/file-store";
import AppToolbar from "components/Toolbar/AppToolbar.vue";
import {useLayoutStore} from "stores/layout-store";
import AppSettings from "components/Dialogs/AppSettings.vue";
import {usePromptStore} from "stores/prompt-store";
import ConsoleDialog from "components/Dialogs/ConsoleDialog.vue";
import VariableSettings from "components/Dialogs/VariableSettingsDialog.vue";
import PromptConfirmDialog from "components/Dialogs/PromptConfirmDialog.vue";
import LoginDialog from "components/Dialogs/WelcomeDialog.vue";
import ProjectSelectionDialog from "components/Dialogs/ProjectSelectionDialog.vue";
import {getCurrentUser, useCurrentUser, useFirestore} from "vuefire";
import {Dialog, Notify} from "quasar";
import LoadingDialog from "components/Dialogs/LoadingDialog.vue";
import PromptMarketplaceDialog from "components/Dialogs/PromptMarketplaceDialog.vue";
import QuickPromptSettings from "components/Dialogs/QuickPromptSettings.vue";
import UserInfoDialog from "components/Dialogs/UserInfoDialog.vue";
import BrowserDialog from "components/Dialogs/BrowserDialog.vue";
import PromptActionDialog from "components/Dialogs/PromptActionDialog.vue";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import SmartSearchInputDialog from "components/Dialogs/SearchInputDialog.vue";
import LowOnCreditsDialog from "components/Dialogs/LowOnCreditsDialog.vue";
import {useLocalDataStore} from "stores/localdata-store";
import ExportDialog from "components/Dialogs/ExportDialog.vue";
import ErrorDialog from "components/Dialogs/ErrorDialog.vue";
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { getVersion } from '@tauri-apps/api/app';
import {onKeyStroke, useActiveElement, useKeyModifier, useMagicKeys, whenever} from "@vueuse/core";
import AppTour from "components/Dialogs/AppTour.vue";
import InAppTutorial from "components/Dialogs/InAppTutorial.vue";
import AddPromptDialog from "components/Dialogs/AddPromptDialog.vue";
import {onUserLogin} from "src/common/apiServices/userProjectService";
import FeedbackWindow from "components/Dialogs/FeedbackWindow.vue";
import MessageUsDialog from "components/Dialogs/MessageUsDialog.vue";
import NewUserWelcomeDialog from "components/Dialogs/NewUserWelcomeDialog.vue";
import EditProjectMetadataDialog from 'components/Dialogs/EditProjectMetadataDialog.vue';
import PromptUiDialog from 'components/Dialogs/PromptUiDialog.vue';
import PromptSelector from 'components/Common/PromptSelector/PromptSelector.vue';
import {getAllMarkdown, getSelectedText} from 'src/common/utils/editorUtils';
import {useEditorStore} from 'stores/editor-store';
import {executePromptClick2} from 'src/common/helpers/promptHelper';

const layoutStore = useLayoutStore();
const promptStore = usePromptStore();
const fileStore = useFileStore();
const localDataStore = useLocalDataStore();
const editorStore = useEditorStore();

// control
const controlState = useKeyModifier('Control');
watch(controlState, (value) => {
  layoutStore.ctrlDown = value;
});

// meta
const metaState = useKeyModifier('Meta');
watch(metaState, (value) => {
  layoutStore.ctrlDown = value;
});

const activeElement = useActiveElement()
const focusedEditor = computed(() =>
  activeElement.value?.classList?.contains('tiptap')
)

const keys = useMagicKeys({
  passive: false,
  onEventFired(e) {
    if (e.key === 'Tab' && editorStore.autoCompleteText) {
      e.preventDefault()
    }
    // Prevent default for Alt+0-9 to avoid browser shortcuts
    if (e.altKey && ((e.key >= '0' && e.key <= '9'))) {
      e.preventDefault()
    }
    // Prevent default for Shift+Alt+0-9 to avoid writing characters
    if (e.shiftKey && e.altKey && ((e.key >= '0' && e.key <= '9'))) {
      e.preventDefault()
    }
    // Prevent default for Alt+P to avoid browser shortcuts
    if (e.altKey && e.key === 'p') {
      e.preventDefault()
    }
  },
});
const ctrlSpace = keys['Control+Space']
const tab = keys['Tab']
const alt1 = keys['Alt+1']
const alt2 = keys['Alt+2']
const alt3 = keys['Alt+3']
const alt4 = keys['Alt+4']
const alt5 = keys['Alt+5']
const alt6 = keys['Alt+6']
const alt7 = keys['Alt+7']
const alt8 = keys['Alt+8']
const alt9 = keys['Alt+9']
const alt0 = keys['Alt+0']
const shiftAlt1 = keys['Shift+Alt+1']
const shiftAlt2 = keys['Shift+Alt+2']
const shiftAlt3 = keys['Shift+Alt+3']
const shiftAlt4 = keys['Shift+Alt+4']
const shiftAlt5 = keys['Shift+Alt+5']
const shiftAlt6 = keys['Shift+Alt+6']
const shiftAlt7 = keys['Shift+Alt+7']
const shiftAlt8 = keys['Shift+Alt+8']
const shiftAlt9 = keys['Shift+Alt+9']
const shiftAlt0 = keys['Shift+Alt+0']
const altP = keys['Alt+P']

watch(ctrlSpace, (v) => {
  if (focusedEditor.value && !v) {
    console.log('ctrlSpace pressed');
    const selectedText = getSelectedText();
    if(selectedText) {
      promptStore.analysisEnabled = true;
      layoutStore.currentRightMenuView = 'analysis';
      layoutStore.setAnalysisTriggered(false);
      promptStore.promptSelectionAnalysisPrompts(true, true);
    }
  }
})

watch(tab, (v) => {
  if (focusedEditor.value && !v) {
    editorStore.confirmAutocompleteText();
  }
})

// Alt+0-9 to execute prompts by shortcut
watch(alt1, (v) => { if (focusedEditor.value && !v) executePromptByShortcut(1); })
watch(alt2, (v) => { if (focusedEditor.value && !v) executePromptByShortcut(2); })
watch(alt3, (v) => { if (focusedEditor.value && !v) executePromptByShortcut(3); })
watch(alt4, (v) => { if (focusedEditor.value && !v) executePromptByShortcut(4); })
watch(alt5, (v) => { if (focusedEditor.value && !v) executePromptByShortcut(5); })
watch(alt6, (v) => { if (focusedEditor.value && !v) executePromptByShortcut(6); })
watch(alt7, (v) => { if (focusedEditor.value && !v) executePromptByShortcut(7); })
watch(alt8, (v) => { if (focusedEditor.value && !v) executePromptByShortcut(8); })
watch(alt9, (v) => { if (focusedEditor.value && !v) executePromptByShortcut(9); })
watch(alt0, (v) => { if (focusedEditor.value && !v) executePromptByShortcut(0); })

// Shift+Alt+0-9 to execute prompts by shortcut and bypass confirmation dialog
watch(shiftAlt1, (v) => { if (focusedEditor.value && !v) executePromptByShortcut(1, true); })
watch(shiftAlt2, (v) => { if (focusedEditor.value && !v) executePromptByShortcut(2, true); })
watch(shiftAlt3, (v) => { if (focusedEditor.value && !v) executePromptByShortcut(3, true); })
watch(shiftAlt4, (v) => { if (focusedEditor.value && !v) executePromptByShortcut(4, true); })
watch(shiftAlt5, (v) => { if (focusedEditor.value && !v) executePromptByShortcut(5, true); })
watch(shiftAlt6, (v) => { if (focusedEditor.value && !v) executePromptByShortcut(6, true); })
watch(shiftAlt7, (v) => { if (focusedEditor.value && !v) executePromptByShortcut(7, true); })
watch(shiftAlt8, (v) => { if (focusedEditor.value && !v) executePromptByShortcut(8, true); })
watch(shiftAlt9, (v) => { if (focusedEditor.value && !v) executePromptByShortcut(9, true); })
watch(shiftAlt0, (v) => { if (focusedEditor.value && !v) executePromptByShortcut(0, true); })

// Alt+P to toggle PromptSelector dialog
watch(altP, (v) => {
  if (!v) {
    if (layoutStore.showPromptSelectorDialog) {
      layoutStore.closePromptSelectorDialog();
    } else {
      layoutStore.openPromptSelectorDialog();
    }
  }
})

const db = useFirestore();

const user = useCurrentUser();

watch(user, async (currentUser, previousUser) => {
  // redirect to login if they logout and the current
  // route is only for authenticated users
  if (!currentUser && previousUser) {
    layoutStore.loginDialogOpen = true;
  }
})

// Browser history navigation handler
function handlePopState(event) {
  if (event.state && event.state.fileId) {
    fileStore.selectFileFromHistory(event.state.fileId);
  }
}

onMounted(async () => {

  const currentUser = await getCurrentUser();

  if(layoutStore.runsInDesktopApp()) {
    const appVersion = await getVersion();
    layoutStore.desktopAppVersion = appVersion;
  }

  if(currentUser && (currentUser.emailVerified || currentUser.isAnonymous)) {
    layoutStore.setLoadingDialogOpen(true, 'Loading data');

    await fileStore.loadLocalSettings();
    await localDataStore.loadLocalData();

    await onUserLogin(await currentUser.getIdToken());

    await layoutStore.loadUserData();

    await layoutStore.loadModelData();

    layoutStore.setLoadingDialogOpen(false);

    Notify.create({
      message: 'Logged in as ' + currentUser.email,
      icon: 'mdi-account-outline',
      color: 'positive',
      position: 'top',
      timeout: 4000,
    });

    // repeat quick save
    setInterval(quickSave, 3000);

    setInterval(pingCloudProject, 60000);

    setInterval(reloadUserData, 60000);

    setInterval(reloadUserDataWithOpenUserInfo, 6000);
  }

  if(!currentUser || (currentUser.emailVerified === false && !currentUser.isAnonymous)) {
    layoutStore.loginDialogOpen = true;
  }
  else if(!fileStore.projectName) {
    layoutStore.projectSelectionDialogOpen = true;
  }

  // if url route contains /upgrade, open user info dialog
  if(!layoutStore.loginDialogOpen && window.location.hash.includes('upgrade')) {
    layoutStore.userInfoDialogOpen = true;
  }

  // Initialize browser history with current file
  if (fileStore.selectedFile) {
    try {
      window.history.replaceState({ fileId: fileStore.selectedFile.id }, '', '');
    } catch (e) {
      console.error('Failed to initialize history state:', e);
    }
  }

  // Register popstate listener for browser back/forward navigation
  window.addEventListener('popstate', handlePopState);
});

onBeforeMount(async () => {
  promptStore.initialise();
});

onUnmounted(() => {
  // Cleanup popstate listener
  window.removeEventListener('popstate', handlePopState);
});

if(layoutStore.runsInDesktopApp()) {

  tryUpdate();

  const appWindow = getCurrentWebviewWindow();

  appWindow.onCloseRequested(async (event) => {

    try {
      await quickSave(true);

      const dirtyFiles = fileStore.getDirtyFiles();
      if(dirtyFiles.length > 0) {
        event.preventDefault();

        Dialog.create({
          title: 'Confirm close',
          message: 'Data has been modified and cannot be saved right now. Are you sure you want to close the application?',
          cancel: true,
          persistent: true
        }).onOk(() => {
          appWindow.close();
        }).onCancel(() => {
        }).onDismiss(() => {
        })
      }
    } catch (e) {

      event.preventDefault();

      Dialog.create({
        title: 'Confirm close',
        message: 'Data could not be saved. Are you sure you want to close the application?',
        cancel: true,
        persistent: true
      }).onOk(() => {
        appWindow.close();
      }).onCancel(() => {
      }).onDismiss(() => {
      })
    }
  });
} else {

}

async function tryUpdate() {
  const update = await check();

  if(update) {
    Dialog.create({
      title: 'Update Available',
      message: 'Current version: ' + update.currentVersion + '<br />New version: ' + update.version + '<br /><br />Here is what is new:<br /><br /> ' + update.body + '<br /><br />',
      html: true,
      ok: 'Install now',
      cancel: 'Later',
      persistent: true
    }).onOk(async () => {

      const notif = Notify.create({
        group: false, // required to be updatable
        timeout: 0, // we want to be in control when it gets dismissed
        spinner: true,
        message: 'Download update...',
        caption: '0%'
      })

      console.log(
        `found update ${update.version} from ${update.date} with notes ${update.body}`
      );
      let downloaded = 0;
      let contentLength = 0;
      // alternatively we could also call update.download() and update.install() separately
      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case 'Started':
            contentLength = event.data.contentLength;
            console.log(`started downloading ${event.data.contentLength} bytes`);
            break;
          case 'Progress':
            downloaded += event.data.chunkLength;
            console.log(`downloaded ${downloaded} from ${contentLength}`);

            notif({
              caption: `${Math.round((downloaded / contentLength) * 100)}%`
            })

            break;
          case 'Finished':
            notif({
              icon: 'done', // we add an icon
              spinner: false, // we reset the spinner setting so the icon can be displayed
              message: 'Uploading done!',
              timeout: 2500 // we will timeout it in 2.5s
            })
            console.log('download finished');
            break;
        }
      });

      console.log('update installed');
      await relaunch();
    }).onCancel(() => {
      // console.log('>>>> Cancel')
    }).onDismiss(() => {
      // console.log('I am triggered on both OK and Cancel')
    })
  }


}

async function quickSave(force = false) {
  try {

    //await promptStore.onSettingsChange(); // TODO trigger on change, not always

    if(fileStore.canSave() && fileStore.canQuickSave()) {
      // offline file sync if not synced on cloud
      if(fileStore.projectId) {
        if(fileStore.projectSettings?.syncToCloud === false) {
          if(!layoutStore.projectSelectionDialogOpen) {
            await fileStore.saveProjectDataToLocalFile();
          }
        } else {
          await fileStore.syncProjectToCloud(force);
        }
      }
    }
  } catch (e) {
    console.error(e);
    throw e;
  }
}

async function pingCloudProject() {
  try {
    // ping cloud project opened to keep it cached
    if(fileStore.projectId) {
      if(fileStore.projectSettings?.syncToCloud === true) {
        await fileStore.pingProject();
      }
    }
  } catch (e) {
    console.error(e);
    throw e;
  }
}

async function reloadUserData() {
  // refresh user data - quotas, tiers and so on
  await layoutStore.loadUserData();

  // load model pricing and so on
  await layoutStore.loadModelData();
}

async function reloadUserDataWithOpenUserInfo() {

  if(layoutStore.userInfoDialogOpen === true) {
    // refresh user data - quotas, tiers and so on
    await layoutStore.loadUserData();
  }
}

// Helper function to find prompt by keyboard shortcut number
function findPromptByShortcut(shortcutNumber) {
  return promptStore.prompts.find(p => p.settings?.keyboardShortcut === shortcutNumber);
}

// Helper function to execute prompt by keyboard shortcut
async function executePromptByShortcut(shortcutNumber, bypassConfirmation = false) {
  const prompt = findPromptByShortcut(shortcutNumber);

  if (!prompt) {
    return;
  }

  // Determine input: use selected text if available, otherwise whole file
  const selectedText = getSelectedText();
  const text = selectedText || getAllMarkdown();

  // Execute the prompt
  const request = {
    prompt: prompt,
    text: text,
    forceBypassMoreParameters: bypassConfirmation,
  };

  await executePromptClick2(request);
}

// Handler for PromptSelector dialog (Alt+P)
async function handlePromptSelectorClick(promptData) {
  // Close the dialog
  layoutStore.closePromptSelectorDialog();

  if (!promptData || !promptData.prompt) {
    return;
  }

  debugger;

  // Determine input: use selected text if available, otherwise whole file
  const selectedText = getSelectedText();
  const text = selectedText || getAllMarkdown();

  // Execute the prompt
  const request = {
    prompt: promptData.prompt,
    text: text,
  };

  await executePromptClick2(request);
}

</script>
