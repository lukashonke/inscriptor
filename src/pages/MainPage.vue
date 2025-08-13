<template>
  <q-page class="" style="overflow: visible;">
    <div class="full-width full-height" style="overflow: visible;">

      <div class="custom-splitter full-height" ref="splitterContainer">
        <!-- Left Menu Panel -->
        <div
          class="splitter-panel splitter-left-menu bg-transparent"
          :style="{ width: leftMenuWidth }"
        >
          <div :style="{ height: `calc(100vh - ${LEFT_MENU_HEIGHT_OFFSET_PX}px)` }">
            <div class="fit left-menu-scroll">
              <div class="q-pa-none">
                <LeftMenuComponent />
              </div>
              <div class="absolute full-width" style="bottom: 0">
                <q-separator />
                <div class="row items-center bg-theme-primary justify-center no-wrap" id="variables">
                  <div class="col-auto">
                    <q-btn no-caps stack unelevated class="row text-primary q-my-sm cursor-pointer" icon="mdi-database-outline" label="Variables" @click="layoutStore.setVariableSettingsOpen(true)" />
                  </div>
                  <div class="col-auto">
                    <q-btn no-caps stack unelevated class="row text-primary q-my-sm cursor-pointer" icon="mdi-cog" label="Settings" @click="layoutStore.setSettingsOpen(true)" id="settingsButton" />
                  </div>
                  <div class="col-auto">
                    <q-btn no-caps stack unelevated class="row text-primary q-my-sm cursor-pointer" icon="mdi-history" label="History" @click="layoutStore.setConsoleOpen(!layoutStore.consoleOpen)"/>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- First Resize Handle (between left menu and main content) -->
        <div
          v-if="layoutStore.leftDrawerOpen"
          class="splitter-handle"
          @mousedown="startLeftResize"
          @touchstart="startLeftResize"
        ></div>

        <!-- Main Content Panel -->
        <div
          class="splitter-panel splitter-main"
          :style="{ width: mainPanelWidth }"
        >
          <div class="" :style="{ height: `calc(100vh - ${MAIN_PANEL_HEIGHT_OFFSET_PX}px)`, overflowY: 'auto', overflowX: 'visible' }">
            <div class="fit bg-white-transparent">
              <div class="" id="file">
                <FileDetail />
              </div>
            </div>
          </div>
        </div>

        <!-- Second Resize Handle (between main content and right menu) -->
        <div
          v-if="layoutStore.rightDrawerOpen"
          class="splitter-handle"
          @mousedown="startRightResize"
          @touchstart="startRightResize"
        ></div>

        <!-- Right Menu Panel -->
        <div
          class="splitter-panel splitter-right"
          :style="{ width: rightPanelWidth }"
        >
          <div class="" :style="{ height: `calc(100vh - ${RIGHT_PANEL_HEIGHT_OFFSET_PX}px)` }">
            <div class="">
              <div class="fit bg-white-transparent">
                <RightMenuComponent />
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </q-page>
</template>

<script setup>

import {onMounted, computed, ref, onBeforeUnmount, watch} from 'vue'
import {useDebounceFn} from '@vueuse/core'
import FileDetail from "components/MainPanel/FileDetail.vue";
import RightMenuComponent from "components/RightMenu/RightMenuComponent.vue";
import LeftMenuComponent from "components/LeftMenu/LeftMenuComponent.vue";
import {useLayoutStore} from "stores/layout-store";

const layoutStore = useLayoutStore();

// Minimum widths in pixels
const LEFT_PANEL_MIN_WIDTH = 250;
const RIGHT_PANEL_MIN_WIDTH = 250;
const MAIN_PANEL_MIN_WIDTH = 400;

// Height offsets for panels (keeping these as they're still needed)
const LEFT_MENU_HEIGHT_OFFSET_PX = 32;
const MAIN_PANEL_HEIGHT_OFFSET_PX = 50;
const RIGHT_PANEL_HEIGHT_OFFSET_PX = 33;

// Splitter handle width
const SPLITTER_HANDLE_WIDTH = 4;

// Container and resize state
const splitterContainer = ref(null);
const isResizing = ref(false);
const resizeType = ref(''); // 'left' or 'right'
const startX = ref(0);
const startLeftWidth = ref(0);
const startRightWidth = ref(0);

// Store panel widths in pixels
const leftPanelWidthPx = ref(layoutStore.leftDrawerOpen ? 300 : 0);
const rightPanelWidthPx = ref(layoutStore.rightDrawerOpen ? 350 : 0);

// Track previous window width for resize handling
const previousWindowWidth = ref(0);
const resizeObserver = ref(null);

// Computed properties for panel widths
const leftMenuWidth = computed(() => {
  return `${leftPanelWidthPx.value}px`;
});

const rightPanelWidth = computed(() => {
  return `${rightPanelWidthPx.value}px`;
});

const mainPanelWidth = computed(() => {
  if (!splitterContainer.value) return '100%';
  const containerWidth = splitterContainer.value.clientWidth;
  const handleWidth = layoutStore.leftDrawerOpen && layoutStore.rightDrawerOpen ? SPLITTER_HANDLE_WIDTH * 2 :
                      (layoutStore.leftDrawerOpen || layoutStore.rightDrawerOpen) ? SPLITTER_HANDLE_WIDTH : 0;
  const mainWidth = containerWidth - leftPanelWidthPx.value - rightPanelWidthPx.value - handleWidth;
  return `${Math.max(MAIN_PANEL_MIN_WIDTH, mainWidth)}px`;
});

// Resize functionality for left handle (between left menu and main content)
const startLeftResize = (e) => {
  isResizing.value = true;
  resizeType.value = 'left';
  startX.value = e.clientX || e.touches[0].clientX;
  startLeftWidth.value = leftPanelWidthPx.value;

  document.addEventListener('mousemove', handleResize);
  document.addEventListener('mouseup', stopResize);
  document.addEventListener('touchmove', handleResize);
  document.addEventListener('touchend', stopResize);

  document.body.style.userSelect = 'none';
  e.preventDefault();
};

// Resize functionality for right handle (between main content and right menu)
const startRightResize = (e) => {
  isResizing.value = true;
  resizeType.value = 'right';
  startX.value = e.clientX || e.touches[0].clientX;
  startRightWidth.value = rightPanelWidthPx.value;

  document.addEventListener('mousemove', handleResize);
  document.addEventListener('mouseup', stopResize);
  document.addEventListener('touchmove', handleResize);
  document.addEventListener('touchend', stopResize);

  document.body.style.userSelect = 'none';
  e.preventDefault();
};

const handleResize = (e) => {
  if (!isResizing.value || !splitterContainer.value) return;

  const clientX = e.clientX || e.touches[0].clientX;
  const containerWidth = splitterContainer.value.clientWidth;
  const deltaX = clientX - startX.value;

  if (resizeType.value === 'left') {
    // Only allow resizing if left drawer is open
    if (!layoutStore.leftDrawerOpen) return;

    // Calculate new width in pixels
    let newLeftWidth = startLeftWidth.value + deltaX;

    // Calculate space needed for main panel
    const handleWidth = layoutStore.rightDrawerOpen ? SPLITTER_HANDLE_WIDTH * 2 : SPLITTER_HANDLE_WIDTH;
    const availableForMain = containerWidth - newLeftWidth - rightPanelWidthPx.value - handleWidth;

    // Apply minimum constraints
    if (newLeftWidth < LEFT_PANEL_MIN_WIDTH) {
      newLeftWidth = LEFT_PANEL_MIN_WIDTH;
    }
    if (availableForMain < MAIN_PANEL_MIN_WIDTH) {
      newLeftWidth = containerWidth - MAIN_PANEL_MIN_WIDTH - rightPanelWidthPx.value - handleWidth;
    }

    leftPanelWidthPx.value = newLeftWidth;
  } else if (resizeType.value === 'right') {
    // Only allow resizing if right drawer is open
    if (!layoutStore.rightDrawerOpen) return;

    // Calculate new width in pixels (right panel moves opposite direction)
    let newRightWidth = startRightWidth.value - deltaX;

    // Calculate space needed for main panel
    const handleWidth = layoutStore.leftDrawerOpen ? SPLITTER_HANDLE_WIDTH * 2 : SPLITTER_HANDLE_WIDTH;
    const availableForMain = containerWidth - leftPanelWidthPx.value - newRightWidth - handleWidth;

    // Apply minimum constraints
    if (newRightWidth < RIGHT_PANEL_MIN_WIDTH) {
      newRightWidth = RIGHT_PANEL_MIN_WIDTH;
    }
    if (availableForMain < MAIN_PANEL_MIN_WIDTH) {
      newRightWidth = containerWidth - MAIN_PANEL_MIN_WIDTH - leftPanelWidthPx.value - handleWidth;
    }

    rightPanelWidthPx.value = newRightWidth;
  }
};

const stopResize = () => {
  isResizing.value = false;
  resizeType.value = '';

  document.removeEventListener('mousemove', handleResize);
  document.removeEventListener('mouseup', stopResize);
  document.removeEventListener('touchmove', handleResize);
  document.removeEventListener('touchend', stopResize);

  document.body.style.userSelect = '';
};

// Handle window resize by triggering the existing resize logic
const handleWindowResize = () => {
  if (!splitterContainer.value) return;

  const containerWidth = splitterContainer.value.clientWidth;

  // Process left panel if open
  if (layoutStore.leftDrawerOpen && leftPanelWidthPx.value > 0) {
    resizeType.value = 'left';
    isResizing.value = true;
    startX.value = leftPanelWidthPx.value;
    startLeftWidth.value = leftPanelWidthPx.value;

    handleResize({
      clientX: leftPanelWidthPx.value + 1,
      touches: [{ clientX: leftPanelWidthPx.value + 1 }]
    });
    isResizing.value = false;
  }

  // Process right panel if open
  if (layoutStore.rightDrawerOpen && rightPanelWidthPx.value > 0) {
    resizeType.value = 'right';
    isResizing.value = true;
    startX.value = containerWidth - rightPanelWidthPx.value;
    startRightWidth.value = rightPanelWidthPx.value;

    handleResize({
      clientX: containerWidth - rightPanelWidthPx.value - 1,
      touches: [{ clientX: containerWidth - rightPanelWidthPx.value - 1 }]
    });
    isResizing.value = false;
  }
};

// Create debounced version of resize handler
const debouncedWindowResize = useDebounceFn(handleWindowResize, 100);

// Watchers to sync with layout store
watch(() => layoutStore.leftDrawerOpen, (newValue) => {
  leftPanelWidthPx.value = newValue ? 300 : 0;
});

watch(() => layoutStore.rightDrawerOpen, (newValue) => {
  rightPanelWidthPx.value = newValue ? 350 : 0;
});

onMounted(() => {
  console.log('🔧 MainPage mounted');

  // Initialize panel widths on mount
  if (layoutStore.leftDrawerOpen) {
    leftPanelWidthPx.value = 300;
  }
  if (layoutStore.rightDrawerOpen) {
    rightPanelWidthPx.value = 350;
  }

  // Initialize window width tracking and add resize listener
  if (splitterContainer.value) {
    previousWindowWidth.value = splitterContainer.value.clientWidth;
    console.log('✅ Initialized container width:', previousWindowWidth.value);
  } else {
    console.log('❌ No splitter container on mount');
  }

  window.addEventListener('resize', debouncedWindowResize);
  console.log('👂 Added debounced window resize listener');
})

onBeforeUnmount(() => {
  // Clean up event listeners if component is unmounted during resize
  if (isResizing.value) {
    stopResize();
  }
  // Remove window resize listener
  window.removeEventListener('resize', debouncedWindowResize);
});


</script>

<style scoped>
.custom-splitter {
  display: flex;
  position: relative;
  overflow: visible; /* Allow content to overflow for modals/dialogs */
  z-index: 1; /* Ensure proper stacking context */
}

.splitter-panel {
  position: relative;
  overflow: visible; /* Key: Allow overflow for modals and dialogs */
  min-width: 0; /* Allow flex items to shrink below content size */
}

.splitter-left-menu {
  flex-shrink: 0;
  border-right: 1px solid;
  overflow: hidden; /* Hide content when width is 0 */
}

.splitter-main {
  flex-shrink: 0;
  position: relative;
  overflow: visible; /* Explicitly allow overflow for dialogs */
  z-index: 2; /* Higher z-index for main content and dialogs */
}

.splitter-right {
  flex-shrink: 0;
  border-left: 1px solid;
  overflow: hidden; /* Hide content when width is 0 */
  z-index: 1; /* Lower z-index so dialogs can appear above */
}

.splitter-handle {
  width: 4px;
  cursor: col-resize;
  flex-shrink: 0;
  position: relative;
  transition: background-color 0.2s ease;
}


/* Add visual indicator on hover */
.splitter-handle::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 2px;
  height: 20px;
  transform: translate(-50%, -50%);
  border-radius: 1px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.splitter-handle:hover::after {
  opacity: 1;
}

/* Ensure proper z-index for overflow content */
.splitter-panel > * {
  position: relative;
  z-index: 1;
}

/* Left menu scroll area */
.left-menu-scroll {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
}
</style>
