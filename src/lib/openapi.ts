import { http } from '@/lib/http';
import type { paths } from '@/types/openapi';

type Method = keyof paths[keyof paths];

type RequestConfig<Path extends keyof paths, MethodName extends keyof paths[Path]> =
  paths[Path][MethodName] extends { parameters?: { query?: infer Q; path?: infer P }; requestBody?: { content: { 'application/json'?: infer B } } }
    ? {
        params?: Q & P;
        body?: B;
      }
    : never;

type Response<Path extends keyof paths, MethodName extends keyof paths[Path]> =
  paths[Path][MethodName] extends { responses: { 200?: { content: { 'application/json'?: infer R } } } }
    ? R
    : paths[Path][MethodName] extends { responses: { 201?: { content: { 'application/json'?: infer R } } } }
      ? R
      : unknown;

export const api = {
  async get<Path extends keyof paths, MethodName extends Method>(path: Path, method: MethodName, config?: RequestConfig<Path, MethodName>) {
    const url = buildUrl(path as string, config?.params as Record<string, string | number | undefined>);
    const response = await http.request<Response<Path, MethodName>>({
      url,
      method: method as string,
      params: config?.params,
      data: config?.body
    });
    return response.data;
  }
};

function buildUrl(path: string, params?: Record<string, string | number | undefined>) {
  if (!params) return path;
  return path.replace(/\{(.*?)\}/g, (_, key) => String(params[key] ?? ''));
}
