# All the Ferries: shareable URLs

## Why

A shared link to alltheferries.com lands on the intro box. Someone standing at Colman Dock can't text "look at this" and have the recipient see Bainbridge. Fixing that is the whole point: give a selected dock or ferry a URL, and read that URL on load.

This replaces an earlier, larger spec (static per-dock pages, sitemap, generator script). That was an SEO experiment; it's shelved until there's evidence anyone searches for this. Share links are the part that helps regardless.

## Ground rules

- No new dependencies, no build changes. Vue 2.6 from CDN, ArcGIS 4.17 via AMD, jQuery JSONP all stay.
- Single root Vue instance in `index.js`, no components, no router.
- Verify in a browser, not just by reading code.

## URL scheme

- `/?dock=BBI` where the value is WSDOT `TerminalAbbrev`
- `/?ferry=tacoma` where the value is `VesselName` lowercased
- `/` means nothing selected

Query params, not paths, so no host rewrite rules.

## Changes to `index.js`

**Extract selection.** The `view.on("click")` handler has three inline branches after `hitTest`. Move them, unchanged, into `selectVessel(graphic)`, `selectTerminal(graphic)`, and `clearSelection()`. The click handler dispatches to them. Also call `clearSelection()` when `hitTest` returns zero results, so clicking open water dismisses the panel (today it does nothing).

**Write the URL.** Add:

```js
setUrl(kind, value) {
  history.replaceState(null, '', kind ? `/?${kind}=${encodeURIComponent(value)}` : '/');
}
```

Call at the end of each select method and in `clearSelection()`. `replaceState`, not `pushState`: it changes the address bar without adding history entries, so the back button still leaves the site and there is no `popstate` handling. People share by copying the address bar; this is what makes that work.

**Titles.** In the same three places set `document.title` to `MV {VesselName} | All the Ferries`, `{TerminalName} Ferry Terminal | All the Ferries`, or the original title (captured once on mount). Plausible reports by path, so `?dock=` and `?ferry=` show up in its pages report for free.

**Read the URL.** Add `applyUrlState()`: parse `location.search`, find the graphic by `TerminalAbbrev` in `terminalsGraphicsLayer.graphics.items` or by lowercased `VesselName` in `ferriesGraphicsLayer.graphics.items`, call the matching select method, hide the intro box, `view.goTo({ target: graphic, zoom: 12 })`. Unknown or missing values do nothing.

Timing: both graphics layers are empty until the JSONP callbacks in `getFerries(false)` and `getTerminals()` return. Keep a counter (`initialLoadsRemaining: 2`), decrement at the end of each callback, and call `applyUrlState()` when it hits zero. Not from `mounted()`.

**Refresh loop.** `getFerries(true)` already re-finds the selected vessel by name every 8 s, so a `?ferry=` link keeps tracking the boat. Confirm this survives the refactor.

## Changes to `index.html`

Lengthen `og:description` and `twitter:description` past 100 characters; LinkedIn's Post Inspector warns below that. Nothing else.

## Verification

1. Load `/?dock=BBI`: Bainbridge panel shows, map zoomed there, tab title updated.
2. Load `/?ferry=tacoma`: Tacoma panel shows; wait 10 s, still tracking.
3. Load `/`, click a dock: address bar reads `/?dock=XXX`. Click a ferry: `/?ferry=name`. Click open water: panel clears, address bar reads `/`.
4. Browser back from any of the above leaves the site (no in-app history).
5. Load `/?dock=NOPE`: normal load, no console errors.
6. Run the deployed URL through LinkedIn Post Inspector: card renders, no description warning.

## Not doing

- Static per-dock or per-ferry pages, sitemap, robots, generator script
- `pushState` / `popstate` / back-button navigation between selections
- Any framework or toolchain change
