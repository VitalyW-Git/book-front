import { ItemInterface } from "../../common/interface";
import { itemsApi } from "../../common/services/itemsApi";
import { useItems } from "../hooks/useItems";
import { useSelectedItems } from "../hooks/useSelectedItems";
import { AddItemForm } from "../components/AddItemForm";
import { ItemsList } from "../components/ItemsList";
import { SelectedItemsList } from "../components/SelectedItemsList";

export default function Items() {
  const leftItems = useItems();
  const rightItems = useSelectedItems();

  const handleSelectItem = async (item: ItemInterface) => {
    try {
      await itemsApi.selectItem(item.id);
      leftItems.removeItem(item.id);
      rightItems.addItem(item);
    } catch (error) {
      console.error("Error selecting item:", error);
    }
  };

  const handleDeselectItem = async (item: ItemInterface) => {
    try {
      await itemsApi.deselectItem(item.id);
      rightItems.removeItem(item.id);
      leftItems.addItem(item);
    } catch (error) {
      console.error("Error deselecting item:", error);
    }
  };

  const handleDragStart = (item: ItemInterface) => {
    rightItems.setDraggedItem(item);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetItem: ItemInterface, targetIndex: number) => {
    e.preventDefault();
    if (!rightItems.draggedItem || rightItems.draggedItem?.id === targetItem.id) {
      rightItems.setDraggedItem(null);
      return;
    }

    const draggedIndex = rightItems.items.findIndex(
      (item) => item.id === rightItems.draggedItem?.id
    );
    if (targetIndex === -1) {
      rightItems.setDraggedItem(null);
      return;
    }

    rightItems.reorderItems(draggedIndex, targetIndex);
    rightItems.setDraggedItem(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Список элементов</h1>

        <AddItemForm onItemAdded={leftItems.refresh} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ItemsList
            items={leftItems.items}
            filter={leftItems.filter}
            onFilterChange={leftItems.setFilter}
            loading={leftItems.loading}
            total={leftItems.total}
            observerRef={leftItems.observerRef}
            onSelectItem={handleSelectItem}
          />

          <SelectedItemsList
            items={rightItems.items}
            filter={rightItems.filter}
            onFilterChange={rightItems.setFilter}
            loading={rightItems.loading}
            total={rightItems.total}
            observerRef={rightItems.observerRef}
            onDeselectItem={handleDeselectItem}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          />
        </div>
      </div>
    </div>
  );
}
