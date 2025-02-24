<template>
  <q-page class="">
    <div class="full-width full-height">

      <q-splitter
        v-model="layoutStore.layoutSplitterModel"
        class="full-height"
        :limits="[20,100]"
      >

        <template v-slot:before>
          <div class="" style="height: calc(100vh - 50px)">
            <div class="fit" style="background-color: rgba(0,0,0,0)">
              <div class="" id="file">
                <FileDetail />
              </div>
            </div>
          </div>

        </template>

        <template v-slot:after>

          <div class="" style="height: calc(100vh - 33px)">
            <div class="absolute fit">
                <div class="fit left-border" style="background-color: rgba(0,0,0,0)">
                  <RightMenuComponent />
                </div>
            </div>
          </div>

        </template>

      </q-splitter>

    </div>
  </q-page>
</template>

<script setup>

import {onMounted} from 'vue'
import FileDetail from "components/MainPanel/FileDetail.vue";
import RightMenuComponent from "components/RightMenu/RightMenuComponent.vue";
import {useLayoutStore} from "stores/layout-store";

const layoutStore = useLayoutStore();

onMounted(() => {
})

</script>
