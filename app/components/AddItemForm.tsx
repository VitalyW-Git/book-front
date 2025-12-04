import { useState } from "react";
import { itemsApi } from "../../common/services/itemsApi";
import { AddItemFormPropsInterface } from "../../common/interface";

export const AddItemForm = ({ onItemAdded }: AddItemFormPropsInterface) => {
  const [newItemId, setNewItemId] = useState<string>("");

  const handleAddItem = async () => {
    const id = +newItemId;
    if (id && id <= 0) {
      alert("Введите корректный ID (положительное число)");
      return;
    }

    try {
      await itemsApi.addItem(id);
      setNewItemId("");
      onItemAdded();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Ошибка при добавлении элемента");
    }
  };

  return (
    <div className="mb-6 p-4 bg-white rounded-lg shadow">
      <div className="flex gap-2">
        <input
          type="number"
          value={newItemId}
          onChange={(e) => setNewItemId(e.target.value)}
          placeholder="Введите ID нового элемента"
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          onClick={handleAddItem}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
        >
          Добавить
        </button>
      </div>
    </div>
  );
};
