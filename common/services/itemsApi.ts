import { API_URL } from "../constants/api";
import { ItemsResponseInterface, SelectedResponseInterface } from "../interface";

export const itemsApi = {
  getItems: async (
    page: number,
    limit: number,
    filterId?: string
  ): Promise<ItemsResponseInterface> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (filterId) {
      params.append("filterId", filterId);
    }

    const response = await fetch(`${API_URL}?${params}`);
    return response.json();
  },

  getSelectedItems: async (
    page: number,
    limit: number,
    filterId?: string
  ): Promise<SelectedResponseInterface> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (filterId) {
      params.append("filterId", filterId);
    }

    const response = await fetch(`${API_URL}/selected?${params}`);
    return response.json();
  },

  addItem: async (id: number): Promise<void> => {
    const response = await fetch(`${API_URL}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Ошибка при добавлении элемента");
    }
  },

  selectItem: async (id: number): Promise<void> => {
    await fetch(`${API_URL}/selected`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "select", id }),
    });
  },

  deselectItem: async (id: number): Promise<void> => {
    await fetch(`${API_URL}/selected`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "deselect", id }),
    });
  },

  reorderItems: async (order: number[]): Promise<void> => {
    await fetch(`${API_URL}/selected`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reorder", order }),
    });
  },
};
