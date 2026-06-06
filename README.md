# Inkdrop keymap

[![CI](https://github.com/inkdropapp/inkdrop-keymap/actions/workflows/ci.yml/badge.svg)](https://github.com/inkdropapp/inkdrop-keymap/actions/workflows/ci.yml)

Inkdrop's DOM-aware keymap module.

This is a pure-ESM module (`"type": "module"`).

```js
import KeymapManager from 'inkdrop-keymap'

const keymaps = new KeymapManager({})
keymaps.defaultTarget = document.body

// Pass all the window's keydown events to the KeymapManager
document.addEventListener('keydown', event => {
  keymaps.handleKeyboardEvent(event)
})

// Add some keymaps
keymaps.loadKeymap('/path/to/keymap-file.json') // can also be a directory of json / cson files
// OR
keymaps.add('/key/for/these/keymaps', {
  body: {
    up: 'core:move-up',
    down: 'core:move-down'
  }
})

// When a keybinding is triggered, it will dispatch it on the node that was focused
window.addEventListener('core:move-up', event => console.log('up', event))
window.addEventListener('core:move-down', event => console.log('down', event))
```

## Development

Requires [pnpm](https://pnpm.io) and Node.js 24+. The tests _must_ run in Electron (via [`electron-mocha`](https://github.com/jprichardson/electron-mocha)) because they depend on browser APIs such as the DOM and `KeyboardEvent`.

```sh
pnpm install      # install dependencies
pnpm test         # run the test suite (batch mode)
pnpm run test-drive  # keep the Electron window open to re-run / debug tests
pnpm run lint     # lint with oxlint
pnpm run format   # format with oxfmt
```

The native keyboard-layout dependency ([`inkdrop-keyboard-layout`](https://github.com/inkdropapp/keyboard-layout)) ships prebuilt N-API binaries, so no native compilation or `electron-rebuild` step is required. Electron downloads its runtime binary automatically on first use.
