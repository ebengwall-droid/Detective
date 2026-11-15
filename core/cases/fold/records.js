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
A Caesar cipher moves every letter the same number of places along the alphabet.
Example, with a shift of three: A becomes D, B becomes E, and CAT becomes FDW.
After Z, go back to the start of the alphabet. So X becomes A, Y becomes B and Z becomes C.
To read the message, move every letter three places back.
The Roman writer Suetonius wrote about 150 years after Julius Caesar's death. He says Caesar used this cipher in his private letters. Caesar wrote D, the fourth letter, in place of A, the first. Caesar's heir, Augustus, used a shift of one.
There are only twenty-five possible shifts. So anyone can break the cipher by trying them all. Every child in the Fold can do it.`,
  },
  l_rot13: {
    title: 'Lecture · ROT13',
    kind: 'lecture',
    keys: ['rot13', 'thirteen', 'halfway', 'usenet', 'self-inverse'],
    body: `ROT13
ROT13 is a Caesar cipher with a shift of thirteen. Thirteen is exactly half the alphabet.
A and N swap places. So do B and O, C and P, and so on.
Because 13 + 13 = 26, the same shift both hides a message and brings it back. You do exactly the same thing to encode and to decode.
ROT13 is a modern use of an old idea. Usenet was an early online discussion network. In the early 1980s, people there used it to hide joke punchlines and film endings.
Its only job was to stop people reading something by accident. It was never meant to keep a secret.`,
  },
  l_frequency: {
    title: 'Lecture · Counting letters',
    kind: 'lecture',
    keys: ['frequency', 'count', 'counting letters', 'commonest', 'common letter', 'break', 'al-kindi', 'kindi', 'cryptanalysis', 'etaoin'],
    body: `COUNTING LETTERS
In any long piece of English, E is the most common letter. After E come T, A, O, I and N.
A simple substitution cipher swaps each letter for another letter or sign, and always for the same one. So it cannot hide this pattern. The most common sign in the cipher text is very likely to be E.
The philosopher al-Kindi wrote this method down in Baghdad in the ninth century. It was in his book on reading secret messages. It is the oldest known code-breaking method. After it, no simple substitution cipher was safe.
To break a Caesar cipher, you only need to find E:
1. Count how often each letter appears in the cipher text.
2. Take the most common letter. It probably stands for E.
3. Count how many places it is after E, going round past Z if you need to. That number is the shift.
Example: if the most common letter is H, it is three places after E. So the shift is three. Move every letter three places back.`,
  },
  l_pigpen: {
    title: 'Lecture · The pigpen',
    kind: 'lecture',
    keys: ['pigpen', 'pig pen', 'masonic', 'freemason', 'grid cipher', 'tic-tac-toe', 'noughts and crosses', 'signs', 'symbols'],
    body: `THE PIGPEN CIPHER
The pigpen cipher writes each letter as a small shape.
To make the key:
1. Draw a noughts-and-crosses (tic-tac-toe) grid. Write A to I in its nine cells.
2. Draw a second grid. Put a dot in every cell and write J to R.
3. Draw a large X. Write S, T, U and V in its four spaces. S goes at the top, T on the left, U on the right and V at the bottom.
4. Draw a second X with a dot in every space, for W, X, Y and Z.
Each letter is drawn as the lines around its cell, plus the dot if it has one.
A is in the top left cell. Its lines are on the right and below, so A is a backwards L. E is in the middle, so E is a closed square. S is a V shape.
The Freemasons used it for their records in the eighteenth century. So it is often called the masonic cipher, though some versions are older.
It looks mysterious, but it is no stronger than Caesar's cipher. Each sign always means the same letter. The key is four frames: two grids and two crosses, the second of each with dots.`,
  },
  l_polybius: {
    title: 'Lecture · The five-by-five square',
    kind: 'lecture',
    keys: ['polybius', 'square', 'five by five', '5x5', 'pairs of numbers', 'row and column', 'tap code', 'punched', 'collar'],
    body: `THE POLYBIUS SQUARE
Write the alphabet into a square of five rows and five columns. I and J share a cell, so the 26 letters fit into 25 cells.
Row 1: A B C D E
Row 2: F G H I/J K
Row 3: L M N O P
Row 4: Q R S T U
Row 5: V W X Y Z
Now every letter has two numbers: its row, then its column. A is 11. B is 12. H is 23. Z is 55.
The Greek historian Polybius described it in the second century BC, as a way to signal with torches. The number of torches held up on the left gave the row. The number on the right gave the column.
It is still used. Small numbers can be sent by almost anything: knocks, flashes of light, knots, or holes punched in brass. Prisoners have tapped it through the walls of their cells.`,
  },
  l_transposition: {
    title: 'Lecture · The rail fence and the scytale',
    kind: 'lecture',
    keys: ['rail fence', 'railfence', 'zigzag', 'transposition', 'scytale', 'spartan', 'sparta', 'out of order', 'fence', 'rails'],
    body: `TRANSPOSITION
A substitution cipher changes the letters. A transposition cipher keeps every letter as it is and only changes their order.
The Spartans are said to have wound a strip of leather around a staff, called a scytale. They wrote the message along the staff. Unwound, the strip showed only a jumble of letters. Only a staff of the same thickness put them back in order. The Greek writer Plutarch describes it.
The rail fence cipher uses the same idea on paper. With three rails:
1. Write the message in a zigzag over three lines: down, up, down, up.
2. Copy out the top line, then the middle line, then the bottom line.
Example: COME AT ONCE.
The 1st, 5th and 9th letters go on the top line: C A C.
The 2nd, 4th, 6th, 8th and 10th go on the middle line: O E T N E.
The 3rd and 7th go on the bottom line: M O.
So the cipher text is CACOETNEMO.
To read a rail fence, you must know the number of rails. Then you rebuild the zigzag and read along it.
Counting letters shows at once that a cipher is a transposition. E is still the most common letter, because no letter has been changed.`,
  },
  l_vigenere: {
    title: 'Lecture · The Vigenère cipher',
    kind: 'lecture',
    keys: ['vigenere', 'vigenère', 'indechiffrable', 'indéchiffrable', 'polyalphabetic', 'key word', 'keyword', 'bellaso', 'tabula recta', 'kasiski', 'babbage', 'square'],
    body: `THE VIGENÈRE CIPHER
The Vigenère cipher is a Caesar cipher whose shift changes with every letter. A key word sets the shifts.
To use it:
1. Choose a key word, for example LEMON.
2. Write the key word above your message, over and over, one key letter above each message letter.
3. Shift each message letter by the key letter above it. A means no shift, B means one place, C means two places, and so on. L means eleven places.
Example: ATTACK AT DAWN with the key LEMON becomes LXFOPV EF RNHR. The first A is under L, so it moves eleven places to L. The first T is under E, so it moves four places to X.
To read a message, shift each letter back by its key letter.
Because the shift keeps changing, the same letter comes out differently each time. So counting letters no longer finds E.
By hand, people use a table called the tabula recta. It has 26 rows, and each row is the alphabet shifted one place further than the row above. Find the row of the key letter and the column of the message letter. The cipher letter is where they cross.
Giovan Battista Bellaso described the cipher in 1553. It is named after Blaise de Vigenère, who published a different cipher about thirty years later. In the nineteenth century, writers gave him the credit by mistake, and the name stuck.
For three hundred years people called it le chiffre indéchiffrable: the cipher that cannot be deciphered.
But it can be broken. Charles Babbage broke it privately in the 1850s. In 1863 a Prussian army officer, Friedrich Kasiski, published a method:
1. Find groups of letters that repeat in the cipher text.
2. Measure the distances between the repeats. They are usually multiples of the key's length.
3. So the key's length is a number that divides them all.
With the key word, the message is easy to read.`,
  },
  l_playfair: {
    title: 'Lecture · The Playfair cipher',
    kind: 'lecture',
    keys: ['playfair', 'wheatstone', 'pairs', 'two by two', 'digraph', 'key square', 'frame'],
    body: `THE PLAYFAIR CIPHER
Charles Wheatstone invented this cipher in 1854. He also invented the concertina. The cipher is named after his friend Lord Playfair, who persuaded the British government to use it. The British army used it in the Boer War and the First World War.
It works on pairs of letters, using a five-by-five square built from a key word.
Build the square:
1. Write the key word into the square, row by row. Use each letter only once.
2. Fill the rest of the square with the unused letters, in alphabetical order. I and J share a cell.
Prepare the message:
3. Split it into pairs of letters.
4. If a pair would have the same letter twice, put an X between them. If one letter is left over at the end, add an X to it. Example: BALLOON becomes BA LX LO ON.
Encipher each pair:
5. If both letters are in the same row, take the letter to the right of each. From the end of a row, go back to its start.
6. If both are in the same column, take the letter below each. From the bottom, go back to the top.
7. Otherwise, the two letters mark opposite corners of a rectangle. Take the letters at the other two corners. Each new letter stays in the same row as the letter it replaces.
To read a message, do the same in reverse: left instead of right, and up instead of down. The corner rule stays the same.
Because it works on pairs, counting single letters does not help a code-breaker. With the key word, a message takes a few minutes with a pencil.`,
  },
  l_bacon: {
    title: "Lecture · Bacon's two-letter cipher",
    kind: 'lecture',
    keys: ['bacon', 'biliteral', 'bilateral', 'two typefaces', 'capitals', 'hidden in the letters', 'steganography', 'epigraph', 'francis bacon'],
    body: `BACON'S CIPHER
Francis Bacon published this cipher in 1623. It hides a message in the way the letters of a sentence look. What the sentence says does not matter.
How it works:
1. Give every letter of the alphabet a code of five marks. Each mark is either a or b.
2. Count in twos (binary, with a for 0 and b for 1). A is aaaaa, B is aaaab, C is aaaba, D is aaabb, E is aabaa, and so on.
3. Write any harmless sentence in two kinds of letter. These can be two typefaces, upright and sloping letters, or small letters and capitals. One kind means a and the other means b.
4. Each letter of the sentence carries one mark. So every five letters of the sentence carry one letter of the secret.
Bacon's own table used one code for I and J, and one for U and V. The modern form gives every letter its own code.
Bacon said his method could hide anything inside anything. Hiding a message inside something harmless is called steganography. Bacon's cipher is a famous early example.`,
  },
  l_ascii: {
    title: 'Lecture · Letters as numbers',
    kind: 'lecture',
    keys: ['ascii', 'hex', 'hexadecimal', 'bytes', 'binary', 'computer', 'code for letters', '4c', 'base sixteen'],
    body: `LETTERS AS NUMBERS
A computer stores each letter as a number. Nearly all computers use the same table for this. It is called ASCII, and it was agreed in America in 1963.
In ASCII the capital letters are in order. A is 65, B is 66, and so on up to Z, which is 90.
Engineers usually write these numbers in hexadecimal, which is base sixteen. Its digits run from 0 to 9, then A to F for ten to fifteen.
In hexadecimal, A is 41, B is 42, J is 4A, O is 4F and Z is 5A.
So a row of two-digit codes that start with 4 or 5 is almost always capital letters.
To read them:
1. If a code starts with 4, its second digit is the letter's place in the alphabet. 41 is A, the 1st letter. 4C is L, the 12th letter, because C means twelve.
2. If a code starts with 5, add sixteen to its second digit. 50 is P, the 16th letter. 5A is Z, the 26th letter.`,
  },
  l_atlas: {
    title: 'Lecture · Latitude, longitude and an island that is not there',
    kind: 'lecture',
    keys: ['latitude', 'longitude', 'coordinates', 'null island', '0 n 0 e', 'equator', 'prime meridian', 'where is', 'atlas', 'degrees', 'what lies at'],
    body: `FINDING A PLACE BY TWO NUMBERS
Any place on Earth can be found with two numbers.
Latitude says how far north or south of the equator a place is.
Longitude says how far east or west it is from the line through Greenwich, in London.
Latitude is always given first.
Some places every map-maker knows by heart:
  21.42° N, 39.83° E   Mecca
  59.91° N, 10.75° E   Oslo
  27.99° N, 86.93° E   the summit of Mount Everest
  53.96° N, 1.08° W    York
  48.86° N, 2.35° E    Paris
  29.98° N, 31.13° E   the Great Pyramid at Giza
  51.48° N, 0.00°      Greenwich
  0° N, 0° E           open sea in the Gulf of Guinea
The last point is where the equator crosses the prime meridian, the line of zero longitude. There is nothing there except a weather buoy.
But when a computer cannot find a place, it often records it at 0, 0 by mistake. So this empty patch of sea collects a lot of wrong data. Map-makers have given it a joke name: NULL ISLAND.
Map-makers also draw places that do not exist, on purpose. These fake places are called "trap streets" or "paper towns". They catch anyone who copies the map.
Agloe, New York, was invented by two map-makers in the 1930s. Later, to their surprise, a real shop was built there.`,
  },
  l_time: {
    title: 'Lecture · Why the Fold is eleven minutes slow',
    kind: 'lecture',
    keys: ['time', 'eleven minutes', 'fold time', 'local time', 'railway time', 'greenwich', 'two minute hands', 'longitude and time', 'harrison', 'chronometer'],
    body: `LOCAL TIME
Noon is the moment when the sun is highest in the sky. That moment moves west with the sun, at four minutes for every degree of longitude.
Until the 1840s, every town in England kept its own noon. Bristol's clocks ran ten minutes behind London's. Nobody minded, because the journey between them took most of a day.
The railways changed that, because trains need a single timetable. The Great Western Railway adopted London time in 1840, and other lines followed. In 1880 Greenwich time became the law.
The clock on the Exchange in Bristol was given two minute hands: one for London, one for Bristol. It still has them.
The Fold lies two and three-quarter degrees west of Greenwich. At four minutes a degree, that is eleven minutes. The Fold has never agreed to keep another town's noon. So its clocks still run eleven minutes behind.
Ships used the same sum to find their longitude. Carry a clock that keeps Greenwich time, and compare it with your own noon. The difference gives your longitude.
Example: the sun is highest when your Greenwich clock says 12:44. That is 44 minutes late, so you are 11 degrees west of Greenwich.
John Harrison, a carpenter's son, spent his life building a clock accurate enough to do this at sea. He finished it in 1759.`,
  },
  l_turk: {
    title: 'Lecture · The chess-player of 1770',
    kind: 'lecture',
    keys: ['turk', 'chess automaton', 'chess-player', 'kempelen', 'maelzel', 'automaton', 'lodger', '1770', 'poe', 'man inside', 'mechanical'],
    body: `THE AUTOMATON CHESS-PLAYER
In 1770 Wolfgang von Kempelen showed the court in Vienna a life-size mechanical figure. It sat at a cabinet and played chess, and it won.
Over eighty-four years it toured Europe and America. It beat Napoleon and Benjamin Franklin. Learned men wrote books arguing about whether a machine could think.
It could not. The cabinet was full of gears that were only for show, around a sliding seat. A strong chess-player sat hidden on the seat. He followed the game from below, using magnets under the board. He moved the figure's arm with levers. When the showman opened one door, the hidden player slid behind the other.
In 1836 a young American journalist published an essay about the machine. Looking only at the outside, he worked out that there must be a person inside. His name was Edgar Allan Poe. Five years later he invented the detective story.
The machine burned in a fire in Philadelphia in 1854. Its lesson survives: when a machine seems to do something only a person could do, look for the person.`,
  },
  l_ai: {
    title: 'Lecture · Can a machine think?',
    kind: 'lecture',
    keys: ['turing', 'turing test', 'imitation game', 'eliza', 'artificial intelligence', 'can a machine think', 'ai', 'language model', 'are you alive', 'what are you'],
    body: `THE IMITATION GAME
In 1950 Alan Turing proposed a test. During the war he had broken ciphers at Bletchley Park.
The test: put a person and a machine behind a screen. A judge asks them both questions, in writing. Suppose the judge cannot tell which is which. Turing said we would then have no good reason to deny that the machine thinks.
In 1966 Joseph Weizenbaum wrote a small program called ELIZA. It played the part of a therapist. Mostly, it turned your own sentence back into a question. It understood nothing. People told it their secrets anyway. Weizenbaum was dismayed by how little it took to fool them.
A machine like this one is made by having it read a huge amount of text. It learns which words tend to follow which. It can explain, summarise and copy a writer's voice.
But it is only as honest as what it was given to read. If it was told that one person wrote something, it will go on saying so.`,
  },
  l_stylometry: {
    title: 'Lecture · Stylometry',
    kind: 'lecture',
    keys: ['stylometry', 'authorship', 'who wrote', 'two authors', 'function words', 'federalist', 'style', 'clusters'],
    body: `WHO WROTE IT?
Every writer has small habits they never notice. One is how often they use words such as "the", "of", "but" and "upon". Another is how long their sentences are. Nobody chooses these habits, so they are hard to disguise.
In 1964 two statisticians, Frederick Mosteller and David Wallace, counted such words in the Federalist Papers. Twelve of these essays were claimed by both Alexander Hamilton and James Madison. Hamilton often wrote "upon". Madison almost never did. The count gave all twelve essays to Madison.
This method is called stylometry. A modern computer measures hundreds of these habits at once. It draws each text as a dot on a chart. Texts by the same writer gather into one cloud of dots.
Two clouds mean two writers, whatever name is on the title page.`,
  },
  l_nina: {
    title: 'Lecture · The Nina',
    kind: 'lecture',
    keys: ['nina', 'hidden word', 'hidden message', 'hirschfeld', 'diagonal', 'in the grid', 'signature', 'slantwise'],
    body: `THE NINA
The American cartoonist Al Hirschfeld had a daughter, Nina, born in 1945. After that, he hid her name in the lines of his drawings. It might be in a sleeve, a curl of hair or the fold of a curtain. He wrote a small number next to his signature to say how many times.
Crossword setters borrowed the word. A Nina is something a setter hides in the finished grid, apart from the answers. It might be a name around the edge, a phrase along a row, or a word from corner to corner.
A Nina does not help you solve the puzzle. It is there for solvers who keep looking after they finish.
Some setters never use one. Others hide one in everything they set, as a signature.`,
  },
  l_cryptic: {
    title: 'Lecture · How a cryptic clue works',
    kind: 'lecture',
    keys: ['cryptic', 'cryptic clue', 'crossword clue', 'definition', 'wordplay', 'charade', 'anagram', 'torquemada', 'ximenes', 'how do clues work'],
    body: `THE CRYPTIC CLUE
Arthur Wynne, from Liverpool, invented the crossword for a New York newspaper in December 1913. The cryptic crossword is a British form from the 1920s.
A fair cryptic clue has two parts:
1. At one end, the start or the finish, is a plain definition of the answer.
2. The rest is a recipe for building the same word another way. It might be an anagram, or a word hidden inside other words. Or it might be shorter words placed side by side, which is called a charade.
The number in brackets is the length of the answer.
Example: "Vehicle, then animal: a covering for the floor (6)".
It seems to be about a journey, but it is not. A vehicle is a CAR. An animal you keep is a PET. CAR and PET make CARPET, and a carpet is a covering for the floor.
The setter Afrit put the rule this way: "You need not mean what you say, but you must say what you mean."
In other words, the story on the surface may mislead you. But the parts must lead fairly to the answer.`,
  },
  l_pseudonyms: {
    title: "Lecture · Setters' pen-names",
    kind: 'lecture',
    keys: ['pen-name', 'pen name', 'pseudonym', 'vesper', 'hesper', 'censor', 'torquemada', 'ximenes', 'azed', 'who is', 'name she set under', 'sets as'],
    body: `PEN-NAMES
Setters of cryptic crosswords publish under pen-names. The first great one was Edward Powys Mathers of the Observer. He called himself Torquemada, after the Grand Inquisitor of Spain. The setters after him were Ximenes and Azed, also named after Spanish Inquisitors. The joke is that the setter is the Inquisitor and the solver is the heretic.
The Company used pen-names long before there were crosswords. Each member's pen-name is entered in the Rolls. Some in use now:
  VESPER: Dame Hesper Lorimer. (Hesper is Greek and Vesper is Latin. Both mean the evening star.)
  CENSOR: L. Voss, of the Crux.
  REGULATOR: I. Pendry.
  RHUMB: M. Sallow.
  MAJORITY: A. Clay.`,
    facts: ['vesper_name'],
  },
  l_knight: {
    title: 'Lecture · Reading the chessboard',
    kind: 'lecture',
    keys: ['chess notation', 'algebraic', 'knight', 'knight\'s tour', 'knights tour', 'b1', 'files and ranks', 'how do i read chess', 'euler'],
    body: `THE BOARD AND THE KNIGHT
Every square on a chessboard has a name: a letter and a number.
The eight columns are called files. They are lettered a to h, starting from White's left.
The eight rows are called ranks. They are numbered 1 to 8, starting from White's side. On a printed board, that is the bottom.
So a1 is the bottom left corner, and h8 is the top right.
The knight is written N. It moves in an L shape: two squares in one direction, then one square to the side. It is the only piece that can jump over others.
Example: from b1, a knight can move to a3, c3 or d2.
A path of knight moves that never visits a square twice is an old puzzle. In the ninth century, chess masters in Baghdad knew a knight's tour of all sixty-four squares. Leonhard Euler wrote a paper about it in 1759.
Setters have long used the knight to hide messages. They write a letter on every square. Only someone who follows the right path reads the right letters.`,
  },
  l_magic: {
    title: 'Lecture · Magic squares',
    kind: 'lecture',
    keys: ['magic square', 'lo shu', 'durer', 'dürer', 'melencolia', '34', 'rows and columns'],
    body: `MAGIC SQUARES
A magic square is a grid of different numbers. Every row, every column and both long diagonals add up to the same total.
The oldest is the Lo Shu square of ancient China. It is three by three, and every line adds up to fifteen:
  4 9 2
  3 5 7
  8 1 6
The legend says it was first seen on the shell of a turtle.
The most famous magic square in Europe is in Albrecht Dürer's engraving Melencolia I. It hangs on the wall behind the angel. It is four by four, and every line adds up to thirty-four. Dürer arranged it so that the two middle numbers of the bottom row give the year he made it.`,
  },
  l_bridges: {
    title: 'Lecture · The seven bridges of Königsberg',
    kind: 'lecture',
    keys: ['bridges', 'konigsberg', 'königsberg', 'euler', 'seven bridges', 'graph', 'cross each once'],
    body: `THE BRIDGES OF KÖNIGSBERG
The Prussian city of Königsberg had a river, two islands and seven bridges. On Sundays, people tried to find a walk that crossed every bridge exactly once.
In 1736 Leonhard Euler proved that it could not be done, and showed why:
1. Ignore the shape of the town. For each piece of land, count how many bridges touch it.
2. Each time you pass through a place, you use two bridges: one in and one out.
3. So every place must have an even number of bridges, except where you start and where you finish.
Königsberg had four places, and all four had an odd number of bridges. So the walk was impossible.
If exactly two places are odd, the walk can be done. But you must start at one of the odd places and finish at the other.
If no place is odd, you can start anywhere, and you will finish where you started.
This was the start of a whole branch of mathematics, called graph theory. Today, map apps on phones use it to find routes.`,
  },
  l_fifteen: {
    title: 'Lecture · The fifteen puzzle',
    kind: 'lecture',
    keys: ['fifteen puzzle', '15 puzzle', 'sliding', 'tiles', 'sam loyd', '14 and 15', 'hundred guineas', 'impossible', 'parity'],
    body: `THE FIFTEEN PUZZLE
Fifteen numbered tiles sit in a tray made for sixteen. You slide the tiles into the gap, one at a time, to put them in order.
A postmaster in New York State made it. In 1880 it became a craze, first in America and then in Europe.
The famous version starts with every tile in order except 14 and 15, which have swapped places. The American puzzle-maker Sam Loyd later claimed he had invented it. He offered a thousand dollars to anyone who could put the tiles right. Nobody ever collected.
He knew nobody would. Two mathematicians had already proved it impossible in 1879. Here is the idea:
1. Read the tiles row by row. Count the pairs in the wrong order, where a bigger number comes before a smaller one.
2. Whenever the gap is back in its own corner, that count has changed by an even number.
3. So if the count starts odd, it can never reach zero, which is the solved tray.
With 14 and 15 swapped, exactly one pair is in the wrong order. One is odd, so no series of slides can solve it.
A puzzle with no solution is different from a hard puzzle. It is worth knowing which kind you have been given.`,
  },
  l_meta: {
    title: 'Lecture · Puzzles made of puzzles',
    kind: 'lecture',
    keys: ['meta', 'metapuzzle', 'puzzle hunt', 'answers together', 'order of the papers', 'seven answers'],
    body: `THE META-PUZZLE
In a puzzle hunt, the answers to all the puzzles are the pieces of one final puzzle. That final puzzle is called the meta.
To solve the meta, you need every earlier answer, and you must see how they fit together. The oldest way is to take one letter from each answer and read the letters in order.
The best-known hunt has been held every January since 1981, at a technical university in Massachusetts. The winning team writes the next year's hunt.
In a well-made meta, every earlier answer was chosen for it from the start. Once you solve it, you can see this.`,
  },
  l_clue: {
    title: 'Lecture · Ariadne, and the word "clue"',
    kind: 'lecture',
    keys: ['ariadne', 'clue', 'clew', 'thread', 'theseus', 'labyrinth', 'minotaur', 'etymology', 'whose thread'],
    body: `ARIADNE AND THE CLEW
In the old Greek story, the Minotaur was kept in the middle of a labyrinth on Crete. Nobody who went in had ever found the way out.
Ariadne, the king's daughter, gave the Athenian hero Theseus a ball of thread. He tied one end at the door and unwound it as he went in. He killed the monster, then followed the thread back out.
In English, a ball of thread was called a "clew". By the seventeenth century, a clew meant anything that guides you through a maze. Later it meant anything that guides you to an answer. The spelling changed to "clue".
So the word "clue" comes from Ariadne's thread.`,
  },
  l_invigilator: {
    title: 'Lecture · Invigilator',
    kind: 'lecture',
    keys: ['invigilator', 'invigilate', 'proctor', 'what is an invigilator', 'vigil'],
    body: `INVIGILATOR
In Britain, an invigilator is the person who watches over an examination. They give out the papers, start the clock, and make sure nobody cheats. In America the word is proctor. It comes from the Latin vigilare, to stay awake and keep watch.
An invigilator does not set the questions or mark the answers. An invigilator sits at the back of the room, keeps the time, and says nothing.
At the Company's Proving, the candidates face the front. They are not allowed to look round.`,
  },
  l_foxglove: {
    title: 'Lecture · Foxglove',
    kind: 'lecture',
    keys: ['foxglove', 'digitalis', 'digoxin', 'withering', 'poison', 'heart', 'physic garden'],
    body: `FOXGLOVE
Foxglove (Digitalis purpurea) is a tall purple flower that grows in English hedgerows. It is one of the oldest heart medicines.
The doctor William Withering published a study of it in 1785. He had learned about it from a country herbalist. Medicines made from it are still prescribed today.
The dose that helps is close to the dose that harms. That is why every part of the plant is treated as a poison. It acts on the heart slowly, over several hours.
Modern hospitals keep a specific antidote. It works quickly, if the patient reaches hospital in time.
The Company's Physic Garden, at the Almshouses, has grown foxglove since the garden was first planted.`,
    facts: ['physic_foxglove'],
  },
  l_bellows: {
    title: 'Lecture · The Bellows',
    kind: 'lecture',
    keys: ['bellows', 'pneumatic', 'tube', 'tubes', 'carrier', 'exchange', 'hold-rack', 'hold rack', 'post'],
    body: `THE PNEUMATIC POST
A pneumatic post sends messages through pipes. The message goes inside a capsule, called a carrier, and air blows the carrier along the pipe.
London had the first one in 1853, between the telegraph office and the Stock Exchange. Paris ran four hundred kilometres of tubes under its streets until 1984. Prague's system worked until a flood in 2002.
The Fold's system, the Bellows, was laid in 1867 and has never been turned off. Every building has an outlet. All the tubes meet at the exchange in the lobby of Setters' Hall.
Beside the exchange is the hold-rack. A carrier placed in one of its cradles waits there until the dial on that cradle runs down. Then clockwork sends it on. The hold-rack was built so that members could send each other birthday puzzles at exactly the right hour.
As each carrier passes the exchange, holes are punched in its collar. They give row and column numbers in the five-by-five square.`,
  },
  l_letterlock: {
    title: 'Lecture · Letter-locks',
    kind: 'lecture',
    keys: ['letter-lock', 'letter lock', 'combination', 'seven rings', 'setting-pin', 'setting pin', 'word lock'],
    body: `LETTER-LOCKS
A letter-lock opens with a word instead of a key. It has a row of rings, each engraved with the alphabet. The bolt only moves when the right letters are lined up.
Letter-locks were a novelty in the seventeenth century. The Company has made them ever since.
A Company privacy lock has seven rings. It is fitted on the inside of a member's own door. Seven rings give more than eight billion possible words, so nobody can open one by guessing.
The word is changed from the back of the lock, using a thin steel setting-pin. The setting-pins for the Syndics' locks are kept on the key board in the Porter's Lodge.`,
  },
  l_proving: {
    title: 'Lecture · The Proving',
    kind: 'lecture',
    keys: ['proving', 'examination', 'rank', 'novice', 'solver', 'setter', 'grand setter', 'tithe', 'company', 'worshipful'],
    body: `THE PROVING
The Proving is the Company's examination. Since 1611 it has been held in the Hall on the Thursday of the second full week of October.
Members move up through the ranks by passing it: Novice, Solver, Setter, Grand Setter.
Candidates sit it in silence for three hours, facing the front.
A Grand Setter, chosen by the Warden, sets the paper. For forty years, until 2011, that was Dame Hesper Lorimer.
On the night of the Proving, the Warden goes up alone to the Lantern on the roof of the Hall. The Warden winds the Founder's Orrery there. Every Warden has done this.
Separately, every member owes the Company one new puzzle each year, called the Tithe. The best Tithes are shown on the Wall of Tithes.`,
  },

  // ================================================================= RECORDS
  pendry_bio: {
    title: 'Rolls · PENDRY, Ignatius',
    kind: 'person',
    keys: ['pendry', 'ignatius', 'clockmaker', 'horologist', 'regulator'],
    body: `PENDRY, Ignatius. Born 1954. Pen-name REGULATOR.
Clockmaker, and maker of automata (moving mechanical figures), at 4 Nonesuch Row. Grand Setter 1991. Syndic since 2009.
Built a copy of Kempelen's chess-playing machine, known as "the Lodger".
No living family. One apprentice: TANDY, Wilfred.`,
  },
  sallow_bio: {
    title: 'Rolls · SALLOW, Marguerite',
    kind: 'person',
    keys: ['sallow', 'marguerite', 'map-maker', 'cartographer', 'meridian', 'rhumb', 'charts'],
    if: 'act>=2',
    body: `SALLOW, Marguerite. Born 1959. Pen-name RHUMB.
Map-maker (cartographer). Has drawn the Company's maps of Ravel since 1994. Lives and runs her business on the narrowboat MERIDIAN, at Chandlers' Stairs.
Grand Setter 1996. Syndic since 2014.
Surveyor to the Company. Drew up the list of properties for the Greywether partnership.`,
  },
  voss_bio: {
    title: 'Rolls · VOSS, Lucan',
    kind: 'person',
    keys: ['voss', 'lucan', 'censor', 'crux', 'editor', 'crossword editor'],
    body: `VOSS, Lucan. Born 1967. Pen-name CENSOR.
Editor of the Crux since 2003. Also sets its crossword. Office: above the Stalemate, Proving Square.
Grand Setter 2001. Syndic since 2015.`,
    facts: ['censor_is_voss'],
  },
  clay_bio: {
    title: 'Rolls · CLAY, Auberon',
    kind: 'person',
    keys: ['clay', 'auberon', 'warden', 'majority'],
    body: `CLAY, Auberon. Born 1962. Pen-name MAJORITY.
Warden of the Company since 2011. He took over from Dame Hesper Lorimer.
Setter 1990. Grand Setter 2010, by a vote of the Syndics.
Tithes on file: nine. The last was in 2008.`,
  },
  hesper_bio: {
    title: 'Rolls · LORIMER, Dame Hesper',
    kind: 'person',
    keys: ['hesper', 'lorimer', 'dame', 'vesper', 'late tithes'],
    body: `LORIMER, Dame Hesper. Born 1951. Pen-name VESPER.
Grand Setter 1979, the youngest ever. Set the Proving from 1971 to 2011. Warden from 1994 to 2011.
Catalogue: 1,104 papers, lectures and Tithes. The twelve LATE TITHES (2012 to 2023) are listed as her work alone. They are on display in the Repository.
Has lived at No. 4, the Almshouses, since March. No living family.`,
  },
  court_order: {
    title: 'Court · Deputyship of Dame H. Lorimer',
    kind: 'record',
    keys: ['court', 'deputy', 'deputyship', 'guardian', 'who signs', 'signs for', 'sign for her', 'capacity', 'order'],
    if: { any: ['ev:paper_1', 'met:clay', 'met:hesper'] },
    body: `COURT OF PROTECTION. ORDER, 11 March.
In the matter of Dame Hesper LORIMER.
The court is satisfied that she can no longer manage her property and affairs.
IT IS ORDERED that "the Warden for the time being of the Worshipful Company of Setters and Solvers" be appointed her deputy. The deputy may sign on her behalf.
Note: "for the time being" means whoever is Warden at the time.
Applicant: A. Clay, Warden.
Medical evidence: a sworn statement (affidavit) by the applicant.
No relative was told. None is known.`,
    facts: ['warden_signs'],
  },
  greywether: {
    title: 'Company · Greywether plc',
    kind: 'record',
    keys: ['greywether', 'buyer', 'london', 'sale', 'legacy', 'partnership', 'who is buying'],
    if: { any: ['fact:legacy_sale', 'fact:masterplan', 'fact:completion_31', 'fact:certificate_sole'] },
    body: `GREYWETHER PLC, London. "Machine reasoning for the knowledge economy."
Announced in September: Greywether has agreed to buy THE LORIMER LEGACY from the Worshipful Company of Setters and Solvers.
The sale includes the complete works of Dame Hesper Lorimer and the Lorimer Engine. It also includes the freehold of Setters' Hall and other listed properties. The price has not been made public.
Greywether's press release calls the twelve Late Tithes "the jewel of the collection". It says they show "the mature style of the greatest puzzle-maker of the age". It also calls them "the benchmark against which our systems will be trained".
The sale completes on 31 October.`,
    facts: ['legacy_sale'],
  },
  late_tithes: {
    title: 'Catalogue · The Late Tithes',
    kind: 'record',
    keys: ['late tithes', 'tithes', '2012', 'who set the late', 'catalogue', 'fair copies'],
    body: `THE LATE TITHES. Twelve yearly papers, 2012 to 2023.
Catalogued as: LORIMER, Dame Hesper (VESPER). Sole author.
Each paper has seven clues with seven-letter answers. The winner of that year's Proving solved it and wrote the answers into a square.
Manuscripts: none in the author's own handwriting survive from after 2011.
Fair copies (clean final copies): in the handwriting of the Company's copyist.
Fair-copy books: moved into the Warden's keeping in January.
Provenance (proof of who wrote them): certified by I. Pendry, Syndic.`,
    facts: ['no_manuscripts'],
  },
  rolls_search: {
    title: 'Rolls · search: ARIADNE',
    kind: 'record',
    keys: ['ariadne', 'rolls', 'is there an ariadne', 'member called', 'fettle'],
    if: { any: ['fact:nina_ariadne', 'fact:word_ariadne', 'fact:epigraph_ariadne'] },
    body: `ROLLS OF THE COMPANY, 1426 to date. Search: ARIADNE.
No member has that name or that pen-name.
Note: the Rolls list members of the Company only. People employed by the Company, and their families, are not listed.`,
    facts: ['not_in_rolls'],
  },
  staff: {
    title: 'Hall · Staff of the Company',
    kind: 'record',
    keys: ['staff', 'servants', 'employment', 'porter', 'fettle', 'hob', 'employees', 'who works'],
    body: `STAFF OF THE COMPANY
FETTLE, Robert. Porter. Joined in 1979 as boot-boy. Lives in the Lodge. Copyist to Dame H. Lorimer from 1984.
ABARA, Dolores. Nurse at the Almshouses. Joined in March.
OKAFOR-REED, Jonah. Engineer at the Repository. Also a member of the Company, with the rank of Solver.
Note: the Porter's Lodge (the rooms, not the man) must be given up on 31 October. The plan for the Hall after that date has no Lodge.`,
    facts: ['hob_copyist'],
  },
};
