// The puzzles of The Invigilator.
//
// Each cipher text here is made from its plain answer by core/ciphers.js when
// the file loads, and the tests undo every one, so the page can never show a
// puzzle that does not come out.
//
// tier     1 a child of the Fold could do it ... 5 a Grand Setter would sweat
// setter   who set it: the Fold (its everyday locks and customs), the
//          Invigilator, or Dame Hesper
// if       when it lies open to the detective
// blocks   what the panel shows, in order:
//            { p }        a paragraph
//            { quote }    words in somebody's hand
//            { mono }     cipher text; `tool` names the solving tool that can work on it
//            { glyphs }   letters to be drawn as pigpen signs
//            { grid }     rows of letters; `caption`
//            { board }    a chessboard of letters with a list of squares
//            { list }     numbered lines
//            { marked }   a sentence in two kinds of letter
// at       the objects in the rooms it lies on (hotspot ids): tapping one picks it up
// ask      the question it asks
// answers  what is accepted (compared in capitals, letters and digits only)
// near     kind words for an answer that is on the way
// feed     its place, 1 to 7, among the Invigilator's questions (the last Paper needs them in order)
// hints    from a nudge to the answer; the last one always gives it away

import { caesar, rot13, vigenere, playfair, baconHide, knightBoard, seeded } from '../../ciphers.js';

const PAPER_1 =
  'CANDIDATE. THE CIPHER HERE IS THE ONE ON THE GATE, EXCEPT THE NUMBER, WHICH I KEEP. A PATIENT PERSON NEEDS ONLY TWENTY-FIVE ATTEMPTS. A CLEVERER ONE SEEKS THE LETTER SEEN MOST AND NAMES IT E. IGNATIUS PENDRY SIGNED A SHEET HE NEVER ONCE READ. SEE IT IN HIS SHOP. TELL ME THE NAME THE BUYERS GIVE THE THING THEY ARE BUYING.';
const PAPER_1B = 'SHE CANNOT SIGN FOR HERSELF NOW. SOMEONE SIGNS FOR HER. FIND OUT WHO. GIVE ME HIS OFFICE, NOT HIS NAME.';
const PAPER_3 =
  'TONIGHT THE PROBLEM ON THE SLATE AT THE STALEMATE IS MINE. SOLVE IT BEFORE THE HALL STRIKES TWELVE AND YOU MAY KEEP THE THIRD OF THEM. WRITE ME WHERE YOU ARE GOING.';
const PAPER_4 =
  'LAY YOUR SEVEN ANSWERS IN A COLUMN IN THE ORDER I SET THEM. TAKE FROM EACH THE LETTER OF ITS OWN NUMBER. THE SEVENTH ANSWER IS TUITION.';
const SLATE = knightBoard('CANDIDATE THREE SETS AS CENSOR', 'b1', seeded(11));

/** The seven answers the last Paper asks for, in the order they were set. */
export const FEEDS = ['paper1a', 'paper1b', 'paper2a', 'paper2b', 'paper3', 'slate', 'paper4'];

/** The Late Tithes shown in the Repository, and one from before, for comparison. */
export const TITHES = {
  y2014: ['ANAGRAM', 'CRYPTIC', 'CHIMERA', 'MOSAICS', 'MEANDER', 'PATIENT', 'RESOLVE'],
  y2018: ['ALMANAC', 'PROBLEM', 'THIMBLE', 'TREACLE', 'ENCODED', 'ANCIENT', 'OBLIQUE'],
  y2022: ['ACROBAT', 'ERRATUM', 'SHINGLE', 'MONARCH', 'THUNDER', 'ELEMENT', 'COMPOSE'],
  y1998: ['QUIXOTE', 'HARMONY', 'SEMINAR', 'PURLOIN', 'GAZETTE', 'CAPSTAN', 'KNOTTED'],
};

// What lies beside a lock on the stage: the things that tell you its word.
const GATE_SLATE = { kind: 'slate', main: caesar('CATCH', 3), note: "yesterday's was better", alt: "The chalk slate by the gate: FDWFK. Under it, smaller: yesterday's was better." };
const GATE_STONE = { kind: 'stone', lines: ['THREE BACK,', 'AS CAESAR WROTE'], scratch: 'every. single. day.', alt: 'Carved in the stone over the gate: THREE BACK, AS CAESAR WROTE.' };
const DOOR_PAPER = { kind: 'card', text: 'The door now opens to one name. It is in everything you sold.', ink: '#1d6b45', alt: 'The Paper that came down his tube: The door now opens to one name. It is in everything you sold.' };
const PENDRY_BLOTTER = { kind: 'blotter', words: ['PENDRYS', 'HOROLOG', 'HESPERL', 'LORIMER', 'VESPERS', 'LORIMER'], heavy: [5], tear: true, tally: 190, alt: 'His blotter: every word he tried on the lock, crossed out.' };
const GRILLE_PAPER = { kind: 'card', text: 'The gate opens to one name. It is in everything you sold.', ink: '#1d6b45', alt: 'The Paper tied to the grille: The gate opens to one name. It is in everything you sold.' };

/** @type {Record<string, any>} */
export const PUZZLES = {
  // ------------------------------------------------------------ the Fold's own
  gate: {
    title: 'The Turnstile',
    // Where it is: tap this in the room to pick it up.
    at: ['turnstile'],
    setter: 'fold',
    tier: 1,
    if: true,
    blocks: [
      { p: 'An old iron turnstile. On its post is a brass lock with five rings of letters. The turnstile will not turn until the rings spell the word of the day.' },
      { p: 'This morning someone chalked these letters on the slate beside it:' },
      { mono: caesar('CATCH', 3) },
      { p: 'Carved into the stone above it, in letters two hundred years old:' },
      { quote: 'THREE BACK, AS CAESAR WROTE.' },
    ],
    ask: 'What word do you set the rings to?',
    goal: "Set the rings to today's word.",
    stage: { kind: 'lock', clues: [GATE_SLATE, GATE_STONE] },
    lock: { rings: 5, start: 'AAAAA' },
    answers: ['CATCH'],
    solved: "C, A, T, C, H. The rings click into place and the turnstile turns.\n\n'You beat me to it,' says Kit. 'Every seven-year-old in the Fold does that on the way to school, so don't let it go to your head. Welcome to the Fold.'\n\nYou push through the turnstile. Kit takes you down Nonesuch Row to the clockmaker's shop.",
    effects: [{ flag: 'through_gate' }],
    // Solving it takes you through: you and Kit go straight to the scene.
    leadsTo: 'clockshop',
    lesson: 'caesar',
    hints: [
      'The letters on the slate are not the word itself. The stone tells you what to do with them.',
      'Take each chalked letter three places back in the alphabet. F becomes C.',
      'F to C, D to A, W to T, F to C, K to H.',
      'The word is CATCH.',
    ],
  },
  fitting: {
    title: 'The Fitting',
    // Where it is: tap this in the room to pick it up.
    at: ['fitting'],
    setter: 'fold',
    tier: 1,
    if: 'met:quoin',
    blocks: [
      { p: 'Mrs Quoin puts a brass wheel in your hand. It has two rings of letters, one inside the other. Then she pushes a strip of paper across the table to you.' },
      { mono: rot13('PATIENCE'), tool: 'wheel' },
      { quote: "Turn it thirteen places round. That's halfway, so the same setting hides a message and also reads it back. Go on, then. I'm timing you, but I won't tell you why." },
    ],
    ask: 'What does the strip say?',
    goal: 'Turn the inner ring thirteen places, then read the strip.',
    stage: { kind: 'wheel', give: 'read' },
    answers: ['PATIENCE'],
    solved: "PATIENCE.\n\n'Hm.' She takes the wheel back and gives you a different one. It is plain brass, heavier, and already warm from her hand. 'Brass wheels are for stubborn people, and that's you. Stubborn will do. Keep it. No charge.'\n\nYou now have a cipher wheel. It can move every letter of a message along the alphabet, one place at a time.",
    effects: [{ flag: 'tool_wheel' }, { notify: 'You have a cipher wheel now. Any puzzle that needs it will show it.' }],
    lesson: 'rot13',
    hints: [
      'Each letter has moved thirteen places along the alphabet. Move it thirteen more and it is back where it started.',
      'A and N change places. So do B and O, C and P, and so on.',
      'C is P, N is A, G is T, V is I.',
      'The strip says PATIENCE.',
    ],
  },
  bellows: {
    title: 'The Carrier',
    setter: 'fold',
    // Where it is: tap this in the room to pick it up.
    at: ['exchange'],
    tier: 2,
    if: 'ev:paper_1',
    blocks: [
      { p: 'Every carrier that passes through the exchange has holes punched in its brass collar: one row for the hour it went in, one for the hour it came out, on a clock of twenty-four hours.' },
      { p: 'Each hole is worth twice the one to its right, and the last is worth 1. Add up the holes in a row to get its hour.' },
      { p: 'The carrier that brought you Paper I came out at your desk at eight in the evening: 20:00.' },
    ],
    ask: 'At what hour was it put in?',
    answers: ['HELD SINCE NOON', 'NOON', '12', '1200', '12 00', 'MIDDAY', 'TWELVE', '12 NOON', 'TWELVE NOON', '12PM', '12 PM'],
    near: [
      { match: ['20', '2000', '20 00', '8', '8PM', 'EIGHT'], say: 'That is when it came out, at your desk. Read the other row.' },
      { match: ['0', '00', '0000', '24', 'MIDNIGHT'], say: 'Midnight would be no holes at all. Count the holes again.' },
    ],
    solved: "It went in at 12:00, noon. The carrier was HELD SINCE NOON.\n\nIt came out at your desk at 20:00, eight in the evening. So the Paper sat waiting in the exchange for eight hours before it was sent to you.\n\nThat means the sender did not have to be anywhere near the Hall at eight o'clock. They could post it at noon and walk away. Pendry's Paper could have been sent in the same way.",
    facts: ['held_carrier'],
    lesson: 'binary',
    hints: [
      'There are two rows of holes. You know one hour already: it came out at eight in the evening, which is 20 on a clock of twenty-four hours.',
      'From the right, the holes are worth 1, 2, 4, 8 and 16. The OUT row has holes at 16 and 4: 20. Now add up the IN row.',
      'The IN row has holes at 8 and 4.',
      '8 and 4 make 12: it went in at noon. HELD SINCE NOON.',
    ],
    goal: 'Add up the holes in each row. Then set the dial to the hour it went in.',
    // Holes in the collar, as binary from the 16s down to the 1s: IN at 12, OUT at 20.
    stage: { kind: 'collar', rows: [{ label: 'IN', holes: '01100' }, { label: 'OUT', holes: '10100' }] },
  },
  ascii: {
    title: 'The Night Log',
    setter: 'fold',
    // Where it is: tap this in the room to pick it up.
    at: ['server'],
    tier: 3,
    if: 'examined:server',
    blocks: [
      { p: "The Engine keeps a log of who uses it, from which terminal, and when. Jonah has drawn the log since March as a chart: one row for each terminal, one column for each hour of the night. 'The Syndics kept asking for the log,' he says. 'So I gave them a picture. Nobody has looked at it.'" },
      { p: 'Somebody has used the Engine nearly every night since March, between two and four in the morning. Every request is the same: PLAY LECTURE 1987, and a number.' },
    ],
    ask: 'Which terminal is it?',
    answers: ['LODGE', 'THE LODGE', 'PORTERS LODGE', 'THE PORTERS LODGE'],
    near: [{ match: ['REPOSITORY', 'THE REPOSITORY'], say: "That is Jonah's own terminal. Check the hours: between two and four in the morning it was used on only a few nights." }],
    solved: "The Lodge: the terminal in the Porter's Lodge.\n\nAlmost every night since March, between two and four in the morning, somebody in the Lodge has asked the machine to play Dame Hesper's old lectures from 1987. Nothing else, ever. They only want to hear her voice.",
    facts: ['lodge_nights'],
    lesson: 'charts',
    hints: [
      'Each row is a terminal and each column is an hour of the night. The brighter a square, the more nights that terminal was used at that hour.',
      'Find the columns for two and three in the morning. Two terminals were used then. Tap their squares to see on how many nights.',
      'The Repository was used then on only 34 nights. Its darkest squares are earlier, from midnight to two. The other terminal was used on 214 nights.',
      "The LODGE: the terminal in the Porter's Lodge.",
    ],
    goal: 'Brighter squares mean more nights. Tap the terminal used from 2 to 4 in the morning, nearly every night.',
    // Each terminal: [from hour, to hour, nights since March, what it asked for]. The chart shows only
    // the hours and the nights; what was asked for stays in the log, for the tests and the story.
    stage: {
      kind: 'chart',
      from: 18,
      hours: 12,
      rows: [
        { name: 'HALL', busy: [[18, 20, 46, 'WHO IS ON DUTY TONIGHT']] },
        { name: 'PARLOUR', busy: [[19, 22, 61, 'DRAFT: HEADS OF TERMS']] },
        { name: 'CRUX', busy: [[21, 24, 88, 'SEARCH: GREYWETHER']] },
        { name: 'ALMSHOUSE', busy: [[20, 21, 15, "READ ALOUD: TODAY'S CLUES"]] },
        { name: 'REPOSITORY', busy: [[0, 2, 226, 'RUN: STYLOMETRY'], [2, 4, 34, 'BACK UP EVERYTHING']] },
        { name: 'LODGE', busy: [[2, 4, 214, 'PLAY LECTURE 1987']] },
      ],
    },
  },

  // ------------------------------------------------- the Invigilator's Papers
  paper1a: {
    title: 'Paper I, Question 1',
    // Where it is: tap this in the room to pick it up.
    at: ['my_desk'],
    setter: 'invigilator',
    tier: 2,
    feed: 1,
    if: 'ev:paper_1',
    blocks: [
      { mono: caesar(PAPER_1, 17), tool: 'wheel' },
    ],
    ask: 'What name do the buyers give the thing they are buying? (one word)',
    goal: 'Turn the wheel until the Paper makes sense. Then answer its question.',
    stage: { kind: 'wheel', give: { rings: 6 } },
    answers: ['LEGACY', 'THE LEGACY', 'LORIMER LEGACY', 'THE LORIMER LEGACY'],
    near: [
      { match: ['PROVENANCE', 'CERTIFICATE', 'CERTIFICATE OF PROVENANCE'], say: 'That is the sheet he signed. The question is what the sheet is selling.' },
      { match: ['ENGINE', 'LECTERN', 'THE LECTERN', 'LORIMER ENGINE', 'CORPUS'], say: 'That is only part of it. The certificate uses one word for the whole thing.' },
    ],
    solved: "LEGACY. 'The Lorimer Legacy' is forty years of a living woman's work, plus the machine that was trained on it. It is all being sold under that one name to a London company called Greywether.\n\nIgnatius Pendry was paid to swear that every line of it was hers alone.",
    facts: ['legacy_sale'],
    lesson: 'frequency',
    hints: [
      'This is the same kind of cipher as the one on the gate, with a different shift. There are only twenty-five shifts to try, and your wheel can try them for you.',
      'The most common letter in English is E. The most common letter on this Paper is V.',
      "V is seventeen places after E. So move every letter back seventeen places. Then do what the message says: the certificate hangs in Pendry's shop.",
      'The certificate sells THE LORIMER LEGACY. The answer is LEGACY.',
    ],
  },
  paper1b: {
    title: 'Paper I, Question 2',
    // Where it is: tap this in the room to pick it up.
    at: ['my_desk'],
    setter: 'invigilator',
    tier: 2,
    feed: 2,
    if: 'ev:paper_1',
    blocks: [
      { quote: 'Every child here can read this before they can ride a bicycle.' },
      { glyphs: PAPER_1B },
    ],
    ask: 'What office (job title) does the message ask for? (one word)',
    goal: 'Tap a sign, then its letter in the key. Then answer the question.',
    stage: { kind: 'pigpen', give: { rings: 6 } },
    answers: ['WARDEN', 'THE WARDEN', 'WARDEN OF THE COMPANY'],
    near: [
      { match: ['CLAY', 'AUBERON CLAY', 'AUBERON'], say: 'His office, not his name. What is his title in the Company?' },
      { match: ['DEPUTY', 'GUARDIAN'], say: 'That is what the court calls him. What does the Company call him?' },
    ],
    solved: "WARDEN.\n\nDame Hesper Lorimer can no longer sign her own name. Since March, a court order has let someone else sign for her. The order names 'the Warden for the time being of the Worshipful Company of Setters and Solvers'. That means whoever is Warden at the time. Today, that is Auberon Clay.\n\nSo the man who is selling her life's work is the man the law chose to look after it.",
    facts: ['warden_signs'],
    lesson: 'pigpen',
    hints: [
      'These signs are the pigpen cipher. Each letter is drawn as the lines around its cell in a grid. The key is under the message.',
      'The alphabet is spread over two noughts-and-crosses grids and two X shapes. Letters in the second grid and the second X have a dot.',
      'Decoded, it asks who signs for Dame Hesper now. It wants his office, meaning his title. Ask Milo to look her up, or ask people in the Hall.',
      'The court made the WARDEN her deputy.',
    ],
  },
  paper2a: {
    title: 'Paper II, Question 3',
    // Where it is: tap this in the room to pick it up.
    at: ['my_desk'],
    setter: 'invigilator',
    tier: 3,
    feed: 3,
    if: 'ev:paper_2',
    blocks: [
      { quote: 'Geography. She drew the world for a living and never once looked up from the paper. Five places. Take the first letter of each, in English.' },
      {
        list: [
          'Where a quarter of the world turns to pray.   21.42° N, 39.83° E',
          'A capital at the head of a fjord.   59.91° N, 10.75° E',
          'An island that is not there.   0° N, 0° E',
          'As high as anyone can stand.   27.99° N, 86.93° E',
          'A walled city with a minster, north of here.   53.96° N, 1.08° W',
        ],
      },
      { quote: 'Then follow it.' },
    ],
    ask: 'What do the five letters spell?',
    goal: 'Tap each place to see it on the map. Set its ring to the first letter of its name.',
    stage: { kind: 'places' },
    answers: ['MONEY'],
    solved: "Mecca. Oslo. Null Island. Everest. York.\n\nMONEY. Follow the money.\n\nMarguerite Sallow sold charts. She kept her private papers the way chart-sellers do: pressed flat inside the biggest book on her boat.",
    facts: ['follow_money'],
    lesson: 'atlas',
    hints: [
      'Each pair of numbers is a latitude, then a longitude. Find each place on a real map, or open the card on latitude in the Lectern: it lists famous places by their numbers.',
      'Number three is a joke among people who make maps: the point where the equator meets the prime meridian. It has a name.',
      'Mecca, Oslo, Null Island, Everest, York.',
      'M, O, N, E, Y. The answer is MONEY.',
    ],
  },
  paper2b: {
    title: 'Paper II, Question 4',
    setter: 'invigilator',
    // Where it is: tap this in the room to pick it up.
    at: ['my_desk'],
    tier: 3,
    feed: 4,
    if: 'ev:paper_2',
    blocks: [
      { quote: 'She drew the world for a living, but she crossed it with brass. A navigator holds one of these up to the sun at noon and reads her latitude from its arc. Hers is the one whose arc is a sixth of a circle.' },
      { p: 'Under the question, five instruments are drawn to scale in green ink. None of them is named.' },
    ],
    ask: 'Which instrument is hers? (one word)',
    answers: ['SEXTANT', 'A SEXTANT', 'THE SEXTANT'],
    near: [{ match: ['OCTANT', 'QUADRANT', 'ASTROLABE', 'PROTRACTOR', 'GRAPHOMETER'], say: 'That is a real instrument, but measure its arc. Hers is a sixth of a circle.' }],
    solved: "A SEXTANT. Its arc is 60 degrees, which is a sixth of a circle, and 'sextant' comes from the Latin word for a sixth.\n\nSailors hold a sextant up to the sun at noon to work out how far north they are. There is a sextant in a wooden box on Marguerite Sallow's boat, the Meridian. She never kept anything just for show. That box is worth a look.",
    facts: ['sextant_clue'],
    lesson: 'navigation',
    hints: [
      'Tap each instrument to measure its arc. A whole circle is 360 degrees.',
      'A sixth of 360 degrees is 60 degrees. Find the instrument with that arc.',
      'The names come from Latin fractions: a quadrant is a quarter of a circle, an octant an eighth. Sextans means a sixth.',
      'A SEXTANT.',
    ],
    goal: 'Tap each instrument to measure its arc. Then name hers.',
    // Arcs in degrees, as drawn on the sheet, left to right.
    stage: { kind: 'instruments', arcs: [180, 45, 360, 60, 90], give: { rings: 7 } },
  },
  paper3: {
    title: 'Paper III, Question 5',
    // Where it is: tap this in the room to pick it up.
    at: ['my_desk'],
    setter: 'invigilator',
    tier: 4,
    feed: 5,
    if: 'ev:paper_3',
    blocks: [
      { quote: 'For three hundred years they called this one le chiffre indéchiffrable. Use the Square. The key is the name she set under.' },
      { mono: vigenere(PAPER_3, 'VESPER'), tool: 'square' },
    ],
    ask: 'Where does the message tell you to go? (one word)',
    goal: 'Type the key and watch the message change. Then tap the place it sends you to.',
    stage: { kind: 'keyed', method: 'vigenere' },
    answers: ['STALEMATE', 'THE STALEMATE'],
    near: [{ match: ['HESPER', 'LORIMER', 'VESPER'], say: 'That may be the key. Use it to read the message, then give the place it names.' }],
    solved: "TONIGHT THE PROBLEM ON THE SLATE AT THE STALEMATE IS MINE. SOLVE IT BEFORE THE HALL STRIKES TWELVE AND YOU MAY KEEP THE THIRD OF THEM.\n\nBy 'keep', he means keep alive.",
    facts: ['third_tonight'],
    effects: [{ mark: 'slate_open' }],
    lesson: 'vigenere',
    hints: [
      'This is a Vigenère cipher. It is a Caesar shift that changes with every letter, following the letters of a key word over and over.',
      "The key is 'the name she set under'. Setters publish their puzzles under a pen-name. Dame Hesper's pen-name is on the plate under her portrait in the Hall.",
      'The key is VESPER. Type it in and read the message.',
      'It tells you to go to the STALEMATE.',
    ],
  },
  slate: {
    title: 'The Slate, Question 6',
    // Where it is: tap this in the room to pick it up.
    at: ['slate_board'],
    setter: 'invigilator',
    tier: 4,
    feed: 6,
    if: ['puz:paper3', 'visited:stalemate'],
    blocks: [
      { p: "Tonight's problem on the Stalemate's slate is not a normal chess problem. Somebody has chalked a letter on every square of the board. Under the board is one line:" },
      { quote: `N ${SLATE.moves.join(' ')}` },
      { board: { rows: SLATE.rows } },
      { p: "'It was there when I came down at six,' says Ottilie. 'I don't know the handwriting, and I know everyone's.'" },
    ],
    ask: 'Who is the third candidate? (give his pen-name)',
    goal: 'Hop the knight along the moves under the board. Then tap the pen-name it spells.',
    stage: { kind: 'knight' },
    answers: ['CENSOR'],
    near: [
      { match: ['VOSS', 'LUCAN VOSS'], say: 'That is who he is. The slate gives his pen-name.' },
      { match: ['CANDIDATE THREE SETS AS CENSOR', 'CANDIDATETHREESETSASCENSOR'], say: 'You have read it. Now give just the name.' },
    ],
    solved: "CANDIDATE THREE SETS AS CENSOR.\n\nCENSOR is the name on the crossword in the Crux, the Fold's newspaper. It has been for twenty years. The Crux office is one flight of stairs above where you are standing.",
    facts: ['censor_named'],
    lesson: 'knight',
    hints: [
      'The line under the board is chess notation. N means a knight. Columns are lettered a to h from the left. Rows are numbered 1 to 8 from the bottom.',
      "Start on b1: the bottom row, second square from the left. Read its letter. Then go to a3, then c2, and so on. Each step is a knight's move.",
      'It spells CANDIDATE THREE SETS AS ...',
      'CENSOR. Ask who that is, or look at the copy of the Crux pinned by the door.',
    ],
  },
  paper4: {
    title: 'Paper IV, Question 7',
    // Where it is: tap this in the room to pick it up.
    at: ['my_desk'],
    setter: 'invigilator',
    tier: 5,
    feed: 7,
    if: 'ev:paper_4',
    blocks: [
      { quote: 'Wheatstone invented this method, but it is named after his friend. The letters go in pairs. The key is what I am to you.' },
      { mono: playfair(PAPER_4, 'INVIGILATOR').match(/.{1,4}/g).join(' '), tool: 'frame' },
    ],
    ask: 'What is the seventh answer? (one word)',
    goal: 'Type the key and watch the square build. Then tap the seventh answer.',
    stage: { kind: 'keyed', method: 'playfair' },
    answers: ['TUITION'],
    solved: "LAY YOUR SEVEN ANSWERS IN A COLUMN IN THE ORDER I SET THEM. TAKE FROM EACH THE LETTER OF ITS OWN NUMBER. THE SEVENTH ANSWER IS TUITION.\n\nTuition: he has been teaching you for four days. You look the word up, because by now you look everything up. Before 'tuition' meant teaching, it meant guardianship: keeping someone safe.",
    facts: ['tuition'],
    lesson: 'playfair',
    hints: [
      'This is the Playfair cipher. A key word is written into a five-by-five square, followed by the rest of the alphabet. The message is enciphered two letters at a time.',
      "The key is 'what I am to you'. Look at how every Paper is signed.",
      'The key is INVIGILATOR. Type it in and watch the square build. Where a letter was doubled, you will see an extra X.',
      'The seventh answer is TUITION.',
    ],
  },
  meta: {
    title: 'The Order of the Papers',
    // Where it is: tap this in the room to pick it up.
    at: ['my_desk'],
    setter: 'invigilator',
    tier: 5,
    if: 'puz:paper4',
    blocks: [
      { p: 'Here are the seven questions, in the order they were set, with your answers. Write the answers in a column. Take the first letter of the first answer, the second letter of the second, and so on.' },
      { feeds: true },
    ],
    ask: 'What place do the seven letters spell?',
    goal: 'Take the first letter of answer 1, the second letter of answer 2, and so on.',
    stage: { kind: 'column' },
    answers: ['LANTERN', 'THE LANTERN'],
    solved: "L from LEGACY. A from WARDEN. N from MONEY. T from SEXTANT. E from STALEMATE. R from CENSOR. N from TUITION.\n\nLANTERN.\n\nHe planned this from the first day. Every answer you have given him since Monday was a piece of this one. The Lantern is the glass room on the roof of Setters' Hall. The Founder's Orrery turns there. On the night of the Proving, the Warden goes up there alone to wind it.",
    facts: ['lantern_known'],
    effects: [{ unlock: 'lantern' }],
    lesson: 'meta',
    hints: [
      'You need all seven answers, in order. They are both questions of Paper I, both of Paper II, Paper III, the slate, and Paper IV.',
      'Write them one under another. Take the first letter of the first, the second letter of the second, and so on.',
      'LEGACY, WARDEN, MONEY, SEXTANT, STALEMATE, CENSOR, TUITION. Read the letters along the diagonal.',
      'LANTERN. The glass room on top of the Hall.',
    ],
  },

  // -------------------------------------------------------- the deeper things
  nina: {
    title: 'The Late Tithes',
    // Where it is: tap this in the room to pick it up.
    at: ['vitrines'],
    setter: 'hesper',
    tier: 4,
    if: 'examined:vitrines',
    blocks: [
      { p: "Three of the twelve Late Tithes are on show under glass, solved. Each one had seven clues, with seven answers of seven letters. The winner of that year's Proving wrote the answers into a square. The Company calls them the finest work of Dame Hesper's life." },
      { grid: TITHES.y2014, caption: 'The Tithe of 2014' },
      { grid: TITHES.y2018, caption: 'The Tithe of 2018' },
      { grid: TITHES.y2022, caption: 'The Tithe of 2022' },
      { p: 'The case by the door holds a much older Tithe, for comparison.' },
      { grid: TITHES.y1998, caption: 'The Tithe of 1998' },
    ],
    ask: 'What do the three late squares share that the 1998 square does not? (seven letters)',
    goal: 'Drag across a square to read along any straight line. What do the three late ones share?',
    stage: { kind: 'grids' },
    answers: ['ARIADNE'],
    solved: "In every Late Tithe, the diagonal from top left to bottom right spells A, R, I, A, D, N, E.\n\nA word hidden in a finished grid is called a Nina. It is a kind of signature, for people who look carefully. The same name runs diagonally through twelve years of the Company's proudest work.\n\nThe name is not HESPER, and it is not LORIMER.",
    facts: ['nina_ariadne'],
    lesson: 'nina',
    hints: [
      "Don't read the words. Look at each square as a whole grid of letters. Setters sometimes hide something in a finished grid.",
      'A hidden word like this is called a Nina. Here it runs in a straight line, but not across and not down.',
      'Read each late square from its top left corner to its bottom right.',
      'ARIADNE.',
    ],
  },
  lock: {
    title: 'The Word on the Doors',
    // Where it is: tap this in the room to pick it up.
    at: ['door_pendry', 'strongbox'],
    setter: 'invigilator',
    tier: 5,
    if: 'examined:door_pendry',
    blocks: [
      { p: "This is Ignatius Pendry's letter-lock, from the inside of his door. It has seven rings. Its word was changed the day before he died. The Paper that came down his tube told him so:" },
      { quote: 'The door now opens to one name. It is in everything you sold.' },
      { p: 'His blotter shows the words he tried: PENDRYS, HOROLOG, and LORIMER twice. He was still trying at midnight.' },
    ],
    ask: 'What word opens it?',
    goal: 'His own word no longer opens it. Find the word that does.',
    stage: { kind: 'lock', clues: [DOOR_PAPER, PENDRY_BLOTTER] },
    // The rings still read his own word, as they did when the door came off.
    lock: { rings: 7, start: 'PENDRYS' },
    answers: ['ARIADNE'],
    near: [{ match: ['LORIMER', 'HESPERL', 'VESPERS', 'PENDRYS'], say: 'He tried that. The bolt did not move for him either.' }],
    solved: "A. R. I. A. D. N. E.\n\nThe bolt slides back.\n\nThat was all it needed: one name, seven letters. That name runs through twelve years of the work he swore he had checked. He could have walked out of that room at any minute of the night.",
    facts: ['word_ariadne'],
    lesson: 'letterlock',
    hints: [
      "'It is in everything you sold.' What they sold is under glass in the Repository, beneath the Hall.",
      'The Late Tithes contain a hidden word. Find it there first.',
      'Read the solved squares of the Late Tithes from the top left corner to the bottom right.',
      'ARIADNE.',
    ],
  },
  cryptic: {
    title: "The Dame's Clue",
    // Where it is: tap this in the room to pick it up.
    at: ['hesper_table'],
    setter: 'hesper',
    tier: 4,
    if: 'flag:dame_clue',
    blocks: [
      { p: 'Dame Hesper said it twice, looking out at the garden. The second time, she tapped the arm of her chair once for every letter.' },
      { quote: 'Left, characteristic, likeness. Eight. I put it there so it would be behind me. It is always behind me, dear.' },
    ],
    ask: 'What is the eight-letter answer to her clue?',
    goal: 'Solve her clue, and set it on the eight rings.',
    stage: { kind: 'clue', clue: 'Left, characteristic, likeness', length: 8, aside: 'I put it there so it would be behind me. It is always behind me, dear.', by: 'Dame Hesper', give: { rings: 8 } },
    answers: ['PORTRAIT', 'HER PORTRAIT', 'THE PORTRAIT'],
    solved: "PORT is a sailor's word for left. TRAIT means a characteristic. Together they make PORTRAIT, which means a likeness.\n\nShe said it is always behind her. Her portrait hangs in Setters' Hall. Anything hidden behind it would be behind her for good.",
    facts: ['portrait_clue'],
    lesson: 'cryptic',
    hints: [
      'This is a cryptic crossword clue. One end of it is a plain definition of the answer. The rest tells you how to build the same word from smaller parts.',
      "The definition is 'likeness'. The rest is two shorter words, placed side by side.",
      "A sailor's word for the left side of a ship, then a word for a characteristic.",
      'PORT and TRAIT make PORTRAIT. Look behind her portrait in the Hall.',
    ],
  },
  grille: {
    title: 'The Grille',
    // Where it is: tap this in the room to pick it up.
    at: ['grille_lock'],
    setter: 'invigilator',
    tier: 5,
    if: 'visited:lantern',
    blocks: [
      { p: "The Founder's Orrery turns inside an iron grille. The Warden is lying on the floor inside it. His face is grey and he is breathing hard. The gate in the grille is shut with a seven-ring letter-lock." },
      { quote: 'The gate opens to one name. It is in everything you sold.' },
      { p: 'It is the same question the Invigilator set the other three. None of them answered it.' },
    ],
    ask: 'What word do you set the rings to?',
    goal: 'Open the grille. He has very little time.',
    stage: { kind: 'lock', clues: [GRILLE_PAPER] },
    lock: { rings: 7, start: 'AAAAAAA' },
    answers: ['ARIADNE'],
    near: [{ match: ['LORIMER', 'HESPERL', 'VESPERS', 'LANTERN', 'TUITION', 'FETTLER'], say: 'The rings turn, but the bolt does not move.' }],
    solved: "A. R. I. A. D. N. E.\n\nThe bolt slides back and the gate swings open. Kit is past you before it stops moving. She gets her arm under the Warden's to lift him.\n\nBehind you, the clock on the Porter's knee has stopped ticking. He has stopped it with his thumb.",
    effects: [{ flag: 'grille_open' }],
    lesson: 'letterlock',
    hints: [
      "'It is in everything you sold.' The answer has been on show under glass in the Repository since 2012.",
      'It is the word that would have opened the other three doors. The Late Tithes hide it, corner to corner.',
      'It is a name. In the Greek story, she gave a man a thread to find his way out of a maze.',
      'ARIADNE.',
    ],
  },
  bacon: {
    title: 'The Epigraph',
    // Where it is: tap this in the room to pick it up.
    at: ['my_desk'],
    setter: 'invigilator',
    tier: 5,
    secret: true,
    if: 'ev:paper_4',
    blocks: [
      { p: 'A line is written across the top of Paper IV. Its capitals are in strange places. The Invigilator is never careless, so this is deliberate.' },
      { marked: baconHide('ARIADNE', 'Nothing is hidden that a patient eye will not find.') },
    ],
    ask: 'What word is hidden in it? (seven letters)',
    goal: 'Two kinds of letter. Split the line into groups, then find each group in the table.',
    stage: { kind: 'bacon', letters: 7 },
    answers: ['ARIADNE'],
    solved: "A small letter means a. A capital means b. In groups of five: aaaaa, baaab, abaaa, aaaaa, aaabb, abbab, aabaa.\n\nARIADNE.\n\nFrancis Bacon published this trick in 1623. The message is hidden in the shapes of the letters. What the words say does not matter. The Invigilator has put the word that opens the doors at the top of your Paper. Anyone could read it, if they had learned how.",
    facts: ['epigraph_ariadne'],
    lesson: 'bacon',
    hints: [
      'The sentence means what it says. The secret is in which letters are capitals.',
      "This is Bacon's cipher. Read small letters as a and capitals as b, in groups of five. Each group is one letter of the secret.",
      'Counting in twos: aaaaa is A, aaaab is B, aaaba is C, and so on. The first group here is aaaaa and the second is baaab.',
      'ARIADNE.',
    ],
  },

};

/** The tools a solver can earn, and the reference pages of the Novice's Primer. */
export const TOOLS = {
  primer: { name: "The Novice's Primer", if: 'flag:through_gate', desc: "Every child in the Fold is given one. It has the numbered alphabet, the pigpen key and the five-by-five square. It also explains the chessboard, Bacon's a-and-b codes, and the rules of the game." },
  wheel: { name: 'The Wheel', if: 'flag:tool_wheel', desc: 'Moves every letter of a message back along the alphabet, as many places as you choose. It also counts the most common letters.' },
  fence: { name: 'The Fence', if: 'act>=2', desc: 'Undoes a rail fence cipher, written in a zigzag over two to six rails.' },
  square: { name: 'The Square', if: 'act>=3', desc: 'Decodes a Vigenère cipher with any key word you give it.' },
  frame: { name: 'The Frame', if: 'act>=4', desc: 'Builds a Playfair square from a key word and uses it to decode the message.' },
};
