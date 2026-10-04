# BrandedQR

A Chrome extension that generates QR codes with your logo sitting in the middle of them, from **Chrome's side panel** — so it stays open beside the page you're working on instead of vanishing the moment you click away.

**Published on the Chrome Web Store.**

---

## Why the side panel

Most QR generators are popup extensions, and popups have a fatal flaw for this job: they close as soon as you interact with the page behind them. Generating a QR code for a URL usually means looking at that URL, which means clicking the page, which means the popup is gone and your logo upload with it.

So this uses Chrome's `sidePanel` API instead:

```json
"permissions": ["sidePanel", "activeTab", "storage"],
"side_panel": { "default_path": "sidebar.html" }
```

The panel docks beside the page and stays put. Your uploaded logo persists in `chrome.storage` across sessions (`saveLogoToStorage` / `loadLogoFromStorage`), so you set your branding once and it's there every time.

## What it does

- **Logo in the middle of the QR code.** Upload once, it's remembered. `generateBrandedQR` composites the logo over the rendered code on a canvas.
- **Detects what you pasted.** `detectAndFormatInput` works out whether you've given it a URL, an email, a phone number, or plain text, and formats the payload accordingly — so an email becomes a `mailto:` and a phone becomes a `tel:` without you picking from a dropdown.
- **Animated generation.** `startAnimatedQRGeneration` builds a placeholder grid and morphs it into the finished code. Pure decoration, but it makes a sub-second operation feel deliberate.
- **Download the result** as an image.

Error correction matters more than it sounds here: putting a logo over the centre of a QR code destroys part of the payload. QR codes survive that because of built-in Reed–Solomon error correction — which is also why there's a practical limit to how large a logo you can overlay before the code stops scanning.

## Install

From the Chrome Web Store, or from source:

```bash
git clone https://github.com/priyajnvian/brandedqr.git
```

- Open `chrome://extensions/`
- Turn on **Developer mode**
- **Load unpacked** → select the cloned folder
- Click the icon to open the side panel

No build step, no dependencies to install — `qrious.min.js` is vendored.

## Known limitations

- **No logo size guard.** Nothing stops you overlaying a logo big enough to break scannability. The extension should cap the overlay relative to the chosen error-correction level, and ideally verify the result still decodes.
- **Error correction level isn't exposed.** Users can't raise it to compensate for a larger logo.
- **Only raster download.** QR codes are vector by nature and SVG export would be strictly better for print, which is exactly where branded QR codes get used.
- **No tests.** Input detection in `detectAndFormatInput` is pure, well-bounded logic — the easiest thing in this repo to test, and it isn't tested.

## License

**GPL-3.0** — see [LICENSE](LICENSE).

This is not the usual MIT default, and the reason is worth stating plainly: this extension bundles **[QRious](https://github.com/neocotic/qrious) v4.0.2**, which is licensed **GPL v3** (itself derived from `jsqrencode`, also GPL). GPL is copyleft, so a work that bundles and links it must be distributed under GPL v3 as well. Releasing this under MIT while shipping QRious inside it would be a licence violation, so the whole extension is GPL-3.0.

If an MIT licence ever matters for this project, the fix is to swap QRious for an MIT-licensed QR encoder such as [`qrcode`](https://github.com/soldair/node-qrcode) or [`qr-code-styling`](https://github.com/kozakdenys/qr-code-styling).

## Credits

- **[QRious](https://github.com/neocotic/qrious)** v4.0.2 — Alasdair Mercer, GPL v3, based on `jsqrencode` © 2010 tz@execpc.com
