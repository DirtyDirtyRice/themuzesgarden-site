import { useEffect, useState } from "react";

export function useFindItDebouncedValue(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => window.clearTimeout(timeoutId);
  }, [delay, value]);

  return debouncedValue;
}

export function getCleanFindItSearchValue(value: string) {
  return value.trim();
}

export function hasUsableFindItSearchText(value: string) {
  return getCleanFindItSearchValue(value).length > 0;
}

export function isFindItWaitingForDebounce({
  debouncedSearchValue,
  searchValue,
}: {
  debouncedSearchValue: string;
  searchValue: string;
}) {
  return (
    getCleanFindItSearchValue(searchValue) !==
    getCleanFindItSearchValue(debouncedSearchValue)
  );
}