import { useEffect, useState } from "react";

export function unwrapPaginatedResponse(payload) {
  if (Array.isArray(payload)) {
    return {
      data: payload,
      pagination: null,
    };
  }

  if (payload && Array.isArray(payload.data)) {
    return {
      data: payload.data,
      pagination: payload.pagination || null,
    };
  }

  return {
    data: [],
    pagination: payload?.pagination || null,
  };
}

export function useDebouncedValue(value, delay = 350) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => window.clearTimeout(timeoutId);
  }, [value, delay]);

  return debouncedValue;
}
