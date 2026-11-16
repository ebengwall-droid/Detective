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
    short: "Every letter moves the same number of places along the alphabet. With a shift of three, A becomes D and B becomes E. To read the message, move each letter back by the same number.",
    pic: 'caesar',
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
    short: "This is a Caesar cipher with a shift of thirteen, which is half the alphabet. A and N swap, B and O swap, and so on. Doing it twice brings the message back.",
    pic: 'rot13',
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
    short: "In English, E is the most common letter. In a simple cipher, the most common sign probably stands for E. Count how many places it is from E, and that is the shift.",
    pic: 'frequency',
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
    short: "Each letter is drawn as the lines around its place in a grid or a cross. The second grid and the second cross have a dot in every space. Match each shape to the key to read the message.",
    pic: 'pigpen',
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
    short: "The alphabet goes into a square of five rows and five columns. I and J share a cell. Each letter becomes two numbers: its row, then its column.",
    pic: 'polybius',
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
    short: "The letters stay the same, but their order changes. In a rail fence, the message is written in a zigzag over a few lines, then read off one line at a time. To read it, rebuild the zigzag.",
    pic: 'railfence',
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
    short: "A key word gives each letter its own shift. Write the key over the message, again and again. Shift each letter by the key letter above it: A means no shift, B one place, C two places.",
    pic: 'vigenere',
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
    short: "Letters are changed in pairs, using a five-by-five square built from a key word. If the pair is in one row, take the letters to their right. If it is in one column, take the letters below. Otherwise, take the other two corners of their rectangle.",
    pic: 'playfair',
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
    short: "Every letter has a code of five marks, each one a or b. A harmless sentence is written in two kinds of letter: one kind means a, the other means b. Every five letters of the sentence hide one letter of the secret.",
    pic: 'bacon',
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
    short: "Computers store each letter as a number. A is 65 and Z is 90. Engineers often write these numbers in hexadecimal, where A is 41 and Z is 5A.",
    pic: 'ascii',
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
  l_binary: {
    title: 'Lecture · Counting in holes',
    kind: 'lecture',
    short: "In binary, each place is worth twice the place to its right: 1, 2, 4, 8, 16. A hole means that place counts. Add up the places with holes to get the number.",
    pic: 'binary',
    keys: ['binary', 'base two', 'holes', 'punched', 'punch card', 'punched card', 'collar', 'jacquard', 'hollerith', 'leibniz', 'bits', 'twenty-four hour', 'carrier'],
    body: `COUNTING IN HOLES
We count in tens: each place in a number is worth ten times the place to its right. Binary counts in twos: each place is worth twice the place to its right.
Reading from the right, the places are worth 1, 2, 4, 8, 16, 32 and so on. Each place is either used or not: a hole or no hole, 1 or 0.
Example: holes in the places worth 16 and 4, and none in the others, make 16 + 4 = 20. Written in binary, that is 10100.
The philosopher Gottfried Leibniz published an account of binary arithmetic in 1703.
Holes stored patterns long before computers did. Around 1804 Joseph-Marie Jacquard built a loom that wove its patterns from a chain of punched cards. In 1890 Herman Hollerith counted the American census with punched cards and machines that read them. His company later became part of IBM.
A clock of twenty-four hours is read like a railway timetable: 12 is noon, 20 is eight in the evening, and 0 is midnight.`,
  },
  l_charts: {
    title: 'Lecture · Reading a chart',
    kind: 'lecture',
    short: "A chart turns a long list of numbers into a picture. Find the column for the hour you care about, then look down it for the brightest squares. The busiest square on the whole chart may be at the wrong hour.",
    pic: 'chart',
    keys: ['chart', 'graph', 'log', 'data', 'heat map', 'heatmap', 'bar chart', 'pie chart', 'nightingale', 'john snow', 'cholera', 'william playfair', 'night log', 'terminal'],
    body: `READING A CHART
A chart turns a long list of numbers into a picture, so the eye finds the pattern before the mind does.
William Playfair, a Scottish engineer, drew the first bar charts and line graphs in 1786, and the first pie chart in 1801. He was not the Playfair of the cipher: that was Lyon Playfair, a chemist, born in 1818.
In 1854 the doctor John Snow marked every death from cholera in one part of London on a street map. The deaths crowded around one water pump, in Broad Street. The pump's handle was taken off.
In 1858 Florence Nightingale drew her "rose" diagrams. They showed that more soldiers in the Crimean War died of disease than of their wounds.
To read a log drawn as a grid: find the column for the hour you care about, and look down it for the brightest squares. The busiest square on the whole chart is not always the one you want.`,
  },
  l_navigation: {
    title: 'Lecture · Finding your latitude',
    kind: 'lecture',
    short: "At noon the sun is at its highest. Measuring how high it stands tells a sailor how far north or south they are. The brass instruments for this are named after how much of a circle their arc is.",
    pic: 'noonsight',
    keys: ['sextant', 'octant', 'quadrant', 'astrolabe', 'latitude', 'navigator', 'navigation', 'noon sight', 'noon sun', 'arc', 'instrument', 'hadley', 'campbell'],
    body: `THE NOON SIGHT
At noon the sun is at its highest. Measure how high it stands above the horizon, look up the sun's position for that day in a table, and you have your latitude: how far north or south of the equator you are.
Sailors measured that height with brass instruments named for how much of a circle their arc is.
An astrolabe is a whole circle. Astronomers used them for more than a thousand years.
A quadrant is a quarter of a circle: ninety degrees.
An octant is an eighth: forty-five degrees. John Hadley showed one to the Royal Society in 1731. It uses two mirrors, so it can measure angles twice the size of its own arc.
A sextant is a sixth: sixty degrees, so it measures up to 120. In 1757 John Campbell, a captain in the Royal Navy, had the first one made. Ships still carry one, in case everything electric fails.
The names are Latin: quadrans means a quarter, sextans a sixth, and octans an eighth.`,
  },
  l_alcuin: {
    title: 'Lecture · The river crossing',
    kind: 'lecture',
    short: "A boat carries the traveller and one thing at a time. Some things cannot be left alone together. Look for the one thing that is in both dangerous pairs, and remember the boat can bring something back.",
    pic: 'river',
    keys: ['river crossing', 'fox goose', 'goose', 'wolf goat cabbage', 'ferry', 'ferryman', 'alcuin', 'york', 'riddle', 'crossing puzzle'],
    body: `THE RIVER CROSSING
A traveller must take a wolf, a goat and a basket of cabbages across a river. The boat holds the traveller and one thing more. Left alone, the wolf eats the goat, and the goat eats the cabbages.
Alcuin of York, a scholar at the court of Charlemagne, set this problem around the year 800 in a book called "Problems to Sharpen the Young". It is among the oldest puzzles written down in Europe.
The trick is to notice that one thing is in both dangerous pairs, and that the boat may carry something back as well as over.
Other crossings in the same book have jealous husbands, and a hedgehog family. Later versions, with missionaries and cannibals, are still used to teach computers to plan.`,
  },
  l_logic: {
    title: 'Lecture · Logic grids',
    kind: 'lecture',
    short: "Write the people down the side and the things across the top. Put a cross where a clue rules something out, and a tick where you are sure. Each tick crosses out the rest of its row and its column.",
    pic: 'logic',
    keys: ['logic', 'logic grid', 'grid puzzle', 'einstein', 'zebra', 'deduction', 'four o\'clock problem', 'whose cup', 'cups', 'tick and cross'],
    body: `LOGIC GRIDS
A logic grid sorts a few people and a few things using nothing but clues. Write the people down the side and the things across the top. Put a cross in every square a clue rules out, and a tick where you are certain. Each tick lets you cross out the rest of its row and its column.
The most famous is the Zebra Puzzle, printed in the magazine Life International in 1962: five houses, five owners, fifteen clues, and the question of who owns the zebra. It is often said to be by Albert Einstein, but nobody has found any sign that it was.
Begin with the clue that is certain, not the clue that is long.`,
  },
  l_smothered: {
    title: 'Lecture · The smothered mate',
    kind: 'lecture',
    short: "The king cannot move, because his own pieces are all around him. A knight gives check, and a knight's check cannot be blocked. That is a smothered mate.",
    pic: 'smothered',
    keys: ['smothered', 'smothered mate', 'checkmate', 'mate in one', 'greco', 'philidor', 'adjourned', 'adjournment', 'chess problem', 'knight check'],
    body: `THE SMOTHERED MATE
Checkmate is when the king is attacked and has no way out: he cannot move, the attacker cannot be taken, and nothing can be put in the way.
In a smothered mate the king cannot move because his own pieces fill every square around him, and a knight gives check. A knight's check can never be blocked, because the knight jumps.
The Italian player Gioachino Greco printed smothered mates around 1620. The best known, called Philidor's Legacy, gives up the queen to force a rook into the king's last free square, then mates with the knight.
Until the 1990s long games were adjourned: a player sealed their next move in an envelope, and the game was finished another day. Chess computers ended the custom, because anyone could have a machine study the position overnight.`,
  },
  l_wordgames: {
    title: 'Lecture · Guess-the-word games',
    kind: 'lecture',
    short: "Each guess shows which letters are in the right place, which are in the word but in the wrong place, and which are not in the word at all. Keep the right ones, move the misplaced ones, and drop the rest.",
    pic: 'wordgame',
    keys: ['word game', 'guess the word', 'six letters', 'five letters', 'green', 'gold', 'mastermind', 'jotto', 'lingo', 'bulls and cows', 'crux six'],
    body: `GUESS-THE-WORD GAMES
In these games you guess a hidden word, and each guess tells you which letters are in the right place, which are in the word but misplaced, and which are not in it at all.
The idea is old. Bulls and Cows, played with numbers on paper, goes back at least a century. A word version called Jotto was sold in 1955. The board game Mastermind, with coloured pegs, came out in 1970, and the television quiz Lingo began in 1987. In 2021 a free daily version on the internet, with green and yellow squares, was played by millions.
A good first guess uses common letters. In English the commonest are E, A, R, I, O, T, N and S. After that, use every colour: keep the greens where they are, move the golds, and never use a grey letter again.`,
  },
  l_dates: {
    title: 'Lecture · Pegs for history',
    kind: 'lecture',
    short: "Learn a few dates as pegs. For anything else, ask: did it happen before or after this peg? Then put the oldest first.",
    pic: 'timeline',
    keys: ['dates', 'history', 'timeline', 'order of events', 'which came first', 'history board', 'novice test', 'pegs'],
    body: `PEGS FOR HISTORY
Nobody remembers every date. Historians and quiz-setters keep a few as pegs, and hang everything else between them.
Some English pegs: the Battle of Hastings, 1066. Magna Carta, 1215. The Black Death, 1348. The Spanish Armada, 1588. The Battle of Waterloo, 1815. The first passenger railway, 1830.
Then ask of anything else: before or after the peg? A printed book needs the printing press. A letter with a stamp needs the post office to sell stamps. A play about a king needs the playwright to be alive.
Most mistakes in putting things in order come from two events that feel far apart but are close, or feel close but are centuries apart.`,
  },
  l_pendulum: {
    title: 'Lecture · The pendulum',
    kind: 'lecture',
    short: "How fast a pendulum swings depends only on its length. A heavy weight and a light one, on strings of the same length, swing together. A longer string swings more slowly.",
    pic: 'pendulum',
    keys: ['pendulum', 'bob', 'swing', 'galileo', 'huygens', 'period', 'regulator', 'losing time', 'gaining time', 'clock loses'],
    body: `THE PENDULUM
A pendulum is a weight on a string or a rod, free to swing. A heavy weight and a light one, on the same length of string, swing at exactly the same speed. The weight makes no difference.
Only the length matters. A long pendulum swings slowly and a short one swings quickly. To make a clock run slower, the clockmaker lowers the weight. To make it run faster, they raise it. A pendulum that takes one second for each swing is just under a metre long.
Galileo is said to have noticed this as a young man in Pisa. He watched a lamp swinging in the cathedral and timed it against his own pulse. Christiaan Huygens built the first pendulum clock in 1656. It kept time far better than any clock before it.`,
  },
  l_notes: {
    title: 'Lecture · Reading music',
    kind: 'lecture',
    short: "On a treble staff, the lines from the bottom are E, G, B, D and F. The spaces between them spell FACE. The higher a note sits, the higher it sounds.",
    pic: 'staff',
    keys: ['music', 'notes', 'staff', 'stave', 'treble clef', 'piano', 'keys', 'sharp', 'flat', 'face', 'every good boy', 'fur elise', 'für elise', 'beethoven', 'tune'],
    body: `READING MUSIC
Music is written on five lines, called a staff or stave. The higher a note sits, the higher it sounds.
With a treble clef at the start, the five lines from the bottom are E, G, B, D and F: "Every Good Boy Deserves Fruit". The four spaces between them, from the bottom, spell FACE.
On a piano the white keys run from A to G and start again. The black keys come in twos and threes. C is the white key just left of each pair of black keys.
A sharp sign before a note means the key just above it, usually a black key: D sharp is the black key between D and E.
The A above middle C sounds at 440 vibrations a second, and every orchestra tunes to it.`,
  },
  l_atlas: {
    title: 'Lecture · Latitude, longitude and an island that is not there',
    kind: 'lecture',
    short: "Latitude says how far north or south of the equator a place is. Longitude says how far east or west of Greenwich it is. Latitude is always written first.",
    pic: 'latlong',
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
    short: "Noon is when the sun is highest. It comes four minutes later for every degree you go west. So the difference between two places' noons tells you how far apart they are.",
    pic: 'noon',
    keys: ['time', 'eleven minutes', 'fold time', 'local time', 'railway time', 'greenwich', 'two minute hands', 'longitude and time', 'harrison', 'chronometer'],
    body: `LOCAL TIME
Noon is the moment when the sun is highest in the sky. That moment moves west with the sun, at four minutes for every degree of longitude.
Until the 1840s, every town in England kept its own noon. Bristol's clocks ran ten minutes behind London's. Nobody minded, because the journey between them took most of a day.
The railways changed that, because trains need a single timetable. The Great Western Railway adopted London time in 1840, and other lines followed. In 1880 Greenwich time became the law.
The clock on the Exchange in Bristol was given two minute hands: one for London, one for Bristol. It still has them.
The Fold has never agreed to keep another town's noon. So its clocks still run eleven minutes behind Greenwich. How far west that puts it is a sum you can do yourself.
Ships used the same sum to find their longitude. Carry a clock that keeps Greenwich time, and compare it with your own noon. The difference gives your longitude.
Example: the sun is highest when your Greenwich clock says 12:44. That is 44 minutes late, so you are 11 degrees west of Greenwich.
John Harrison, a carpenter's son, spent his life building a clock accurate enough to do this at sea. He finished it in 1759.`,
  },
  l_turk: {
    title: 'Lecture · The chess-player of 1770',
    kind: 'lecture',
    short: "A famous chess-playing machine of 1770 seemed to think. In fact a person was hidden inside it. When a machine seems to do a person's work, look for the person.",
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
    short: "A machine like the Lectern learns by reading a huge amount of text. It can explain things and copy a writer's style. But it only repeats what it was given, whether that is true or not.",
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
    short: "Every writer has small habits, such as how often they use words like 'the' and 'upon', and how long their sentences are. Counting these habits shows whether two texts have the same writer.",
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
    short: "A Nina is something a setter hides in a finished grid, apart from the answers. It might be a name around the edge, or a word from corner to corner. It is a signature for solvers who keep looking.",
    pic: 'nina',
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
    short: "A cryptic clue has two parts. At one end is a plain definition of the answer. The rest is a recipe for making the same word another way. The number in brackets is the length of the answer.",
    pic: 'cryptic',
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
    short: "Each square has a letter for its column (a to h) and a number for its row (1 to 8). So a1 is the bottom left corner. A knight, written N, moves in an L: two squares one way, then one to the side.",
    pic: 'knight',
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
    short: "In a magic square, every row, every column and both long diagonals add up to the same total. In a three-by-three square the total is 15. In a four-by-four square it is 34.",
    pic: 'magic',
    keys: ['magic square', 'lo shu', 'durer', 'dürer', 'melencolia', '34', 'rows and columns'],
    body: `MAGIC SQUARES
A magic square is a grid of different numbers. Every row, every column and both long diagonals add up to the same total.
The oldest is the Lo Shu square of ancient China. It is three by three, and every line adds up to fifteen:
  4 9 2
  3 5 7
  8 1 6
The legend says it was first seen on the shell of a turtle.
The most famous magic square in Europe is in Albrecht Dürer's engraving Melencolia I. It hangs on the wall behind the angel. It is four by four, and every line adds up to thirty-four.`,
  },
  l_bridges: {
    title: 'Lecture · The seven bridges of Königsberg',
    kind: 'lecture',
    short: "Count the bridges that touch each piece of land. A walk over every bridge once is possible only if no place, or exactly two places, have an odd number. If two do, start at one of them and finish at the other.",
    pic: 'bridges',
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
    short: "You slide tiles into the gap to put them in order. Count the pairs of tiles that are in the wrong order. If that count is odd when the gap is in its corner, the tray can never be solved.",
    pic: 'fifteen',
    keys: ['fifteen puzzle', '15 puzzle', 'sliding', 'tiles', 'sam loyd', '14 and 15', 'hundred guineas', 'impossible', 'parity'],
    body: `THE FIFTEEN PUZZLE
Fifteen numbered tiles sit in a tray made for sixteen. You slide the tiles into the gap, one at a time, to put them in order.
A postmaster in New York State made it. In 1880 it became a craze, first in America and then in Europe.
The American puzzle-maker Sam Loyd later claimed he had invented it, and offered a thousand dollars for the solution to one famous starting position.
In 1879 two mathematicians proved that half of all starting positions can never be solved, however you slide. Here is the test:
1. Read the tiles row by row. Count the pairs in the wrong order, where a bigger number comes before a smaller one.
2. Whenever the gap is back in its own corner, that count has changed by an even number.
3. So if the count starts odd, it can never reach zero, which is the solved tray.
A puzzle with no solution is different from a hard puzzle. It is worth knowing which kind you have been given.`,
  },
  l_meta: {
    title: 'Lecture · Puzzles made of puzzles',
    kind: 'lecture',
    short: "In a puzzle hunt, the earlier answers are the pieces of one last puzzle, called the meta. Often you take one letter from each answer and read the letters in order.",
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
    short: "In the Greek story, Ariadne gave Theseus a ball of thread to find his way out of the labyrinth. A ball of thread was called a clew, and that is where the word clue comes from.",
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
    short: "An invigilator watches over an exam. They do not set the questions. They sit at the back of the room, keep the time, and say nothing.",
    keys: ['invigilator', 'invigilate', 'proctor', 'what is an invigilator', 'vigil'],
    body: `INVIGILATOR
In Britain, an invigilator is the person who watches over an examination. They give out the papers, start the clock, and make sure nobody cheats. In America the word is proctor. It comes from the Latin vigilare, to stay awake and keep watch.
An invigilator does not set the questions or mark the answers. An invigilator sits at the back of the room, keeps the time, and says nothing.
At the Company's Proving, the candidates face the front. They are not allowed to look round.`,
  },
  l_foxglove: {
    title: 'Lecture · Foxglove',
    kind: 'lecture',
    short: "Foxglove is a tall purple flower and an old heart medicine. The dose that helps is close to the dose that kills. It works slowly, over several hours, and hospitals keep an antidote.",
    pic: 'foxglove',
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
    short: "The Bellows is a pneumatic post: messages travel through pipes in brass carriers. A carrier can wait in the hold-rack in the Hall and be sent later. Holes punched in its collar record, in binary, the hour it went in and the hour it came out.",
    pic: 'carrier',
    keys: ['bellows', 'pneumatic', 'tube', 'tubes', 'carrier', 'exchange', 'hold-rack', 'hold rack', 'post'],
    body: `THE PNEUMATIC POST
A pneumatic post sends messages through pipes. The message goes inside a capsule, called a carrier, and air blows the carrier along the pipe.
London had the first one in 1853, between the telegraph office and the Stock Exchange. Paris ran four hundred kilometres of tubes under its streets until 1984. Prague's system worked until a flood in 2002.
The Fold's system, the Bellows, was laid in 1867 and has never been turned off. Every building has an outlet. All the tubes meet at the exchange in the lobby of Setters' Hall.
Beside the exchange is the hold-rack. A carrier placed in one of its cradles waits there until the dial on that cradle runs down. Then clockwork sends it on. The hold-rack was built so that members could send each other birthday puzzles at exactly the right hour.
As each carrier passes the exchange, holes are punched in its brass collar: the hour it went in, and the hour it came out, counted in binary.`,
  },
  l_letterlock: {
    title: 'Lecture · Letter-locks',
    kind: 'lecture',
    short: "A letter-lock opens with a word instead of a key. Each ring carries the alphabet, and the bolt moves only when the right letters line up.",
    pic: 'letterlock',
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
    short: "The Proving is the Company's examination, held every October in the Hall. Candidates sit it in silence for three hours, facing the front.",
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
