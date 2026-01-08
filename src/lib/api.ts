export const unwrapApiList = <T,>(data: unknown): T[] => {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object') {
    const maybe = data as { content?: unknown; items?: unknown };
    if (Array.isArray(maybe.content)) return maybe.content as T[];
    if (Array.isArray(maybe.items)) return maybe.items as T[];
  }
  return [];
};

