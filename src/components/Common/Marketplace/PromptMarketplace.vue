<template>
  <q-card style="width: 1400px; max-width: 95vw;" class="full-height">
    <q-card-section class="row no-padding full-height">
      <div class="col-auto bg-accent-1 right-border" style="width: 210px;">
        <div class="scroll fit">
          <div class="bg-accent text-white cursor-pointer" style="margin-top: 19px; margin-bottom: 19px" @click="selectedCategory = 'Packs'">
            <div class="text-h6 text-aleo text-center">
              Inscriptor Hub
            </div>
          </div>
          <div class="">

            <q-list>
              <q-item active-class="text-accent text-weight-bold bg-accent-opaque" clickable :active="selectedCategory === 'Prompt_Packages'" v-ripple @click="selectedCategory = 'Prompt_Packages'" class="">
                <q-item-section avatar>
                  <q-icon name="mdi-creation-outline" />
                </q-item-section>
                <q-item-section>
                  Prompts
                </q-item-section>
              </q-item>

              <q-item active-class="text-accent text-weight-medium bg-accent-opaque" clickable :active="selectedCategory === 'Models'" v-ripple @click="selectedCategory = 'Models'">
                <q-item-section avatar>
                  <q-icon name="mdi-chip" />
                </q-item-section>
                <q-item-section>
                  AI Models
                </q-item-section>
              </q-item>

            </q-list>

            <q-separator class="q-mt-xl shadow-4"/>
            <div class="text-center text-subtitle2 q-mt-md q-mb-sm"><q-icon name="mdi-account-group-outline" class="q-mr-sm" />Community Content</div>

            <div class="text-center text-caption"> Coming soon </div>
          </div>
        </div>
      </div>
      <div class="col full-height">
        <div class="scroll fit" >
          <div class="">
            <PromptMarketplaceCategoryDetail :category="selectedCategory" />
          </div>
        </div>
      </div>
    </q-card-section>

  </q-card>

</template>

<script setup>
  import {ref} from "vue";
  import {useLayoutStore} from "stores/layout-store";
  import PromptMarketplaceCategoryDetail from "components/Common/Marketplace/PromptMarketplaceCategoryDetail.vue";

  const layoutStore = useLayoutStore();

  const selectedCategory = ref('Packs');
  const drawer = ref(false);
</script>

<style scoped>

</style>
