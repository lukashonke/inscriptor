<template>
  <q-card class="col q-pa-none" flat>
    <template v-if="user && user.emailVerified === false && !user.isAnonymous">
      <q-card-section>
        <span class="text-h6">Email verification required</span>
        <q-btn flat dense @click="refreshWindow" class="float-right q-ml-md" icon="mdi-sync" />
      </q-card-section>
      <q-card-section class="row justify-center">
        <div class="text-subtitle2 q-mt-md"><q-chip>Please verify your email {{ user.email }} to continue</q-chip></div>
      </q-card-section>
      <q-card-section class="row justify-center q-pt-none">
        <div>
          Don't see the email? Check your spam folder or <q-btn dense flat @click="sendEmailVerificationLink(true)">resend verification email</q-btn>
        </div>
      </q-card-section>

      <q-card-section>
        <div class="row">
          <div class="col full-width">
            <q-btn color="accent" padding="sm" @click="checkIfEmailVerified" class="full-width">Continue</q-btn>
          </div>
        </div>
      </q-card-section>

      <q-separator />
      <q-card-actions align="right">
        <div class="float-right">
          <q-btn flat  @click="signOut">Sign out</q-btn>
        </div>
      </q-card-actions>
    </template>
    <template v-else>
      <template v-if="tab === 'init'">
        <q-card-section>
          <div class="flex justify-center">
            <q-img src="/mainlogo-blue.png" class="" width="300px" />
          </div>
        </q-card-section>

        <q-card-section class="row">
          <div class="col" />
          <div class="col-auto">
            <q-btn outline @click="loginWithGoogle">
              <q-icon name="lab la-google" color="red" />
              Sign In with Google
            </q-btn>
          </div>
          <div class="col" />
        </q-card-section>

        <q-card-section class="row " v-if="layoutStore.runsInDesktopApp()">
          <div class="col" />
          <div class="col-auto">
            <q-btn outline @click="loginAnonymously">
              Continue as guest
            </q-btn>
          </div>
          <div class="col" />
        </q-card-section>

        <q-separator class="q-mt-lg q-mb-sm">
        </q-separator>

        <div class="relative-position" style="top: -21px; left: 210px; padding: 0 10px; width: 300px;">
          <span class="bg-white q-pa-sm">or continue with email</span>
        </div>

        <q-card-section class="q-gutter-y-sm">
          <div class="row">
            <div class="col">
              <q-input flat filled v-model="email" label="Email" />
            </div>
          </div>
          <div class="row">
            <div class="col">
              <q-input flat filled v-model="password" label="Password" type="password" @keydown="passwordKey" />
            </div>
          </div>
          <div class="row">
            <div class="col" />
            <div class="col-auto">
              <q-btn flat @click="tab = 'forgot-password'">Forgot password?</q-btn>
            </div>
          </div>
        </q-card-section>

        <q-card-section>
          <div class="row">
            <div class="col bg-red full-width">
              <q-btn color="accent" padding="sm" @click="tryLogin" class="full-width">Login</q-btn>
            </div>
          </div>
        </q-card-section>
        <q-card-section>
          <div class="row">
            <div class="col" />
            <div class="col-auto">
              <div>
                Don't have an account yet? <q-btn flat @click="tab = 'register'" color="accent" class="q-ml-sm">Sign up</q-btn>
              </div>
            </div>
            <div class="col" />
          </div>
        </q-card-section>
      </template>
      <template v-else-if="tab === 'register'">
        <q-card-section>
          <div class="text-h6">Register your account</div>
        </q-card-section>

        <q-separator />

        <q-card-section class="q-gutter-y-sm">
          <q-input flat filled v-model="email" label="Email" />

          <q-space class="q-my-lg"/>
          <q-input dense flat filled v-model="password" label="Password" type="password" />
          <q-input dense flat filled v-model="password2" label="Password (again)" type="password" />

          <div class="q-mt-lg">
            <div class="text-bold">Password requirements:</div>
            <div>- at least 8 characters long</div>
            <div>- at least one uppercase letter</div>
            <div>- at least one lowercase letter</div>
            <div>- at least one number</div>
          </div>
        </q-card-section>

        <q-card-section>
          <div class="row">
            <div class="col bg-red full-width">
              <q-btn color="accent" padding="sm" @click="tryRegister" class="full-width" :loading="registering">Register</q-btn>
            </div>
          </div>
        </q-card-section>

        <q-separator class="q-mt-md" />
        <q-card-actions>
          <q-btn flat @click="tab = 'init'">Back</q-btn>
        </q-card-actions>
      </template>
      <template v-else-if="tab === 'forgot-password'">
        <q-card-section>
          <div class="text-h6">Reset your password</div>
        </q-card-section>

        <q-separator />

        <q-card-section class="q-gutter-y-sm">
          <q-input flat filled v-model="email" label="Email" />
        </q-card-section>

        <q-card-section>
          <div class="row">
            <div class="col bg-red full-width">
              <q-btn color="accent" padding="sm" @click="sendPasswordRestoreEmail" class="full-width">Send restore email</q-btn>
            </div>
          </div>
        </q-card-section>

        <q-separator class="q-mt-md" />
        <q-card-actions>
          <q-btn flat @click="tab = 'init'">Back</q-btn>
        </q-card-actions>
      </template>
      <template v-else-if="tab === 'forgot-password-sent'">
        <q-card-section>
          <div class="text-h6">Email sent</div>
          <div class="q-mt-lg"><q-chip>Please check your email inbox for further instructions.</q-chip></div>
        </q-card-section>

        <q-separator class="q-mt-md" />
        <q-card-actions>
          <q-btn flat @click="tab = 'init'">Back</q-btn>
        </q-card-actions>
      </template>

    </template>

  </q-card>
</template>

<script setup>
  import {useLayoutStore} from "stores/layout-store";
  import {usePromptStore} from "stores/prompt-store";
  import {ref} from "vue";
  import {Notify} from "quasar";

  import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInAnonymously  } from "firebase/auth";
  import {useCurrentUser, useFirebaseAuth} from 'vuefire'
  import {useFileStore} from "stores/file-store";
  import {directusClient} from "boot/directus";

  import { GoogleAuthProvider, signInWithPopup, validatePassword, sendPasswordResetEmail, sendEmailVerification    } from "firebase/auth";
  import {useLocalDataStore} from "stores/localdata-store";
  import {onUserLogin} from "src/common/apiServices/userProjectService";

  const googleProvider = new GoogleAuthProvider();

  const layoutStore = useLayoutStore();
  const promptStore = usePromptStore();
  const fileStore = useFileStore();
  const localDataStore = useLocalDataStore();

  const tab = ref('init');

  const email = ref('');
  const password = ref('');
  const password2 = ref('');

  const user = useCurrentUser();

  const auth = useFirebaseAuth();

  async function loginAnonymously() {
    const auth = getAuth();

    signInAnonymously(auth)
      .then(async (result) => {
        // The signed-in user info.
        const user = result.user;
        // IdP data available using getAdditionalUserInfo(result)

        await onLogin();

        layoutStore.projectSelectionDialogOpen = true;

        layoutStore.setLoadingDialogOpen(true, 'Logging in');

        await fileStore.loadLocalSettings();
        await localDataStore.loadLocalData();

        await layoutStore.loadUserData();
        await layoutStore.loadModelData();

        layoutStore.setLoadingDialogOpen(false);

        Notify.create({
          message: 'Logged in as guest',
          icon: 'mdi-account-outline',
          color: 'positive',
          position: 'top',
          timeout: 4000,
        });

        // ...
      }).catch((error) => {
      // Handle Errors here.
      const errorCode = error.code;
      const errorMessage = error.message;
      // The email of the user's account used.
      const email = error.customData.email;
      // The AuthCredential type that was used.
      const credential = GoogleAuthProvider.credentialFromError(error);

      let message;

      console.log(error);

      switch (error.code) {
        case 'auth/invalid-credential':
          message = 'Invalid email or password.';
          break;
        default:
          message = 'Sign in failed.';
          break;
      }

      Notify.create({
        message: message,
        icon: 'mdi-account-outline',
        color: 'negative',
        position: 'top',
        timeout: 4000,
      });
      // ...
    });
  }

  async function loginWithGoogle() {
    const auth = getAuth();

    signInWithPopup(auth, googleProvider)
      .then(async (result) => {
        // This gives you a Google Access Token. You can use it to access the Google API.
        const credential = GoogleAuthProvider.credentialFromResult(result);

        const token = credential.accessToken;
        // The signed-in user info.
        const user = result.user;
        // IdP data available using getAdditionalUserInfo(result)

        await onLogin();

        if(user.emailVerified === false) {
          layoutStore.loginDialogOpen = true;
          return;
        }

        layoutStore.projectSelectionDialogOpen = true;

        layoutStore.setLoadingDialogOpen(true, 'Logging in');

        await fileStore.loadLocalSettings();
        await localDataStore.loadLocalData();

        await layoutStore.loadUserData();
        await layoutStore.loadModelData();

        layoutStore.setLoadingDialogOpen(false);

        Notify.create({
          message: 'Logged in as ' + user.email,
          icon: 'mdi-account-outline',
          color: 'positive',
          position: 'top',
          timeout: 4000,
        });

        // ...
      }).catch((error) => {
      // Handle Errors here.
      const errorCode = error.code;
      const errorMessage = error.message;
      // The email of the user's account used.
      const email = error.customData.email;
      // The AuthCredential type that was used.
      const credential = GoogleAuthProvider.credentialFromError(error);

      let message;

      console.log(error);

      switch (error.code) {
        case 'auth/invalid-credential':
          message = 'Invalid email or password.';
          break;
        default:
          message = 'Sign in failed.';
          break;
      }

      Notify.create({
        message: message,
        icon: 'mdi-account-outline',
        color: 'negative',
        position: 'top',
        timeout: 4000,
      });
      // ...
    });
  }

  async function validatePasswordStrength(password) {
    const status = await validatePassword(getAuth(), password);
    if (!status.isValid) {
      // Password could not be validated. Use the status to show what
      // requirements are met and which are missing.

      // If a criterion is undefined, it is not required by policy. If the
      // criterion is defined but false, it is required but not fulfilled by
      // the given password. For example:
      const needsLowerCase = status.containsLowercaseLetter !== true;

      return status;
    }

    return null;
  }

  async function tryLogin() {

    const client = directusClient;

    /*const response = await client.request(login(email.value, password.value));

    if (response.access_token) {
      localStorage.setItem("userToken", response.access_token);
      await client.setToken(localStorage.getItem("userToken"));
    }*/

    signInWithEmailAndPassword(auth, email.value, password.value)
      .then(async (userCredential) => {
        // Signed in
        const user = userCredential.user;

        await onLogin();

        if(user.emailVerified === false) {
          layoutStore.loginDialogOpen = true;
          return;
        }

        layoutStore.projectSelectionDialogOpen = true;

        layoutStore.setLoadingDialogOpen(true, 'Logging in');

        await fileStore.loadLocalSettings();
        await localDataStore.loadLocalData();

        await layoutStore.loadUserData();

        await layoutStore.loadModelData();

        layoutStore.setLoadingDialogOpen(false);

        Notify.create({
          message: 'Logged in as ' + user.email,
          icon: 'mdi-account-outline',
          color: 'positive',
          position: 'top',
          timeout: 4000,
        });
        // ...
      })
      .catch((error) => {
        let message;

        console.log(message, error);

        switch (error.code) {
          case 'auth/invalid-credential':
            message = 'Invalid email or password.';
            break;
          default:
            message = 'Sign in failed.';
            break;
        }

        Notify.create({
          message: message,
          icon: 'mdi-account-outline',
          color: 'negative',
          position: 'top',
          timeout: 4000,
        });
      });
  }

  async function onLogin() {
      layoutStore.loginDialogOpen = false;

    if(window.location.hash.includes('upgrade')) {
      layoutStore.userInfoDialogOpen = true;
    }

    const user = useCurrentUser();

    if(user) {
      await onUserLogin(await user.value.getIdToken());
    }
  }

  function passwordKey(event) {
    if (event.key === 'Enter') {
      tryLogin();
    }
  }

  async function signOut() {
    await auth.signOut();

    //const client = directusClient;
    //localStorage.setItem("userToken", '');
    //await client.logout();

    window.location.reload();
  }

  async function sendPasswordRestoreEmail() {
    sendPasswordResetEmail(auth, email.value)
      .then(() => {
        Notify.create({
          message: 'Email sent.',
          position: 'top',
          icon: 'mdi-email-outline',
          timeout: 4000,
        });

        tab.value = 'forgot-password-sent';
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        // ..
        let message;

        switch (error.code) {
          case 'auth/too-many-requests':
            message = 'You need to wait before sending another password reset email.';
            break;
          default:
            message = 'Could not send password reset email.';
            break;
        }

        console.log(error.code);

        Notify.create({
          message: message,
          color: 'negative',
          position: 'top',
          timeout: 4000,
        });
      });
  }

  async function checkIfEmailVerified() {
    refreshWindow();
  }

  async function sendEmailVerificationLink(notify) {
    sendEmailVerification(auth.currentUser)
      .then(() => {

        if(notify) {
          Notify.create({
            message: 'Verification request sent to your email.',
            caption: 'Please check your email inbox.',
            position: 'top',
            icon: 'mdi-email-outline',
            timeout: 10000,
          });
        }
      }).catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        // ..
        let message;

        switch (error.code) {
          case 'auth/too-many-requests':
            message = 'You need to wait before sending another verification email.';
            break;
          default:
            message = 'Could not send verification email.';
            break;
        }

        console.log(error.code);

        Notify.create({
          message: message,
          color: 'negative',
          position: 'top',
          timeout: 4000,
        });
    });
  }

  const registering = ref(false);

  async function tryRegister() {

    try {
      registering.value = true;

      if (password.value !== password2.value) {
        Notify.create({
          message: 'Passwords do not match',
          color: 'negative',
          position: 'top',
          timeout: 4000,
        });
        return;
      }

      const status = await validatePasswordStrength(password.value);

      if (status !== null) {
        Notify.create({
          message: 'Password does not meet requirements.',
          color: 'negative',
          position: 'top',
          timeout: 4000,
        });
        return;
      }

      createUserWithEmailAndPassword(auth, email.value, password.value)
        .then(async (userCredential) => {
          const user = userCredential.user;

          if(user.emailVerified === false) {
            await sendEmailVerificationLink(false);
            return;
          }

          await onLogin();

          if(user.emailVerified === false) {
            layoutStore.loginDialogOpen = true;
            return;
          }

          layoutStore.projectSelectionDialogOpen = true;

          layoutStore.setLoadingDialogOpen(true, 'Creating user...');

          await fileStore.loadLocalSettings();
          await localDataStore.loadLocalData();

          await layoutStore.loadUserData();

          await layoutStore.loadModelData();

          layoutStore.setLoadingDialogOpen(false);

          Notify.create({
            message: 'Logged in as ' + user.email,
            icon: 'mdi-account-outline',
            color: 'positive',
            position: 'top',
            timeout: 4000,
          });
        })
        .catch((error) => {

          let message;

          switch (error.code) {
            case 'auth/email-already-in-use':
              message = 'Email already in use.';
              break;
            default:
              message = 'Registration failed: ' + error.message;
              break;
          }

          Notify.create({
            message: message,
            icon: 'mdi-account-outline',
            color: 'negative',
            position: 'top',
            timeout: 4000,
          });
        });
    } finally {
      registering.value = false;
    }
  }

  function refreshWindow() {
    window.location.reload();
  }

</script>

<style scoped>

</style>
