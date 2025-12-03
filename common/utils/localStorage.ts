const STORAGE_KEY = "itemsState";

export interface ItemsState {
  selectedOrder: number[];
}

export const localStorageService = {
  getState: (): ItemsState | null => {
    try {
      const savedState = localStorage.getItem(STORAGE_KEY);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        if (parsed.selectedOrder && Array.isArray(parsed.selectedOrder)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Failed to load state from localStorage", e);
    }
    return null;
  },

  saveState: (state: ItemsState): void => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error("Failed to save state to localStorage", e);
    }
  },
};
