<template>
  <q-dialog v-model="layoutStore.projectSelectionDialogOpen" :persistent="!fileStore.projectId" @beforeShow="onShow">

    <q-card style="max-width: 90vw;" :style="{width: (creatingNewProject === true ? '1200px' : '700px')}" class="transform-animation">
      <q-card-section v-if="!creatingNewProject" class="q-mb-md">

        <div class="q-mb-md">
          <span class="text-h6">Projects:</span>

          <q-btn flat dense @click="layoutStore.projectSelectionDialogOpen = false" class="float-right q-ml-md" icon="mdi-close" v-if="fileStore.projectId"  />
          <q-btn flat dense @click="loadCloudProjects()" class="float-right" icon="mdi-sync" :loading="cloudProjectsLoading" />
        </div>

        <div class="q-mb-lg">
          <div class="text-caption" v-if="!user.isAnonymous">
            Logged in as <span class="text-bold">{{ user.email }}</span>
            <q-btn flat dense color="primary" @click="signOut" label="Sign out" size="12px" no-caps class="q-ml-md"/>
          </div>

          <div class="text-caption" v-else>
            Logged in as guest
            <q-btn flat dense color="primary" @click="signOut" label="Log In" size="12px" no-caps class="q-ml-md"/>
          </div>

          <div class="q-mt-lg text-center">
            <q-btn-toggle
              v-model="projectType"
              unelevated no-caps class="bordered inscriptor-highlight-btn" toggle-color="primary"
              :options="projectTypes"
            />
          </div>
        </div>

        <q-list separator bordered v-if="projectType === 'cloud'" style="max-height: 500px; overflow-y: auto">
          <q-item v-for="(project, index) in projects" :key="index" :active="isCloudProjectLoaded(project)" clickable :title="project.projectId" class="">
            <q-item-section>
              <q-item-label class="text-subtitle2" v-if="fileStore.projectId !== project.projectId" @click="loadProject(project.projectId)">
                  {{ project.projectName }}
                <q-badge color="accent" v-if="isCloudProjectLoaded(project)" label="Opened" />
              </q-item-label>
              <q-item-label class="text-subtitle2" v-else>
                  {{ project.projectName }}
                <q-badge color="accent" v-if="isCloudProjectLoaded(project)" label="Opened" />
              </q-item-label>
              <q-item-label caption>
                Last opened: {{ new Date(project.lastOpened).toLocaleString() }}
              </q-item-label>
            </q-item-section>
            <q-item-section top side class="flex items-center">
              <div class="text-grey-8 q-gutter-xs flex items-center">
                <q-btn-dropdown class="gt-xs q-mr-md flex items-center" padding="sm sm" size="12px" flat dense color="primary" label="Open" icon="mdi-folder-open-outline" @click="loadProject(project.projectId)" v-if="fileStore.projectId !== project.projectId" split :loading="loadingProject === project.projectId">
                  <q-list>
                    <q-item clickable v-ripple dense @click="downloadProject(project.projectId)">
                      <q-item-section side>
                        <q-icon name="mdi-download" />
                      </q-item-section>

                      <q-item-section>
                        <q-item-label>Download project</q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-btn-dropdown>

                <q-btn class="gt-xs" size="12px" flat dense icon="mdi-sync" padding="sm sm" @click="doSyncCurrentProjectToCloud()" v-if="fileStore.projectId === project.projectId && !fileStore.projectSettings?.syncToCloud"/>
                <q-btn size="12px" flat dense icon="mdi-delete-outline" padding="sm sm" color="negative" @click="removeProjectFromCloud(project.projectId)" v-if="!isCloudProjectLoaded(project) || fileStore.projectSettings?.syncToCloud"/>
              </div>
            </q-item-section>
          </q-item>

          <q-item v-if="projects.length === 0 && !user.isAnonymous">
            <q-item-section class="text-center">
              <q-item-label class="">
                <q-chip clickable @click="creatingNewProject = true" icon="mdi-plus">Create a project to get started</q-chip>
              </q-item-label>
            </q-item-section>
          </q-item>

          <q-item v-if="user.isAnonymous">
            <q-item-section class="text-center">
              <q-item-label class="">
                <q-chip >Cloud projects are available only for signed in users.</q-chip>
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>

        <div class="text-caption q-mt-sm text-center text-grey" v-if="projectType === 'cloud' && !user.isAnonymous">Cloud Projects: {{ projects.length }} / {{ layoutStore.getMaxProjects() }}</div>
        <div class="text-caption q-mt-sm text-center" v-if="projectType === 'cloud' && !user.isAnonymous">
          <q-btn v-if="fileStore.projectId && fileStore.projectSettings?.syncToCloud === false" color="primary" dense label="Upload current project to cloud" @click="doSyncCurrentProjectToCloud()"/>
        </div>

        <q-list separator bordered v-if="projectType === 'local'" style="max-height: 500px; overflow-y: auto">

          <q-item v-if="!layoutStore.runsInDesktopApp()" class="text-center q-my-md">
            <q-item-section>
              <q-item-label class="">
                <span class="">Local projects (offline projects) are available in the Desktop app. </span>
                <div class="q-mt-sm"><a href="https://inscriptor.io/download" target="_blank" class="text-primary">Download Desktop app</a></div>
              </q-item-label>
            </q-item-section>
          </q-item>

          <template v-else>
            <q-item v-for="(project, index) in fileStore.recentProjectDataFiles" :key="index" :active="isLocalProjectLoaded(project)">
              <q-item-section>
                <q-item-label class="text-subtitle2">
                  {{ project }}
                  <q-badge color="accent" v-if="isLocalProjectLoaded(project)" label="Opened" />
                </q-item-label>
              </q-item-section>

              <q-item-section top side>
                <div class="text-grey-8 q-gutter-xs">
                  <q-btn class="gt-xs q-mr-sm" padding="xs sm" size="12px" flat dense color="primary" label="Open" icon="mdi-folder-open-outline-open" @click="loadLocalProject(project)" v-if="fileStore.currentLocalProjectDataFile !== project">
                  </q-btn>
                  <q-btn icon="mdi-close" color="primary" flat dense @click="removeRecentProject(index)"/>
                </div>
              </q-item-section>
            </q-item>

            <q-item v-if="fileStore.recentProjectDataFiles.length === 0">
              <q-item-section>
                <q-item-label class="">
                  <q-chip>No recent local projects yet. </q-chip>
                </q-item-label>
              </q-item-section>
            </q-item>

          </template>

        </q-list>

        <div class="text-caption q-mt-sm text-center text-grey" v-if="projectType === 'local'">Local Projects: unlimited</div>

      </q-card-section>


      <q-card-actions class="row" v-if="!creatingNewProject">
        <div class="col-auto">
          <q-btn color="accent" @click="creatingNewProject = true" icon="mdi-plus" >New Project</q-btn>
        </div>
        <div class="col">
        </div>
        <div class="col-auto">

        </div>
        <div class="col">

        </div>
        <div class="col-auto" v-if="layoutStore.runsInDesktopApp()">
          <q-btn icon="mdi-upload"  flat color="secondary" @click="importLocalProject()" class="float-right">Open Local Project</q-btn>
        </div>
      </q-card-actions>

      <ProjectCreator v-if="creatingNewProject" :default-project-type="projectType" @close="creatingNewProject = false"/>
    </q-card>
  </q-dialog>
</template>

<script setup>
  import {useLayoutStore} from "stores/layout-store";
  import {usePromptStore} from "stores/prompt-store";
  import {onMounted, ref} from "vue";
  import ProjectCreator from "components/Common/ProjectCreator.vue";
  import {getProjects} from "src/common/apiServices/userProjectService";
  import {getCurrentUser, useCurrentUser, useFirebaseAuth} from "vuefire";
  import {useFileStore} from "stores/file-store";
  import {Dialog, Notify} from "quasar";

  const layoutStore = useLayoutStore();
  const promptStore = usePromptStore();
  const fileStore = useFileStore();

  const tab = ref('cloud');

  const projectType = ref('cloud');
  const projectTypes = [
    {label: 'Cloud projects', value: 'cloud', icon: 'mdi-cloud-outline'},
    {label: 'Local projects', value: 'local', icon: 'mdi-folder-outline'},
  ];

  const creatingNewProject = ref(false);
  const projects = ref([]);
  const cloudProjectsLoading = ref(false);

  const loadingProject = ref(null);

  const auth = useFirebaseAuth();

  const user = useCurrentUser();

  async function onShow() {
    creatingNewProject.value = false;

    await loadCloudProjects();
  }

  onMounted(async () => {
    creatingNewProject.value = false;

    const user = await getCurrentUser();

    try {
      await loadCloudProjects();
    } catch (e) {
      layoutStore.errorDialogOpen = true;
    }

    if(projects.value.length === 0 && !user.isAnonymous) {
      creatingNewProject.value = true;
    }
  });

  async function loadCloudProjects() {
    if(!user || user.value === null || user.value?.uid === null) {
      return;
    }

    cloudProjectsLoading.value = true;

    const cloudProjects = await getProjects(user);

    projects.value.splice(0, projects.value.length);

    projects.value.push(...cloudProjects);

    cloudProjectsLoading.value = false;
  }

  async function loadProject(projectId) {
    loadingProject.value = projectId;

    await saveCurrentProject();

    try {
      await fileStore.loadCloudProject(projectId);

      layoutStore.projectSelectionDialogOpen = false;

    }  finally {
      loadingProject.value = null;
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

  async function loadLocalProject(projectFile) {
    await saveCurrentProject();

    try {
      await fileStore.loadDataFile(projectFile)

      layoutStore.projectSelectionDialogOpen = false;
    } catch (e) {
      Notify.create({
        message: 'Error loading project. Check if the file exists and try to open it again.',
        color: 'negative',
        position: 'top',
        timeout: 5000,
      });
    }

  }

  async function downloadProject(projectId) {
    await fileStore.downloadCloudProject(projectId);
  }

  async function importLocalProject() {
    const selected = await fileStore.loadDataFile();

    if(selected) {
      if(fileStore.projectSettings?.syncToCloud === true) {
        await fileStore.syncProjectToCloud(true);
      }

      await loadCloudProjects();

      layoutStore.projectSelectionDialogOpen = false;
    }
  }

  async function doSyncCurrentProjectToCloud() {

    try {
      fileStore.projectSettings.syncToCloud = true;

      await fileStore.saveProjectToCloud();
      await fileStore.syncProjectToCloud(true);

      await loadCloudProjects();

    } catch (e) {
      fileStore.projectSettings.syncToCloud = false;
      Notify.create({
        message: 'Project cannot be synced to the cloud. Is it too big? You might need to upgrade your subscription.',
        color: 'negative',
        position: 'top',
        actions: [
          { label: 'Upgrade', color: 'white', handler: () => { layoutStore.showUserDialog(); } }
        ],
        timeout: 10000,
      });
      console.error(e);
    }

  }

  async function removeProjectFromCloud(projectId) {
    Dialog.create({
      title: 'Remove from cloud',
      message: 'Are you sure you want to remove this project from the cloud? This cannot be undone.',
      cancel: true,
      persistent: true
    }).onOk(async () => {
      //fileStore.exiting = true;

      if(projectId === fileStore.projectId) {
        fileStore.projectSettings.syncToCloud = false;
      }

      await fileStore.deleteCloudProject(projectId);
      await loadCloudProjects();

      if(fileStore.projectId === projectId) {
        window.location.reload();
      }

    }).onCancel(() => {
      // console.log('>>>> Cancel')
    }).onDismiss(() => {
      // console.log('I am triggered on both OK and Cancel')
    })
  }

  async function signOut() {
    await auth.signOut();

    //const client = directusClient;
    //localStorage.setItem("userToken", '');
    //await client.logout();

    window.location.reload();
  }

  function isCloudProjectLoaded(project) {
    return fileStore.projectId === project.projectId && fileStore.projectSettings?.syncToCloud;
  }

  function isLocalProjectLoaded(project) {
    return fileStore.currentLocalProjectDataFile === project && !fileStore.projectSettings?.syncToCloud;
  }

  function removeRecentProject(index) {
    fileStore.recentProjectDataFiles.splice(index, 1);
  }
</script>

<style scoped>

.transform-animation {
  transition: all 0.5s;

}

</style>
