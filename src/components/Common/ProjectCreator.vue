<template>
  <q-card-section class="row items-center">
    <div class="text-h6">New Project</div>
    <q-space />
    <q-btn icon="mdi-close" flat @click="$emit('close')" no-caps></q-btn>
  </q-card-section>
  <q-separator />
  <q-card-section class="q-gutter-y-sm q-pa-none">
    <q-stepper
      v-model="currentStep"
      flat
      ref="stepper"
      active-color="accent"
      done-color="primary"
      active-icon="mdi-circle-medium"
      animated
    >
      <q-step
        :name="1"
        title="Name"
        icon="mdi-file-document-edit-outline"
        :done="currentStep > 1"
      >
        <div class="row">
          <div class="col">
            <q-input
              autofocus
              outlined
              filled
              label="Enter Project Name..."
              v-model="newProjectName"
              :rules="[val => !!val && val.length >= 5 || 'Project name must be at least 5 characters long']"
            />
          </div>
        </div>
      </q-step>

      <q-step
        :name="2"
        title="Template"
        icon="mdi-folder-multiple-outline"
        :done="currentStep > 2"
      >
        <div class="text-subtitle2 q-mb-md text-primary text-center">
          Choose a template to get started
        </div>
        <div class="row q-gutter-md justify-center q-mb-md">
          <div
            v-for="template in projectTemplates"
            :key="template.id"
            class="col-4"
          >
            <q-card
              :class="{
                'template-card': true,
                'template-selected bg-accent text-white': newProjectType === template.id
              }"
              class="inscriptor-shadow-1 cursor-pointer"
              @click="newProjectType = template.id"
              clickable
            >
              <q-card-section class="text-center q-pa-md">
                <q-icon
                  :name="template.icon"
                  size="28px"
                  :color="newProjectType === template.id ? 'white' : 'grey-6'"
                  class="q-mb-sm"
                />
                <div class="text-h6 q-mb-sm">{{ template.label }}</div>
                <div class="text-caption">
                  {{ template.description }}
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-step>

      <q-step
        :name="3"
        title="Writing Style"
        icon="mdi-palette-outline"
        :done="currentStep > 2"
      >
        <div class="text-subtitle2 q-mb-md text-primary">
          <div>Choose your Writing Style (optional)</div>
          <div class="text-caption">Writing style description will be fed into AI prompts to make it generate text that closely follows your style.</div>
        </div>
        <div class="row q-mb-sm">
          <div
            v-for="writingStyle in writingStyles.slice((current - 1) * pageSize, current * pageSize)"
            :key="writingStyle"
            class="col-4 q-pa-sm"
          >
            <WritingStyleSelectorItem
              @writing-style-set="writingStyleValue = writingStyle.value"
              :writingStyle="writingStyle"
              :currentValue="writingStyleValue"
            />
          </div>
        </div>
        <div class="row justify-center q-mb-lg">
          <q-pagination
            v-model="current"
            :max="maxPages"
            :max-pages="3"
            direction-links
          />
        </div>

        <div class="q-mb-md" v-if="showCustomInput">
          <q-input
            dense
            filled
            outlined
            type="textarea"
            flat
            input-style="height: 220px;"
            v-model="writingStyleValue"
          />
        </div>
        <div class="row" v-if="showCustomInput">
          <q-btn
            flat
            color="primary"
            class="full-width"
            icon="mdi-close"
            @click="toggleWritingStyleMode"
            no-caps
          />
        </div>
        <template v-else>
          <div class="row justify-center scroll-y q-px-md q-py-md rounded-borders" style="height: 250px;" v-if="writingStyleValue">
            <div class="prompt-results" v-html="markdownToHtml(writingStyleValue)" />
          </div>
          <div class="row" v-if="writingStyleValue">
            <q-btn
              flat
              color="primary"
              class="full-width"
              :icon="showCustomInput ? 'mdi-chevron-up' : 'mdi-pencil-outline'"
              :label="showCustomInput ? 'Hide Custom Input' : 'Customize'"
              @click="toggleWritingStyleMode"
              no-caps
            />
          </div>
          <div v-if="!writingStyleValue" style="height: 250px;" class="flex justify-center">
            <q-btn
              flat
              color="primary"
              class="full-width"
              icon="mdi-pencil-outline"
              label="Create Custom Style"
              @click="toggleWritingStyleMode"
              no-caps
            />
          </div>

        </template>
      </q-step>

      <q-step
        :name="4"
        title="Finish"
        icon="mdi-cog-outline"
        :done="currentStep > 4"
      >
        <div class="text-subtitle2 q-mb-md text-primary">
          Finish creating your project!
        </div>
        <div class="column q-gutter-xs q-mb-md">
          <q-checkbox
            v-model="syncToCloud"
            :label="syncToCloud ? 'Store Project on Inscriptor Cloud (recommended)' : 'Store project to local file'"
            :disable="user.isAnonymous"
          />
          <q-checkbox
            v-model="importRecommendedPrompts"
            :label="importRecommendedPrompts ? 'Import recommended AI prompts from Inscriptor Hub (recommended)' : 'Start without AI prompts and models'"
          />
        </div>
      </q-step>

      <template v-slot:navigation>
        <q-stepper-navigation>
          <q-btn
            @click="isLastStep ? confirmNewProject() : $refs.stepper.next()"
            :color="isLastStep ? 'accent' : 'accent'"
            :label="isLastStep ? 'Create Project' : (currentStep === 3 ? (writingStyleValue.length === 0 ? 'Skip' : 'Continue') : 'Continue')"
            :disable="nextDisabled()"
            :loading="creatingProject"
          />
          <q-btn
            v-if="currentStep > 1"
            flat
            color="primary"
            @click="$refs.stepper.previous()"
            label="Back"
            no-caps
            class="q-ml-sm"
          />
        </q-stepper-navigation>
      </template>
    </q-stepper>
  </q-card-section>
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
import {hasFlag, markdownToHtml} from "src/common/utils/textUtils";

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
const writingStyleValue = ref('');
const showCustomInput = ref(false);

const currentStep = ref(3);

const maxPages = computed(() => Math.ceil(writingStyles.length / pageSize));
const current = ref(1);
const pageSize = 3;

const creatingProject = ref(false);

// Computed properties for stepper
const isLastStep = computed(() => {
  return currentStep.value === 4;
});

// Validation functions
function nextDisabled() {
  switch (currentStep.value) {
    case 1:
      return !newProjectName.value || newProjectName.value.length < 2;
    case 2:
      return !newProjectType.value;
    case 3:
      return false; // Options step doesn't require validation
    case 4:
      return false; // Writing style step doesn't require validation
    default:
      return false;
  }
}

function toggleWritingStyleMode() {
  showCustomInput.value = !showCustomInput.value;
}

const projectTemplates = [
  {
    label: 'Fiction',
    description: 'Novel, short story or any other narrative project.',
    icon: 'mdi-book-open-page-variant-outline',
    id: 'story',
  },
  {
    label: 'Non-Fiction',
    description: 'Projects, articles, business ideas and any other non-fiction projects.',
    icon: 'mdi-text-box-outline',
    id: 'nonfiction',
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

    if(newProjectName.value.length < 5) {
      Notify.create({
        message: 'Project name must be at least 5 characters long.',
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

    try {
      fileStore.setCreatingNewProject(true);

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
      fileStore.setCreatingNewProject(false);
    }
  } finally {
    creatingProject.value = false;
  }
}

async function saveCurrentProject() {
  try {
    fileStore.setSaving(true);

    if(fileStore.projectId && fileStore.canSave()) {
      // offline file sync if not synced on cloud
      if(fileStore.projectSettings?.syncToCloud === false) {
        await fileStore.saveProjectDataToLocalFile();
      } else {
        await fileStore.syncProjectToCloud(true);
      }
    }
  } finally {
    fileStore.setSaving(false);
  }
}

</script>

<style scoped>
.template-card {
  border: 2px solid transparent;
  transition: all 0.4s ease;
}

.template-card:hover {
  border-color: var(--q-accent);
  transform: translateY(-5px);
}

.template-selected {
  border-color: var(--q-accent);
}
</style>
