import { useState, useEffect, useRef, useCallback } from "react";
import { ItemInterface } from "../../common/interface";
import { itemsApi } from "../../common/services/itemsApi";
import { ITEMS_PER_PAGE_CONST } from "../../common/constants";

export const useItems = () => {
  const [_, setItemsVersion] = useState(0);
  const [filter, setFilter] = useState<string | null>(null);
  const itemsRef = useRef<ItemInterface[]>([]);
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
        const data = await itemsApi.getItems(pageNum, ITEMS_PER_PAGE_CONST, filterId);
        if (reset) {
          updateItems(() => data.items);
        } else {
          const existingIds = new Set(itemsRef.current.map((i) => i.id));
          const newItems = data.items.filter((item: ItemInterface) => !existingIds.has(item.id));
          updateItems((prev) => [...prev, ...newItems]);
        }
        totalRef.current = data.total;
        pageRef.current = pageNum;
      } catch (error) {
        console.error("Error loading items:", error);
      } finally {
        loadingRef.current = false;
      }
    },
    [updateItems]
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

  const removeItem = useCallback((itemId: number) => {
    itemsRef.current = itemsRef.current.filter((item: ItemInterface) => item.id !== itemId);
  }, []);

  const addItem = useCallback((item: ItemInterface) => {
    if (!itemsRef.current.some((_item: ItemInterface) => _item.id === item.id)) {
      itemsRef.current = [...itemsRef.current, item].sort(
        (a: ItemInterface, b: ItemInterface) => a.id - b.id
      ) as ItemInterface[];
    }
  }, []);

  const refresh = useCallback(() => {
    loadItems(1, filter || undefined, true);
  }, [filter, loadItems]);

  return {
    filter,
    setFilter,
    items: itemsRef.current,
    loading: loadingRef.current,
    total: totalRef.current,
    observerRef,
    removeItem,
    addItem,
    refresh,
  };
};
