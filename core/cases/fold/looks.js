// How each character of The Invigilator looks in the 3D world. Kept apart from
// the script so the art can be tuned without touching who knows what.
//
// `model` names the modelled, animated person to use (public/assets/characters).
// The rest describes a figure the game can draw in code if that model is not
// available, and says what they carry.

export const LOOKS = {
  // DC Kit Quoin, your partner: Fold-born, and the only one of them in the police.
  kit: {
    model: 'kit',
    build: 'slim',
    height: 0.97,
    skin: '#d9a98a',
    hair: { style: 'bob', color: '#5a3a26' },
    coat: { color: '#4a3528', length: 'short', open: true },
    shirt: '#8c3b46',
    trousers: '#3b4a5c',
    accessories: ['notepad'],
  },
  // Hob Fettle, porter of Setters' Hall these forty-six years.
  hob: {
    model: 'hob',
    build: 'medium',
    height: 1.02,
    skin: '#cfa58a',
    hair: { style: 'balding', color: '#8f8b84' },
    coat: { color: '#6d7078', length: 'vest' },
    shirt: '#8a8d94',
    tie: '#22252b',
    trousers: '#2a2c31',
    accessories: [],
  },
  // Dame Hesper Lorimer, who set the Company's hardest papers for forty years.
  hesper: {
    model: 'hesper',
    build: 'slim',
    height: 0.95,
    skin: '#e0b9a3',
    hair: { style: 'bun', color: '#b9b3a6' },
    coat: { color: '#6e2a33', length: 'short', open: true },
    shirt: '#b8ab98',
    trousers: '#3a302c',
    accessories: [],
  },
  // Auberon Clay, Warden of the Company.
  clay: {
    model: 'clay',
    build: 'medium',
    height: 1.03,
    skin: '#d6a98e',
    hair: { style: 'short', color: '#a9a59b' },
    coat: { color: '#5c5548', length: 'short', open: true },
    shirt: '#7b2f33',
    trousers: '#2c2d31',
    accessories: [],
  },
  // Jonah Okafor-Reed, who built the Lectern.
  jonah: {
    model: 'jonah',
    build: 'slim',
    height: 1.02,
    skin: '#8a5a3c',
    hair: { style: 'curly', color: '#1c1512' },
    coat: { color: '#2e3230', length: 'short', open: true },
    shirt: '#3d7ea6',
    trousers: '#5a4a36',
    accessories: [],
  },
  // Tamsin Quoin, wheelwright; Kit's grandmother.
  quoin: {
    model: 'quoin',
    build: 'slim',
    height: 0.96,
    skin: '#d8ad94',
    hair: { style: 'bun', color: '#7a5a44' },
    coat: { color: '#8a8478', length: 'short', open: true },
    shirt: '#d8d2c4',
    trousers: '#2f3034',
    accessories: [],
  },
  // Dr Leona Marsh, county pathologist. From the Flat, and glad of it.
  marsh: {
    model: 'marsh',
    build: 'slim',
    height: 0.98,
    skin: '#dcae96',
    hair: { style: 'bun', color: '#2c1f1a' },
    coat: { color: '#e9e9e4', length: 'long', open: true },
    shirt: '#9fc0d8',
    trousers: '#26282c',
    accessories: ['clipboard'],
  },
  // Dolores Abara, the Company's nurse at the Almshouses.
  dolores: {
    model: 'dolores',
    build: 'medium',
    height: 0.98,
    skin: '#9a6a4a',
    hair: { style: 'bun', color: '#1d1512' },
    coat: { color: '#eef0ee', length: 'short' },
    shirt: '#eef0ee',
    trousers: '#e8eae8',
    accessories: [],
  },
  // Ottilie Brandreth, who keeps the Stalemate.
  ottilie: {
    model: 'ottilie',
    build: 'medium',
    height: 1.0,
    skin: '#dfb49c',
    hair: { style: 'bun', color: '#3a2a22' },
    coat: { color: '#f0efea', length: 'long' },
    shirt: '#f0efea',
    trousers: '#2a2a2c',
    accessories: ['towel'],
  },
  // Nell Sixsmith, who works the Cut ferry and takes her toll in riddles.
  nell: {
    model: 'nell',
    build: 'medium',
    height: 0.99,
    skin: '#d2a488',
    hair: { style: 'bob', color: '#c9b27c' },
    coat: { color: '#5a3d2c', length: 'short', open: true },
    shirt: '#22201f',
    trousers: '#8a8468',
    accessories: [],
  },
  // Wilf Tandy, Pendry's apprentice.
  wilf: {
    model: 'wilf',
    build: 'slim',
    height: 0.99,
    skin: '#dcae92',
    hair: { style: 'short', color: '#3d2b1f' },
    coat: { color: '#b9a78c', length: 'short' },
    shirt: '#b9a78c',
    trousers: '#2e2a26',
    accessories: [],
  },
  // Lucan Voss, crossword editor of the Crux, who sets as CENSOR.
  voss: {
    model: 'voss',
    build: 'medium',
    height: 1.0,
    skin: '#d9ab92',
    hair: { style: 'balding', color: '#6f6a62' },
    coat: { color: '#55585e', length: 'vest' },
    shirt: '#9aa0a8',
    trousers: '#3a4458',
    accessories: [],
    pose: 'sit',
  },
};
