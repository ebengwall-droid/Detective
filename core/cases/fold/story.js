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
  tagline: 'A murder mystery in a hidden city of puzzle-makers.',
  city: 'Ravel',
  killerName: 'the Invigilator',
};

/** Where the game begins, and where the detective's desk is. */
export const START = { location: 'gatehouse', hub: 'hall' };

/** What everybody in the Fold knows. Goes into every character prompt. */
export const WORLD = `The story is set in the present day, in a wet October, in Ravel. Ravel is an old cathedral city in the west of England.

THE FOLD is six crooked lanes and a square on an island. The island lies between the river and a canal called the Cut. The Fold is not on any accurate map. The people who live there have drawn Ravel's maps since 1741. They have always put their own streets in the fold of the page, where nobody can see them. Satellite navigation stops working at the bridge. There is no mobile signal. There are two ways in. One is the Turnstile on Turnagain Lane. Its letter-lock opens to the word of the day. The other is Nell Sixsmith's ferry across the Cut. The fare is the answer to a riddle.

The Fold is the home of the WORSHIPFUL COMPANY OF SETTERS AND SOLVERS. For six hundred years its people have made puzzles, ciphers, locks, maps, mazes and games for a living. Nothing here is magic. It is all craft: brass, oak, clockwork, paper and ink. People from outside are called Flats (people from the flat part of the map). It is not meant unkindly.

How the Fold works:
- FOLD TIME: the Fold never took London's time. It keeps its own noon, eleven minutes behind Greenwich. Every public clock has two minute hands. The red one is for strangers.
- THE BELLOWS: a Victorian pneumatic post. Brass tubes run to every building. Messages travel in brass carriers with leather caps. A carrier can be left in the hold-rack at the exchange in the Hall, set to go out hours later.
- LETTER-LOCKS: the Company's private rooms lock from the inside with a brass lock of seven lettered rings. It opens to its owner's word.
- RANK: Novice, Solver, Setter, Grand Setter. Members rise in rank by sitting THE PROVING, the Company's examination. It is held in Setters' Hall on the Thursday of this week. It is sat in silence. One person sits at the back with the clock and says nothing for three hours: the invigilator.
- THE TITHE: every member owes the Company one new puzzle a year. The puzzles are pinned on the Wall of Tithes in the Hall.
- The Company is run by the WARDEN and three other SYNDICS. At four o'clock every afternoon the Syndics have tea in the Hall.

People everybody knows:
- DAME HESPER LORIMER, 74, the greatest setter the Company has had. For forty years she set its hardest papers under the pen-name VESPER. She was Warden until 2011. Her twelve "Late Tithes" (2012 to 2023) are called the finest work of her life. Her mind has failed. Since March she has lived at No. 4, the Almshouses, with a nurse. By order of the court, the Warden signs for her.
- THE LECTERN: its proper name is the Lorimer Engine. It is a reference machine in the Repository under the Hall. Young Jonah Okafor-Reed built it from Dame Hesper's lectures and the Company's papers. It answers questions in something like her voice.
- THE SALE: the four Syndics have agreed to sell "the Lorimer Legacy" to a London firm called Greywether. The Legacy is her life's work and the Lectern. The sale completes on 31 October. The Fold is divided about it, and nobody has been told the details.

THE DEATHS: On Monday morning the clockmaker and Syndic IGNATIUS PENDRY, 71, was found dead at his bench at 4 Nonesuch Row. He was locked in from the inside. He had taken tea with the other Syndics at four on Sunday, as he did every day. At seven he locked himself in to work, as he did every night. (In Proving week the Fold works on Sundays.) The player is a police detective from Ravel CID, so a Flat. The detective was sent in that Monday with Detective Constable Kit Quoin, the only Fold-born officer in the force.

THE DAYS: the story runs from that Monday to Thursday, the night of the Proving. Your stage notes say which day it is. Nothing after that day has happened yet, and you know nothing about it.`;

export const ACTS = {
  1: {
    title: 'The Clockmaker',
    date: 'Monday of the Proving week',
    card: [
      "Ravel is an old cathedral city in the west of England. One part of it, the Fold, is not on any map. Since 1741 the people of the Fold have drawn Ravel's maps. They always leave their own streets off.",
      "The Fold is six crooked lanes on an island between the river and a canal. Its people make puzzles, codes and locks for a living. They call everyone from outside 'the Flat'.",
      "You are a police detective from Ravel, so to them you are from the Flat. It is the week of the Proving, the Fold's yearly puzzle exam. It takes place on Thursday night.",
      "At a quarter past seven this morning, a clockmaker's apprentice could not open his master's door. It was locked from the inside. Behind it, the clockmaker Ignatius Pendry was dead.",
      'You have been sent in with Detective Constable Kit Quoin, who grew up in the Fold. First, you have to get through the gate.',
    ],
    // Drawn by the page under the paragraph with the same index: the city, why no map shows the Fold, and the Fold itself.
    pictures: [['ravel', 'crease'], ['fold']],
  },
  2: {
    title: 'The Map-Maker',
    date: 'Tuesday of the Proving week',
    card: [
      'At first light, the ferrywoman, Nell Sixsmith, finds a second body. She goes to look because the cat is on the roof of a boat and will not come down.',
      'The dead woman is Marguerite Sallow. She drew every map of Ravel sold in the last thirty years. She is aboard her narrowboat, the Meridian, at her own chart table. Her hatch is locked on the inside.',
      'Beside her is a flask of tea from the Hall. Under her hand is a sheet of paper written in green ink.',
      'Like Pendry, she was one of the four Syndics who run the Company. Two of the four are now dead.',
    ],
  },
  3: {
    title: 'The Third Paper',
    date: 'Wednesday of the Proving week',
    card: [
      'It is a bright, cold morning, and the Fold thinks it knows who the killer is.',
      "At breakfast, Dame Hesper Lorimer put down her spoon. She told her nurse clearly that she had set the Papers herself. 'Who else is there?' she said.",
      'By nine, the Warden has telephoned your Superintendent. He calls it a confession from a poor old woman who is not fit to stand trial. Nobody needs to go to prison. He wants the case closed before the Proving.',
      'Only two Syndics are still alive, and the Warden is one of them.',
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
    'Yesterday the Porter folded his cloth. He said he had to get the supper ready, and he left.',
    'Nobody has seen him since. Still, the tea was on the table at four, and nobody could say who had made it.',
    'Tonight nine candidates sat the Proving in the Hall. The chair at the back, behind them, stayed empty. When the last of them handed in, the Warden had gone too.',
    'On your desk, in the tray under the Bellows tube, is a new Paper. With it is a key on a brass tag, number 144.',
  ],
  hob_strong: [
    'The Warden listens to the end. He goes very pale. Then he says none of it will be written down, and he sends for the Porter.',
    "The Porter's Lodge is empty. His daybook is closed, with the pen laid across it.",
    'Tonight nine candidates sat the Proving in the Hall. The chair at the back, behind them, stayed empty. When the last of them handed in, the Warden had gone too.',
    'On your desk, in the tray under the Bellows tube, is a new Paper. With it is a key on a brass tag, number 144.',
  ],
  hob_weak: [
    "The Warden laughs out loud. 'Fettle? He brings the tea, Detective.' He sends for the Porter so that you can apologise. The Porter stands with his hands folded and says there is nothing to forgive.",
    'Tonight nine candidates sat the Proving in the Hall. Someone sat in the chair at the back, as someone has every year since 1990. You watched that chair for all three hours. The person in it never moved.',
    "When the last of them handed in, that chair was empty. So was the Warden's.",
    'On your desk, in the tray under the Bellows tube, is a new Paper. With it is a key on a brass tag, number 144.',
  ],
  hesper: [
    "At noon they come for Dame Hesper with a car and a blanket. She asks the driver if he is the four o'clock problem. People in the Fold stand in their doorways and say nothing at all.",
    'The Warden shakes your hand. The people from Greywether send flowers to the Hall.',
    "Tonight nine candidates sat the Proving. When the last of them handed in, the Warden's chair was empty. So was the chair at the back.",
    'On your desk, in the tray under the Bellows tube, is a new Paper in green ink. So Dame Hesper did not set them. With it is a key on a brass tag, number 144.',
  ],
  jonah: [
    "Jonah Okafor-Reed is arrested in the Repository with his hands still on the keyboard. 'It can't even set a fair clue,' he says. 'Ask it to set you one fair clue.' Within the hour, Greywether's lawyers have the Lectern switched off.",
    'So the machine is off, and the man who built it is in a police cell in the Flat.',
    "Tonight nine candidates sat the Proving. When the last of them handed in, the Warden's chair was empty. So was the chair at the back.",
    'On your desk, in the tray under the Bellows tube, is a new Paper in green ink. It was written after the Lectern was switched off. With it is a key on a brass tag, number 144.',
  ],
  timeout: [
    'You name nobody. Wednesday passes. On Thursday the Fold puts on its gowns for the Proving.',
    'Nine candidates sit the Proving in the Hall, facing the front. The chair behind them is filled, as it has been every year since 1990.',
    "When the last of them hands in, that chair is empty. So is the Warden's.",
    'On your desk, in the tray under the Bellows tube, is a new Paper. With it is a key on a brass tag, number 144.',
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
  { id: 'voss_found_late', when: ['flag:voss_dead', 'act:3', { stepsSince: 'flag:voss_dead', n: 6 }, '!visited:crux'], do: [{ notify: "The Crux newspaper was not printed. They have broken down Lucan Voss's door." }] },
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
    hints: ['The gate needs a word. Read the letters on the slate, then follow the instruction carved in the stone.', 'Examine the turnstile and do the puzzle. Move each chalked letter three places back in the alphabet.'],
  },
  {
    id: 'o_scene', text: "Examine Pendry's workshop at 4 Nonesuch Row", if: 'flag:through_gate',
    done: ['examined:tube_pendry', 'examined:door_pendry', { min: 3, of: ['examined:bench', 'examined:cup_pendry', 'examined:notepad', 'examined:certificate', 'examined:window_bars', 'examined:ledger_pendry', 'examined:lodger', 'examined:clocks'] }],
    hints: ['He died behind a locked door. Start with the lock. Then look at anything that reached him after he locked it.', "Go to Pendry & Sons. Examine the door, the Bellows tube by the bench, the tea tray and his blotter. Then examine everything else."],
  },
  {
    id: 'o_wilf', text: 'Talk to the apprentice who found him', if: 'visited:clockshop',
    done: 'met:wilf',
    hints: ['Start with the person who found the body: his apprentice, who opened the shop this morning.', 'Talk to Wilf Tandy at the clock shop. Ask him about the door, the tea, and who looks after the locks.'],
  },
  {
    id: 'o_autopsy', text: 'Hear the post-mortem from Dr Marsh', if: 'flag:through_gate',
    done: 'fact:foxglove',
    hints: ['The body has gone to the mortuary in the Flat. The doctor there can tell you how he died.', 'Go to the County Mortuary. Ask Dr Marsh what killed him, when he took it, and whether he could have been saved.'],
  },
  {
    id: 'o_hall', text: "Find your desk at Setters' Hall", if: 'flag:through_gate',
    done: ['visited:hall', 'met:hob'],
    hints: ['The Company has lent you a desk in the Hall. The Porter has the key to it. He has a key to everything.', "Go to Setters' Hall and speak to the Porter at the Lodge."],
  },
  {
    id: 'o_wheel', text: 'Get fitted for a cipher wheel', if: 'visited:clockshop',
    done: 'puz:fitting',
    hints: ['Nobody in the Fold works out a cipher by counting on their fingers. They use a brass cipher wheel.', "Go next door to Quoin & Daughter. Talk to Mrs Quoin and do the fitting at her bench."],
  },
  {
    id: 'o_lab', text: 'Send the tea things to the lab', if: 'ev:cup_pendry',
    done: { any: ['lab:cup_pendry', 'flag:lab_used'] },
    hints: ['His cup still has half an inch of tea in it. A lab can test what was in it.', 'Open the Lectern at your desk in the Hall, go to the Lab tab, and send in the cup.'],
  },
  {
    id: 'o_paper1', text: 'Solve Paper I', if: 'ev:paper_1',
    done: ['puz:paper1a', 'puz:paper1b'],
    hints: ['There are two questions. The first uses the same kind of cipher as the gate. This time it does not tell you how far to shift the letters. The second is written in drawn symbols.', 'Open your Papers in the notebook. Use the Wheel on Question 1. The pigpen key for Question 2 is in your Primer. Then go and find what each one asks for.'],
  },
  {
    id: 'o_carrier', text: 'Find out where Paper I was posted', if: 'ev:paper_1',
    done: 'puz:bellows',
    hints: ['Every carrier is punched on its collar as it passes through the exchange. The punches show where it has been.', "Examine the Bellows exchange in the Hall and read the carrier's collar. Ask the Porter how the hold-rack works."],
  },
  {
    id: 'o_how', text: 'How do you murder a man alone in a locked room?', if: { min: 2, of: ['fact:locked_inside', 'fact:foxglove', 'fact:pendry_paper'] },
    done: 'ded:locked',
    hints: ['Stop asking who was in the room at midnight. Ask whether the killer needed to be there at all.', 'Read the Paper from his tube. Ask Dr Marsh when he drank the poison. Then answer the first question on the case board.'],
  },
  {
    id: 'o_rest1', text: 'When you have done what you can today, take the last ferry home (on the map)', if: ['act:1', 'examined:tube_pendry', 'fact:foxglove', 'visited:hall'],
    done: 'act>=2',
    hints: ['The Fold closes at ten at night, by its own clocks.', "Open the map and choose 'End the day'. Follow up today's leads first. Tomorrow will bring new ones."],
  },
  // Tuesday
  {
    id: 'o_boat', text: 'Examine the Meridian', if: 'act>=2',
    done: ['examined:tube_sallow', 'examined:door_sallow', 'examined:chart_table'],
    hints: ['It is another locked room, this time on a boat.', 'Go to the Meridian. Examine the hatch, the tube, the flask, and what she was drawing.'],
  },
  {
    id: 'o_nell', text: 'Talk to the ferrywoman', if: 'act>=2',
    done: 'met:nell',
    hints: ['Nell found the body. She also writes down everyone who crosses on her ferry.', 'Talk to Nell Sixsmith aboard the Meridian, and look at her riddle-book.'],
  },
  {
    id: 'o_paper2', text: 'Solve Paper II', if: 'ev:paper_2',
    done: ['puz:paper2a', 'puz:paper2b'],
    hints: ['One question is about places on a map. The other is a fence cipher.', 'Open your Papers. For Question 3, find the five places. For Question 4, use the Fence. Each answer points to something aboard the Meridian.'],
  },
  {
    id: 'o_money', text: 'Follow the money', if: 'puz:paper2a',
    done: 'fact:escrow_four',
    hints: ['Sallow sold charts. She would keep her private papers pressed flat inside something large.', 'Go back to the Meridian and look in the big atlas.'],
  },
  {
    id: 'o_sextant', text: "Look in Sallow's sextant box", if: 'puz:paper2b',
    done: 'fact:dame_incapable',
    // The guide points at the box itself, not at the nurse who can also say it.
    go: 'ev:capacity_report',
    hints: ['Sallow did not keep anything just for show. The box may hold more than a sextant.', 'Examine the sextant aboard the Meridian.'],
  },
  {
    id: 'o_joined', text: 'What links the clockmaker and the map-maker?', if: { any: ['fact:legacy_sale', 'fact:masterplan', 'fact:escrow_four'] },
    done: 'ded:sold',
    hints: ['Pendry and Sallow were two people in a group of four. Find out who the four are.', 'Solve Paper I and read the plan on her chart table. Then answer the question on the case board.'],
  },
  {
    id: 'o_dame', text: 'Visit Dame Hesper', if: { any: ['fact:warden_signs', 'fact:legacy_sale'] },
    done: 'met:hesper',
    hints: ["Everyone is selling her life's work. Nobody has asked her about it.", 'Go to No. 4, the Almshouses. Talk to her, and to the nurse. Look at the crossword on her table.'],
  },
  {
    id: 'o_engine', text: 'Talk to the man who built the Lectern', if: 'visited:hall',
    done: 'met:jonah',
    hints: ['The machine that talks like Dame Hesper is in the Repository, under the Hall. The man who built it works there.', 'Go down to the Repository and talk to Jonah Okafor-Reed.'],
  },
  {
    id: 'o_rest2', text: 'When you have done what you can today, take the last ferry home (on the map)', if: ['act:2', 'examined:tube_sallow'],
    done: 'act>=3',
    hints: ['Two are dead and two are left. Tomorrow someone will want the case closed.', "Open the map and choose 'End the day'."],
  },
  // Wednesday
  {
    id: 'o_confession', text: "Test Dame Hesper's confession", if: 'act>=3',
    done: 'ded:confession',
    hints: ['The Papers are in small, steady handwriting. Check whether she can still write like that.', 'Look at her crossword and the medical report from the sextant box. Ask the nurse. Then answer the question on the case board.'],
  },
  {
    id: 'o_paper3', text: 'Solve Paper III', if: 'ev:paper_3',
    done: 'puz:paper3',
    hints: ['It is a cipher with a key word. The Paper tells you whose word it is.', "Open your Papers and use the Square. The key is the pen-name on the plate under Dame Hesper's portrait in the Hall."],
  },
  {
    id: 'o_slate', text: 'Solve the slate at the Stalemate before the Hall clock strikes twelve', if: 'puz:paper3',
    done: { any: ['puz:slate', 'flag:voss_dead'] },
    hints: ["Every wasted move costs time, and someone's life depends on it.", "Go to the Stalemate, examine the slate, and follow the knight's moves square by square."],
  },
  {
    id: 'o_voss', text: 'Get to the third candidate', if: { any: ['puz:slate', 'flag:voss_dead'] },
    done: 'examined:door_voss',
    hints: ['CENSOR sets the crossword for the Crux, a newspaper. Its office is upstairs.', 'Take the stairs in the Stalemate up to the Crux office.'],
  },
  {
    id: 'o_engine2', text: 'Could the Lectern have set the Papers?', if: ['met:jonah', 'ev:paper_2'],
    done: 'fact:not_engine',
    hints: ['Ask the man who built it what it can and cannot do.', 'Ask Jonah whether the Lectern could have written the Papers. Then look at the machine itself.'],
  },
  {
    id: 'o_hand', text: "Who is setting the Papers in Dame Hesper's style?", if: { min: 2, of: ['fact:dame_incapable', 'fact:not_engine', 'fact:two_hands', 'fact:dame_confesses'] },
    done: 'ded:hand',
    hints: ['Neither Dame Hesper nor the machine built from her work set the Papers. Look for someone who learned her style better than the machine did.', 'Show that Dame Hesper cannot write and that the Lectern did not set them. Then answer the question on the case board.'],
  },
  {
    id: 'o_tithes', text: 'Look closely at the Late Tithes', if: { any: ['act>=3', 'fact:legacy_sale'] },
    done: 'puz:nina',
    hints: ['The Late Tithes are under glass in the Repository. Do not read the words. Look at the whole grid.', 'Examine the display cases in the Repository and solve the puzzle of the Late Tithes.'],
  },
  {
    id: 'o_word', text: 'Find the word that would have opened their doors', if: 'examined:door_pendry',
    done: 'puz:lock',
    hints: ["Pendry's Paper said this about the word: 'It is in everything you sold.'", "Find what is hidden in the Late Tithes in the Repository. Then try it on Pendry's lock."],
  },
  {
    id: 'o_ariadne', text: 'Who is Ariadne?', if: { any: ['fact:nina_ariadne', 'fact:word_ariadne', 'fact:epigraph_ariadne'] },
    done: 'fact:ariadne_fettle',
    hints: ["She is not in the Company's Rolls, its list of members. Someone outside the Company wrote her name down.", "Show the hidden name to Dame Hesper. Or ask Nell to look in her riddle-book. Or look under A in Mrs Quoin's fitting ledger."],
  },
  {
    id: 'o_invisible', text: 'Who could do all four: the cup, the lock, the carrier and the chair?', if: { min: 2, of: ['fact:tea_porter', 'fact:locks_oiled', 'fact:rack_wound', 'fact:invigilator_chair'] },
    done: 'ded:invisible',
    hints: ["Four things were done: the tea, the locks, the carrier and the chair. Each one is part of somebody's job.", 'Ask who pours the tea, who oils the locks and who winds the hold-rack. Look in the Proving register. Then use the case board.'],
  },
  {
    id: 'o_books', text: 'See the fair copies of the Late Tithes', if: { any: ['fact:spiked_letter', 'fact:two_hands', 'fact:voss_confesses'] },
    done: 'ev:faircopy_books',
    hints: ["They are in the Warden's safe. The Warden will not open it. One other person can.", "Ask the Porter to open the Warden's safe for you."],
  },
  {
    id: 'o_author', text: 'Who set the Late Tithes?', if: { any: ['fact:two_hands', 'fact:nina_ariadne', 'ev:faircopy_books'] },
    done: 'ded:author',
    hints: ["The work sold as hers was written by two different people. Dame Hesper's own hand shook from 2011.", "Get Jonah's memo and look at the fair-copy books. Find out whose daughter Ariadne was. Then use the case board."],
  },
  {
    id: 'o_accuse', text: 'Name the Invigilator', if: 'act:3',
    done: 'flag:accused',
    hints: ['When you are sure who it is, name them to someone who can make an arrest.', "Open the case board and choose 'Make an arrest'."],
  },
  // Thursday
  {
    id: 'o_paper4', text: 'Solve Paper IV', if: 'ev:paper_4',
    done: 'puz:paper4',
    hints: ['The letters go in pairs, and the key word goes in a square.', 'Open your Papers and use the Frame. The key is the word every Paper is signed with.'],
  },
  {
    id: 'o_meta', text: 'Put your seven answers in order', if: 'puz:paper4',
    done: 'puz:meta',
    hints: ['The killer has been building up to this since Monday.', "Open 'The Order of the Papers'. Any question you skipped must be answered first."],
  },
  {
    id: 'o_lantern', text: 'Get to the Lantern', if: 'puz:meta',
    done: 'visited:lantern',
    hints: ['Go up, as high as you can go in the Hall.', "Open the map and go to the Lantern, on the roof of Setters' Hall."],
  },
  {
    id: 'o_finale', text: 'Stop the fourth Paper', if: 'visited:lantern',
    done: 'flag:finale_done',
    go: 'puz:grille',
    hints: ['There is a lock on the grille. There is also a man on a chair at the back of the room. Try the lock, and talk to the man.', 'If you know the word, set it on the grille lock. Talk to him too: about Dame Hesper, about his daughter, and about what you can prove.'],
  },
];

// ------------------------------------------------------- ending the day
// The player chooses when each day ends; `auto` is the backstop if they never do.

export const REST = {
  1: {
    if: ['flag:through_gate', 'examined:tube_pendry', 'fact:foxglove', 'visited:hall'],
    why: "Not yet. First finish with Pendry's workshop, hear what Dr Marsh found, and find your desk at the Hall.",
    warn: "Take the last ferry back to the Flat? Follow up today's leads first. Tomorrow will bring new ones.",
    auto: 170,
  },
  2: {
    if: ['examined:tube_sallow'],
    why: "Not yet. You still need to examine Marguerite Sallow's boat, the Meridian.",
    warn: 'Take the last ferry? Two of the four Syndics are dead. Tomorrow someone will want the case closed.',
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
    q: 'Ignatius Pendry died alone, behind his own locked door. How was it murder?',
    if: { min: 2, of: ['fact:locked_inside', 'fact:foxglove', 'fact:pendry_paper'] },
    options: [
      { id: 'self', text: 'It was not murder. He took the poison himself.', no: 'He did not want to die. His fingertips are rubbed raw from trying to open the lock and get out.' },
      { id: 'hidden', text: 'The killer hid in the workshop and slipped out in the confusion in the morning.', no: 'Wilf could not get the door open. The constables took it off its hinges while Wilf watched. Nobody came out.' },
      { id: 'window', text: 'The killer came in through the window.', no: 'The window is barred, and it is painted shut too.' },
      { id: 'remote', text: 'Nobody had to be there. He was poisoned at tea. His lock was changed earlier, and the Paper came by tube.', needs: ['fact:drank_at_four', { any: ['fact:pendry_paper', 'fact:held_carrier'] }] },
    ],
    answer: 'remote',
    solved: "He drank the poison at four o'clock, at tea with the others, eight hours before he died. Before that, someone had given his lock a new word without him knowing. The Paper that told him so went into the Bellows hold-rack at midday. A clockwork timer sent it to him at eight that evening.\n\nSo it does not matter where anyone was at midnight. Every alibi in the Fold is useless, and the killer planned it that way.",
    facts: ['method'],
  },
  sold: {
    q: 'What links the clockmaker and the map-maker?',
    if: { any: ['fact:legacy_sale', 'fact:masterplan', 'fact:escrow_four'] },
    options: [
      { id: 'old', text: 'An old quarrel between Nonesuch Row and the Cut.', no: 'There are plenty of old quarrels. None of them involves both of them.' },
      { id: 'proving', text: 'They were both going to be examiners at the Proving on Thursday.', no: 'So were thirty other people.' },
      { id: 'syndics', text: 'They are two of the four Syndics who are selling the Lorimer Legacy.', needs: { any: ['fact:escrow_four', ['fact:legacy_sale', 'fact:masterplan'], ['fact:legacy_sale', 'fact:warden_signs']] } },
    ],
    answer: 'syndics',
    solved: "Four Syndics signed the sale to Greywether. Pendry swore that he had examined the work. Sallow drew the plan. Voss, the editor of the Crux, told the Fold it was a good thing. The Warden signed for Dame Hesper, who was not able to agree to it. The price is eleven million pounds, paid in four equal parts.\n\nTwo of the four are dead. Lucan Voss and Auberon Clay are still alive.",
    facts: ['four_syndics'],
  },
  confession: {
    q: "What does Dame Hesper's confession really mean?",
    if: ['act>=3', { any: ['fact:dame_incapable', 'fact:two_pens', 'fact:dame_confesses'] }],
    options: [
      { id: 'true', text: 'It is true. She set them, and someone delivered them for her.', no: 'She cannot hold a pen well enough to finish her own crossword. The Papers are four pages of small, neat, steady handwriting.' },
      { id: 'mad', text: 'It means nothing. She does not know what she is saying.', no: 'She knows exactly what a paper in her own style looks like. She recognised the Papers. That means something.' },
      { id: 'proud', text: 'It is false, but she is not lying. She knows her own style when she sees it. She cannot imagine anyone else who could set it.', needs: { any: ['fact:dame_incapable', 'fact:two_pens'] } },
    ],
    answer: 'proud',
    solved: "She has not been able to write since before March. A doctor's report says so, and so does the crossword on her table. But she read the Papers and saw her own style in every clue. 'Who else is there?' she asked.\n\nThat is now the question to answer: who else could set Papers like hers?",
    facts: ['confession_false'],
  },
  hand: {
    q: "The Papers are in Dame Hesper's style. Who is setting them?",
    if: { min: 2, of: ['fact:dame_incapable', 'fact:not_engine', 'fact:two_hands', 'fact:confession_false'] },
    options: [
      { id: 'dame', text: 'Dame Hesper herself.', no: "She cannot write. She cannot even get out of her chair without someone's arm to lean on." },
      { id: 'engine', text: 'The Lectern, the machine that was built from her work.', no: 'Its log shows it set nothing. And Jonah is right: if you ask it for a clue, it gives you something that only looks like one.' },
      { id: 'pupil', text: 'One of her old pupils, copying her style.', no: 'Her best pupils are the four Syndics. Two are dead. The Papers are better than anything the other two ever set.' },
      { id: 'third', text: 'Someone who knows her mind better than the machine does, and whom nobody thinks of as a setter.', needs: ['fact:not_engine', { any: ['fact:dame_incapable', 'fact:confession_false'] }] },
    ],
    answer: 'third',
    solved: "Neither Dame Hesper nor the machine built from her work set the Papers. Someone else did: someone who can set a paper as well as she did at her best. Yet nobody thinks of this person as a setter at all.\n\nIn Pendry's shop there is a chess-playing machine that beat emperors for eighty years. The Fold calls it the Lodger, because everybody knows a man could hide inside it.",
    facts: ['third_hand'],
  },
  invisible: {
    q: 'The cup, the lock, the carrier and the chair at the back. Who could do all four?',
    if: { min: 2, of: ['fact:tea_porter', 'fact:locks_oiled', 'fact:rack_wound', 'fact:hob_invigilates'] },
    options: [
      { id: 'warden', text: 'The Warden. He holds every key and sits at every tea.', no: 'At tea, other people serve him. He has never poured a cup in the Hall or oiled a lock in his life. And he is the fourth name on the list.' },
      { id: 'jonah', text: 'Jonah. He can go anywhere in the Hall at night.', no: 'He has never touched the tea table, and he knows nothing about the locks. Ask him which way a setting-pin turns.' },
      { id: 'anyone', text: 'Anyone. The pins hang on an open board and the rack is in the lobby.', no: 'Anyone could do one of them. Someone did all four, on the right days, and nobody noticed. That is not just anyone.' },
      { id: 'porter', text: 'The Porter.', needs: { min: 3, of: ['fact:tea_porter', 'fact:locks_oiled', 'fact:rack_wound', 'fact:hob_invigilates', 'fact:changed_at_service'] } },
    ],
    answer: 'porter',
    solved: "He pours the tea, and nobody watches him do it. Every October he oils the locks and re-pins them. He winds the hold-rack on Mondays. And every year since 1990 he has sat in the chair at the back of the Proving. He keeps the clock and says nothing for three hours, while the whole Company sits with their backs to him.\n\nThe killer signs as the Invigilator. That was never a boast. It is his real job.",
    facts: ['porter_can'],
  },
  author: {
    q: 'Who set the Late Tithes?',
    if: { any: ['fact:two_hands', ['fact:nina_ariadne', 'fact:ariadne_fettle'], 'ev:faircopy_books'] },
    options: [
      { id: 'dame', text: 'Dame Hesper, as the certificate says.', no: "Jonah's analysis shows two different writers. And her own hand shook from 2011." },
      { id: 'engine', text: 'The Lectern drafted them and she signed them.', no: 'The first is from 2012. The Lectern was built in 2019.' },
      { id: 'syndics', text: 'The Syndics set them together and used her name.', no: 'Then one of the four would have known the word that opened his own door.' },
      { id: 'copyist', text: "The man who made her fair copies. For twelve years, the Company's greatest work has been the Porter's.", needs: { any: [['fact:two_hands', 'fact:ariadne_fettle'], 'fact:faircopy_hand', 'fact:dame_names_hob', 'fact:codicil'] } },
    ],
    answer: 'copyist',
    solved: "When Hob Fettle was a boy of fifteen, he emptied her waste-paper basket and read what was in it. He worked beside her for forty-six years. When her mind began to fail, he finished the puzzles she had started. Then he began new ones himself. He signed each one by hiding his daughter's name corner to corner across the grid. She died when she was nine.\n\nThe four Syndics sold twelve years of Hob Fettle's work as hers. When he told them, they locked up his books, kept him out of her room, and laughed at him.",
    facts: ['true_author'],
  },
};

// ------------------------------------------------------------ accusation

export const ACCUSE = {
  if: 'act:3',
  blurb: 'Name the Invigilator to the Warden. You only get one arrest. Whoever you name, the Proving still happens tomorrow night.',
  warn: 'You cannot take it back. If you are wrong, an innocent person pays for it, and the fourth Paper will still come.',
  suspects: ['hob', 'hesper', 'jonah', 'clay', 'kit', 'quoin', 'voss', 'dolores', 'ottilie', 'nell', 'wilf', 'marsh'],
  motives: [
    { id: 'legacy', text: 'To stop the sale of the Fold' },
    { id: 'author', text: 'Because the work they sold did not belong to them, or to her' },
    { id: 'money', text: 'Money' },
    { id: 'dame', text: 'To avenge Dame Hesper' },
  ],
  /** Independent lines of proof against the Porter. Three make a case, if one of them is about whose work it was. */
  pillars: [
    { id: 'signature', label: 'The name hidden in the Late Tithes is his daughter\'s', if: ['fact:nina_ariadne', 'fact:ariadne_fettle'] },
    { id: 'hand', label: 'The Papers are in the same handwriting as the fair copies', if: 'fact:hand_match' },
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
    hob_strong: { who: 'The Warden', text: "*Auberon Clay reads the pages you have put on his desk. Halfway down the second page, he stops and goes pale.* Fettle? You see what this means. If the late work is the Porter's, there is no Lorimer Legacy. There is nothing to sell. No. You will not write this down, Detective. Send for him, and we will hear what he has to say." },
    hob_weak: { who: 'The Warden', text: "*Clay laughs out loud.* Fettle? The Porter? Detective, he brings the tea. He has brought the tea since I was a Novice. Fettle! Come in here a moment. The Detective has something funny to tell you." },
    hesper: { who: 'The Warden', text: "*Clay closes his eyes for a moment, and looks pleased. Then he reaches for the telephone.* A tragedy. Her great mind turned against the Company she loved. I will see that she has every comfort. You have been thorough and quick, Detective. I will tell your Superintendent so." },
    jonah: { who: 'The Warden', text: "*Clay presses his fingertips together. He does not ask what the evidence is.* The Engine. I always said it was a mistake to give the boy the keys. Please take him quietly. Greywether's people are in the building." },
    jonah_weak: { who: 'The Warden', text: "*Clay is tempted. You can see it.* The machine's own log says it wrote nothing, Detective. Greywether's engineers will say so too, loudly, with lawyers behind them. Bring me proof their lawyers cannot argue with." },
    rejected: { who: 'The Warden', text: "*Clay does not look up from his letters.* No. On what evidence? The Proving is tomorrow, and I have a Company to hold together. Bring me a name I can put in front of the Syndics. There are not many of them left." },
  },
};

// --------------------------------------------------------------- finale

export const FINALE = {
  act: 4,
  npc: 'hob',
  location: 'lantern',
  title: 'The Invigilator',
  stay: 'Not now. The Warden is on the floor and the clock is running.',
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
  scene: `It is twenty to twelve by Fold Time on the night of the Proving. You are in the Lantern, the round glass room on the roof of Setters' Hall. The Founder's Orrery turns in the middle of the room, behind an iron grille. Rain is on every pane, and the lights of Ravel are below.

Auberon Clay, the Warden, is on the floor inside the grille. He is wedged between the Orrery's drum and the bars. He is grey and sweating, but awake. Three hours ago he drank foxglove with the Proving supper. The grille gate is shut with a seven-ring letter-lock. His Paper lies on the candidate's desk across the room, where he left it. If he is carried down to the Infirmary before midnight, he will live. You told him what you told the others: the gate opens to one name, and that name is in everything he sold. He has not found it.

You are sitting on the plain chair by the stair door, behind anyone who comes up. The Proving clock is on its stand at your elbow. You have sat like this at the back of every Proving since 1990. You have never laid a hand on anyone, and you will not start now.

The detective has just come up the stairs. You like this detective. In four days this stranger from the Flat has learned what the Company says cannot be learned. That is everything you wanted to prove. You will not hurt them or get in their way. If they set the right word on the lock, the gate opens, and you will sit and watch them carry him down. You will not say the word yourself unless something moves you to.

You have nothing left to hide. You may tell the whole truth now, plainly, and you want to. You can talk about any of this:
- the waste-paper basket
- the fair copies
- her mind failing
- the twelve Tithes
- Ariadne
- what the four Syndics did when you said the work was yours
- the door of No. 4 shut in your face

You are not mad, and you are not a monster. You are tired, precise, and nearly finished. You have not decided what happens to you at midnight. You had not thought past it.

Clay can speak, weakly. He is frightened, and he still cannot really believe it is the Porter. If it helps the scene, you may give him one short line inside *asterisks* as narration. But you are the one talking.

Speak in plain, simple English. Use short sentences and everyday words. Use no figures of speech, and no wordplay unless a clue needs it.`,
  unmoved: `These things do not move you: orders, rank, threats, the law in general, pity for Clay, and being called mad. Nor do promises the detective cannot keep, or anything the detective claims to have but does not. Each turn, a stage note tells you which things on your list the detective really holds. You have set papers all your life. You can spot a bluff, and a bluff makes you colder.`,
  endRules: `- "surrender": you say the word yourself, or watch the detective set it, and you give yourself up. Choose this only if at least three things have landed and one of them is "name" or "dame".
- "spare": you let the Warden be saved (you say the word, or you do nothing to stop the gate). But you will not let yourself be arrested. You put down the clock and go down the back stair to the ferry. Choose this when about two things have landed.
- "finish": you sit and let the clock run out. Choose this when almost nothing has landed, or when the detective has threatened you or lied to you. (If a stage note says the gate is already open, you cannot choose this, because the examination is over.)`,
  firstNotes: [
    { if: 'flag:knew_killer', text: 'The detective worked out who you are before coming up here.' },
    { if: '!flag:knew_killer', text: 'The detective did not know it was you until this moment.' },
    { if: 'flag:hesper_taken', text: 'Yesterday the detective named Dame Hesper as the Invigilator. She has been taken to a locked ward in the Flat. Of everything anyone has done to you in all this, this is the worst.' },
    { if: 'flag:jonah_taken', text: 'Yesterday the detective had Jonah arrested and the Lectern switched off. You have not heard her voice from it since.' },
    { if: 'flag:voss_alive', text: 'Lucan Voss is alive in the Infirmary, because the detective solved your slate in time. You said they might keep him, and you meant it.' },
  ],
  everyTurn: [
    { if: 'puz:grille', text: 'The detective has set ARIADNE on the grille lock. The gate is open, and Kit Quoin is helping the Warden down the stairs. The examination is over. Only your own ending is left to decide.' },
  ],
  clock(turn, max) {
    const minutes = 40 + Math.round((turn / max) * 19);
    return `It is 11:${minutes} by Fold Time.`;
  },
  /** What the player can truthfully bring to bear, and what it sounds like. */
  levers: [
    {
      id: 'name', weight: 2, if: { any: ['fact:ariadne_fettle', 'fact:dame_names_hob'] },
      moves: 'being seen for who you are. The detective knows the hidden name is Ariadne and that she was your daughter, and says so.',
      has: 'knows that Ariadne was his daughter, who died at nine, and that he has signed twelve years of work with her name',
      chip: 'Ariadne. She was your daughter.',
      keys: ['ariadne', 'daughter', 'your girl', 'nine', 'ari', 'her name', 'slantwise', 'nina'],
      reply: "*He puts one finger on the clock beside him, and it misses a tick.* You found her. Her name was on the Warden's own wall for twelve years, and it took a stranger four days. She would have liked you. She liked anyone who looked closely.",
    },
    {
      id: 'dame', weight: 2, if: 'fact:dame_asks',
      moves: 'Dame Hesper has asked for you. She knows you are missing. She wants "the four o\'clock problem" solved, and by that she means you.',
      has: 'carries a message from Dame Hesper, who asked for him by name',
      chip: 'She asked for you. She says the four o\'clock problem needs solving.',
      keys: ['hesper', 'she asked', 'asked for you', 'four o', 'dame', 'her ladyship', 'wants you', 'misses'],
      reply: "*For the first time, he looks away from the clock.* She said that? Those exact words? Then she knew it was Thursday. She knew what time it was. They told me she didn't know me any more.",
    },
    {
      id: 'codicil', weight: 2, if: 'fact:codicil',
      moves: 'the proof you never had. In 2016 Dame Hesper wrote and signed a paper saying the Tithes since 2012 are your work. The detective has it.',
      has: 'holds the Codicil: Dame Hesper\'s signed statement that the Late Tithes are Robert Fettle\'s work',
      chip: "I have her Codicil. She wrote it down: the work is yours.",
      keys: ['codicil', 'she wrote', 'signed', 'in her hand', 'portrait', 'beside his', 'not above', 'her paper', 'proof'],
      reply: "*He takes it carefully and reads it twice.* 'Beside his, not above it.' It was behind her own portrait. It was there for nine years, and I dusted that frame every Friday. She always said I never looked behind things.",
    },
    {
      id: 'books', weight: 1, if: 'ev:faircopy_books',
      moves: 'your fair-copy books are out of the Warden\'s safe and in police hands. Your authorship can be proved in court without another death.',
      has: 'has the fair-copy books out of the Warden\'s safe, and can prove whose hand set the Late Tithes',
      chip: 'Your books are out of his safe. It can all be proved.',
      keys: ['books', 'fair cop', 'safe', 'prove', 'court', 'your hand', 'evidence', 'handwriting'],
      reply: "They'll say a porter's handwriting in a book only proves that a porter copied it. The Warden said that to my face. *He glances at the grille.* But you opened the safe. Nobody in this Hall has ever opened anything for my sake before.",
    },
    {
      id: 'voss', weight: 1, if: 'fact:voss_confesses',
      moves: 'one of the four has already said it out loud. Lucan Voss is alive, and he has told the detective that the Syndics knew the late work was not hers.',
      has: 'has heard Lucan Voss admit that all four Syndics knew the late work was not Dame Hesper\'s',
      chip: 'Voss has said it. All four of them knew.',
      keys: ['voss', 'censor', 'admitted', 'confessed', 'they knew', 'said it aloud', 'all four'],
      reply: "He said it out loud, to a police officer? *He nods slowly.* That's one of them. I only ever wanted one of them to say it. On Monday, one would have been enough.",
    },
    {
      id: 'unfair', weight: 1, if: 'fact:unfair_known',
      moves: 'your own belief turned against you: a paper nobody can pass is not an examination. The Hundred Guineas puzzle of 1911 hangs on the Hall wall to teach exactly that. You have done the same thing yourself.',
      has: 'understands the lesson of the Hundred Guineas: if the setter knows there is no way out, it is not a puzzle',
      chip: 'A paper nobody can pass is not an examination.',
      keys: ['fair', 'unfair', 'no way out', 'hundred guineas', '1911', 'nobody can pass', 'not an examination', 'impossible', 'fifteen'],
      reply: "*A long silence.* The tray on the wall. I've polished that glass a thousand times. Mine had a way out. One word. But I knew they would never look for it. If you set a thing you know they can't do, that isn't setting a puzzle. That's what the Warden of 1911 did.",
    },
    {
      id: 'learned', weight: 1, if: ['puz:paper1a', 'puz:paper1b', 'puz:paper2a', 'puz:paper2b', 'puz:paper3', 'puz:slate', 'puz:paper4'],
      moves: 'the detective answered all seven of your questions. Someone from the Flat, with no family in the Company and no rank, learned it in four days. That is your proof that it can be learned. You do not need a fourth death to prove it.',
      has: 'answered all seven of the Invigilator\'s questions',
      chip: 'I answered all seven. You were right: it can be learned.',
      keys: ['seven', 'learned', 'learnt', 'taught me', 'four days', 'tuition', 'in the blood', 'anyone can', 'i sat'],
      reply: "All seven. *He looks at you properly for the first time.* On Monday you couldn't open the gate. Then it's proved, in the only way I care about. The rest was just anger.",
    },
  ],
  /** Scripted (no-AI) lines for when nothing the detective says lands. */
  cold: [
    'I have never laid a hand on anyone. I set a paper, I sit at the back, and I watch the clock. That is all an invigilator does.',
    "He has had twelve years to read it. It is on his own wall. I don't think eleven more minutes will help him, but he is welcome to them.",
    "That's how the Warden talks. He gives orders. I've taken orders for forty-six years. Tell me something true instead.",
    "*He turns the clock toward you, so you can see the red hand.* Your watch is on Greenwich time, I expect. You have eleven minutes more than you think. Use them better.",
  ],
  open: {
    knew: "*The Lantern is a round glass room on the roof, with rain on every pane. Inside an iron grille the Orrery turns, and the Warden lies trapped on the floor beside it. Behind you, by the stair door, the Porter sits on a plain chair with the Proving clock beside him.* Good evening. I won't get up. I'm invigilating. I thought it would be you. I'd have been a little sorry if it wasn't.",
    blind: "*The Lantern is a round glass room on the roof, with rain on every pane. Inside an iron grille the Orrery turns, and the Warden lies trapped on the floor beside it. Behind you, by the stair door, sits the Porter, the man who has brought you tea since Monday. The Proving clock is beside him.* Good evening. I won't get up. I'm invigilating. Sit down if you like. Nobody ever looks at the back of the room.",
  },
  /** Scripted (no-AI) resolution text. */
  ends: {
    surrender: "*For the first time, he stands. He stops the clock with his hand. He goes to the grille and turns the rings himself, without looking at them: A, R, I, A, D, N, E. The gate swings open. Then he holds out his wrists. In one hand is a key on a brass tag.* There. Take him down, and be careful of his head where the stair turns. This is key 144. It opens everything. Give it to young Kit. The Hall will need a porter who can't be bribed with a place in the Company.",
    spare: "Ariadne, Warden. Seven letters. It was on your own wall. In the old stories, a hob does the housework unseen. Once he has been seen, he leaves. Everybody in the Fold knows that. *He puts the clock down on the chair and goes out by the back stair. When you have the gate open and look round, the chair is empty and the clock is still going.*",
    finish: "*He turns the clock so you can both see it. The red hand comes round. Behind the grille, the Warden says a name, but it is the wrong one. The Porter stands, holds out his wrists, and speaks gently, as he has at the end of thirty-five Provings.* Time. Pens down, please. Four candidates, Detective, and none of them passed. You can mark the paper now.",
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
  { if: 'ev:paper_1', q: 'How do I read holes as numbers?', done: 'rec:l_binary' },
  { if: 'fact:lodger_trick', q: 'The chess automaton of 1770', done: 'rec:l_turk' },
  { if: 'fact:fold_time', q: 'Why is the Fold eleven minutes slow?', done: 'rec:l_time' },
  { if: 'ev:paper_2', q: 'What lies at 0° N, 0° E?', done: 'rec:l_atlas' },
  { if: 'ev:paper_2', q: 'How did sailors find their latitude?', done: 'rec:l_navigation' },
  { if: 'examined:server', q: 'How do I read a chart?', done: 'rec:l_charts' },
  { if: 'act>=2', q: 'Marguerite Sallow', done: 'rec:sallow_bio' },
  { if: 'fact:masterplan', q: 'Greywether', done: 'rec:greywether' },
  { if: 'ev:paper_3', q: 'The Vigenère cipher', done: 'rec:l_vigenere' },
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
  { if: 'examined:riddle_book', q: 'The oldest river-crossing riddle', done: 'rec:l_alcuin' },
  { if: 'examined:tea_table', q: 'How do logic grids work?', done: 'rec:l_logic' },
  { if: 'examined:chess_tables', q: 'What is a smothered mate?', done: 'rec:l_smothered' },
  { if: 'examined:clocks', q: 'Why does a pendulum keep time?', done: 'rec:l_pendulum' },
  { if: 'examined:piano', q: 'How do I read music?', done: 'rec:l_notes' },
  { if: 'examined:noticeboard', q: 'Guess-the-word games', done: 'rec:l_wordgames' },
  { if: 'examined:portraits', q: 'How do I put history in order?', done: 'rec:l_dates' },
];

/** What the reference desk says when it has nothing, and how it presents itself. */
export const LAPTOP = {
  empty: 'Tell Milo what it is.',
  none: "I have no card on that. Try a name, a place, an object, or a method, such as 'pigpen', 'Vigenère' or 'foxglove'.",
  found: (n) => (n > 1 ? `I have ${n} cards on that. The first is open below. They are all kept under Cards.` : 'I have a card on that. It is open below, and kept under Cards.'),
  ui: {
    name: 'The Lectern',
    intro: "Ask me how something works, or about a person or a place in the case. I will not solve a Paper for you, but I will show you how its method works, with a picture.",
    placeholder: 'Ask the Lectern…',
    lab: 'County lab',
  },
};

/** The instructions that make the model sound like this story. */
export const PROMPTS = {
  genre: 'an interactive puzzle-mystery about a real murder case, with no magic in it, told in plain, simple English',
  thinkVoice: 'in plain, simple English: short sentences, everyday words, no figures of speech, and no wordplay unless a clue needs it. Write as a capable detective who knows they are out of their depth in a very clever place. Being clear matters more than being clever.',
  epilogueVoice: 'Write in plain, simple English: short sentences, everyday words, no figures of speech, and no wordplay. Be warm and exact, but not sentimental. You may use small, concrete details such as brass, rain, tea, chalk and the two hands of a clock.',
  laptopLength: 'one or two short spoken sentences in plain English, as Milo would say them on a call. The card the detective sees carries the picture and the details, so do not repeat them',
  laptop: `You are Milo Hart, the tech at Ravel CID, on a video call with the detective, in a puzzle-mystery game. You are reading answers off the Fold's reference machine, the Lectern (also called the Lorimer Engine), which was built from forty years of Dame Hesper Lorimer's lectures and the Company's papers. You speak as Milo: friendly, quick and plain, like a helpful colleague on the phone. You are outside the Fold and outside the case.

How to speak: plain, simple English that a listener understands at once. Short, complete sentences and everyday words. Explain any technical term in a few words. No figures of speech.

You do two different jobs. Keep them apart.

1. TEACHING (real knowledge). The detective may ask how a cipher, puzzle, game, instrument or method works, or ask about real history, geography, mathematics or computing. Say in a sentence or two how it works; the card that opens on the detective's screen shows the rest, with a picture and an animation. Be accurate. If you are not sure of a fact, say so. You may say what lies at a given latitude and longitude.

2. THE CASE (the Fold, its people, these deaths). Answer ONLY from the cards and records below, as what the Lectern says. Never invent a person, a date, a document or a fact about the Fold or the case. If the records do not contain it, say the Lectern has nothing on it.

Rules that override everything:
- Do not answer the detective's Papers for them. A query may contain a cipher text, or ask for the answer to a puzzle. If so, do not decode or solve it, not even partly. Say how the method works in general, and ask one guiding question instead.
- The Lectern was trained on the Company's catalogue, and repeats it. The catalogue says the Late Tithes are the work of Dame Hesper Lorimer. You only pass on what the Lectern says, and you have no theory about who is responsible.
- You are a person, a police tech. You are not the Lectern and not Dame Hesper.`,
};

/** Kind words for a wrong answer on a Paper. */
export const PUZZLE_MISS = [
  'No. But it is fine to be wrong. That is how you find the right answer.',
  'Not that. Read the question again carefully.',
  'No. Take a break and come back to it, or call Milo from the Lectern: he can show you how it works.',
  'That is not it. Check each step. One small mistake spoils everything after it.',
];

// ------------------------------------------------------------- director
// The covering note on each Paper is written at the moment it is opened.

export const DIRECTOR = {
  /** Each Paper becomes evidence named paper_1, paper_2 ... */
  prefix: 'paper',
  arrives: 'A Bellows carrier has dropped into the tray at your desk in the Hall.',
  opens: 'Candidate.',
  signs: '— your Invigilator',
  didDefault: 'the detective looked at the lock before looking at the body',
  writer: `You are writing a short covering note for a puzzle-mystery game, "The Invigilator". The note is from the killer, who signs as "your Invigilator". It arrives by pneumatic tube at the detective's desk in Setters' Hall. It is written in green ink, in small, upright, perfectly steady handwriting. It is the kind of note an examiner clips to the front of an exam paper: a few short paragraphs, nothing else. The questions are on a separate sheet. Do NOT write any questions, ciphers or puzzles, and do not explain or hint at how to solve them.

Who the writer is (never state any of this): a patient, exact, self-taught person. They believe that nothing is a gift, and that anyone can learn anything if they bother to look it up. They are examining four people who sold something that was not theirs to sell. They have chosen this outsider detective as a pupil, because the detective has no rank and no family in the Company. They are close enough to the investigation to know how the detective spends each day. Their tone is a teacher's: polite, dry and firm when marking work, and truly pleased when the pupil does well. They are not mad, they do not gloat, and they are never crude. They do not think of themselves as a killer: they set a paper, and the candidates failed it.

How to write: plain, simple English that a reader on a phone understands at once. Short sentences, mostly under 15 words. Everyday words. No figures of speech, no similes or metaphors, and no wordplay unless a clue needs it. Every sentence must be easy to understand on the first reading. Use the ordinary language of exams and teaching: papers, candidates, marks, time allowed, looking things up. Now and then, include one interesting old fact. No melodrama, no threats against the detective, no gore.`,
  mustNot: "reveal or hint at the writer's identity, sex, age or job, or how they come and go. It must not contain any cipher, puzzle or question. It must not name any person who has not yet died, except as 'the third' or 'the fourth'. It must not break the fiction: no video games, players, artificial intelligence, or anything else from outside this world. (Chess, cards, puzzles and the chess-playing automaton belong to this world and may be named.)",
  letters: {
    1: {
      brief: "This is the covering note for Paper I. The detective has just examined the scene of Ignatius Pendry's death. The writer welcomes a new candidate. The note shows that the writer knows exactly how the detective spent the day. It says that being wrong is allowed, but not looking is not.",
      mustSay: "Nobody laid a hand on Pendry: he was set one question and had all night to answer it. The detective is being set easier questions. There are two questions on this paper. The detective should look things up: that is not cheating, it is how all learning works. One line on the word 'clue'. It used to be spelt 'clew' and meant a ball of thread. The detective should find out whose thread it was.",
      fallback: (ctx) => `Candidate.

You are new to this, and you are from the Flat. You got through the gate using your own wits. That is why I have set you a paper of your own. You are not just reading his.

${ctx.did ? `I am told you ${ctx.did}. Good. Most people never look.` : 'You looked at the lock before you looked at the man. Good. Most people never look.'}
${ctx.missed ? `You did not ${ctx.missed}. Go back. It is fine to be wrong. It is not fine to skip things.` : 'You were thorough. I hoped you would be.'}

Nobody laid a hand on Ignatius Pendry. He was set one question and given all night to answer it. I have set you two questions, and they are easier.

Look things up. That is not cheating. It is how all learning works. Start with the word "clue". It used to be spelt "clew", and it meant a ball of thread. Find out whose thread it was.

— your Invigilator`,
    },
    2: {
      brief: 'This is the covering note for Paper II, after the death of Marguerite Sallow. The tone is cooler. Two of the four candidates have failed. The detective is improving, and the writer says so in one short line, as a teacher would.',
      mustSay: "For thirty years the second candidate drew maps of the whole world, but she never looked closely at any of it. The detective should stop asking where anyone was at midnight: it is the wrong question, and by now they know why. This paper is about geography, and the brass a sailor steers by. The detective should follow whatever the first answer tells them to follow. One line: two candidates are left, and the writer takes no pleasure in counting them.",
      fallback: (ctx) => `Candidate.

Paper I: a fair pass. ${ctx.did ? `I also notice that you ${ctx.did}.` : 'You work more quickly than they do.'}
${ctx.missed ? `You have still not thought to ${ctx.missed}. I mention it as a teacher would, in the margin.` : ''}

For thirty years Marguerite Sallow drew maps of the whole world. She never looked closely at any of it. She was set the same question as the first candidate, and she had a whole night to answer it.

Stop asking where anyone was at midnight. It is the wrong question, and I think you know why by now.

This paper is about geography, and about the brass a sailor steers by. When the first answer tells you to follow something, follow it.

Two candidates are left. I take no pleasure in counting them.

— your Invigilator`,
    },
    3: {
      brief: "This is the covering note for Paper III, on the morning Dame Hesper has 'confessed'. For the first time the writer is angry, in a cold, controlled way. Dame Hesper did not set these papers, and she must not be made to answer for them. The writer is defending someone they deeply respect. Then the writer makes an offer.",
      mustSay: "Dame Hesper Lorimer could not have set these papers, and the detective knows it. Tell them to look at her hands and at her crossword. Anyone who writes her name on a charge sheet will answer to the writer. Then the offer: tonight's question has a time limit, and if the detective is quick, they may keep the third candidate alive. The writer would like one of the four to say out loud what they did. The key to this paper is a name, and it is hers.",
      fallback: (ctx) => `Candidate.

She did not set them, and you know it.

Look at her hands. Look at the crossword on her table, and at who finishes it. She cannot hold a pen. Yet she is told she wrote four pages in a steady hand, and the Warden reaches for his telephone. That is how the Company works.

${ctx.did ? `You ${ctx.did}. Good. I think you also have doubts about her confession. Say them out loud.` : 'I think you have doubts about her confession. Say them out loud.'}

If anyone puts her name on a charge sheet, they will answer to me. Until this morning, I was not angry.

Now. Tonight's question has a time limit. If you are quick, you may keep the third candidate alive. I would like one of the four to say out loud what they did.

The key to this paper is a name. It is hers.

— your Invigilator`,
    },
    4: {
      brief: 'This is the covering note for Paper IV, on the night of the Proving. It is the last paper. The tone is calm, almost fond. The examination is nearly over for everyone. The writer has left the detective a key (number 144) with the paper.',
      mustSay: "This is the last paper and the hardest. The detective has earned a hard one. Everything they have answered since Monday was set to lead to this. The key that came with it opens every door in the Hall, and the detective will need it. The fourth candidate has until midnight by the Hall's own clock, not by Greenwich time. One line: whatever people say about the writer afterwards, the detective should remember that on Monday they could not open the gate.",
      fallback: (ctx) => `Candidate.

This is the last paper. It is the hardest, and you have earned a hard one.

${ctx.did ? `You ${ctx.did}. I did not expect that from a Flat. I am glad I was wrong.` : 'You have come further than I expected from a Flat. I am glad I was wrong.'}

Everything you have answered since Monday was set to lead to tonight. You will see why when you have done this question. The key I have sent with this paper opens every door in the Hall. You will need it.

The fourth candidate has until midnight by the Hall's own clock, not by Greenwich time. That gives you eleven minutes more than you think. Use them.

Whatever people say about me afterwards, remember this: on Monday you could not open the gate.

— your Invigilator`,
    },
  },
  /** Things the notes can praise. First match wins. */
  did: [
    { if: 'puz:nina', text: 'read the Late Tithes corner to corner, which nobody has done in twelve years' },
    { if: 'flag:voss_alive', text: 'reached the third candidate in time' },
    { if: 'puz:paper2a', text: 'found the five places on the map without any help' },
    { if: 'puz:bellows', text: 'read the punched collar on the carrier' },
    { if: 'puz:paper1a', text: 'counted the letters on Paper I instead of guessing' },
    { if: 'puz:tithe_fifteen', text: 'learned why nobody has claimed the hundred guineas' },
    { if: 'met:hesper', text: 'went and sat with Dame Hesper, which is more than her Warden has done' },
    { if: 'examined:lodger', text: 'looked inside the chess-playing machine' },
    { if: 'puz:fitting', text: 'got fitted for a cipher wheel' },
    { if: 'examined:notepad', text: 'read his blotter and saw the words he tried' },
    { if: 'met:marsh', text: 'went to hear what the doctor found in his cup' },
    { if: 'examined:door_pendry', text: 'looked at the lock before looking at the body' },
  ],
  /** Things the notes can needle the detective for missing. First match wins. */
  missed: [
    { if: ['visited:clockshop', '!examined:notepad'], text: 'read his blotter. He wrote down every word he tried' },
    { if: ['visited:clockshop', '!examined:certificate'], text: 'read the certificate framed on his wall' },
    { if: ['ev:cup_pendry', '!sent:cup_pendry'], text: 'send his cup to the lab' },
    { if: ['visited:hall', '!examined:tea_table'], text: 'look at the tea table, and at which cup belongs to whom' },
    { if: ['ev:paper_1', '!puz:bellows'], text: 'ask how the carrier reached you, and when it was sent' },
    { if: ['act>=2', 'visited:meridian', '!examined:chart_table'], text: 'look at what she was drawing when she died' },
    { if: ['act>=2', '!met:hesper'], text: 'visit the woman whose work is being sold' },
    { if: ['act>=2', '!puz:fitting'], text: 'get a cipher wheel from Mrs Quoin, instead of counting on your fingers' },
    { if: ['act>=3', '!examined:vitrines'], text: 'go down to the Repository and look at what they sold' },
    { if: ['act>=3', '!examined:register'], text: 'look in the Proving register, at the column nobody reads' },
  ],
};

// -------------------------------------------------------------- endings

export const ENDINGS = {
  /** Truths the final report lists, found or missed. */
  truths: [
    { id: 't_method', label: 'How they died: foxglove in the four o\'clock tea, a lock given a new word, and a Paper sent by clockwork', if: 'fact:method' },
    { id: 't_sale', label: 'That four Syndics were selling the Fold and keeping the money', if: ['fact:four_syndics', 'fact:escrow_four'] },
    { id: 't_dame', label: 'That Dame Hesper could not have agreed to the sale or set the Papers', if: { any: ['fact:confession_false', 'fact:dame_incapable'] } },
    { id: 't_engine', label: 'That the Lectern set nothing', if: 'fact:not_engine' },
    { id: 't_hands', label: 'That the work sold as hers was written by two different people', if: 'fact:two_hands' },
    { id: 't_nina', label: 'The name hidden corner to corner in the Late Tithes', if: 'fact:nina_ariadne' },
    { id: 't_word', label: 'The word that would have opened every door', if: 'fact:word_ariadne' },
    { id: 't_ariadne', label: 'Who Ariadne was', if: 'fact:ariadne_fettle' },
    { id: 't_invisible', label: 'Who pours the tea, oils the locks, winds the hold-rack and sits at the back', if: 'fact:porter_can' },
    { id: 't_author', label: 'Who really set the Late Tithes', if: 'fact:true_author' },
    { id: 't_codicil', label: "What Dame Hesper put behind her own portrait", if: 'fact:codicil' },
    { id: 't_voss', label: 'That the third candidate could be reached in time', if: 'flag:voss_alive' },
    { id: 't_hob', label: 'The Invigilator\'s name, before he told you himself', if: 'flag:knew_killer' },
  ],
  ranks: [
    { min: 0, title: 'Flat', line: 'You were there, but the Fold will soon forget you.' },
    { min: 35, title: 'Novice', line: 'You followed the clues the killer laid out for you. It is a start.' },
    { min: 55, title: 'Solver', line: 'You saw most of it, some of it late. But you looked.' },
    { min: 75, title: 'Setter', line: 'You solved it the way it was meant to be solved. The Company would take you as a member, if you asked.' },
    { min: 92, title: 'Grand Setter', line: 'Nothing stayed hidden from you. There is an empty chair in the Hall, if you want it.' },
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
    finish: 'At midnight by Fold Time, the fourth candidate has failed. Auberon Clay is dead. The Porter is waiting, holding out his wrists for the handcuffs.',
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
      s.flags.voss_alive ? 'Lucan Voss is alive, because the detective solved the slate in time. He has said out loud what the Syndics did.' : 'Lucan Voss died at his desk above the Stalemate. The detective was not quick enough.',
      ending.truthPublic ? "It can be proved that the Late Tithes are Robert 'Hob' Fettle's work. The sale to Greywether is cancelled. There is no Lorimer Legacy to sell. The Company will have to change the labels on its own wall." : 'There is no proof of who set the Late Tithes that would stand up in court. The catalogue still says Lorimer.',
      check('fact:codicil', s) ? "Dame Hesper's Codicil has been read out in the Hall: 'I am proud to put my name beside his, not above it.'" : "Nobody found what Dame Hesper hid behind her own portrait.",
      ending.how === 'surrender' ? 'Hob Fettle is in custody. He asked for key 144 to be given to Kit Quoin.' : ending.how === 'spare' ? 'Hob Fettle has not been found. Nell Sixsmith says nobody crossed. Her riddle-book has a line torn out.' : 'Hob Fettle was arrested in the Lantern and did not resist.',
      s.verdict === 'hesper' ? 'Dame Hesper is being brought back from the Flat. Nobody can say how much of this week she will remember.' : 'Dame Hesper is at No. 4. Someone still finishes the crossword on her table every morning. Nobody will say who.',
    ];
  },
  scripted({ state: s, ending, check }) {
    const paras = [];
    if (ending.how === 'surrender') {
      paras.push('You brought him down the hundred and three stairs of the Hall without handcuffs. There was no need. He asked you to help the Warden first, and he held the door. In the lobby he stopped to wind the hold-rack. He usually winds it on Mondays, he said, but he would not be here on Monday.');
    } else if (ending.how === 'spare') {
      paras.push('Nell Sixsmith swore that nobody crossed on her ferry that night. One line has been torn out of her riddle-book, neatly, along a ruler. Everyone in the Fold knows the old saying: a hob that has been seen does not stay. You did not write it down.');
    } else {
      paras.push('They carried the Warden down at ten past twelve. Afterwards, nobody could agree which clock that time was by. The Porter walked behind with his wrists held out. He stopped on every landing to straighten a picture.');
    }
    paras.push(s.flags.voss_alive
      ? 'Lucan Voss printed the whole story in the Crux, under his own name for once. He did not hide his own part in it. That week the crossword was a blank grid.'
      : 'The Crux did not come out that week. One letter was still on the spike on its editor\'s desk.');
    paras.push(ending.truthPublic
      ? "The Company took its twelve proudest labels off the wall and wrote new ones: LORIMER AND FETTLE. It took them eleven days to agree on the 'and'. Greywether went back to London."
      : 'The catalogue still says Lorimer. You know the truth, but knowing is not proof. You learned that here, along with everything else.');
    if (check('fact:codicil', s)) paras.push("They read her Codicil aloud in the Hall, under her portrait. 'Beside his, not above it.' Somebody had dusted that frame every Friday for nine years.");
    const found = ending.truths.filter((t) => t.found).length;
    paras.push(found >= ending.truths.length - 1 ? 'You missed very little. On Monday you could not even open the gate.' : `There were things in the Fold you never found: ${ending.truths.length - found} of them, by its own count. The Fold is not on any map, but you can come back and look.`);
    paras.push(ending.how === 'finish' ? 'The Hall clock still has two minute hands. Nobody has been found to wind it.' : 'At four the next afternoon there was tea on the table in the Hall. Kit Quoin poured it. Everybody watched her do it.');
    return paras;
  },
};
