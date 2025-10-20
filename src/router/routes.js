import { isMobileScreen } from 'src/common/utils/screenUtils';

const routes = [
  {
    path: '/',
    component: () => {
      // Dynamically choose layout based on screen width
      if (isMobileScreen()) {
        return import('layouts/MobileLayout.vue')
      }
      return import('layouts/MainLayout.vue')
    },
    children: [
      {
        path: '',
        component: () => {
          // Dynamically choose page based on screen width
          if (isMobileScreen()) {
            return import('pages/MobilePage.vue')
          }
          return import('pages/MainPage.vue')
        }
      }
    ]
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes
