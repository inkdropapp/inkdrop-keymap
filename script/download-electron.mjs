// Pre-downloads the Electron binary so electron-mocha doesn't trigger Electron's
// lazy download at test time — which races between electron-mocha's parent and
// renderer processes and leaves `path.txt` unwritten (the CI failure).
//
// Electron 42 removed the `postinstall` that used to fetch the binary at install
// time (supply-chain hardening, see the v42.0.0 release notes); it now downloads
// lazily on first require/launch via @electron/get. Two things misbehave in CI
// (and on Node 24), which `electron/install.js` doesn't guard against:
//   1. The async download lets Node's event loop empty, so the process exits
//      before it finishes — fixed here with a ref'd keep-alive timer.
//   2. `extract-zip`'s promise never settles (it hangs / Node bails with an
//      "unsettled top-level await") — so we extract with the OS unzip/tar via a
//      synchronous child process instead.
import { createRequire } from 'node:module'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { platform } from 'node:os'
import { execFileSync } from 'node:child_process'

const require = createRequire(import.meta.url)
const electronPkgPath = require.resolve('electron/package.json')
const electronDir = dirname(electronPkgPath)
const electronRequire = createRequire(electronPkgPath)
const { downloadArtifact } = electronRequire('@electron/get')
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

const distDir = join(electronDir, 'dist')

// Hold the event loop open until the async download resolves.
const keepAlive = setInterval(() => {}, 1 << 30)
try {
  const zipPath = await downloadArtifact({
    version,
    artifactName: 'electron',
    checksums: electronRequire('./checksums.json')
  })
  mkdirSync(distDir, { recursive: true })
  // Synchronous extraction — avoids extract-zip's never-settling promise.
  if (platform() === 'win32') {
    execFileSync('tar', ['-xf', zipPath, '-C', distDir], { stdio: 'inherit' })
  } else {
    execFileSync('unzip', ['-oq', zipPath, '-d', distDir], { stdio: 'inherit' })
  }
  writeFileSync(join(electronDir, 'path.txt'), platformPath)
  console.log(`Electron ${version} ready: ${join(distDir, platformPath)}`)
} finally {
  clearInterval(keepAlive)
}
