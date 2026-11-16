// Milo Hart, the tech at Ravel CID: the voice on the other end when the detective calls
// for help from the Lectern. He is outside the Fold and outside the case. He knows methods,
// not answers: he recognises the kind of thing in one line, searches it, and the how-to
// plays; then one short tip. He never solves anything for the detective.
//
// Every line is short and spoken: one or two plain sentences.

export const TECHIE = {
  name: 'Milo Hart',
  role: 'Tech, Ravel CID',
  /** The first call ever. */
  first: "Milo here, the tech at the station. Kit said you'd ring. Show me what you've found and I'll show you how it works.",
  hello: ["Milo. What've you found?", 'Hey, Detective. Show me what you have.', 'Milo here. Go on, what is it?', 'Back again? Good. What is it this time?'],
  search: ['Let me search it.', 'One sec. Searching.', 'Hang on, looking it up.'],
  lookup: ["I'll check the Lectern for you.", 'Let me pull up the records.', 'Hang on, checking the Lectern.'],
  found: 'Here you go.',
  none: "I can't find that one. Try the name of the thing, like pigpen, binary or latitude.",
  more: 'Anything else?',
  bye: ['Any time. Good luck.', 'Call me if it bites.', 'Go get them, Detective.'],
  /** The search box says this, with {name} for the name of the method. */
  query: 'how to do {name}',
  /** By lesson id (the record l_<id>): what he hears in it, what he searches, and his tip. */
  lessons: {
    caesar: { name: 'a Caesar shift', heard: "Letters moved along the alphabet? That's a Caesar shift. Oh, I remember this one.", tip: 'Move every letter back by the same number of places.' },
    rot13: { name: 'ROT13', heard: "Thirteen places? That's ROT13, half the alphabet.", tip: 'A swaps with N, B with O. Do it once and it reads.' },
    frequency: { name: 'letter counting', heard: 'No shift given? Count the letters. The commonest is usually E.', tip: "Find the commonest letter. Count how far it is from E. That's your shift." },
    pigpen: { name: 'the pigpen cipher', heard: "Little boxes and V shapes, some with dots? That's the pigpen cipher.", tip: 'Draw the key first. Then match each shape to its box.' },
    polybius: { name: 'a Polybius square', heard: "Pairs of numbers from one to five? That's a Polybius square.", tip: 'First number is the row, second is the column.' },
    transposition: { name: 'a rail fence', heard: "All the right letters in the wrong order? That's a transposition.", tip: 'Write it in a zigzag, then read along each line.' },
    vigenere: { name: 'a Vigenère cipher', heard: "A shift that keeps changing? That's Vigenère. You need a key word.", tip: 'Find the key word, then shift each letter back by its key letter.' },
    playfair: { name: 'a Playfair cipher', heard: "Letters in pairs and a five-by-five square? That's Playfair.", tip: 'Build the square from the key word, then take the letters two at a time.' },
    bacon: { name: "Bacon's cipher", heard: "Two kinds of letter in one sentence? That's Bacon's cipher.", tip: 'Mark each letter a or b. Every five marks make one letter.' },
    ascii: { name: 'letters as numbers', heard: 'Numbers like 41 and 4C? That is how computers write letters.', tip: 'Starts with 4: the next digit is the place in the alphabet. Starts with 5: add sixteen.' },
    binary: { name: 'binary', heard: "A row of holes? That's binary. I used to do this for fun.", tip: 'Add up the places with holes. Then read it on a 24-hour clock.' },
    charts: { name: 'a heat chart', heard: "A grid of squares, some brighter than others? That's a heat chart.", tip: 'Find your hour first. Then look for the brightest square in it.' },
    navigation: { name: 'a noon sight', heard: 'Brass arcs and the noon sun? That is old ship navigation.', tip: 'Each instrument is named after how much of a circle it is.' },
    atlas: { name: 'latitude and longitude', heard: 'Pairs of numbers with N and E? Those are map coordinates.', tip: 'Latitude first: north or south. Then longitude: east or west.' },
    time: { name: 'local noon', heard: 'Two clocks a few minutes apart? That is about where the sun is.', tip: 'Four minutes for every degree. Divide the minutes by four.' },
    knight: { name: 'chess squares', heard: 'Letters on a chessboard? Follow the knight. I remember these.', tip: 'Name each square by column, then row. The knight moves in an L.' },
    letterlock: { name: 'a letter-lock', heard: 'A lock with rings of letters? It wants a word, not a key.', tip: 'Find the word first. Turning the rings is the easy bit.' },
    nina: { name: 'a Nina', heard: 'Something hidden in a crossword grid? Setters call that a Nina.', tip: 'Look past the answers: along the edges, and corner to corner.' },
    cryptic: { name: 'a cryptic clue', heard: 'A clue that reads like nonsense? Cryptic crossword. I love these.', tip: 'One end is a plain definition. The rest builds the same word.' },
    meta: { name: 'a meta-puzzle', heard: "All your answers make one more answer? That's a meta.", tip: 'Put the answers in order, then take one letter from each.' },
    foxglove: { name: 'foxglove', heard: 'Plants and medicines? Let me look that up.', tip: 'Every plant in that garden gives a real medicine. Match them one by one.' },
    bellows: { name: 'the Bellows', heard: 'A brass carrier with holes in its collar? Those holes are times.', tip: 'Read each row of holes as a number, then as an hour.' },
  },
};
