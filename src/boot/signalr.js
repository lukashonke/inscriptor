import { boot } from 'quasar/wrappers';
import { signalRService } from 'src/common/signalRService';

/**
 * Quasar boot file for SignalR service
 * Makes the SignalR service available globally in the app
 */
export default boot(({ app }) => {
  // Make SignalR service available via this.$signalR in components
  app.config.globalProperties.$signalR = signalRService;
});

export { signalRService };
