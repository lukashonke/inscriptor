<template>
  <q-dialog v-model="layoutStore.appTourOpened"
            transition-show="slide-down"
            transition-hide="fadeOut">
    <q-card style="width: 700px; max-width: 80vw;">
      <q-card-section class="row items-center">
        <div class="text-h6">
          <q-icon name="mdi-school-outline" class="text-accent q-mb-xs q-mr-xs" />
          Inscriptor App Tour
        </div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="q-gutter-y-sm">

        <div class="row q-gutter-x-sm">
          <div class="col-auto flex items-center q-mr-sm">
            <q-icon :name="tutorial1Completed ? 'mdi-check' : '' " size="20px" class="bordered" :class="tutorial1Completed ? 'bg-accent text-white' : 'bg-white text-primary'"/>
          </div>
          <div class="col-auto flex items-center" style="width: 200px">
            <q-btn no-caps color="green-5" @click="firstSteps()" class="full-width" size="13px" padding="3px 3px">
              <div class="row">
              <div class="col flex justify-center">
                First steps
              </div>
            </div>
            </q-btn>
          </div>
          <div class="col flex items-center text-left q-ml-md">
            Show me around Inscriptor quickly.
          </div>
          <div class="col-auto flex items-center flex justify-end text-caption">
            <q-icon name="mdi-clock-time-four-outline" class="text-caption q-mr-xs" />
            30 seconds
          </div>
        </div>

        <div class="row q-gutter-x-sm q-mt-lg">
          <div class="col-auto flex items-center q-mr-sm">
            <q-icon :name="tutorial2Completed ? 'mdi-check' : '' " size="20px" class="bordered" :class="tutorial2Completed ? 'bg-accent text-white' : 'bg-white text-primary'"/>
          </div>
          <div class="col-auto flex items-center" style="width: 200px">
            <q-btn no-caps color="indigo-5" @click="writingWithAi()" class="full-width"  size="13px" padding="3px 3px">
              <div class="row">
                <div class="col flex justify-center">
                  Writing with AI
                </div>
              </div>
            </q-btn>
          </div>
          <div class="col flex items-center text-left q-ml-md">
            Explain AI for writing.
          </div>
          <div class="col-auto flex items-center flex justify-end text-caption">
            <q-icon name="mdi-clock-time-four-outline" class="text-caption q-mr-xs" />
             1 minute
          </div>
        </div>

        <div class="row q-gutter-x-sm">
          <div class="col-auto flex items-center q-mr-sm">
            <q-icon :name="tutorial3Completed ? 'mdi-check' : '' " size="20px" class="bordered" :class="tutorial3Completed ? 'bg-accent text-white' : 'bg-white text-primary'"/>
          </div>
          <div class="col-auto flex items-center" style="width: 200px">
            <q-btn no-caps color="indigo-5" @click="brainstormWithAi()" class="full-width"  size="13px" padding="3px 3px">
              <div class="row">
                <div class="col flex justify-center">
                  Brainstorming with AI
                </div>
              </div>
            </q-btn>
          </div>
          <div class="col flex items-center text-left q-ml-md">
            Showcase AI for brainstorming.
          </div>
          <div class="col-auto flex items-center flex justify-end text-caption">
            <q-icon name="mdi-clock-time-four-outline" class="text-caption q-mr-xs" />
             1 minute
          </div>
        </div>

        <div class="row q-gutter-x-sm">
          <div class="col-auto flex items-center q-mr-sm">
            <q-icon :name="tutorial4Completed ? 'mdi-check' : '' " size="20px" class="bordered" :class="tutorial4Completed ? 'bg-accent text-white' : 'bg-white text-primary'"/>
          </div>
          <div class="col-auto flex items-center" style="width: 200px">
            <q-btn no-caps color="indigo-5" @click="outlineTutorial()" class="full-width"  size="13px" padding="3px 3px">
              <div class="row">
                <div class="col flex justify-center">
                  Outlining & Planning
                </div>
              </div>
            </q-btn>
          </div>
          <div class="col flex items-center text-left q-ml-md">
            Plan your project with ease.
          </div>
          <div class="col-auto flex items-center flex justify-end text-caption">
            <q-icon name="mdi-clock-time-four-outline" class="text-caption q-mr-xs" />
            1 minute
          </div>
        </div>

        <div class="row q-gutter-x-sm">
          <div class="col-auto flex items-center q-mr-sm">
            <q-icon :name="tutorial5Completed ? 'mdi-check' : '' " size="20px" class="bordered" :class="tutorial5Completed ? 'bg-accent text-white' : 'bg-white text-primary'"/>
          </div>
          <div class="col-auto flex items-center" style="width: 200px">
            <q-btn no-caps color="indigo-5" @click="createPromptsTutorial()" class="full-width"  size="13px" padding="3px 3px">
              <div class="row">
                <div class="col flex justify-center">
                  Create AI Prompts
                </div>
              </div>
            </q-btn>
          </div>
          <div class="col flex items-center text-left q-ml-md">
            Create your own AI prompts.
          </div>
          <div class="col-auto flex items-center flex justify-end text-caption">
            <q-icon name="mdi-clock-time-four-outline" class="text-caption q-mr-xs" />
            1 minute
          </div>
        </div>

        <div class="row q-mt-lg" v-if="!advancedTutorialsShown">
          <div class="col-auto flex items-center q-mr-md" style="visibility: hidden">
            <q-icon :name="tutorial1Completed ? 'mdi-check' : '' " size="20px" class="bordered" :class="tutorial1Completed ? 'bg-accent text-white' : 'bg-white text-primary'"/>
          </div>
          <div class="col-auto flex items-center" style="width: 200px">
            <q-btn flat no-caps label="Show advanced..." v-close-popup class="full-width" @click="advancedTutorialsShown = true"/>
          </div>
        </div>

        <div v-if="advancedTutorialsShown" class="row q-mt-lg">
          <span class="text-caption">Advanced tutorials are coming soon!</span>
        </div>



      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn flat label="Close Tour" v-close-popup/>
      </q-card-actions>
    </q-card>

  </q-dialog>
</template>

<script setup>
  import {useLayoutStore} from "stores/layout-store";
  import {ref} from "vue";
  import {useCurrentUser} from "vuefire";
  import {useLocalStorage} from "@vueuse/core";

  const user = useCurrentUser();

  const layoutStore = useLayoutStore();

  const advancedTutorialsShown = ref(false);

  function firstSteps() {
    layoutStore.appTourOpened = false;
    const driver = layoutStore.openTutorial("project_created", () => {
      layoutStore.appTourOpened = true;
    });

    completeTutorial('1');
  }

  function writingWithAi() {
    layoutStore.tutorialOpened = true;
    layoutStore.tutorialCode = "https://app.supademo.com/embed/cm5gtrzdy0bt35ubaeqb3zbep?embed_v=2";

    completeTutorial('2');
  }

  function brainstormWithAi() {
    layoutStore.tutorialOpened = true;
    layoutStore.tutorialCode = "https://app.supademo.com/embed/cm5gw61rp0cqy5ubai4b8106n?embed_v=2";

    completeTutorial('3');
  }

  function outlineTutorial() {
    layoutStore.tutorialOpened = true;
    layoutStore.tutorialCode = "https://app.supademo.com/embed/cm5o15fi60hfvm5nfd31fjz6m?embed_v=2";

    completeTutorial('4');
  }

  function createPromptsTutorial() {
    layoutStore.tutorialOpened = true;
    layoutStore.tutorialCode = "https://app.supademo.com/embed/cm5nzok4l0fxwm5nfsshquzfi?embed_v=2";

    completeTutorial('5');
  }

  const tutorial1Completed = useLocalStorage('tutorial_1_completed', false);
  const tutorial2Completed = useLocalStorage('tutorial_2_completed', false);
  const tutorial3Completed = useLocalStorage('tutorial_3_completed', false);
  const tutorial4Completed = useLocalStorage('tutorial_4_completed', false);
  const tutorial5Completed = useLocalStorage('tutorial_5_completed', false);

  function completeTutorial(tutorial) {
    if(tutorial === '1') tutorial1Completed.value = true;
    if(tutorial === '2') tutorial2Completed.value = true;
    if(tutorial === '3') tutorial3Completed.value = true;
    if(tutorial === '4') tutorial4Completed.value = true;
    if(tutorial === '5') tutorial5Completed.value = true;
  }


</script>

<style scoped>

</style>
