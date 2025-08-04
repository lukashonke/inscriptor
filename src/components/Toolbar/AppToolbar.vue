<template>

  <q-bar data-tauri-drag-region class="titlebar q-px-none titlebar-bg" >

    <div class="row full-width items-center" style="height: 32px;">
      <div class="col-3 col-md-3 col-lg-5 row items-center no-wrap">
        <q-btn flat :icon="layoutStore.leftDrawerOpen ? 'chevron_left' : 'chevron_right'" @click="toggleLeftDrawer" class=""/>

        <q-btn flat class="text-aleo" no-wrap @click="layoutStore.promptMarketplaceOpen = true" id="hubButton">
          <q-icon name="mdi-storefront-outline" class="q-mr-sm"/>
          <span class="xs-hide">Hub</span>
        </q-btn>
      </div>
      <div class="col-3 col-md-2 col-lg-2 row items-center justify-center">
        <div class="col">
          <q-btn class="q-ml-lg bg-primary-light full-width" dense unelevated no-caps @click="layoutStore.searchOpen = true">
            <q-icon name="mdi-magnify" />
            <q-space />
          </q-btn>
        </div>
      </div>
      <div class="col-6 col-md-7 col-lg-5 row items-center justify-end no-wrap">

        <q-btn flat @click="layoutStore.showUserDialog" class="text-aleo" v-if="currentUser && (layoutStore.userData?.subscriptionLevel === 0 ?? false)" no-caps>
          <q-icon name="mdi-crown-outline" color="amber" class="q-mr-sm"/>
          <span class="xs-hide">Get Premium</span>
        </q-btn>

        <q-btn flat icon="mdi-account" class="md-hide lg-hide xl-hide" @click="layoutStore.showUserDialog" v-if="currentUser" no-caps />

        <q-btn flat class="sm-hide xs-hide" @click="layoutStore.showUserDialog" v-if="currentUser && currentUser !== 'Guest' && (credits < 1)" no-caps >
          <q-icon name="mdi-exclamation-thick" color="amber" class="q-mr-sm"/>
          Low on Cloud AI credits
          <q-tooltip>
            You currently have no AI credits left. It will not be possible to trigger AI on cloud. You can get more credits by clicking on this button.
          </q-tooltip>
        </q-btn>

        <q-btn
          v-if="hints.length > 0"
          dense
          no-caps
          square
          :color="hints.length === 1 ? hints[0].color : 'primary'"
          :icon="hints.length === 1 ? hints[0].icon : 'mdi-bell'"
          class="q-mr-md"
        >
          {{ hints.length === 1 ? hints[0].message : `${hints.length} hints` }}
          <q-popup-proxy>
            <q-card>
              <q-card-section class="q-px-none">
                <q-list>
                  <q-item
                    v-for="hint in hints"
                    :key="hint.id"
                    clickable
                    v-close-popup
                    @click="hint.action"
                  >
                    <q-item-section avatar>
                      <q-icon :name="hint.icon" :color="hint.color" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>{{ hint.message }}</q-item-label>
                      <q-item-label caption>{{ hint.tooltip }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>

              </q-card-section>
            </q-card>
          </q-popup-proxy>
        </q-btn>

        <q-btn flat icon="mdi-message-fast-outline" no-caps @click="layoutStore.feedbackWindowOpened = true" label="Feedback">
          <q-tooltip>
            Feedback
          </q-tooltip>
        </q-btn>

        <q-btn-dropdown
          flat
          icon="mdi-account-outline"
          class="sm-hide xs-hide"
          no-caps
          label="user@email.com"
          :loading="userSyncing"
          v-if="currentUser">
          <q-item clickable v-ripple @click="layoutStore.showUserDialog" dense v-if="currentUser !== 'Guest'">
            <q-item-section>
              <q-item-label>
                User Plan
              </q-item-label>
            </q-item-section>
          </q-item>

          <q-item clickable v-ripple @click="layoutStore.appTourOpened = true" dense>
            <q-item-section>
              <q-item-label>
                Tutorial / App Tour
              </q-item-label>
            </q-item-section>
          </q-item>

          <q-item clickable v-ripple @click="layoutStore.toggleDarkMode($q)" dense>
            <q-item-section avatar>
              <q-icon :name="layoutStore.darkMode ? 'light_mode' : 'dark_mode'" />
            </q-item-section>
            <q-item-section>
              <q-item-label>
                {{ layoutStore.darkMode ? 'Light Mode' : 'Dark Mode' }}
              </q-item-label>
            </q-item-section>
          </q-item>
          <q-separator />
          <q-item clickable v-ripple @click="layoutStore.feedbackWindowOpened = true" dense>
            <q-item-section>
              <q-item-label>Feedback</q-item-label>
            </q-item-section>
          </q-item>
          <q-item clickable v-ripple dense v-if="roadmapUrl">
            <q-item-section>
              <q-item-label class="no-link-decoration">
                <a :href="roadmapUrl" target="_blank" class="no-link-decoration text-theme-primary">
                  Development Roadmap
                  <q-icon name="mdi-open-in-new" />
                </a>
              </q-item-label>
            </q-item-section>
          </q-item>
          <q-separator />
          <q-item clickable v-ripple @click="layoutStore.messageUsDialog = true" dense>
            <q-item-section>
              <q-item-label>Message Us!</q-item-label>
            </q-item-section>
          </q-item>
          <q-item clickable v-ripple dense>
            <q-item-section>
              <q-item-label>
                <a href="https://discord.gg/fyjaq25ZHB" target="_blank" class="no-link-decoration text-theme-primary">
                  Join Discord
                  <span class="discord-color">
                  <q-icon name="lab la-discord" /></span>
                </a>
              </q-item-label>
            </q-item-section>
          </q-item>
          <q-separator />
          <q-item v-if="layoutStore.desktopAppVersion" dense>
            <q-item-section>
              <q-item-label>Desktop app version {{ layoutStore.desktopAppVersion }}</q-item-label>
            </q-item-section>
          </q-item>
          <q-separator />
          <q-item clickable v-ripple @click="signOut" dense>
            <q-item-section>
              <q-item-label v-if="currentUser === 'Guest'">Login</q-item-label>
              <q-item-label v-else>Sign out</q-item-label>
            </q-item-section>
          </q-item>
        </q-btn-dropdown>
        <q-btn flat :icon="layoutStore.rightDrawerOpen ? 'chevron_right' : 'chevron_left'" @click="toggleRightDrawer" class=""/>

      </div>
    </div>

  </q-bar>
</template>

<script setup>
import {useFileStore} from "stores/file-store";
import {useLayoutStore} from "stores/layout-store";
import {computed} from "vue";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import {useCurrentUser, useFirebaseAuth} from "vuefire";
import {useQuasar} from "quasar";

const layoutStore = useLayoutStore();
const fileStore = useFileStore();
const $q = useQuasar();

let appWindow = null;
if(layoutStore.runsInDesktopApp()) {
  appWindow = getCurrentWebviewWindow();
}

const currentUser = computed(() => useCurrentUser()?.value?.email ?? 'Guest');
const auth = useFirebaseAuth();

const user = useCurrentUser();

const userSyncing = computed(() => layoutStore.userSyncIndicator);

const credits = computed(() => {
  if(layoutStore.userData) {
    return (layoutStore.userData.monthlyRemainingCredits ?? 0) + layoutStore.userData.maxUsage - layoutStore.userData.usage;
  }
  return null;
})

async function signOut() {
  await auth.signOut();

  window.location.reload();
}

//console.log(useCurrentUser());

const toggleLeftDrawer = () => {
  layoutStore.setLeftDrawerOpen(!layoutStore.leftDrawerOpen);
};

const toggleRightDrawer = () => {
  layoutStore.closeRightPanel();
};

const roadmapUrl = computed(() => {
  if(user) {
    return `https://inscriptor.features.vote/roadmap?api_key=8249b037-549a-474b-b236-8baa56499f47&user_id=${user.value.uid}&user_email=${user.value.email}&user_name=${user.value.displayName}`
  }
  return null;
})

const hints = computed(() => {
  const hintsList = [];

  // WritingStyle hint
  const writingStyle = fileStore.variables.find(v => v.title === 'WritingStyle');
  if (writingStyle && writingStyle.value && writingStyle.value.length < 50) {
    hintsList.push({
      id: 'writing-style-brief',
      type: 'tip',
      message: 'Writing style description too brief',
      icon: 'mdi-lightbulb-outline',
      color: 'warning',
      tooltip: 'Your $WritingStyle is less than 50 characters. Click to add more detail for better & more personalised AI results.',
      action: () => layoutStore.variableSettingsOpen = true
    });
  }

  return hintsList;
});

</script>

<style scoped>

</style>
