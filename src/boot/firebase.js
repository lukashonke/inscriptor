import { boot } from 'quasar/wrappers'
import {VueFire, VueFireAuth} from "vuefire";
import { initializeApp } from 'firebase/app'


// Be careful when using SSR for cross-request state pollution
// due to creating a Singleton instance here;
// If any client changes this (global) instance, it might be a
// good idea to move this instance creation inside of the
// "export default () => {}" function below (which runs individually
// for each client)

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

let firebaseApp;


export default boot(({ app }) => {

  const firebaseConfig = {
    apiKey: "AIzaSyCuQmNsUAeYPVKOb3wOCJaMO5j_NrgCUUQ",
    authDomain: "inscriptorai-4d84e.firebaseapp.com",
    projectId: "inscriptorai-4d84e",
    storageBucket: "inscriptorai-4d84e.appspot.com",
    messagingSenderId: "447589321948",
    appId: "1:447589321948:web:0730e3e40b193fe2f53819",
    measurementId: "G-8MZ8CQRS98"
  };


  firebaseApp = initializeApp(firebaseConfig)

  app.use(VueFire, {
    // imported above but could also just be created here
    firebaseApp,
    modules: [
      // we will see other modules later on
      VueFireAuth(),
    ],
  })
})

export { firebaseApp }

