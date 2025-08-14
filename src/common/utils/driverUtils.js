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
        { element: '#files', popover: { title: 'Your Files', description: 'Here are your files! <br /><br />You can organize your project into multiple files, group them in folders and more.' } },
        //{ element: '#file', popover: { title: 'Your File', description: 'When you open a file, this is where the magic happens — start writing here!' } },
        { element: '#togglePrompts', popover: { title: 'Open AI Prompts', description: 'Click this button to access AI prompts. <br/><br/> You can also select some text or place your cursor in the editor, and this button will appear.', onNextClick: () => {
              const layoutStore = useLayoutStore();

              layoutStore.fileDetailsOpen = false;

              driverObj.moveNext();
            } } },


        { element: '#aiSwitch', popover: { title: 'AI Prompts', description: `
Here's where you'll see AI results, organized into three tabs: Prompts, Chat, and Analysis. <br/><br/>
<strong>Prompts</strong> shows results from AI prompts you've run. <br/>
<strong>Chat</strong> lets you chat with AI that can navigate and edit your files. <br/>
<strong>Analysis</strong> provides quick analysis of selected text using predefined functions.`, onNextClick: () => {
              const layoutStore = useLayoutStore();

              layoutStore.fakePromptResult = true;

              driverObj.moveNext();
            } } },

        { element: '#fakePromptResult', popover: { title: 'AI Prompt Result', description: 'This is how an AI prompt response looks...' } },

        { element: '#fakePromptResultAdd', popover: { title: 'Use Prompt Result', description: 'If you like what AI wrote, click this button to quickly add the text to your file. <br/><br/>', onNextClick: () => {
              const layoutStore = useLayoutStore();
              const promptStore = usePromptStore();

              promptStore.analysisEnabled = true;

              layoutStore.fakePromptResult = false;

              driverObj.moveNext();
            } } },

        //{ element: '#hubButton', popover: { title: 'Inscriptor Hub', description: 'Visit our Inscriptor Hub to obtain new AI models, prompts or general inspiration on what can be created.' } },

        { element: '#agentSelector', popover: { title: 'AI Agents', description: 'This button opens advanced AI agents that can refine your text or write entire sections for you. These are powerful tools for when you need more comprehensive assistance.' } },

        { popover: { title: 'That\'s it!', description: 'These are the basics, go ahead and create something awesome!' } }
      ],
    });

    driverObj.drive();
  }

  return driverObj;
}
