import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import {useLayoutStore} from "stores/layout-store";
import {usePromptStore} from "stores/prompt-store";

export function tutorial(name, callback) {
  let driverObj = undefined;
  if(name === 'project_created') {
    let driverObj = driver({
      showProgress: false,
      allowClose: true,
      onDestroyed: () => {
        if(callback) {
          callback();
        }
      },
      steps: [
        { element: '#files', popover: { title: 'Your Files', description: 'Here is your project file list! <br />Click on a file to open it, or hit the + symbol to create a new one. <br />You can also nest files to organize them into folders, label them and more.' } },
        { element: '#file', popover: { title: 'Your File', description: 'When you open a file, this is where the magic happens — start writing here!' } },
        { element: '#togglePrompts', popover: { title: 'Open AI Prompts', description: 'Click this button to access AI prompts. <br /> <br /> You can also select text or place your cursor in the editor, and the button will appear.', onNextClick: () => {
              const layoutStore = useLayoutStore();

              layoutStore.fileDetailsOpen = false;

              driverObj.moveNext();
            } } },


        { element: '#aiSwitch', popover: { title: 'AI Prompts', description: 'Here’s where you\'ll see results from AI, organized into three tabs: Prompts, Chat, and Analysis. <br/><br/><strong>Prompts tab</strong> has results of all AI prompts you executed. <br/>Inside <strong>Chat Tab</strong> you can chat with AI model you have imported. <br/><strong>Analysis Tab</strong> allows you to run automatic analyses on any text you select.', onNextClick: () => {
              const layoutStore = useLayoutStore();

              layoutStore.fakePromptResult = true;

              driverObj.moveNext();
            } } },

        { element: '#fakePromptResult', popover: { title: 'AI Prompt Result', description: 'This is how a AI prompt response may look like...' } },

        { element: '#fakePromptResultAdd', popover: { title: 'Use Prompt Result', description: 'If you like what AI wrote, click this button to quickly add the text to your project or replace the currently selected text. The results can be color-coded to help you easily compare and see what has been changed.<br/><br/>', onNextClick: () => {
              const layoutStore = useLayoutStore();
              const promptStore = usePromptStore();

              promptStore.analysisEnabled = true;

              layoutStore.fakePromptResult = false;

              driverObj.moveNext();
            } } },

        { element: '#hubButton', popover: { title: 'Inscriptor Hub', description: 'Visit our Inscriptor Hub to obtain new AI models, prompts or general inspiration on what can be created.' } },

        { popover: { title: 'That\'s it!', description: 'These are the basics, go ahead and create something awesome!' } }
      ],
    });

    driverObj.drive();
  }

  return driverObj;
}
