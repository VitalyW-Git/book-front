import { useState, useEffect, useRef, useCallback } from "react";
import { ItemInterface } from "../../common/interface";
import { itemsApi } from "../../common/services/itemsApi";
import { localStorageService } from "../../common/utils/localStorage";
import { ITEMS_PER_PAGE } from "../../common/constants/api";

export const useSelectedItems = () => {
  const [, setItemsVersion] = useState(0);
  const itemsRef = useRef<ItemInterface[]>([]);
  const [filter, setFilter] = useState<string | null>(null);
  const [, setSelectedOrder] = useState<number[]>([]);
  const [draggedItem, setDraggedItem] = useState<ItemInterface | null>(null);
  const observerRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef<boolean>(false);
  const filterRef = useRef<string | null>(filter);
  const pageRef = useRef<number>(1);
  const totalRef = useRef<number>(0);

  const updateItems = useCallback((updater: (prev: ItemInterface[]) => ItemInterface[]) => {
    itemsRef.current = updater(itemsRef.current);
    setItemsVersion((v) => v + 1);
  }, []);

  const loadItems = useCallback(
    async (pageNum: number, filterId?: string, reset: boolean = false) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      try {
        const data = await itemsApi.getSelectedItems(pageNum, ITEMS_PER_PAGE, filterId);
        if (reset) {
          updateItems(() => data.items);
          setSelectedOrder(data.order);
        } else {
          const existingIds = new Set(itemsRef.current.map((i) => i.id));
          const newItems = data.items.filter((item: ItemInterface) => !existingIds.has(item.id));
          updateItems((prev) => [...prev, ...newItems]);
        }

        totalRef.current = data.total;
        pageRef.current = pageNum;
      } catch (error) {
        console.error("Error loading selected items:", error);
      } finally {
        loadingRef.current = false;
      }
    },
    [updateItems]
  );

  useEffect(() => {
    const savedState = localStorageService.getState();
    if (savedState) {
      setSelectedOrder(savedState.selectedOrder);
      itemsApi.reorderItems(savedState.selectedOrder).catch(console.error);
    }
    loadItems(1);
  }, []);

  useEffect(() => {
    filterRef.current = filter;
  }, [filter]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          !!itemsRef.current.length &&
          itemsRef.current.length < totalRef.current &&
          !loadingRef.current
        ) {
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

  useEffect(() => {
    if (!itemsRef.current?.length) {
      return;
    }
    loadItems(1, filterRef.current || undefined, true);
  }, [filter, loadItems]);

  const addItem = useCallback(
    (item: ItemInterface) => {
      updateItems((prev: ItemInterface[]) => {
        if (prev.some((_item: ItemInterface) => _item.id === item.id)) {
          return prev;
        }
        return [...prev, item];
      });
      setSelectedOrder((prev: number[]) => {
        if (prev.includes(item.id)) {
          return prev;
        }
        const newOrder: number[] = [...prev, item.id];
        localStorageService.saveState({ selectedOrder: newOrder });
        return newOrder;
      });
    },
    [updateItems]
  );

  const removeItem = useCallback(
    (itemId: number) => {
      updateItems((prev: ItemInterface[]) => prev.filter((i) => i.id !== itemId));
      setSelectedOrder((prev: number[]) => {
        const newOrder: number[] = prev.filter((id: number) => id !== itemId);
        localStorageService.saveState({ selectedOrder: newOrder });
        return newOrder;
      });
    },
    [updateItems]
  );

  const reorderItems = useCallback(
    async (draggedIndex: number, targetIndex: number) => {
      const newItems = [...itemsRef.current];
      const [removed] = newItems.splice(draggedIndex, 1);
      newItems.splice(targetIndex, 0, removed);
      updateItems(() => newItems);

      try {
        const newOrder: number[] = newItems.map((item: ItemInterface) => item.id);
        setSelectedOrder(newOrder);
        await itemsApi.reorderItems(newOrder);
        localStorageService.saveState({ selectedOrder: newOrder });
      } catch (error) {
        console.error("Error reordering items:", error);
      }
    },
    [updateItems]
  );

  return {
    items: itemsRef.current,
    filter,
    setFilter,
    loading: loadingRef.current,
    total: totalRef.current,
    observerRef,
    draggedItem,
    setDraggedItem,
    addItem,
    removeItem,
    reorderItems,
  };
};
