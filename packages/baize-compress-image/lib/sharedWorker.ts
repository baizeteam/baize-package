import type { CompressResult } from "./types";

interface CompressModule {
  compress: (payload: Record<string, unknown>) => Promise<CompressResult>;
}

const modules = new Map<string, Promise<CompressModule>>();

function loadModule(moduleUrl: string): Promise<CompressModule> {
  const cached = modules.get(moduleUrl);
  if (cached) return cached;

  const pending = import(/* @vite-ignore */ moduleUrl)
    .then((mod: CompressModule) => {
      if (typeof mod.compress !== "function") {
        throw new Error("插件模块缺少 compress");
      }
      return mod;
    })
    .catch((error: unknown) => {
      modules.delete(moduleUrl);
      throw error;
    });
  modules.set(moduleUrl, pending);
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
    const mod = await loadModule(moduleUrl);
    const result = await mod.compress(payload);
    self.postMessage(result);
  } catch (error) {
    self.postMessage({
      success: false,
      error: error instanceof Error ? error.message : "压缩失败",
    } satisfies CompressResult);
  }
});
