import { useEffect, useState } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import procedure from '../../docs/procedure.md?raw'
import { Banner } from './Banner'
import { loadRuntimeConfig, type RuntimeConfig } from './runtime-config'

export function App() {
  const [config, setConfig] = useState<RuntimeConfig | null>(null)

  useEffect(() => {
    let active = true
    loadRuntimeConfig().then((loaded) => {
      if (active) setConfig(loaded)
    })
    return () => {
      active = false
    }
  }, [])

  return (
    <>
      <Banner config={config} />
      <main className="procedure">
        <Markdown remarkPlugins={[remarkGfm]}>{procedure}</Markdown>
      </main>
    </>
  )
}
