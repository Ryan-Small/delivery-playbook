import type { RuntimeConfig } from './runtime-config'

type Props = { config: RuntimeConfig | null }

export function Banner({ config }: Props) {
  const { commit, builtAt } = __BUILD_INFO__
  const environment = config?.environment ?? 'loading'
  const release = config?.release ?? 'loading'
  return (
    <header className={`banner banner-${environment}`}>
      <dl className="facts">
        <div>
          <dt>Environment</dt>
          <dd>{environment}</dd>
        </div>
        <div>
          <dt>Release</dt>
          <dd>{release}</dd>
        </div>
        <div>
          <dt>Commit</dt>
          <dd>
            <code>{commit.slice(0, 7)}</code>
          </dd>
        </div>
        <div>
          <dt>Built</dt>
          <dd>
            <time dateTime={builtAt}>{builtAt}</time>
          </dd>
        </div>
      </dl>
      <p className="banner-note">
        Environment and release are read when the container starts. Commit and build time are fixed
        when the image is built. One image, promoted unchanged.
      </p>
    </header>
  )
}
