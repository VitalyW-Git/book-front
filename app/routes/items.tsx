import { useState, useEffect, useRef, useCallback } from "react";
import type { Route } from "./+types/items";

const API_URL = "http://localhost:3000/api/items";

interface Item {
  id: number;
}

interface ItemsResponse {
  items: Item[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

interface SelectedResponse extends ItemsResponse {
  order: number[];
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Items List" },
    { name: "description", content: "List of 1,000,000 items" },
  ];
}

export default function Items() {
  const [leftItems, setLeftItems] = useState<Item[]>([]);
  const [rightItems, setRightItems] = useState<Item[]>([]);
  const [leftPage, setLeftPage] = useState(1);
  const [rightPage, setRightPage] = useState(1);
  const [leftFilter, setLeftFilter] = useState("");
  const [rightFilter, setRightFilter] = useState("");
  const [leftHasMore, setLeftHasMore] = useState(true);
  const [rightHasMore, setRightHasMore] = useState(true);
  const [leftLoading, setLeftLoading] = useState(false);
  const [rightLoading, setRightLoading] = useState(false);
  const [newItemId, setNewItemId] = useState("");
  const [draggedItem, setDraggedItem] = useState<Item | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<number[]>([]);

  const leftObserverRef = useRef<HTMLDivElement>(null);
  const rightObserverRef = useRef<HTMLDivElement>(null);

  // Загрузка состояния из localStorage при монтировании
  useEffect(() => {
    const savedState = localStorage.getItem("itemsState");
    if (savedState) {
      try {
        const { selectedOrder: savedOrder } = JSON.parse(savedState);
        if (Array.isArray(savedOrder)) {
          setSelectedOrder(savedOrder);
          // Восстанавливаем состояние на сервере
          fetch(`${API_URL}/selected`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "reorder", order: savedOrder }),
          }).catch(console.error);
        }
      } catch (e) {
        console.error("Failed to load state from localStorage", e);
      }
    }
  }, []);

  // Загрузка элементов левого окна
  const loadLeftItems = useCallback(async (page: number, filterId?: string, reset = false) => {
    if (leftLoading) return;
    setLeftLoading(true);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        excludeSelected: "true",
      });
      if (filterId) {
        params.append("filterId", filterId);
      }

      const response = await fetch(`${API_URL}?${params}`);
      const data: ItemsResponse = await response.json();

      if (reset) {
        setLeftItems(data.items);
      } else {
        setLeftItems((prev) => {
          const existingIds = new Set(prev.map((i) => i.id));
          const newItems = data.items.filter((item) => !existingIds.has(item.id));
          return [...prev, ...newItems];
        });
      }
      setLeftHasMore(data.hasMore);
      setLeftPage(page);
    } catch (error) {
      console.error("Error loading left items:", error);
    } finally {
      setLeftLoading(false);
    }
  }, [leftLoading]);

  // Загрузка элементов правого окна
  const loadRightItems = useCallback(async (page: number, filterId?: string, reset = false) => {
    if (rightLoading) return;
    setRightLoading(true);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (filterId) {
        params.append("filterId", filterId);
      }

      const response = await fetch(`${API_URL}/selected?${params}`);
      const data: SelectedResponse = await response.json();

      if (reset) {
        setRightItems(data.items);
        setSelectedOrder(data.order);
      } else {
        setRightItems((prev) => {
          const existingIds = new Set(prev.map((i) => i.id));
          const newItems = data.items.filter((item) => !existingIds.has(item.id));
          return [...prev, ...newItems];
        });
      }
      setRightHasMore(data.hasMore);
      setRightPage(page);
    } catch (error) {
      console.error("Error loading right items:", error);
    } finally {
      setRightLoading(false);
    }
  }, [rightLoading]);

  // Первоначальная загрузка
  useEffect(() => {
    loadLeftItems(1);
    loadRightItems(1);
  }, []);

  // Обработка изменения фильтра левого окна
  useEffect(() => {
    const timer = setTimeout(() => {
      loadLeftItems(1, leftFilter || undefined, true);
    }, 300);
    return () => clearTimeout(timer);
  }, [leftFilter]);

  // Обработка изменения фильтра правого окна
  useEffect(() => {
    const timer = setTimeout(() => {
      loadRightItems(1, rightFilter || undefined, true);
    }, 300);
    return () => clearTimeout(timer);
  }, [rightFilter]);

  // Intersection Observer для левого окна
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && leftHasMore && !leftLoading) {
          loadLeftItems(leftPage + 1, leftFilter || undefined);
        }
      },
      { threshold: 0.1 }
    );

    if (leftObserverRef.current) {
      observer.observe(leftObserverRef.current);
    }

    return () => observer.disconnect();
  }, [leftHasMore, leftLoading, leftPage, leftFilter, loadLeftItems]);

  // Intersection Observer для правого окна
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && rightHasMore && !rightLoading) {
          loadRightItems(rightPage + 1, rightFilter || undefined);
        }
      },
      { threshold: 0.1 }
    );

    if (rightObserverRef.current) {
      observer.observe(rightObserverRef.current);
    }

    return () => observer.disconnect();
  }, [rightHasMore, rightLoading, rightPage, rightFilter, loadRightItems]);

  // Добавление элемента
  const handleAddItem = async () => {
    const id = parseInt(newItemId);
    if (isNaN(id) || id <= 0) {
      alert("Введите корректный ID (положительное число)");
      return;
    }

    try {
      const response = await fetch(`${API_URL}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        setNewItemId("");
        // Перезагружаем левое окно
        loadLeftItems(1, leftFilter || undefined, true);
      } else {
        const error = await response.json();
        alert(error.error || "Ошибка при добавлении элемента");
      }
    } catch (error) {
      console.error("Error adding item:", error);
      alert("Ошибка при добавлении элемента");
    }
  };

  // Выбор элемента
  const handleSelectItem = async (item: Item) => {
    try {
      await fetch(`${API_URL}/selected`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "select", id: item.id }),
      });

      // Удаляем из левого окна и добавляем в правое
      setLeftItems((prev) => prev.filter((i) => i.id !== item.id));
      setRightItems((prev) => {
        // Проверяем, что элемента еще нет в списке
        if (prev.some((i) => i.id === item.id)) {
          return prev;
        }
        return [...prev, item];
      });
      setSelectedOrder((prev) => {
        if (prev.includes(item.id)) {
          return prev;
        }
        return [...prev, item.id];
      });

      // Сохраняем состояние
      const newOrder = [...selectedOrder, item.id];
      localStorage.setItem("itemsState", JSON.stringify({ selectedOrder: newOrder }));
    } catch (error) {
      console.error("Error selecting item:", error);
    }
  };

  // Снятие выбора элемента
  const handleDeselectItem = async (item: Item) => {
    try {
      await fetch(`${API_URL}/selected`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deselect", id: item.id }),
      });

      // Удаляем из правого окна и добавляем в левое
      setRightItems((prev) => prev.filter((i) => i.id !== item.id));
      setLeftItems((prev) => {
        // Проверяем, что элемента еще нет в списке
        if (prev.some((i) => i.id === item.id)) {
          return prev;
        }
        return [...prev, item];
      });
      setSelectedOrder((prev) => prev.filter((id) => id !== item.id));

      // Сохраняем состояние
      const newOrder = selectedOrder.filter((id) => id !== item.id);
      localStorage.setItem("itemsState", JSON.stringify({ selectedOrder: newOrder }));
    } catch (error) {
      console.error("Error deselecting item:", error);
    }
  };

  // Drag & Drop обработчики
  const handleDragStart = (item: Item, index: number) => {
    setDraggedItem(item);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetItem: Item, targetIndex: number) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.id === targetItem.id) {
      setDraggedItem(null);
      return;
    }

    // Находим индекс перетаскиваемого элемента в отображаемом списке
    const draggedIndex = rightItems.findIndex((item) => item.id === draggedItem.id);

    if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) {
      setDraggedItem(null);
      return;
    }

    // Перемещаем элемент в отображаемом списке
    const newRightItems = [...rightItems];
    const [removed] = newRightItems.splice(draggedIndex, 1);
    newRightItems.splice(targetIndex, 0, removed);
    setRightItems(newRightItems);

    // Обновляем порядок: получаем полный порядок с сервера и обновляем позиции
    try {
      const stateResponse = await fetch(`${API_URL}/state`);
      const state = await stateResponse.json();
      const fullOrder = [...state.selectedOrder];

      // Находим позиции в полном порядке
      const draggedPosInFull = fullOrder.indexOf(draggedItem.id);
      const targetPosInFull = fullOrder.indexOf(targetItem.id);

      if (draggedPosInFull !== -1 && targetPosInFull !== -1) {
        // Перемещаем элемент в полном порядке
        fullOrder.splice(draggedPosInFull, 1);
        fullOrder.splice(targetPosInFull, 0, draggedItem.id);

        setSelectedOrder(fullOrder);

        // Сохраняем на сервере
        await fetch(`${API_URL}/selected`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "reorder", order: fullOrder }),
        });

        // Сохраняем в localStorage
        localStorage.setItem("itemsState", JSON.stringify({ selectedOrder: fullOrder }));
      }
    } catch (error) {
      console.error("Error reordering items:", error);
    }

    setDraggedItem(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Список элементов</h1>

        {/* Форма добавления нового элемента */}
        <div className="mb-6 p-4 bg-white rounded-lg shadow">
          <div className="flex gap-2">
            <input
              type="number"
              value={newItemId}
              onChange={(e) => setNewItemId(e.target.value)}
              placeholder="Введите ID нового элемента"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleAddItem}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              Добавить
            </button>
          </div>
        </div>

        {/* Два окна */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Левое окно */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-xl font-semibold mb-4">Все элементы</h2>
            <div className="mb-4">
              <input
                type="text"
                value={leftFilter}
                onChange={(e) => setLeftFilter(e.target.value)}
                placeholder="Фильтр по ID"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="h-[600px] overflow-y-auto border border-gray-200 rounded">
              {leftItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 border-b border-gray-100 hover:bg-gray-50 flex justify-between items-center"
                >
                  <span className="text-gray-700">ID: {item.id}</span>
                  <button
                    onClick={() => handleSelectItem(item)}
                    className="px-4 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition"
                  >
                    Выбрать
                  </button>
                </div>
              ))}
              {leftLoading && (
                <div className="p-4 text-center text-gray-500">Загрузка...</div>
              )}
              {!leftHasMore && leftItems.length > 0 && (
                <div className="p-4 text-center text-gray-500">Все элементы загружены</div>
              )}
              <div ref={leftObserverRef} className="h-10" />
            </div>
          </div>

          {/* Правое окно */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-xl font-semibold mb-4">Выбранные элементы</h2>
            <div className="mb-4">
              <input
                type="text"
                value={rightFilter}
                onChange={(e) => setRightFilter(e.target.value)}
                placeholder="Фильтр по ID"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="h-[600px] overflow-y-auto border border-gray-200 rounded">
              {rightItems.map((item, index) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => handleDragStart(item, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, item, index)}
                  className="p-3 border-b border-gray-100 hover:bg-gray-50 flex justify-between items-center cursor-move"
                >
                  <span className="text-gray-700">ID: {item.id}</span>
                  <button
                    onClick={() => handleDeselectItem(item)}
                    className="px-4 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
                  >
                    Убрать
                  </button>
                </div>
              ))}
              {rightLoading && (
                <div className="p-4 text-center text-gray-500">Загрузка...</div>
              )}
              {!rightHasMore && rightItems.length > 0 && (
                <div className="p-4 text-center text-gray-500">Все элементы загружены</div>
              )}
              <div ref={rightObserverRef} className="h-10" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

