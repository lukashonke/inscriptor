import { useMarketplace } from "src/composables/useMarketplace";

export async function importFromMarketplace(packId, category, skipDialog) {
  const imported = [];
  const { importFromMarketplace: importFn } = useMarketplace();
  await importFn(packId, category, { skipDialog, importedTracker: imported });
}

export function getAssetUrl(path) {
  return 'https://taletellercms.azurewebsites.net' + '/assets/' + path;
}

