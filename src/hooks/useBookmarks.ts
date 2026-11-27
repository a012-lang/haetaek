import { useCallback, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'youth_benefit_bookmarks_v1';
const BOOKMARKS_EVENT = 'youth-bookmarks-updated';
const EMPTY_ARRAY: string[] = [];

let cachedRaw: string | null = null;
let cachedParsed: string[] = EMPTY_ARRAY;

function readBookmarksFromStorage(): string[] {
  if (typeof window === 'undefined') {
    return EMPTY_ARRAY;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw) {
      return cachedParsed;
    }
    cachedRaw = raw;
    if (!raw) {
      cachedParsed = EMPTY_ARRAY;
      return cachedParsed;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      cachedParsed = parsed.filter((id): id is string => typeof id === 'string');
    } else {
      cachedParsed = EMPTY_ARRAY;
    }
    return cachedParsed;
  } catch {
    cachedParsed = EMPTY_ARRAY;
    return cachedParsed;
  }
}

function writeBookmarksToStorage(ids: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    const unique = Array.from(new Set(ids));
    const raw = JSON.stringify(unique);
    window.localStorage.setItem(STORAGE_KEY, raw);
    cachedRaw = raw;
    cachedParsed = unique;
    window.dispatchEvent(new CustomEvent(BOOKMARKS_EVENT));
  } catch {
    // Ignore storage quota errors cleanly
  }
}

function subscribe(callback: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === STORAGE_KEY) {
      callback();
    }
  };

  const handleLocalChange = () => {
    callback();
  };

  window.addEventListener('storage', handleStorage);
  window.addEventListener(BOOKMARKS_EVENT, handleLocalChange);

  return () => {
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener(BOOKMARKS_EVENT, handleLocalChange);
  };
}

function getSnapshot(): string[] {
  return readBookmarksFromStorage();
}

function getServerSnapshot(): string[] {
  return EMPTY_ARRAY;
}

export function useBookmarks() {
  const bookmarkedIds = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  const isBookmarked = useCallback(
    (policyId: string) => bookmarkedIds.includes(policyId),
    [bookmarkedIds]
  );

  const toggleBookmark = useCallback((policyId: string) => {
    const current = readBookmarksFromStorage();
    if (current.includes(policyId)) {
      writeBookmarksToStorage(current.filter((id) => id !== policyId));
    } else {
      writeBookmarksToStorage([policyId, ...current]);
    }
  }, []);

  const removeBookmark = useCallback((policyId: string) => {
    const current = readBookmarksFromStorage();
    writeBookmarksToStorage(current.filter((id) => id !== policyId));
  }, []);

  const clearBookmarks = useCallback(() => {
    writeBookmarksToStorage([]);
  }, []);

  return {
    bookmarkedIds,
    isBookmarked,
    toggleBookmark,
    removeBookmark,
    clearBookmarks,
  };
}
