import { computed, onMounted, onUnmounted, ref } from 'vue';

// Mobile breakpoint - screens narrower than this are considered mobile
export const MOBILE_BREAKPOINT = 768;

/**
 * Simple function to check if current screen is mobile width
 * Use this in non-reactive contexts (like router)
 * @returns {boolean} true if screen width is below mobile breakpoint
 */
export function isMobileScreen() {
  return window.innerWidth < MOBILE_BREAKPOINT;
}

/**
 * Vue composable for reactive mobile detection
 * Use this in Vue components for reactive updates on window resize
 * @returns {Object} Object with isMobile computed property
 */
export function useResponsive() {
  const windowWidth = ref(window.innerWidth);

  const updateWidth = () => {
    windowWidth.value = window.innerWidth;
  };

  onMounted(() => {
    window.addEventListener('resize', updateWidth);
  });

  onUnmounted(() => {
    window.removeEventListener('resize', updateWidth);
  });

  const isMobile = computed(() => {
    return windowWidth.value < MOBILE_BREAKPOINT;
  });

  return {
    isMobile,
    windowWidth
  };
}
