
import { AppData, AppSettings, Store, Order } from '../types';
import { DEFAULT_SETTINGS } from '../constants';

const STORAGE_KEY = 'briik_app_data';

export const storageService = {
  loadData: (): AppData => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        settings: DEFAULT_SETTINGS,
        stores: [],
        orders: []
      };
    }
    return JSON.parse(raw);
  },

  saveData: (data: AppData) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },

  clearAll: () => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  }
};
