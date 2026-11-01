import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

const STORAGE_KEY = 'hg_compare';
export const COMPARE_MAX = 3;

const CompareContext = createContext(null);

const pickRoom = (room) => ({
  _id: room._id,
  slug: room.slug,
  title: room.title,
  image: room.images?.[0] || room.image || '',
  pricePerNight: room.pricePerNight,
  city: room.city,
});

const readStorage = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter((item) => item && item._id).slice(0, COMPARE_MAX) : [];
  } catch {
    return [];
  }
};

export function CompareProvider({ children }) {
  const [items, setItems] = useState(readStorage);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      return;
    }
  }, [items]);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === STORAGE_KEY) setItems(readStorage());
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const isCompared = useCallback((roomId) => items.some((item) => item._id === roomId), [items]);

  const toggle = useCallback(
    (room) => {
      if (items.some((item) => item._id === room._id)) {
        setItems((prev) => prev.filter((item) => item._id !== room._id));
        return;
      }
      if (items.length >= COMPARE_MAX) {
        toast.error(`Chỉ so sánh tối đa ${COMPARE_MAX} phòng`);
        return;
      }
      setItems((prev) => [...prev, pickRoom(room)]);
    },
    [items]
  );

  const remove = useCallback((roomId) => setItems((prev) => prev.filter((item) => item._id !== roomId)), []);
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(() => ({ items, isCompared, toggle, remove, clear }), [items, isCompared, toggle, remove, clear]);

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export const useCompare = () => {
  const context = useContext(CompareContext);
  if (!context) throw new Error('useCompare phải dùng trong CompareProvider');
  return context;
};
