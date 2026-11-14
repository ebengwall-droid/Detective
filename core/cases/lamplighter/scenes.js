// 3D layouts for every location in The Lamplighter.
//
// Pure data: the client's scene builder turns these into geometry. Units are
// metres, origin at the room's centre, +X east, +Z south. `r` is degrees about
// the vertical axis; r = 0 faces south. Props with an `id` can carry hotspots.

const NIGHT = { sky: 0x7d9ab0, ground: 0x3d2e22, fog: 0x0d171c };

export const SCENES = {
  // ------------------------------------------------------------- precinct
  precinct: {
    size: [14, 10],
    height: 3.3,
    floor: 'floorWoodDark',
    walls: 'wallTeal',
    wainscot: { mat: 'wallPanel', h: 1.05 },
    ambient: { ...NIGHT, hemi: 1.0, density: 0.022, exposure: 1.45, storm: true, moon: { from: 'n', intensity: 3.2, elevation: 30, skew: 0.3 } },
    windows: [
      { wall: 'n', at: -5.2, w: 1.5, h: 1.95, sill: 0.85, blinds: 0.85 },
      { wall: 'n', at: -2.2, w: 1.5, h: 1.95, sill: 0.85, blinds: 0.85 },
      { wall: 'n', at: 0.8, w: 1.5, h: 1.95, sill: 0.85, blinds: 0.7 },
      { wall: 'n', at: 5.1, w: 1.5, h: 1.95, sill: 0.85, blinds: 1 },
    ],
    spawn: { p: [1.6, 3.6], yaw: 25 },
    props: [
      // The player's desk, under the west windows.
      { t: 'desk', id: 'my_desk', p: [-5.2, -3.5], r: 180 },
      { t: 'officeChair', p: [-5.2, -4.25], r: 0 },
      { t: 'laptop', id: 'laptop', p: [-5.25, -3.45], y: 0.765, r: 180 },
      { t: 'deskLamp', p: [-5.75, -3.3], y: 0.765, r: 150 },
      { t: 'tray', id: 'inbox', p: [-4.68, -3.5], y: 0.765, r: 180 },
      { t: 'mug', p: [-5.72, -3.62], y: 0.765 },
      { t: 'nameplate', p: [-5.2, -3.2], y: 0.765, text: 'DETECTIVE' },
      // Vance's desk.
      { t: 'desk', id: 'vance_desk', p: [-2.2, -3.5], r: 180 },
      { t: 'officeChair', p: [-2.25, -4.3], r: 15 },
      { t: 'typewriter', p: [-2.2, -3.55], y: 0.765, r: 180 },
      { t: 'deskLamp', p: [-1.65, -3.3], y: 0.765, r: 200 },
      { t: 'folder', p: [-2.72, -3.4], y: 0.765 },
      { t: 'mug', p: [-1.72, -3.66], y: 0.765 },
      { t: 'nameplate', p: [-2.2, -3.2], y: 0.765, text: 'DS N. VANCE' },
      { t: 'radiator', p: [-3.7, -4.86], r: 0 },
      { t: 'radiator', p: [0.8, -4.86], r: 0 },
      // Bullpen.
      { t: 'desk', p: [-0.6, 0.3], r: 0, mat: 'woodDark' },
      { t: 'chair', p: [-0.6, 1.05], r: 180 },
      { t: 'deskLamp', p: [-1.1, 0.2], y: 0.765, lit: false },
      { t: 'papers', p: [-0.4, 0.35], y: 0.765, n: 4, title: 'INCIDENT REPORT' },
      { t: 'phone', p: [-0.05, 0.15], y: 0.765, r: 20 },
      { t: 'desk', p: [-0.6, -0.5], r: 180, mat: 'woodDark' },
      { t: 'chair', p: [-0.55, -1.25], r: 10 },
      { t: 'typewriter', p: [-0.7, -0.5], y: 0.765, r: 180 },
      { t: 'boxes', p: [0.55, -0.9], n: 3 },
      // Case board, west wall.
      { t: 'caseBoard', id: 'board', wall: 'w', at: -1.2, w: 2.6, h: 1.35, y: 1.6 },
      { t: 'frame', wall: 'w', at: -3.6, art: 'chart', w: 1.3, h: 0.9, y: 1.65 },
      // Evidence cage, south-west corner.
      { t: 'cage', p: [-5.6, 1.7], len: 2.8 },
      { t: 'cage', id: 'cage_door', p: [-3.4, 3.35], r: 90, len: 3.3 },
      { t: 'shelf', id: 'evidence_shelves', p: [-6.78, 3.4], r: 90, w: 2.6, h: 2.2, d: 0.4, mat: 'steelDark', fill: ['boxes', 'files', 'boxes', 'none', 'boxes'] },
      { t: 'cabinet', id: 'drug_locker', p: [-4.3, 4.65], r: 180, drawers: 3, mat: 'iron' },
      { t: 'boxes', p: [-5.3, 4.5], n: 2 },
      { t: 'striplight', p: [-5.3, 3.4], len: 1.2, r: 90, intensity: 5, distance: 6, flicker: true },
      // South wall: exit, benches, files.
      { t: 'door', id: 'exit', wall: 's', at: 2.2, glass: true, text: 'DETECTIVE', sub: 'BUREAU' },
      { t: 'bench', p: [4.6, 4.72], r: 180, w: 1.8, back: true },
      { t: 'cabinet', p: [-0.2, 4.66], r: 180 },
      { t: 'cabinet', p: [-0.72, 4.66], r: 180 },
      { t: 'cabinet', p: [-1.24, 4.66], r: 180, drawers: 3 },
      { t: 'waterCooler', p: [0.75, 4.7], r: 180 },
      { t: 'coffee', p: [6.45, 2.4], r: -90 },
      { t: 'frame', wall: 's', at: 4.6, art: 'notice:DUTY ROSTER', w: 0.6, h: 0.8, y: 1.7 },
      { t: 'clock', wall: 's', at: 0.3, y: 2.55, time: '08:40' },
      { t: 'coatrack', p: [3.2, 4.5], hat: true },
      { t: 'plant', p: [6.5, 4.4] },
      // The captain's office, north-east corner.
      { t: 'glassWall', p: [5.35, -1.2], len: 3.3, text: 'CAPT. D. HALE', sub: 'HARBOUR DIVISION', textX: 0.2, blinds: true },
      { t: 'glassWall', p: [2.7, -3.1], r: 90, len: 3.8, blinds: true },
      { t: 'desk', id: 'hale_desk', p: [5.2, -3.3], r: 0, w: 1.7, mat: 'woodDark' },
      { t: 'officeChair', p: [5.2, -4.1], r: 0, mat: 'leatherOxblood' },
      { t: 'chair', p: [4.8, -2.3], r: 170 },
      { t: 'deskLamp', p: [5.85, -3.4], y: 0.765, r: -20, intensity: 2.6 },
      { t: 'phone', p: [4.55, -3.35], y: 0.765, r: 10 },
      { t: 'papers', p: [5.15, -3.2], y: 0.765, n: 2 },
      { t: 'ashtray', p: [5.5, -3.05], y: 0.765 },
      { t: 'nameplate', p: [5.2, -2.98], y: 0.765, text: 'CAPT. D. HALE' },
      { t: 'frame', id: 'petrel_photo', wall: 'e', at: -3.2, art: 'photo:crew', w: 0.62, h: 0.44, y: 1.7 },
      { t: 'frame', wall: 'e', at: -2.2, art: 'photo:harbor', w: 0.4, h: 0.5, y: 1.72 },
      { t: 'cabinet', id: 'hale_cabinet', p: [6.68, -4.3], r: -90, mat: 'woodDark', front: 'wood' },
      { t: 'coatrack', p: [3.2, -4.55], hat: true, coatColor: '#3a332a' },
      { t: 'rug', p: [5.0, -2.9], w: 3.2, d: 2.6, color: '#2b3340', accent: '#8a7a50' },
      // Overhead.
      { t: 'ceilingFan', p: [-3.6, -1.6], speed: 1.1 },
      { t: 'ceilingFan', p: [0.6, 1.8], speed: 0.9 },
      { t: 'pendant', p: [-0.6, -0.1], hang: 2.25, intensity: 16, distance: 10 },
      { t: 'pendant', p: [-4.2, -0.6], hang: 2.25, intensity: 12, distance: 9 },
      { t: 'pendant', p: [3.6, 2.4], hang: 2.25, intensity: 12, distance: 9, flicker: 0.1 },
    ],
  },
};
