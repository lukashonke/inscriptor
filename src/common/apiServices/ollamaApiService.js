import {Ollama} from "ollama/browser";

export async function downloadOllamaModel(modelName, url, stream = false) {
  const ollama = new Ollama({ host: url })

  const streamResponse = await ollama.pull({
    model: modelName,
    stream: stream,
  });

  return [streamResponse, ollama];
}

export async function removeOllamaModel(modelName, url) {
  const ollama = new Ollama({host: url})

  return await ollama.delete({
    model: modelName,
  });
}

export async function ollamaPing(url) {
  const ollama = new Ollama({host: url})

  try {
    await ollama.list();
    return true;
  } catch (e) {
    return false;
  }
}

export async function ollamaList(url) {
  const ollama = new Ollama({host: url})

  try {
    await ollama.list();
    return true;
  } catch (e) {
    return false;
  }
}
