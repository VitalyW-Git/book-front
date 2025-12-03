import { useState, useEffect, useRef, useCallback } from "react";
import { ItemInterface } from "../../common/interface";
import { itemsApi } from "../../common/services/itemsApi";
import { ITEMS_PER_PAGE, FILTER_DEBOUNCE_MS } from "../../common/constants/api";

export const useItems = () => {
  const [items, setItems] = useState<ItemInterface[]>([]);
  const [filter, setFilter] = useState<string|null>(null);
  const observerRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef<boolean>(false);
  const filterRef = useRef<string|null>(filter);
  const pageRef = useRef<number>(1);
  const totalRef = useRef<number>(0);
  const isFirstMountRef = useRef<boolean>(true);

  const loadItems = useCallback(
    async (pageNum: number, filterId?: string, reset: boolean = false) => {
      if (loadingRef.current) return;
      loadingRef.current = true;

      try {
        const data = await itemsApi.getItems(pageNum, ITEMS_PER_PAGE, filterId);
        if (reset) {
          setItems(data.items);
        } else {
          setItems((prev) => {
            const existingIds = new Set(prev.map((i) => i.id));
            const newItems = data.items.filter((item) => !existingIds.has(item.id));
            return [...prev, ...newItems];
          });
        }
        totalRef.current = data.total;
        pageRef.current = pageNum;
      } catch (error) {
        console.error("Error loading items:", error);
      } finally {
        loadingRef.current = false;
      }
    },
    []
  );

  useEffect(() => {
    loadItems(1);
  }, []);

  useEffect(() => {
    filterRef.current = filter;
  }, [filter]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && items.length < totalRef.current && !loadingRef.current && !isFirstMountRef.current) {
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
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      return;
    }
    const timer = setTimeout(() => {
      loadItems(1, filterRef.current || undefined, true);
    }, FILTER_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [filter, loadItems]);

  const removeItem = useCallback((itemId: number) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  }, []);

  const addItem = useCallback((item: ItemInterface) => {
    setItems((prev) => {
      if (prev.some((i) => i.id === item.id)) {
        return prev;
      }
      return [...prev, item];
    });
  }, []);

  const refresh = useCallback(() => {
    loadItems(1, filter || undefined, true);
  }, [filter, loadItems]);

  return {
    items,
    filter,
    setFilter,
    loading: loadingRef.current,
    total: totalRef.current,
    observerRef,
    removeItem,
    addItem,
    refresh,
  };
};

