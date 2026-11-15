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
      { p: 'An old iron turnstile. On its post is a brass lock with five rings of letters. The turnstile will not turn until the rings spell the word of the day.' },
      { p: 'This morning someone chalked these letters on the slate beside it:' },
      { mono: caesar('CATCH', 3) },
      { p: 'Carved into the stone above it, in letters two hundred years old:' },
      { quote: 'THREE BACK, AS CAESAR WROTE.' },
    ],
    ask: 'What word do you set the rings to?',
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
    setter: 'fold',
    tier: 1,
    if: 'met:quoin',
    blocks: [
      { p: "Mrs Quoin puts a brass wheel in your hand. It has two rings of letters, one inside the other. She turns the inner ring until N sits under A. Then she pushes a strip of paper across the table to you." },
      { mono: rot13('PATIENCE'), tool: 'wheel' },
      { quote: "I've set it thirteen places round. That's halfway, so the same setting hides a message and also reads it back. Go on, then. I'm timing you, but I won't tell you why." },
    ],
    ask: 'What does the strip say?',
    answers: ['PATIENCE'],
    solved: "PATIENCE.\n\n'Hm.' She takes the wheel back and gives you a different one. It is plain brass, heavier, and already warm from her hand. 'Brass wheels are for stubborn people, and that's you. Stubborn will do. Keep it. No charge.'\n\nYou now have a cipher wheel. It can move every letter of a message along the alphabet, one place at a time.",
    effects: [{ flag: 'tool_wheel' }, { notify: 'New tool: the Wheel. Open any puzzle and use it on the cipher text.' }],
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
    tier: 2,
    if: 'ev:paper_1',
    blocks: [
      { p: 'Every carrier that passes through the exchange gets holes punched in its brass collar. They record where it has been and what was done with it. The code is the old five-by-five square: two digits for each letter, row first, then column. I and J share a cell.' },
      { p: 'The collar of the carrier that brought you Paper I reads:' },
      { mono: polybius('HELD SINCE NOON') },
    ],
    ask: 'What does the collar say? (three words)',
    answers: ['HELD SINCE NOON'],
    near: [{ match: ['HELD', 'NOON', 'HELDNOON', 'SINCENOON'], say: 'That is only part of it. Read every pair of digits.' }],
    solved: "HELD SINCE NOON.\n\nThe Paper reached your desk at eight in the evening. But it was put into the exchange at midday. It waited eight hours in the hold-rack until the clockwork sent it on. So whoever sent it could have been anywhere at eight o'clock.\n\nThe same is true of whoever sent Ignatius Pendry his Paper.",
    facts: ['held_carrier'],
    lesson: 'polybius',
    hints: [
      'Each pair of digits is one letter. The first digit is the row of a five-by-five alphabet square. The second digit is the column.',
      'Write the alphabet in five rows of five letters, leaving out J. Then 23 means row two, column three.',
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
      { p: "The Engine keeps a log of who has used it, and from which terminal. Jonah set it to print the terminal names as raw computer codes. 'The Syndics kept asking for the log,' he says. 'I wanted them to have to work for it.'" },
      { p: 'One terminal has been used nearly every night since March, between two and four in the morning. Every request is the same: PLAY LECTURE 1987, and a number.' },
      { mono: `TERMINAL  ${hexOf('LODGE')}` },
    ],
    ask: 'Which terminal is it?',
    answers: ['LODGE', 'THE LODGE', 'PORTERS LODGE', 'THE PORTERS LODGE'],
    solved: "4C 4F 44 47 45. L, O, D, G, E.\n\nNearly every night, somebody sits in the Porter's Lodge and asks the machine to read Dame Hesper's old lectures aloud. They never ask about ciphers, or about foxglove. They only want to hear her voice, saying what she said in 1987.",
    facts: ['lodge_nights'],
    lesson: 'ascii',
    hints: [
      'These are computer codes written in hexadecimal. That is base sixteen, where A to F stand for ten to fifteen.',
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
    ask: 'What name do the buyers give the thing they are buying? (one word)',
    answers: ['LEGACY', 'THE LEGACY', 'LORIMER LEGACY', 'THE LORIMER LEGACY'],
    near: [
      { match: ['PROVENANCE', 'CERTIFICATE', 'CERTIFICATE OF PROVENANCE'], say: 'That is the sheet he signed. The question is what the sheet is selling.' },
      { match: ['ENGINE', 'LECTERN', 'THE LECTERN', 'LORIMER ENGINE', 'CORPUS'], say: 'That is only part of it. The certificate uses one word for the whole thing.' },
    ],
    solved: "LEGACY. 'The Lorimer Legacy' is forty years of a living woman's work, plus the machine that was trained on it. It is all being sold under that one name to a London company called Greywether.\n\nIgnatius Pendry was paid to swear that every line of it was hers alone.",
    facts: ['legacy_sale'],
    lesson: 'frequency',
    hints: [
      'This is the same kind of cipher as the one on the gate, with a different shift. There are only twenty-five shifts to try, and your Wheel can try them for you.',
      'The most common letter in English is E. The most common letter on this Paper is V.',
      "V is seventeen places after E. So move every letter back seventeen places. Then do what the message says: the certificate hangs in Pendry's shop.",
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
    ask: 'What office (job title) does the message ask for? (one word)',
    answers: ['WARDEN', 'THE WARDEN', 'WARDEN OF THE COMPANY'],
    near: [
      { match: ['CLAY', 'AUBERON CLAY', 'AUBERON'], say: 'His office, not his name. What is his title in the Company?' },
      { match: ['DEPUTY', 'GUARDIAN'], say: 'That is what the court calls him. What does the Company call him?' },
    ],
    solved: "WARDEN.\n\nDame Hesper Lorimer can no longer sign her own name. Since March, a court order has let someone else sign for her. The order names 'the Warden for the time being of the Worshipful Company of Setters and Solvers'. That means whoever is Warden at the time. Today, that is Auberon Clay.\n\nSo the man who is selling her life's work is the man the law chose to look after it.",
    facts: ['warden_signs'],
    lesson: 'pigpen',
    hints: [
      'These signs are the pigpen cipher. Each letter is drawn as the lines around its cell in a grid. The key is in your Primer.',
      'The alphabet is spread over two noughts-and-crosses grids and two X shapes. Letters in the second grid and the second X have a dot.',
      'Decoded, it asks who signs for Dame Hesper now. It wants his office, meaning his title. Ask the Lectern about her, or ask people in the Hall.',
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
    solved: "Mecca. Oslo. Null Island. Everest. York.\n\nMONEY. Follow the money.\n\nMarguerite Sallow sold charts. She kept her private papers the way chart-sellers do: pressed flat inside the biggest book on her boat.",
    facts: ['follow_money'],
    lesson: 'atlas',
    hints: [
      'Each pair of numbers is a latitude, then a longitude. Find each place on a real map, or ask the Lectern what lies at those numbers.',
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
      { quote: 'This is written on a fence of three rails, in a zigzag. The Spartans wound theirs round a stick. It is the same idea.' },
      { mono: railFence(PAPER_2B, 3).match(/.{1,5}/g).join(' '), tool: 'fence' },
    ],
    ask: 'The message asks about an instrument. What is it? (one word)',
    answers: ['SEXTANT', 'A SEXTANT', 'THE SEXTANT'],
    near: [{ match: ['OCTANT', 'QUADRANT', 'ASTROLABE'], say: 'Close. That is a related instrument. She had the later kind, whose arc is a sixth of a circle.' }],
    solved: "WHAT DOES A NAVIGATOR HOLD TO THE NOON SUN TO FIND HER LATITUDE.\n\nA sextant. There is one in its box aboard the Meridian. Marguerite Sallow never kept anything just for decoration. That box is worth a look.",
    facts: ['sextant_clue'],
    lesson: 'transposition',
    hints: [
      'No letter has been swapped for another. All the letters are there, but in the wrong order.',
      'The message was written in a zigzag over three lines: down, up, down. The cipher text is the top line, then the middle line, then the bottom line. Your Fence tool can undo it.',
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
      { quote: 'For three hundred years they called this one le chiffre indéchiffrable. Use the Square, in your tools. The key is the name she set under.' },
      { mono: vigenere(PAPER_3, 'VESPER'), tool: 'square' },
    ],
    ask: 'Where does the message tell you to go? (one word)',
    answers: ['STALEMATE', 'THE STALEMATE'],
    near: [{ match: ['HESPER', 'LORIMER', 'VESPER'], say: 'That may be the key. Use it to read the message, then give the place it names.' }],
    solved: "TONIGHT THE PROBLEM ON THE SLATE AT THE STALEMATE IS MINE. SOLVE IT BEFORE THE HALL STRIKES TWELVE AND YOU MAY KEEP THE THIRD OF THEM.\n\nBy 'keep', he means keep alive.",
    facts: ['third_tonight'],
    effects: [{ mark: 'slate_open' }],
    lesson: 'vigenere',
    hints: [
      'This is a Vigenère cipher. It is a Caesar shift that changes with every letter, following the letters of a key word over and over.',
      "The key is 'the name she set under'. Setters publish their puzzles under a pen-name. Dame Hesper's pen-name is on the plate under her portrait in the Hall.",
      'The key is VESPER. Put it into the Square tool and read the message.',
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
      { p: "Tonight's problem on the Stalemate's slate is not a normal chess problem. Somebody has chalked a letter on every square of the board. Under the board is one line:" },
      { quote: `N ${SLATE.moves.join(' ')}` },
      { board: { rows: SLATE.rows } },
      { p: "'It was there when I came down at six,' says Ottilie. 'I don't know the handwriting, and I know everyone's.'" },
    ],
    ask: 'Who is the third candidate? (give his pen-name)',
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
    setter: 'invigilator',
    tier: 5,
    feed: 7,
    if: 'ev:paper_4',
    blocks: [
      { quote: 'Wheatstone invented this method, but it is named after his friend. The letters go in pairs. The key is what I am to you.' },
      { mono: playfair(PAPER_4, 'INVIGILATOR').match(/.{1,4}/g).join(' '), tool: 'frame' },
    ],
    ask: 'What is the seventh answer? (one word)',
    answers: ['TUITION'],
    solved: "LAY YOUR SEVEN ANSWERS IN A COLUMN IN THE ORDER I SET THEM. TAKE FROM EACH THE LETTER OF ITS OWN NUMBER. THE SEVENTH ANSWER IS TUITION.\n\nTuition: he has been teaching you for four days. You look the word up, because by now you look everything up. Before 'tuition' meant teaching, it meant guardianship: keeping someone safe.",
    facts: ['tuition'],
    lesson: 'playfair',
    hints: [
      'This is the Playfair cipher. A key word is written into a five-by-five square, followed by the rest of the alphabet. The message is enciphered two letters at a time.',
      "The key is 'what I am to you'. Look at how every Paper is signed.",
      'The key is INVIGILATOR. Put it into the Frame tool. Where a letter was doubled, you will see an extra X.',
      'The seventh answer is TUITION.',
    ],
  },
  meta: {
    title: 'The Order of the Papers',
    setter: 'invigilator',
    tier: 5,
    if: 'puz:paper4',
    blocks: [
      { p: 'Here are the seven questions, in the order they were set, with your answers. Write the answers in a column. Take the first letter of the first answer, the second letter of the second, and so on.' },
      { feeds: true },
    ],
    ask: 'What place do the seven letters spell?',
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
    setter: 'invigilator',
    tier: 5,
    if: 'examined:door_pendry',
    blocks: [
      { p: "This is Ignatius Pendry's letter-lock, taken off his door and labelled as evidence. It has seven rings. Its word was changed the day before he died. The Paper that came down his tube told him so:" },
      { quote: 'The door now opens to one name. It is in everything you sold.' },
      { p: 'His blotter shows the words he tried: PENDRYS, HOROLOG, and LORIMER twice. He was still trying at midnight.' },
    ],
    ask: 'What word opens it?',
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
    setter: 'hesper',
    tier: 4,
    if: 'flag:dame_clue',
    blocks: [
      { p: 'Dame Hesper said it twice, looking out at the garden. The second time, she tapped the arm of her chair once for every letter.' },
      { quote: 'Left, characteristic, likeness. Eight. I put it there so it would be behind me. It is always behind me, dear.' },
    ],
    ask: 'What is the eight-letter answer to her clue?',
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
    setter: 'invigilator',
    tier: 5,
    if: 'visited:lantern',
    blocks: [
      { p: "The Founder's Orrery turns inside an iron grille. The Warden is lying on the floor inside it. His face is grey and he is breathing hard. The gate in the grille is shut with a seven-ring letter-lock." },
      { quote: 'The gate opens to one name. It is in everything you sold.' },
      { p: 'It is the same question the Invigilator set the other three. None of them answered it.' },
    ],
    ask: 'What word do you set the rings to?',
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
    setter: 'invigilator',
    tier: 5,
    secret: true,
    if: 'ev:paper_4',
    blocks: [
      { p: 'A line is written across the top of Paper IV. Its capitals are in strange places. The Invigilator is never careless, so this is deliberate.' },
      { marked: baconHide('ARIADNE', 'Nothing is hidden that a patient eye will not find.') },
    ],
    ask: 'What word is hidden in it? (seven letters)',
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

  // ------------------------------------------------- the Wall of Tithes (extra)
  tithe_square: {
    title: 'A Tithe: the Engraver\'s Square',
    setter: 'fold',
    tier: 2,
    extra: true,
    if: 'examined:tithe_wall',
    blocks: [
      { p: "A child's Tithe, pinned low on the wall and written in careful ink. Every row, every column and both long diagonals must add up to the same total." },
      { grid: ['16  3  2 13', ' 5 10 11  8', ' 9  6  7 12', ' 4  ?  ?  1'], numbers: true },
      { quote: 'The two I have left out are side by side for a reason. Read them together and say what they are. — Kit Quoin, aged 9' },
    ],
    ask: 'Read the two missing numbers side by side. What four-digit number do they make?',
    answers: ['1514'],
    solved: "Fifteen and fourteen: 1514.\n\nThis is the magic square from Albrecht Dürer's engraving Melencolia I, on the wall behind the angel. Dürer made the engraving in 1514. He put the year in the middle of the bottom row, where anyone can see it and almost nobody notices. Kit was nine when she set this. Somebody had been leaving puzzles in her lunch tin.",
    facts: ['tithe_done'],
    lesson: 'magic',
    hints: [
      'Add up any complete row. That is the total every line must make.',
      'Each line makes 34. The bottom row already has 4 and 1.',
      'The second column needs 15. The third column needs 14.',
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
      { p: "Pinned above it is a Tithe in a surveyor's handwriting, with a sketch of the river and the Cut." },
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
    solved: "Count the bridges that touch each place. North Bank: four. Eyot: four. The Fold: three. South Bank: three.\n\nA walk like this must start at one of the odd places and finish at the other. Leonhard Euler proved this in 1736, for the seven bridges of Königsberg. His proof began a whole branch of mathematics. She ended in the Fold, so she began on the South Bank.",
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
      { p: 'Highest on the wall, behind glass and brown with age, is a tray of fifteen numbered tiles and one gap. The tiles are in order, except the last two, which have swapped places.' },
      { grid: [' 1  2  3  4', ' 5  6  7  8', ' 9 10 11 12', '13 15 14  _'], numbers: true },
      { quote: 'A hundred guineas to the member who slides them into order. — the Warden, 1911. (Unclaimed.)' },
    ],
    ask: 'Can it be done? (one word)',
    answers: ['IMPOSSIBLE', 'NO', 'NEVER', 'IT CANNOT', 'CANNOT', 'UNSOLVABLE', 'INSOLUBLE'],
    solved: "No. And the Warden of 1911 knew that when he offered the prize.\n\nEvery arrangement of the tiles belongs to one of two families. No series of slides can move a tray from one family to the other. With two tiles swapped, this tray is in the wrong family, and it always will be. The American puzzle-maker Sam Loyd offered a thousand dollars for the same puzzle and never had to pay.\n\nThis is the Fold's oldest lesson, and the reason the tray is still on the wall. Some puzzles are set by people who know there is no way out.",
    facts: ['tithe_done', 'unfair_known'],
    lesson: 'fifteen',
    hints: [
      "People tried for a hundred years. Don't ask how to win the prize. Ask why nobody ever did.",
      'Read the tiles row by row and count the pairs in the wrong order. Whenever the gap is back in its corner, that count has changed by an even number.',
      'Here one pair is out of order, which is an odd number. The solved tray has none, which is even. No series of slides can get from one to the other.',
      'It is IMPOSSIBLE.',
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
