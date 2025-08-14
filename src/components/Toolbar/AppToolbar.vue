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
          no-caps
          square
          :flat="hints.length === 0"
          :color="hints.length === 1 ? hints[0].color : (hints.length === 0 ? undefined : 'primary')"
          class="q-mr-md"
        >
          <q-icon :name="hints.length === 1 ? hints[0].icon : 'mdi-message-badge'" class="q-mr-sm" />
          {{ hints.length === 1 ? hints[0].message : `${hints.length} messages` }}
          <q-popup-proxy>
            <q-card>
              <q-card-section class="q-pa-sm">
                <q-list>
                  <q-item
                    clickable
                    v-for="hint in hints"
                    :key="hint.id"
                  >
                    <q-item-section avatar>
                      <q-icon :name="hint.icon" :color="hint.color" />
                    </q-item-section>
                    <q-item-section clickable v-close-popup="hint.type !== 'news'" @click="hint.type === 'news' ? openNewsDetail(hint) : hint.action()" :class="hint.type === 'news' ? 'cursor-pointer' : ''">
                      <q-item-label>
                        <span v-if="hint.type === 'tip'" >Tip:</span>
                        {{ hint.message }}
                      </q-item-label>
                      <q-item-label caption>{{ hint.tooltip }}</q-item-label>
                    </q-item-section>
                    <q-item-section side v-if="hint.dismissible !== false">
                      <q-btn
                        flat
                        dense
                        round
                        icon="mdi-close"
                        size="sm"
                        @click="dismissHint(hint.id)"
                      />
                    </q-item-section>
                  </q-item>

                  <!-- Reset dismissed hints option -->
                  <div v-if="dismissedHints.length > 0" class="full-width flex justify-end">
                    <q-btn flat class="text-grey text-caption" @click="resetDismissedHints" no-caps :label="'Reset dismissed (' + dismissedHints.length + ')'" />
                  </div>
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
          :label="currentUser"
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
            <q-item-section>
              <q-item-label>
                {{ layoutStore.darkMode ? 'Light Mode' : 'Dark Mode (beta)' }}
              </q-item-label>
            </q-item-section>
            <q-item-section avatar>
              <q-icon :name="layoutStore.darkMode ? 'mdi-compare' : 'mdi-compare'" size="xs"/>
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

  <!-- News Detail Dialog -->
  <q-dialog v-model="newsDetailDialog">
    <q-card style="width: 700px; max-width: 90vw;">
      <q-card-section class="row items-center">
        <div class="col">
          <div class="text-h6">{{ selectedNews?.message }}</div>
          <div class="text-subtitle2 text-grey">
            {{ selectedNews?.originalData?.subtitle }}
            <span v-if="selectedNews?.originalData?.subtitle && selectedNews?.originalData?.date_created"> • </span>
            <span v-if="selectedNews?.originalData?.date_created">{{ formatDate(selectedNews.originalData.date_created) }}</span>
          </div>
        </div>
        <div class="col-auto">
          <q-btn icon="close" flat round dense v-close-popup />
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section class="q-pt-md prompt-results">
        <div v-html="selectedNews?.content" class="news-content"></div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Close" color="primary" no-caps v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import {useFileStore} from "stores/file-store";
import {useLayoutStore} from "stores/layout-store";
import {computed, ref, onMounted} from "vue";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import {useCurrentUser, useFirebaseAuth} from "vuefire";
import {useQuasar} from "quasar";
import { useStorage } from '@vueuse/core';
import { directusClient } from 'boot/directus';
import { readItems } from '@directus/sdk';
import { markdownToHtml } from 'src/common/utils/textUtils';

const layoutStore = useLayoutStore();
const fileStore = useFileStore();
const $q = useQuasar();

// Dismissed hints storage
const dismissedHints = useStorage('dismissed-hints', []);

// News data management
const news = ref([]);
const newsDetailDialog = ref(false);
const selectedNews = ref(null);

const fetchNews = async () => {
  try {
    const result = await directusClient.request(
      readItems('News', {
        limit: 5
      })
    );
    news.value = result || [];
  } catch (error) {
    console.warn('Failed to fetch news:', error);
  }
};

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

// Hint management functions
const dismissHint = (hintId) => {
  if (!dismissedHints.value.includes(hintId)) {
    dismissedHints.value.push(hintId);
  }
};

const resetDismissedHints = () => {
  dismissedHints.value = [];
};

const openNewsDetail = (hint) => {
  // Find the original news item to get access to date_created
  const originalNewsItem = news.value.find(item => `news-${item.id}` === hint.id);
  selectedNews.value = {
    ...hint,
    originalData: originalNewsItem
  };
  newsDetailDialog.value = true;
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    return new Date(dateString).toLocaleString();
  } catch (error) {
    return '';
  }
};

const hints = computed(() => {
  const hintsList = [];

  // Add news items first (higher priority)
  for (const newsItem of news.value) {
    const hintId = `news-${newsItem.id}`;
    if (!dismissedHints.value.includes(hintId)) {
      const formattedDate = formatDate(newsItem.date_created);
      const tooltip = formattedDate
        ? `${newsItem.subtitle || ''} ${newsItem.subtitle ? '• ' : ''}${formattedDate}`.trim()
        : newsItem.subtitle;

      hintsList.push({
        id: hintId,
        type: 'news',
        message: newsItem.title,
        icon: 'mdi-newspaper',
        color: 'info',
        tooltip: tooltip,
        content: markdownToHtml(newsItem.content || ''),
        dismissible: true,
        action: () => {} // No action needed for news
      });
    }
  }

  // WritingStyle hint
  const writingStyle = fileStore.variables.find(v => v.title === 'WritingStyle');
  if (writingStyle && writingStyle.value && writingStyle.value.length < 100) {
    hintsList.push({
      id: 'writing-style-brief',
      type: 'tip',
      message: 'Writing style description too brief',
      icon: 'mdi-lightbulb-outline',
      color: 'warning',
      tooltip: 'Your $WritingStyle is less than 100 characters. Click to add more detail for better & more personalised AI results.',
      dismissible: false,
      action: () => layoutStore.variableSettingsOpen = true
    });
  }

  return hintsList;
});

onMounted(() => {
  fetchNews();
});

</script>

<style scoped>

</style>
