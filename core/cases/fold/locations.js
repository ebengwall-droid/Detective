// Places in the Fold, and what can be examined in them.
//
// A hotspot is attached to a prop in scenes.js (`at`) or to a point (`p`,
// `size`). `views` are tried in order and the first whose `if` holds is used,
// so the same object can read differently as the case moves on. Each view
// pays out its facts / evidence / effects once.
//
// kind: look | take | use | exit   (drives the icon and the verb on screen)
// action: 'laptop' | 'board' | 'puzzle:<id>' | { travel: '<location>' }

export const LOCATIONS = {
  // ------------------------------------------------------------ gatehouse
  gatehouse: {
    name: 'The Turnstile',
    sub: 'Turnagain Lane',
    map: [50, 9],
    start: true,
    arrive: 'Turnagain Lane ends in a stone gatehouse the size of a bus shelter. Your telephone has lost its signal and found the wrong street.',
    hotspots: [
      {
        id: 'turnstile', at: 'turnstile', label: 'The Turnstile', kind: 'use', action: 'puzzle:gate',
        views: [
          { if: 'puz:gate', text: 'C-A-T-C-H, until midnight. Tomorrow it will want something else.' },
          { text: 'An iron turnstile worn silver where six hundred years of hands have pushed it, and on the post a brass lock of five lettered rings. It does not turn. Kit is very carefully not helping.' },
        ],
      },
      {
        id: 'slate', at: 'slate', label: 'Chalk slate', kind: 'look',
        views: [{ text: "A child's school slate on a nail, with five capitals in this morning's chalk: FDWFK. Underneath, smaller, in another hand: 'yesterday's was better'." }],
      },
      {
        id: 'stone', at: 'stone', label: 'Carved stone', kind: 'look',
        views: [{ text: 'Cut into the wall above the gate, in letters two centuries old and re-cut at least once: THREE BACK, AS CAESAR WROTE. Someone has scratched beneath it, with a key: every. single. day.' }],
      },
      {
        id: 'notice', at: 'notice', label: 'Painted board', kind: 'look',
        views: [{
          text: "THE FOLD. NO MAPS SOLD HERE. MIND THE TIME.\n\n'Every map of Ravel since 1741 has been drawn in there,' says Kit, nodding through the bars, 'and every one of them puts us in the fold of the page. You can't find the Fold on paper. You have to be told, or work it out. And we're eleven minutes behind you. You'll see.'",
          facts: ['fold_hidden'],
        }],
      },
    ],
  },

  // ----------------------------------------------------------------- hall
  hall: {
    name: "Setters' Hall",
    sub: 'Proving Square',
    map: [50, 36],
    arrive: "Setters' Hall. Oak, brass, forty Wardens in oils, and a smell of beeswax and very good tea. A desk has been found for the police, in the way a chair is found for an unexpected aunt.",
    hotspots: [
      {
        id: 'laptop', at: 'laptop', label: 'The Lectern (your terminal)', kind: 'use', action: 'laptop',
        views: [{ text: 'A terminal to the Lectern, the machine under the Hall. It will tell you how anything is done. It will not do it for you. The lab queue is here too.' }],
      },
      {
        id: 'board', at: 'board', label: 'Case board', kind: 'use', action: 'board',
        views: [{ text: 'The case board. Everything you know, and the holes between.' }],
      },
      {
        id: 'tube', at: 'tube', label: 'Bellows tube', kind: 'look',
        views: [
          { if: 'flag:letter_waiting', text: "A soft thump, and a brass carrier is lying in the tray that was empty a moment ago. Leather cap, green wax. Nobody in the Hall has looked up.", effects: [{ call: 'takeLetter' }], repeat: true },
          { text: 'The Bellows outlet at your desk: a brass mouth with a hinged flap, and a tray for whatever it coughs up. It breathes very slightly, in and out, like something asleep.' },
        ],
      },
      {
        id: 'my_desk', at: 'my_desk', label: 'Your desk', kind: 'look',
        views: [{ text: "The Scrutineers' desk, lent to the police 'for the duration'. Somebody has put out a blotter, a pen, a clean cup and saucer, and a small card: MIND THE TIME. You did not see anybody do it." }],
      },
      {
        id: 'lodge', at: 'lodge', label: "The Porter's Lodge", kind: 'look',
        views: [
          {
            if: { any: ['fact:pendry_paper', 'fact:locked_inside'] },
            text: "The Lodge: a counter, a kettle, a stool nobody has ever seen sat on, and the Porter's daybook open at the week.\n\n'Sat. Letter-locks, annual oil and re-pin before the Proving: 4 Nonesuch Row (Mr Pendry); the Meridian (Mrs Sallow); the Crux (Mr Voss); Warden's Parlour; the Lantern grille.\nSun. Wound the sixty-one.\nMon. Hold-rack wound. Syndics' tea at four. Mr Pendry not down to breakfast Tues.'\n\nSmall, upright ink. Not a blot in forty-six years of it.",
            facts: ['locks_oiled'],
          },
          { text: "The Lodge: a counter, a kettle, a stool nobody has ever seen sat on, and a daybook in small upright ink. Deliveries, visitors, clocks wound. It is the tidiest thing you have seen in your life." },
        ],
      },
      {
        id: 'keyboard', at: 'keyboard', label: 'Key board', kind: 'look',
        views: [{
          text: "A hundred and forty-four hooks in twelve rows of twelve, a brass tally on each. The top hook, number 144, is empty: 'the master; it lives in the Porter's pocket, in case of fire.'\n\nAlong the bottom row hang seven thin steel pins like knitting needles, one for each private lock. 'Setting-pins,' says Kit. 'Push it through the back of a letter-lock and you can give the lock a new word. Takes a minute.' They hang on open hooks, a yard from the tea table.",
          facts: ['pins_open'],
        }],
      },
      {
        id: 'tea_table', at: 'tea_table', label: 'The tea table', kind: 'look',
        views: [{
          text: "The Syndics' tea, laid at four every day since before anyone can say. Dame Hesper called it the four o'clock problem. Four cups and no two alike: one with a clock face painted in the bottom, one with a compass rose, one with an empty crossword grid, one with the Company's arms. Nobody could mistake whose is whose.\n\nTwo of them are turned over on their saucers.",
          facts: ['own_cups'],
        }],
      },
      {
        id: 'hall_clock', at: 'hall_clock', label: 'The Hall clock', kind: 'look',
        views: [{
          text: "The Hall clock has two minute hands. The black one is Fold Time. The red one, eleven minutes ahead of it, is for strangers: Greenwich.\n\n'Before the railways every town kept its own noon,' says Kit. 'Bristol was ten minutes behind London. Then the timetables came and everybody gave in. We didn't. We're eleven minutes west of Greenwich by the sun and we see no reason to pretend otherwise.'",
          facts: ['fold_time'],
        }],
      },
      {
        id: 'back_chair', at: 'back_chair', label: 'The chair at the back', kind: 'look',
        views: [{
          text: "One plain high-backed chair, by itself against the wall under the clock.\n\n'That's for the Proving,' says Kit. 'Candidates sit facing the other way. Whoever's in that chair has the clock and says nothing for three hours. You don't look round at them. That's the whole point of them.'\n\n'What are they called?'\n\nShe looks at you oddly. 'The invigilator. What do they call it in the Flat?'",
          facts: ['invigilator_chair'],
        }],
      },
      {
        id: 'register', at: 'register', label: 'The Proving register', kind: 'look',
        views: [
          {
            if: { any: ['act>=3', 'fact:invigilator_chair'] },
            text: "The Proving register: candidates, marks, examiners' signatures. The last column is headed INVIG. and is nothing but ditto marks all the way up the page, and the page before, and the page before that.\n\nYou turn back thirty-five years to find out what they are dittos of.\n\n1990. INVIG.: R. Fettle (Porter).",
            facts: ['hob_invigilates'],
          },
          { text: "The Proving register, open on its stand at this Thursday's blank page. Candidates, marks, examiners. Nine names are entered for the week. The Company takes this very seriously indeed." },
        ],
      },
      {
        id: 'exchange', at: 'exchange', label: 'The Bellows exchange', kind: 'use', action: 'puzzle:bellows',
        views: [
          { if: 'puz:bellows', text: "HELD SINCE NOON. Anyone can put a carrier in the rack; the dial does the rest. A small brass plate on the clockwork reads: WOUND MONDAYS. R.F.", facts: ['rack_wound'] },
          {
            if: 'ev:paper_1',
            text: "The exchange: a brass manifold where every tube in the Fold begins and ends. Beside it is the hold-rack, a row of cradles each with a small dial. Put a carrier in a cradle, set the dial, and clockwork sends it on its way at the hour you chose.\n\nThe carrier that brought your Paper is still in the returns tray. Its collar is punched with pairs of numbers.\n\nA small brass plate on the clockwork reads: WOUND MONDAYS. R.F.",
            facts: ['rack_wound'],
          },
          { text: "The exchange: a brass manifold where every tube in the Fold begins and ends, sighing gently. Beside it a rack of cradles with little dials, like egg-timers. A carrier goes past inside the wall with a noise like a cat on a staircase." },
        ],
      },
      {
        id: 'tithe_wall', at: 'tithe_wall', label: 'The Wall of Tithes', kind: 'look',
        views: [{
          text: "Every member owes the Company one new puzzle a year, and here they are: four hundred sheets pinned edge to edge from the floor to higher than you can read. Mazes, ciphers, chess problems, a knitting pattern that is apparently a joke. At the very top, behind glass, a tray of numbered tiles.\n\nThree have been here so long that nobody has had the heart to take them down. You may as well.",
          facts: ['tithe_custom'],
        }],
      },
      {
        id: 'portrait_hesper', at: 'portrait_hesper', label: 'Portrait of Dame Hesper', kind: 'look',
        views: [
          { if: 'ev:codicil', text: 'You have hung her straight again. She is still looking just past your shoulder.' },
          {
            if: 'puz:cryptic',
            text: "Left, characteristic, likeness. It is behind her.\n\nYou lift the frame an inch from the wall. Tucked between the canvas and the stretcher, where forty years of dusters have never been, is a folded sheet of the Company's own paper, sealed with a wafer and addressed in a hand that wavers: 'To whoever looks.'",
            ev: ['codicil'],
          },
          {
            text: "DAME HESPER LORIMER ('VESPER'). Warden 1994 to 2011. Painted in 2009.\n\nA lean woman of sixty in a dark red jacket, with a pencil behind her ear that the painter has plainly been told to leave in. She is looking at something just past your shoulder with the expression of somebody who has seen the answer and is waiting to find out whether you will.",
            facts: ['vesper_name'],
          },
        ],
      },
      {
        id: 'portraits', at: 'portraits', label: 'The Wardens', kind: 'look',
        views: [{ text: "Forty Wardens in a row, back to a man in a ruff holding what is either a cipher disc or a pie. The newest frame holds a photograph and a card: 'A. Clay, Warden. Portrait in hand.' Under every one is a pen-name as well as a name. Setters publish under a pen-name; it is thought vulgar to sign your own." }],
      },
      {
        id: 'clay_desk', at: 'clay_desk', label: "The Warden's desk", kind: 'look',
        views: [{
          text: "The Warden's Parlour. A desk the size of a billiard table with almost nothing on it: a telephone, a silver pen, and under a glass paperweight one sheet headed GREYWETHER PLC: HEADS OF TERMS. 'The Lorimer Legacy, together with the freehold of Setters' Hall and the properties scheduled.' Completion: 31 October.\n\nThere is not a puzzle in the room.",
          facts: ['completion_31'],
        }],
      },
      {
        id: 'clay_safe', at: 'clay_safe', label: "The Warden's safe", kind: 'look',
        views: [
          { if: 'ev:faircopy_books', text: 'Open, and lighter by twelve ledgers. The Warden has not yet noticed. The Porter has gone back to his brass.' },
          { if: { any: ['fact:spiked_letter', 'fact:two_hands', 'fact:voss_confesses'] }, text: "A Company safe, with a seven-ring letter-lock and a keyhole below it. The word is the Warden's. The keyhole is cut for number 144.\n\nNumber 144 lives in the Porter's pocket." },
          { text: "A Company safe, squat and green, with a seven-ring letter-lock and a keyhole below it. It is the only thing in the Warden's Parlour that looks as if it works for a living." },
        ],
      },
      {
        id: 'strongbox', at: 'strongbox', label: 'Evidence chest', kind: 'use', action: 'puzzle:lock',
        views: [
          { if: 'puz:lock', text: "Pendry's lock, open. A, R, I, A, D, N, E. It has been oiled recently, and well.", ev: ['lock_pendry'] },
          { if: 'examined:door_pendry', text: "The iron-bound chest the Company has lent for evidence. In it, tagged, the letter-lock unscrewed from Ignatius Pendry's door. Seven brass rings, still standing at his own word. It has been oiled recently, and well.", ev: ['lock_pendry'] },
          { text: 'An iron-bound chest lent by the Company for evidence. Empty, and smelling of camphor.' },
        ],
      },
    ],
  },

  // ------------------------------------------------------------ clockshop
  clockshop: {
    name: 'Pendry & Sons',
    sub: 'Horologists · 4 Nonesuch Row',
    map: [30, 30],
    arrive: "Nonesuch Row, number four. PENDRY & SONS, HOROLOGISTS, and no sons. Forty-one clocks tick at you, not quite together, like a room of people trying not to cough.",
    hotspots: [
      {
        id: 'bench', at: 'bench', label: "Pendry's bench", kind: 'look',
        views: [{
          text: "He was here, head down on his folded arms, as if a clock had bored him to sleep. No wound. No overturned stool. The tools are in their racks by size. Whatever happened in this room happened quietly and took hours.",
          facts: ['pendry_bench'],
        }],
      },
      {
        id: 'door_pendry', at: 'door_pendry', label: 'The door and its lock', kind: 'look',
        views: [{
          text: "Oak, iron-strapped. The constables took it off its hinges with Wilf watching. On the inside is a Company letter-lock: seven brass rings, standing at P-E-N-D-R-Y-S. His own word.\n\nHe has locked himself in to work every night for thirty years. Last night his own word did not let him out.\n\nThe lock has gone to the evidence chest at the Hall.",
          facts: ['locked_inside'],
        }],
      },
      {
        id: 'window_bars', at: 'window_bars', label: 'Window bars', kind: 'look',
        views: [{ text: 'Bars, like every shop in Nonesuch Row that keeps brass, and painted shut besides. Rain on the far side. Nobody came or went this way.', facts: ['no_entry'] }],
      },
      {
        id: 'cup_pendry', at: 'cup_pendry', label: 'Tea tray', kind: 'take',
        views: [{
          text: "A Hall tea tray: pot, strainer, and one cup with a brown half-inch left in it. There is a clock face painted in the bottom of the cup. The Syndics take tea at the Hall at four; Wilf says the master always carried his last cup back to the bench with him.",
          ev: ['cup_pendry'],
        }],
      },
      {
        id: 'tube_pendry', at: 'tube_pendry', label: 'Bellows tube', kind: 'take',
        views: [{
          text: "The Bellows outlet by the bench. Its flap is open and a carrier lies in the tray with the cap off. The sheet that came out of it is on the bench under his hand: one page, green ink, set out like an examination paper.",
          ev: ['paper_pendry'],
        }],
      },
      {
        id: 'notepad', at: 'notepad', label: 'His blotter', kind: 'look',
        views: [{
          text: "A column of seven-letter words in a watchmaker's tiny capitals, each one struck through.\n\nPENDRYS. HOROLOG. HESPERL. LORIMER. VESPERS. LORIMER again, pressed so hard that the nib went through the paper.\n\nBeside them, tally marks in fives. He counted his tries. He stopped counting at a hundred and ninety.",
          facts: ['pendry_tries'],
        }],
      },
      {
        id: 'clocks', at: 'clocks', label: 'The wall of clocks', kind: 'look',
        views: [{
          text: "Forty-one clocks and every one of them right, by the Fold's reckoning. Each face has a second minute hand, painted red, eleven minutes ahead of the black: Greenwich, for strangers.\n\nSo when the Fold says four o'clock, your watch says eleven minutes past.",
          facts: ['fold_time'],
        }],
      },
      {
        id: 'lodger', at: 'lodger', label: 'The chess-player', kind: 'look',
        views: [{
          text: "Pendry's pride: a life-size figure in a robe, seated behind a cabinet with a chessboard let into the top. He built it from the plans of a machine first shown in Vienna in 1770, which toured Europe for eighty years and beat Napoleon.\n\nOne cabinet door is ajar. Behind a great show of cogwheels there is a sliding seat, a candle-shelf, and just enough room.\n\n'The original never had a mind,' says Wilf. 'It had a man folded up inside it. We call ours the Lodger.'",
          facts: ['lodger_trick'],
        }],
      },
      {
        id: 'certificate', at: 'certificate', label: 'Framed certificate', kind: 'look',
        views: [{
          text: "CERTIFICATE OF PROVENANCE\nTHE LORIMER LEGACY\n\n'I, Ignatius Pendry, Grand Setter and Syndic, having examined the manuscripts, working papers and fair copies of Dame Hesper Lorimer for the years 1972 to 2023, do certify the whole to be her sole and original work. The fair copies of the later years are in a copyist's hand and are of no consequence.'\n\nPrepared for Greywether plc. Fee: forty thousand pounds.\n\nHe had it framed.",
          facts: ['certificate_sole'],
        }],
      },
      {
        id: 'ledger_pendry', at: 'ledger_pendry', label: 'Shop ledger', kind: 'look',
        views: [{
          text: "Pendry & Sons has not sold a clock since August. The last entry is in pencil, as if he did not quite like to ink it:\n\n'Greywether. On completion 31 Oct. My quarter: £2,750,000.'\n\nHis quarter. Not the Company's.",
          facts: ['pendry_quarter'],
        }],
      },
      {
        id: 'stove_pendry', at: 'stove_pendry', label: 'Stove', kind: 'look',
        views: [{ text: 'Laid, and never lit. He meant to work late and found, somewhere about eight, that he had other things to think about.' }],
      },
    ],
  },

  // ------------------------------------------------------------ wheelshop
  wheelshop: {
    name: 'Quoin & Daughter',
    sub: 'Wheelwrights · 5 Nonesuch Row',
    map: [24, 41],
    arrive: "QUOIN & DAUGHTER, WHEELWRIGHTS. Not a cartwheel in the place. The walls are hung with brass and boxwood discs the size of saucers, each ringed with two alphabets, and all of them very slightly turning in the draught.",
    hotspots: [
      {
        id: 'fitting', at: 'fitting', label: 'The fitting bench', kind: 'use', action: 'puzzle:fitting',
        views: [
          { if: 'puz:fitting', text: "The baize is brushed and the tray is back in its drawer. Your wheel is in your pocket, heavier than it looks." },
          { text: "A counter covered in green baize, and on it a velvet tray of cipher wheels: two rings of letters, one turning inside the other. Every child in the Fold is fitted for one at seven. You are rather older, and Mrs Quoin has said so." },
        ],
      },
      {
        id: 'wheels', at: 'wheels', label: 'Racks of wheels', kind: 'look',
        views: [{ text: "Boxwood, bone and brass. Some have a third ring, some have numbers, one has the Greek alphabet and a price that makes you put it back. A card: 'A wheel does not make you clever. It makes you quick. The clever is your own lookout. T.Q.'" }],
      },
      {
        id: 'quoin_ledger', at: 'quoin_ledger', label: 'Fitting ledger', kind: 'look',
        views: [
          {
            if: { any: ['fact:nina_ariadne', 'fact:word_ariadne', 'fact:epigraph_ariadne'] },
            text: "Every fitting since 1961, by date, with the child's name, age, and the wheel they were given. You go looking for an A.\n\n'1996. Ariadne Fettle, 7. Boxwood. Quickest I ever timed. No charge; I told her father so and he paid anyway.'\n\nFettle.",
            facts: ['ariadne_fettle'],
          },
          { text: "A fat ledger: every fitting since 1961, with the child's name, their age, and the wheel they were given. Boxwood, boxwood, bone, boxwood. Brass is rare. The last brass before yours was nine years ago." },
        ],
      },
      {
        id: 'wall_party', at: 'wall_party', label: 'The party wall', kind: 'look',
        views: [{
          text: "The wall she shares with Pendry's workshop: a foot of old brick and a shelf of varnish tins. If a man were hammering on a door on the other side of it you would hear it here as a sort of slow knocking. You might easily take it for a clock.",
          facts: ['banging'],
        }],
      },
      {
        id: 'kit_photo', at: 'kit_photo', label: 'Photograph', kind: 'look',
        views: [{ text: "A woman of about thirty laughing at whoever held the camera, with a small furious child on her hip. On the mount: 'Morwenna and Kit.' The '& Daughter' on the shop front was Morwenna. She came from the Flat, and the Company never let anyone forget it." }],
      },
    ],
  },

  // ------------------------------------------------------------- mortuary
  mortuary: {
    name: 'County Mortuary',
    sub: 'Ravel Infirmary · the Flat',
    map: [90, 15],
    arrive: 'The County Mortuary, in the Flat, where the clocks agree with your watch and the mobile signal comes back with fourteen messages. Tiles, steel, formalin, and the only strip lighting you have seen all day.',
    hotspots: [
      {
        id: 'slab', at: 'slab', label: 'Examination table', kind: 'look',
        views: [
          { if: 'act>=2', text: 'A different sheet, a different shape under it. Dr Marsh has put the two charts side by side and drawn one bracket round both.' },
          { text: 'Ignatius Pendry, seventy-one, under a sheet. His hands lie outside it. The fingertips of both are rubbed raw, as if he had spent a night trying to unscrew something that would not turn.', facts: ['worked_lock'] },
        ],
      },
      {
        id: 'report', at: 'report', label: 'Post-mortem report', kind: 'take',
        views: [
          { if: 'act>=2', text: 'Two reports on the clipboard now. The second might be a carbon of the first.', ev: ['autopsy_pendry', 'autopsy_sallow'] },
          { text: "Dr Marsh's report on Pendry, in handwriting that makes no concessions.", ev: ['autopsy_pendry'] },
        ],
      },
      {
        id: 'samples', at: 'samples', label: 'Specimen fridge', kind: 'look',
        views: [{
          text: "Racks of labelled tubes, and on the top shelf a white box with a red band: DIGOXIN-SPECIFIC ANTIBODY. 'The cure,' says Dr Marsh. 'Costs a fortune, works like a charm. If anyone had brought him over the bridge by ten o'clock, I'd have used that instead of a scalpel.'",
          facts: ['could_be_saved'],
        }],
      },
      {
        id: 'marsh_crossword', at: 'marsh_crossword', label: 'Folded newspaper', kind: 'look',
        views: [
          {
            if: 'act>=3',
            text: "Yesterday's Crux, folded to the crossword, with a mug-ring on it. Dr Marsh has got all but one. She has written in the margin, underlined twice: '14 across is CHEAP.'\n\n14 across: 'Carrier with ideas above his station? Stout fellow! (6)'. By CENSOR.",
            facts: ['porter_clue'],
          },
          { text: "Yesterday's Crux, folded to the crossword. Dr Marsh disapproves of the Fold on principle and does its crossword every lunchtime in ink." },
        ],
      },
    ],
  },

  // ------------------------------------------------------------- meridian
  meridian: {
    name: 'The Meridian',
    sub: "Narrowboat · the Cut, Chandlers' Stairs",
    map: [64, 62],
    arrive: "Chandlers' Stairs, and a green narrowboat with MERIDIAN on her bow and CHARTS · GLOBES · SURVEYS in the window. There is a cat on the roof. It looks at you as though you were late.",
    hotspots: [
      {
        id: 'bunk_sallow', at: 'bunk_sallow', label: 'Where she was found', kind: 'look',
        views: [{ text: "She was at her table, pen still in her fingers, head on the plan she was inking. Nell saw her through the glass and thought she had fallen asleep at her work, which she often did. No disorder. One shoe off.", facts: ['sallow_found'] }],
      },
      {
        id: 'door_sallow', at: 'door_sallow', label: 'The hatch and its lock', kind: 'look',
        views: [{
          text: "The cabin hatch, with a Company letter-lock on the inside. Seven rings, standing at C-H-A-R-T-E-D. Nell had to put a boathook through the glass to get in.\n\nThe same thing as Monday, down to the oil on the rings.",
          facts: ['sallow_locked'],
        }],
      },
      {
        id: 'tube_sallow', at: 'tube_sallow', label: 'Bellows tube', kind: 'take',
        views: [{
          text: "The Bellows comes aboard by a brass pipe at the mooring ring. There is a carrier in the tray, and the sheet from it under her hand: green ink, one page.",
          ev: ['paper_sallow'],
        }],
      },
      {
        id: 'flask', at: 'flask', label: 'Flask and cup', kind: 'take',
        views: [{
          text: "A battered vacuum flask and a cup with a compass rose painted in the bottom. Marguerite Sallow never stayed for the Syndics' tea; she had her flask filled at the Hall at four and drank it aboard. There is a mouthful left.",
          ev: ['flask_sallow'],
        }],
      },
      {
        id: 'chart_table', at: 'chart_table', label: 'Her last drawing', kind: 'look',
        views: [{
          text: "GREYWETHER FOLD: MASTERPLAN. Her last sheet, inked to the edge.\n\nThe Fold, drawn straight for once, and renamed as it went. The Stalemate: 'Unit 3, food and beverage.' Quoin & Daughter: 'Unit 4.' The Almshouses: 'Serviced apartments, phase two.' Nell's ferry stage: 'Footbridge.' The Porter's Lodge is ruled through in red: 'Reception pod.' The Hall itself: 'Greywether Campus.'\n\nIt is not only a woman's life's work they have sold. It is the street.",
          facts: ['masterplan'],
        }],
      },
      {
        id: 'atlas', at: 'atlas', label: 'The big atlas', kind: 'look',
        views: [
          {
            if: 'puz:paper2a',
            text: "The largest book aboard: an elephant folio of the world, two feet tall. Follow the money. Pressed between Asia and the index is a banker's letter.",
            ev: ['escrow_letter'],
          },
          { text: "A shelf of atlases, the biggest of them two feet tall. A chart-seller's library, in a chart-seller's order, which is to say by size." },
        ],
      },
      {
        id: 'sextant', at: 'sextant', label: 'Sextant', kind: 'look',
        views: [
          {
            if: 'puz:paper2b',
            text: "A brass sextant in a fitted box. What a navigator holds to the noon sun. Under the green baize in the lid there is a doctor's report that was never filed, and a line of her pencil across the top of it.",
            ev: ['capacity_report'],
          },
          { text: "A brass sextant in a fitted mahogany box, the arc worn bright. She was not a woman who kept a thing for ornament; this one has been used, and lately opened." },
        ],
      },
      {
        id: 'log_sallow', at: 'log_sallow', label: "The boat's log", kind: 'look',
        views: [{
          text: "Her log, kept like a ship's.\n\n'Sat. Fettle aboard a.m., hatch lock, annual.\nMon. Hall 3.50 to 4.15, flask. Aboard 4.40. News of I.P. A heart, they say. Locked in at 7 to finish the Greywether sheets.'\n\nNothing after that.",
          facts: ['sallow_log'],
        }],
      },
      {
        id: 'riddle_book', at: 'riddle_book', label: "Nell's riddle-book", kind: 'look',
        views: [
          {
            if: { any: ['fact:nina_ariadne', 'fact:word_ariadne', 'fact:epigraph_ariadne'] },
            text: "Every crossing since 1988: the date, the passenger, the riddle asked, the answer given. You ask Nell to find you an Ariadne. She does not need to look for long.\n\n'3 May 1997. Fettle, R., and child (Ariadne, 8). Asked: what has a ring but no finger? The child, at once: a telephone. And a bell. And a tree, if you cut it. Do I pay three times? Toll waived.'\n\nAnd under it, in the same hand, a year on: 'Jan. 1998. Fettle, R. Alone. Did not ask him.'",
            facts: ['ariadne_fettle'],
          },
          {
            text: "A ledger as fat as a loaf. Every crossing of the Cut since 1988: the date, the passenger, the riddle Nell asked, and what they answered.\n\nMonday: nobody after the last ferry at ten. Tuesday: nobody at all before she found the cat on the roof. Whoever did this did not come by water, and did not leave by it.",
            facts: ['nobody_crossed'],
          },
        ],
      },
    ],
  },

  // ------------------------------------------------------------ stalemate
  stalemate: {
    name: 'The Stalemate',
    sub: 'Coffee house · Proving Square',
    map: [40, 50],
    arrive: "The Stalemate. Coffee, chalk dust, the click of chessmen, and a piano nobody is playing. Every table has a board let into it. Nobody looks up, which in the Fold is a kind of welcome.",
    hotspots: [
      {
        id: 'slate_board', at: 'slate_board', label: 'The slate', kind: 'use', action: 'puzzle:slate',
        views: [
          { if: 'puz:slate', text: 'CANDIDATE THREE SETS AS CENSOR. Ottilie has not rubbed it out. She says she wants to look at the hand a while longer.' },
          { if: 'puz:paper3', text: "Tonight's problem. Not a chess problem. A letter chalked on every square of the board, and one line of notation under it, in a small upright hand." },
          { text: "The Stalemate's slate: a chessboard painted on a schoolroom blackboard. There is a new problem chalked up every evening, by whoever gets there first. Tonight's is mate in three, and three people are arguing about it in whispers." },
        ],
      },
      {
        id: 'chess_tables', at: 'chess_tables', label: 'Chess tables', kind: 'look',
        views: [{ text: "Each table has a board inlaid and a drawer of men. At this one a game has been left standing since 1987, under a card: 'Adjourned. H.L. to move.' Nobody has moved it, or dusted round it carelessly, in thirty-eight years." }],
      },
      {
        id: 'piano', at: 'piano', label: 'Piano', kind: 'look',
        views: [{ text: "An upright piano with a sign on the lid: 'IF YOU CAN SOLVE IT YOU CAN PLAY IT.' On the stand is a page of music that is plainly not music." }],
      },
      {
        id: 'score_book', at: 'score_book', label: "Ottilie's score-book", kind: 'look',
        views: [{
          text: "Every game played in the Stalemate, with who, when, and who won. Ottilie keeps it like a parish register.\n\nMonday night: 'Dominoes. Mr Fettle v. Mr Tibbs, 7 to 10, as every Monday. Fettle by three games. Go: J. Okafor-Reed v. P. Quoin, 8 till closing. Lost. Chess: nine boards.'\n\nHalf the Fold was in this room on Monday night, being written down.",
          facts: ['monday_alibis'],
        }],
      },
      {
        id: 'draw_cake', at: 'draw_cake', label: 'The draw cake', kind: 'look',
        views: [{ text: "A plain sponge under a glass dome, and a silver knife. House rule: one of you cuts and the other chooses. In forty years, Ottilie says, nobody has cut it unevenly twice." }],
      },
      {
        id: 'noticeboard', at: 'noticeboard', label: 'The Crux, pinned up', kind: 'look',
        views: [{
          text: "This week's Crux, the Fold's newspaper, pinned by the door.\n\n'GREYWETHER TO SECURE THE FOLD'S FUTURE. A partnership of tradition and tomorrow. By Lucan Voss, Editor.' Somebody has written across it in pencil: SOLD.\n\nAt the foot of the back page: 'Crossword No. 1,041, by CENSOR.' And in the smallest type the paper owns: 'CENSOR is L. Voss.'",
          facts: ['crux_puff', 'censor_is_voss'],
        }],
      },
      {
        id: 'domino_table', at: 'domino_table', label: 'Domino table', kind: 'look',
        views: [{ text: "A table by the stove with a box of dominoes on it, the lid lettered in neat white paint: R. FETTLE. PLEASE RETURN. 'The Porter,' says Ottilie. 'Mondays, seven till ten, thirty years. He's never once been late and he's never once stayed.'" }],
      },
      {
        id: 'stairs_crux', at: 'stairs_crux', label: 'Stairs to the Crux', kind: 'exit',
        views: [
          { if: { any: ['puz:slate', 'flag:voss_dead'] }, text: 'Up one flight: THE CRUX. EDITORIAL.', action: { travel: 'crux' } },
          { text: "A narrow stair with a painted hand pointing up it: THE CRUX. EDITORIAL. NO SOLVERS. You have no business up there yet." },
        ],
      },
    ],
  },

  // ----------------------------------------------------------------- crux
  crux: {
    name: 'The Crux',
    sub: 'Editorial · above the Stalemate',
    parent: 'stalemate',
    arrive: 'One flight up, under the roof: a newspaper office the size of a pantry. Proofs on strings, a typewriter, a smell of ink and cold tea.',
    hotspots: [
      {
        id: 'door_voss', at: 'door_voss', label: 'The door', kind: 'look',
        views: [
          {
            if: 'flag:voss_dead',
            text: "The door has been broken in already; the compositors did it at press time, when the editor did not answer. A seven-ring letter-lock on the inside, standing at Q-U-I-B-B-L-E.\n\nYou are too late. Not by much. That is no comfort at all.",
            facts: ['voss_locked'],
          },
          {
            text: "Locked, and somebody on the other side of it is breathing like a man climbing stairs. You and Kit put your shoulders to the door together.\n\nLucan Voss is in his armchair with a green sheet on his knee and a face the colour of putty. On the inside of the door a seven-ring letter-lock stands at Q-U-I-B-B-L-E. 'It wouldn't,' he says. 'My own word. It wouldn't.'\n\nKit is already running for the bridge and the Infirmary.",
            facts: ['voss_locked'],
            effects: [{ flag: 'voss_reached' }, { flag: 'voss_alive' }, { notify: 'Lucan Voss is alive. The Infirmary has him, and the antidote.' }],
          },
        ],
      },
      {
        id: 'voss_chair', at: 'voss_chair', label: 'Armchair', kind: 'look',
        views: [
          { if: 'flag:voss_dead', text: 'A broken-springed armchair. He was in it. The compositors have put a dust-sheet over the place, which is the Fold all over.' },
          { text: "A broken-springed armchair, and in it, wrapped in Ottilie's tablecloth and waiting for the stretcher, the editor of the Crux." },
        ],
      },
      {
        id: 'tube_voss', at: 'tube_voss', label: 'Bellows tube', kind: 'take',
        views: [{ text: 'The outlet over his desk, and the sheet that came out of it at eight: green ink, one page.', ev: ['paper_voss'] }],
      },
      {
        id: 'flask_voss', at: 'flask_voss', label: 'Cup', kind: 'look',
        views: [{ text: "A Hall cup with an empty crossword grid painted in the bottom, carried up from the four o'clock tea and drained. He has stood a pencil in it." }],
      },
      {
        id: 'voss_desk', at: 'voss_desk', label: "Voss's desk", kind: 'look',
        views: [{
          text: "Proofs for Friday's paper, and the fair copy of crossword No. 1,042, by CENSOR, with the answers pencilled in.\n\n14 across: 'Carrier with ideas above his station? Stout fellow! (6)'. PORTER.\n\nIn the margin, in blue pencil, pleased with itself: 'One for the Lodge. He won't miss it.'",
          facts: ['porter_clue'],
        }],
      },
      {
        id: 'spike', at: 'spike', label: 'The spike', kind: 'take',
        views: [{
          text: "A desk spike: the place where letters to the editor go to die. Most of them are about the ferry. One, near the bottom, is in a small upright hand, with a blue pencil stroke across it.",
          ev: ['spiked_letter'],
        }],
      },
      {
        id: 'typewriter_voss', at: 'typewriter_voss', label: 'Typewriter', kind: 'look',
        views: [{ text: "A typewriter with a half-finished leader in it: 'Those who cling to the Fold as it was forget that it has always been a business.' It stops there. Something interrupted him at about eight o'clock." }],
      },
    ],
  },

  // ------------------------------------------------------------ almshouse
  almshouse: {
    name: 'No. 4, the Almshouses',
    sub: "The Company's Rest · Physic Garden",
    map: [22, 55],
    arrive: "The Almshouses: six small brick houses round a garden, where old setters go when the Company has finished with them. Number four has a brass plate, polished thin: H. LORIMER.",
    hotspots: [
      {
        id: 'hesper_table', at: 'hesper_table', label: 'Her crossword', kind: 'look',
        views: [{
          text: "Today's Crux crossword, on a tray, done in two hands.\n\nOne is a soft pencil that wanders off the line and gives up in the middle of words. The other is small, upright ink, and has finished every clue the pencil began. The nurse says Dame Hesper does it by herself. The ink was dry before breakfast.",
          facts: ['two_pens'],
        }],
      },
      {
        id: 'garden_window', at: 'garden_window', label: 'The garden window', kind: 'look',
        views: [{
          text: "Her chair faces the Physic Garden: the Company's old herb beds, labelled in Latin. Rosemary. Rue. And directly under her window a long bed of foxgloves, Digitalis purpurea, gone over for the year.\n\nThey have been cut back lately, and not by a gardener. Every stem is taken with one clean slant, the way you would cut a pen.",
          facts: ['foxglove_bed'],
        }],
      },
      {
        id: 'tea_tray', at: 'tea_tray', label: 'Tea tray', kind: 'look',
        views: [{ text: "A tray with a cosy, one cup, and a plate of bread and butter cut very thin, with the crusts on, 'because she says a problem ought to have edges'. It comes over from the Hall at four. The nurse does not make it." }],
      },
      {
        id: 'visitors_book', at: 'visitors_book', label: "Visitors' book", kind: 'look',
        views: [{
          text: "A visitors' book. Pasted inside the cover: 'By order of the Deputy (the Warden): family only.'\n\nDame Hesper Lorimer has no family. Since March there is not one name in it.",
          facts: ['no_visitors'],
        }],
      },
      {
        id: 'bookshelf_hesper', at: 'bookshelf_hesper', label: 'Her bookshelf', kind: 'look',
        views: [{ text: "Forty years of her own collected papers in the Company's blue cloth, each inscribed on the flyleaf in a pencil that gets fainter along the shelf. The last, 'Late Tithes, 2012 to 2023', has no inscription at all. Somebody has put a pressed foxglove in it for a bookmark." }],
      },
      {
        id: 'photo_hall', at: 'photo_hall', label: 'Photograph', kind: 'look',
        views: [{
          text: "Setters' Hall, 1984. A woman in her thirties at a desk heaped with paper, mid-sentence, pointing at something with a pencil. At her elbow a lad of twenty in a porter's waistcoat is holding the page flat for her. He is not looking at the camera. He is reading the page.",
          facts: ['photo_1984'],
        }],
      },
      {
        id: 'night_latch', at: 'night_latch', label: 'The door', kind: 'look',
        views: [{
          text: "The door of number four. Every hinge in the Almshouses shrieks like a gull, except this one. Hinges and latch have been oiled, and oiled well, and the key-plate is worn bright in a new place.",
          facts: ['oiled_latch'],
        }],
      },
    ],
  },

  // ----------------------------------------------------------- repository
  repository: {
    name: 'The Repository',
    sub: "Beneath Setters' Hall",
    map: [62, 45],
    arrive: "Down nineteen steps under the Hall. Brick vaults, six hundred years of paper, and at the far end a soft light where the Lectern is. It is cool down here and it hums.",
    hotspots: [
      {
        id: 'lectern', at: 'lectern', label: 'The Lectern', kind: 'use', action: 'laptop',
        views: [{ text: "An oak reading-desk on a pedestal with a pane of light set in its slope. The Lorimer Engine. Ask it anything and it answers in a voice you have not yet heard from the woman it was made of." }],
      },
      {
        id: 'vitrines', at: 'vitrines', label: 'The Late Tithes', kind: 'use', action: 'puzzle:nina',
        views: [
          { if: 'puz:nina', text: 'A, R, I, A, D, N, E, corner to corner in every one of them. You cannot stop seeing it now. Nobody else in twelve years seems to have started.' },
          { text: "A row of glass cases, lit like a jeweller's. THE LATE TITHES OF DAME HESPER LORIMER, 2012 to 2023. 'The crown of the Lorimer Legacy.' Each is a square of seven answers, written in by the winner of that year's Proving, and beside each lies a fair copy of the clues in a small upright hand." },
        ],
      },
      {
        id: 'early_case', at: 'early_case', label: 'An early Tithe', kind: 'look',
        views: [{ text: "By the door, for comparison, a Tithe from 1998: the same sort of square, and her own handwriting in the margins, strong and impatient, pressing through the paper. 'No. Too easy. Again.'" }],
      },
      {
        id: 'jonah_desk', at: 'jonah_desk', label: "Jonah's desk", kind: 'look',
        views: [
          { if: 'told:jonah.j_memo', text: 'He has turned the printout face up for you. Two clouds of dots, and a date ruled between them.', ev: ['stylometry_memo'] },
          { text: "Three screens, a cold coffee, a sleeping bag under the desk. A printout lies face down beneath the keyboard, with a corner showing: 'STYLOMETRY. LORIMER CORPUS. Two clus'. He would plainly rather you asked him than read it." },
        ],
      },
      {
        id: 'server', at: 'server', label: 'The Engine', kind: 'use', action: 'puzzle:ascii',
        views: [
          { if: 'puz:ascii', text: 'Terminal LODGE, two till four, most nights since March. PLAY LECTURE 1987. The machine does not mind. It will read to anybody.' },
          { text: "Two black cabinets with green lights, breathing warm air: the part of the Lectern that is not oak. A log scrolls on a small screen. Jonah says it has generated no examination questions, for anyone, in its life: 'It's a reference desk. People keep forgetting that.'", facts: ['engine_log'] },
        ],
      },
      {
        id: 'rolls', at: 'rolls', label: 'The Rolls of the Company', kind: 'look',
        views: [
          {
            if: { any: ['fact:nina_ariadne', 'fact:word_ariadne', 'fact:epigraph_ariadne'] },
            text: "Every member of the Company since 1426, in ledgers you need both hands to open. You look for an Ariadne. There is none, in six hundred years.\n\nThere is no Fettle either, though there has been a Fettle at the Lodge since 1979. The Rolls list members. They do not list servants.",
            facts: ['not_in_rolls'],
          },
          { text: "The Rolls of the Company: every member since 1426, in ledgers you need both hands to open. Each with a pen-name, a rank, and the year of their Proving." },
        ],
      },
      {
        id: 'waste_basket', at: 'waste_basket', label: 'A waste-paper basket', kind: 'look',
        views: [{
          text: "On a plinth, under glass, like a relic: a wicker waste-paper basket.\n\n'The waste-paper basket of Dame Hesper Lorimer, 1972 to 2011, from which, it is said, more good clues were rescued than most setters ever write.'\n\nRescued by whom, the label does not say.",
          facts: ['basket'],
        }],
      },
    ],
  },

  // -------------------------------------------------------------- lantern
  lantern: {
    name: 'The Lantern',
    sub: "The roof of Setters' Hall · midnight",
    map: [57, 24],
    arrive: "A hundred and three stairs, the last of them a ladder. The Lantern: a round room of glass on the roof of the Hall, with the Founder's Orrery turning in the middle of it and the whole of Ravel lit up below in the rain.",
    hotspots: [
      {
        id: 'grille_lock', at: 'grille_lock', label: 'The lock on the grille', kind: 'use', action: 'puzzle:grille',
        views: [
          { if: 'puz:grille', text: 'Open. The rings stand at A-R-I-A-D-N-E. Nobody is going to change them.' },
          { text: "The Orrery stands inside an iron grille, and the grille's gate is shut on a seven-ring letter-lock. The Warden is on the wrong side of it." },
        ],
      },
      {
        id: 'orrery', at: 'orrery', label: "The Founder's Orrery", kind: 'look',
        views: [{ text: "Brass planets on brass arms, turning round a glass sun that was last lit in 1911. The Warden winds it on the night of the Proving. That is the only reason anybody comes up here, and everybody in the Hall knows the hour he does it." }],
      },
      {
        id: 'proving_desk', at: 'proving_desk', label: 'A desk and a paper', kind: 'look',
        views: [{ text: "A candidate's desk, carried up from the Hall, and on it a sheet of green ink. 'PAPER FOR THE WARDEN. One question. The gate opens to one name. It is in everything you sold.' He has written nothing on it at all." }],
      },
      {
        id: 'hob_clock', at: 'hob_clock', label: 'The clock', kind: 'look',
        views: [{ text: 'The Hall clock, or its travelling twin: two minute hands. The black one is very nearly at the top.' }],
      },
      {
        id: 'lantern_lamp', at: 'lantern_lamp', label: 'Lamp', kind: 'look',
        views: [{ text: "A storm lamp on the floor, turned low. By its light you can see the Porter's shoes. They are, as always, perfectly clean." }],
      },
      {
        id: 'stair_door', at: 'stair_door', label: 'The stair', kind: 'look',
        views: [{ text: 'The way you came up. There is a second, smaller door beside it, for the man who winds the clocks.' }],
      },
    ],
  },
};
