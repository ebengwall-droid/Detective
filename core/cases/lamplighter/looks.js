// How each character looks in the 3D world. Kept apart from the script so the
// art can be tuned without touching who knows what.
//
// `model` names the modelled, animated person to use (public/assets/characters).
// The rest describes a figure the game can draw in code if that model is not
// available, and says what they carry.

export const LOOKS = {
  // Detective Sergeant Nora Vance, your partner. Note the bosun's whistle:
  // it hangs on a brass chain until the night Conrad Vale dies.
  vance: {
    model: 'vance',
    build: 'slim',
    height: 0.98,
    skin: '#d2a184',
    hair: { style: 'bob', color: '#4a2a1c' },
    coat: { color: '#33424f', length: 'long', open: true },
    shirt: '#c8c2b0',
    trousers: '#1f2328',
    accessories: ['whistle'],
  },
  // Captain Desmond Hale. Big, slow, leans on a cane.
  hale: {
    model: 'hale',
    build: 'heavy',
    height: 1.05,
    skin: '#c9977a',
    hair: { style: 'balding', color: '#9a968c' },
    moustache: '#9a968c',
    coat: { color: '#2f3033', length: 'vest' },
    shirt: '#d0ccc0',
    tie: '#5e1f1c',
    trousers: '#2a2b2e',
    accessories: ['cane', 'badge'],
  },
  // Dr. Ansel Okoro, medical examiner.
  okoro: {
    model: 'okoro',
    build: 'medium',
    height: 1.0,
    skin: '#7a5240',
    hair: { style: 'short', color: '#3a3836' },
    beard: '#4a4744',
    glasses: true,
    coat: { color: '#d4d6d0', length: 'labcoat' },
    shirt: '#4f7a80',
    trousers: '#3a4a50',
    accessories: ['clipboard'],
  },
  // Officer Teodor Brandt, scene-of-crime technician.
  brandt: {
    model: 'brandt',
    build: 'medium',
    height: 1.02,
    skin: '#e0b79a',
    hair: { style: 'crop', color: '#b08a50' },
    coat: { color: '#1f2f45', length: 'jacket' },
    shirt: '#1f2f45',
    trousers: '#1f2f45',
    hat: 'police',
    hatColor: '#162234',
    accessories: ['camera', 'badge'],
  },
  // Agnes Dray, Leland Brook's housekeeper.
  dray: {
    model: 'dray',
    build: 'heavy',
    height: 0.93,
    skin: '#d9ad92',
    hair: { style: 'bun', color: '#8f8a84' },
    coat: { color: '#5a3848', length: 'cardigan' },
    shirt: '#b9b2a2',
    trousers: '#3a3436',
    accessories: [],
  },
  // Bess Carrow, landlady of the Anchor & Lamp.
  carrow: {
    model: 'carrow',
    build: 'heavy',
    height: 0.95,
    skin: '#d6a88c',
    hair: { style: 'wild', color: '#d8d4cc' },
    coat: { color: '#2f4a3c', length: 'apron' },
    shirt: '#a8a290',
    trousers: '#2a2622',
    accessories: ['towel'],
  },
  // Milo Strand, crime reporter for the Greyhaven Ledger.
  strand: {
    model: 'strand',
    build: 'slim',
    height: 1.0,
    skin: '#b8866a',
    hair: { style: 'short', color: '#1c1814' },
    hat: 'fedora',
    hatColor: '#4a4034',
    moustache: '#1c1814',
    coat: { color: '#8a7a5c', length: 'long', open: true },
    shirt: '#d0cab8',
    tie: '#27344a',
    trousers: '#33302a',
    accessories: ['notepad'],
  },
  // Tobias Fenn, lamp-maker.
  fenn: {
    model: 'fenn',
    build: 'slim',
    height: 1.03,
    skin: '#cfa58a',
    hair: { style: 'wild', color: '#c8c4ba' },
    beard: '#c8c4ba',
    glasses: true,
    coat: { color: '#5a4630', length: 'apron' },
    shirt: '#6a6658',
    trousers: '#38332c',
    accessories: [],
  },
  // Isolde Vale, Conrad Vale's wife.
  ivale: {
    model: 'ivale',
    build: 'slim',
    height: 1.0,
    skin: '#e3bfa6',
    hair: { style: 'bun', color: '#c9b48a' },
    coat: { color: '#1f3a34', length: 'dress' },
    shirt: '#1f3a34',
    trousers: '#1a1a1c',
    scarf: '#b8a47a',
    accessories: [],
  },
};
