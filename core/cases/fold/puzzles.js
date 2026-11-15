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
// ask      the question above the answer box
// answers  what is accepted (compared in capitals, letters and digits only)
// near     kind words for an answer that is on the way
// feed     its place, 1 to 7, among the Invigilator's questions (the last Paper needs them in order)
// hints    from a nudge to the answer; the last one always gives it away

import { caesar, rot13, polybius, railFence, vigenere, playfair, baconHide, hexOf, knightBoard, seeded } from '../../ciphers.js';

const PAPER_1 =
  'CANDIDATE. THE CIPHER HERE IS THE ONE ON THE GATE, EXCEPT THE NUMBER, WHICH I KEEP. A PATIENT PERSON NEEDS ONLY TWENTY-FIVE ATTEMPTS. A CLEVERER ONE SEEKS THE LETTER SEEN MOST AND NAMES IT E. IGNATIUS PENDRY SIGNED A SHEET HE NEVER ONCE READ. SEE IT IN HIS SHOP. TELL ME THE NAME THE BUYERS GIVE THE THING THEY ARE BUYING.';
const PAPER_1B = 'SHE CANNOT SIGN FOR HERSELF NOW. SOMEONE SIGNS FOR HER. FIND OUT WHO. GIVE ME HIS OFFICE, NOT HIS NAME.';
const PAPER_2B = 'WHAT DOES A NAVIGATOR HOLD TO THE NOON SUN TO FIND HER LATITUDE';
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

/** @type {Record<string, any>} */
export const PUZZLES = {
  // ------------------------------------------------------------ the Fold's own
  gate: {
    title: 'The Turnstile',
    setter: 'fold',
    tier: 1,
    if: true,
    blocks: [
      { p: 'An iron turnstile, and on its post a brass lock of five lettered rings. It will not turn until the rings spell the word of the day.' },
      { p: 'On the slate beside it, in this morning\'s chalk:' },
      { mono: caesar('CATCH', 3) },
      { p: 'And cut into the stone above, in letters two hundred years old:' },
      { quote: 'THREE BACK, AS CAESAR WROTE.' },
    ],
    ask: 'What do you set the rings to?',
    answers: ['CATCH'],
    solved: "C, A, T, C, H. The rings click and the gate gives under your hand like a held breath let go.\n\n'Every seven-year-old in the Fold does that half asleep,' says Kit. 'I shan't say how long you took. Welcome to the Fold, Flat.'",
    effects: [{ flag: 'through_gate' }],
    lesson: 'caesar',
    hints: [
      'The slate is not the word. The stone tells you what to do to the slate.',
      'Take each chalked letter three places back in the alphabet. F becomes C.',
      'F to C, D to A, W to T, F to C, K to H.',
      'The word is CATCH.',
    ],
  },
  fitting: {
    title: 'The Fitting',
    setter: 'fold',
    tier: 1,
    if: 'met:quoin',
    blocks: [
      { p: "Mrs Quoin sets a brass wheel in your palm: two rings of letters, one inside the other. She turns the inner ring until N sits under A, and pushes a strip of paper across the baize." },
      { mono: rot13('PATIENCE'), tool: 'wheel' },
      { quote: "Thirteen. Halfway round. Do it and undo it with the same turn. Go on. I'm timing you, but I shan't tell you what for." },
    ],
    ask: 'What does the strip say?',
    answers: ['PATIENCE'],
    solved: "PATIENCE.\n\n'Hm.' She takes the wheel back, weighs it, and gives you a different one: plain brass, heavier, already warm. 'Boxwood for the quick. Bone for the careful. Brass for the stubborn. You're brass. Stubborn'll do. Keep it; the Company will send me the bill and I shall send it back.'\n\nYou have a cipher wheel. It will turn any message through the alphabet for you, a place at a time.",
    effects: [{ flag: 'tool_wheel' }, { notify: 'New tool: the Wheel. Open any puzzle and use it on the cipher text.' }],
    lesson: 'rot13',
    hints: [
      'Each letter has moved thirteen places along the alphabet. Move it thirteen more and you are back where you began.',
      'A and N change places. So do B and O, C and P, and so on round.',
      'C is P, N is A, G is T, V is I.',
      'The strip says PATIENCE.',
    ],
  },
  bellows: {
    title: 'The Carrier',
    setter: 'fold',
    tier: 2,
    if: 'ev:paper_1',
    blocks: [
      { p: 'Every carrier that passes through the exchange is punched on its brass collar: where it has been and what was done with it. The Fold punches in the old five-by-five square, row then column, I and J sharing a seat.' },
      { p: 'The collar of the carrier that brought you Paper I reads:' },
      { mono: polybius('HELD SINCE NOON') },
    ],
    ask: 'What does the collar say? (three words)',
    answers: ['HELD SINCE NOON'],
    near: [{ match: ['HELD', 'NOON', 'HELDNOON', 'SINCENOON'], say: 'Part of it. Read every pair.' }],
    solved: "HELD SINCE NOON.\n\nThe Paper reached your desk at eight in the evening. It was put into the exchange at midday and sat eight hours in the hold-rack, waiting for the clockwork to let it go. Whoever sent it could have been anywhere at all by then: at supper, at prayer, at the far end of the country.\n\nSo could whoever sent Ignatius Pendry his.",
    facts: ['held_carrier'],
    lesson: 'polybius',
    hints: [
      'Each pair of digits is one letter: the first digit is the row of a five-by-five alphabet square, the second the column.',
      'Write the alphabet in five rows of five, leaving out J. 23 is row two, column three.',
      '23 is H, 15 is E, 31 is L, 14 is D. Carry on.',
      'HELD SINCE NOON.',
    ],
  },
  ascii: {
    title: 'The Night Log',
    setter: 'fold',
    tier: 3,
    if: 'examined:server',
    blocks: [
      { p: "The Engine keeps a log of who has spoken to it and from where. Jonah has it print terminals as raw bytes, 'because the Syndics kept asking for the log and I wanted them to have to work for it.'" },
      { p: 'One terminal has had a session nearly every night since March, between two and four in the morning. Every request is the same: PLAY LECTURE 1987, and a number.' },
      { mono: `TERMINAL  ${hexOf('LODGE')}` },
    ],
    ask: 'Which terminal is it?',
    answers: ['LODGE', 'THE LODGE', 'PORTERS LODGE', 'THE PORTERS LODGE'],
    solved: "4C 4F 44 47 45. L, O, D, G, E.\n\nNight after night somebody sits in the Porter's Lodge and asks the machine to read Dame Hesper's old lectures aloud. Not one question about ciphers. Not one about foxgloves. Only her voice, saying things she said in 1987.",
    facts: ['lodge_nights'],
    lesson: 'ascii',
    hints: [
      'These are bytes written in hexadecimal: base sixteen, where A to F stand for ten to fifteen.',
      'Each pair is the code of one character. In ASCII the capital letters run from 41 (A) to 5A (Z).',
      '4C is the twelfth letter. 4F is the fifteenth. 44 is the fourth.',
      'LODGE. The terminal in the Porter\'s Lodge.',
    ],
  },

  // ------------------------------------------------- the Invigilator's Papers
  paper1a: {
    title: 'Paper I, Question 1',
    setter: 'invigilator',
    tier: 2,
    feed: 1,
    if: 'ev:paper_1',
    blocks: [
      { mono: caesar(PAPER_1, 17), tool: 'wheel' },
    ],
    ask: 'What do the buyers call it? (one word)',
    answers: ['LEGACY', 'THE LEGACY', 'LORIMER LEGACY', 'THE LORIMER LEGACY'],
    near: [
      { match: ['PROVENANCE', 'CERTIFICATE', 'CERTIFICATE OF PROVENANCE'], say: 'That is the sheet he signed. The question is what the sheet is selling.' },
      { match: ['ENGINE', 'LECTERN', 'THE LECTERN', 'LORIMER ENGINE', 'CORPUS'], say: 'That is part of it. The certificate has one word for the whole.' },
    ],
    solved: "LEGACY. 'The Lorimer Legacy': forty years of a living woman's work, and the machine that was fed on it, parcelled up under one word for a buyer in London called Greywether.\n\nAnd Ignatius Pendry was paid to swear that every line of it was hers and hers alone.",
    facts: ['legacy_sale'],
    lesson: 'frequency',
    hints: [
      'It is the gate cipher again with a different number. There are only twenty-five to try, and your wheel will try them for you.',
      'The commonest letter in English is E. The commonest letter on the Paper is V.',
      'E to V is seventeen places. Turn everything back seventeen. Then do what it says: the certificate hangs in Pendry\'s shop.',
      'The certificate sells THE LORIMER LEGACY. The answer is LEGACY.',
    ],
  },
  paper1b: {
    title: 'Paper I, Question 2',
    setter: 'invigilator',
    tier: 2,
    feed: 2,
    if: 'ev:paper_1',
    blocks: [
      { quote: 'Every child here can read this before they can ride a bicycle.' },
      { glyphs: PAPER_1B },
    ],
    ask: 'Whose office? (one word)',
    answers: ['WARDEN', 'THE WARDEN', 'WARDEN OF THE COMPANY'],
    near: [
      { match: ['CLAY', 'AUBERON CLAY', 'AUBERON'], say: 'His office, not his name.' },
      { match: ['DEPUTY', 'GUARDIAN'], say: 'That is what the court calls him. What does the Company call him?' },
    ],
    solved: "WARDEN.\n\nDame Hesper Lorimer can no longer sign her own name. Since March the court has let another hand sign for her: 'the Warden for the time being of the Worshipful Company of Setters and Solvers'. For the time being, that is Auberon Clay.\n\nSo the man who sold her life's work is the man the law set to look after it.",
    facts: ['warden_signs'],
    lesson: 'pigpen',
    hints: [
      'These signs are the pigpen cipher. Each letter is drawn as the piece of fence it stands in. The key is in your Primer.',
      'Two noughts-and-crosses grids and two crosses hold the alphabet; the second grid and second cross carry a dot.',
      'Decoded, it asks who signs for Dame Hesper now, and wants his office. Ask the Lectern about her, or ask in the Hall.',
      'The court made the WARDEN her deputy.',
    ],
  },
  paper2a: {
    title: 'Paper II, Question 3',
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
    answers: ['MONEY'],
    solved: "Mecca. Oslo. Null Island. Everest. York.\n\nMONEY. Follow it.\n\nMarguerite Sallow kept her private papers where a chart-seller would: pressed flat in the biggest book aboard.",
    facts: ['follow_money'],
    lesson: 'atlas',
    hints: [
      'Latitude first, then longitude. Find each place on a real map, or ask the Lectern what lies there.',
      'Number three is a joke among people who make maps: the point where the equator meets the prime meridian. It has a name.',
      'Mecca, Oslo, Null Island, Everest, York.',
      'M, O, N, E, Y. The answer is MONEY.',
    ],
  },
  paper2b: {
    title: 'Paper II, Question 4',
    setter: 'invigilator',
    tier: 3,
    feed: 4,
    if: 'ev:paper_2',
    blocks: [
      { quote: 'Written the way a fence is built: three rails, zig and zag. The Spartans wound theirs round a stick. It is the same thought.' },
      { mono: railFence(PAPER_2B, 3).match(/.{1,5}/g).join(' '), tool: 'fence' },
    ],
    ask: 'What is the instrument? (one word)',
    answers: ['SEXTANT', 'A SEXTANT', 'THE SEXTANT'],
    near: [{ match: ['OCTANT', 'QUADRANT', 'ASTROLABE'], say: 'A cousin of it. She had the later kind: a sixth of a circle.' }],
    solved: "WHAT DOES A NAVIGATOR HOLD TO THE NOON SUN TO FIND HER LATITUDE.\n\nA sextant. There is one aboard the Meridian, in its box, and Marguerite Sallow was not a woman who kept a thing for ornament.",
    facts: ['sextant_clue'],
    lesson: 'transposition',
    hints: [
      'Nothing has been swapped for anything else. The letters are all there; they are only out of order.',
      'Write the message as a zigzag on three lines, down and up and down. The cipher is the top line, then the middle, then the bottom. Your Fence tool will undo it.',
      'Three rails. It reads: WHAT DOES A NAVIGATOR HOLD TO THE NOON SUN TO FIND HER LATITUDE.',
      'A SEXTANT.',
    ],
  },
  paper3: {
    title: 'Paper III, Question 5',
    setter: 'invigilator',
    tier: 4,
    feed: 5,
    if: 'ev:paper_3',
    blocks: [
      { quote: 'For three hundred years they called this one le chiffre indéchiffrable. The square is in your Primer. The key is the name she set under.' },
      { mono: vigenere(PAPER_3, 'VESPER'), tool: 'square' },
    ],
    ask: 'Where are you going? (one word)',
    answers: ['STALEMATE', 'THE STALEMATE'],
    near: [{ match: ['HESPER', 'LORIMER', 'VESPER'], say: 'That may be the key. The question is what the message tells you to write.' }],
    solved: "TONIGHT THE PROBLEM ON THE SLATE AT THE STALEMATE IS MINE. SOLVE IT BEFORE THE HALL STRIKES TWELVE AND YOU MAY KEEP THE THIRD OF THEM.\n\nKeep. He means alive.",
    facts: ['third_tonight'],
    effects: [{ mark: 'slate_open' }],
    lesson: 'vigenere',
    hints: [
      'This is a Vigenère cipher: a Caesar shift that changes with every letter, following the letters of a key word over and over.',
      "The key is 'the name she set under'. Setters publish under a pen-name. Dame Hesper's is on the plate beneath her portrait in the Hall.",
      'The key is VESPER. Put it into the Square and read.',
      'It tells you to go to the STALEMATE.',
    ],
  },
  slate: {
    title: 'The Slate, Question 6',
    setter: 'invigilator',
    tier: 4,
    feed: 6,
    if: ['puz:paper3', 'visited:stalemate'],
    blocks: [
      { p: "Tonight's problem on the Stalemate's slate is not a chess problem. Somebody has chalked a letter on every square, and under the board one line:" },
      { quote: `N ${SLATE.moves.join(' ')}` },
      { board: { rows: SLATE.rows } },
      { p: "'It was there when I came down at six,' says Ottilie. 'Nobody's hand I know. And I know them all.'" },
    ],
    ask: 'Who is the third candidate? (the name he sets under)',
    answers: ['CENSOR'],
    near: [
      { match: ['VOSS', 'LUCAN VOSS'], say: 'That is who he is. The slate gives the name he sets under.' },
      { match: ['CANDIDATE THREE SETS AS CENSOR', 'CANDIDATETHREESETSASCENSOR'], say: 'You have read it. Now just the name.' },
    ],
    solved: "CANDIDATE THREE SETS AS CENSOR.\n\nCENSOR is the crossword in the Crux. Has been for twenty years. And the Crux is up one flight of stairs from where you are standing.",
    facts: ['censor_named'],
    lesson: 'knight',
    hints: [
      "The line under the board is chess notation. N is a knight; each square is named by its file, a to h from the left, and its rank, 1 to 8 from the bottom.",
      'Put a finger on b1, bottom row, second from the left. Read the letter. Then a3, then c2. Each step is a knight\'s move.',
      'It spells CANDIDATE THREE SETS AS ...',
      'CENSOR. Ask who that is, or look at the Crux pinned by the door.',
    ],
  },
  paper4: {
    title: 'Paper IV, Question 7',
    setter: 'invigilator',
    tier: 5,
    feed: 7,
    if: 'ev:paper_4',
    blocks: [
      { quote: "The method is Wheatstone's, though it wears his friend's name. Letters go two by two. The key is what I am to you." },
      { mono: playfair(PAPER_4, 'INVIGILATOR').match(/.{1,4}/g).join(' '), tool: 'frame' },
    ],
    ask: 'What is the seventh answer? (one word)',
    answers: ['TUITION'],
    solved: "LAY YOUR SEVEN ANSWERS IN A COLUMN IN THE ORDER I SET THEM. TAKE FROM EACH THE LETTER OF ITS OWN NUMBER. THE SEVENTH ANSWER IS TUITION.\n\nTuition. Four days of it. You look the word up, because by now you look everything up: before it meant teaching it meant guardianship. Keeping someone safe.",
    facts: ['tuition'],
    lesson: 'playfair',
    hints: [
      'This is the Playfair cipher. A key word is written into a five-by-five square, the rest of the alphabet follows, and the message is enciphered two letters at a time.',
      "The key is 'what I am to you'. Look at how every Paper is signed.",
      'The key is INVIGILATOR. Put it into the Frame. Expect a stray X wherever a letter was doubled.',
      'The seventh answer is TUITION.',
    ],
  },
  meta: {
    title: 'The Order of the Papers',
    setter: 'invigilator',
    tier: 5,
    if: 'puz:paper4',
    blocks: [
      { p: 'Seven questions, in the order they were set. Seven answers in a column. From the first its first letter, from the second its second, and so down.' },
      { feeds: true },
    ],
    ask: 'Where?',
    answers: ['LANTERN', 'THE LANTERN'],
    solved: "L from LEGACY. A from WARDEN. N from MONEY. T from SEXTANT. E from STALEMATE. R from CENSOR. N from TUITION.\n\nLANTERN.\n\nHe built it on the first day. Every answer you have given him since Monday was already a brick in this one. The Lantern is the glass room on the roof of Setters' Hall, where the Founder's Orrery turns and the Warden goes up alone to wind it on the night of the Proving.",
    facts: ['lantern_known'],
    effects: [{ unlock: 'lantern' }],
    lesson: 'meta',
    hints: [
      'You need all seven answers, in order: both questions of Paper I, both of Paper II, Paper III, the slate, and Paper IV.',
      'Write them one under another. Take the first letter of the first, the second letter of the second, the third of the third.',
      'LEGACY, WARDEN, MONEY, SEXTANT, STALEMATE, CENSOR, TUITION. Read down the slope.',
      'LANTERN. The glass room on top of the Hall.',
    ],
  },

  // -------------------------------------------------------- the deeper things
  nina: {
    title: 'The Late Tithes',
    setter: 'hesper',
    tier: 4,
    if: 'examined:vitrines',
    blocks: [
      { p: 'Three of the twelve Late Tithes lie solved under glass: each year seven clues, seven answers of seven letters, written into a square by the winner of that year\'s Proving. The Company calls them the finest work of her life.' },
      { grid: TITHES.y2014, caption: 'The Tithe of 2014' },
      { grid: TITHES.y2018, caption: 'The Tithe of 2018' },
      { grid: TITHES.y2022, caption: 'The Tithe of 2022' },
      { p: 'In the case by the door is one from long before, for comparison.' },
      { grid: TITHES.y1998, caption: 'The Tithe of 1998' },
    ],
    ask: 'What do the late ones share, that the early one does not? (seven letters)',
    answers: ['ARIADNE'],
    solved: "Corner to corner, in every Late Tithe: A, R, I, A, D, N, E.\n\nA setter who hides a word in a finished grid calls it a Nina. It is a signature for people who look. Twelve years of the Company's proudest work, and the same name is written slantwise through all of it.\n\nIt is not HESPER. It is not LORIMER.",
    facts: ['nina_ariadne'],
    lesson: 'nina',
    hints: [
      'Do not read the words. Look at the squares as squares. A setter sometimes hides something in the finished grid.',
      'It is called a Nina. In these it runs in a straight line that is neither across nor down.',
      'Read each late square from its top left corner to its bottom right.',
      'ARIADNE.',
    ],
  },
  lock: {
    title: 'The Word on the Doors',
    setter: 'invigilator',
    tier: 5,
    if: 'examined:door_pendry',
    blocks: [
      { p: "Ignatius Pendry's letter-lock, unscrewed from his door and tagged. Seven rings. The day before he died its word was changed, and the Paper that came down his tube told him so:" },
      { quote: 'The door now opens to one name. It is in everything you sold.' },
      { p: 'He tried PENDRYS. He tried HOROLOG. He tried LORIMER, twice. It is all on his blotter. He was still trying at midnight.' },
    ],
    ask: 'What word opens it?',
    answers: ['ARIADNE'],
    near: [{ match: ['LORIMER', 'HESPERL', 'VESPERS', 'PENDRYS'], say: 'He tried that. The bolt did not move for him either.' }],
    solved: "A. R. I. A. D. N. E.\n\nThe bolt draws back with a sound like a throat being cleared.\n\nThat was all it wanted. One name, seven letters, written through twelve years of the work he swore he had examined. He could have walked out of that room at any minute of the night.",
    facts: ['word_ariadne'],
    lesson: 'letterlock',
    hints: [
      "'It is in everything you sold.' What they sold is under glass in the Repository, beneath the Hall.",
      'The Late Tithes carry a hidden word. Find it there first.',
      'Read the solved squares of the Late Tithes corner to corner.',
      'ARIADNE.',
    ],
  },
  cryptic: {
    title: "The Dame's Clue",
    setter: 'hesper',
    tier: 4,
    if: 'flag:dame_clue',
    blocks: [
      { p: 'She said it twice, looking at the garden, and the second time she tapped the arm of the chair once for every letter.' },
      { quote: 'Left, characteristic, likeness. Eight. I put it there so it would be behind me. It is always behind me, dear.' },
    ],
    ask: 'Eight letters.',
    answers: ['PORTRAIT', 'HER PORTRAIT', 'THE PORTRAIT'],
    solved: "PORT, a sailor's left. TRAIT, a characteristic. PORTRAIT: a likeness.\n\nBehind her. In Setters' Hall there is one place in the world where something can be behind Dame Hesper Lorimer for good.",
    facts: ['portrait_clue'],
    lesson: 'cryptic',
    hints: [
      'This is a cryptic crossword clue. One end of it is a plain definition of the answer; the rest is a recipe for building the same word.',
      "The definition is 'likeness'. The recipe is two shorter words set side by side.",
      "A sailor's word for the left side of a ship, then a word for a characteristic.",
      'PORT and TRAIT: PORTRAIT. Look behind hers, in the Hall.',
    ],
  },
  grille: {
    title: 'The Grille',
    setter: 'invigilator',
    tier: 5,
    if: 'visited:lantern',
    blocks: [
      { p: "The Founder's Orrery turns inside an iron grille, and the Warden is on the floor inside it, grey, breathing like a man climbing stairs. The gate is shut on a letter-lock of seven rings." },
      { quote: 'The gate opens to one name. It is in everything you sold.' },
      { p: 'It is the same question he set the other three. Nobody has ever answered it.' },
    ],
    ask: 'What do you set the rings to?',
    answers: ['ARIADNE'],
    near: [{ match: ['LORIMER', 'HESPERL', 'VESPERS', 'LANTERN', 'TUITION', 'FETTLER'], say: 'The rings turn. The bolt does not.' }],
    solved: "A. R. I. A. D. N. E.\n\nThe bolt draws back. The gate swings in on its own weight, and Kit is past you before it has stopped, with her arm under the Warden's.\n\nBehind you, the clock on the Porter's knee has stopped ticking. He has put his thumb on the balance.",
    effects: [{ flag: 'grille_open' }],
    lesson: 'letterlock',
    hints: [
      "'It is in everything you sold.' The answer is under glass in the Repository, and it has been since 2012.",
      'It is the word that would have opened the other three doors. The Late Tithes hide it, corner to corner.',
      'It is a name. A girl who gave a man a thread to find his way out of a maze.',
      'ARIADNE.',
    ],
  },
  bacon: {
    title: 'The Epigraph',
    setter: 'invigilator',
    tier: 5,
    secret: true,
    if: 'ev:paper_4',
    blocks: [
      { p: 'Paper IV carries a line across its head, and the hand that wrote it has been oddly careless with its capitals. The Invigilator is not careless.' },
      { marked: baconHide('ARIADNE', 'Nothing is hidden that a patient eye will not find.') },
    ],
    ask: 'What is hidden in it? (seven letters)',
    answers: ['ARIADNE'],
    solved: "Small letter, a. Capital, b. Five at a time: aaaaa, baaab, abaaa, aaaaa, aaabb, abbab, aabaa.\n\nARIADNE.\n\nFrancis Bacon published the trick in 1623: a message hidden not in what the words say but in the shape of their letters. He has put the word that opens their doors at the top of your Paper, where anyone might read it. Anyone who had learned how.",
    facts: ['epigraph_ariadne'],
    lesson: 'bacon',
    hints: [
      'The sentence means what it says. The secret is in which letters are capitals.',
      'Bacon\'s cipher: read small letters as a and capitals as b, in groups of five. Each group is one letter of the secret.',
      'Counting in twos: aaaaa is A, aaaab is B, aaaba is C, and so on. The first group here is aaaaa and the second is baaab.',
      'ARIADNE.',
    ],
  },

  // ------------------------------------------------- the Wall of Tithes (extra)
  tithe_square: {
    title: 'A Tithe: the Engraver\'s Square',
    setter: 'fold',
    tier: 2,
    extra: true,
    if: 'examined:tithe_wall',
    blocks: [
      { p: 'A child\'s tithe, pinned low on the wall, in careful ink. Every row, every column and both long diagonals must make the same sum.' },
      { grid: ['16  3  2 13', ' 5 10 11  8', ' 9  6  7 12', ' 4  ?  ?  1'], numbers: true },
      { quote: 'The two I have left out are side by side for a reason. Read them together and say what they are. — Kit Quoin, aged 9' },
    ],
    ask: 'What four-figure number do the missing pair make?',
    answers: ['1514'],
    solved: "Fifteen and fourteen: 1514.\n\nIt is the square Albrecht Dürer cut into the wall behind his brooding angel, and the year he cut it sits in the bottom row where anyone can see and almost nobody does. Kit was nine. Somebody had been leaving puzzles in her lunch tin.",
    facts: ['tithe_done'],
    lesson: 'magic',
    hints: [
      'Add up any complete row to find the sum every line must make.',
      'Each line makes 34. The bottom row already has 4 and 1.',
      'The second column needs 15; the third needs 14.',
      '1514: the year Dürer engraved it.',
    ],
  },
  tithe_bridges: {
    title: 'A Tithe: the Seven Bridges',
    setter: 'fold',
    tier: 3,
    extra: true,
    if: 'examined:tithe_wall',
    blocks: [
      { p: "Pinned above it, a tithe in a surveyor's hand, with a sketch of the river and the Cut." },
      {
        list: [
          'Between the North Bank and the Fold: two bridges.',
          'Between the Fold and the Eyot: one bridge.',
          'Between the Eyot and the South Bank: two bridges.',
          'Between the South Bank and the North Bank: the Long Bridge.',
          'Between the North Bank and the Eyot: the footbridge.',
        ],
      },
      { quote: 'A walk that crosses all seven once, and none twice, can begin in only two of the four places. I ended mine in the Fold. Where did I begin? — M. Sallow' },
    ],
    ask: 'Where did the walk begin?',
    answers: ['SOUTH BANK', 'THE SOUTH BANK', 'SOUTH'],
    solved: "Count the bridges touching each place. North Bank, four. Eyot, four. The Fold, three. South Bank, three.\n\nA walk like that must start at one odd place and finish at the other, and nowhere else. Leonhard Euler proved it in 1736 about the seven bridges of Königsberg, and by proving it began a whole branch of mathematics. She ended in the Fold, so she began on the South Bank.",
    facts: ['tithe_done'],
    lesson: 'bridges',
    hints: [
      'Do not try to walk it. Count how many bridges touch each of the four places.',
      'A place with an odd number of bridges must be where the walk starts or where it ends.',
      'North Bank 4, Eyot 4, the Fold 3, South Bank 3. Only two are odd.',
      'It ended in the Fold, so it began on the SOUTH BANK.',
    ],
  },
  tithe_fifteen: {
    title: 'A Tithe: the Hundred Guineas',
    setter: 'fold',
    tier: 3,
    extra: true,
    if: 'examined:tithe_wall',
    blocks: [
      { p: 'Highest on the wall, behind glass, brown with age: a tray of fifteen numbered tiles and one gap. They run in order, except the last two, which have changed places.' },
      { grid: [' 1  2  3  4', ' 5  6  7  8', ' 9 10 11 12', '13 15 14  _'], numbers: true },
      { quote: 'A hundred guineas to the member who slides them into order. — the Warden, 1911. (Unclaimed.)' },
    ],
    ask: 'Can it be done? (one word)',
    answers: ['IMPOSSIBLE', 'NO', 'NEVER', 'IT CANNOT', 'CANNOT', 'UNSOLVABLE', 'INSOLUBLE'],
    solved: "No. And the Warden of 1911 knew it when he pinned up the purse.\n\nEvery slide of a tile changes two things at once, and they cancel: half of all arrangements can never be reached from the other half. Two tiles swapped is on the wrong side of that wall for ever. An American puzzle-maker called Sam Loyd offered a thousand dollars for it and never had to pay.\n\nIt is the Fold's oldest lesson, and the reason the tray is still up there: some puzzles are set by people who know there is no way out.",
    facts: ['tithe_done', 'unfair_known'],
    lesson: 'fifteen',
    hints: [
      'People tried for a hundred years. Ask why nobody ever collected, rather than how.',
      'Count how many pairs of tiles are in the wrong order. A slide can only change that count by an even number.',
      'One pair is out of order: an odd number. The solved tray has none: even. No sequence of slides gets from one to the other.',
      'It is IMPOSSIBLE.',
    ],
  },
};

/** The tools a solver can earn, and the reference pages of the Novice's Primer. */
export const TOOLS = {
  primer: { name: "The Novice's Primer", if: 'flag:through_gate', desc: 'Every child in the Fold is given one. The alphabet square, the pigpen, the five-by-five, Morse, and the rules of the game.' },
  wheel: { name: 'The Wheel', if: 'flag:tool_wheel', desc: 'Turns a message through the alphabet, one place at a time.' },
  fence: { name: 'The Fence', if: 'act>=2', desc: 'Undoes a zigzag written over two to six rails.' },
  square: { name: 'The Square', if: 'act>=3', desc: 'Works a Vigenère cipher for any key word you give it.' },
  frame: { name: 'The Frame', if: 'act>=4', desc: 'Builds a Playfair square from a key word and reads pairs through it.' },
};
