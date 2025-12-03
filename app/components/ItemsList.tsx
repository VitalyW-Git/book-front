import { ItemInterface } from "../../common/interface";

interface ItemsListProps {
  items: ItemInterface[];
  filter: string|null;
  onFilterChange: (value: string) => void;
  loading: boolean;
  total: number;
  observerRef: React.RefObject<HTMLDivElement | null>;
  onSelectItem: (item: ItemInterface) => void;
}

export const ItemsList = ({
  items,
  filter,
  onFilterChange,
  loading,
  total,
  observerRef,
  onSelectItem,
}: ItemsListProps) => {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-xl font-semibold mb-4">Все элементы</h2>
      <div className="mb-4">
        <input
          type="text"
          value={filter}
          onChange={(e) => onFilterChange(e.target.value)}
          placeholder="Фильтр по ID"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
        />
      </div>
      <div className="h-[600px] overflow-y-auto border border-gray-200 rounded">
        {!loading && items.map((item) => (
          <div
            key={item.id}
            className="p-3 border-b border-gray-100 hover:bg-gray-50 flex justify-between items-center"
          >
            <span className="text-gray-700">ID: {item.id}</span>
            <button
              onClick={() => onSelectItem(item)}
              className="px-4 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition"
            >
              Выбрать
            </button>
          </div>
        ))}
        {loading && <div className="p-4 text-center text-gray-500">Загрузка...</div>}
        {!loading && items.length === total && (
          <div className="p-4 text-center text-gray-500">Все элементы загружены</div>
        )}
        <div ref={observerRef} className="h-10" />
      </div>
    </div>
  );
};

