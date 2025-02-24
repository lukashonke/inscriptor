import {guid} from "src/common/utils/guidUtils";

export function createFile(title) {

  const file = {
    id: guid(),
    title: title,
    content: '',
    order: -1,
    icon: 'las la-file',
    expanded: false,
    synopsis: '',
    note: '',
    state: '',
    labels: [],
    view: 'text',

    children: [],
    parentId: null,
  }

  return file;
}

export function useFindFileRecursively(files, fileId) {
  if(!files || files?.length == 0) {
    return null;
  }

  // search top level
  let file = files.find((p) => p.id == fileId);

  // if not found, dig deeper
  if(!file) {
    files.forEach((p) => {
      const foundFile = useFindFileRecursively(p.children, fileId);
      if(foundFile) {
        file = foundFile;
        return;
      }
    })
  }

  return file;
}

export function flattenFiles(files) {
  let flatFiles = [];
  files.forEach((file) => {
    flatFiles.push(file);
    if(file.children) {
      flatFiles = flatFiles.concat(flattenFiles(file.children));
    }
  });
  return flatFiles;
}

export function unflattenFiles(flatFiles) {
  const files = [];

  flatFiles.forEach((file) => {
    file.children = [];
  });

  // First, build the hierarchical structure
  flatFiles.forEach((file) => {
    if (!file.parentId) {
      files.push(file);
    } else {
      const parent = flatFiles.find((p) => p.id === file.parentId);
      if(parent) {
        if (!parent.children) {
          parent.children = [];
        }
        parent.children.push(file);
      }
    }
  });

  // Recursive function to sort children by their "order" property
  function sortChildren(list) {
    list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    list.forEach((item) => {
      if (item.children && item.children.length > 0) {
        sortChildren(item.children);
      }
    });
  }

  // Sort the top-level files and their descendants
  sortChildren(files);

  return files;
}

export function parseFromJson(json) {
  const data = JSON.parse(json);
  return data;
}

function replacer(key,value)
{
  if (key == "parent") return undefined;
  if (key == "children") return undefined;
  if (key == "dirty") return undefined;
  else return value;
}
export function saveToJson(files) {
  const json = JSON.stringify(files, replacer, 2);
  return json;
}
