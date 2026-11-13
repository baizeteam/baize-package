import type { CompressResult } from "./types";

type CompressFunc = (payload: Record<string, unknown>) => Promise<CompressResult>;

const funcs = new Map<string, Promise<CompressFunc>>();

function resolveFunc(mod: Record<string, unknown>): CompressFunc {
  if (typeof mod.func === "function") return mod.func as CompressFunc;

  for (const value of Object.values(mod)) {
    if (typeof value !== "function") continue;
    try {
      const plugin = (value as () => { func?: unknown })();
      if (typeof plugin?.func === "function") return plugin.func as CompressFunc;
    } catch {
      continue;
    }
  }

  throw new Error("插件模块缺少 func");
}

function loadFunc(moduleUrl: string): Promise<CompressFunc> {
  const cached = funcs.get(moduleUrl);
  if (cached) return cached;

  const pending = import(/* @vite-ignore */ moduleUrl)
    .then((mod) => resolveFunc(mod as Record<string, unknown>))
    .catch((error: unknown) => {
      funcs.delete(moduleUrl);
      throw error;
    });
  funcs.set(moduleUrl, pending);
  return pending;
}

self.addEventListener("message", async (event: MessageEvent) => {
  const data = event.data ?? {};
  if (data.type !== "compressImage") return;

  const { moduleUrl, ...payload } = data;
  try {
    if (typeof moduleUrl !== "string" || !moduleUrl) {
      throw new Error("插件缺少 moduleUrl");
    }
    const func = await loadFunc(moduleUrl);
    const result = await func(payload);
    self.postMessage(result);
  } catch (error) {
    self.postMessage({
      success: false,
      error: error instanceof Error ? error.message : "压缩失败",
    } satisfies CompressResult);
  }
});
