// What the Lectern can show: lecture cards on how things are done and where
// they came from, and the Company's records about its people.
//
// The lecture cards are real history and real method. They are written to be
// true outside the game: a player who goes and looks any of it up should find
// it so.
//
// keys: words a query might use (the scripted fallback matches on these; the
//       AI reads title + keys + body)
// if:   when the card becomes reachable (omit = always)
// facts / effects: paid out the first time the card is opened

/** @type {Record<string, any>} */
export const RECORDS = {
  // ================================================================ LECTURES
  l_caesar: {
    title: 'Lecture · The Caesar cipher',
    kind: 'lecture',
    keys: ['caesar', 'shift', 'shift cipher', 'three back', 'substitution', 'alphabet', 'gate cipher', 'suetonius'],
    body: `THE CAESAR CIPHER
Every letter is moved the same number of places along the alphabet. With a shift of three, A becomes D, B becomes E, and CAT becomes FDW. To read it, move every letter three back.
Suetonius, writing about a hundred and fifty years after Julius Caesar's death, says that is exactly what Caesar did in his private letters: "the fourth letter of the alphabet for the first". His heir Augustus, less cautious, shifted by one.
There are only twenty-five possible shifts. A cipher with twenty-five keys is a cipher a child can open by trying them all. That is why every child here does.`,
  },
  l_rot13: {
    title: 'Lecture · ROT13',
    kind: 'lecture',
    keys: ['rot13', 'thirteen', 'halfway', 'usenet', 'self-inverse'],
    body: `ROT13
A Caesar shift of thirteen: exactly half the alphabet. Because twice thirteen is twenty-six, the same turn that hides a message brings it back. A swaps with N, B with O.
It is the newest old cipher there is. In the early 1980s the people who wrote to each other on the Usenet news groups used it to cover the last line of a joke, or the ending of a film, so that nobody read it by accident. It was never meant to keep a secret. It was meant to make you choose to look.`,
  },
  l_frequency: {
    title: 'Lecture · Counting letters',
    kind: 'lecture',
    keys: ['frequency', 'count', 'counting letters', 'commonest', 'common letter', 'break', 'al-kindi', 'kindi', 'cryptanalysis', 'etaoin'],
    body: `COUNTING LETTERS
In any long piece of English, E is the commonest letter, then T, A, O, I, N. A cipher that swaps each letter for another, always the same, cannot hide that: the commonest sign in the cipher is very likely E in disguise.
The method was written down in Baghdad in the ninth century by the philosopher al-Kindi, in a treatise on deciphering secret messages. It is the oldest known trick of the code-breaker and it killed every simple substitution cipher for good.
For a Caesar cipher you need only find E. Count; find the commonest letter; measure how far it stands from E. That distance is the shift.`,
  },
  l_pigpen: {
    title: 'Lecture · The pigpen',
    kind: 'lecture',
    keys: ['pigpen', 'pig pen', 'masonic', 'freemason', 'grid cipher', 'tic-tac-toe', 'noughts and crosses', 'signs', 'symbols'],
    body: `THE PIGPEN CIPHER
Draw a noughts-and-crosses grid and write A to I in its nine cells. Draw another, put a dot in every cell, and write J to R. Draw a large X and write S, T, U, V in its four arms; draw another with dots for W, X, Y, Z.
Each letter is then written as the shape of its own cell: the lines that fence it in, with the dot if it has one. A is a corner like a backwards L. E is a square. S is a V-shape.
The Freemasons used it in the eighteenth century for their records, and it is often called the masonic cipher, but versions of it are older. It looks mysterious and is no stronger than Caesar's: each sign always means the same letter. The key is in your Primer.`,
  },
  l_polybius: {
    title: 'Lecture · The five-by-five square',
    kind: 'lecture',
    keys: ['polybius', 'square', 'five by five', '5x5', 'pairs of numbers', 'row and column', 'tap code', 'punched', 'collar'],
    body: `THE POLYBIUS SQUARE
Write the alphabet into a square of five rows and five columns, letting I and J share a cell. Every letter now has two numbers: its row, then its column. A is 11. B is 12. H is 23. Z is 55.
The Greek historian Polybius described it in the second century before Christ as a way of signalling with torches: so many held up on the left, so many on the right.
It has never gone away. Any message that can be sent as two small numbers can be sent by anything: knocks, flashes, knots, holes punched in brass. Prisoners have tapped it through cell walls.`,
  },
  l_transposition: {
    title: 'Lecture · The rail fence and the scytale',
    kind: 'lecture',
    keys: ['rail fence', 'railfence', 'zigzag', 'transposition', 'scytale', 'spartan', 'sparta', 'out of order', 'fence', 'rails'],
    body: `TRANSPOSITION
A substitution cipher changes the letters. A transposition cipher keeps every letter and changes only their order.
The Spartans are said to have wound a strip of leather round a staff, the scytale, and written along its length; unwound, the strip was a jumble, and only a staff of the same thickness put it right. Plutarch describes it.
The rail fence is the same idea on paper. Write the message as a zigzag over three lines, down and up and down. Then copy out the top line, the middle line and the bottom line one after another. To read it, you must know the number of rails and rebuild the zigzag.
A count of letters gives a transposition away at once: E is still the commonest, because every letter is still itself.`,
  },
  l_vigenere: {
    title: 'Lecture · Le chiffre indéchiffrable',
    kind: 'lecture',
    keys: ['vigenere', 'vigenère', 'indechiffrable', 'indéchiffrable', 'polyalphabetic', 'key word', 'keyword', 'bellaso', 'tabula recta', 'kasiski', 'babbage', 'square'],
    body: `THE VIGENÈRE CIPHER
Take a key word, say LEMON, and write it over and over above your message. Each letter of the message is then moved by a Caesar shift, and the shift is set by the key letter above it: A moves it nothing, B one place, L eleven. The same plain letter comes out differently each time, so counting letters no longer finds E.
It was described by Giovan Battista Bellaso in 1553. It carries the name of Blaise de Vigenère, who published a different cipher thirty years later, because the nineteenth century got its footnotes wrong. For three hundred years it was called le chiffre indéchiffrable: the cipher that cannot be deciphered.
It can. Charles Babbage broke it privately in the 1850s and a Prussian officer, Friedrich Kasiski, published the method in 1863: find repeated fragments, measure the gaps between them, and you have the length of the key.
With the key word in your hand it is no trouble at all. The table for working it by eye, the tabula recta, is in your Primer.`,
  },
  l_playfair: {
    title: 'Lecture · The Playfair cipher',
    kind: 'lecture',
    keys: ['playfair', 'wheatstone', 'pairs', 'two by two', 'digraph', 'key square', 'frame'],
    body: `THE PLAYFAIR CIPHER
Invented in 1854 by Charles Wheatstone, who also gave us the concertina, and named for his friend Lord Playfair, who talked the government into using it. The British army carried it through the Boer War and the First World War.
Write a key word into a square of five by five, each letter once, and fill the rest with the remaining alphabet, I and J sharing. Break the message into pairs of letters; a doubled letter is parted with an X, and an odd one out gets an X for company.
For each pair: if the two letters are in the same row of the square, take the letter to the right of each. In the same column, the letter below each. Otherwise they are opposite corners of a rectangle: take the other two corners, each from its own row. To read a message, do it backwards: left, up, and corners again.
Because it works on pairs, counting single letters tells an eavesdropper nothing. With the key word it takes a few minutes with a pencil.`,
  },
  l_bacon: {
    title: "Lecture · Bacon's two-letter cipher",
    kind: 'lecture',
    keys: ['bacon', 'biliteral', 'bilateral', 'two typefaces', 'capitals', 'hidden in the letters', 'steganography', 'epigraph', 'francis bacon'],
    body: `BACON'S CIPHER
Francis Bacon published it in 1623. It hides a message not in what a sentence says but in how its letters look.
Give every letter of the alphabet a code of five marks, each either a or b. Counting in twos: A is aaaaa, B is aaaab, C is aaaba, and so on up. (Bacon's own table ran I with J and U with V; the modern form gives each letter its own code.)
Then write any innocent sentence at all, in two kinds of letter: two typefaces, or upright and sloping, or small and capital. Every letter of the sentence carries one mark. Five letters of the cover carry one letter of the secret.
"A man may write anything by means of anything," Bacon said. It is the ancestor of every way of hiding a message inside something that looks like nothing.`,
  },
  l_ascii: {
    title: 'Lecture · Letters as numbers',
    kind: 'lecture',
    keys: ['ascii', 'hex', 'hexadecimal', 'bytes', 'binary', 'computer', 'code for letters', '4c', 'base sixteen'],
    body: `LETTERS AS NUMBERS
A machine keeps a letter as a number. The table nearly all of them still share was agreed in America in 1963 and is called ASCII. In it the capital letters run in order: A is 65, B is 66, up to Z at 90.
Engineers usually write those numbers in hexadecimal, base sixteen, where the digits run 0 to 9 and then A to F for ten to fifteen. In hexadecimal A is 41, B is 42, J is 4A, O is 4F, Z is 5A.
So a string of two-figure codes beginning with 4 or 5 is almost always somebody's capital letters, written the way a machine remembers them. Take away 40 and count: 4C is the twelfth letter.`,
  },
  l_atlas: {
    title: 'Lecture · Latitude, longitude and an island that is not there',
    kind: 'lecture',
    keys: ['latitude', 'longitude', 'coordinates', 'null island', '0 n 0 e', 'equator', 'prime meridian', 'where is', 'atlas', 'degrees', 'what lies at'],
    body: `FINDING A PLACE BY TWO NUMBERS
Latitude says how far north or south of the equator you are; longitude, how far east or west of the line through Greenwich. Latitude is given first.
A few places every map-maker knows by heart:
  21.42° N, 39.83° E   Mecca
  59.91° N, 10.75° E   Oslo
  27.99° N, 86.93° E   the summit of Mount Everest
  53.96° N, 1.08° W    York
  48.86° N, 2.35° E    Paris
  29.98° N, 31.13° E   the Great Pyramid at Giza
  51.48° N, 0.00°      Greenwich
  0° N, 0° E           open sea in the Gulf of Guinea
That last point is where the equator crosses the prime meridian. There is nothing there but a weather buoy. But every computer that fails to find an address files it at nought, nought, so that spot is the most crowded empty place on earth, and the people who make maps have given it a name: NULL ISLAND.
Map-makers enjoy places that do not exist. They have long drawn false ones on purpose, a "trap street" or a "paper town", to catch anyone who copies their work. Agloe, New York, was invented by two cartographers in the 1930s and later, to their surprise, acquired a shop.`,
  },
  l_time: {
    title: 'Lecture · Why the Fold is eleven minutes slow',
    kind: 'lecture',
    keys: ['time', 'eleven minutes', 'fold time', 'local time', 'railway time', 'greenwich', 'two minute hands', 'longitude and time', 'harrison', 'chronometer'],
    body: `LOCAL TIME
Noon is when the sun is highest, and that moment travels west with the sun: four minutes for every degree of longitude. Until the 1840s every town in England kept its own noon. Bristol's clocks ran ten minutes behind London's, and nobody minded, because nobody could get from one to the other in less than a day.
The railways ended that. The Great Western adopted London time in 1840, other lines followed, and in 1880 Greenwich time became the law. For some years the clock on the Exchange in Bristol carried two minute hands, one for each time. It still does.
The Fold lies two and three-quarter degrees west of Greenwich, which is eleven minutes, and it has never seen why it should keep another town's noon.
The same sum is how ships found their way. If you carry a clock that still tells Greenwich time and compare it with your own noon, the difference is your longitude. John Harrison, a carpenter's son, spent his life building a clock good enough, and finished it in 1759.`,
  },
  l_turk: {
    title: 'Lecture · The chess-player of 1770',
    kind: 'lecture',
    keys: ['turk', 'chess automaton', 'chess-player', 'kempelen', 'maelzel', 'automaton', 'lodger', '1770', 'poe', 'man inside', 'mechanical'],
    body: `THE AUTOMATON CHESS-PLAYER
In 1770 Wolfgang von Kempelen showed the court in Vienna a life-size figure seated at a cabinet, which played chess, and won. For eighty-four years it toured Europe and America. It beat Napoleon and Benjamin Franklin. Learned men wrote books arguing whether a machine could think.
It could not. The cabinet was full of show machinery arranged round a sliding seat, and on the seat sat a strong chess-player who watched the board from below by magnets and worked the arm with levers. When the showman opened one door, the man slid behind the other.
In 1836 a young American journalist published an essay reasoning out, from the outside, that there must be a person inside. His name was Edgar Allan Poe, and five years later he invented the detective story.
It burned in a fire in Philadelphia in 1854. The lesson has not: when a machine seems to be doing something only a person could do, look for the person.`,
  },
  l_ai: {
    title: 'Lecture · Can a machine think?',
    kind: 'lecture',
    keys: ['turing', 'turing test', 'imitation game', 'eliza', 'artificial intelligence', 'can a machine think', 'ai', 'language model', 'are you alive', 'what are you'],
    body: `THE IMITATION GAME
In 1950 Alan Turing, who had spent the war breaking ciphers at Bletchley Park, proposed a test. Put a person and a machine behind a screen and let a judge question both in writing. If the judge cannot tell which is which, he asked, on what grounds do we say the machine is not thinking?
Sixteen years later Joseph Weizenbaum wrote a small program called ELIZA that answered like a patient listener, mostly by turning your own sentence into a question. It understood nothing. People confided in it anyway, and Weizenbaum was dismayed by how little it took.
A machine like this one is made by having it read a very great deal and learn what tends to follow what. It can explain, summarise and imitate a voice. It is only as honest as what it was given to read. If it was told that a thing was written by one person, it will go on saying so.`,
  },
  l_stylometry: {
    title: 'Lecture · Stylometry',
    kind: 'lecture',
    keys: ['stylometry', 'authorship', 'who wrote', 'two authors', 'function words', 'federalist', 'style', 'clusters'],
    body: `WHO WROTE IT?
Every writer has habits too small to notice: how often they use "the", "of", "but", "upon"; how long their sentences run. Nobody chooses these, so nobody can easily disguise them.
In 1964 two statisticians, Frederick Mosteller and David Wallace, counted such words in the Federalist papers, twelve of which were claimed by both Alexander Hamilton and James Madison. Hamilton liked "upon"; Madison almost never used it. The count gave all twelve to Madison.
The method is called stylometry. A modern machine does the same with hundreds of features at once and draws each text as a dot; texts by one hand gather into one cloud. Two clouds mean two writers, whatever the title page says.`,
  },
  l_nina: {
    title: 'Lecture · The Nina',
    kind: 'lecture',
    keys: ['nina', 'hidden word', 'hidden message', 'hirschfeld', 'diagonal', 'in the grid', 'signature', 'slantwise'],
    body: `THE NINA
The American caricaturist Al Hirschfeld had a daughter, Nina, born in 1945. From then on he hid her name in the lines of his drawings, in a sleeve, a curl, a fold of curtain, and put a small number by his signature to say how many times.
Crossword setters borrowed the word. A Nina is something the setter has hidden in the finished grid, apart from the answers: a name round the edge, a phrase along a row, a word running corner to corner. It is no help in solving. It is there for the solver who, having finished, goes on looking.
Some setters never use one. Some sign everything.`,
  },
  l_cryptic: {
    title: 'Lecture · How a cryptic clue works',
    kind: 'lecture',
    keys: ['cryptic', 'cryptic clue', 'crossword clue', 'definition', 'wordplay', 'charade', 'anagram', 'torquemada', 'ximenes', 'how do clues work'],
    body: `THE CRYPTIC CLUE
The crossword was invented by Arthur Wynne of Liverpool for a New York newspaper in December 1913. The cryptic kind is British, and dates from the 1920s.
A fair cryptic clue is two things at once. At one end, the beginning or the finish, is a plain definition of the answer. The rest is a recipe for making the same word another way: an anagram, a word hidden inside others, or smaller words set side by side, which is called a charade. The number in brackets is the length of the answer.
So "Vehicle, then animal: a covering for the floor (6)" is not about a journey. A vehicle is a CAR; an animal you keep is a PET; and a CARPET covers the floor. The surface is there to mislead. The parts are there to be fair.
As the setter Afrit put it: "You need not mean what you say, but you must say what you mean."`,
  },
  l_pseudonyms: {
    title: "Lecture · Setters' pen-names",
    kind: 'lecture',
    keys: ['pen-name', 'pen name', 'pseudonym', 'vesper', 'hesper', 'censor', 'torquemada', 'ximenes', 'azed', 'who is', 'name she set under', 'sets as'],
    body: `PEN-NAMES
Setters of cryptic crosswords publish under a pen-name. The first great one, Edward Powys Mathers of the Observer, called himself Torquemada, after the Grand Inquisitor; his successors were Ximenes and Azed, Inquisitors likewise. The solver is the heretic.
The Company has used pen-names since long before crosswords, and enters each member's in the Rolls. Some now in use:
  VESPER — Dame Hesper Lorimer. (Hesper and Vesper are the Greek and the Latin for the evening star.)
  CENSOR — L. Voss, of the Crux.
  REGULATOR — I. Pendry.
  RHUMB — M. Sallow.
  MAJORITY — A. Clay.`,
    facts: ['vesper_name'],
  },
  l_knight: {
    title: 'Lecture · Reading the chessboard',
    kind: 'lecture',
    keys: ['chess notation', 'algebraic', 'knight', 'knight\'s tour', 'knights tour', 'b1', 'files and ranks', 'how do i read chess', 'euler'],
    body: `THE BOARD AND THE KNIGHT
A chessboard is named like a street map. The eight columns, the files, are lettered a to h from White's left. The eight rows, the ranks, are numbered 1 to 8 from White's side, the bottom of a printed board. So a1 is the bottom left corner and h8 the top right.
The knight is written N. It moves two squares one way and one square across, like a capital L, and it is the only piece that jumps.
A sequence of knight moves that visits squares without repeating is an old puzzle. A knight's tour of all sixty-four squares was known to the chess masters of Baghdad in the ninth century, and Leonhard Euler wrote a paper on it in 1759.
Setters have long used the knight to hide a message: write a letter on every square, and only someone following the right path reads the right ones.`,
  },
  l_magic: {
    title: 'Lecture · Magic squares',
    kind: 'lecture',
    keys: ['magic square', 'lo shu', 'durer', 'dürer', 'melencolia', '34', 'rows and columns'],
    body: `MAGIC SQUARES
A magic square is a grid of different numbers in which every row, every column and both long diagonals add up to the same sum.
The oldest, the Lo Shu of ancient China, is three by three and sums to fifteen; the legend is that it was seen on the shell of a turtle.
The most famous in Europe hangs on the wall behind the angel in Albrecht Dürer's engraving Melencolia I. It is four by four and sums to thirty-four. Dürer arranged it so that the two middle numbers of the bottom row give the year he made it.`,
  },
  l_bridges: {
    title: 'Lecture · The seven bridges of Königsberg',
    kind: 'lecture',
    keys: ['bridges', 'konigsberg', 'königsberg', 'euler', 'seven bridges', 'graph', 'cross each once'],
    body: `THE BRIDGES OF KÖNIGSBERG
The Prussian city of Königsberg had a river, two islands and seven bridges, and a Sunday pastime: to walk a route crossing every bridge exactly once.
In 1736 Leonhard Euler showed that it could not be done, and why. Forget the shape of the town; count only how many bridges touch each piece of land. Wherever you pass through a place you use two bridges, one in and one out. So every place must have an even number of bridges, except the two where you start and finish. Königsberg had four places and every one of them odd.
If exactly two places are odd, the walk can be done, but only by starting at one of them and ending at the other.
It is counted as the beginning of a whole branch of mathematics, the theory of graphs, which now runs every map on every telephone.`,
  },
  l_fifteen: {
    title: 'Lecture · The fifteen puzzle',
    kind: 'lecture',
    keys: ['fifteen puzzle', '15 puzzle', 'sliding', 'tiles', 'sam loyd', '14 and 15', 'hundred guineas', 'impossible', 'parity'],
    body: `THE FIFTEEN PUZZLE
Fifteen numbered tiles in a tray made for sixteen, to be slid into order. It was made by a postmaster in New York State and in 1880 it drove America and then Europe out of their wits.
The famous version starts with every tile in order except the 14 and the 15, which have changed places. The American puzzle-maker Sam Loyd, who later claimed to have invented the thing, offered a thousand dollars to anyone who could put them right. He was never asked to pay.
He knew he never would be. Two mathematicians had already proved it in 1879: every slide changes the arrangement in a way that can only be undone by another slide, so the arrangements fall into two halves that can never reach each other. Two tiles swapped is in the wrong half.
A puzzle with no solution is not a hard puzzle. It is something else, and it is as well to know which you have been handed.`,
  },
  l_meta: {
    title: 'Lecture · Puzzles made of puzzles',
    kind: 'lecture',
    keys: ['meta', 'metapuzzle', 'puzzle hunt', 'answers together', 'order of the papers', 'seven answers'],
    body: `THE META-PUZZLE
A puzzle hunt is a set of puzzles whose answers are themselves the pieces of one more. That last one is called the meta. Its solver must have every earlier answer, and must see how they fit: a letter from each, read in order, is the oldest way.
The best known hunt has been held at a technical university in Massachusetts every January since 1981; the winners write the next year's.
A well-made meta is fair in a particular way: once you have seen it, you realise that every earlier answer was chosen for it from the beginning.`,
  },
  l_clue: {
    title: 'Lecture · Ariadne, and the word "clue"',
    kind: 'lecture',
    keys: ['ariadne', 'clue', 'clew', 'thread', 'theseus', 'labyrinth', 'minotaur', 'etymology', 'whose thread'],
    body: `ARIADNE AND THE CLEW
In the old story the Minotaur was kept at the middle of a labyrinth on Crete that nobody had ever walked out of. Ariadne, the king's daughter, gave the Athenian Theseus a ball of thread. He tied one end at the door, unwound it as he went in, killed the monster, and followed the thread back out.
The English word for a ball of thread was "clew". By the seventeenth century a clew meant anything that guides you through a maze, and then anything that guides you to an answer. The spelling changed. The word is "clue".
So every clue you have ever followed was, strictly speaking, Ariadne's.`,
  },
  l_invigilator: {
    title: 'Lecture · Invigilator',
    kind: 'lecture',
    keys: ['invigilator', 'invigilate', 'proctor', 'what is an invigilator', 'vigil'],
    body: `INVIGILATOR
In Britain, the person who watches over an examination: who gives out the papers, starts the clock, and sees that nobody cheats. In America the word is proctor. It comes from the Latin vigilare, to stay awake and keep watch.
An invigilator sets no questions and marks no answers. An invigilator sits at the back, keeps the time, and says nothing.
At the Company's Proving the candidates face the front. They are not to look round.`,
  },
  l_foxglove: {
    title: 'Lecture · Foxglove',
    kind: 'lecture',
    keys: ['foxglove', 'digitalis', 'digoxin', 'withering', 'poison', 'heart', 'physic garden'],
    body: `FOXGLOVE
Digitalis purpurea, a tall purple flower of English hedgerows, and one of the oldest heart medicines there is. The physician William Withering published his account of it in 1785, having learned of it from a country herbalist. Drugs made from it are still prescribed.
The difference between the dose that helps and the dose that harms is small, which is why every part of the plant is counted a poison. It acts on the heart, slowly, over hours.
Modern hospitals keep a specific antidote. It works quickly, if the patient is brought in time.
The Company's Physic Garden, at the Almshouses, has grown foxglove since the garden was laid out.`,
    facts: ['physic_foxglove'],
  },
  l_bellows: {
    title: 'Lecture · The Bellows',
    kind: 'lecture',
    keys: ['bellows', 'pneumatic', 'tube', 'tubes', 'carrier', 'exchange', 'hold-rack', 'hold rack', 'post'],
    body: `THE PNEUMATIC POST
A message is put in a capsule, the carrier, and the carrier is blown along a pipe by air. London had the first in 1853, between the telegraph office and the Stock Exchange. Paris ran four hundred kilometres of tube under its streets until 1984; Prague's worked until a flood in 2002.
The Fold's was laid in 1867 and has never been turned off. Every building has an outlet. All tubes meet at the exchange in the lobby of Setters' Hall.
Beside the exchange is the hold-rack. A carrier placed in one of its cradles waits there until the dial on the cradle runs down, and is then sent on by clockwork. It was put in so that members could send each other birthday puzzles at the proper hour.
Every carrier is punched on its collar as it passes the exchange, row and column, in the five-by-five square.`,
  },
  l_letterlock: {
    title: 'Lecture · Letter-locks',
    kind: 'lecture',
    keys: ['letter-lock', 'letter lock', 'combination', 'seven rings', 'setting-pin', 'setting pin', 'word lock'],
    body: `LETTER-LOCKS
A lock that opens to a word instead of a key: a row of rings, each engraved with the alphabet, which release the bolt only when the right letters stand in line. They were a novelty in the seventeenth century and the Company has made them ever since.
A Company privacy lock has seven rings and is fitted on the inside of a member's own door. Seven rings give more than eight thousand million words; nobody opens one by trying.
The word is changed from the back with a thin steel setting-pin. The pins for the Syndics' locks are kept on the key board in the Porter's Lodge.`,
  },
  l_proving: {
    title: 'Lecture · The Proving',
    kind: 'lecture',
    keys: ['proving', 'examination', 'rank', 'novice', 'solver', 'setter', 'grand setter', 'tithe', 'company', 'worshipful'],
    body: `THE PROVING
The Company's examination, held in the Hall on the Thursday of the second full week of October since 1611. A member rises by it: Novice, Solver, Setter, Grand Setter.
It is sat in silence, three hours, the candidates facing the front. The paper is set by a Grand Setter appointed by the Warden; for forty years, until 2011, that was Dame Hesper Lorimer.
On the night of the Proving the Warden goes up alone to the Lantern on the roof of the Hall to wind the Founder's Orrery, as every Warden has.
Separately, every member owes the Company one new puzzle each year: the Tithe. The best are shown on the Wall of Tithes.`,
  },

  // ================================================================= RECORDS
  pendry_bio: {
    title: 'Rolls · PENDRY, Ignatius',
    kind: 'person',
    keys: ['pendry', 'ignatius', 'clockmaker', 'horologist', 'regulator'],
    body: `PENDRY, Ignatius. Born 1954. Pen-name REGULATOR.
Horologist and maker of automata, 4 Nonesuch Row. Grand Setter 1991. Syndic since 2009.
Maker of the reconstruction of the Kempelen chess-player ("the Lodger").
No family living. One apprentice: TANDY, Wilfred.`,
  },
  sallow_bio: {
    title: 'Rolls · SALLOW, Marguerite',
    kind: 'person',
    keys: ['sallow', 'marguerite', 'map-maker', 'cartographer', 'meridian', 'rhumb', 'charts'],
    if: 'act>=2',
    body: `SALLOW, Marguerite. Born 1959. Pen-name RHUMB.
Cartographer. Has drawn the Company's maps of Ravel since 1994. Lives and trades aboard the narrowboat MERIDIAN, Chandlers' Stairs.
Grand Setter 1996. Syndic since 2014.
Surveyor to the Company: prepared the schedule of properties for the Greywether partnership.`,
  },
  voss_bio: {
    title: 'Rolls · VOSS, Lucan',
    kind: 'person',
    keys: ['voss', 'lucan', 'censor', 'crux', 'editor', 'crossword editor'],
    body: `VOSS, Lucan. Born 1967. Pen-name CENSOR.
Editor of the Crux since 2003; sets its crossword. Office: above the Stalemate, Proving Square.
Grand Setter 2001. Syndic since 2015.`,
    facts: ['censor_is_voss'],
  },
  clay_bio: {
    title: 'Rolls · CLAY, Auberon',
    kind: 'person',
    keys: ['clay', 'auberon', 'warden', 'majority'],
    body: `CLAY, Auberon. Born 1962. Pen-name MAJORITY.
Warden of the Company since 2011, in succession to Dame Hesper Lorimer.
Setter 1990. Grand Setter (by vote of the Syndics) 2010.
Tithes on file: nine, the last in 2008.`,
  },
  hesper_bio: {
    title: 'Rolls · LORIMER, Dame Hesper',
    kind: 'person',
    keys: ['hesper', 'lorimer', 'dame', 'vesper', 'late tithes'],
    body: `LORIMER, Dame Hesper. Born 1951. Pen-name VESPER.
Grand Setter 1979, the youngest ever made. Set the Proving 1971 to 2011. Warden 1994 to 2011.
Catalogue: 1,104 papers, lectures and Tithes. The twelve LATE TITHES (2012 to 2023) are catalogued as her sole work and are on display in the Repository.
Resident at No. 4, the Almshouses, since March. No family living.`,
  },
  court_order: {
    title: 'Court · Deputyship of Dame H. Lorimer',
    kind: 'record',
    keys: ['court', 'deputy', 'deputyship', 'guardian', 'who signs', 'signs for', 'sign for her', 'capacity', 'order'],
    if: { any: ['ev:paper_1', 'met:clay', 'met:hesper'] },
    body: `COURT OF PROTECTION. ORDER, 11 March.
In the matter of Dame Hesper LORIMER.
The court being satisfied that she lacks capacity to manage her property and affairs, IT IS ORDERED that "the Warden for the time being of the Worshipful Company of Setters and Solvers" be appointed her deputy, with authority to sign on her behalf.
Applicant: A. Clay, Warden. Medical evidence: on affidavit of the applicant.
No relative was notified. None is known.`,
    facts: ['warden_signs'],
  },
  greywether: {
    title: 'Company · Greywether plc',
    kind: 'record',
    keys: ['greywether', 'buyer', 'london', 'sale', 'legacy', 'partnership', 'who is buying'],
    if: { any: ['fact:legacy_sale', 'fact:masterplan', 'fact:completion_31', 'fact:certificate_sole'] },
    body: `GREYWETHER PLC, London. "Machine reasoning for the knowledge economy."
Announced in September: agreement to acquire THE LORIMER LEGACY from the Worshipful Company of Setters and Solvers, comprising the complete works of Dame Hesper Lorimer and the Lorimer Engine, with the freehold of Setters' Hall and scheduled properties, for a sum not disclosed.
The press release describes the twelve Late Tithes as "the jewel of the collection: the mature style of the greatest puzzle-maker of the age, and the benchmark against which our systems will be trained."
Completion: 31 October.`,
    facts: ['legacy_sale'],
  },
  late_tithes: {
    title: 'Catalogue · The Late Tithes',
    kind: 'record',
    keys: ['late tithes', 'tithes', '2012', 'who set the late', 'catalogue', 'fair copies'],
    body: `THE LATE TITHES. Twelve annual papers, 2012 to 2023.
Catalogued as: LORIMER, Dame Hesper (VESPER). Sole author.
Each is a paper of seven clues with seven-letter answers, solved into a square by the winner of that year's Proving.
Manuscripts: none in the author's hand survive after 2011. Fair copies: in the hand of the Company's copyist. Fair-copy books: transferred to the Warden's keeping, January.
Provenance certified by I. Pendry, Syndic.`,
    facts: ['no_manuscripts'],
  },
  rolls_search: {
    title: 'Rolls · search: ARIADNE',
    kind: 'record',
    keys: ['ariadne', 'rolls', 'is there an ariadne', 'member called', 'fettle'],
    if: { any: ['fact:nina_ariadne', 'fact:word_ariadne', 'fact:epigraph_ariadne'] },
    body: `ROLLS OF THE COMPANY, 1426 to date. Search: ARIADNE.
No member of that name, or of that pen-name, is entered.
Note: the Rolls record members of the Company. Persons in the Company's employment, and their families, are not entered.`,
    facts: ['not_in_rolls'],
  },
  staff: {
    title: "Hall · Persons in the Company's employment",
    kind: 'record',
    keys: ['staff', 'servants', 'employment', 'porter', 'fettle', 'hob', 'employees', 'who works'],
    body: `PERSONS IN THE COMPANY'S EMPLOYMENT
FETTLE, Robert. Porter. Engaged 1979 (boot-boy). Lodge. Copyist to Dame H. Lorimer from 1984.
ABARA, Dolores. Nurse, Almshouses. Engaged March.
OKAFOR-REED, Jonah. Engineer to the Repository (member: Solver).
Under notice from 31 October: the Lodge.`,
    facts: ['hob_copyist'],
  },
};
