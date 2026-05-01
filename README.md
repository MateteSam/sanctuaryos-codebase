# SanctuaryOS Demo Codebase

This is a portable Next.js App Router prototype for **SanctuaryOS**, designed so you can:

- open the folder in **VS Code**
- run `npm install`
- run `npm run dev`
- keep building in VS Code, Cursor, Windsurf, Replit, StackBlitz, or other coding spaces

## Included routes

- `/` — overview / pitch-style demo
- `/live` — live worship controls
- `/mapping` — room scanning and mapping concept
- `/cloud` — multi-room and campus sync concept
- `/rooms` — room profile management
- `/settings` — platform settings

## Included images

These are already copied into `public/demo/`:

- `church-control-collage.png`
- `church-workflow-board.png`
- `file-copy-guide.png`

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`

## Open in VS Code

```bash
code .
```

## Suggested next improvements

- replace placeholder atmosphere panels with real rendered room images
- add auth if you want private dashboard access
- add a database later for rooms, sets, and campuses
- add upload support for custom church mockup images
- split the overview into a fuller landing page if needed
