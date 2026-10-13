/*
 * Collection Citation Tracker for Zotero 9.
 *
 *  - Statuses belong to a collection, not to a Zotero item globally.
 *  - No changes to Zotero library item metadata or tags.
 *  - Statuses are stored in local Zotero profile preferences.
 *  - Statuses do NOT sync between different Zotero installations.
 */

CollectionCitationTracker = {
  pluginID: null,
  columnDataKey: null,
  windows: new Map(),
  cache: new Map(),
  prefPrefix: "extensions.collectionCitationTracker.collection.",

  init(pluginID) {
    this.pluginID = pluginID;
  },

  log(message) {
    Zotero.debug("Collection Citation Tracker: " + message);
  },

  currentCollection(window) {
    try {
      const pane = window?.ZoteroPane;
      const collection = pane?.getSelectedCollection?.();
      return (collection && collection.key && collection.libraryID != null) ? collection : null;
    }
    catch (error) {
      return null;
    }
  },

  activeCollection() {
    const win = Zotero.getMainWindow?.() || Zotero.getMainWindows().find(w => w.ZoteroPane);
    return this.currentCollection(win);
  },

  prefName(collection) {
    if (!collection?.key || collection.libraryID == null) {
      throw new Error("请先在左侧选择一个有效的 Zotero 分类。");
    }
    // Zotero collection keys are stable across sync; numeric library IDs are local.
    // Library ID + collection key prevents collisions between libraries.
    return this.prefPrefix + collection.libraryID + "." + collection.key;
  },

  statesFor(collection) {
    const name = this.prefName(collection);
    if (this.cache.has(name)) return this.cache.get(name);
    const raw = Zotero.Prefs.get(name, true);
    let states = Object.create(null);
    if (raw) {
      // Fail closed: do not overwrite data if an existing preference is malformed.
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("此分类的引用记录无法解析。请先备份 Zotero 配置文件。");
      }
      for (const [key, value] of Object.entries(parsed)) {
        if (value === "c" || value === "u") states[key] = value;
      }
    }
    this.cache.set(name, states);
    return states;
  },

  statusFor(item, collection) {
    if (!collection || !item || !item.isRegularItem?.()) return "";
    if (item.libraryID !== collection.libraryID) return "";
    const state = this.statesFor(collection)[item.key];
    if (state === "c") return "✓ 已引用";
    if (state === "u") return "○ 未引用";
    return "— 未标记";
  },

  async registerColumn() {
    this.columnDataKey = await Zotero.ItemTreeManager.registerColumn({
      dataKey: "collectionCitationStatus",
      label: "引用状态",
      pluginID: this.pluginID,
      enabledTreeIDs: ["main"],
      defaultIn: ["default"],
      showInColumnPicker: true,
      flex: 0,
      width: "115",
      minWidth: 85,
      zoteroPersist: ["width", "hidden", "sortDirection"],
      dataProvider: (item) => {
        try {
          return this.statusFor(item, this.activeCollection());
        }
        catch (error) {
          this.log("column data error: " + error);
          return "! 数据错误";
        }
      }
    });
    if (!this.columnDataKey) {
      throw new Error("Zotero 未能注册“引用状态”列。");
    }
    this.log("registered column " + this.columnDataKey);
  },

  async unregisterColumn() {
    if (!this.columnDataKey) return;
    try {
      await Zotero.ItemTreeManager.unregisterColumn(this.columnDataKey);
    }
    catch (error) {
      this.log("column cleanup error: " + error);
    }
    this.columnDataKey = null;
  },

  selectedRegularItems(window, collection) {
    if (!collection) return [];
    const items = window.ZoteroPane?.getSelectedItems?.() || [];
    return items.filter(item => item?.isRegularItem?.() && item.libraryID === collection.libraryID);
  },

  attachWindow(window) {
    if (this.windows.has(window)) return;
    const doc = window.document;
    const hostMenu = doc.getElementById("zotero-itemmenu");
    if (!hostMenu || !window.ZoteroPane) {
      this.log("main window context menu unavailable");
      return;
    }

    const menu = doc.createXULElement("menu");
    menu.id = "cct-item-menu";
    menu.setAttribute("label", "当前分类：引用状态");
    const popup = doc.createXULElement("menupopup");
    menu.appendChild(popup);

    const actions = [
      ["c", "✓ 标记为已引用"],
      ["u", "○ 标记为未引用"],
      [null, "× 清除此分类的标记"]
    ];
    for (const [state, label] of actions) {
      const item = doc.createXULElement("menuitem");
      item.setAttribute("label", label);
      item.addEventListener("command", () => {
        this.markSelection(window, state).catch(error => this.showError(window, error));
      });
      popup.appendChild(item);
    }

    const showing = event => {
      if (event.target !== hostMenu) return;
      const collection = this.currentCollection(window);
      const validItems = this.selectedRegularItems(window, collection);
      menu.hidden = !(collection && validItems.length);
    };
    hostMenu.addEventListener("popupshowing", showing);
    hostMenu.appendChild(menu);
    this.windows.set(window, { hostMenu, menu, showing });
  },

  detachWindow(window) {
    const context = this.windows.get(window);
    if (!context) return;
    context.hostMenu.removeEventListener("popupshowing", context.showing);
    context.menu.remove();
    this.windows.delete(window);
  },

  async markSelection(window, state) {
    if (state !== "c" && state !== "u" && state !== null) {
      throw new Error("无效的引用状态。");
    }
    const collection = this.currentCollection(window);
    const selected = this.selectedRegularItems(window, collection);
    if (!collection || !selected.length) {
      throw new Error("请在左侧选中一个分类，再选中其中的文献条目。");
    }

    const pref = this.prefName(collection);
    const updated = Object.assign(Object.create(null), this.statesFor(collection));
    for (const item of selected) {
      if (state === null) delete updated[item.key];
      else updated[item.key] = state;
    }

    // Commit the preference first. Keep the previous cache if writing fails.
    Zotero.Prefs.set(pref, JSON.stringify(updated), true);
    this.cache.set(pref, updated);

    // Recompute the custom-column data while maintaining item selection.
    const itemView = window.ZoteroPane.itemsView;
    try {
      if (typeof itemView?.refreshAndMaintainSelection === "function") {
        await itemView.refreshAndMaintainSelection();
      }
      else if (typeof itemView?.refresh === "function") {
        await itemView.refresh();
      }
      else if (typeof itemView?.tree?.invalidate === "function") {
        itemView.tree.invalidate();
      }
    }
    catch (error) {
      this.log("status saved, but could not refresh column: " + error);
      this.showError(window, new Error("状态已经保存。如列表暂未更新，请切换到其他分类后再切回来。"));
    }
  },

  showError(window, error) {
    const message = error?.message || String(error);
    this.log(message);
    try {
      Services.prompt.alert(window, "分类引用标记", message);
    }
    catch (_) {
      window.alert(message);
    }
  }
};
