import { useState, useEffect, useRef, useCallback } from "react";
import { ItemInterface } from "../../common/interface";
import { itemsApi } from "../../common/services/itemsApi";
import { ITEMS_PER_PAGE, FILTER_DEBOUNCE_MS } from "../../common/constants/api";

export const useItems = () => {
  const [items, setItems] = useState<ItemInterface[]>([]);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const observerRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const filterRef = useRef(filter);
  const pageRef = useRef(page);
  const hasMoreRef = useRef(hasMore);

  const loadItems = useCallback(
    async (pageNum: number, filterId?: string, reset: boolean = false) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      setLoading(true);

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
        console.log(data.hasMore)
        setHasMore(data.hasMore);
        hasMoreRef.current = data.hasMore;
        setPage(pageNum);
        pageRef.current = pageNum;
      } catch (error) {
        console.error("Error loading items:", error);
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
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
    loading,
    hasMore,
    observerRef,
    removeItem,
    addItem,
    refresh,
  };
};

