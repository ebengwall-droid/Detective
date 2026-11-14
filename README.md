# Greyhaven: The Lamplighter

A 3D detective mystery where every character is played live by Claude.

![A crime scene: the study at 9 Gull Street](docs/crime-scene.jpg)

Someone in a rain-soaked harbour town is drowning old men in their own
armchairs and leaving a lit storm lantern in the window. You are the new
detective. Walk the crime scenes, bag evidence, hear the autopsy, search
police records on your laptop, question people in your own words, catch them
lying, and name the killer before the fourth lantern is lit.

There are three murders, eight locations, nine people to question, four acts
and a twist. It is a few hours long.

## What the AI does

- **Every conversation is improvised.** Type anything. Each character has a
  personality, things they know, things they are hiding and conditions under
  which they crack. They remember what you said and what you showed them.
- **The killer writes to you.** Three unstamped letters turn up on your desk.
  Each is written at the moment you open it, about what you actually did and
  what you missed.
- **The laptop understands questions.** HARBORNET, the police records
  terminal, answers plain language: a name, a number plate, "who signed out
  the pool car on the tenth".
- **The ending is a negotiation.** The last scene is a conversation with the
  killer, with a life depending on it. What you learned decides what you can
  say that lands.
- **The epilogue is yours.** It is written from how your case went.

The story itself is fixed and fair: the same person did it every time, the
clues are always there, and Claude cannot hand out a clue you have not
earned. The rules of the case are code; the voices are Claude.

The game uses Claude Opus (`claude-opus-5-5`).

![Questioning your partner](docs/conversation.jpg)

## Play

```bash
npm install
export ANTHROPIC_API_KEY=sk-ant-...   # your key from console.anthropic.com
npm start
```

Open <http://localhost:3000>.

Without a key the game still runs from start to finish in **scripted mode**:
characters answer the suggested questions from their script and give a stock
reply to anything else. It is a good way to check everything works. It is not
the game.

## On a phone

The phone is the main way to play. Everything is within reach of a thumb, and
nothing needs careful steering.

![A crime scene, the Look list and a conversation on a phone](docs/phone.jpg)

- **Tap to go.** Tap the floor, a glowing marker or a person and you walk
  there. Drag to look around. The ring at the bottom left steers by thumb if
  you would rather.
- **Look** lists everyone and everything in the room. Tap a name and you walk
  straight to it. With Look and the Map you can play the whole case without
  steering at all.
- **Tools sit in a dock along the bottom**: Look, Think, Notes, Laptop, Map.
  Panels open as sheets from the bottom and close from the bottom.
- **Suggested questions** are one tap. Type or dictate your own whenever you
  like.
- The phone's **Back** button or swipe closes whatever is open instead of
  leaving the game.
- Works upright or on its side. The screen stays awake while you read.
- If movement feels choppy, **Menu, Graphics, Low** turns off shadows and the
  finishing effects (ambient occlusion, bloom, depth of field, frosted
  glass). The game also steps down by itself when it sees the frame rate
  struggling.
- Getting to the first room is about a 7 MB download on a phone, so it takes
  a few seconds on a mobile connection; each new place after that is around
  a megabyte.

### Install it as an app

Served over HTTPS, the game is an installable web app: it gets its own icon,
opens full screen and starts without a signal.

- **iPhone or iPad:** open it in Safari, tap Share, then *Add to Home Screen*.
- **Android:** open it in Chrome, then *Install app* (or Menu, *Put it on your
  home screen*, in the game).

To get an address a phone can install from, run the server somewhere public,
or host the `dist/app` folder from `npm run build` (below) on any static host.

### Controls

| | Phone or tablet | Keyboard and mouse |
|---|---|---|
| Walk | Tap where you want to go, or steer with the ring | Click where you want to go, or `W A S D` |
| Turn | Drag | Drag, or press `F` for mouse-look |
| Examine or talk | Tap the glowing marker | Click it, or look at it and press `E` |
| Everything in the room | **Look** | `Q` |
| Catch a lie | In a conversation, **Show** puts evidence in front of them | The same |
| Notebook, laptop, map | Dock along the bottom | `N`, `L`, `M` |
| Hint | **Think** | `T` |

### Builds without a server

```bash
npm run build
```

writes to `dist/`:

- `app/`: the game as an installable web app: the page, an `assets/` folder
  with the models, textures and animation (about 25 MB), a manifest, icons
  and a service worker. Host the folder anywhere and add it to a home screen;
  it then opens offline.
- `artifact.html`: the same page packaged as a claude.ai artifact, with
  `artifact-files.json` listing the assets to publish beside it.
- `greyhaven.html`: the page alone. Opened straight off a disk it cannot
  fetch the assets, so it draws its people and furniture in code instead:
  plainer, but it is one file.

`app/` and `greyhaven.html` have no server behind them, so the characters
keep to their script. As a claude.ai artifact the page asks Claude to play
the cast on the viewer's own account, and no API key is needed.

## Settings

Environment variables for `npm start`:

| Variable | Default | |
|---|---|---|
| `ANTHROPIC_API_KEY` | none | Brings the characters to life |
| `PORT`, `HOST` | `3000`, `0.0.0.0` | Where to listen |
| `GREYHAVEN_MODEL` | `claude-opus-5-5` | Use a different Claude model |
| `GREYHAVEN_AI=off` | | Force scripted mode |
| `GREYHAVEN_DATA` | `./data/saves` | Where saves are written |
| `GREYHAVEN_DEBUG=1` | | Log each model call and its token use |

## How it is built

```
core/                 The game itself. Runs unchanged in Node and in the browser.
  engine.js           Rules: one method per thing the player can do
  brain.js            Turns a game situation into a line of dialogue (Claude, or the script)
  prompts.js          Character sheets and briefs sent to Claude
  view.js             What the player is allowed to see of the state
  cases/lamplighter/  The case: scenes, people, facts, evidence, records, story
server/               Node server: hosts the core, keeps the API key and the saves
public/               The browser client
  assets/             Models, textures and animation, ready to load (built by scripts/assets)
  src/world/          3D: rooms, people, furniture, movement, finishing pass
  src/ui/             HUD, conversation, notebook, laptop, map, title, ending
  src/game.js         Ties the world and the UI to the game core
scripts/              Playtest, browser test driver, builds
  assets/             Fetches and prepares the models, textures and animation
test/                 Tests
```

### What draws the picture

- **[three.js](https://threejs.org)** is the engine: rendering, skinned
  animation, glTF loading.
- **The people** are rigged human models from Microsoft's Rocketbox avatar
  library, moved by its motion-capture clips. `world/people.js` chooses a
  clip from what someone is doing and how they feel, turns head and eyes to
  whoever they are talking to, blinks, shapes the mouth as they speak, holds
  an expression for each mood (42 face shapes are kept per person), and keeps
  a hand on a cane with two-bone IK.
- **Furniture, lamps and props** are models from Poly Haven; **floors, walls
  and ceilings** are its photographed PBR materials; a photographed interior
  lights everything that reflects. Rooms are still laid out as data
  (`core/cases/lamplighter/scenes.js`); `world/dress.js` puts the model for
  each prop where the layout says, fitted to the space.
- **The finish** is [postprocessing](https://github.com/pmndrs/postprocessing)
  and [N8AO](https://github.com/N8python/n8ao): ambient occlusion, depth of
  field behind whoever you are talking to, bloom on lamps, filmic tone
  mapping, a light grade, vignette and grain.
- Rain, foghorn, piano and the rest of the sound are synthesised.

If the assets cannot be fetched the game still runs: people and furniture
are drawn in code instead (`world/characters.js`, `world/props.js`).

### Rebuilding the assets

What is in `public/assets` is checked in, so none of this is needed to play.
To change the cast or the furniture:

```bash
# People: which avatar plays whom, and which captures, is in scripts/assets/cast.json
git clone --filter=blob:none --no-checkout https://github.com/microsoft/Microsoft-Rocketbox rocketbox
node scripts/assets/characters.mjs --list | git -C rocketbox sparse-checkout set --no-cone --stdin
git -C rocketbox checkout
node scripts/assets/characters.mjs --src rocketbox

# Furniture, surfaces and the lighting environment: listed in scripts/assets/props.json
node scripts/assets/polyhaven.mjs
```

The first converts each avatar's FBX to glTF, keeps the face shapes the game
drives, shrinks textures to WebP and compresses the result (about half a
megabyte a person, with a lighter copy for phones). The second downloads
from Poly Haven, simplifies models that are heavier than a room needs and
does the same to their textures. `node scripts/assets/inspect.mjs file.glb`
prints what is inside a model. Sources and licences are in
[CREDITS.md](CREDITS.md).

When you run the server, the game runs on the server and the browser is a
thin client. The server never sends the browser anything the detective has
not found yet, and it does not serve the case file, so the solution is not
sitting in the page for the curious. In the single-file build the whole game
is in the page.

### Developing

```bash
npm test            # every ending, saves, view leaks, the server, the Claude calls
npm run playtest    # plays the best path through the core and prints the route
npm run dev         # server with reload
```

`node scripts/playtest.mjs --verbose` prints the whole story in order. It is
the fastest way to read the case, and it spoils everything.

`scripts/ui.mjs` drives the real game in headless Chromium for screenshots and
flow checks. It needs Playwright.

`node scripts/prompt-lab.mjs dump all out/` writes the exact requests the game
sends to Claude at a dozen points in the story, as readable text.
`... apply <situation> <answer-file>` feeds an answer back through the game
and prints what it did with it. Useful for tuning a character without
spending a token.

`/dev.html?loc=precinct` is a viewer for single rooms; `?loc=stage` lines up
the cast (`&mood=angry`, `&talk=1`, `&pose=sit`), and `?loc=models` every
piece of furniture.

**Spoilers:** `core/cases/lamplighter/` is the solution. Play first.
