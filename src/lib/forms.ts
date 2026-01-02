export const buildFormBody = (values: Record<string, string | number | boolean | undefined | null>) => {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    params.append(key, String(value));
  });
  return params;
};