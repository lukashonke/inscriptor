<template>
  <q-layout view="hHh lpR fFf" :class="layoutStore.darkMode ? 'dark-mode' : 'day-mode'">

    <q-header elevated className="bg-primary text-white shadow-1">
      <div class="row bg-accent items-center justify-between q-px-sm" style="min-height: 56px">
        <q-btn flat round icon="menu" @click="toggleLeftDrawer" />
        <div class="text-subtitle2">{{ fileStore.projectName || 'Inscriptor' }}</div>
        <q-btn flat round icon="mdi-dots-vertical">
          <q-menu>
            <q-list style="min-width: 200px">
              <q-item clickable v-close-popup @click="layoutStore.projectSelectionDialogOpen = true">
                <q-item-section avatar>
                  <q-icon name="mdi-folder-outline" />
                </q-item-section>
                <q-item-section>Projects</q-item-section>
              </q-item>
              <q-separator />
              <q-item clickable v-close-popup @click="signOut" v-if="currentUser !== 'Guest'">
                <q-item-section avatar>
                  <q-icon name="mdi-logout" />
                </q-item-section>
                <q-item-section>Sign out</q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click="signOut" v-else>
                <q-item-section avatar>
                  <q-icon name="mdi-login" />
                </q-item-section>
                <q-item-section>Login</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </div>

    </q-header>

    <q-drawer show-if-above v-model="layoutStore.leftDrawerOpen" side="left" width="350">
      <div class="fit left-menu-scroll bg-white">
        <div class="q-pa-none">
          <LeftMenuComponent />
        </div>
        <div class="absolute full-width" style="bottom: 0">
          <q-separator />
          <div class="row items-center bg-theme-primary justify-center no-wrap" id="variables">
            <div class="col-auto mobile-hide">
              <q-btn no-caps stack unelevated class="row text-primary q-my-sm cursor-pointer" icon="mdi-database-outline" label="Variables" @click="layoutStore.setVariableSettingsOpen(true)" />
            </div>
            <div class="col-auto mobile-hide">
              <q-btn no-caps stack unelevated class="row text-primary q-my-sm cursor-pointer" icon="mdi-cog" label="Settings" @click="layoutStore.setSettingsOpen(true)" id="settingsButton" />
            </div>
            <div class="col-auto">
              <q-btn no-caps stack unelevated class="row text-primary q-my-sm cursor-pointer" icon="mdi-history" label="History" @click="layoutStore.setConsoleOpen(!layoutStore.consoleOpen)"/>
            </div>
          </div>
        </div>
      </div>
    </q-drawer>

    <q-drawer show-if-above v-model="layoutStore.rightDrawerOpen" side="right" width="350">
      <div class="bg-white full-height">
        <RightMenuComponent />
      </div>
    </q-drawer>

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
      <PromptResultsDialog />
    </template>

  </q-layout>
</template>

<script setup>
import {computed, onBeforeMount, onMounted, onUnmounted, ref, watch} from 'vue';
import {useFileStore} from "stores/file-store";
import {useLayoutStore} from "stores/layout-store";
import AppSettings from "components/Dialogs/AppSettings.vue";
import {usePromptStore} from "stores/prompt-store";
import ConsoleDialog from "components/Dialogs/ConsoleDialog.vue";
import VariableSettings from "components/Dialogs/VariableSettingsDialog.vue";
import PromptConfirmDialog from "components/Dialogs/PromptConfirmDialog.vue";
import LoginDialog from "components/Dialogs/WelcomeDialog.vue";
import ProjectSelectionDialog from "components/Dialogs/ProjectSelectionDialog.vue";
import {getCurrentUser, useCurrentUser, useFirebaseAuth} from "vuefire";
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
import {useActiveElement, useKeyModifier} from "@vueuse/core";
import AppTour from "components/Dialogs/AppTour.vue";
import InAppTutorial from "components/Dialogs/InAppTutorial.vue";
import AddPromptDialog from "components/Dialogs/AddPromptDialog.vue";
import {onUserLogin} from "src/common/apiServices/userProjectService";
import FeedbackWindow from "components/Dialogs/FeedbackWindow.vue";
import MessageUsDialog from "components/Dialogs/MessageUsDialog.vue";
import NewUserWelcomeDialog from "components/Dialogs/NewUserWelcomeDialog.vue";
import EditProjectMetadataDialog from 'components/Dialogs/EditProjectMetadataDialog.vue';
import PromptUiDialog from 'components/Dialogs/PromptUiDialog.vue';
import {useEditorStore} from 'stores/editor-store';
import LeftMenuComponent from 'components/LeftMenu/LeftMenuComponent.vue';
import RightMenuComponent from 'components/RightMenu/RightMenuComponent.vue';
import PromptResultsDialog from 'components/Dialogs/PromptResultsDialog.vue';

const layoutStore = useLayoutStore();
const promptStore = usePromptStore();
const fileStore = useFileStore();
const localDataStore = useLocalDataStore();
const editorStore = useEditorStore();
const auth = useFirebaseAuth();

const currentUser = computed(() => useCurrentUser()?.value?.email ?? 'Guest');
const userSyncing = computed(() => layoutStore.userSyncIndicator);

function toggleLeftDrawer() {
  layoutStore.setLeftDrawerOpen(!layoutStore.leftDrawerOpen);
}

function toggleRightDrawer() {
  layoutStore.closeRightPanel();
}

async function signOut() {
  await auth.signOut();

  window.location.reload();
}



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
  // Close drawers by default on mobile
  layoutStore.setLeftDrawerOpen(false);
  layoutStore.rightDrawerOpen = false;

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

</script>
