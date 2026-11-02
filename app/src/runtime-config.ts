// Runtime facts: written into /config.json when the container starts.
// The same image serves every environment; only this file differs.
export type RuntimeConfig = { environment: string; release: string }

export const fallbackConfig: RuntimeConfig = { environment: 'unknown', release: 'untagged' }

export async function loadRuntimeConfig(): Promise<RuntimeConfig> {
  try {
    const response = await fetch('/config.json', { cache: 'no-store' })
    if (!response.ok) return fallbackConfig
    const data = (await response.json()) as Partial<RuntimeConfig>
    return {
      environment: data.environment ?? fallbackConfig.environment,
      release: data.release ?? fallbackConfig.release,
    }
  } catch {
    return fallbackConfig
  }
}
