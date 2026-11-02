import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { App } from './App'

function serveConfig(body: unknown, ok = true) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok, json: async () => body })),
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('status page', () => {
  it('shows the environment and release read at container start', async () => {
    serveConfig({ environment: 'staging', release: 'v1.1.0-rc1' })
    render(<App />)
    const banner = within(screen.getByRole('banner'))
    expect(await banner.findByText('staging')).toBeInTheDocument()
    expect(banner.getByText('v1.1.0-rc1')).toBeInTheDocument()
  })

  it('falls back to unknown when no runtime config is served', async () => {
    serveConfig({}, false)
    render(<App />)
    const banner = within(screen.getByRole('banner'))
    expect(await banner.findByText('unknown')).toBeInTheDocument()
    expect(banner.getByText('untagged')).toBeInTheDocument()
  })

  it('shows the commit fixed at build time', () => {
    serveConfig({ environment: 'dev', release: 'main' })
    render(<App />)
    const banner = within(screen.getByRole('banner'))
    expect(banner.getByText(__BUILD_INFO__.commit.slice(0, 7))).toBeInTheDocument()
  })

  it('renders the procedure from the docs folder', () => {
    serveConfig({ environment: 'dev', release: 'main' })
    render(<App />)
    expect(
      screen.getByRole('heading', { level: 1, name: /third-party component/i }),
    ).toBeInTheDocument()
  })
})
