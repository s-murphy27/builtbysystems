# Tool smoke tests

Automated smoke tests for the four home-management tools (the gated `.html`
deliverables): `first-year-homeowner`, `home-operations-system`,
`home-inventory-vault`, `multi-property-edition`.

## What it checks

For each tool, `smoke.js` drives a real headless-Chrome browser to:

1. **Boot & render** — load the tool and assert the core UI renders (panels,
   tabs, default data). If `init` threw, these fail.
2. **Interact** — fire **real checkbox clicks** and read the state back out,
   proving every checklist item toggles **independently** and persists to
   `localStorage` on its own. For the inventory tool it adds items and checks
   the portfolio total computes.

This is the regression guard for the duplicate-id bug, where every checklist
item once shared the same DOM `id` so only the first row would toggle.

## Requirements

- **Node.js 18+**
- **Google Chrome** (or Chromium / Edge) installed

## Run

```bash
node tests/smoke.js
```

Override the browser path if it isn't auto-detected:

```bash
CHROME="/path/to/chrome" node tests/smoke.js
```

The script prints a PASS/FAIL line per check and exits non-zero if anything
fails, so it can be wired into CI.

## Notes

- The interaction tests load each tool in an `iframe` and read its state via
  `contentWindow`; that cross-frame access to a local file needs
  `--allow-file-access-from-files --disable-web-security`, which the script
  passes automatically (and only for the test run, in a throwaway profile).
- Tests run against the local working-copy files, so run them **before**
  committing a tool change to catch regressions.
