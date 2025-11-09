import { defineStore } from 'pinia';
import {
  flattenFiles,
  parseFromJson,
  saveToJson,
  unflattenFiles,
  createFile,
  createTrashBinFile,
  useFindFileRecursively
} from "src/common/utils/fileUtils";
import {open, save} from '@tauri-apps/plugin-dialog';
import {readTextFile, writeTextFile, writeFile} from "@tauri-apps/plugin-fs";
import {htmlToMarkdown, tokenise} from "src/common/utils/textUtils";
import {usePromptStore} from "stores/prompt-store";
import {md5} from "src/common/utils/hashUtils";
import {
  deleteProject,
  downloadProject, downloadProjectAsZip, getCloudProjectFile, pingProject,
  uploadProject, uploadProjectData, uploadProjectFiles,
  uploadProjectUserProjectSettings
} from "src/common/apiServices/userProjectService";
import {useCurrentUser} from "vuefire";
import {Dialog, Notify} from "quasar";
import {useLayoutStore} from "stores/layout-store";
import {useEditorStore} from "stores/editor-store";
import {getProjectTemplate} from "src/common/utils/modelLibraryLoader";
import {convertToFilesystemSafeName, downloadFile} from "src/common/utils/browserUtils";
import {importFromMarketplace} from "src/common/utils/cmsUtils";
import {useDebounceFn, useStorage} from "@vueuse/core";
import { useFileSearch } from 'src/composables/useFileSearch';

export const useFileStore = defineStore('files', {
  state: () => ({
    projectId: null,
    projectName: null,
    projectType: null,
    projectSettings: {
      syncToCloud: false,
    },
    etag: null,
    files: [],
    selectedFile: null,
    loadedUserSettings: false,

    temporaryFileMeta: {},

    variables: [],

    lastUserProjectSettingsHash: null,
    lastProjectDataHash: null,
    lastSaveHash: null,


    exiting: false,
    saving: false,
    creatingNewProject: false,

    currentLocalProjectDataFile: null,
    recentProjectDataFiles: [],

    saveUserProjectSettingsFunction: null,
    saveProjectDataFunction: null,
    saveDebounceFunction: null,
  }),
  getters: {
    //getFiles: (state) => state.files,
  },
  actions: {
    initialiseParents(files, parent) {
      for (const file of files) {
        file.parent = parent;

        if (file.children) {
          this.initialiseParents(file.children, file);
        }
      }
    },
    getFile(id) {
      return useFindFileRecursively(this.files, id);
    },
    async addFile(title, parent, template) {

      const layoutStore = useLayoutStore();

      if (this.projectSettings?.syncToCloud && flattenFiles(this.files).length >= layoutStore.getMaxFiles()) {
        Notify.create({
          message: 'You have reached the maximum number of files allowed for your subscription level.',
          color: 'warning',
          position: 'top',
          actions: [
            { label: 'Upgrade', color: 'white', handler: () => { layoutStore.showUserDialog(); } }
          ],
          timeout: 3000,
        });

        return null;
      }

      const promptStore = usePromptStore();
      const file = createFile(title);

      this.setDirty(file);

      if(template?.settings) {
        file.settings = JSON.parse(JSON.stringify(template.settings));
      }
      else if(parent?.settings) {
        file.settings = JSON.parse(JSON.stringify(parent.settings));
      } else if(promptStore.defaultFileTemplate?.settings) {
        file.settings = JSON.parse(JSON.stringify(promptStore.defaultFileTemplate.settings));
      }

      if (file.settings?.childLevel1Icon) {
        file.settings.childLevel1Icon = undefined;
      }
      if (file.settings?.childLevel2Icon) {
        file.settings.childLevel2Icon = undefined;
      }
      if (file.settings?.childLevel3Icon) {
        file.settings.childLevel3Icon = undefined;
      }

      if(template) {
        file.content = template.content;

        if(template.synopsis) {
          file.synopsis = template.synopsis;
        }
      }

      this.files.push(file);
      this.refreshOrders(this.files);

      if(parent) {
        await this.setParent(file, parent.id);

        if(parent.expanded === false) {
          parent.expanded = true;
        }
      }

      this.setIconFromParentSettings(file);

      this.setDirty(file);

      return file;
    },
    async cloneFile(sourceFile) {
      const layoutStore = useLayoutStore();

      // Check file limit
      if (this.projectSettings?.syncToCloud && flattenFiles(this.files).length >= layoutStore.getMaxFiles()) {
        Notify.create({
          message: 'You have reached the maximum number of files allowed for your subscription level.',
          color: 'warning',
          position: 'top',
          actions: [
            { label: 'Upgrade', color: 'white', handler: () => { layoutStore.showUserDialog(); } }
          ],
          timeout: 3000,
        });
        return null;
      }

      // Create new file with new ID
      const clonedFile = createFile(sourceFile.title + ' (Copy)');

      // Copy all properties from source file
      clonedFile.content = sourceFile.content;
      clonedFile.synopsis = sourceFile.synopsis;
      clonedFile.note = sourceFile.note;
      clonedFile.icon = sourceFile.icon;
      clonedFile.imageUrl = sourceFile.imageUrl;
      clonedFile.view = sourceFile.view;

      // Deep copy settings
      if (sourceFile.settings) {
        clonedFile.settings = JSON.parse(JSON.stringify(sourceFile.settings));
      }

      // Copy state
      if (sourceFile.state) {
        clonedFile.state = JSON.parse(JSON.stringify(sourceFile.state));
      }

      // Copy labels
      if (sourceFile.labels && sourceFile.labels.length > 0) {
        clonedFile.labels = JSON.parse(JSON.stringify(sourceFile.labels));
      }

      // Find the collection where the source file exists
      let collection = sourceFile.parent ? sourceFile.parent.children : this.files;

      // Find the index of the source file
      const sourceIndex = collection.indexOf(sourceFile);

      // Insert cloned file right after the source file
      if (sourceIndex > -1) {
        collection.splice(sourceIndex + 1, 0, clonedFile);
      } else {
        collection.push(clonedFile);
      }

      // Set parent relationship
      clonedFile.parentId = sourceFile.parentId;
      clonedFile.parent = sourceFile.parent;

      // Refresh orders for proper indexing
      this.refreshOrders(collection);

      // Mark as dirty for saving
      this.setDirty(clonedFile);

      Notify.create({
        message: `"${sourceFile.title}" has been cloned.`,
        color: 'positive',
        position: 'top'
      });

      return clonedFile;
    },
    setIconFromParentSettings(file) {
      if (!file.parent) {
        return; // No parent, nothing to inherit
      }

      let currentParent = file.parent;
      let level = 1;

      // Check up to 3 levels of parents
      while (currentParent && level <= 3) {
        const iconProperty = `childLevel${level}Icon`;

        if (currentParent.settings?.[iconProperty]) {
          file.icon = currentParent.settings[iconProperty];
          this.setDirty(file);
          return; // Found icon, stop searching
        }

        currentParent = currentParent.parent;
        level++;
      }
    },
    refreshOrders(files) {
      // Find and remove trash bin if present
      const trashBinIndex = files.findIndex(f => f.id === '__trash_bin__');
      let trashBin = null;
      if (trashBinIndex !== -1) {
        trashBin = files.splice(trashBinIndex, 1)[0];
      }

      let anyChanged = false;
      for(let i = 0; i < files.length; i++) {

        if(files[i].order !== i) {
          anyChanged = true;
          files[i].order = i;
          this.setDirty(files[i]);
        }
      }

      if(anyChanged) {
        files.sort((a, b) => a.order - b.order);
      }

      // Add trash bin back at the end if it was present
      if (trashBin) {
        files.push(trashBin);
        const newOrder = files.length - 1;
        if (trashBin.order !== newOrder) {
          trashBin.order = newOrder;
          this.setDirty(trashBin);
        }
      }
    },
    setDirty(file) {
      if(file) {
        file.dirty = true;

        this.setBrowserWindowLeaveDialogIfNotSet();
      }
    },
    async setOrder(file, order) {
      let collection = this.files;
      if(file.parent) {
        collection = file.parent.children;
      }

      if(collection.indexOf(file) !== order) {
        collection.splice(collection.indexOf(file), 1);
        collection.splice(order, 0, file);
      }
    },
    checkCanDrop(file, newParent) {
      const allParents = this.getAllFileParents(newParent);

      if(file === newParent) {
        return false;
      }

      if(allParents.find((parent) => parent.id === file.id)) {
        return false;
      }

      if(allParents.length >= 5) {
        return false;
      }

      return true;
    },
    checkCanHaveChildren(file) {
      const allParents = this.getAllFileParents(file);

      if(allParents.length >= 5) {
        return false;
      }

      return true;
    },
    async setParent(file, parentId, atIndex) {
      // Prevent moving static files
      if (file.isStatic) {
        return;
      }

      // Special handling for moving files to trash bin via drag and drop
      if (parentId === '__trash_bin__') {
        // Set deletion metadata
        file.deletedAt = Date.now();
        file.previousParentId = file.parentId;
      }

      if(file.parentId === parentId) {
        if(atIndex !== null) {
          await this.setOrder(file, atIndex);
        }
        let sourcePageCollection = file.parent ? file.parent.children : this.files;
        this.refreshOrders(sourcePageCollection);
        return;
      }

      let targetParent = parentId ? this.getFile(parentId) : null;
      let sourcePageCollection = file.parent ? file.parent.children : this.files;

      // copy context type from the new parent
      if(targetParent && targetParent.settings?.contextType && targetParent.settings.contextType !== file.settings?.contextType) {
        this.updateFileSettings(file, { contextType: targetParent.settings.contextType });
      }

      // remove
      const index = sourcePageCollection.indexOf(file);
      if(index > -1) sourcePageCollection.splice(index, 1)
      this.refreshOrders(sourcePageCollection);

      // insert
      let targetPageCollection = targetParent ? targetParent.children : this.files;

      if(atIndex) {
        targetPageCollection.splice(atIndex, 0, file);
      } else {
        targetPageCollection.push(file);
      }

      this.refreshOrders(targetPageCollection);

      file.parentId = parentId;
      file.parent = targetParent;
      this.setDirty(file);
    },
    async removeFile(id) {
      const file = this.getFile(id);

      // Prevent deletion of static files
      if (file.isStatic) {
        return;
      }

      // Ensure trash bin exists
      const trashBin = this.ensureTrashBinExists();

      // Set deletion metadata
      file.deletedAt = Date.now();
      file.previousParentId = file.parentId;

      // Remove from current location
      let filesToRemoveFrom;
      if(file.parentId) {
        const parent = this.getFile(file.parentId);
        filesToRemoveFrom = parent.children;
      } else {
        filesToRemoveFrom = this.files;
      }

      const index = filesToRemoveFrom.findIndex((f) => f.id === id);
      if (index > -1) {
        filesToRemoveFrom.splice(index, 1);
      }

      // Move to trash bin
      trashBin.children.push(file);
      file.parentId = trashBin.id;
      file.parent = trashBin;

      // Mark as dirty for cloud sync
      this.setDirty(file);
      this.setDirty(trashBin);

      this.refreshOrders(filesToRemoveFrom);
    },
    async restoreFile(id) {
      const file = this.getFile(id);

      // Check if file is in trash bin
      if (!file || !file.deletedAt) {
        Notify.create({
          message: 'File is not in trash or cannot be restored.',
          color: 'warning',
          position: 'top'
        });
        return;
      }

      const trashBin = this.getFile('__trash_bin__');
      if (!trashBin) {
        Notify.create({
          message: 'Trash bin not found.',
          color: 'negative',
          position: 'top'
        });
        return;
      }

      // Remove from trash bin
      const trashIndex = trashBin.children.findIndex((f) => f.id === id);
      if (trashIndex > -1) {
        trashBin.children.splice(trashIndex, 1);
      }

      // Restore to original location or root if parent no longer exists
      let targetParent = null;
      let targetCollection = this.files;

      if (file.previousParentId) {
        targetParent = this.getFile(file.previousParentId);
        if (targetParent) {
          targetCollection = targetParent.children;
        }
      }

      // Clear deletion metadata
      file.deletedAt = null;
      file.previousParentId = null;
      file.parentId = targetParent ? targetParent.id : null;
      file.parent = targetParent;

      // Add to target location
      targetCollection.push(file);

      // Mark as dirty for cloud sync
      this.setDirty(file);
      this.setDirty(trashBin);

      this.refreshOrders(targetCollection);

      Notify.create({
        message: `${file.title} has been restored.`,
        color: 'positive',
        position: 'top'
      });
    },
    async permanentlyDeleteFile(id) {
      const file = this.getFile(id);

      if (!file) {
        return;
      }

      // Prevent permanent deletion of static files
      if (file.isStatic) {
        return;
      }

      const trashBin = this.getFile('__trash_bin__');

      // Remove from trash bin
      if (trashBin && file.parentId === trashBin.id) {
        const trashIndex = trashBin.children.findIndex((f) => f.id === id);
        if (trashIndex > -1) {
          trashBin.children.splice(trashIndex, 1);
        }
        this.setDirty(trashBin);
      }

      // Permanently delete from cloud
      await this.saveProjectFiles([{ id: id, requestType: 'Delete', file: file }]);

      Notify.create({
        message: `${file.title} has been permanently deleted.`,
        color: 'positive',
        position: 'top'
      });
    },
    async cleanupOldDeletedFiles() {
      const trashBin = this.getFile('__trash_bin__');
      if (!trashBin || !trashBin.children) {
        return;
      }

      const fourteenDaysAgo = Date.now() - (14 * 24 * 60 * 60 * 1000); // 14 days in milliseconds
      const filesToDelete = [];
      const filesToKeep = [];

      // Separate files to delete from those to keep
      trashBin.children.forEach(file => {
        if (file.deletedAt && file.deletedAt < fourteenDaysAgo) {
          filesToDelete.push(file);
        } else {
          filesToKeep.push(file);
        }
      });

      if (filesToDelete.length === 0) {
        return;
      }

      // Update trash bin children to only include files to keep
      trashBin.children = filesToKeep;
      this.setDirty(trashBin);

      // Permanently delete old files from cloud
      const deleteRequests = filesToDelete.map(file => ({
        id: file.id,
        requestType: 'Delete',
        file: file,
      }));

      await this.saveProjectFiles(deleteRequests);

      console.log(`Cleaned up ${filesToDelete.length} files older than 14 days from trash bin.`);
    },
    async emptyTrash() {
      const trashBin = this.getFile('__trash_bin__');
      if (!trashBin || !trashBin.children || trashBin.children.length === 0) {
        Notify.create({
          message: 'Trash bin is already empty.',
          color: 'info',
          position: 'top'
        });
        return;
      }

      const filesToDelete = [...trashBin.children];
      const deleteCount = filesToDelete.length;

      // Clear trash bin
      trashBin.children = [];
      this.setDirty(trashBin);

      // Permanently delete all files from cloud
      const deleteRequests = filesToDelete.map(file => ({
        id: file.id,
        requestType: 'Delete',
        file: file,
      }));

      await this.saveProjectFiles(deleteRequests);

      Notify.create({
        message: `${deleteCount} file${deleteCount === 1 ? '' : 's'} permanently deleted from trash.`,
        color: 'positive',
        position: 'top'
      });
    },
    getAllFileParents(file) {
      const parents = [];
      let parent = file.parent;
      while(parent) {
        parents.push(parent);
        parent = parent.parent;
      }
      return parents;
    },
    async removeFiles() {
      this.files.splice(0, this.files.length);
    },
    getCurrentTextTokens() {
      if(!this.selectedFile) {
        return;
      }
      const tokens = tokenise(this.selectedFile.content);
      return tokens;
    },
    getCurrentTextWords() {
      if(!this.selectedFile) {
        return 0;
      }
      const wordsCount = this.selectedFile.content.split(/\s+/).length;
      return wordsCount;
    },
    getNestedWordsCount(file, ignoreEmpty) {
      let wordsCount = file.content.split(/\s+/).length;

      if(file.children) {
        for (const child of file.children) {
          wordsCount += this.getNestedWordsCount(child, ignoreEmpty);
        }
      }

      if(ignoreEmpty && wordsCount <= 2) {
        return 0;
      }

      return wordsCount;
    },
    getTextWords(file, ignoreEmpty, includeChildren) {
      let wordsCount;

      if(includeChildren) {
        wordsCount = this.getNestedWordsCount(file, ignoreEmpty);
      } else {
        wordsCount = file.content.split(/\s+/).length;
      }

      if(ignoreEmpty && wordsCount <= 2) {
        return null;
      }

      return wordsCount + " words";
    },
    selectFile(file, focusTitleInput, fromHistory = false) {
      const previousFile = this.selectedFile;
      this.selectedFile = file;

      if(focusTitleInput) {
        const editorStore = useEditorStore();

        setTimeout(() => {
          if(editorStore.titleRef) {
            editorStore.titleRef.select();
          }
        }, 100);
      }

      const editorStore = useEditorStore();
      if(editorStore.autoCompleteText) {
        editorStore.setAutoCompleteText('');
      }

      if(file && !file.dirty) {
        this.loadFileFromCloud(file.id);
      }

      // Push to browser history for navigation
      if (file && !fromHistory && previousFile?.id !== file.id) {
        try {
          window.history.pushState({ fileId: file.id }, '', '');
        } catch (e) {
          console.error('Failed to push history state:', e);
        }
      }
    },
    async loadFileFromCloud(fileId) {
      const user = useCurrentUser();
      if(!user || !this.projectId || !this.projectSettings?.syncToCloud) return;

      const localFile = this.getFile(fileId);
      if(localFile && !localFile.dirty) {
        const file = await getCloudProjectFile(user, this.projectId, fileId);

        if(localFile && !localFile.dirty && localFile.parentId === file.parentId && localFile.order === file.order) {
          localFile.title = file.title;
          localFile.content = file.content;
          localFile.synopsis = file.synopsis;
          localFile.note = file.note;
          localFile.etag = file.etag;
          localFile.icon = file.icon;
          localFile.imageUrl = file.imageUrl;
          localFile.state = file.state;
        }
      }
    },
    updateFileSettings(file, args) {
      if(!file.settings) {
        file.settings = {};
        this.setDirty(file);
      }

      if(args.fontType !== undefined) {
        file.settings.fontType = args.fontType;
        this.setDirty(file);
      }

      if(args.fontSize !== undefined) {
        file.settings.fontSize = args.fontSize;
        this.setDirty(file);
      }

      if(args.editorType !== undefined) {
        file.settings.editorType = args.editorType;
        this.setDirty(file);
      }

      if(args.windowWidth !== undefined) {
        file.settings.windowWidth = args.windowWidth;
        this.setDirty(file);
      }

      if(args.childLevel1Icon !== undefined) {
        file.settings.childLevel1Icon = args.childLevel1Icon;
        this.setDirty(file);
      }

      if(args.childLevel2Icon !== undefined) {
        file.settings.childLevel2Icon = args.childLevel2Icon;
        this.setDirty(file);
      }

      if(args.childLevel3Icon !== undefined) {
        file.settings.childLevel3Icon = args.childLevel3Icon;
        this.setDirty(file);
      }

      if(args.contextType !== undefined) {
        file.settings.contextType = args.contextType;
        this.setDirty(file);
      }
    },
    queryFiles(query, files, includeChildren, isFuzzyQuery = false, fuzzyOptions = {}) {
      // Handle fuzzy search
      if (isFuzzyQuery && typeof query === 'string') {
        const { searchFiles } = useFileSearch();
        const results = searchFiles(
          query,
          fuzzyOptions.searchType || 'all',
          true, // Enable fuzzy search
          fuzzyOptions.maxResults || 50,
          fuzzyOptions.threshold || 0.3,
          true // Return raw results
        );

        // Extract original file objects from search results
        return results.map(result => result);
      }

      // Original function-based query behavior (backward compatibility)
      const results = [];
      for (const file of files) {
        if(query(file)) {
          results.push(file);
        }
        if(includeChildren && file.children && file.children.length) {
          results.push(...this.queryFiles(query, file.children, includeChildren, isFuzzyQuery, fuzzyOptions));
        }
      }
      return results;
    },
    getContextFiles(contextLabel) {
      const files = this.queryFiles((file) => file.settings?.contextType?.label === contextLabel, this.files, true);

      return files;
    },
    getContextText(contextLabel) {
      const files = this.getContextFiles(contextLabel);
      let text = '';
      for (const file of files) {
        text += '### FILE ' + this.getFileNameAndFileNameWithPath(file) + ':\n';
        const content = htmlToMarkdown(file.content);
        if(content.trim().length > 0) {
          text += content;
        } else {
          text += '(empty file)';
        }
        text += '\n\n';
      }
      return text;
    },
    getContextSummary(contextLabel) {
      const files = this.getContextFiles(contextLabel);
      let text = '';
      for (const file of files) {
        text += '### FILE ' + this.getFileNameAndFileNameWithPath(file) + ' (SUMMARY):\n';
        const synopsis = file.synopsis ?? ''
        if(synopsis.trim().length > 0) {
          text += synopsis;
        } else {
          text += '(no summary)';
        }
        text += '\n\n';
      }
      return text;
    },
    toggleFileLabel(file, label) {
      if(!file.labels) {
        file.labels = [];
      }

      if(file.labels.includes(label)) {
        const index = file.labels.indexOf(label);
        file.labels.splice(index, 1);
      } else {
        file.labels.push(label);
      }

      this.setDirty(file);
    },
    hasFileLabel(file, label) {
      return file.labels?.find((l) => l.label === label.label) !== undefined;
    },
    clearFileLabels(file) {
      file.labels = [];
      this.setDirty(file);
    },
    setFileState(file, state) {
      file.state = state;
      this.setDirty(file);
    },
    setFileSummary(file, synopsis) {
      file.synopsis = synopsis;
      this.setDirty(file);
    },
    addVariable() {
      this.variables.push({
        title: 'new variable',
        value: ''
      });
    },
    removeVariable(index) {
      this.variables.splice(index, 1);
    },
    stickyPrompt(prompt, file) {
      if(!file.settings) {
        file.settings = {};
      }

      if(!file.settings.stickyPrompts) {
        file.settings.stickyPrompts = [];
      }

      file.settings.stickyPrompts.push(prompt.id);
    },
    unstickyPrompt(prompt, file) {
      if(!file.settings) {
        file.settings = {};
      }

      if(!file.settings.stickyPrompts) {
        return;
      }

      const index = file.settings.stickyPrompts.indexOf(prompt.id);
      if(index > -1) {
        file.settings.stickyPrompts.splice(index, 1);
      }
    },
    isStickyPrompt(prompt, file) {
      if(!file?.settings?.stickyPrompts) {
        return false;
      }

      return file.settings.stickyPrompts.includes(prompt.id);
    },
    async saveProjectDataToFile(filePath, setLastDataFile = true) {
      if(!filePath) {
        filePath = await save({
          filters: [{
            name: 'Inscriptor Project File',
            extensions: ['inscr']
          }]
        });
        this.currentLocalProjectDataFile = filePath;
      }

      const projectData = this.getProject();

      await writeTextFile(filePath, saveToJson(projectData));

      // Clear dirty flags after successful local save
      const dirtyFiles = this.getDirtyFiles();
      for (const dirtyFile of dirtyFiles) {
        dirtyFile.dirty = false;
      }

      if(setLastDataFile) {
        //const dataStore = useDataStore();
        //await dataStore.setLastDataFile(filePath);
      }

      return filePath;
    },
    async loadPagesFromFile(selected) {
      if(!selected) {
        selected = await open({
          multiple: false,
          filters: [{
            name: 'Inscriptor Project File',
            extensions: ['inscr']
          }]
        });
      }

      if (Array.isArray(selected)) {
        // user selected multiple files
      } else if (selected === null) {
        // user cancelled the selection
      } else {
        const json = await readTextFile(selected);
        const project = parseFromJson(json);
        await this.loadProject(project, false, false);
      }

      return selected;
    },
    async loadProject(project, initialiseProjectFromTemplate = false, forceSyncToCloudValue = null, importRecommendedPromptsFromTemplate = false, setWritingStyle = false) {

      const promptStore = usePromptStore();

      promptStore.restoreDefaultSettings();

      let userSettingsLoaded = false;
      if(project.userSettings) {
        await promptStore.applySettings(project.userSettings);
        userSettingsLoaded = true;
      }

      const data = project.data;
      const files = data.files ? unflattenFiles(data.files) : undefined;
      const variables = data.variables;

      this.etag = project.data.etag;
      this.projectId = project.projectId;
      this.projectName = project.projectName;
      this.projectType = data.projectType;
      this.projectSettings = {};
      this.projectSettings.syncToCloud = forceSyncToCloudValue ?? data.projectSettings?.syncToCloud ?? false;
      this.loadedUserSettings = userSettingsLoaded;

      if(!userSettingsLoaded) {
        Notify.create({
          message: 'User Settings load problem. Please restart the application.',
          color: 'negative',
          position: 'top'
        });
      }

      this.lastUserProjectSettingsHash = this.computeUserProjectSettingsHash();
      this.lastProjectDataHash = this.computerProjectDataHash();
      //this.lastSaveHash = this.computeProjectHash();

      await this.removeFiles();

      if(initialiseProjectFromTemplate) {
        if(data.projectType) {

          this.files = [];
          const template = getProjectTemplate(data.projectType);

          const promptStore = usePromptStore();

          for (const templateContextType of template.contextTypes) {
            promptStore.addContextType(templateContextType.label, templateContextType.color);
          }

          for (const templateFile of unflattenFiles(template.files)) {
            this.files.push(templateFile);
          }

          this.variables = [];
          for (const templateVariable of template.variables) {
            this.variables.push(templateVariable);
          }

          if(importRecommendedPromptsFromTemplate === true) {
            for (const id of template.importPromptPackIds) {
              await importFromMarketplace(id, "Packs", true);
            }
          }
        }
      } else {
        if(files) {
          this.files = [];
          this.files.push(...files);
          this.initialiseParents(this.files, null);
        }

        if(variables) {
          this.variables = [];
          this.variables.push(...variables);
        }
      }

      this.selectedFile = null;
      if(this.files && this.files.length > 0) {
        this.selectedFile = this.files[0];
      }

      if(setWritingStyle) {
        const writingStyleVariable = this.variables.find((variable) => variable.title === 'WritingStyle');
        if(writingStyleVariable && data.projectSettings?.initialWritingStyle) {
          writingStyleVariable.value = data.projectSettings.initialWritingStyle;
        }
      }

      // Ensure trash bin exists for all loaded projects
      this.ensureTrashBinExists();

      // Clean up files older than 14 days from trash bin
      await this.cleanupOldDeletedFiles();

      // Initialize browser history with the first file
      if (this.selectedFile) {
        try {
          window.history.replaceState({ fileId: this.selectedFile.id }, '', '');
        } catch (e) {
          console.error('Failed to initialize history in loadProject:', e);
        }
      }
    },
    getProjectData(excludeFiles = false) {
      return {
        etag: excludeFiles === true ? undefined : this.etag,
        projectId: this.projectId,
        projectName: this.projectName,
        projectSettings: this.projectSettings,
        projectType: this.projectType,
        files: excludeFiles === true ? undefined : flattenFiles(this.files),
        variables: this.variables
      }
    },
    getProject(excludeNonImportantProperties = false) {
      const promptStore = usePromptStore();

      const projectData = this.getProjectData();
      const userSettings = promptStore.getUserProjectSettings();

      const project = {
        projectName: this.projectName,
        projectId: this.projectId,

        data: projectData,
        userSettings: userSettings,
      };

      return project;
    },
    computeUserProjectSettingsHash() {
      const promptStore = usePromptStore();
      const userSettings = promptStore.getUserProjectSettings(true);

      const hash = md5(JSON.stringify(userSettings));
      return hash;
    },
    computerProjectDataHash() {
      const projectData = this.getProjectData(true);

      const hash = md5(JSON.stringify(projectData));
      return hash;
    },
    async pingProject() {
      const user = useCurrentUser();
      if(!user || !this.projectId) return;

      await pingProject(user, this.projectId);
    },
    async syncProjectToCloud(force) {
      if(!this.canSave()) {
        return;
      }

      const userSettingsHash = this.computeUserProjectSettingsHash();
      let userProjectSettingsChanged = this.lastUserProjectSettingsHash !== userSettingsHash;

      // -- save user project settings --

      if((force || userProjectSettingsChanged) && this.loadedUserSettings) {
        this.lastUserProjectSettingsHash = userSettingsHash;

        try {
          this.setBrowserWindowLeaveDialog(true);

          if(force) { // save now
            await this.saveUserProjectSettingsToCloud();
          } else { // save debounce
            if(this.saveUserProjectSettingsFunction === null) {
              this.saveUserProjectSettingsFunction = this.getSaveUserProjectSettingsDebounce();
            }

            this.saveUserProjectSettingsFunction();
          }

        } finally {
          this.setBrowserWindowLeaveDialog(false);
        }
      }

      // --- save project data (not files, but all other settings)

      const projectDataHash = this.computerProjectDataHash();
      let projectDataChanged = this.lastProjectDataHash !== projectDataHash;

      // -- save user project settings --
      if(force || projectDataChanged) {
        this.lastProjectDataHash = projectDataHash;

        try {
          this.setBrowserWindowLeaveDialog(true);

          if(force) { // save now
            await this.saveProjectDataToCloud();
          } else { // save debounce
            if(this.saveProjectDataFunction === null) {
              this.saveProjectDataFunction = this.getSaveProjectDataDebounce();
            }

            this.saveProjectDataFunction();
          }

        } finally {
          this.setBrowserWindowLeaveDialog(false);
        }
      }

      // --- save dirty files

      const dirtyFiles = this.getDirtyFiles();

      if(dirtyFiles.length > 0) {
        try {
          this.setBrowserWindowLeaveDialog(true);

          await this.saveDirtyFilesToCloud(dirtyFiles);
        } finally {
          this.setBrowserWindowLeaveDialog(false);
        }
      }
    },
    setBrowserWindowLeaveDialogIfNotSet() {
      if(window.onbeforeunload === null) {
        this.setBrowserWindowLeaveDialog(true);
      }
    },
    setBrowserWindowLeaveDialog(set) {
      const layoutStore = useLayoutStore();
      if(layoutStore.runsInDesktopApp()) {
        // handled in MainLayout in a better way
        return;
      }

      if(set) {
        window.onbeforeunload = async function() {
          try {
            await quickSave(true);

            const dirtyFiles = this.getDirtyFiles();
            if(dirtyFiles.length === 0) {
              return undefined;
            }
          } catch (e) {
            console.error('Failed to save dirty files');
          }
        };
      } else {
        window.onbeforeunload = null;
      }
    },
    getSaveUserProjectSettingsDebounce() {
      return useDebounceFn(async () => {
        console.log('saved user project settings!');

        await this.saveUserProjectSettingsToCloud();

        this.setBrowserWindowLeaveDialog(false);
      }, 5000, { maxWait: 5000 })
    },
    getSaveProjectDataDebounce() {
      return useDebounceFn(async () => {
        console.log('saved user project settings!');

        await this.saveProjectDataToCloud();

        this.setBrowserWindowLeaveDialog(false);
      }, 5000, { maxWait: 5000 })
    },
    getDirtyFiles() {
      return this.getDirtyFilesRecursive(this.files);
    },
    getDirtyFilesRecursive(files) {
      const retValue = [];

      for (const file of files) {
        if(file.dirty) {
          retValue.push(file);
        }

        if(file.children && file.children.length > 0) {
          retValue.push(...this.getDirtyFilesRecursive(file.children));
        }
      }

      return retValue;
    },
    async saveUserProjectSettingsToCloud() {
      const user = useCurrentUser();
      if(!user || !this.projectId) return;

      const layoutStore = useLayoutStore();
      const promptStore = usePromptStore();

      layoutStore.setProjectSyncIndicator(true, 1000);

      try {
        const userSettings = promptStore.getUserProjectSettings();

        const response = await uploadProjectUserProjectSettings(user, this.projectId, userSettings);

        promptStore.etag = response.etag;

        layoutStore.setProjectSyncIndicator(false, 0);
      } finally{
        layoutStore.setProjectSyncIndicator(false, 1000);
      }
    },
    async saveProjectDataToCloud() {
      const user = useCurrentUser();
      if(!user || !this.projectId) return;

      const layoutStore = useLayoutStore();

      layoutStore.setProjectSyncIndicator(true, 1000);

      try {
        const projectData = this.getProjectData(true);

        const response = await uploadProjectData(user, this.projectId, projectData);

        this.etag = response.etag;

        layoutStore.setProjectSyncIndicator(false, 0);
      } finally{
        layoutStore.setProjectSyncIndicator(false, 1000);
      }
    },
    async saveDirtyFilesToCloud(dirtyFiles) {
      if(dirtyFiles.length === 0) {
        return;
      }

      const fileRequests = dirtyFiles.map((file) => {
        return { id: file.id, requestType: 'Upsert', file: file };
      });

      try {
        await this.saveProjectFiles(fileRequests);

        for (const dirtyFile of dirtyFiles) {
          dirtyFile.dirty = false;
        }

      } catch (e) {
        console.error('Failed to save dirty files');
      }
    },
    async saveProjectFiles(fileRequests) {
      const user = useCurrentUser();
      if(!user || !this.projectId) return;
      if(this.projectSettings.syncToCloud === false) return;

      const layoutStore = useLayoutStore();

      layoutStore.setProjectSyncIndicator(true, 1000);

      try {
        const response = await uploadProjectFiles(user, this.projectId, fileRequests);
        this.applyFileEtags(response);
        layoutStore.setProjectSyncIndicator(false, 0);

        return response;
      } finally{
        layoutStore.setProjectSyncIndicator(false, 1000);
      }
    },
    applyFileEtags(fileIdsWithEtags) {
      for (const fileWithEtag of fileIdsWithEtags) {
        const file = this.getFile(fileWithEtag.id);
        if(file) {
          file.etag = fileWithEtag.etag;
        }
      }
    },
    async saveProjectToCloud() {

      const user = useCurrentUser();
      if(!user) return;

      const layoutStore = useLayoutStore();

      layoutStore.setProjectSyncIndicator(true, 1000);

      try {
        const projectData = this.getProject();
        await uploadProject(user, projectData);
        layoutStore.setProjectSyncIndicator(false, 0);
      } finally{
        layoutStore.setProjectSyncIndicator(false, 1000);
      }
    },
    async downloadCloudProject(projectId) {
      const user = useCurrentUser();
      if(!user) return;

      const project = await downloadProject(user, projectId);

      const layoutStore = useLayoutStore();

      if(layoutStore.runsInDesktopApp()) {
          let filePath = await save({
            filters: [{
              name: 'Inscriptor Project File',
              extensions: ['inscr']
            }]
          });

          await writeTextFile(filePath, saveToJson(project));
      } else {
        // Convert JSON object to a string
        const jsonString = saveToJson(project);

        downloadFile(jsonString, convertToFilesystemSafeName(project.projectName) + '.json', 'application/json');
      }
    },
    async downloadCloudProjectAsZip(projectId) {
      const user = useCurrentUser();
      if(!user) return;

      const zipBlob = await downloadProjectAsZip(user, projectId);

      const layoutStore = useLayoutStore();

      if(layoutStore.runsInDesktopApp()) {
        // Desktop app: Use Tauri dialog to save file
        let filePath = await save({
          filters: [{
            name: 'Zip Archive',
            extensions: ['zip']
          }]
        });

        if (filePath) {
          // Convert blob to array buffer for Tauri
          const arrayBuffer = await zipBlob.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          await writeFile(filePath, uint8Array);

          Notify.create({
            message: 'Project downloaded successfully',
            color: 'positive',
            position: 'top'
          });
        }
      } else {
        // Browser: Download blob directly
        const blob = new Blob([zipBlob], { type: 'application/zip' });
        const link = document.createElement('a');
        link.download = convertToFilesystemSafeName(this.projectName) + '.zip';
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);

        Notify.create({
          message: 'Project downloaded successfully',
          color: 'positive',
          position: 'top'
        });
      }
    },
    async loadCloudProject(projectId) {
      const user = useCurrentUser();
      if(!user) return;

      const project = await downloadProject(user, projectId);
      if(!project.data.projectSettings) {
        project.data.projectSettings = {};
      }

      if(project.data.projectSettings.syncToCloud !== true) {
        project.data.projectSettings.syncToCloud = true;
      }

      await this.loadProject(project);

      this.currentLocalProjectDataFile = null;

      this.lastUserProjectSettingsHash = this.computeUserProjectSettingsHash();
      this.lastProjectDataHash = this.computerProjectDataHash();
    },
    async deleteCloudProject(projectId) {
      const user = useCurrentUser();
      if(!user) return;

      await deleteProject(user, projectId);
    },
    getTemporaryFileMetaProperty(file, key) {
      return this.temporaryFileMeta[file.id]?.[key];
    },
    setTemporaryFileMetaProperty(file, key, value) {
      if(!this.temporaryFileMeta[file.id]) {
        this.temporaryFileMeta[file.id] = {};
      }

      this.temporaryFileMeta[file.id][key] = value;
    },
    canSave() {
      return this.exiting === false;
    },
    canQuickSave() {
      return !this.saving && !this.creatingNewProject;
    },
    setSaving(set) {
      this.saving = set;
    },
    setCreatingNewProject(set) {
      this.creatingNewProject = set;
    },
    async loadDataFile(file) {
      const fileStore = useFileStore();

      let selected = await fileStore.loadPagesFromFile(file);
      if(!selected) {
        return null;
      }

      this.currentLocalProjectDataFile = selected;
      this.addRecentProjectDataFile(selected);
      return selected;
    },
    async loadLocalSettings() {
      try {
        this.recentProjectDataFiles = useStorage('recent-project-data-files', []).value;
      } catch (e) {
        console.error('Failed to load previous state', e);
      }
    },
    async saveProjectDataToLocalFile() {
      const fileStore = useFileStore();

      return await fileStore.saveProjectDataToFile(this.currentLocalProjectDataFile, true);
    },
    addRecentProjectDataFile(filePath) {
      const index = this.recentProjectDataFiles.indexOf(filePath);
      if(index > -1) {
        this.recentProjectDataFiles.splice(index, 1);
      }

      // while - remove if more than 10
      while(this.recentProjectDataFiles.length >= 10) {
        this.recentProjectDataFiles.pop();
      }

      this.recentProjectDataFiles.unshift(filePath);

      // persist to local storage
      const state = useStorage('recent-project-data-files', []);
      state.value = this.recentProjectDataFiles;
    },
    setFileImage(file, imageUrl) {
      file.imageUrl = imageUrl;
      this.setDirty(file);
    },
    getFileNameAndFileNameWithPath(file) {
      if(!file) {
        return null;
      }
      if(file.parent) {
        return file.title + ' in "' + this.getFileNameWithPath(file.parent) + '/' + file.title + '"';
      } else {
        return file.title;
      }
    },
    getFileNameWithPath(file, appendFileName = true) {
      if(!file) {
        return null;
      }
      if(file.parent) {
        return this.getFileNameWithPath(file.parent) + appendFileName ? ('/' + file.title) : '';
      } else {
        return appendFileName ? file.title : "";
      }
    },
    ensureTrashBinExists() {
      // Check if trash bin already exists
      const trashBin = this.files.find(file => file.id === '__trash_bin__');
      if (trashBin) {
        // Ensure it's positioned last
        const index = this.files.indexOf(trashBin);
        if (index !== this.files.length - 1) {
          this.files.splice(index, 1);
          this.files.push(trashBin);
        }
        return trashBin;
      }

      // Create and add trash bin
      const trashBinFile = createTrashBinFile();
      this.files.push(trashBinFile);
      this.initialiseParents(this.files, null);
      return trashBinFile;
    },
    // Navigate to file from browser history
    selectFileFromHistory(fileId) {
      if (!fileId) return;

      const file = this.getFile(fileId);
      if (!file) {
        console.warn('File not found in history:', fileId);
        return;
      }

      // Pass fromHistory=true to prevent pushing to history again
      this.selectFile(file, false, true);
    },
  }
});
