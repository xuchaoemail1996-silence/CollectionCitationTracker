/* Zotero 9 bootstrapped plugin entry point. */
var CollectionCitationTracker;

function install() {}

async function startup({ id, rootURI }) {
  Services.scriptloader.loadSubScript(rootURI + "tracker.js");
  CollectionCitationTracker.init(id);
  await CollectionCitationTracker.registerColumn();
  for (const win of Zotero.getMainWindows()) {
    if (win.ZoteroPane) CollectionCitationTracker.attachWindow(win);
  }
}

function onMainWindowLoad({ window }) {
  if (CollectionCitationTracker) CollectionCitationTracker.attachWindow(window);
}

function onMainWindowUnload({ window }) {
  if (CollectionCitationTracker) CollectionCitationTracker.detachWindow(window);
}

async function shutdown() {
  if (!CollectionCitationTracker) return;
  for (const win of Zotero.getMainWindows()) {
    CollectionCitationTracker.detachWindow(win);
  }
  await CollectionCitationTracker.unregisterColumn();
  CollectionCitationTracker = undefined;
}

function uninstall() {
  // User data is intentionally retained on uninstall to allow easy re-installation.
}
