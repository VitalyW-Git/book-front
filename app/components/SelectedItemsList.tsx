import { ItemInterface } from "../../common/interface";

interface SelectedItemsListProps {
  items: ItemInterface[];
  filter: string|null;
  onFilterChange: (value: string) => void;
  loading: boolean;
  total: number;
  observerRef: React.RefObject<HTMLDivElement | null>;
  draggedItem: ItemInterface | null;
  onDeselectItem: (item: ItemInterface) => void;
  onDragStart: (item: ItemInterface) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, item: ItemInterface, index: number) => void;
}

export const SelectedItemsList = ({
  items,
  filter,
  onFilterChange,
  loading,
  total,
  observerRef,
  draggedItem,
  onDeselectItem,
  onDragStart,
  onDragOver,
  onDrop,
}: SelectedItemsListProps) => {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-xl font-semibold mb-4">Выбранные элементы</h2>
      <div className="mb-4">
        <input
          type="text"
          value={filter}
          onChange={(e) => onFilterChange(e.target.value)}
          placeholder="Фильтр по ID"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="h-[600px] overflow-y-auto border border-gray-200 rounded">
        {items.map((item, index) => (
          <div
            key={item.id}
            draggable
            onDragStart={() => onDragStart(item)}
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, item, index)}
            className="p-3 border-b border-gray-100 hover:bg-gray-50 flex justify-between items-center cursor-move"
          >
            <span className="text-gray-700">ID: {item.id}</span>
            <button
              onClick={() => onDeselectItem(item)}
              className="px-4 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
            >
              Убрать
            </button>
          </div>
        ))}
        {loading && <div className="p-4 text-center text-gray-500">Загрузка...</div>}
        {items.length === total && items.length > 0 && (
          <div className="p-4 text-center text-gray-500">Все элементы загружены</div>
        )}
        <div ref={observerRef} className="h-10" />
      </div>
    </div>
  );
};

