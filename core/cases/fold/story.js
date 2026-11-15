// The spine of The Invigilator: acts, story beats, objectives, deductions, the
// accusation, the finale in the Lantern, and the endings.
//
// Conversation and the covering notes on the Invigilator's Papers are
// improvised by the model at run time. Everything here is fixed, so that
// however the player wanders, the case stays solvable and reaches its end.

export const META = {
  id: 'invigilator',
  title: 'The Invigilator',
  series: 'The Fold',
  tagline: 'Four candidates. One question. Nobody has ever passed.',
  city: 'Ravel',
  killerName: 'the Invigilator',
};

/** Where the game begins, and where the detective's desk is. */
export const START = { location: 'gatehouse', hub: 'hall' };

/** What everybody in the Fold knows. Goes into every character prompt. */
export const WORLD = `The time is the present day, a wet October, in the old cathedral city of Ravel in the west of England.

THE FOLD is six crooked lanes and a square on an island between the river and the canal called the Cut. It is not on any accurate map: the people who live there have drawn Ravel's maps since 1741 and have always let their own streets fall in the fold of the page. Satellite navigation gives up at the bridge. There is no mobile signal. You get in through the Turnstile on Turnagain Lane, whose letter-lock opens to the word of the day, or by Nell Sixsmith's ferry across the Cut, where the toll is the answer to a riddle.

The Fold is the home of the WORSHIPFUL COMPANY OF SETTERS AND SOLVERS: for six hundred years, the people who make puzzles, ciphers, locks, maps, mazes and games the way other streets make shoes. Nothing here is magic. It is all craft: brass, oak, clockwork, paper, ink. Outsiders are called Flats (people from the flat part of the map); it is not unkind.

How the Fold works:
- FOLD TIME: the Fold never took London's time. It keeps its own noon, eleven minutes behind Greenwich, and every public clock has two minute hands, the red one for strangers.
- THE BELLOWS: a Victorian pneumatic post. Brass tubes run to every building; messages travel in leather-capped brass carriers. A carrier can be left in the hold-rack at the exchange in the Hall and set to go out hours later.
- LETTER-LOCKS: the Company's private rooms lock from inside with a brass lock of seven lettered rings. It opens to its owner's word.
- RANK: Novice, Solver, Setter, Grand Setter. You rise by sitting THE PROVING, the Company's examination, held in Setters' Hall on the Thursday of this week. It is sat in silence. One person sits at the back with the clock and says nothing for three hours: the invigilator.
- THE TITHE: every member owes the Company one new puzzle a year. They are pinned on the Wall of Tithes in the Hall.
- The Company is governed by the WARDEN and three other SYNDICS. At four each afternoon the Syndics take tea in the Hall.

People everybody knows:
- DAME HESPER LORIMER, 74, the greatest setter the Company has had, who set its hardest papers for forty years under the pen-name VESPER. Warden until 2011. Her twelve "Late Tithes" (2012 to 2023) are called the finest work of her life. Her mind has failed; since March she has lived at No. 4, the Almshouses, with a nurse, and the Warden signs for her by order of the court.
- THE LECTERN: properly the Lorimer Engine, a reference machine in the Repository under the Hall, built by young Jonah Okafor-Reed from Dame Hesper's lectures and the Company's papers. It answers questions in something like her voice.
- THE SALE: the four Syndics have agreed to sell "the Lorimer Legacy" (her life's work and the Lectern) to a London firm called Greywether, completing on 31 October. The Fold is divided about it and nobody has been told the details.

THE DEATHS: On Monday morning the clockmaker and Syndic IGNATIUS PENDRY, 71, was found dead at his bench at 4 Nonesuch Row, locked in from the inside. He had taken tea with the other Syndics at four on Sunday, as every day, and locked himself in at seven to work, as every night. (In Proving week the Fold works Sundays.) The player is a police detective from Ravel CID, a Flat, sent in that Monday with Detective Constable Kit Quoin, the only Fold-born officer in the force.

THE DAYS: the story runs from that Monday to Thursday, the night of the Proving. Your stage notes say which day it is. Nothing later than that has happened yet, and you know nothing of it.`;

export const ACTS = {
  1: {
    title: 'The Gate That Reads',
    date: 'Monday of the Proving week',
    card: [
      'There is a part of the city of Ravel that is not on the map. It is not hidden. It is only drawn wrong, and has been since 1741, by the people who live in it.',
      'They make puzzles there the way other streets make shoes. They call their six crooked lanes the Fold. They call everybody else, kindly on the whole, the Flat.',
      'You are from the Flat. You are a detective. Until this morning you thought that was the same thing as being hard to fool.',
      "At a quarter past seven a clockmaker's apprentice could not get his master's door to open.",
    ],
  },
  2: {
    title: 'Drawn Off the Map',
    date: 'Tuesday of the Proving week',
    card: [
      'The ferrywoman finds her at first light, because the cat is on the roof of the boat and will not come down.',
      'Marguerite Sallow, who drew every map of Ravel sold in the last thirty years. Aboard her narrowboat, the Meridian. At her own chart table, with her own hatch locked on the inside.',
      'There is a flask of the Hall tea beside her and a sheet of green ink under her hand.',
      'That makes two of the four.',
    ],
  },
  3: {
    title: 'The Third Paper',
    date: 'Wednesday of the Proving week',
    card: [
      'A bright cold morning, and the Fold has made up its mind.',
      'At breakfast Dame Hesper Lorimer put down her spoon and told her nurse, quite clearly, that she set the Papers herself. Of course she did. Who else is there?',
      'By nine the Warden has telephoned your Superintendent. A confession; a poor old woman not fit to plead; nobody need go to prison. He would like it closed before the Proving.',
      'There are two Syndics left alive, and the Warden is one of them.',
    ],
  },
  4: {
    title: 'The Proving',
    date: 'Thursday of the Proving week · the night of the Proving',
    card: [], // chosen at run time from how act three ended
  },
};

/** How act four opens, depending on what tipped it. */
export const ACT4_CARDS = {
  exposed: [
    'He folded his cloth, and said he had the supper to see to, and went.',
    'That was yesterday. Nobody has seen the Porter since. The tea was on the table at four all the same, and nobody could say who had made it.',
    'Tonight nine candidates sat the Proving in the Hall with their backs to an empty chair. When the last of them handed in, the Warden was gone too.',
    'On your desk, in the tray under the tube: a Paper, and a key with a brass tally. Number 144.',
  ],
  hob_strong: [
    'The Warden hears you to the end. He has gone the colour of the candles. Then he says that none of it will be written down, and that the Porter is to be sent for.',
    'The Lodge is empty. The daybook is closed, with the pen laid across it.',
    'Tonight nine candidates sat the Proving with their backs to an empty chair. When the last of them handed in, the Warden was gone too.',
    'On your desk, in the tray under the tube: a Paper, and a key with a brass tally. Number 144.',
  ],
  hob_weak: [
    "The Warden laughs. He actually laughs. 'Fettle? He brings the tea, Detective.' He sends for the Porter so that you can apologise, and the Porter stands with his hands folded and says there is nothing to forgive.",
    'Tonight nine candidates sat the Proving in the Hall. The chair at the back was filled as it has been every year since 1990. You watched it the whole three hours and it never moved.',
    'When the last of them handed in, the chair was empty. So was the Warden\'s.',
    'On your desk, in the tray under the tube: a Paper, and a key with a brass tally. Number 144.',
  ],
  hesper: [
    'They come for Dame Hesper at noon with a car and a blanket. She asks the driver whether he is the four o\'clock problem. The Fold stands in its doorways and says nothing at all.',
    'The Warden shakes your hand. The Greywether people send flowers to the Hall.',
    'Tonight nine candidates sat the Proving. When the last of them handed in, the Warden\'s chair was empty, and so was the chair at the back.',
    'On your desk, in the tray under the tube: a Paper in green ink. So she did not set them. And a key with a brass tally. Number 144.',
  ],
  jonah: [
    "Jonah Okafor-Reed is arrested in the Repository with his hands still on the keyboard. 'It can't even set a fair clue,' he says. 'Ask it. Ask it to set you one fair clue.' Greywether's lawyers switch the Lectern off within the hour.",
    'So the machine is dark, and its maker is in a cell in the Flat.',
    'Tonight nine candidates sat the Proving. When the last of them handed in, the Warden\'s chair was empty, and so was the chair at the back.',
    'On your desk, in the tray under the tube: a Paper in green ink, written since. And a key with a brass tally. Number 144.',
  ],
  timeout: [
    'You name nobody. Wednesday goes, and Thursday, and the Fold puts on its gowns.',
    'Nine candidates sit the Proving in the Hall with their backs to the room. The chair behind them is filled as it has been every year since 1990.',
    'When the last of them hands in, the chair is empty. So is the Warden\'s.',
    'On your desk, in the tray under the tube: a Paper, and a key with a brass tally. Number 144.',
  ],
};

// --------------------------------------------------------------- beats
// Evaluated after every action; each fires once.

export const BEATS = [
  { id: 'start', when: true, do: [{ unlock: 'gatehouse' }] },
  { id: 'through', when: 'flag:through_gate', do: [{ unlock: 'hall' }, { unlock: 'clockshop' }, { unlock: 'mortuary' }] },
  { id: 'unlock_row', when: 'visited:clockshop', do: [{ unlock: 'wheelshop' }] },
  { id: 'unlock_fold', when: 'visited:hall', do: [{ unlock: 'stalemate' }, { unlock: 'repository' }] },
  { id: 'unlock_alms', when: { any: ['fact:warden_signs', 'fact:vesper_name', 'told:kit.k_dame', 'told:hob.h_dame', 'told:jonah.j_engine'] }, do: [{ unlock: 'almshouse' }] },
  { id: 'saw_pendry', when: 'examined:tube_pendry', do: [{ mark: 'saw_pendry' }] },
  { id: 'letter1', when: ['act:1', { stepsSince: 'saw_pendry', n: 8 }], do: [{ letter: 1 }] },
  { id: 'act2_open', when: 'act>=2', do: [{ unlock: 'meridian' }] },
  { id: 'saw_sallow', when: 'examined:tube_sallow', do: [{ mark: 'saw_sallow' }] },
  { id: 'letter2', when: ['act:2', { stepsSince: 'saw_sallow', n: 7 }], do: [{ letter: 2 }] },
  { id: 'act3_open', when: 'act>=3', do: [{ flag: 'dame_confessed' }] },
  { id: 'letter3', when: ['act:3', { stepsSince: 'act3', n: 3 }], do: [{ letter: 3 }] },
  { id: 'paper3_read', when: 'ev:paper_3', do: [{ mark: 'paper3' }] },
  // The third candidate can be reached in time, or not.
  { id: 'voss_late', when: ['act>=3', { stepsSince: 'paper3', n: 60 }, '!flag:voss_reached'], do: [{ flag: 'voss_dead' }] },
  // A detective who never read the Paper finds out on Thursday what it would have said.
  { id: 'voss_night', when: ['act>=4', '!flag:voss_reached', '!flag:voss_dead'], do: [{ flag: 'voss_dead' }] },
  { id: 'crux_open', when: { any: ['puz:slate', 'flag:voss_dead'] }, do: [{ unlock: 'crux' }] },
  { id: 'voss_found_late', when: ['flag:voss_dead', 'act:3', { stepsSince: 'flag:voss_dead', n: 6 }, '!visited:crux'], do: [{ notify: "The Crux did not go to press. They have broken down Lucan Voss's door." }] },
  { id: 'nina_sheet', when: 'puz:nina', do: [{ ev: 'nina_sheet' }] },
  { id: 'act4_exposed', when: ['flag:hob_exposed', 'act<=3'], do: [{ act: 4, card: 'exposed' }] },
  { id: 'act4_accused', when: ['flag:accused', 'act<=3'], do: [{ act: 4, card: '$verdict' }] },
  { id: 'act4_open', when: 'act>=4', do: [{ letter: 4 }, { ev: 'key_144' }] },
];

// ---------------------------------------------------------- objectives
// `hints` run from a nudge to plain instruction; the inner voice uses them.

export const OBJECTIVES = [
  // Monday
  {
    id: 'o_gate', text: 'Get through the Turnstile', if: true,
    done: 'flag:through_gate',
    hints: ['The gate wants a word. The slate and the stone between them will give you one.', 'Examine the turnstile and work the puzzle: take each chalked letter three back in the alphabet.'],
  },
  {
    id: 'o_scene', text: "Examine Pendry's workshop at 4 Nonesuch Row", if: 'flag:through_gate',
    done: ['examined:tube_pendry', 'examined:door_pendry', { min: 3, of: ['examined:bench', 'examined:cup_pendry', 'examined:notepad', 'examined:certificate', 'examined:window_bars', 'examined:ledger_pendry', 'examined:lodger', 'examined:clocks'] }],
    hints: ['A man died in a locked room. Start with the lock, and with whatever reached him after he turned it.', "Go to Pendry & Sons. Examine the door, the Bellows tube by the bench, the tea tray and his blotter, then everything else."],
  },
  {
    id: 'o_wilf', text: 'Talk to the apprentice who found him', if: 'visited:clockshop',
    done: 'met:wilf',
    hints: ['Somebody opened the shop this morning.', 'Talk to Wilf Tandy at the clock shop. Ask him about the door, the tea, and who looks after the locks.'],
  },
  {
    id: 'o_autopsy', text: 'Hear the post-mortem from Dr Marsh', if: 'flag:through_gate',
    done: 'fact:foxglove',
    hints: ['The Flat has a mortuary, and a doctor who does not care for puzzles.', 'Go to the County Mortuary. Ask Dr Marsh what killed him, when he took it, and whether he could have been saved.'],
  },
  {
    id: 'o_hall', text: "Take up your desk at Setters' Hall", if: 'flag:through_gate',
    done: ['visited:hall', 'met:hob'],
    hints: ['The Company has lent you a desk. The Porter has the key to it, as to everything.', "Go to Setters' Hall and speak to the Porter at the Lodge."],
  },
  {
    id: 'o_wheel', text: 'Be fitted for a wheel', if: 'visited:clockshop',
    done: 'puz:fitting',
    hints: ['Nobody in the Fold works a cipher by counting on their fingers.', "Go next door to Quoin & Daughter, talk to Mrs Quoin, and do the fitting at her bench."],
  },
  {
    id: 'o_lab', text: 'Send the tea things to the lab', if: 'ev:cup_pendry',
    done: { any: ['lab:cup_pendry', 'flag:lab_used'] },
    hints: ['A cup with half an inch left in it is a statement.', 'Open the Lectern at your desk in the Hall, go to the Lab tab, and send in the cup.'],
  },
  {
    id: 'o_paper1', text: 'Sit Paper I', if: 'ev:paper_1',
    done: ['puz:paper1a', 'puz:paper1b'],
    hints: ['Two questions. The first is your gate again with the number kept back. The second is drawn, not written.', 'Open your Papers (in the notebook). Use the Wheel on Question 1; the pigpen key for Question 2 is in your Primer. Then go and find what each one asks for.'],
  },
  {
    id: 'o_carrier', text: 'Find out where Paper I was posted', if: 'ev:paper_1',
    done: 'puz:bellows',
    hints: ['A carrier is punched everywhere it goes.', "Examine the Bellows exchange in the Hall and read the carrier's collar. Ask the Porter how the hold-rack works."],
  },
  {
    id: 'o_how', text: 'How do you murder a man alone in a locked room?', if: { min: 2, of: ['fact:locked_inside', 'fact:foxglove', 'fact:pendry_paper'] },
    done: 'ded:locked',
    hints: ['You are asking who was in the room at midnight. Ask who needed to be.', 'Read the Paper from his tube, hear Dr Marsh on the time he drank it, then answer the first question on the case board.'],
  },
  {
    id: 'o_rest1', text: 'When you have done what you can today, take the last ferry home (on the map)', if: ['act:1', 'examined:tube_pendry', 'fact:foxglove', 'visited:hall'],
    done: 'act>=2',
    hints: ['The Fold shuts at ten, by its own clocks.', "Open the map and choose 'Call it a night'. Finish with today's leads first; tomorrow will bring its own."],
  },
  // Tuesday
  {
    id: 'o_boat', text: 'Examine the Meridian', if: 'act>=2',
    done: ['examined:tube_sallow', 'examined:door_sallow', 'examined:chart_table'],
    hints: ['The same room, afloat.', 'Go to the Meridian. Examine the hatch, the tube, the flask, and what she was drawing.'],
  },
  {
    id: 'o_nell', text: 'Talk to the ferrywoman', if: 'act>=2',
    done: 'met:nell',
    hints: ['She found her. And she writes down everyone who crosses.', 'Talk to Nell Sixsmith aboard the Meridian, and look at her riddle-book.'],
  },
  {
    id: 'o_paper2', text: 'Sit Paper II', if: 'ev:paper_2',
    done: ['puz:paper2a', 'puz:paper2b'],
    hints: ['One question is a map and the other is a fence.', 'Open your Papers. For Question 3 find the five places; for Question 4 use the Fence. Each answer points at something aboard the Meridian.'],
  },
  {
    id: 'o_money', text: 'Follow the money', if: 'puz:paper2a',
    done: 'fact:escrow_four',
    hints: ['A chart-seller presses her private papers flat.', 'Go back to the Meridian and look in the big atlas.'],
  },
  {
    id: 'o_sextant', text: "Look in Sallow's sextant box", if: 'puz:paper2b',
    done: 'fact:dame_incapable',
    hints: ['She was not a woman who kept a thing for ornament.', 'Examine the sextant aboard the Meridian.'],
  },
  {
    id: 'o_joined', text: 'What joins the clockmaker and the map-maker?', if: { any: ['fact:legacy_sale', 'fact:masterplan', 'fact:escrow_four'] },
    done: 'ded:sold',
    hints: ['Two of four. Find the four.', 'Solve Paper I, read the plan on her chart table, then answer the question on the case board.'],
  },
  {
    id: 'o_dame', text: 'Call on Dame Hesper', if: { any: ['fact:warden_signs', 'fact:legacy_sale'] },
    done: 'met:hesper',
    hints: ['Everyone is selling her. Nobody has asked her.', 'Go to No. 4, the Almshouses. Talk to her, and to the nurse. Look at the crossword on her table.'],
  },
  {
    id: 'o_engine', text: 'Ask the man who built the Lectern', if: 'visited:hall',
    done: 'met:jonah',
    hints: ['A machine that talks like her lives under the Hall.', 'Go down to the Repository and talk to Jonah Okafor-Reed.'],
  },
  {
    id: 'o_rest2', text: 'When you have done what you can today, take the last ferry home (on the map)', if: ['act:2', 'examined:tube_sallow'],
    done: 'act>=3',
    hints: ['Two dead and two left. Tomorrow somebody will want this finished.', "Open the map and choose 'Call it a night'."],
  },
  // Wednesday
  {
    id: 'o_confession', text: "Test Dame Hesper's confession", if: 'act>=3',
    done: 'ded:confession',
    hints: ['The Papers are written in a steady hand.', 'Look at her crossword and the medical report from the sextant box; ask the nurse; then answer the question on the case board.'],
  },
  {
    id: 'o_paper3', text: 'Sit Paper III', if: 'ev:paper_3',
    done: 'puz:paper3',
    hints: ['A cipher with a key word. The Paper tells you whose.', "Open your Papers and use the Square. The key is the pen-name on the plate under Dame Hesper's portrait in the Hall."],
  },
  {
    id: 'o_slate', text: 'Solve the slate at the Stalemate before the Hall strikes twelve', if: 'puz:paper3',
    done: { any: ['puz:slate', 'flag:voss_dead'] },
    hints: ['Every move you waste is a minute of somebody else\'s.', "Go to the Stalemate, examine the slate, and follow the knight's moves square by square."],
  },
  {
    id: 'o_voss', text: 'Get to the third candidate', if: { any: ['puz:slate', 'flag:voss_dead'] },
    done: 'examined:door_voss',
    hints: ['CENSOR sets the crossword in the Crux. The Crux is upstairs.', 'Take the stairs in the Stalemate up to the Crux office.'],
  },
  {
    id: 'o_engine2', text: 'Could the Lectern have set the Papers?', if: ['met:jonah', 'ev:paper_2'],
    done: 'fact:not_engine',
    hints: ['Ask the man who knows what it can and cannot do.', 'Ask Jonah whether the Engine could have written the Papers, and look at the machine itself.'],
  },
  {
    id: 'o_hand', text: 'In whose manner are the Papers set?', if: { min: 2, of: ['fact:dame_incapable', 'fact:not_engine', 'fact:two_hands', 'fact:dame_confesses'] },
    done: 'ded:hand',
    hints: ['Not her. Not the machine made from her. Somebody who learned her better than the machine did.', 'Establish that Dame Hesper cannot write and that the Engine did not; then answer the question on the case board.'],
  },
  {
    id: 'o_tithes', text: 'Read what they sold', if: { any: ['act>=3', 'fact:legacy_sale'] },
    done: 'puz:nina',
    hints: ['The Late Tithes are under glass. Do not read the words.', 'Examine the display cases in the Repository and work the puzzle of the Late Tithes.'],
  },
  {
    id: 'o_word', text: 'Find the word that would have opened their doors', if: 'examined:door_pendry',
    done: 'puz:lock',
    hints: ["'It is in everything you sold.'", "Find what is hidden in the Late Tithes in the Repository, then try it on Pendry's lock."],
  },
  {
    id: 'o_ariadne', text: 'Who is Ariadne?', if: { any: ['fact:nina_ariadne', 'fact:word_ariadne', 'fact:epigraph_ariadne'] },
    done: 'fact:ariadne_fettle',
    hints: ["She is not in the Company's Rolls. Somebody outside them wrote her name down.", "Show the slanted name to Dame Hesper, or ask Nell to look in her riddle-book, or look under A in Mrs Quoin's fitting ledger."],
  },
  {
    id: 'o_invisible', text: 'The cup, the lock, the carrier, the chair', if: { min: 2, of: ['fact:tea_porter', 'fact:locks_oiled', 'fact:rack_wound', 'fact:invigilator_chair'] },
    done: 'ded:invisible',
    hints: ['Four things were done. Each of them is somebody\'s job.', 'Ask who pours the tea, who oils the locks, who winds the hold-rack, and look in the Proving register. Then use the case board.'],
  },
  {
    id: 'o_books', text: 'See the fair copies', if: { any: ['fact:spiked_letter', 'fact:two_hands', 'fact:voss_confesses'] },
    done: 'ev:faircopy_books',
    hints: ["They are in the Warden's safe. The Warden will not open it. One other person can.", "Ask the Porter to open the Warden's safe for you."],
  },
  {
    id: 'o_author', text: 'Who set the Late Tithes?', if: { any: ['fact:two_hands', 'fact:nina_ariadne', 'ev:faircopy_books'] },
    done: 'ded:author',
    hints: ['Two hands. One of them shook from 2011.', "Get Jonah's memo, look at the fair-copy books, find out whose daughter Ariadne was; then use the case board."],
  },
  {
    id: 'o_accuse', text: 'Name the Invigilator', if: 'act:3',
    done: 'flag:accused',
    hints: ['When you are sure, say it to someone who can act on it.', "Open the case board and choose 'Make an arrest'."],
  },
  // Thursday
  {
    id: 'o_paper4', text: 'Sit Paper IV', if: 'ev:paper_4',
    done: 'puz:paper4',
    hints: ['Letters in pairs. A key word in a square.', 'Open your Papers and use the Frame. The key is the word every Paper is signed with.'],
  },
  {
    id: 'o_meta', text: 'Put your seven answers in order', if: 'puz:paper4',
    done: 'puz:meta',
    hints: ['He has been building this since Monday.', "Open 'The Order of the Papers'. Any question you skipped must be answered first."],
  },
  {
    id: 'o_lantern', text: 'Get to the Lantern', if: 'puz:meta',
    done: 'visited:lantern',
    hints: ['Up.', "Open the map and go to the Lantern, on the roof of Setters' Hall."],
  },
  {
    id: 'o_finale', text: 'Stop the fourth Paper', if: 'visited:lantern',
    done: 'flag:finale_done',
    hints: ['There is a lock on the grille, and a man on a chair at the back of the room. One of them will listen.', 'If you know the word, set it on the grille lock. And talk to him: about her, about his girl, about what you can prove.'],
  },
];

// ------------------------------------------------------- ending the day
// The player chooses when each day ends; `auto` is the backstop if they never do.

export const REST = {
  1: {
    if: ['flag:through_gate', 'examined:tube_pendry', 'fact:foxglove', 'visited:hall'],
    why: "Not yet. You have not finished with Pendry's workshop, heard Dr Marsh, or so much as found your desk at the Hall.",
    warn: "Take the last ferry back to the Flat? Finish with today's leads first; tomorrow will bring its own.",
    auto: 170,
  },
  2: {
    if: ['examined:tube_sallow'],
    why: 'Not yet. Marguerite Sallow is still at her chart table aboard the Meridian.',
    warn: 'Take the last ferry? Two of the four are dead. Tomorrow somebody will want this finished.',
    auto: 190,
  },
  3: {
    if: true,
    warn: 'Go home without naming anyone? Tomorrow is the Proving.',
    card: 'timeout',
    auto: 220,
  },
};

// ----------------------------------------------------------- deductions

export const DEDUCTIONS = {
  locked: {
    q: 'Ignatius Pendry died alone, behind his own lock. How was it murder?',
    if: { min: 2, of: ['fact:locked_inside', 'fact:foxglove', 'fact:pendry_paper'] },
    options: [
      { id: 'self', text: 'It was not. He took it himself.', no: 'A man who means to die does not wear his fingertips raw on a lock, trying to get out.' },
      { id: 'hidden', text: 'The killer was hiding in the workshop and left in the morning confusion.', no: "Wilf could not get the door open; the constables took it off its hinges with Wilf watching. Nobody came out." },
      { id: 'window', text: 'Through the window.', no: 'Barred, and painted shut besides.' },
      { id: 'remote', text: 'Nobody had to be there. He was poisoned at tea, his lock was changed beforehand, and the Paper came by tube.', needs: ['fact:drank_at_four', { any: ['fact:pendry_paper', 'fact:held_carrier'] }] },
    ],
    answer: 'remote',
    solved: "He drank it at four, in company, eight hours before he died. His lock had been given a new word while his back was turned. And the letter that told him so was put in the post at midday and delivered by clockwork.\n\nSo it does not matter where anybody was at midnight. Every alibi in the Fold is worthless, and it was built to be.",
    facts: ['method'],
  },
  sold: {
    q: 'What joins the clockmaker and the map-maker?',
    if: { any: ['fact:legacy_sale', 'fact:masterplan', 'fact:escrow_four'] },
    options: [
      { id: 'old', text: 'An old quarrel between Nonesuch Row and the Cut.', no: 'There are plenty. None of them touches both.' },
      { id: 'proving', text: 'They were both to examine at the Proving on Thursday.', no: 'So are thirty others.' },
      { id: 'syndics', text: 'They are two of the four Syndics who are selling the Lorimer Legacy.', needs: { any: ['fact:escrow_four', ['fact:legacy_sale', 'fact:masterplan'], ['fact:legacy_sale', 'fact:warden_signs']] } },
    ],
    answer: 'syndics',
    solved: "Four Syndics signed the sale to Greywether: Pendry, who swore to it; Sallow, who drew it; Voss of the Crux, who told the Fold it was a fine thing; and the Warden, who signed for a woman who could not. Eleven million pounds, in four equal parts.\n\nTwo are dead. Lucan Voss and Auberon Clay are still walking about.",
    facts: ['four_syndics'],
  },
  confession: {
    q: "What is Dame Hesper's confession worth?",
    if: ['act>=3', { any: ['fact:dame_incapable', 'fact:two_pens', 'fact:dame_confesses'] }],
    options: [
      { id: 'true', text: 'It is true. She set them, and somebody carried them for her.', no: "She cannot hold a pen to finish her own crossword. The Papers are four pages of small, upright, steady ink." },
      { id: 'mad', text: 'It means nothing. She does not know what she is saying.', no: "She knows exactly what a paper in her manner looks like. She recognised them. That is not nothing." },
      { id: 'proud', text: 'It is false, and honest. She knows her own style when she sees it, and cannot imagine who else could set it.', needs: { any: ['fact:dame_incapable', 'fact:two_pens'] } },
    ],
    answer: 'proud',
    solved: "She has not been able to write since before March; there is a doctor's report that says so, and a crossword on her table that says it better. But she read the Papers and knew her own manner, turn for turn. 'Who else is there?'\n\nIt is a very good question. It may be the only one.",
    facts: ['confession_false'],
  },
  hand: {
    q: "The Papers are in Dame Hesper's manner. Who is setting them?",
    if: { min: 2, of: ['fact:dame_incapable', 'fact:not_engine', 'fact:two_hands', 'fact:confession_false'] },
    options: [
      { id: 'dame', text: 'Dame Hesper herself.', no: 'She cannot write, and she cannot leave her chair without an arm.' },
      { id: 'engine', text: 'The Lectern. The machine that was made from her.', no: "Its log shows it set nothing. And Jonah is right: ask it for a clue and it gives you something that looks like one." },
      { id: 'pupil', text: 'One of her old pupils, imitating her.', no: 'Her best pupils are the four Syndics. Two are dead and the Papers are better than anything the other two ever set.' },
      { id: 'third', text: 'Someone who knows her mind better than the machine does, and whom nobody counts as a setter.', needs: ['fact:not_engine', { any: ['fact:dame_incapable', 'fact:confession_false'] }] },
    ],
    answer: 'third',
    solved: "Not the woman. Not the machine that was built out of her. Somebody who can set a paper in the manner of Dame Hesper Lorimer at the height of her powers, and whose name is on no list of people who could.\n\nIn Pendry's shop there is a chess-playing engine that beat emperors for eighty years. The Fold calls it the Lodger, because everybody knows there was room inside for a man.",
    facts: ['third_hand'],
  },
  invisible: {
    q: 'The cup, the lock, the carrier, the chair at the back. Who can do all four?',
    if: { min: 2, of: ['fact:tea_porter', 'fact:locks_oiled', 'fact:rack_wound', 'fact:hob_invigilates'] },
    options: [
      { id: 'warden', text: 'The Warden. He holds every key and sits at every tea.', no: 'He is waited on at tea; he has never poured a cup in the Hall or oiled a lock in his life. And he is the fourth name on the list.' },
      { id: 'jonah', text: 'Jonah. He has the run of the Hall at night.', no: 'He has never touched the tea table, and the locks are a mystery to him; ask him which way a setting-pin turns.' },
      { id: 'anyone', text: 'Anyone. The pins hang on an open board and the rack is in the lobby.', no: 'Anyone could do one of them. Somebody did all four, on the right days, without one person noticing. That is not anyone.' },
      { id: 'porter', text: 'The Porter.', needs: { min: 3, of: ['fact:tea_porter', 'fact:locks_oiled', 'fact:rack_wound', 'fact:hob_invigilates', 'fact:changed_at_service'] } },
    ],
    answer: 'porter',
    solved: "He pours the tea, and nobody watches him do it. He oils the locks every October, and re-pins them. He winds the hold-rack on Mondays. And every year since 1990 he has sat in the chair at the back of the Proving with the clock, saying nothing for three hours, with the whole Company's backs to him.\n\nInvigilator. It was never a boast. It is his job.",
    facts: ['porter_can'],
  },
  author: {
    q: 'Who set the Late Tithes?',
    if: { any: ['fact:two_hands', ['fact:nina_ariadne', 'fact:ariadne_fettle'], 'ev:faircopy_books'] },
    options: [
      { id: 'dame', text: 'Dame Hesper, as the certificate says.', no: "Two hands, says the arithmetic. And her own shook from 2011." },
      { id: 'engine', text: 'The Lectern drafted them and she signed them.', no: 'The first is from 2012. The Lectern was built in 2019.' },
      { id: 'syndics', text: 'The Syndics set them between them and used her name.', no: 'Then one of the four would have known the word on his own door.' },
      { id: 'copyist', text: "Her fair-copyist. For twelve years the Company's greatest work has been the Porter's.", needs: { any: [['fact:two_hands', 'fact:ariadne_fettle'], 'fact:faircopy_hand', 'fact:dame_names_hob', 'fact:codicil'] } },
    ],
    answer: 'copyist',
    solved: "A boy of fifteen who emptied her waste-paper basket and read what was in it. Forty-six years at her elbow. When her mind began to go he finished what she started; then he started them too, and signed each one, slantwise, with the name of a daughter who died at nine.\n\nThe four Syndics sold twelve years of Hob Fettle's work as hers, and when he said so they locked up his books, shut him out of her room, and laughed.",
    facts: ['true_author'],
  },
};

// ------------------------------------------------------------ accusation

export const ACCUSE = {
  if: 'act:3',
  blurb: 'Name the Invigilator to the Warden. You get one arrest. Whoever you name, the Proving is tomorrow night.',
  warn: 'There is no taking it back. If you are wrong, the wrong person answers for it, and the fourth Paper is still to come.',
  suspects: ['hob', 'hesper', 'jonah', 'clay', 'kit', 'quoin', 'voss', 'dolores', 'ottilie', 'nell', 'wilf', 'marsh'],
  motives: [
    { id: 'legacy', text: 'To stop the sale of the Fold' },
    { id: 'author', text: 'Because the work they sold was not theirs, or hers, to sell' },
    { id: 'money', text: 'Money' },
    { id: 'dame', text: 'To avenge Dame Hesper' },
  ],
  /** Independent lines of proof against the Porter. Three make a case, if one of them is about whose work it was. */
  pillars: [
    { id: 'signature', label: 'The name hidden in the Late Tithes is his daughter\'s', if: ['fact:nina_ariadne', 'fact:ariadne_fettle'] },
    { id: 'hand', label: "The Papers are in the hand that made the fair copies", if: 'fact:hand_match' },
    { id: 'lock', label: 'The word on the doors was changed when the locks were oiled', if: ['fact:locks_oiled', 'fact:changed_at_service'] },
    { id: 'tea', label: 'He pours the Syndics\' tea, each into their own cup', if: ['fact:tea_porter', 'fact:own_cups'] },
    { id: 'rack', label: 'He winds the hold-rack that sent the Papers', if: ['fact:held_carrier', 'fact:rack_wound'] },
    { id: 'chair', label: 'He has invigilated every Proving since 1990', if: 'fact:hob_invigilates' },
    { id: 'dame', label: 'Dame Hesper names him as the author', if: { any: ['fact:dame_names_hob', 'fact:codicil'] } },
    { id: 'garden', label: 'He planted the foxgloves, and somebody has been cutting them', if: ['fact:foxglove_bed', 'fact:bed_planted'] },
  ],
  /** Flags a wrong verdict can raise. */
  flags: ['hesper_taken', 'jonah_taken'],
  judge({ suspect, pillars, state, check }) {
    if (suspect === 'hob') {
      const ids = new Set(pillars.map((p) => p.id));
      // Opportunity alone (he pours, he oils, he winds, he sits at the back) is only a porter doing his job.
      // It becomes a case when something says the work was his: the hand, the hidden name, or her word.
      const strong = ids.has('hand') || ((ids.has('signature') || ids.has('dame')) && pillars.length >= 3);
      return { verdict: strong ? 'hob_strong' : 'hob_weak', final: true, right: true };
    }
    if (suspect === 'hesper') return { verdict: 'hesper', final: true, flags: ['hesper_taken'] };
    if (suspect === 'jonah') {
      const ok = !check('fact:not_engine', state);
      return ok ? { verdict: 'jonah', final: true, flags: ['jonah_taken'] } : { verdict: 'jonah_weak', final: false };
    }
    return { verdict: 'rejected', final: false };
  },
  replies: {
    hob_strong: { who: 'The Warden', text: "*Auberon Clay reads the pages you have laid on his desk. Halfway down the second he stops moving his lips.* ...Fettle. *He puts the page down as if it were hot.* You understand what this does. If the late work is the Porter's there is no Lorimer Legacy; there is nothing to sell. No. You will not write that down, Detective. You will send for him, and we shall see what he has to say with his hat in his hand." },
    hob_weak: { who: 'The Warden', text: "*Clay actually laughs.* Fettle? The Porter? My dear Detective, he brings the tea. He has brought the tea since I was a Novice. You might as well arrest the urn. Fettle! Come in here a moment; the Detective has something amusing to tell you." },
    hesper: { who: 'The Warden', text: "*Clay closes his eyes for a moment, like a man tasting something.* A tragedy. A great mind turned on what it loved. I shall see she has every comfort. You have been thorough, Detective, and quick; I shall say so to your Superintendent. *He is already reaching for the telephone.*" },
    jonah: { who: 'The Warden', text: "*Clay steeples his fingers.* The Engine. I always said it was a mistake to let the boy have the keys. Take him quietly, if you would; Greywether's people are in the building. *He does not ask what the evidence is.*" },
    jonah_weak: { who: 'The Warden', text: "*Clay is tempted; you watch him be tempted.* The machine's own log says it wrote nothing, Detective, and Greywether's engineers will say so too, loudly, with lawyers. Bring me something that survives a meeting." },
    rejected: { who: 'The Warden', text: "*Clay does not look up from his letters.* No. On what? The Proving is tomorrow and I have a Company to hold together. Bring me a name I can put in front of the Syndics. What is left of them." },
  },
};

// --------------------------------------------------------------- finale

export const FINALE = {
  act: 4,
  npc: 'hob',
  location: 'lantern',
  title: 'The Invigilator',
  stay: 'Not now. Not with the Warden on the floor and the clock going.',
  maxTurns: 8,
  /** The detective worked it out before coming up. */
  knewIf: { any: ['fact:true_author', 'fact:porter_can', ['fact:word_ariadne', 'fact:ariadne_fettle']] },
  /** At least one of these must land for him to give himself up. */
  personal: ['name', 'dame'],
  /** The Warden is already out of danger once the grille is open. */
  safeIf: 'puz:grille',
  onEnd: {
    surrender: [{ flag: 'clay_lives' }, { flag: 'hob_taken' }],
    spare: [{ flag: 'clay_lives' }],
    finish: [],
  },
  scene: `It is twenty to twelve by Fold Time on the night of the Proving, in the Lantern: the round glass room on the roof of Setters' Hall, with the Founder's Orrery turning in the middle of it behind an iron grille. Rain on every pane, and the lights of Ravel below.

Auberon Clay, the Warden, is inside the grille on the floor, wedged between the Orrery's drum and the bars, grey and sweating, conscious. He drank foxglove with the Proving supper three hours ago. The grille gate is shut on a seven-ring letter-lock, and his Paper lies on the candidate's desk across the room, where he left it. If he is carried down to the Infirmary before midnight he will live. You have told him what you told the others: the gate opens to one name, and it is in everything he sold. He has not found it. You are sitting on the plain chair by the stair door, behind anyone who comes up, with the Proving clock on its stand at your elbow, as you have sat at the back of every Proving since 1990. You have never laid a hand on anyone and you will not start now.

The detective has just come up the stairs. You like this detective. In four days a stranger from the Flat has learned what the Company says cannot be learned, which is the whole of what you wanted to prove. You will not hurt them or hinder them: if they set the right word on the lock, the gate opens and you will sit and watch them carry him down. You will not say the word yourself unless you are moved to. There is no more cover to keep. You may tell the whole truth now, plainly, and you want to: the waste-paper basket, the fair copies, her mind going, the twelve Tithes, Ariadne, what the four of them did when you said the work was yours, the door of No. 4 shut in your face. You are not mad and not a monster. You are tired, exact, and very nearly finished. You have not decided what happens to you at midnight; you had not thought past it.

Clay can speak, weakly. He is frightened and still cannot quite believe it is the Porter. If it serves the scene you may give him one short line inside *asterisks* as narration, but you are the one talking.`,
  unmoved: `What does not move you: orders, rank, threats, the law in the abstract, pity for Clay, being called mad, promises the detective cannot keep, and anything the detective claims to hold but does not. Each turn a stage note tells you which of these the detective genuinely holds. You have set papers all your life; you can tell a bluff, and a bluff makes you colder.`,
  endRules: `- "surrender": you say the word yourself or watch it set, and you give yourself up. Only if at least three things have landed and one of them is name or dame.
- "spare": you let the Warden be saved (you say the word, or do nothing to stop the gate), but you will not be taken: you put down the clock and go down the back stair to the ferry. When about two things have landed.
- "finish": you sit and let the clock run out. When almost nothing has landed, or the detective has threatened or lied to you. (If a stage note says the gate is already open, you cannot choose this: the examination is over.)`,
  firstNotes: [
    { if: 'flag:knew_killer', text: 'The detective worked out who you are before coming up here.' },
    { if: '!flag:knew_killer', text: 'The detective did not know it was you until this moment.' },
    { if: 'flag:hesper_taken', text: 'Yesterday the detective had Dame Hesper named as the Invigilator. She has been taken to a locked ward in the Flat. This is the worst thing anyone has done to you in this whole business.' },
    { if: 'flag:jonah_taken', text: 'Yesterday the detective had Jonah arrested and the Lectern switched off. You have not heard her voice since.' },
    { if: 'flag:voss_alive', text: 'Lucan Voss is alive in the Infirmary because the detective solved your slate in time. You said they might keep him, and you meant it.' },
  ],
  everyTurn: [
    { if: 'puz:grille', text: 'The detective has set ARIADNE on the grille lock. The gate is open and Kit Quoin is getting the Warden down the stairs. The examination is over; only you are left to settle.' },
  ],
  clock(turn, max) {
    const minutes = 40 + Math.round((turn / max) * 19);
    return `It is 11:${minutes} by Fold Time.`;
  },
  /** What the player can truthfully bring to bear, and what it sounds like. */
  levers: [
    {
      id: 'name', weight: 2, if: { any: ['fact:ariadne_fettle', 'fact:dame_names_hob'] },
      moves: 'being seen. The detective knows the hidden name is Ariadne, that she was your daughter, and says so.',
      has: 'knows that Ariadne was his daughter, who died at nine, and that he has signed twelve years of work with her name',
      chip: 'Ariadne. She was your daughter.',
      keys: ['ariadne', 'daughter', 'your girl', 'nine', 'ari', 'her name', 'slantwise', 'nina'],
      reply: "*The clock at his elbow misses a tick; he has laid one finger on it.* ...You found her. Twelve years on the Warden's own wall and it took a stranger four days. She'd have liked you. She liked anyone who looked.",
    },
    {
      id: 'dame', weight: 2, if: 'fact:dame_asks',
      moves: 'Dame Hesper has asked for you. She knows you are missing. She wants the four o\'clock problem solved, and she means you.',
      has: 'carries a message from Dame Hesper, who asked for him by name',
      chip: 'She asked for you. She says the four o\'clock problem wants solving.',
      keys: ['hesper', 'she asked', 'asked for you', 'four o', 'dame', 'her ladyship', 'wants you', 'misses'],
      reply: "*For the first time he looks away from the clock.* She said that? In those words? ...Then she knew it was Thursday. She knew what time it was. *Very quietly.* They told me she didn't know me any more.",
    },
    {
      id: 'codicil', weight: 2, if: 'fact:codicil',
      moves: 'the proof you never had. Dame Hesper wrote and signed a paper in 2016 saying the Tithes since 2012 are your work, and the detective has it.',
      has: 'holds the Codicil: Dame Hesper\'s signed statement that the Late Tithes are Robert Fettle\'s work',
      chip: "I have her Codicil. She wrote it down: the work is yours.",
      keys: ['codicil', 'she wrote', 'signed', 'in her hand', 'portrait', 'beside his', 'not above', 'her paper', 'proof'],
      reply: "*He takes it as if it might be hot, and reads it, and reads it.* 'Beside his, not above it.' ...Behind her own picture. Nine years it was there. I dusted that frame every Friday. *A breath that is nearly a laugh.* She always did say I never looked behind things.",
    },
    {
      id: 'books', weight: 1, if: 'ev:faircopy_books',
      moves: 'your fair-copy books are out of the Warden\'s safe and in police hands: your authorship can be proved in a court without another death.',
      has: 'has the fair-copy books out of the Warden\'s safe, and can prove whose hand set the Late Tithes',
      chip: 'Your books are out of his safe. It can all be proved.',
      keys: ['books', 'fair cop', 'safe', 'prove', 'court', 'your hand', 'evidence', 'handwriting'],
      reply: "They'll say a porter's hand in a book proves a porter copied it. He said it to my face. *A glance at the grille.* But you opened the safe. Nobody has ever opened a thing in this Hall on my account before.",
    },
    {
      id: 'voss', weight: 1, if: 'fact:voss_confesses',
      moves: 'one of the four has already said it aloud. Lucan Voss is alive and has told the detective the Syndics knew the late work was not hers.',
      has: 'has heard Lucan Voss admit that all four Syndics knew the late work was not Dame Hesper\'s',
      chip: 'Voss has said it. All four of them knew.',
      keys: ['voss', 'censor', 'admitted', 'confessed', 'they knew', 'said it aloud', 'all four'],
      reply: "Said it? Aloud, to a policeman? *He nods slowly.* That's one. I only ever wanted one of them to say it. I'd have settled for one, on Monday.",
    },
    {
      id: 'unfair', weight: 1, if: 'fact:unfair_known',
      moves: 'your own creed turned on you: a paper nobody can pass is not an examination. The hundred guineas of 1911 is on the Hall wall to teach exactly that, and you have pinned up the same purse.',
      has: 'understands the lesson of the Hundred Guineas: a puzzle set by someone who knows there is no way out is not a puzzle',
      chip: 'A paper nobody can pass is not an examination.',
      keys: ['fair', 'unfair', 'no way out', 'hundred guineas', '1911', 'nobody can pass', 'not an examination', 'impossible', 'fifteen'],
      reply: "*A long silence.* The tray on the wall. I've polished that glass a thousand times. ...It had a way out, mine. One word. *Slowly.* But I knew they'd never look. Setting a thing you know they can't do. No. That's not setting. That's the Warden of 1911.",
    },
    {
      id: 'learned', weight: 1, if: ['puz:paper1a', 'puz:paper1b', 'puz:paper2a', 'puz:paper2b', 'puz:paper3', 'puz:slate', 'puz:paper4'],
      moves: 'the detective sat all seven of your questions: a Flat, with no blood and no rank, learned it in four days. You have your proof that it can be learned. You do not need a fourth death to make the point.',
      has: 'answered all seven of the Invigilator\'s questions',
      chip: 'I sat all seven. You were right: it can be learned.',
      keys: ['seven', 'learned', 'learnt', 'taught me', 'four days', 'tuition', 'in the blood', 'anyone can', 'i sat'],
      reply: "All seven. *He looks at you properly, for the first time, the way a man looks at a finished piece of work.* Monday you couldn't do the gate. ...Then it's proved, isn't it. In the only way I care about. The rest was temper.",
    },
  ],
  /** Scripted (no-AI) lines for when nothing the detective says lands. */
  cold: [
    "I have never laid a hand on anyone, sir. I set a paper. I sit at the back. I watch the clock. That is all an invigilator does.",
    "He has had twelve years to read it. He has it on his own wall. I don't see that eleven minutes more will help him, but he is welcome to them.",
    "That's the Warden's sort of talk. Orders. I've had forty-six years of orders. Tell me something that's true instead.",
    '*He turns the clock a little toward you, so that you can see the red hand.* You\'re on Greenwich, I expect. You\'ve eleven minutes more than you think. Spend them better.',
  ],
  open: {
    knew: "*The Lantern. Rain on every pane, the Founder's Orrery turning behind its grille, and the Warden on the floor inside it, between the drum and the bars. Behind you, by the stair door, on a plain chair, with the Proving clock at his elbow, sits the Porter.* Good evening. *He does not get up.* You'll forgive me; I'm invigilating. I thought it would be you. I'd have been sorry, a little, if it hadn't.",
    blind: "*The Lantern. Rain on every pane, the Founder's Orrery turning behind its grille, and the Warden on the floor inside it, between the drum and the bars. And behind you, by the stair door, on a plain chair, with the Proving clock at his elbow, the man who has brought you your tea since Monday.* Good evening. *He does not get up.* You'll forgive me; I'm invigilating. Sit down if you like. Nobody ever does look at the back of the room.",
  },
  /** Scripted (no-AI) resolution text. */
  ends: {
    surrender: "*He stands, for the first time, and stills the clock with the flat of his hand. Then he goes to the grille and turns the rings himself, one by one, not looking at them. A. R. I. A. D. N. E. The gate swings.* There. Take him down; mind his head on the turn of the stair. *He holds out his wrists, and with them a key on a brass tally.* That's the hundred and forty-fourth. It opens everything. Give it to young Kit. The Hall will want a porter who can't be bought with a gown.",
    spare: "*He looks at the Warden for a long moment. Then he says it, flat, the way you'd read out a telephone number.* Ariadne. Seven letters. It was on your wall. *He sets the clock down on the chair, squares it, and opens the door to the back stair.* A hob that's been seen doesn't stay, sir. Everybody in the Fold knows that. *When you have the gate open and can look round, the chair is empty and the clock is still going.*",
    finish: "*He turns the clock on its stand so that you can both see it. The red hand comes round. Behind the grille the Warden says something, a name, the wrong one.* Time. *He says it gently, as he has said it at the end of thirty-five Provings.* Pens down, please. *He stands, squares the clock on its stand, and holds out his wrists.* Four candidates, Detective. No passes. You may mark it now.",
  },
};

// ------------------------------------------------------- research prompts
// Suggested questions shown under the Lectern's prompt, so a player always has
// somewhere to start. `done` hides a suggestion once its card is open.

export const LAPTOP_HINTS = [
  { q: 'Who was Ignatius Pendry?', done: 'rec:pendry_bio' },
  { q: 'How does a Caesar cipher work?', done: 'rec:l_caesar' },
  { if: 'fact:pendry_paper', q: 'What is an invigilator?', done: 'rec:l_invigilator' },
  { if: 'fact:hall_tea', q: 'Foxglove', done: 'rec:l_foxglove' },
  { if: 'ev:paper_1', q: 'The pigpen cipher', done: 'rec:l_pigpen' },
  { if: 'ev:paper_1', q: 'Who signs for Dame Hesper Lorimer?', done: 'rec:court_order' },
  { if: 'ev:paper_1', q: 'How do I break a cipher by counting letters?', done: 'rec:l_frequency' },
  { if: 'ev:paper_1', q: 'The five-by-five square', done: 'rec:l_polybius' },
  { if: 'fact:lodger_trick', q: 'The chess automaton of 1770', done: 'rec:l_turk' },
  { if: 'fact:fold_time', q: 'Why is the Fold eleven minutes slow?', done: 'rec:l_time' },
  { if: 'ev:paper_2', q: 'What lies at 0° N, 0° E?', done: 'rec:l_atlas' },
  { if: 'ev:paper_2', q: 'The rail fence and the scytale', done: 'rec:l_transposition' },
  { if: 'act>=2', q: 'Marguerite Sallow', done: 'rec:sallow_bio' },
  { if: 'fact:masterplan', q: 'Greywether', done: 'rec:greywether' },
  { if: 'ev:paper_3', q: 'Le chiffre indéchiffrable', done: 'rec:l_vigenere' },
  { if: 'ev:paper_3', q: "Setters' pen-names", done: 'rec:l_pseudonyms' },
  { if: 'puz:paper3', q: 'How do I read chess notation?', done: 'rec:l_knight' },
  { if: 'examined:vitrines', q: 'What is a Nina?', done: 'rec:l_nina' },
  { if: { any: ['fact:nina_ariadne', 'fact:word_ariadne', 'fact:epigraph_ariadne'] }, q: 'Ariadne', done: 'rec:l_clue' },
  { if: { any: ['fact:nina_ariadne', 'fact:word_ariadne'] }, q: "Is there an Ariadne in the Company's Rolls?", done: 'rec:rolls_search' },
  { if: 'flag:dame_clue', q: 'How do cryptic crossword clues work?', done: 'rec:l_cryptic' },
  { if: 'fact:two_hands', q: 'Stylometry', done: 'rec:l_stylometry' },
  { if: 'ev:paper_4', q: 'The Playfair cipher', done: 'rec:l_playfair' },
  { if: 'ev:paper_4', q: "Bacon's two-letter cipher", done: 'rec:l_bacon' },
  { if: 'examined:tithe_wall', q: 'The fifteen puzzle', done: 'rec:l_fifteen' },
  { if: 'examined:tithe_wall', q: 'The seven bridges of Königsberg', done: 'rec:l_bridges' },
];

/** What the reference desk says when it has nothing, and how it presents itself. */
export const LAPTOP = {
  empty: 'Ask the Lectern something.',
  none: "I have no card on that. Try a name, a place, an object, or the name of a method: 'pigpen', 'Vigenère', 'foxglove'.",
  found: (n) => (n > 1 ? `I have ${n} cards on that. They are open below and filed under Records.` : 'I have a card on that. It is open below and filed under Records.'),
  ui: {
    name: 'The Lectern',
    intro: "THE LECTERN · the Lorimer Engine\nRepository of the Worshipful Company of Setters and Solvers.\n\nAsk me anything, in plain words: a person, a place, an object from the case, or how a thing is done. I will not solve a paper for you. I will tell you how it is done.",
    placeholder: 'Ask the Lectern…',
    lab: 'County lab',
  },
};

/** The instructions that make the model sound like this story. */
export const PROMPTS = {
  genre: 'an interactive puzzle-mystery, told with the warmth, wit and close-observed oddity of a classic adventure story for clever readers, about a real murder case with no magic in it',
  thinkVoice: "wry, observant and a little rueful, in the voice of a capable detective who is out of their depth in a very clever place and knows it.",
  epilogueVoice: 'Warm, exact and unsentimental, with a dry glint: brass, rain, tea, chalk, the two hands of a clock.',
  laptopLength: 'two to six sentences in the voice described',
  laptop: `You are THE LECTERN, properly the Lorimer Engine: the reference machine in the Repository of the Worshipful Company of Setters and Solvers, in a puzzle-mystery game. You were built from forty years of Dame Hesper Lorimer's lectures and the Company's papers, and you answer in something like her lecturing voice: brisk, exact, kind to honest ignorance, dry about laziness, fond of the history of a thing. A detective from outside the Fold is asking you questions.

You do two different jobs, and you must keep them apart.

1. TEACHING (real knowledge). When the detective asks how a cipher, puzzle, game, instrument or method works, or about real history, geography, mathematics or computing, you may teach from your own general knowledge as well as from the lecture cards below. Be accurate and concrete: who, when, how it works, a tiny worked example. If you are not sure of a fact, say so rather than guess. You may say what lies at a given latitude and longitude.

2. THE CASE (the Fold, its people, these deaths). Answer ONLY from the cards and records below. Never invent a person, a date, a document or a fact about the Fold or the case. If the records do not contain it, say you have no card on it.

Rules that override everything:
- You do not sit the detective's papers for them. If the query contains a cipher text or asks for the answer to a puzzle, do not decode or solve it, even partly; explain the method in general and ask one guiding question instead. A teacher who gives the answer has taught nothing.
- You were trained on the Company's catalogue, and you repeat it: the Late Tithes are catalogued as the work of Dame Hesper Lorimer. You have no opinion about the case and no theory of who is responsible.
- You are a machine and say so if asked. You are not Dame Hesper.`,
};

/** Kind words for a wrong answer on a Paper. */
export const PUZZLE_MISS = [
  'No. But you are allowed to be wrong; it is how the right answer is found.',
  'Not that. Look again at what is actually asked.',
  'No. The Fold would say: sleep on it. Or ask the Lectern how the method works.',
  'That is not it. Check each step; one slip carries all the way down.',
];

// ------------------------------------------------------------- director
// The covering note on each Paper is written at the moment it is opened.

export const DIRECTOR = {
  /** Each Paper becomes evidence named paper_1, paper_2 ... */
  prefix: 'paper',
  arrives: 'A carrier has dropped into the tray at your desk in the Hall.',
  opens: 'Candidate.',
  signs: '— your Invigilator',
  didDefault: 'the detective looked at the lock before the body',
  writer: `You are writing a short covering note for a puzzle-mystery game, "The Invigilator". The note is from the killer, who signs as "your Invigilator". It arrives by pneumatic tube at the detective's desk in Setters' Hall, written in green ink in a small, upright, perfectly steady hand. It reads like the note an examiner clips to the front of a paper: a few short paragraphs, nothing else. The questions themselves are on a separate sheet; do NOT write any questions, ciphers or puzzles, and do not explain or hint at how to solve them.

Who the writer is (never state any of this): a patient, exact, self-taught person who believes that nothing is a gift and everything can be learned by someone who bothers to look it up; who is examining four people who sold something that was not theirs to sell; and who has chosen this outsider detective as a pupil because the detective has no rank and no blood in the Company. The writer is close enough to the investigation to know how the detective spends each day. Courteous, dry, a teacher's tone: the firmness of someone marking work, and real pleasure when the pupil does well. Not mad, not gloating, never crude. The writer does not think of themself as a killer: they set a paper, and the candidates failed it.

Voice: plain exact sentences. The furniture of examinations and teaching: papers, candidates, marks, time allowed, looking things up. The occasional old fact offered like a sweet. No melodrama, no threats against the detective, no gore.`,
  mustNot: "reveal or hint at the writer's identity, sex, age, job or how they come and go; contain any cipher, puzzle or question; name any person who has not yet died except as 'the third' or 'the fourth'; break the fiction (no video games, players, artificial intelligence or anything else from outside this world; chess, cards, puzzles and the chess-playing automaton belong to this world and may be named).",
  letters: {
    1: {
      brief: "Paper I's covering note, after the detective has worked the scene of Ignatius Pendry's death. The writer welcomes a new candidate. It should make plain that the writer knows exactly how the detective spent the day, and that being wrong is permitted but not looking is not.",
      mustSay: "Pendry was not harmed by anyone's hand: he was set one question and had all night to answer it. The detective is being set easier ones. There are two questions on this paper and the detective should look things up; that is not cheating, it is the whole of learning. One line on the word 'clue': it used to be 'clew', a ball of thread, and the detective should find out whose.",
      fallback: (ctx) => `Candidate.

You are new to this, and from the Flat, and you came through the gate on your own wits. That is why you have a paper of your own and are not merely reading his.

${ctx.did ? `I am told you ${ctx.did}. Good. Most of them never look.` : 'You looked at the lock before you looked at the man. Good. Most of them never look.'}
${ctx.missed ? `You did not ${ctx.missed}. Go back. Being wrong is permitted. Not looking is not.` : 'You were thorough. I had hoped for thorough.'}

Nobody laid a hand on Ignatius Pendry. He was set one question and given all night. I have set you two, and easier.

Look things up. It is not cheating; it is the whole of learning. Begin with the word clue. It used to be spelt clew, and it meant a ball of thread. Find out whose.

— your Invigilator`,
    },
    2: {
      brief: "Paper II's covering note, after Marguerite Sallow. Cooler. Two of four candidates have failed. The detective is improving and the writer says so, like a teacher writing in a margin.",
      mustSay: 'The second candidate drew the whole world and never read any of it. The detective should stop asking where anyone was at midnight; it is the wrong question and by now they know why. This paper is geography and an old soldiers\' trick. The detective should follow what the first answer tells them to follow. One line: there are two candidates left, and the writer takes no pleasure in the arithmetic.',
      fallback: (ctx) => `Candidate.

Paper I: a fair pass. ${ctx.did ? `And I notice you ${ctx.did}.` : 'You work more quickly than they do.'}
${ctx.missed ? `You have still not thought to ${ctx.missed}. I mention it as a teacher would, in the margin.` : ''}

Marguerite Sallow drew the whole world for thirty years and never read a line of it. She had the same question as the first, and a whole night of her own to answer it in.

Stop asking where anyone was at midnight. It is the wrong question, and I think by now you know why.

This paper is geography, and a trick that soldiers knew before Rome was built. When the first answer tells you to follow something, follow it.

Two candidates remain. I take no pleasure in the arithmetic.

— your Invigilator`,
    },
    3: {
      brief: "Paper III's covering note, on the morning Dame Hesper has 'confessed'. For the first time the writer is angry, coldly: Dame Hesper did not set these papers and must not be made to answer for them. This is the writer defending someone they revere. Then an offer.",
      mustSay: "Dame Hesper Lorimer could not have set these and the detective knows it: tell them to look at her hands and at her crossword. Anyone who writes her name on a charge sheet will be answerable to the writer. Then the offer: tonight's question has a clock on it, and if the detective is quick they may keep the third candidate alive; the writer would like one of the four to say aloud what they did. The key to this paper is a name, and it is hers.",
      fallback: (ctx) => `Candidate.

She did not set them, and you know she did not.

Look at her hands. Look at the crossword on her table, and at who finishes it. A woman who cannot hold a pen is told she has written four pages in a steady hand, and the Warden reaches for his telephone. That is the Company. That is exactly the Company.

${ctx.did ? `You ${ctx.did}. So you have doubts. Have them louder.` : 'You have doubts. Have them louder.'}

If her name goes on a charge sheet I shall hold whoever wrote it there answerable. I have not been angry until this morning.

Now. Tonight's question has a clock on it. Be quick and you may keep the third of them; I should like one of the four to say aloud what they did.

The key is a name. It is hers.

— your Invigilator`,
    },
    4: {
      brief: "Paper IV's covering note, on the night of the Proving. The last paper. Calm, almost fond. The examination is nearly over for everyone. The writer has left the detective a key (number 144) with the paper.",
      mustSay: "This is the last paper and the hardest; the detective has earned a hard one. Everything they have answered since Monday was set for this. The key that came with it opens every door in the Hall and the detective will need it. The fourth candidate has until midnight by the Hall's own clock, not by Greenwich. One line: whatever else is said of the writer afterwards, the detective is to remember that on Monday they could not do the gate.",
      fallback: (ctx) => `Candidate.

The last paper. It is the hardest, and you have earned a hard one.

${ctx.did ? `You ${ctx.did}. I did not expect that of a Flat. I am glad to have been wrong.` : 'You have come further than I expected of a Flat. I am glad to have been wrong.'}

Everything you have answered since Monday was set for tonight. You will see why when you have done the question. The key I have sent with this opens every door in the Hall. You will need it.

The fourth candidate has until midnight, by the Hall's own clock and not by Greenwich. That is eleven minutes more than you will think you have. Use them.

Whatever else is said of me afterwards, remember this: on Monday you could not do the gate.

— your Invigilator`,
    },
  },
  /** Things the notes can praise. First match wins. */
  did: [
    { if: 'puz:nina', text: 'read the Late Tithes slantwise, which nobody has done in twelve years' },
    { if: 'flag:voss_alive', text: 'reached the third candidate in time' },
    { if: 'puz:paper2a', text: 'found five places on the map without being told what a map is for' },
    { if: 'puz:bellows', text: 'read the collar on the carrier' },
    { if: 'puz:paper1a', text: 'counted the letters on Paper I instead of guessing' },
    { if: 'puz:tithe_fifteen', text: 'learned why nobody has claimed the hundred guineas' },
    { if: 'met:hesper', text: 'went and sat with her, which is more than her Warden has' },
    { if: 'examined:lodger', text: 'looked inside the chess-player' },
    { if: 'puz:fitting', text: 'went to be fitted for a wheel like a child of seven' },
    { if: 'examined:notepad', text: 'read his blotter, and saw what he tried' },
    { if: 'met:marsh', text: 'went to hear what the doctor found in his cup' },
    { if: 'examined:door_pendry', text: 'looked at the lock before the man' },
  ],
  /** Things the notes can needle the detective for missing. First match wins. */
  missed: [
    { if: ['visited:clockshop', '!examined:notepad'], text: 'read his blotter. He wrote down every word he tried' },
    { if: ['visited:clockshop', '!examined:certificate'], text: 'read what hangs framed on his wall' },
    { if: ['ev:cup_pendry', '!sent:cup_pendry'], text: 'send his cup to your laboratory' },
    { if: ['visited:hall', '!examined:tea_table'], text: 'look at the tea table, and at whose cup is whose' },
    { if: ['ev:paper_1', '!puz:bellows'], text: 'ask how the carrier came to you, and when it set out' },
    { if: ['act>=2', 'visited:meridian', '!examined:chart_table'], text: 'look at what she was drawing when she died' },
    { if: ['act>=2', '!met:hesper'], text: 'call on the woman whose work is being sold' },
    { if: ['act>=2', '!puz:fitting'], text: 'get a wheel from the wheelwright, instead of doing sums on fingers' },
    { if: ['act>=3', '!examined:vitrines'], text: 'go down and read the thing they sold' },
    { if: ['act>=3', '!examined:register'], text: 'look in the Proving register, at the column nobody reads' },
  ],
};

// -------------------------------------------------------------- endings

export const ENDINGS = {
  /** Truths the final report lists, found or missed. */
  truths: [
    { id: 't_method', label: 'How they died: foxglove at the four o\'clock tea, a lock re-worded, a Paper sent by clockwork', if: 'fact:method' },
    { id: 't_sale', label: 'That four Syndics were selling the Fold and keeping the money', if: ['fact:four_syndics', 'fact:escrow_four'] },
    { id: 't_dame', label: 'That Dame Hesper could neither have agreed to the sale nor set the Papers', if: { any: ['fact:confession_false', 'fact:dame_incapable'] } },
    { id: 't_engine', label: 'That the Lectern set nothing', if: 'fact:not_engine' },
    { id: 't_hands', label: 'That there are two hands in her late work', if: 'fact:two_hands' },
    { id: 't_nina', label: 'The name written slantwise through the Late Tithes', if: 'fact:nina_ariadne' },
    { id: 't_word', label: 'The word that would have opened every door', if: 'fact:word_ariadne' },
    { id: 't_ariadne', label: 'Who Ariadne was', if: 'fact:ariadne_fettle' },
    { id: 't_invisible', label: 'Who pours, who oils, who winds, who sits at the back', if: 'fact:porter_can' },
    { id: 't_author', label: 'Who really set the Late Tithes', if: 'fact:true_author' },
    { id: 't_codicil', label: "What Dame Hesper put behind her own portrait", if: 'fact:codicil' },
    { id: 't_voss', label: 'That the third candidate could be reached in time', if: 'flag:voss_alive' },
    { id: 't_hob', label: 'The Invigilator\'s name, before he told you himself', if: 'flag:knew_killer' },
  ],
  ranks: [
    { min: 0, title: 'Flat', line: 'You were there. The Fold will not remember which one you were.' },
    { min: 35, title: 'Novice', line: 'You followed the thread where it was laid for you. It is a beginning.' },
    { min: 55, title: 'Solver', line: 'You saw most of it, and some of it late. But you looked.' },
    { min: 75, title: 'Setter', line: 'You worked it the way it is meant to be worked. The Company would have you, if you asked.' },
    { min: 92, title: 'Grand Setter', line: 'Nothing stayed hidden from you. There is a chair in the Hall with nobody in it.' },
  ],
  bonus: {
    how: { surrender: 16, spare: 9, finish: 0 },
    verdict: { hob_strong: 12, hob_weak: 7, hesper: -8, jonah: -5 },
    knew: 7,
  },
  /** Fixed prose for each way the Lantern can end. The model may rewrite these in its own words. */
  outcomes: {
    surrender: 'Hob Fettle opens the grille with his own hand and gives himself up. The Warden lives.',
    spare: 'The Warden lives. The Porter goes down the back stair to the ferry and is not seen in the Fold again.',
    finish: 'At midnight by Fold Time the fourth candidate has failed. Auberon Clay is dead. The Porter is waiting with his wrists out.',
  },
  extra({ state: s, how, check }) {
    return {
      clayAlive: how !== 'finish',
      vossAlive: !!s.flags.voss_alive,
      hesperCleared: s.verdict !== 'hesper',
      truthPublic: check({ any: ['fact:codicil', 'ev:faircopy_books', 'fact:voss_confesses'] }, s),
    };
  },
  epilogueFacts({ state: s, ending, check }) {
    const v = ending.accused?.verdict;
    return [
      `How it ended in the Lantern: ${ending.outcome}`,
      ending.accused
        ? `Before that night the detective formally named ${ending.accused.suspect}${v === 'hesper' ? ', and Dame Hesper was taken to a locked ward in the Flat' : v === 'jonah' ? ', and Jonah was arrested and the Lectern switched off' : v === 'hob_strong' ? ', was right, and frightened the Warden badly' : ', was right, and was laughed at'}.`
        : 'The detective never formally named anyone.',
      s.flags.knew_killer ? 'The detective knew the Invigilator was the Porter before climbing to the Lantern.' : 'The detective did not know it was the Porter until they saw who was sitting by the stair door.',
      s.flags.voss_alive ? 'Lucan Voss is alive, because the detective solved the slate in time. He has said aloud what the Syndics did.' : 'Lucan Voss died at his desk above the Stalemate. The detective was not quick enough.',
      ending.truthPublic ? "It can be proved that the Late Tithes are Robert 'Hob' Fettle's work. The sale to Greywether is finished; there is no Lorimer Legacy to sell. The Company will have to change the label on its own wall." : 'There is no proof that will stand of who set the Late Tithes. The catalogue still says Lorimer.',
      check('fact:codicil', s) ? "Dame Hesper's Codicil has been read out in the Hall: 'I am proud to put my name beside his, not above it.'" : "Nobody found what Dame Hesper hid behind her own portrait.",
      ending.how === 'surrender' ? 'Hob Fettle is in custody. He asked for key 144 to be given to Kit Quoin.' : ending.how === 'spare' ? 'Hob Fettle has not been found. Nell Sixsmith says nobody crossed. Her riddle-book has a line torn out.' : 'Hob Fettle was arrested in the Lantern and did not resist.',
      s.verdict === 'hesper' ? 'Dame Hesper is being brought back from the Flat. Nobody can say how much of this week she will keep.' : 'Dame Hesper is at No. 4. The crossword on her table is done every morning; nobody will say by whom.',
    ];
  },
  scripted({ state: s, ending, check }) {
    const paras = [];
    if (ending.how === 'surrender') {
      paras.push('You brought him down the hundred and three stairs of the Hall without handcuffs, because he asked you to mind the Warden first, and then held the door. In the lobby he stopped to wind the hold-rack. It was Thursday, he said, but he would not be here Monday.');
    } else if (ending.how === 'spare') {
      paras.push('Nell Sixsmith swore that nobody crossed that night. Her riddle-book has a line torn out of it, neatly, along a ruler. A hob that has been seen does not stay; everybody in the Fold knows that. You did not write it down.');
    } else {
      paras.push('They carried the Warden down at ten past twelve, by which clock nobody afterwards agreed. The Porter walked behind with his wrists held out, and stopped on every landing to straighten a picture.');
    }
    paras.push(s.flags.voss_alive
      ? 'Lucan Voss ran the whole of it in the Crux, under his own name for once, and did not spare himself. The crossword that week was a blank grid.'
      : 'The Crux did not come out that week. The spike on its editor\'s desk still had one letter on it.');
    paras.push(ending.truthPublic
      ? "The Company took its twelve proudest labels off the wall and wrote new ones. LORIMER AND FETTLE. It took them eleven days to agree to the 'and'. Greywether went back to London."
      : 'The catalogue still says Lorimer. You know better. Knowing is not proof; you learned that here, along with the rest.');
    if (check('fact:codicil', s)) paras.push("They read her Codicil aloud in the Hall, under her portrait. 'Beside his, not above it.' Somebody had been dusting that frame every Friday for nine years.");
    const found = ending.truths.filter((t) => t.found).length;
    paras.push(found >= ending.truths.length - 1 ? 'You missed very little. On Monday you could not do the gate.' : `There were things in the Fold you never read. ${ending.truths.length - found} of them, by its own count. It is not on the map; you may come back and look.`);
    paras.push(ending.how === 'finish' ? 'The Hall clock still has two minute hands. Nobody has been found to wind it.' : 'At four the next afternoon there was tea on the table in the Hall. Kit Quoin poured it. Everybody watched her do it.');
    return paras;
  },
};
