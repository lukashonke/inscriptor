<template>
  <q-card-section class="row items-center">
    <div class="text-h6">Create Project</div>
    <q-space />
  </q-card-section>
  <q-separator />
  <q-card-section>

    <div class="row q-gutter-x-md">
      <div class="col">
        <q-input autofocus outlined flat v-model="newProjectName" label="New Project Name" />
      </div>
      <div class="col-auto flex items-center">
        <q-btn flat dense icon="las la-cog" @click="settingsExpanded = !settingsExpanded" />
      </div>
    </div>
  </q-card-section>

  <q-card-section>
    <q-slide-transition>
      <div v-show="settingsExpanded" class="">
        <div class="full-width">
          <q-select square filled dense :options="projectTemplates" v-model="newProjectType" label="Project Template" emit-value option-label="label" option-value="id" style="max-width: 400px">
            <template v-slot:option="scope">
              <q-item v-bind="scope.itemProps">
                <q-item-section avatar>
                  <q-icon :name="scope.opt.icon" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ scope.opt.label }}</q-item-label>
                  <q-item-label caption>{{ scope.opt.description }}</q-item-label>
                </q-item-section>
              </q-item>
            </template>
          </q-select>
        </div>
        <div class="full-width q-mt-sm">
          <q-checkbox v-model="syncToCloud" label="Sync to cloud" :disable="user.isAnonymous" />
        </div>

        <div class="row full-width">
          <q-checkbox v-model="importRecommendedPrompts" label="Import recommended AI prompts from Inscriptor Hub" />
        </div>

        <div class="row">
          <q-checkbox v-model="setWritingStyle" label="Define Writing Style" />
        </div>

        <q-slide-transition>
          <div v-show="setWritingStyle">

            <div class="q-mt-md">
              <q-input dense filled autogrow outlined flat  v-model="writingStyleValue" label="Writing Style description" hint="Writing style description will be fed into AI prompts to make it generate text that suits your style. Keep it short and concise" />
            </div>

            <div class="row q-mt-md q-mb-sm">
              <div v-for="writingStyle in writingStyles.slice((current - 1) * pageSize, current * pageSize)" :key="writingStyle" class="col-4 q-pa-sm">
                <WritingStyleSelectorItem  @writing-style-set="writingStyleValue = writingStyle.value" :writingStyle="writingStyle" />
              </div>
            </div>

            <div class="row justify-center q-mt-sm q-mb-md ">
              <q-pagination
                v-model="current"
                :max="maxPages"
                direction-links
              />
            </div>


          </div>
        </q-slide-transition>

      </div>
    </q-slide-transition>
    <!--<q-expansion-item label="Settings" switch-toggle-side>

    </q-expansion-item>-->

  </q-card-section>

  <q-card-actions class="row justify-end">
    <q-btn color="accent" @click="confirmNewProject()" class="full-width" :loading="creatingProject">Create project</q-btn>
  </q-card-actions>
</template>

<script setup>
import {computed, ref} from "vue";
import {useLayoutStore} from "stores/layout-store";
import {usePromptStore} from "stores/prompt-store";
import {getProjects, setUserState} from "src/common/apiServices/userProjectService";
import {useCurrentUser} from "vuefire";
import {useFileStore} from "stores/file-store";
import {Notify} from "quasar";
import {writingStyles} from "assets/writingStyles/writingStyleList";
import WritingStyleSelectorItem from "components/Common/WritingStyleSelectorItem.vue";
import {guid} from "src/common/utils/guidUtils";
import {hasFlag} from "src/common/utils/textUtils";

const layoutStore = useLayoutStore();
const promptStore = usePromptStore();
const fileStore = useFileStore();

const props = defineProps({
  defaultProjectType: {
    type: String,
    default: 'cloud',
  }
})

const user = useCurrentUser();

const newProjectName = ref('');
const newProjectType = ref('story');
const syncToCloud = ref(user.value.isAnonymous ? false : props.defaultProjectType === 'cloud');
const importRecommendedPrompts = ref(true);
const setWritingStyle = ref(false);
const writingStyleValue = ref('');

const settingsExpanded = ref(false);

const maxPages = computed(() => Math.ceil(writingStyles.length / pageSize));
const current = ref(1);
const pageSize = 3;

const creatingProject = ref(false);


const projectTemplates = [
  {
    label: 'Fiction Template',
    description: 'Kick off a new novel, short story or any other narrative project.',
    icon: 'las la-book',
    id: 'story',
  },
  {
    label: 'Non-Fiction Template',
    description: 'Kick off any kind of a non-fiction project.',
    icon: 'las la-folder',
    id: 'nonfiction',
  },
  {
    label: 'Blank Project',
    description: 'Create a new project from scratch.',
    icon: 'las la-file',
    id: 'blank',
  },
]

async function canCreateProject() {
  const cloudProjects = await getProjects(user);

  return cloudProjects.length < layoutStore.getMaxProjects();
}

async function confirmNewProject() {
  if(!user)
    return;

  creatingProject.value = true;

  try {
    const cloudProjects = await getProjects(user);

    if(newProjectName.value.length < 2) {
      Notify.create({
        message: 'Project name must be at least 2 characters long.',
        color: 'negative',
        position: 'top',
        timeout: 3000,
      });

      return;
    }

    if(cloudProjects.find(p => p.projectName === newProjectName.value)) {
      Notify.create({
        message: 'A project with this name already exists.',
        color: 'negative',
        position: 'top',
        timeout: 3000,
      });

      return;
    }


    if(!await canCreateProject() && syncToCloud.value) {
      Notify.create({
        message: 'You have reached the maximum number of Cloud projects allowed for your subscription level. You can still use Local projects.',
        color: 'warning',
        position: 'top',
        actions: [
          { label: 'Upgrade', color: 'white', handler: () => { layoutStore.showUserDialog(); } }
        ],
        timeout: 3000,
      });

      return;
    }

    const blankProject = {
      projectId: guid(),
      projectName: newProjectName.value,

      data: {
        projectType: newProjectType.value,
        projectSettings: {
          syncToCloud: syncToCloud.value,
          initialWritingStyle: writingStyleValue.value,
        },
      },

      userSettings: {},
    }

    await saveCurrentProject();

    await fileStore.loadProject(blankProject, true, null, importRecommendedPrompts.value, writingStyleValue.value.length > 0);

    if (syncToCloud.value) {
      await fileStore.saveProjectToCloud();
    } else {
      const filePath = await fileStore.saveProjectDataToLocalFile();
      fileStore.currentLocalProjectDataFile = filePath;
      fileStore.addRecentProjectDataFile(filePath);
    }

    layoutStore.projectSelectionDialogOpen = false;

    const data = await layoutStore.loadUserData();
    if(!user.value.isAnonymous && data) {
      if(!hasFlag(data.state, 2)) {
        // no first project yet
        layoutStore.newUserWelcomeDialogStep = 0;
        layoutStore.newUserWelcomeDialog = true;

        await setUserState(await user.value.getIdToken(), { projectCreated: true })
      }
    }

  } finally {
    creatingProject.value = false;
  }
}

async function saveCurrentProject() {
  if(fileStore.projectId && fileStore.canSave()) {

    // offline file sync if not synced on cloud
    if(fileStore.projectSettings?.syncToCloud === false) {
      await fileStore.saveProjectDataToLocalFile();
    } else {
      await fileStore.syncProjectToCloud(true);
    }
  }
}

</script>

<style scoped>

</style>
