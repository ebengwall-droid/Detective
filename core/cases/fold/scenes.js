// 3D layouts for every location in the Fold.
//
// Pure data: the client's scene builder turns these into geometry. Units are
// metres, origin at the room's centre, +X east, +Z south. `r` is degrees about
// the vertical axis; r = 0 faces south. Props with an `id` can carry hotspots.
// The props themselves are in public/src/world/props*.js.
//
// Every room is laid out for an upright phone first: `spawn` is where you
// stand on arriving and which way you look (yaw 0 is north, positive turns
// west; pitch in degrees, negative looks down), and what the room is about is
// in the middle of that view with a lamp on it. The lamps people see are
// mostly fittings without a light of their own; the light that does the work
// is in `lights`, a few strong warm pools aimed down so the ceilings stay
// dark, and one cool one from the window side. A phone on the lowest setting
// keeps the five strongest, so each room's first five carry it.

const WARM = 0xffc890;
const COOL = 0x8fb4d8;

/** Dame Hesper Lorimer as the Company had her painted. */
const HESPER = { coat: '#6e2a33', hair: '#b9b3a6', style: 'bun', old: 0.75, skin: '#e0b9a3', collar: '#b8ab98', smile: 0.05, pencil: true };

/** A lamp hung over something: the light under a shade, thrown down at what it is for. */
const down = (x, y, z, intensity, to = [x, 0, z], more = {}) => ({ p: [x, y, z], color: WARM, intensity, distance: 9, spot: { angle: 1.0, penumbra: 0.75, target: to }, ...more });

export const SCENES = {
  // -------------------------------------------- the Turnstile, Turnagain Lane
  gatehouse: {
    size: [6, 5],
    height: 3.4,
    floor: 'floorStone',
    walls: 'wallStone',
    ceiling: '#17130f',
    skirting: false,
    ambient: { sky: 0x7f9cb6, ground: 0x241f1a, fog: 0x0a0f12, hemi: 0.5, density: 0.03, exposure: 1.45, storm: true, moon: { from: 'e', intensity: 2.6, elevation: 30, skew: 0.2 } },
    windows: [{ wall: 'e', at: -0.5, w: 0.9, h: 1.3, sill: 1.15, cols: 2, rows: 3 }],
    doorways: [{ wall: 'n', at: 0.9, w: 1.4, h: 2.2 }],
    // In at the street door, looking through the stile to the arch: the slate on the left pier, the lock and Kit on the right.
    spawn: { p: [1.3, 2.0], yaw: 2, pitch: -9 },
    lights: [
      // The cold of the night, in at the barred window.
      { p: [2.5, 1.9, -0.5], color: COOL, intensity: 3.2, distance: 6 },
    ],
    props: [
      { t: 'beam', p: [0, -1.45], len: 6, h: 0.2, thick: 0.2 },
      { t: 'beam', p: [0, 0.8], len: 6, h: 0.2, thick: 0.2 },
      // The Turnstile: railings from wall to wall, and the stile that will not turn.
      { t: 'turnstile', id: 'turnstile', p: [0, -1.45], w: 6, at: 0.9, n: 5, word: 'RKQEA' },
      { t: 'slate', id: 'slate', p: [0.3, -1.365], y: 1.25, w: 0.4, h: 0.5, lines: ['FDWFK'], small: ["yesterday's", 'was better'] },
      // North wall: the arch into Turnagain Lane, the tablet over it, a Fold clock.
      { t: 'archway', wall: 'n', at: 0.9, w: 1.4, h: 2.2 },
      { t: 'ironLantern', p: [1.25, -2.8], hang: 1.75, intensity: 5, distance: 7 },
      { t: 'stoneTablet', id: 'stone', wall: 'n', at: 0.9, y: 2.9, w: 1.5, h: 0.44, lines: ['THREE BACK,', 'AS CAESAR WROTE.'], scratch: 'every. single. day.' },
      { t: 'foldClock', wall: 'n', at: -0.55, y: 2.05, rad: 0.2, style: 'ebony' },
      { t: 'paintedBoard', wall: 'n', at: 2.35, y: 1.85, w: 1.0, h: 0.42, lines: ['ONE ANSWER', 'ADMITS ONE'], bg: '#2a1c14' },
      // East wall: the one window, barred, and a lantern by it.
      { t: 'windowBars', wall: 'e', at: -0.5, w: 0.9, h: 1.3, sill: 1.15 },
      { t: 'ironLantern', wall: 'e', at: 0.7, y: 1.9, intensity: 4.5 },
      // West wall: the Bellows, the board, somewhere to wait.
      { t: 'bellowsOutlet', wall: 'w', at: -0.9, y: 1.15, label: 'GATE' },
      { t: 'ironLantern', wall: 'w', at: -0.15, y: 1.9, intensity: 4 },
      { t: 'paintedBoard', id: 'notice', wall: 'w', at: 1.2, y: 2.0, w: 1.6, h: 0.62, lines: ['THE FOLD', 'NO MAPS SOLD HERE', 'MIND THE TIME'] },
      { t: 'bench', p: [-2.74, 1.2], r: 90, w: 1.5, back: true },
      { t: 'coatrack', p: [-2.6, 2.22], coatColor: '#3a3f44' },
      // The door you came in by, and the wet you brought with you.
      { t: 'door', wall: 's', at: 1.3, mat: 'woodDark', w: 1.0, h: 2.1 },
      { t: 'stain', p: [1.0, 1.75], r: 0.55 },
      { t: 'stain', p: [0.5, 0.9], r: 0.3 },
      { t: 'barrel', p: [2.5, 2.05], s: 0.85 },
      { t: 'lantern', p: [2.5, 2.05], y: 0.77, intensity: 3.4, distance: 6 },
      { t: 'crate', p: [2.55, 1.3], s: 0.5 },
      // Lanterns for those going on in, on a shelf.
      { t: 'wallShelf', wall: 's', at: -0.6, y: 1.42, w: 0.8, d: 0.2 },
      { t: 'lantern', p: [-0.84, 2.4], y: 1.42, lit: false, light: false },
      { t: 'lantern', p: [-0.6, 2.4], y: 1.42, lit: false, light: false, r: 40 },
      { t: 'lantern', p: [-0.36, 2.4], y: 1.42, lit: false, light: false, r: 90 },
    ],
  },

  // ------------------------------------------------------------ Setters' Hall
  hall: {
    size: [14, 10],
    height: 3.6,
    floor: 'floorWood',
    walls: 'wallGreen',
    wainscot: { mat: 'wallPanel', h: 1.8 },
    ceiling: 'woodBlack',
    ambient: { sky: 0x7d9ab0, ground: 0x2a2018, fog: 0x0b1216, hemi: 0.5, density: 0.02, exposure: 1.42, storm: true, moon: { from: 'n', intensity: 3.2, elevation: 30, skew: 0.3 } },
    windows: [
      { wall: 'n', at: -5.2, w: 1.5, h: 2.1, sill: 0.95 },
      { wall: 'n', at: -2.9, w: 1.5, h: 2.1, sill: 0.95 },
      { wall: 'n', at: 5.1, w: 1.5, h: 2.1, sill: 0.95 },
    ],
    // In at the south door, looking up the long table to the clock and the one chair under it.
    spawn: { p: [0.5, 4.2], yaw: 0, pitch: -10 },
    lights: [
      // The near ring, over the table.
      down(0.5, 2.7, 1.4, 26, [0.5, 0, 1.4], { shadow: true }),
      // The far wall: the clock, the chair, Dame Hesper, the register.
      { p: [0.5, 3.2, -1.2], color: 0xffcf9a, intensity: 22, distance: 11, spot: { angle: 0.95, penumbra: 0.8, target: [0.5, 1.7, -5.0] } },
      // The Lodge, the Warden's Parlour, and the corner they have lent you.
      { p: [4.45, 2.5, 2.4], color: WARM, intensity: 16, distance: 7, spot: { angle: 0.9, penumbra: 0.75, target: [4.45, 1.3, 3.9] } },
      { p: [5.0, 2.6, -2.3], color: WARM, intensity: 16, distance: 7, spot: { angle: 0.95, penumbra: 0.75, target: [5.0, 1.2, -4.3] } },
      down(-3.5, 2.7, -1.6, 16, [-4.0, 0.9, -3.3]),
      // The far ring, and the wall the door is in.
      down(0.5, 2.7, -0.8, 14, [0.5, 0, -0.8]),
      { p: [-1.6, 2.5, 3.5], color: WARM, intensity: 5, distance: 7 },
    ],
    props: [
      { t: 'beam', p: [0, -2.5], len: 14, h: 0.24, thick: 0.2 },
      { t: 'beam', p: [0, 0], len: 14, h: 0.24, thick: 0.2 },
      { t: 'beam', p: [0, 2.5], len: 14, h: 0.24, thick: 0.2 },
      // The desk they have lent you, under the north-west window, and the Bellows by it.
      { t: 'table', p: [-5.2, -3.45], w: 1.5, d: 0.75, h: 0.76, mat: 'wood' },
      { t: 'officeChair', p: [-5.2, -4.25], r: 0 },
      { t: 'laptop', id: 'laptop', p: [-5.62, -3.42], y: 0.76, r: 180 },
      { t: 'hotspot', id: 'my_desk', p: [-4.82, -3.45], y: 0.76, w: 0.56, h: 0.14, d: 0.5 },
      { t: 'sheets', p: [-4.84, -3.47], y: 0.76, kind: 'pad', n: 1, pens: 1, spread: 0.2 },
      { t: 'hallCup', p: [-4.72, -3.16], y: 0.76, kind: 'plain' },
      { t: 'nameplate', p: [-5.0, -3.74], y: 0.76, r: 180, text: 'MIND THE TIME' },
      { t: 'deskLamp', p: [-5.82, -3.72], y: 0.76, r: 150 },
      { t: 'bellowsOutlet', id: 'tube', wall: 'w', at: -3.7, y: 1.15, label: 'DESK' },
      { t: 'caseBoard', id: 'board', wall: 'w', at: -1.75, w: 2.4, h: 1.3, y: 1.8 },
      { t: 'curtain', p: [-6.2, -4.9], bottom: 0.25, h: 3.0, w: 0.4, mat: 'fabricWine' },
      { t: 'curtain', p: [-4.25, -4.9], bottom: 0.25, h: 3.0, w: 0.4, mat: 'fabricWine' },
      { t: 'curtain', p: [-3.85, -4.9], bottom: 0.25, h: 3.0, w: 0.4, mat: 'fabricWine' },
      { t: 'curtain', p: [-1.95, -4.9], bottom: 0.25, h: 3.0, w: 0.4, mat: 'fabricWine' },
      // The back wall: the clock, and under it the one chair nobody sits in. Dame Hesper on one side, the register on the other.
      { t: 'foldClock', id: 'hall_clock', wall: 'n', at: 0.5, y: 2.85, rad: 0.42 },
      { t: 'tallChair', p: [0.5, -4.7], r: 0 },
      { t: 'hotspot', id: 'back_chair', p: [0.5, -4.6], y: 0.3, w: 0.5, h: 0.45, d: 0.4 },
      { t: 'sconce', wall: 'n', at: -0.3, y: 2.3 },
      { t: 'sconce', wall: 'n', at: 1.3, y: 2.3 },
      { t: 'portrait', id: 'portrait_hesper', wall: 'n', at: -1.15, y: 2.35, w: 0.95, h: 1.25, lamp: true, light: false, plate: 'DAME HESPER LORIMER', key: 'hesper', look: HESPER },
      { t: 'bookStand', id: 'register', p: [2.0, -4.55], r: 0, light: false },
      // West wall: a longcase clock, and the tithe of puzzles from the floor to higher than you can read.
      { t: 'longcase', p: [-6.75, 0.0], r: 90 },
      { t: 'titheWall', id: 'tithe_wall', wall: 'w', at: 2.5, w: 4.0, h: 3.2, y: 1.75, dense: 30, loose: 8, tiles: true },
      // South wall: the evidence chest, forty Wardens, the door, tea, the keys.
      { t: 'strongbox', id: 'strongbox', p: [-6.2, 4.62], r: 180, w: 1.0 },
      { t: 'portraitRow', id: 'portraits', wall: 's', at: -2.95, n: 10, rows: 2, w: 0.38, h: 0.48, gap: 0.13, rowGap: 0.2, y: 2.62, newest: true },
      { t: 'bench', p: [-2.95, 4.74], r: 180, w: 2.8, back: true },
      { t: 'door', wall: 's', at: 0.5, w: 1.05, h: 2.2, mat: 'woodDark' },
      { t: 'teaTable', id: 'tea_table', p: [2.0, 4.6], r: 180, w: 1.8 },
      { t: 'keyBoard', id: 'keyboard', wall: 's', at: 3.45, y: 1.6 },
      // The Porter's Lodge, east of the door: the counter, the daybook, the kettle, and a stool nobody has seen sat on.
      { t: 'lodge', id: 'lodge', p: [5.45, 3.0], r: 180, len: 3.1, flip: true, light: false },
      { t: 'stool', p: [6.3, 4.2], h: 0.7 },
      { t: 'shelf', p: [5.3, 4.82], r: 180, w: 1.8, h: 2.0, fill: ['boxes', 'files', 'boxes', 'files', 'boxes'] },
      { t: 'pendant', p: [4.45, 2.4], hang: 2.55, light: false },
      { t: 'bellowsExchange', id: 'exchange', wall: 'e', at: 1.45, y: 0.8, w: 2.1 },
      // The long table.
      { t: 'rug', p: [0.5, 0.3], w: 3.4, d: 6.2, color: '#3a1f24', accent: '#b08a4a' },
      { t: 'longTable', p: [0.5, 0.3], r: 90, w: 4.4, d: 1.15 },
      { t: 'chair', p: [-0.42, -1.3], r: 90 },
      { t: 'chair', p: [-0.44, -0.25], r: 90 },
      { t: 'chair', p: [-0.42, 0.8], r: 82 },
      { t: 'chair', p: [-0.44, 1.85], r: 90 },
      { t: 'chair', p: [1.42, -1.3], r: -90 },
      { t: 'chair', p: [1.44, -0.25], r: -98 },
      { t: 'chair', p: [1.42, 0.8], r: -90 },
      { t: 'chair', p: [1.5, 1.9], r: -70 },
      { t: 'candlestick', p: [0.5, 1.25], y: 0.77, lit: true },
      { t: 'candlestick', p: [0.5, -0.95], y: 0.77, lit: true },
      { t: 'sheets', p: [0.36, 0.55], y: 0.77, kind: ['grid', 'crossword', 'notes'], n: 4, pens: 1 },
      { t: 'sheets', p: [0.66, -0.3], y: 0.77, kind: ['crossword', 'grid'], n: 3, neat: true },
      { t: 'cipherWheel', p: [0.5, 0.12], y: 0.77, rad: 0.11, stand: true, r: 20 },
      { t: 'books', p: [0.62, -1.45], y: 0.77, n: 3 },
      { t: 'carrier', p: [0.34, 1.95], y: 0.77, r: 40 },
      { t: 'globe', p: [0.42, -1.82], y: 0.77 },
      { t: 'ringLight', p: [0.5, 1.4], hang: 2.75, rad: 0.6, light: false },
      { t: 'ringLight', p: [0.5, -0.8], hang: 2.75, rad: 0.6, light: false },
      { t: 'ringLight', p: [-3.5, -1.6], hang: 2.75, rad: 0.45, n: 6, light: false },
      // The Warden's Parlour, north-east: a desk the size of a billiard table, and not a puzzle in the room.
      { t: 'glassWall', p: [5.35, -1.2], len: 3.3 },
      { t: 'brassPlate', p: [6.05, -1.155], y: 1.62, w: 0.62, text: 'THE WARDEN', sub: 'A. CLAY' },
      { t: 'glassWall', p: [2.7, -3.1], r: 90, len: 3.8 },
      { t: 'rug', p: [5.0, -3.0], w: 3.4, d: 2.8, color: '#2b3340', accent: '#8a7a50' },
      { t: 'desk', id: 'clay_desk', carved: true, p: [5.0, -3.1], r: 0, w: 2.3, d: 1.15, mat: 'woodDark' },
      { t: 'officeChair', p: [6.3, -4.35], r: -30, mat: 'leatherOxblood' },
      { t: 'phone', p: [4.25, -3.25], y: 0.765, r: 160 },
      { t: 'paperweight', p: [5.0, -2.95], y: 0.765, r: 180, title: 'GREYWETHER PLC' },
      { t: 'deskLamp', p: [5.85, -3.35], y: 0.765, r: -20, light: false },
      { t: 'nameplate', p: [5.0, -2.62], y: 0.765, text: 'THE WARDEN' },
      { t: 'foldSafe', id: 'clay_safe', p: [6.62, -1.95], r: -90 },
      { t: 'plinth', p: [3.25, -4.5], h: 1.05, size: 0.4 },
      { t: 'model', m: 'bust', p: [3.25, -4.5], y: 1.05, r: 25 },
      { t: 'certificate', wall: 'e', at: -3.5, y: 2.0 },
      { t: 'foldFrame', wall: 'e', at: -2.7, art: 'plan', w: 0.72, h: 0.48, y: 2.0 },
      { t: 'pendant', p: [5.0, -2.3], hang: 2.6, light: false },
    ],
  },

  // ------------------------------------ Pendry & Sons, 4 Nonesuch Row
  clockshop: {
    size: [8.4, 6.6],
    height: 3.0,
    floor: 'floorPlanks',
    walls: 'wallGreen',
    wainscot: { mat: 'wallPanel', h: 0.95 },
    ceiling: 'woodBlack',
    ambient: { sky: 0x7d9ab0, ground: 0x2a2018, fog: 0x0b1216, hemi: 0.5, density: 0.024, exposure: 1.42, storm: true, moon: { from: 'n', intensity: 2.8, elevation: 32, skew: -0.25 } },
    windows: [{ wall: 'n', at: -0.6, w: 2.6, h: 1.45, sill: 1.12, cols: 4, rows: 2 }],
    // In at the doorway the constables opened, looking across to the bench under the window, Kit beside it. The boy is by the long clock on your left.
    spawn: { p: [-3.0, 2.3], yaw: -25, pitch: -10 },
    lights: [
      // One lamp over the middle of the shop, for the two who are waiting in it.
      down(-1.4, 2.5, 0.6, 17, [-2.4, 0.8, -0.4], { shadow: true }),
      // The wall of clocks.
      { p: [2.7, 2.3, -0.9], color: WARM, intensity: 5, distance: 6.5 },
      // His chess-player, in the corner.
      down(2.6, 2.5, 2.1, 7, [3.4, 1.0, 2.15]),
    ],
    props: [
      { t: 'rug', p: [0.4, 0.5], w: 4.0, d: 2.8, color: '#27303f', accent: '#9a824e' },
      // His bench, under the window, as he left it: the paper under his hand, the blotter, the tray he carried back.
      { t: 'watchBench', id: 'bench', p: [-0.6, -2.88], w: 2.5, intensity: 2.8 },
      { t: 'windowBars', id: 'window_bars', wall: 'n', at: -0.6, w: 2.6, h: 1.45, sill: 1.12 },
      { t: 'sheets', p: [-0.65, -2.68], y: 0.92, kind: 'green', n: 1, neat: true },
      { t: 'sheets', id: 'notepad', p: [0.02, -2.69], y: 0.92, kind: 'blotter', n: 1, spread: 0, neat: true, pens: 1 },
      { t: 'evidenceMarker', p: [-0.84, -2.55], y: 0.92, n: 1, r: 15 },
      { t: 'teaTray', id: 'cup_pendry', p: [0.45, -2.78], y: 0.92, r: 82, kind: 'clock' },
      { t: 'evidenceMarker', p: [-0.3, -2.54], y: 0.92, n: 2, r: -10 },
      { t: 'evidenceMarker', p: [-0.95, -1.75], n: 3, r: 30 },
      { t: 'stool', p: [-0.45, -1.88], h: 0.62 },
      { t: 'tapeLine', p: [-0.45, -1.3], len: 3.1, hgt: 0.95, posts: true },
      { t: 'bellowsOutlet', id: 'tube_pendry', wall: 'n', at: 1.55, y: 1.15, label: 'No. 4', open: true, uncapped: true },
      { t: 'shelf', p: [3.1, -3.12], w: 1.5, h: 2.2, fill: ['jars', 'boxes', 'jars', 'boxes', 'jars'] },
      // Forty-one clocks, and every one of them right: the east wall, either side of the window, over the stove.
      { t: 'clockWall', wall: 'e', at: -0.9, w: 4.4, y0: 0.95, y1: 2.72, n: 22, skip: [[0, 2.05, 0.5]] },
      { t: 'foldClock', id: 'clocks', wall: 'e', at: -0.9, y: 2.05, rad: 0.3, style: 'drop', swing: true },
      { t: 'clockWall', wall: 'n', at: -3.05, w: 1.9, y0: 1.25, y1: 2.72, n: 6, first: 2 },
      { t: 'clockWall', wall: 'n', at: 1.5, w: 1.4, y0: 1.85, y1: 2.75, n: 4, first: 4 },
      { t: 'clockWall', wall: 'w', at: -1.9, w: 2.2, y0: 1.5, y1: 2.72, n: 4, first: 1, skip: [[0.9, 2.1, 0.3]] },
      { t: 'longcase', p: [-3.94, 1.0], r: 90 },
      // The stove: laid, and never lit.
      { t: 'stove', p: [-3.75, -1.0], r: 90, lit: false },
      { t: 'hotspot', id: 'stove_pendry', p: [-3.75, -1.0], w: 0.5, h: 0.86, d: 0.5 },
      { t: 'crate', p: [-3.8, -0.25], s: 0.45 },
      // South wall: the door they took off its hinges, his desk and his certificate, two more clocks.
      { t: 'lockDoor', id: 'door_pendry', wall: 's', at: -3.1, off: 'left', straps: true, flip: true, n: 7, word: 'PENDRYS', mat: 'wood' },
      { t: 'desk', carved: true, p: [0.2, 2.86], r: 180, w: 1.5, mat: 'woodDark' },
      { t: 'ledger', id: 'ledger_pendry', p: [0.1, 2.84], y: 0.765, r: 180 },
      { t: 'deskLamp', p: [0.72, 2.95], y: 0.765, r: 200, shade: 'brassDull' },
      { t: 'model', m: 'mantel_clock', p: [-0.35, 3.0], y: 0.765, r: 190 },
      { t: 'chair', p: [0.2, 2.1], r: 185 },
      { t: 'certificate', id: 'certificate', wall: 's', at: 0.2, y: 1.75, w: 0.5, h: 0.64, lines: ['CERTIFICATE OF PROVENANCE', 'THE LORIMER LEGACY'], sub: 'I. PENDRY, GRAND SETTER AND SYNDIC' },
      { t: 'sign', wall: 's', at: -1.75, y: 2.5, w: 1.9, h: 0.42, text: 'PENDRY & SONS', sub: 'HOROLOGISTS · 4 NONESUCH ROW', bg: '#1c2a24' },
      { t: 'longcase', p: [1.6, 3.06], r: 180 },
      { t: 'longcase', p: [2.3, 3.06], r: 180, s: 0.93 },
      // The Lodger, in the south-east corner, with a curtain behind him.
      { t: 'automaton', id: 'lodger', p: [3.4, 2.15], r: -90 },
      { t: 'curtain', p: [4.1, 1.6], r: -90, bottom: 0.1, h: 2.6, w: 0.5, mat: 'fabricWine' },
      { t: 'curtain', p: [4.1, 2.2], r: -90, bottom: 0.1, h: 2.6, w: 0.5, mat: 'fabricWine' },
      { t: 'curtain', p: [4.1, 2.8], r: -90, bottom: 0.1, h: 2.6, w: 0.5, mat: 'fabricWine' },
      // Scene-of-crime kit.
      { t: 'floodlight', p: [1.75, -1.3], r: 236, intensity: 7, tilt: 14 },
      { t: 'tripodCamera', p: [0.45, -0.55], r: 196 },
      { t: 'caseKit', p: [1.45, -0.3], r: 30 },
      { t: 'ironLantern', p: [-1.4, 0.6], hang: 2.55, light: false },
      { t: 'sconce', wall: 'w', at: 2.3, y: 1.8, light: true, intensity: 3.2 },
    ],
  },

  // ------------------------------------------- Quoin & Daughter, Wheelwrights
  wheelshop: {
    size: [7.4, 6.2],
    height: 2.9,
    floor: 'floorPlanks',
    walls: 'wallCream',
    wallMats: { e: 'wallBrick' },
    ceiling: 'woodBlack',
    ambient: { sky: 0x7d8fa0, ground: 0x2a1e14, fog: 0x100d0a, hemi: 0.5, density: 0.02, exposure: 1.38 },
    windows: [{ wall: 's', at: -2.1, w: 2.0, h: 1.5, sill: 0.8, cols: 3, rows: 2 }],
    // In at the shop door, facing the baize counter with Mrs Quoin behind it and the wheels behind her.
    spawn: { p: [0.2, 2.3], yaw: 0, pitch: -10 },
    lights: [
      // Over the counter, and on her.
      down(0.35, 2.3, -1.15, 18, [0.55, 1.0, -1.9], { shadow: true }),
      // The street, in at the window.
      { p: [-2.1, 1.8, 2.5], color: COOL, intensity: 3.4, distance: 6 },
      // Over the work.
      { p: [2.7, 2.35, 0.3], color: WARM, intensity: 8.6, distance: 7, spot: { angle: 1.15, penumbra: 0.7, target: [3.5, 1.1, 0.2] } },
    ],
    props: [
      // Wheels, on the north wall and the west.
      { t: 'wheelRack', id: 'wheels', wall: 'n', at: -0.3, y: 0.72, w: 3.2, h: 1.95, rows: 4 },
      { t: 'wheelRack', wall: 'w', at: -0.9, y: 0.72, w: 2.6, h: 1.95, rows: 4 },
      { t: 'hangingWheels', p: [-2.3, 0.3], n: 4, spread: 0.9 },
      { t: 'sign', wall: 'n', at: 2.5, y: 2.5, w: 2.2, h: 0.46, text: 'QUOIN & DAUGHTER', sub: 'WHEELWRIGHTS TO THE COMPANY', bg: '#1c2a24' },
      { t: 'frame', id: 'kit_photo', wall: 'n', at: 1.78, art: 'photo:mother', w: 0.38, h: 0.5, y: 1.62, frame: 'brassDull' },
      { t: 'frame', wall: 'n', at: 2.4, art: 'photo:couple', w: 0.34, h: 0.42, y: 1.6 },
      { t: 'certificate', wall: 'n', at: 3.05, y: 1.62, w: 0.4, h: 0.5, sub: 'MASTER WHEELWRIGHT' },
      // The fitting bench: green baize, the velvet tray, the ledger.
      { t: 'counter', p: [0.2, -1.2], len: 2.8, h: 1.0, mat: 'woodDark', top: '#1f4a34' },
      { t: 'discTray', id: 'fitting', p: [-0.25, -1.18], y: 1.0 },
      { t: 'ledger', id: 'quoin_ledger', p: [1.2, -1.22], y: 1.0, r: -8 },
      { t: 'cipherWheel', p: [-0.95, -1.28], y: 1.0, rad: 0.12, stand: true, r: 15, tone: 'box', rings: 3 },
      { t: 'deskLamp', p: [-0.95, -1.0], y: 1.0, r: 40, intensity: 2.6 },
      { t: 'jar', p: [1.42, -0.98], y: 1.0, contents: 'brass', fill: 0.5 },
      { t: 'stool', p: [-0.35, -0.3] },
      // The party wall with Pendry's: a foot of old brick, and a shelf of varnish tins.
      { t: 'tinShelf', id: 'wall_party', wall: 'e', at: -1.2, y: 1.4, w: 1.6 },
      { t: 'barrel', p: [3.25, -2.6], s: 0.85 },
      { t: 'workbench', p: [3.28, 1.4], r: -90, w: 2.0 },
      { t: 'dividingEngine', p: [3.25, 1.05], y: 0.905, r: -90 },
      { t: 'cipherWheel', p: [3.3, 1.95], y: 0.905, rad: 0.1, tone: 'box' },
      { t: 'cipherWheel', p: [3.2, 2.15], y: 0.905, rad: 0.07, r: 40 },
      { t: 'stool', p: [2.5, 1.4], h: 0.62 },
      { t: 'pendant', p: [2.7, 0.3], hang: 2.35, light: false, shade: 'brassDull' },
      // West side: the Bellows, the stove.
      { t: 'bellowsOutlet', wall: 'w', at: 1.2, y: 1.15, label: 'No. 6' },
      { t: 'stove', p: [-3.2, 2.45], r: 90, intensity: 4 },
      { t: 'crate', p: [-3.15, 1.75], s: 0.5 },
      { t: 'model', m: 'ladder', p: [-3.0, -2.5], r: 55 },
      { t: 'door', wall: 's', at: 0.2, glass: true, text: 'QUOIN', sub: '& DAUGHTER' },
      { t: 'rug', p: [0.2, 0.75], w: 2.4, d: 1.8, color: '#3a2a1c', accent: '#8a6a3a' },
      { t: 'pendant', p: [0.35, -1.15], hang: 2.25, light: false },
    ],
  },

  // ----------------------------------------------------------- County Mortuary
  mortuary: {
    size: [9.4, 7],
    height: 3.0,
    floor: 'floorTile',
    walls: 'wallTile',
    ceiling: '#232a2a',
    skirting: false,
    ambient: { sky: 0x9fc0c4, ground: 0x1e2a2a, fog: 0x0a1314, hemi: 0.42, density: 0.02, exposure: 1.38 },
    // In at the door, looking across the room to the one lit table and Dr Marsh at the foot of it.
    spawn: { p: [3.2, 2.6], yaw: 64, pitch: -9 },
    props: [
      { t: 'autopsyTable', id: 'slab', p: [-1.6, -0.2], body: true },
      { t: 'surgicalLight', p: [-1.6, -0.3], hang: 2.1, intensity: 46 },
      { t: 'autopsyTable', p: [2.6, -0.2] },
      { t: 'surgicalLight', p: [2.6, -0.3], hang: 2.1, lit: false },
      { t: 'instrumentCart', p: [-0.82, -0.95], r: 90 },
      { t: 'instrumentCart', p: [3.5, -1.2], r: 80 },
      { t: 'coldLockers', p: [-1.6, -3.32], cols: 4, rows: 3 },
      // The fridge: racks of tubes, and on the top shelf the white box with the red band.
      { t: 'specimenFridge', p: [2.6, -3.15] },
      { t: 'hotspot', id: 'samples', p: [2.6, -2.9], y: 1.25, w: 0.7, h: 0.55, d: 0.3 },
      { t: 'medBox', p: [2.72, -2.866], y: 1.515, w: 0.2, h: 0.13, d: 0.034 },
      { t: 'sink', p: [4.38, -1.2], r: -90, w: 1.5 },
      { t: 'lightbox', wall: 'e', at: 1.3, y: 1.6 },
      { t: 'clock', wall: 'n', at: 3.9, y: 2.4, time: '10:15' },
      // Dr Marsh's corner.
      { t: 'desk', p: [-3.6, 2.85], r: 180, mat: 'steelDark', front: 'steelDark' },
      { t: 'chair', p: [-3.6, 2.1], r: 0, mat: 'steelDark' },
      { t: 'deskLamp', p: [-4.2, 3.0], y: 0.765, r: 150, shade: 'steelDark', intensity: 3 },
      { t: 'clipboard', id: 'report', p: [-3.92, 2.72], y: 0.765, r: 190 },
      { t: 'cruxPaper', id: 'marsh_crossword', p: [-3.12, 2.8], y: 0.765, r: 168, filled: true },
      { t: 'mug', p: [-3.5, 3.02], y: 0.765 },
      { t: 'cabinet', p: [-1.9, 3.15], r: 180, drawers: 4 },
      { t: 'cabinet', p: [-1.38, 3.15], r: 180, drawers: 4 },
      { t: 'model', m: 'microscope', p: [-1.92, 3.15], y: 1.32, r: 200 },
      { t: 'model', m: 'medical_box', p: [-1.36, 3.15], y: 1.32, r: 185 },
      { t: 'locker', p: [0.2, 3.2], r: 180, n: 2 },
      { t: 'door', wall: 's', at: 3.2, mat: 'steelDark', frame: 'steelDark' },
      { t: 'bench', p: [-4.4, -0.9], r: 90, w: 1.4, mat: 'steelDark' },
      { t: 'striplight', p: [0.9, 1.7], len: 1.4, intensity: 8, distance: 8 },
      { t: 'striplight', p: [2.6, -2.2], len: 1.4, intensity: 5, distance: 7, flicker: true },
      { t: 'striplight', p: [-3.4, 1.9], len: 1.4, intensity: 4, distance: 6 },
    ],
  },

  // ------------------------------------------------- the narrowboat Meridian
  meridian: {
    size: [9.2, 3.0],
    height: 2.1,
    floor: 'floorDeck',
    walls: 'wallCream',
    wainscot: { mat: 'wallTeak', h: 0.92 },
    ceiling: '#1f1812',
    skirting: false,
    ambient: { sky: 0x86a2b8, ground: 0x2a2016, fog: 0x0b1216, hemi: 0.5, density: 0.022, exposure: 1.4, storm: true },
    // Down the hatch, looking forward: her chair pushed back from the lit chart table, and beyond it the length of the boat.
    spawn: { p: [-3.85, 0.35], yaw: -86, pitch: -12 },
    lights: [
      // The dark outside, forward.
      { p: [3.9, 1.5, 0.0], color: COOL, intensity: 2.9, distance: 5 },
    ],
    props: [
      { t: 'beam', p: [-3.0, 0], r: 90, len: 3.0, h: 0.09, mat: 'wallTeak' },
      { t: 'beam', p: [-1.2, 0], r: 90, len: 3.0, h: 0.09, mat: 'wallTeak' },
      { t: 'beam', p: [0.6, 0], r: 90, len: 3.0, h: 0.09, mat: 'wallTeak' },
      { t: 'beam', p: [2.4, 0], r: 90, len: 3.0, h: 0.09, mat: 'wallTeak' },
      { t: 'porthole', wall: 'n', at: -1.3 },
      { t: 'porthole', wall: 'n', at: 0.78 },
      { t: 'porthole', wall: 'n', at: 3.9 },
      { t: 'porthole', wall: 's', at: -3.3 },
      { t: 'porthole', wall: 's', at: 0.2 },
      { t: 'porthole', wall: 's', at: 3.95 },
      // The hatch, aft: its glass put in with a boathook. The ferrywoman's book by it.
      { t: 'lockDoor', id: 'door_sallow', wall: 'w', at: 0, w: 0.74, h: 1.78, mat: 'woodPaintGreen', frame: 'woodDark', n: 7, port: 'broken', word: 'CHARTED' },
      { t: 'boathook', wall: 'w', at: 0.9, lean: 12 },
      { t: 'sconce', wall: 'w', at: -0.95, y: 1.6 },
      { t: 'model', m: 'boots', p: [-4.25, -0.72], r: 70 },
      { t: 'bellowsOutlet', id: 'tube_sallow', wall: 'n', at: -3.95, y: 1.05, label: 'MERIDIAN' },
      { t: 'stool', p: [-4.15, 1.05], h: 0.6 },
      { t: 'tome', id: 'riddle_book', p: [-4.15, 1.05], y: 0.63, r: 100, thick: 0.1, w: 0.3, d: 0.24, mat: 'leatherGreen' },
      // Port side: the galley, the chart table she died at, the sextant, the plan chest and the atlases.
      { t: 'galley', p: [-2.55, -1.2], len: 1.5 },
      { t: 'model', m: 'kettle', p: [-2.9, -1.2], y: 0.9, r: 30 },
      { t: 'mug', p: [-2.2, -1.1], y: 0.9 },
      { t: 'stove', p: [-1.45, -1.2], intensity: 3.2 },
      { t: 'planTable', id: 'chart_table', p: [0.2, -0.98], w: 1.8, d: 0.95, mat: 'wallTeak', plan: 'master' },
      { t: 'oilLamp', p: [0.55, -1.3], y: 0.82, intensity: 4.6 },
      { t: 'flask', id: 'flask', p: [0.92, -0.72], y: 0.82, r: 30, cup: 'compass', cupX: -0.14, cupZ: 0.05 },
      { t: 'sheets', p: [0.02, -0.7], y: 0.824, kind: 'green', n: 1, neat: true, pens: 1, spread: 0.1 },
      { t: 'evidenceMarker', p: [0.58, -0.62], y: 0.82, n: 2, r: 20 },
      { t: 'chair', p: [0.12, -0.28], r: 164 },
      { t: 'hotspot', id: 'bunk_sallow', p: [0.12, -0.28], w: 0.5, h: 0.95, d: 0.5 },
      { t: 'shoe', p: [0.52, -0.2], r: 60, side: true },
      { t: 'evidenceMarker', p: [-0.3, -0.12], n: 1, r: -70 },
      { t: 'caseKit', p: [-2.5, 1.22], r: 170 },
      { t: 'wallShelf', wall: 'n', at: 1.62, y: 1.2, w: 0.8, d: 0.3, mat: 'wallTeak' },
      { t: 'sextant', id: 'sextant', p: [1.62, -1.34], y: 1.2, open: 86 },
      { t: 'planChest', p: [2.95, -1.1], w: 1.2, d: 0.76, h: 0.88, mat: 'wallTeak' },
      { t: 'globe', p: [2.65, -1.12], y: 0.88 },
      { t: 'atlasShelf', id: 'atlas', wall: 'n', at: 2.95, y: 1.27, w: 1.3 },
      // Starboard side: room to stand, her stock, the log.
      { t: 'sconce', wall: 's', at: -1.75, y: 1.6, light: true, intensity: 3 },
      { t: 'foldFrame', wall: 's', at: -0.7, art: 'canal', w: 0.8, h: 0.46, y: 1.5 },
      { t: 'sconce', wall: 's', at: 0.75, y: 1.6 },
      { t: 'scrollRack', p: [1.75, 1.33], r: 180, w: 1.4, h: 1.2, base: 0.45, cols: 6, rows: 4, mat: 'wallTeak' },
      { t: 'sign', wall: 's', at: 1.75, y: 1.86, w: 1.1, h: 0.3, text: 'MERIDIAN', sub: 'CHARTS · GLOBES · SURVEYS', bg: '#1c2a24' },
      { t: 'table', p: [3.2, 1.2], w: 0.9, d: 0.5, h: 0.74, mat: 'wallTeak' },
      { t: 'ledger', id: 'log_sallow', p: [3.34, 1.18], y: 0.74, r: 180 },
      { t: 'deskLamp', p: [2.9, 1.3], y: 0.74, r: 160, intensity: 3.4 },
      { t: 'foldFrame', wall: 's', at: 3.1, art: 'stars', w: 0.5, h: 0.4, y: 1.45 },
      // Forward: her berth, made.
      { t: 'berth', p: [4.18, 0], r: -90, len: 1.9, light: false },
      { t: 'porthole', wall: 'e', at: -0.35, y: 1.5, r: 0.14 },
      { t: 'rug', p: [0.9, 0.3], w: 4.6, d: 0.8, color: '#3a2a1c', accent: '#8a6a3a' },
    ],
  },

  // ----------------------------------------------------------- the Stalemate
  stalemate: {
    size: [11.4, 8],
    height: 2.75,
    floor: 'floorPlanks',
    walls: 'wallCream',
    wainscot: { mat: 'wallPanel', h: 1.15 },
    ceiling: 'woodBlack',
    ambient: { sky: 0x74808c, ground: 0x2a1e14, fog: 0x100c09, hemi: 0.48, density: 0.02, exposure: 1.36, storm: true },
    windows: [
      { wall: 's', at: -3.6, w: 1.4, h: 1.2, sill: 1.0, cols: 3, rows: 2 },
      { wall: 's', at: 4.1, w: 1.4, h: 1.2, sill: 1.0, cols: 3, rows: 2 },
    ],
    // A few steps in from the street door: Mrs Brandreth at the end of her counter on the left, tonight's problem on the slate on the right.
    spawn: { p: [1.7, 2.0], yaw: 0, pitch: -9 },
    lights: [
      // Over the end of the counter, and on her.
      down(0.7, 2.3, -2.05, 20, [0.7, 1.05, -2.7], { shadow: true }),
      // The slate.
      { p: [2.75, 2.5, -2.7], color: 0xffd9a8, intensity: 10.5, distance: 6, spot: { angle: 0.9, penumbra: 0.7, target: [2.75, 1.6, -4.0] } },
      // The game that has stood since 1987.
      down(4.3, 2.1, -0.9, 10, [4.3, 0.7, -0.9]),
      // The square, in at the windows.
      { p: [3.6, 1.8, 3.3], color: COOL, intensity: 4.6, distance: 7 },
      // The other tables.
      down(-1.9, 2.1, 0.9, 8, [-1.9, 0.7, 0.9]),
    ],
    props: [
      { t: 'beam', p: [0, -2.4], len: 11.4 },
      { t: 'beam', p: [0, 0], len: 11.4 },
      { t: 'beam', p: [0, 2.4], len: 11.4 },
      // The counter, along the north wall.
      { t: 'coffeeBar', p: [-1.2, -3.74], len: 4.6 },
      { t: 'counter', p: [-1.2, -1.95], len: 4.8, rail: true, mat: 'woodDark', top: 'wood' },
      { t: 'coffeeMachine', p: [-2.85, -1.98], y: 1.05, r: 180 },
      { t: 'model', m: 'cash_register', p: [-1.85, -2.0], y: 1.05, r: 180, s: 0.8 },
      { t: 'cakeDome', id: 'draw_cake', p: [-0.75, -1.93], y: 1.05, knifeTurn: 100 },
      { t: 'ledger', id: 'score_book', p: [0.2, -1.9], y: 1.05, r: 6 },
      { t: 'lantern', p: [1.08, -2.02], y: 1.05, intensity: 2.6, distance: 5 },
      { t: 'stool', p: [-3.05, -1.2] },
      { t: 'stool', p: [-2.15, -1.2] },
      { t: 'stool', p: [-1.25, -1.18] },
      { t: 'pendant', p: [0.7, -2.05], hang: 2.3, light: false },
      { t: 'pendant', p: [-1.7, -2.05], hang: 2.3, light: false },
      { t: 'bellowsOutlet', wall: 'n', at: 1.36, y: 1.2, label: 'No. 9' },
      // The slate, and the table under it where problems are set up.
      { t: 'chessSlate', id: 'slate_board', wall: 'n', at: 2.75, y: 1.72, w: 2.2, h: 1.4 },
      { t: 'chessTable', p: [2.75, -3.0], clock: false, cups: false },
      { t: 'chair', p: [3.5, -3.0], r: -90 },
      // The floor.
      { t: 'chessTable', id: 'chess_tables', p: [4.3, -0.9], card: ['Adjourned.', 'H.L. to move.'] },
      { t: 'chair', p: [4.3, -1.62], r: 0 },
      { t: 'chair', p: [4.3, -0.18], r: 180 },
      { t: 'pendant', p: [4.3, -0.9], hang: 2.05, light: false },
      { t: 'chessTable', p: [-1.9, 0.9], turn: 90 },
      { t: 'chair', p: [-2.62, 0.9], r: 90 },
      { t: 'chair', p: [-1.18, 0.95], r: -95 },
      { t: 'pendant', p: [-1.9, 0.9], hang: 2.05, light: false },
      { t: 'chessTable', p: [4.15, 3.0], turn: 90, clock: false },
      { t: 'chair', p: [3.42, 3.0], r: 90 },
      { t: 'chair', p: [4.88, 3.05], r: -95 },
      { t: 'rug', p: [1.7, 0.2], w: 1.8, d: 2.6, color: '#3a1f24', accent: '#b08a4a' },
      // West: the stairs up to the Crux, the stove, and the table the Porter has his dominoes at.
      { t: 'blocker', p: [-5.1, -3.0], w: 0.95, d: 1.0 },
      { t: 'stairs', id: 'stairs_crux', p: [-5.1, -1.35], steps: 9, w: 0.95, rise: 0.21, run: 0.25 },
      { t: 'handSign', wall: 'w', at: 0.35, y: 1.8 },
      { t: 'stove', p: [-5.3, 1.45], r: 90, intensity: 4.5 },
      { t: 'armchair', p: [-4.25, 0.5], r: -110, mat: 'leather' },
      { t: 'dominoTable', id: 'domino_table', p: [-4.1, 2.45] },
      { t: 'chair', p: [-4.1, 3.2], r: 180 },
      { t: 'chair', p: [-3.35, 2.45], r: -90 },
      { t: 'foldClock', wall: 'w', at: 2.9, y: 2.1, rad: 0.2, style: 'octagon' },
      // South wall: the door, and this week's Crux pinned up by it.
      { t: 'door', wall: 's', at: 1.7, mat: 'woodPaintGreen' },
      { t: 'noticeboard', id: 'noticeboard', wall: 's', at: 0.35, y: 1.65, w: 1.3, h: 0.95 },
      { t: 'coatrack', p: [-1.0, 3.6], coatColor: '#3a3f44' },
      // East wall.
      { t: 'sign', wall: 'e', at: -2.6, y: 2.25, w: 2.2, h: 0.44, text: 'THE STALEMATE', sub: 'COFFEE · CHESS · NO GAMBITS BEFORE NOON', bg: '#1c2a24' },
      { t: 'uprightPiano', id: 'piano', p: [5.34, 1.55], r: -90 },
      { t: 'stool', p: [4.62, 1.55], h: 0.5 },
      { t: 'foldFrame', wall: 'e', at: -0.45, art: 'grid', i: 1, w: 0.5, h: 0.5, y: 1.9 },
      { t: 'foldFrame', wall: 'e', at: 0.3, art: 'chess', w: 0.42, h: 0.42, y: 1.9 },
      { t: 'sconce', wall: 'e', at: 3.2, y: 1.85 },
    ],
  },

  // ---------------------------------------- the Crux, over the coffee house
  crux: {
    size: [5.6, 4.6],
    height: 2.45,
    floor: 'floorPlanks',
    walls: 'wallAttic',
    ceiling: 'woodBlack',
    ambient: { sky: 0x7f9cb6, ground: 0x241f1a, fog: 0x0a0f12, hemi: 0.5, density: 0.03, exposure: 1.45, storm: true, moon: { from: 'n', intensity: 3.4, elevation: 28, skew: 0.2 } },
    windows: [{ wall: 'n', at: 0.5, w: 1.2, h: 1.1, sill: 0.9, cols: 2, rows: 2 }],
    // Through the door you have just broken in: the editor in his armchair, turned from his desk to face you.
    spawn: { p: [1.75, 1.55], yaw: 28, pitch: -10 },
    lights: [
      down(0.35, 1.92, 0.25, 14, [0.25, 0.7, -0.7], { shadow: true, distance: 7 }),
      // The night at the window, on his desk.
      { p: [0.5, 1.55, -1.95], color: COOL, intensity: 2.8, distance: 4.5 },
    ],
    props: [
      { t: 'beam', p: [0, -1.1], len: 5.6 },
      { t: 'beam', p: [0, 1.1], len: 5.6 },
      // The editor's desk, under the window: the leader he stopped in the middle of, the proofs, the spike.
      { t: 'desk', p: [0.5, -1.9], r: 0, w: 1.8, d: 0.7, mat: 'woodDark' },
      { t: 'typewriter', id: 'typewriter_voss', p: [0.78, -1.86], y: 0.765, r: 0 },
      { t: 'sheets', p: [0.16, -1.82], y: 0.765, kind: ['proof', 'grid', 'crossword'], n: 4, spread: 0.12, pens: 1 },
      { t: 'hotspot', id: 'voss_desk', p: [0.16, -1.82], y: 0.765, w: 0.4, h: 0.1, d: 0.42 },
      { t: 'deskSpike', id: 'spike', p: [1.25, -2.05], y: 0.765 },
      { t: 'deskLamp', p: [-0.28, -2.1], y: 0.765, r: 25, intensity: 3 },
      { t: 'bellowsOutlet', id: 'tube_voss', wall: 'n', at: 1.75, y: 1.25, label: 'CRUX', open: true },
      { t: 'wasteBasket', p: [1.62, -1.6], full: 7 },
      // His armchair, turned to the door, and the cup he carried up from tea.
      { t: 'armchair', p: [0.2, -0.85], r: 30, mat: 'leather' },
      { t: 'hotspot', id: 'voss_chair', p: [0.68, -0.52], y: 0.3, w: 0.3, h: 0.36, d: 0.3 },
      { t: 'table', p: [-0.6, -0.75], w: 0.45, d: 0.4, h: 0.6, mat: 'woodDark' },
      { t: 'hallCup', id: 'flask_voss', p: [-0.6, -0.75], y: 0.6, kind: 'grid', pencil: true },
      { t: 'sheets', p: [0.62, -0.2], y: 0.004, kind: 'green', n: 1, neat: true, r: 30 },
      // When he is dead: { t: 'dustSheet', p: [0.2, -0.85], r: 30, if: 'flag:voss_dead' } (and the armchair hidden).
      // West side: the stove, the type cabinet, what is pinned and what is hung to dry.
      { t: 'stove', p: [-1.9, -1.85], intensity: 3.6 },
      { t: 'foldFrame', wall: 'n', at: -1.05, art: 'crux', i: 1, w: 0.44, h: 0.58, y: 1.62 },
      { t: 'planChest', p: [-2.42, -0.6], r: 90, w: 1.1, d: 0.7, h: 0.95, drawers: 9, mat: 'woodDark' },
      { t: 'paperBundles', p: [-2.42, -0.85], y: 0.95, n: 2 },
      { t: 'cruxPaper', p: [-2.4, -0.3], y: 0.95, r: 80, folded: false },
      { t: 'titheWall', wall: 'w', at: -0.6, w: 1.2, h: 0.9, y: 1.62, loose: 4 },
      { t: 'proofLine', p: [-1.95, 1.05], r: 90, len: 2.0, hgt: 2.02 },
      { t: 'paperBundles', p: [-2.4, 1.9], n: 3 },
      { t: 'paperBundles', p: [-2.35, 1.3], n: 2, r: 12 },
      // East side: the files, the door.
      { t: 'shelf', p: [2.62, -1.0], r: -90, w: 1.9, h: 2.1, fill: ['files', 'boxes', 'files', 'books', 'files'] },
      { t: 'sign', wall: 'e', at: 0.7, y: 1.98, w: 1.2, h: 0.32, text: 'THE CRUX', sub: 'ONE ANSWER', bg: '#161210' },
      { t: 'lockDoor', id: 'door_voss', wall: 's', at: 1.6, mat: 'woodLight', h: 1.9, forced: true, n: 7, word: 'QUIBBLE' },
      { t: 'foldClock', wall: 'e', at: 1.55, y: 1.9, rad: 0.17 },
      { t: 'rug', p: [0.4, 0.3], w: 2.6, d: 1.8, color: '#2b3340', accent: '#8a7a50' },
      { t: 'pendant', p: [0.35, 0.25], hang: 2.0, shade: 'iron', light: false },
    ],
  },

  // ------------------------------------------------- No. 4, the Almshouses
  almshouse: {
    size: [5.0, 4.4],
    height: 2.5,
    floor: 'floorWood',
    walls: 'wallCream',
    wainscot: { mat: 'woodPaintWhite', h: 0.9 },
    ceiling: '#4a443a',
    trim: 'woodPaintWhite',
    ambient: { sky: 0x7f9cb6, ground: 0x2a2018, fog: 0x0b1114, hemi: 0.52, density: 0.024, exposure: 1.45, storm: true, moon: { from: 'n', intensity: 2.4, elevation: 28, skew: 0.2 } },
    windows: [{ wall: 'n', at: -0.5, w: 1.6, h: 1.35, sill: 0.75, cols: 3, rows: 2, frame: 'woodPaintWhite' }],
    // In at her door: Dame Hesper in her chair by the garden window, the crossword on its tray under the lamp.
    spawn: { p: [1.25, 1.35], yaw: 38, pitch: -10 },
    lights: [
      // The night in the garden, at the window.
      { p: [-0.5, 1.5, -1.85], color: COOL, intensity: 2.8, distance: 4.5 },
    ],
    props: [
      { t: 'rug', p: [-0.2, -0.2], w: 3.0, d: 2.2, color: '#5a2630', accent: '#c9b27c' },
      // The window on the garden, her chair by it, her table.
      { t: 'gardenView', p: [-0.5, -2.335], y: 0.75, w: 1.6, h: 1.35 },
      { t: 'windowSill', id: 'garden_window', wall: 'n', at: -0.5, y: 0.75, w: 1.8 },
      { t: 'curtain', p: [-1.52, -2.1], bottom: 0.3, h: 1.98, w: 0.36, mat: 'fabricWine', rod: 2.3, rodX: 1.02 },
      { t: 'curtain', p: [0.52, -2.1], bottom: 0.3, h: 1.98, w: 0.36, mat: 'fabricWine', rod: 0 },
      { t: 'armchair', p: [-1.55, -1.3], r: 80 },
      { t: 'floorLamp', p: [-2.2, -1.9], intensity: 4 },
      { t: 'roundTable', id: 'hesper_table', p: [-0.55, -1.45], r: 0.3, h: 0.64 },
      { t: 'cruxPaper', p: [-0.6, -1.38], y: 0.652, r: 80, filled: true, tray: true },
      { t: 'oilLamp', p: [-0.42, -1.64], y: 0.64, intensity: 4.4 },
      { t: 'posy', p: [-0.05, -2.11], y: 0.75 },
      { t: 'model', m: 'potted_plant', p: [-1.15, -2.1], y: 0.75, r: 30 },
      // Tea, within her reach: a cosy, one cup, bread and butter cut thin.
      { t: 'table', p: [-1.2, -0.5], w: 0.6, d: 0.45, h: 0.5, mat: 'woodDark' },
      { t: 'teaTray', id: 'tea_tray', p: [-1.27, -0.5], y: 0.5, r: 0, cosy: 'fabricWine', kind: 'plain', bread: true, breadX: 0.3, breadZ: 0.02 },
      // West wall: the fire, and the photograph over it.
      { t: 'fireplace', p: [-2.3, 0.75], r: 90, w: 1.2, lit: true, intensity: 5, mat: 'wallBrick' },
      { t: 'frame', id: 'photo_hall', wall: 'w', at: 0.75, art: 'photo:desk', w: 0.5, h: 0.36, y: 1.78 },
      { t: 'model', m: 'mantel_clock', p: [-2.3, 0.32], y: 1.51, r: 90 },
      { t: 'candlestick', p: [-2.3, 1.2], y: 1.51 },
      // South wall: forty years of her papers in the Company's blue cloth, and the door on its night latch.
      { t: 'blueShelf', id: 'bookshelf_hesper', p: [-1.35, 2.04], r: 180, w: 1.5, h: 1.35 },
      { t: 'model', m: 'potted_plant', p: [-1.75, 2.04], y: 1.35, r: 60 },
      { t: 'lockDoor', id: 'night_latch', wall: 's', at: 0.95, lock: 'night', mat: 'woodPaintGreen', frame: 'woodPaintWhite', h: 2.0 },
      // East wall: the bed, made; the visitors' book.
      { t: 'bed', p: [1.98, -0.95], blanket: 'fabricWine' },
      { t: 'certificate', wall: 'e', at: -1.3, y: 1.62, w: 0.36, h: 0.46, sub: 'SETTER TO THE COMPANY, FORTY YEARS' },
      { t: 'foldFrame', wall: 'e', at: -0.55, art: 'grid', i: 2, w: 0.42, h: 0.42, y: 1.66 },
      { t: 'table', p: [2.28, 1.3], r: 90, w: 0.8, d: 0.36, h: 0.8, mat: 'woodDark' },
      { t: 'ledger', id: 'visitors_book', p: [2.26, 1.18], y: 0.8, r: -90 },
      { t: 'oilLamp', p: [2.3, 1.58], y: 0.8, intensity: 3.2 },
    ],
  },

  // -------------------------------------------- the Repository, under the Hall
  repository: {
    size: [12, 9],
    height: 2.7,
    floor: 'floorStone',
    walls: 'wallBrick',
    ceiling: '#1c1614',
    skirting: false,
    ambient: { sky: 0x8fb0b8, ground: 0x1e2626, fog: 0x0a1214, hemi: 0.45, density: 0.022, exposure: 1.42 },
    // In at the east door, looking the length of the vault: the basket on the left, the Late Tithes on the right, the Lectern at the far end.
    spawn: { p: [5.0, 0.0], yaw: 90, pitch: -9 },
    lights: [
      // A lamp over the aisle, on whoever is standing in it.
      { p: [-2.2, 2.15, 0.6], color: WARM, intensity: 13, distance: 7, spot: { angle: 1.0, penumbra: 0.75, target: [-2.9, 0.9, 0.9] }, shadow: true },
      // The cases, lit like a jeweller's.
      { p: [-1.2, 1.5, -1.45], color: 0xcfe8ff, intensity: 4.8, distance: 5.5 },
      // The basket's own lamp.
      { p: [0, 2.5, 1.6], color: 0xffe2b8, intensity: 9.4, distance: 5, spot: { angle: 0.5, penumbra: 0.6, target: [0, 0.9, 1.6] } },
      // By the door, and the Engine's own green.
      { p: [4.6, 2.2, 0.9], color: WARM, intensity: 3.2, distance: 6 },
      { p: [-4.85, 1.2, -1.75], color: 0x6cffb0, intensity: 2, distance: 3.5 },
    ],
    props: [
      // The vault: four ribs across the room, and the feet of their piers.
      { t: 'vaultRib', p: [-3.6, 0], r: 90, span: 9, spring: 1.7 },
      { t: 'vaultRib', p: [-1.2, 0], r: 90, span: 9, spring: 1.7 },
      { t: 'vaultRib', p: [1.2, 0], r: 90, span: 9, spring: 1.7 },
      { t: 'vaultRib', p: [3.6, 0], r: 90, span: 9, spring: 1.7 },
      { t: 'blocker', p: [-3.6, 4.25], w: 0.5, d: 0.5 },
      { t: 'blocker', p: [-1.2, 4.25], w: 0.5, d: 0.5 },
      { t: 'blocker', p: [1.2, 4.25], w: 0.5, d: 0.5 },
      { t: 'blocker', p: [3.6, 4.25], w: 0.5, d: 0.5 },
      { t: 'blocker', p: [-3.6, -4.25], w: 0.5, d: 0.5 },
      { t: 'blocker', p: [-1.2, -4.25], w: 0.5, d: 0.5 },
      { t: 'blocker', p: [1.2, -4.25], w: 0.5, d: 0.5 },
      { t: 'blocker', p: [3.6, -4.25], w: 0.5, d: 0.5 },
      { t: 'door', wall: 'e', at: 0, mat: 'woodDark' },
      // By the door: an early Tithe, for comparison, and the Rolls.
      { t: 'vitrine', id: 'early_case', p: [4.7, -1.9], tall: true, sheets: ['notes'], light: false },
      { t: 'rollStand', id: 'rolls', p: [4.5, 2.6], r: 180 },
      // Along the aisle: the Late Tithes on one side, the basket on the other.
      { t: 'vitrine', p: [2.4, -1.6], w: 1.9, tithes: 2012, count: 4 },
      { t: 'vitrine', id: 'vitrines', p: [0, -1.6], w: 1.9, tithes: 2016, count: 4 },
      { t: 'vitrine', p: [-2.4, -1.6], w: 1.9, tithes: 2020, count: 4 },
      { t: 'paintedBoard', p: [-0.2, -1.6], r: 90, y: 2.2, w: 1.9, h: 0.42, chains: true, lines: ['THE LATE TITHES', 'OF DAME HESPER LORIMER'] },
      { t: 'relicBasket', id: 'waste_basket', p: [0, 1.6], light: false, plate: 'H. LORIMER', sub: '1972 – 2011' },
      // The far end: the Lectern, the Engine it speaks for, and Jonah's desk.
      { t: 'rug', p: [-4.4, 0], w: 2.4, d: 2.4, color: '#1f2a3c', accent: '#8a7a50' },
      { t: 'lectern', id: 'lectern', p: [-4.6, 0], r: 90, intensity: 4.6 },
      { t: 'cable', p: [-4.6, 0], pts: [[-0.3, -0.1], [-0.6, -0.6], [-0.7, -1.15]] },
      { t: 'brassPlate', wall: 'w', at: 0, y: 1.95, w: 0.9, h: 0.2, text: 'THE LORIMER ENGINE', sub: 'ASK IT ANYTHING' },
      { t: 'serverRack', id: 'server', p: [-5.5, -1.75], r: 90, n: 2 },
      { t: 'techDesk', id: 'jonah_desk', p: [-5.4, 1.95], r: 90, intensity: 4.4 },
      { t: 'officeChair', p: [-4.5, 1.95], r: -90 },
      { t: 'boxes', p: [-5.4, 3.55], n: 2 },
      { t: 'pendant', p: [-2.2, 0.6], hang: 2.25, light: false },
      // The stacks, in the south bays.
      { t: 'shelf', p: [2.23, 3.25], r: -90, w: 2.0, h: 2.2, d: 0.34, mat: 'wood', fill: ['boxes', 'files', 'files', 'boxes', 'files'] },
      { t: 'shelf', p: [2.57, 3.25], r: 90, w: 2.0, h: 2.2, d: 0.34, mat: 'wood', fill: ['files', 'boxes', 'files', 'files', 'boxes'] },
      { t: 'shelf', p: [-0.17, 3.25], r: -90, w: 2.0, h: 2.2, d: 0.34, mat: 'wood', fill: ['files', 'files', 'boxes', 'files', 'books'] },
      { t: 'shelf', p: [0.17, 3.25], r: 90, w: 2.0, h: 2.2, d: 0.34, mat: 'wood', fill: ['boxes', 'files', 'files', 'books', 'files'] },
      { t: 'shelf', p: [-2.57, 3.25], r: -90, w: 2.0, h: 2.2, d: 0.34, mat: 'wood', fill: ['files', 'boxes', 'books', 'files', 'files'] },
      { t: 'shelf', p: [-2.23, 3.25], r: 90, w: 2.0, h: 2.2, d: 0.34, mat: 'wood', fill: ['books', 'files', 'boxes', 'files', 'boxes'] },
      { t: 'brassPlate', p: [2.4, 2.24], y: 1.5, r: 180, w: 0.24, h: 0.1, text: 'A – H' },
      { t: 'brassPlate', p: [0, 2.24], y: 1.5, r: 180, w: 0.24, h: 0.1, text: 'I – P' },
      { t: 'brassPlate', p: [-2.4, 2.24], y: 1.5, r: 180, w: 0.24, h: 0.1, text: 'Q – Z' },
      { t: 'model', m: 'ladder', p: [1.2, 3.7], r: -40 },
      // The north bays, behind the cases.
      { t: 'scrollRack', p: [2.4, -4.3], w: 1.9, h: 1.3, base: 0.5, cols: 7, rows: 4 },
      { t: 'foldFrame', wall: 'n', at: 0, art: 'plan', w: 0.9, h: 0.6, y: 1.7 },
      { t: 'trunk', p: [0, -4.15] },
      { t: 'plinth', p: [-2.4, -4.15], h: 1.0, size: 0.4 },
      { t: 'model', m: 'bust', p: [-2.4, -4.15], y: 1.0, r: 10 },
      { t: 'boxes', p: [-4.6, -4.0], n: 3 },
    ],
  },

  // ----------------------------------------- the Lantern, on top of the Hall
  lantern: {
    shape: 'round',
    radius: 4.6,
    height: 3.5,
    panes: 16,
    doorPanes: [],
    floor: 'floorPlanks',
    walls: 'wallPanel',
    ceiling: 'woodBlack',
    ambient: { sky: 0x86a8c4, ground: 0x22222a, fog: 0x070c10, hemi: 0.5, density: 0.02, exposure: 1.48, storm: true, glass: 0xc8d8e8, moon: { from: 'n', intensity: 1.4, elevation: 40, skew: 0.5 } },
    // Up through the trap: the Orrery in its cage in front of you, the Warden on the floor inside the gate. The Porter is behind you.
    spawn: { p: [0, 3.0], yaw: 0, pitch: -14 },
    lights: [
      // What comes down through the glass of the roof.
      { p: [0, 3.3, 0.6], color: 0x9fc4e8, intensity: 12, distance: 9, spot: { angle: 0.8, penumbra: 0.8, target: [0, 0.6, 0.2] }, shadow: true },
    ],
    props: [
      { t: 'orrery', id: 'orrery', p: [0, 0], s: 0.9, lit: false },
      { t: 'grille', p: [0, 0], rad: 1.46 },
      { t: 'letterLock', id: 'grille_lock', p: [0.2, 1.48], y: 0.9, n: 7 },
      // The lamp the Warden brought in with him to wind by.
      { t: 'lantern', p: [0.52, 1.08], intensity: 4.6, distance: 7 },
      { t: 'trapdoor', id: 'stair_door', p: [0, 3.62], r: 180, second: [1.05, 0.07] },
      // The proving desk, west, carried up from the Hall, and the paper set for him on it.
      { t: 'table', id: 'proving_desk', p: [-3.05, 0.2], r: 90, w: 1.0, d: 0.6, h: 0.76, mat: 'woodDark' },
      { t: 'chair', p: [-3.72, 0.2], r: 90 },
      { t: 'sheets', p: [-3.05, 0.12], y: 0.76, kind: 'warden', n: 1, neat: true, pens: 1, r: 90 },
      { t: 'candlestick', p: [-3.1, 0.58], y: 0.76, lit: true, light: true, intensity: 2.2 },
      // The back of the room, by the stair: the invigilator's chair, his clock at his elbow, the lamp he carried up.
      { t: 'chair', p: [1.565, 3.663], r: -150 },
      { t: 'standClock', id: 'hob_clock', p: [2.4, 2.95], r: -140, time: '11:49' },
      { t: 'lantern', p: [1.0, 3.98], intensity: 5, distance: 9, s: 1.15 },
      { t: 'hotspot', id: 'lantern_lamp', p: [1.0, 3.98], w: 0.26, h: 0.44, d: 0.26 },
      { t: 'telescope', p: [-2.3, -2.75], r: 220 },
      { t: 'stool', p: [3.2, 1.9], h: 0.5 },
      { t: 'books', p: [3.2, 1.9], y: 0.52, n: 3 },
    ],
  },
};

/**
 * Where people stand in each room: clear floor in front of them, a lamp on
 * the side you come from, and something lit behind them. `r` is the way they
 * face (the door, as a rule). Those who sit are given their chair's seat.
 */
export const PLACES = {
  gatehouse: { kit: { p: [1.95, -0.9], r: -13 } },
  hall: { hob: { p: [4.45, 3.9], r: 180 }, clay: { p: [5.0, -4.3], r: 0 }, kit: { p: [-3.6, -3.85], r: 25 } },
  clockshop: { kit: { p: [-2.35, -1.2], r: -10 }, wilf: { p: [-3.3, 0.45], r: 95 } },
  wheelshop: { quoin: { p: [0.75, -2.15], r: 0 } },
  mortuary: { marsh: { p: [-0.75, 1.3], r: 72 } },
  meridian: { nell: { p: [-0.6, 1.12], r: -100 }, kit: { p: [3.3, 0.1], r: -90 } },
  stalemate: { ottilie: { p: [0.7, -2.87], r: 0 }, jonah: { p: [3.3, -0.9], r: -90 } },
  crux: { voss: { p: [0.26, -0.75], r: 30, pose: 'sit' } },
  almshouse: { hesper: { p: [-1.43, -1.28], r: 80, pose: 'sit' }, dolores: { p: [1.15, -0.75], r: 3 } },
  repository: { jonah: { p: [-3.2, 1.0], r: 90 } },
  // The Porter sits behind whoever comes up the stair; the Warden is inside the grille, on the floor behind its gate.
  lantern: { hob: { p: [1.5, 3.55], r: -150, pose: 'sit' }, clay: { p: [-0.3, 1.08], r: 10, pose: 'slumped' } },
};
