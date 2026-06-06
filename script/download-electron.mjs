// Downloads the Electron binary up front so electron-mocha doesn't trigger
// Electron's lazy download at test time — which races between electron-mocha's
// parent and renderer processes and leaves `path.txt` unwritten (the CI failure).
//
// Electron 42 removed the `postinstall` script that used to fetch the binary at
// install time (supply-chain hardening — see the v42.0.0 release notes), so the
// binary is now downloaded lazily on first `require`/launch. Electron's own
// `install-electron` (electron/install.js) fires that download off WITHOUT
// awaiting it, so in CI the process can exit before it finishes and `path.txt`
// is never written. This script runs the same fetch but awaits it, so the
// process cannot exit early, and any failure throws loudly instead of silently.
import { createRequire } from 'node:module'
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { platform } from 'node:os'

// Resolve Electron and its deps from this project's node_modules.
const require = createRequire(import.meta.url)
const electronPkgPath = require.resolve('electron/package.json')
const electronDir = dirname(electronPkgPath)
const electronRequire = createRequire(electronPkgPath)
const { downloadArtifact } = electronRequire('@electron/get')
const extract = electronRequire('extract-zip')
const { version } = require('electron/package.json')

const platformPath = {
  darwin: 'Electron.app/Contents/MacOS/Electron',
  mas: 'Electron.app/Contents/MacOS/Electron',
  linux: 'electron',
  freebsd: 'electron',
  openbsd: 'electron',
  win32: 'electron.exe'
}[platform()]
if (!platformPath) {
  throw new Error(`Electron builds are not available on platform: ${platform()}`)
}

const zipPath = await downloadArtifact({
  version,
  artifactName: 'electron',
  checksums: electronRequire('./checksums.json')
})
await extract(zipPath, { dir: join(electronDir, 'dist') })
writeFileSync(join(electronDir, 'path.txt'), platformPath)
console.log(`Electron ${version} ready: ${join(electronDir, 'dist', platformPath)}`)
