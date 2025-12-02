import { useState, useEffect, useRef, useCallback } from "react";
import { ItemInterface } from "../../common/interface";
import { itemsApi } from "../../common/services/itemsApi";
import { localStorageService } from "../../common/utils/localStorage";
import { ITEMS_PER_PAGE, FILTER_DEBOUNCE_MS } from "../../common/constants/api";

export const useSelectedItems = () => {
  const [items, setItems] = useState<ItemInterface[]>([]);
  const [page, setPage] = useState<number>(1);
  const [filter, setFilter] = useState<string>("");
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedOrder, setSelectedOrder] = useState<number[]>([]);
  const [draggedItem, setDraggedItem] = useState<ItemInterface | null>(null);
  const observerRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const filterRef = useRef(filter);
  const pageRef = useRef(page);
  const hasMoreRef = useRef(hasMore);

  const loadItems = useCallback(
    async (pageNum: number, filterId?: string, reset = false) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      setLoading(true);

      try {
        const data = await itemsApi.getSelectedItems(pageNum, ITEMS_PER_PAGE, filterId);
        if (reset) {
          setItems(data.items);
          setSelectedOrder(data.order);
        } else {
          setItems((prev) => {
            const existingIds = new Set(prev.map((i) => i.id));
            const newItems = data.items.filter((item) => !existingIds.has(item.id));
            return [...prev, ...newItems];
          });
        }
        setHasMore(data.hasMore);
        hasMoreRef.current = data.hasMore;
        setPage(pageNum);
        pageRef.current = pageNum;
      } catch (error) {
        console.error("Error loading selected items:", error);
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const savedState = localStorageService.getState();
    if (savedState) {
      setSelectedOrder(savedState.selectedOrder);
      itemsApi.reorderItems(savedState.selectedOrder).catch(console.error);
    }
    loadItems(1);
  }, [loadItems]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadItems(1, filterRef.current || undefined, true);
    }, FILTER_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [filter, loadItems]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreRef.current && !loadingRef.current) {
          loadItems(pageRef.current + 1, filterRef.current || undefined);
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [loadItems]);

  const addItem = useCallback((item: ItemInterface) => {
    setItems((prev) => {
      if (prev.some((i) => i.id === item.id)) {
        return prev;
      }
      return [...prev, item];
    });
    setSelectedOrder((prev) => {
      if (prev.includes(item.id)) {
        return prev;
      }
      const newOrder = [...prev, item.id];
      localStorageService.saveState({ selectedOrder: newOrder });
      return newOrder;
    });
  }, []);

  const removeItem = useCallback((itemId: number) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    setSelectedOrder((prev) => {
      const newOrder = prev.filter((id) => id !== itemId);
      localStorageService.saveState({ selectedOrder: newOrder });
      return newOrder;
    });
  }, []);

  const reorderItems = useCallback(
    async (draggedItemId: number, targetItemId: number, draggedIndex: number, targetIndex: number) => {
      const newItems = [...items];
      const [removed] = newItems.splice(draggedIndex, 1);
      newItems.splice(targetIndex, 0, removed);
      setItems(newItems);

      try {
        const state = await itemsApi.fetchBooks();
        const fullOrder = [...state.selectedOrder];

        const draggedPosInFull = fullOrder.indexOf(draggedItemId);
        const targetPosInFull = fullOrder.indexOf(targetItemId);

        if (draggedPosInFull !== -1 && targetPosInFull !== -1) {
          fullOrder.splice(draggedPosInFull, 1);
          fullOrder.splice(targetPosInFull, 0, draggedItemId);

          setSelectedOrder(fullOrder);
          await itemsApi.reorderItems(fullOrder);
          localStorageService.saveState({ selectedOrder: fullOrder });
        }
      } catch (error) {
        console.error("Error reordering items:", error);
      }
    },
    [items]
  );

  return {
    items,
    filter,
    setFilter,
    loading,
    hasMore,
    observerRef,
    selectedOrder,
    draggedItem,
    setDraggedItem,
    addItem,
    removeItem,
    reorderItems,
  };
};

