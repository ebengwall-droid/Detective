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
    arrive: 'Turnagain Lane ends at a small stone gatehouse, about the size of a bus shelter. Your phone has no signal here, and its map shows the wrong street.',
    hotspots: [
      {
        id: 'turnstile', at: 'turnstile', label: 'The Turnstile', kind: 'use', action: 'puzzle:gate',
        views: [
          { if: 'puz:gate', text: 'The rings are set to C-A-T-C-H. That word works until midnight. Tomorrow the lock will need a new word.' },
          { text: "An old iron turnstile. On its post is a brass lock with five rings of letters. It will not turn until the rings spell the right word. Kit won't tell you the word." },
        ],
      },
      {
        id: 'slate', at: 'slate', label: 'Chalk slate', kind: 'look',
        views: [{ text: "A child's school slate hangs on a nail. Someone chalked five capital letters on it this morning: FDWFK. Below them, smaller, in different handwriting: 'yesterday's was better'." }],
      },
      {
        id: 'stone', at: 'stone', label: 'Carved stone', kind: 'look',
        views: [{ text: 'Words are carved into the wall above the gate: THREE BACK, AS CAESAR WROTE. The carving is about two hundred years old, and has been re-cut at least once. Under it, someone has scratched with a key: every. single. day.' }],
      },
      {
        id: 'notice', at: 'notice', label: 'Painted board', kind: 'look',
        views: [{
          text: "THE FOLD. NO MAPS SOLD HERE. MIND THE TIME.\n\nKit nods through the bars. 'Every map of Ravel since 1741 was drawn by people in there. They always put our streets in the fold of the page, where nobody can see them. So you can't find the Fold on a map. Someone has to tell you, or you work it out. And our clocks are eleven minutes behind yours. You'll see.'",
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
    arrive: "Setters' Hall. Oak panels, brass, and oil portraits of forty Wardens. It smells of beeswax and good tea. The Company has set out a desk here for the police.",
    hotspots: [
      {
        id: 'laptop', at: 'laptop', label: 'The Lectern (your terminal)', kind: 'use', action: 'laptop',
        views: [{ text: 'A terminal for the Lectern, the machine under the Hall. It can tell you how anything is done, but it will not do it for you. You can check the lab queue here too.' }],
      },
      {
        id: 'board', at: 'board', label: 'Case board', kind: 'use', action: 'board',
        views: [{ text: 'The case board. It shows everything you know so far, and what is still missing.' }],
      },
      {
        id: 'tube', at: 'tube', label: 'Bellows tube', kind: 'look',
        views: [
          { if: 'flag:letter_waiting', text: "A brass carrier drops into the tray with a thump. It is sealed with green wax. Nobody else in the Hall seems to notice.", effects: [{ call: 'takeLetter' }], repeat: true },
          { text: 'The Bellows outlet at your desk. The Bellows is a system of air pipes that carries messages around the Fold in brass carriers. Anything sent to you lands in this tray.' },
        ],
      },
      {
        id: 'my_desk', at: 'my_desk', label: 'Your desk', kind: 'look',
        views: [{ text: "The Scrutineers' desk. The Company has lent it to the police until the case is over. Someone has set out a blotter, a pen, a clean cup and saucer, and a small card: MIND THE TIME. You did not see who did it." }],
      },
      {
        id: 'lodge', at: 'lodge', label: "The Porter's Lodge", kind: 'look',
        views: [
          {
            if: { any: ['fact:pendry_paper', 'fact:locked_inside'] },
            text: "The Porter's Lodge: a counter, a kettle, a stool the Porter never seems to use, and his daybook, open at this week.\n\n'Sat. Letter-locks, annual oil and re-pin before the Proving: 4 Nonesuch Row (Mr Pendry); the Meridian (Mrs Sallow); the Crux (Mr Voss); Warden's Parlour; the Lantern grille.\nSun. Wound the sixty-one. Syndics' tea at four.\nMon. Mr Pendry not down. Constables sent for, 7.40. Hold-rack wound.'\n\nThe daybook is written in small, upright handwriting. He has kept it for forty-six years without a single ink blot.",
            facts: ['locks_oiled'],
          },
          { text: "The Porter's Lodge: a counter, a kettle, a stool the Porter never seems to use, and a daybook in small, upright handwriting. It records deliveries, visitors and the clocks he has wound. It is very neatly kept." },
        ],
      },
      {
        id: 'keyboard', at: 'keyboard', label: 'Board of keys', kind: 'look',
        views: [{
          text: "A board of 144 hooks, in twelve rows of twelve, each with a numbered brass tag. The top hook, number 144, is empty. It is for the master key, which the Porter keeps in his pocket in case of fire.\n\nOn the bottom row hang seven thin steel pins, one for each private lock. 'Setting-pins,' says Kit. 'You push one into the back of a letter-lock, and then you can give the lock a new word. It takes a minute.' The pins hang on open hooks, a yard from the tea table.",
          facts: ['pins_open'],
        }],
      },
      {
        id: 'tea_table', at: 'tea_table', label: 'The tea table', kind: 'look',
        views: [{
          text: "The Syndics' tea is laid here at four every day, and has been for as long as anyone remembers. Dame Hesper called it 'the four o'clock problem'. There are four cups, all different. One has a clock face painted in the bottom. The others have a compass rose, an empty crossword grid, and the Company's coat of arms. Nobody could mix them up.\n\nTwo of the cups are turned upside down on their saucers.",
          facts: ['own_cups'],
        }],
      },
      {
        id: 'hall_clock', at: 'hall_clock', label: 'The Hall clock', kind: 'look',
        views: [{
          text: "The Hall clock has two minute hands. The black hand shows Fold Time. The red hand is eleven minutes ahead, and shows Greenwich time for visitors.\n\n'Before the railways, every town set its clocks by its own sun,' says Kit. 'Bristol was ten minutes behind London. Then the train timetables came, and every town changed to London time. We didn't. By the sun, we're eleven minutes behind Greenwich, so that's the time we keep.'",
          facts: ['fold_time'],
        }],
      },
      {
        id: 'back_chair', at: 'back_chair', label: 'The chair at the back', kind: 'look',
        views: [{
          text: "A plain chair with a high back. It stands by itself against the wall, under the clock.\n\n'That's for the Proving,' says Kit. 'The candidates sit facing away from it. The person in that chair keeps the time and says nothing for three hours. You never turn round to look at them. That's the point.'\n\n'What is that person called?'\n\nKit gives you a strange look. 'The invigilator. What do you call it in the Flat?'",
          facts: ['invigilator_chair'],
        }],
      },
      {
        id: 'register', at: 'register', label: 'The Proving register', kind: 'look',
        views: [
          {
            if: { any: ['act>=3', 'fact:invigilator_chair'] },
            text: "The Proving register lists candidates, marks and examiners' signatures. The last column is headed INVIG. It is filled with ditto marks, meaning 'same as above', page after page.\n\nYou turn back thirty-five years to find the name the ditto marks repeat.\n\n1990. INVIG.: R. Fettle (Porter).",
            facts: ['hob_invigilates'],
          },
          { text: "The Proving register, open on its stand at this Thursday's blank page. It records candidates, marks and examiners. Nine candidates are entered this week. The Company takes the Proving very seriously." },
        ],
      },
      {
        id: 'exchange', at: 'exchange', label: 'The Bellows exchange', kind: 'use', action: 'puzzle:bellows',
        views: [
          { if: 'puz:bellows', text: "The collar said HELD SINCE NOON. Anyone can put a carrier in the hold-rack and set the dial. The clockwork sends it on later. A small brass plate on the clockwork reads: WOUND MONDAYS. R.F.", facts: ['rack_wound'] },
          {
            if: 'ev:paper_1',
            text: "The exchange is the brass hub where every Bellows tube in the Fold begins and ends. Beside it is the hold-rack, a row of cradles, each with a small dial. You put a carrier in a cradle and set the dial. The clockwork sends it on at the hour you chose.\n\nThe carrier that brought your Paper is still in the returns tray. Its brass collar is punched with pairs of numbers.\n\nA small brass plate on the clockwork reads: WOUND MONDAYS. R.F.",
            facts: ['rack_wound'],
          },
          { text: "The exchange is the brass hub where every Bellows tube in the Fold begins and ends. Beside it is a rack of cradles with small dials. You can hear a carrier rattle past inside the wall." },
        ],
      },
      {
        id: 'tithe_wall', at: 'tithe_wall', label: 'The Wall of Tithes', kind: 'look',
        views: [{
          text: "Every member owes the Company one new puzzle a year, called a Tithe. Here they are: four hundred sheets, pinned from the floor to far above your head. There are mazes, ciphers, chess problems, and a knitting pattern that is said to be a joke. At the very top, behind glass, is a tray of numbered tiles.\n\nThree of the puzzles have hung here for a very long time, and nobody has taken them down. You could try them.",
          facts: ['tithe_custom'],
        }],
      },
      {
        id: 'portrait_hesper', at: 'portrait_hesper', label: 'Portrait of Dame Hesper', kind: 'look',
        views: [
          { if: 'ev:codicil', text: 'You have hung the portrait straight again. She still seems to look just past your shoulder.' },
          {
            if: 'puz:cryptic',
            text: "Left, characteristic, likeness: PORTRAIT. Whatever she hid is behind her portrait.\n\nYou lift the frame an inch from the wall. Tucked behind the canvas is a folded sheet of the Company's paper. It is sealed, and addressed in shaky handwriting: 'To whoever looks.'",
            ev: ['codicil'],
          },
          {
            text: "DAME HESPER LORIMER ('VESPER'). Warden 1994 to 2011. Painted in 2009.\n\nA thin woman of about sixty in a dark red jacket, with a pencil behind her ear. VESPER was the pen-name she set puzzles under. She is looking just past your shoulder. Her face says she knows the answer and is waiting to see if you will find it.",
            facts: ['vesper_name'],
          },
        ],
      },
      {
        id: 'portraits', at: 'portraits', label: 'The Wardens', kind: 'look',
        views: [{ text: "Portraits of forty Wardens in a row. The oldest is a man in a ruff, holding what may be a cipher disc. The newest frame holds only a photograph and a card: 'A. Clay, Warden. Portrait in hand.' Under each portrait is a name and a pen-name. Setters always publish under a pen-name. Using your real name is thought bad manners." }],
      },
      {
        id: 'clay_desk', at: 'clay_desk', label: "The Warden's desk", kind: 'look',
        views: [{
          text: "The Warden's Parlour. A huge desk with almost nothing on it: a telephone, a silver pen, and one sheet under a glass paperweight. The sheet is a draft agreement for a sale, headed GREYWETHER PLC: HEADS OF TERMS. 'The Lorimer Legacy, together with the freehold of Setters' Hall and the properties scheduled.' Completion: 31 October.\n\nThere are no puzzles anywhere in this room.",
          facts: ['completion_31'],
        }],
      },
      {
        id: 'clay_safe', at: 'clay_safe', label: "The Warden's safe", kind: 'look',
        views: [
          { if: 'ev:faircopy_books', text: 'The safe is open, and the twelve ledgers are gone. The Warden has not noticed yet. The Porter has gone back to polishing the brass.' },
          { if: { any: ['fact:spiked_letter', 'fact:two_hands', 'fact:voss_confesses'] }, text: "A Company safe with a seven-ring letter-lock, and a keyhole below it. The Warden chooses the word. The keyhole fits key number 144.\n\nKey number 144 is kept in the Porter's pocket." },
          { text: "A short, wide, green Company safe, with a seven-ring letter-lock and a keyhole below it. It is the only thing in the Warden's Parlour that looks well used." },
        ],
      },
      {
        id: 'strongbox', at: 'strongbox', label: 'Evidence chest', kind: 'use', action: 'puzzle:lock',
        views: [
          { if: 'puz:lock', text: "Pendry's lock is open. The rings read A, R, I, A, D, N, E. The lock was oiled recently, and carefully.", ev: ['lock_pendry'] },
          { if: 'examined:door_pendry', text: "The iron-bound chest the Company has lent for evidence. Inside, with a tag on it, is the letter-lock from Ignatius Pendry's door. Its seven brass rings still read his own word. The lock was oiled recently, and carefully.", ev: ['lock_pendry'] },
          { text: 'An iron-bound chest that the Company has lent for evidence. It is empty and smells of camphor.' },
        ],
      },
    ],
  },

  // ------------------------------------------------------------ clockshop
  clockshop: {
    name: 'Pendry & Sons',
    sub: 'Clockmakers · 4 Nonesuch Row',
    map: [30, 30],
    arrive: "Pendry & Sons, clockmakers, at 4 Nonesuch Row. Ignatius Pendry was found dead here this morning. Forty-one clocks are ticking, slightly out of time with each other.",
    hotspots: [
      {
        id: 'bench', at: 'bench', label: "Pendry's bench", kind: 'look',
        views: [{
          text: "Pendry was found here, with his head down on his folded arms. There was no wound and no sign of a struggle. The stool is upright, and his tools are in their racks in order of size. Whatever happened here was quiet, and it took hours.",
          facts: ['pendry_bench'],
        }],
      },
      {
        id: 'door_pendry', at: 'door_pendry', label: 'The door and its lock', kind: 'look',
        views: [{
          text: "A heavy oak door with iron straps. The constables took it off its hinges while Wilf watched. On the inside is a Company letter-lock with seven brass rings. They read P-E-N-D-R-Y-S, his own word.\n\nPendry locked himself in to work every night for thirty years. On Sunday night, his own word did not open the lock.\n\nThe lock has been taken to the evidence chest at the Hall.",
          facts: ['locked_inside'],
        }],
      },
      {
        id: 'window_bars', at: 'window_bars', label: 'Window bars', kind: 'look',
        views: [{ text: 'The window has bars, like every shop in Nonesuch Row that keeps brass. It is also painted shut. Nobody came in or out this way.', facts: ['no_entry'] }],
      },
      {
        id: 'cup_pendry', at: 'cup_pendry', label: 'Tea tray', kind: 'take',
        views: [{
          text: "A tea tray from the Hall, with a pot, a strainer and one cup. There is half an inch of tea left in the cup, and a clock face painted in the bottom. The Syndics take tea at the Hall at four. Wilf says Pendry always carried his last cup back to his bench.",
          ev: ['cup_pendry'],
        }],
      },
      {
        id: 'tube_pendry', at: 'tube_pendry', label: 'Bellows tube', kind: 'take',
        views: [{
          text: "The Bellows outlet by the bench. Its flap is open, and an open carrier lies in the tray. The sheet that came in it is on the bench, where it was found under his hand. It is one page in green ink, laid out as an exam paper.",
          ev: ['paper_pendry'],
        }],
      },
      {
        id: 'notepad', at: 'notepad', label: 'His blotter', kind: 'look',
        views: [{
          text: "A list of seven-letter words in tiny capital letters, each one crossed out.\n\nPENDRYS. HOROLOG. HESPERL. LORIMER. VESPERS. Then LORIMER again, pressed so hard that the pen went through the paper.\n\nNext to the words are tally marks in groups of five. He counted every word he tried on the lock. He stopped counting at 190.",
          facts: ['pendry_tries'],
        }],
      },
      {
        id: 'clocks', at: 'clocks', label: 'The wall of clocks', kind: 'look',
        views: [{
          text: "Forty-one clocks, all showing the correct Fold Time. Each one has a second minute hand, painted red, eleven minutes ahead of the black one. The red hand shows Greenwich time, for visitors.\n\nSo when the Fold says four o'clock, your watch says eleven minutes past four.",
          facts: ['fold_time'],
        }],
      },
      {
        id: 'lodger', at: 'lodger', label: 'The chess-player', kind: 'look',
        views: [{
          text: "Pendry was very proud of this. It is a life-size figure in a robe, sitting behind a cabinet with a chessboard set into the top. He built it from the plans of a chess machine first shown in Vienna in 1770. That machine toured Europe for eighty years and beat Napoleon.\n\nOne cabinet door is slightly open. Inside are a lot of cogwheels, but they are only for show. Behind them is a sliding seat, a shelf for a candle, and just enough room for a person.\n\n'The original couldn't think,' says Wilf. 'It had a man hidden inside it. We call ours the Lodger.'",
          facts: ['lodger_trick'],
        }],
      },
      {
        id: 'certificate', at: 'certificate', label: 'Framed certificate', kind: 'look',
        views: [{
          text: "CERTIFICATE OF PROVENANCE\nTHE LORIMER LEGACY\n\n'I, Ignatius Pendry, Grand Setter and Syndic, having examined the manuscripts, working papers and fair copies of Dame Hesper Lorimer for the years 1972 to 2023, do certify the whole to be her sole and original work. The fair copies of the later years are in a copyist's hand and are of no consequence.'\n\nPrepared for Greywether plc. Fee: forty thousand pounds.\n\nSo Pendry swore that all of the work was Dame Hesper's own. He was paid forty thousand pounds to say so, and he had the certificate framed.",
          facts: ['certificate_sole'],
        }],
      },
      {
        id: 'ledger_pendry', at: 'ledger_pendry', label: 'Shop ledger', kind: 'look',
        views: [{
          text: "Pendry & Sons has not sold a clock since August. The last entry is in pencil, not ink:\n\n'Greywether. On completion 31 Oct. My quarter: £2,750,000.'\n\nThe money was to go to Pendry himself, not to the Company.",
          facts: ['pendry_quarter'],
        }],
      },
      {
        id: 'stove_pendry', at: 'stove_pendry', label: 'Stove', kind: 'look',
        views: [{ text: "The stove is ready to light, but nobody lit it. Pendry meant to work late. At about eight o'clock, he had something more urgent to think about." }],
      },
    ],
  },

  // ------------------------------------------------------------ wheelshop
  wheelshop: {
    name: 'Quoin & Daughter',
    sub: 'Wheelwrights · 5 Nonesuch Row',
    map: [24, 41],
    arrive: "Quoin & Daughter, wheelwrights, at 5 Nonesuch Row. They make cipher wheels here, not cartwheels. Brass and boxwood discs the size of saucers hang on the walls. Each has two rings of letters, and they turn slightly in the draught.",
    hotspots: [
      {
        id: 'fitting', at: 'fitting', label: 'The fitting bench', kind: 'use', action: 'puzzle:fitting',
        views: [
          { if: 'puz:fitting', text: "The green cloth has been brushed and the tray put away. Your brass wheel is in your pocket. It is heavier than it looks." },
          { text: "A counter covered in green cloth, with a velvet tray of cipher wheels on it. Each wheel has two rings of letters, one turning inside the other. Every child in the Fold is fitted for a wheel at the age of seven. You are a lot older, and Mrs Quoin has told you so." },
        ],
      },
      {
        id: 'wheels', at: 'wheels', label: 'Racks of wheels', kind: 'look',
        views: [{ text: "Wheels of boxwood, bone and brass. Some have a third ring, and some have numbers. One has the Greek alphabet, and a very high price. A card says: 'A wheel does not make you clever. It makes you quick. The clever is your own lookout. T.Q.'" }],
      },
      {
        id: 'quoin_ledger', at: 'quoin_ledger', label: 'Fitting ledger', kind: 'look',
        views: [
          {
            if: { any: ['fact:nina_ariadne', 'fact:word_ariadne', 'fact:epigraph_ariadne'] },
            text: "Every fitting since 1961, by date, with the child's name, age, and the wheel they were given. You look for an Ariadne.\n\n'1996. Ariadne Fettle, 7. Boxwood. Quickest I ever timed. No charge; I told her father so and he paid anyway.'\n\nFettle is the Porter's surname.",
            facts: ['ariadne_fettle'],
          },
          { text: "A thick ledger listing every fitting since 1961: the child's name, their age, and the wheel they were given. Most children got boxwood, and a few got bone. Brass is rare. The last brass wheel before yours was nine years ago." },
        ],
      },
      {
        id: 'wall_party', at: 'wall_party', label: 'The party wall', kind: 'look',
        views: [{
          text: "This wall is shared with Pendry's workshop next door. It is a foot of old brick, with a shelf of varnish tins. If someone hammered on a door on the other side, you would hear a slow knocking here. You could easily mistake it for a clock.",
          facts: ['banging'],
        }],
      },
      {
        id: 'kit_photo', at: 'kit_photo', label: 'Photograph', kind: 'look',
        views: [{ text: "A woman of about thirty, laughing at the camera, with an angry small child on her hip. On the mount: 'Morwenna and Kit.' Morwenna was the '& Daughter' in the shop's name. She came from the Flat, and the Company always treated her as an outsider." }],
      },
    ],
  },

  // ------------------------------------------------------------- mortuary
  mortuary: {
    name: 'County Mortuary',
    sub: 'Ravel Infirmary · the Flat',
    map: [90, 15],
    arrive: 'The County Mortuary, at Ravel Infirmary in the Flat. Here the clocks agree with your watch. Your phone has a signal again, and fourteen messages arrive. The room is all tiles, steel and strip lights, and it smells of chemicals.',
    hotspots: [
      {
        id: 'slab', at: 'slab', label: 'Examination table', kind: 'look',
        views: [
          { if: 'act>=2', text: 'Now it is Marguerite Sallow under the sheet. Dr Marsh has put the two charts side by side and drawn a bracket around both, to show they belong together.' },
          { text: 'Ignatius Pendry, aged seventy-one, lies under a sheet with his hands outside it. The fingertips of both hands are rubbed raw. He must have spent hours trying to turn something that would not move.', facts: ['worked_lock'] },
        ],
      },
      {
        id: 'report', at: 'report', label: 'Post-mortem report', kind: 'take',
        views: [
          { if: 'act>=2', text: 'There are two reports on the clipboard now. The second one is almost the same as the first.', ev: ['autopsy_pendry', 'autopsy_sallow'] },
          { text: "Dr Marsh's post-mortem report on Pendry. It is short and blunt.", ev: ['autopsy_pendry'] },
        ],
      },
      {
        id: 'samples', at: 'samples', label: 'Specimen fridge', kind: 'look',
        views: [{
          text: "Racks of labelled tubes. On the top shelf is a white box with a red band: DIGOXIN-SPECIFIC ANTIBODY. 'That's the antidote,' says Dr Marsh. 'It's very expensive, and it works. If someone had brought him over the bridge by ten o'clock, I could have saved him with it.'",
          facts: ['could_be_saved'],
        }],
      },
      {
        id: 'marsh_crossword', at: 'marsh_crossword', label: 'Folded newspaper', kind: 'look',
        views: [
          {
            if: 'act>=3',
            text: "Yesterday's Crux, folded open at the crossword, with a ring from a mug on it. Dr Marsh has solved every clue but one. In the margin she has written, underlined twice: '14 across is CHEAP.'\n\n14 across: 'Carrier with ideas above his station? Stout fellow! (6)'. By CENSOR.",
            facts: ['porter_clue'],
          },
          { text: "Yesterday's Crux, folded open at the crossword. Dr Marsh disapproves of the Fold, but she does its crossword every lunchtime, in ink." },
        ],
      },
    ],
  },

  // ------------------------------------------------------------- meridian
  meridian: {
    name: 'The Meridian',
    sub: "Narrowboat · the Cut, Chandlers' Stairs",
    map: [64, 62],
    arrive: "A green narrowboat is moored at Chandlers' Stairs. MERIDIAN is painted on the bow, and the window says CHARTS · GLOBES · SURVEYS. This was Marguerite Sallow's boat and chart shop. A cat sits on the roof.",
    hotspots: [
      {
        id: 'bunk_sallow', at: 'bunk_sallow', label: 'Where she was found', kind: 'look',
        views: [{ text: "Sallow was found at her table, with her pen still in her fingers and her head on the plan she was inking. Nell saw her through the glass and thought she had fallen asleep while working, as she often did. Nothing is out of place. One of her shoes is off.", facts: ['sallow_found'] }],
      },
      {
        id: 'door_sallow', at: 'door_sallow', label: 'The hatch and its lock', kind: 'look',
        views: [{
          text: "The cabin hatch has a Company letter-lock on the inside. Its seven rings read C-H-A-R-T-E-D, her own word. Nell had to break the glass with a boathook to get in.\n\nIt is just like Pendry's door on Monday, even down to the fresh oil on the rings.",
          facts: ['sallow_locked'],
        }],
      },
      {
        id: 'tube_sallow', at: 'tube_sallow', label: 'Bellows tube', kind: 'take',
        views: [{
          text: "A brass Bellows pipe comes aboard at the mooring ring. There is a carrier in the tray. The sheet that came in it was under her hand: one page, in green ink.",
          ev: ['paper_sallow'],
        }],
      },
      {
        id: 'flask', at: 'flask', label: 'Flask and cup', kind: 'take',
        views: [{
          text: "A battered vacuum flask, and a cup with a compass rose painted in the bottom. Marguerite Sallow never stayed for the Syndics' tea. She had her flask filled at the Hall at four and drank it on board. There is a mouthful left.",
          ev: ['flask_sallow'],
        }],
      },
      {
        id: 'chart_table', at: 'chart_table', label: 'Her last drawing', kind: 'look',
        views: [{
          text: "GREYWETHER FOLD: MASTERPLAN. This is her last drawing, inked right to the edge.\n\nFor once, the Fold is drawn correctly, and every place has a new name. The Stalemate: 'Unit 3, food and beverage.' Quoin & Daughter: 'Unit 4.' The Almshouses: 'Serviced apartments, phase two.' Nell's ferry stage: 'Footbridge.' The Porter's Lodge is crossed out in red: 'Reception pod.' The Hall itself: 'Greywether Campus.'\n\nSo the sale includes much more than Dame Hesper's work. It takes the Hall and most of the Fold.",
          facts: ['masterplan'],
        }],
      },
      {
        id: 'atlas', at: 'atlas', label: 'The big atlas', kind: 'look',
        views: [
          {
            if: 'puz:paper2a',
            text: "The largest book on board: a huge atlas of the world, two feet tall. Paper II said MONEY, and told you to follow it. Pressed between Asia and the index is a banker's letter.",
            ev: ['escrow_letter'],
          },
          { text: "A shelf of atlases, arranged by size. The biggest is two feet tall." },
        ],
      },
      {
        id: 'sextant', at: 'sextant', label: 'Sextant', kind: 'look',
        views: [
          {
            if: 'puz:paper2b',
            text: "A brass sextant in a fitted box: the instrument a navigator holds up to the noon sun. Under the green cloth lining the lid is a doctor's report that was never sent to the court. Sallow has written a line in pencil across the top.",
            ev: ['capacity_report'],
          },
          { text: "A brass sextant in a fitted mahogany box. Its arc is worn bright from use. Sallow did not keep things just for decoration. The box has been opened recently." },
        ],
      },
      {
        id: 'log_sallow', at: 'log_sallow', label: "The boat's log", kind: 'look',
        views: [{
          text: "Sallow kept a daily log of her boat, as a ship's captain does.\n\n'Sat. Fettle aboard a.m., hatch lock, annual.\nMon. Hall 3.50 to 4.15, flask. Aboard 4.40. News of I.P. A heart, they say. Locked in at 7 to finish the Greywether sheets.'\n\nThere is nothing after that.",
          facts: ['sallow_log'],
        }],
      },
      {
        id: 'riddle_book', at: 'riddle_book', label: "Nell's riddle-book", kind: 'look',
        views: [
          {
            if: { any: ['fact:nina_ariadne', 'fact:word_ariadne', 'fact:epigraph_ariadne'] },
            text: "Every crossing since 1988: the date, the passenger, the riddle asked and the answer given. You ask Nell to find an Ariadne. She finds one quickly.\n\n'3 May 1997. Fettle, R., and child (Ariadne, 8). Asked: what has a ring but no finger? The child, at once: a telephone. And a bell. And a tree, if you cut it. Do I pay three times? Toll waived.'\n\nFurther down, in the same handwriting: 'Jan. 1998. Fettle, R. Alone. Did not ask him.'",
            facts: ['ariadne_fettle'],
          },
          {
            text: "A very thick ledger. It records every crossing of the Cut since 1988: the date, the passenger, the riddle Nell asked, and their answer.\n\nSunday: nobody crossed after the last ferry at ten. Monday: the same. Tuesday: nobody at all before Nell found the cat on the Meridian's roof. Whoever did this did not come or go by water.",
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
    arrive: "The Stalemate, a coffee house for puzzlers. It smells of coffee and chalk dust, and you can hear chess pieces clicking. There is a piano, but nobody is playing it. Every table has a game board set into it. Nobody looks up when you come in.",
    hotspots: [
      {
        id: 'slate_board', at: 'slate_board', label: 'The slate', kind: 'use', action: 'puzzle:slate',
        views: [
          { if: 'puz:slate', text: 'CANDIDATE THREE SETS AS CENSOR. Ottilie has not wiped it off. She says she wants to study the handwriting a while longer.' },
          { if: 'puz:paper3', text: "Tonight's problem is not a chess problem. A letter is chalked on every square of the board. Under it is one line of chess notation, in a small, upright hand." },
          { text: "The Stalemate's slate is a chessboard painted on a school blackboard. Every evening, whoever arrives first chalks up a new problem. Tonight's is mate in three. Three people are arguing about it in whispers." },
        ],
      },
      {
        id: 'chess_tables', at: 'chess_tables', label: 'Chess tables', kind: 'look',
        views: [{ text: "Each table has a chessboard set into it and a drawer of pieces. On this table, a game has been left unfinished since 1987, with a card: 'Adjourned. H.L. to move.' In thirty-eight years, nobody has touched a piece." }],
      },
      {
        id: 'piano', at: 'piano', label: 'Piano', kind: 'look',
        views: [{ text: "An upright piano. The sheet on the stand looks like music, but it is really a puzzle. A sign on the lid says: 'IF YOU CAN SOLVE IT YOU CAN PLAY IT.'" }],
      },
      {
        id: 'score_book', at: 'score_book', label: "Ottilie's score-book", kind: 'look',
        views: [{
          text: "Ottilie records every game played in the Stalemate: who played, when, and who won.\n\nMonday night: 'Dominoes. Mr Fettle v. Mr Tibbs, 7 to 10, as every Monday. Fettle by three games. Go: J. Okafor-Reed v. P. Quoin, 8 till closing. Lost. Chess: nine boards.'\n\nHalf the Fold was in this room on Monday night, and Ottilie wrote down who.",
          facts: ['monday_alibis'],
        }],
      },
      {
        id: 'draw_cake', at: 'draw_cake', label: 'The draw cake', kind: 'look',
        views: [{ text: "A plain sponge cake under a glass dome, with a silver knife. The house rule: one player cuts, and the other player chooses a piece first. Ottilie says that in forty years, nobody has cut it unevenly twice." }],
      },
      {
        id: 'noticeboard', at: 'noticeboard', label: 'The Crux, pinned up', kind: 'look',
        views: [{
          text: "This week's Crux, the Fold's newspaper, is pinned up by the door.\n\n'GREYWETHER TO SECURE THE FOLD'S FUTURE. A partnership of tradition and tomorrow. By Lucan Voss, Editor.' Someone has written across it in pencil: SOLD.\n\nAt the bottom of the back page: 'Crossword No. 1,041, by CENSOR.' Under it, in very small print: 'CENSOR is L. Voss.'",
          facts: ['crux_puff', 'censor_is_voss'],
        }],
      },
      {
        id: 'domino_table', at: 'domino_table', label: 'Domino table', kind: 'look',
        views: [{ text: "A table by the stove with a box of dominoes on it. The lid is painted in neat white letters: R. FETTLE. PLEASE RETURN. 'That's the Porter's,' says Ottilie. 'He plays here every Monday, seven till ten, and has for thirty years. He's never once been late, and he never stays past ten.'" }],
      },
      {
        id: 'stairs_crux', at: 'stairs_crux', label: 'Stairs to the Crux', kind: 'exit',
        views: [
          { if: { any: ['puz:slate', 'flag:voss_dead'] }, text: 'Up one flight of stairs: THE CRUX. EDITORIAL.', action: { travel: 'crux' } },
          { text: "A narrow staircase, with a painted hand pointing up: THE CRUX. EDITORIAL. NO SOLVERS. You have no reason to go up there yet." },
        ],
      },
    ],
  },

  // ----------------------------------------------------------------- crux
  crux: {
    name: 'The Crux',
    sub: 'Newspaper office · above the Stalemate',
    parent: 'stalemate',
    arrive: 'One flight up, under the roof, is a tiny newspaper office. Page proofs hang on strings. There is a typewriter, and a smell of ink and cold tea.',
    hotspots: [
      {
        id: 'door_voss', at: 'door_voss', label: 'The door', kind: 'look',
        views: [
          {
            if: 'flag:voss_dead',
            text: "The door has already been broken open. The printers did it at press time, when the editor did not answer. On the inside is a seven-ring letter-lock. Its rings read Q-U-I-B-B-L-E, his own word.\n\nYou are too late, but only by a little.",
            facts: ['voss_locked'],
          },
          {
            text: "The door is locked. Someone on the other side is breathing hard. You and Kit break the door open with your shoulders.\n\nLucan Voss is in his armchair with a green sheet on his knee. His face is grey. On the inside of the door, a seven-ring letter-lock reads Q-U-I-B-B-L-E. 'It wouldn't open,' he says. 'My own word. It wouldn't open.'\n\nKit is already running for the bridge and the Infirmary.",
            facts: ['voss_locked'],
            effects: [{ flag: 'voss_reached' }, { flag: 'voss_alive' }, { notify: 'Lucan Voss is alive. He is at the Infirmary, and they have given him the antidote.' }],
          },
        ],
      },
      {
        id: 'voss_chair', at: 'voss_chair', label: 'Armchair', kind: 'look',
        views: [
          { if: 'flag:voss_dead', text: 'An old armchair with broken springs. Voss was found in it. The printers have put a dust-sheet over it.' },
          { text: "An old armchair with broken springs. The editor of the Crux is in it, wrapped in Ottilie's tablecloth, waiting for the stretcher." },
        ],
      },
      {
        id: 'tube_voss', at: 'tube_voss', label: 'Bellows tube', kind: 'take',
        views: [{ text: 'The Bellows outlet over his desk. The sheet that came out of it at eight is one page, in green ink.', ev: ['paper_voss'] }],
      },
      {
        id: 'flask_voss', at: 'flask_voss', label: 'Cup', kind: 'look',
        views: [{ text: "A Hall cup with an empty crossword grid painted in the bottom. He carried it up from the four o'clock tea and drank it all. A pencil is standing in it." }],
      },
      {
        id: 'voss_desk', at: 'voss_desk', label: "Voss's desk", kind: 'look',
        views: [{
          text: "Proofs for Friday's paper, and the fair copy of crossword No. 1,042, by CENSOR, with the answers pencilled in.\n\n14 across: 'Carrier with ideas above his station? Stout fellow! (6)'. PORTER.\n\nIn the margin, in Voss's blue pencil: 'One for the Lodge. He won't miss it.'",
          facts: ['porter_clue'],
        }],
      },
      {
        id: 'spike', at: 'spike', label: 'Letter spike', kind: 'take',
        views: [{
          text: "A desk spike, where the editor puts letters he will not print. Most are about the ferry. One near the bottom is in a small, upright hand, with a blue pencil line across it.",
          ev: ['spiked_letter'],
        }],
      },
      {
        id: 'typewriter_voss', at: 'typewriter_voss', label: 'Typewriter', kind: 'look',
        views: [{ text: "A typewriter with a half-finished editorial in it. It reads: 'Those who cling to the Fold as it was forget that it has always been a business.' It stops there. Something interrupted him at about eight o'clock." }],
      },
    ],
  },

  // ------------------------------------------------------------ almshouse
  almshouse: {
    name: 'No. 4, the Almshouses',
    sub: "The Company's Rest · Physic Garden",
    map: [22, 55],
    arrive: "The Almshouses: six small brick houses around a garden. Old setters live here when the Company no longer needs them. Number four has a brass plate, worn thin from polishing: H. LORIMER.",
    hotspots: [
      {
        id: 'hesper_table', at: 'hesper_table', label: 'Her crossword', kind: 'look',
        views: [{
          text: "Today's Crux crossword lies on a tray. Two different people have filled it in.\n\nOne wrote in soft pencil. The letters wander off the lines and stop in the middle of words. The other wrote in small, upright ink, and finished every clue the pencil started. The nurse says Dame Hesper does it by herself. But the ink was dry before breakfast.",
          facts: ['two_pens'],
        }],
      },
      {
        id: 'garden_window', at: 'garden_window', label: 'The garden window', kind: 'look',
        views: [{
          text: "Her chair faces the Physic Garden, the Company's old herb beds, with labels in Latin. There is rosemary and rue. Right under her window is a long bed of foxgloves, Digitalis purpurea, finished flowering for the year.\n\nThe foxgloves were cut back recently, and not by a gardener. Each stem was cut with one clean slant, the way you cut a quill pen.",
          facts: ['foxglove_bed'],
        }],
      },
      {
        id: 'tea_tray', at: 'tea_tray', label: 'Tea tray', kind: 'look',
        views: [{ text: "A tray with a tea cosy, one cup, and a plate of thin bread and butter. The crusts are left on, because Dame Hesper says 'a problem ought to have edges'. The tray comes over from the Hall at four. The nurse does not make it." }],
      },
      {
        id: 'visitors_book', at: 'visitors_book', label: "Visitors' book", kind: 'look',
        views: [{
          text: "A visitors' book. A notice is pasted inside the cover: 'By order of the Deputy (the Warden): family only.'\n\nDame Hesper Lorimer has no family. Nobody has signed the book since March.",
          facts: ['no_visitors'],
        }],
      },
      {
        id: 'bookshelf_hesper', at: 'bookshelf_hesper', label: 'Her bookshelf', kind: 'look',
        views: [{ text: "Forty years of her collected puzzles, bound in the Company's blue cloth. Each book has a pencil inscription inside the front cover, and the pencil gets fainter along the shelf. The last book, 'Late Tithes, 2012 to 2023', has no inscription at all. Someone has put a pressed foxglove in it as a bookmark." }],
      },
      {
        id: 'photo_hall', at: 'photo_hall', label: 'Photograph', kind: 'look',
        views: [{
          text: "Setters' Hall, 1984. A woman in her thirties sits at a desk covered in paper. She is talking, and pointing at something with a pencil. Beside her, a young man of about twenty in a porter's waistcoat holds the page flat for her. He is not looking at the camera. He is reading the page.",
          facts: ['photo_1984'],
        }],
      },
      {
        id: 'night_latch', at: 'night_latch', label: 'The door', kind: 'look',
        views: [{
          text: "The door of number four. Every other door in the Almshouses squeaks loudly, but this one is silent. Its hinges and latch have been well oiled. The metal plate around the keyhole is rubbed shiny in a new place.",
          facts: ['oiled_latch'],
        }],
      },
    ],
  },

  // ----------------------------------------------------------- repository
  repository: {
    name: 'The Repository',
    sub: "Under Setters' Hall",
    map: [62, 45],
    arrive: "Nineteen steps down, under the Hall. Brick vaults hold six hundred years of paper. At the far end, a soft light shows where the Lectern is. It is cool down here, and the machines hum.",
    hotspots: [
      {
        id: 'lectern', at: 'lectern', label: 'The Lectern', kind: 'use', action: 'laptop',
        views: [{ text: "An oak reading desk on a stand, with a glowing screen set into its sloping top. This is the Lorimer Engine, a machine built from Dame Hesper's life's work. Ask it anything, and it answers in her voice." }],
      },
      {
        id: 'vitrines', at: 'vitrines', label: 'The Late Tithes', kind: 'use', action: 'puzzle:nina',
        views: [
          { if: 'puz:nina', text: 'A, R, I, A, D, N, E runs corner to corner through every one of them. Now you cannot stop seeing it. In twelve years, nobody else seems to have noticed.' },
          { text: "A row of brightly lit glass cases. THE LATE TITHES OF DAME HESPER LORIMER, 2012 to 2023. 'The crown of the Lorimer Legacy.' Each Tithe is a square of seven answers, filled in by the winner of that year's Proving. Beside each is a fair copy of the clues, a clean handwritten copy in a small, upright hand." },
        ],
      },
      {
        id: 'early_case', at: 'early_case', label: 'An early Tithe', kind: 'look',
        views: [{ text: "By the door, for comparison, is a Tithe from 1998. It is the same kind of square, with her own notes in the margins. Her handwriting is strong and impatient, and presses hard into the paper: 'No. Too easy. Again.'" }],
      },
      {
        id: 'jonah_desk', at: 'jonah_desk', label: "Jonah's desk", kind: 'look',
        views: [
          { if: 'told:jonah.j_memo', text: 'Jonah has turned the printout face up for you. It shows two separate groups of dots, with a line between them at one date.', ev: ['stylometry_memo'] },
          { text: "Three screens, a cold coffee, and a sleeping bag under the desk. A printout lies face down under the keyboard. One corner shows: 'STYLOMETRY. LORIMER CORPUS. Two clus'. Jonah clearly wants you to ask him about it, not read it yourself." },
        ],
      },
      {
        id: 'server', at: 'server', label: 'The Engine', kind: 'use', action: 'puzzle:ascii',
        views: [
          { if: 'puz:ascii', text: "The terminal is LODGE, in the Porter's Lodge. Most nights since March, from two till four, someone there has typed PLAY LECTURE 1987. The machine reads to anyone who asks." },
          { text: "Two black cabinets with green lights, blowing out warm air. This is the machine behind the oak Lectern. A log scrolls past on a small screen. Jonah says the Engine has never written an exam question for anyone: 'It's a reference desk. People keep forgetting that.'", facts: ['engine_log'] },
        ],
      },
      {
        id: 'rolls', at: 'rolls', label: 'The Rolls of the Company', kind: 'look',
        views: [
          {
            if: { any: ['fact:nina_ariadne', 'fact:word_ariadne', 'fact:epigraph_ariadne'] },
            text: "Every member of the Company since 1426, in heavy ledgers. You look for an Ariadne. In six hundred years, there is none.\n\nThere is no Fettle either, though a Fettle has worked at the Lodge since 1979. The Rolls list members of the Company, not its servants.",
            facts: ['not_in_rolls'],
          },
          { text: "The Rolls of the Company list every member since 1426, in big, heavy ledgers. Each entry gives a pen-name, a rank, and the year of their Proving." },
        ],
      },
      {
        id: 'waste_basket', at: 'waste_basket', label: 'A waste-paper basket', kind: 'look',
        views: [{
          text: "A wicker waste-paper basket, on display under glass.\n\n'The waste-paper basket of Dame Hesper Lorimer, 1972 to 2011, from which, it is said, more good clues were rescued than most setters ever write.'\n\nThe label does not say who rescued them.",
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
    arrive: "You climb a hundred and three stairs, and a ladder at the top. The Lantern is a round glass room on the roof of the Hall. In the middle turns the Founder's Orrery, a brass model of the planets. Below you, the whole of Ravel is lit up in the rain.",
    hotspots: [
      {
        id: 'grille_lock', at: 'grille_lock', label: 'The lock on the grille', kind: 'use', action: 'puzzle:grille',
        views: [
          { if: 'puz:grille', text: 'The gate is open. The rings read A-R-I-A-D-N-E. Nobody will change them now.' },
          { text: "The Orrery stands inside an iron grille. The grille's gate is locked with a seven-ring letter-lock. The Warden is trapped inside." },
        ],
      },
      {
        id: 'orrery', at: 'orrery', label: "The Founder's Orrery", kind: 'look',
        views: [{ text: "Brass planets on brass arms turn around a glass sun. The sun was last lit in 1911. The Warden winds the Orrery on the night of the Proving. Nobody comes up here for any other reason, and everyone in the Hall knows what time he does it." }],
      },
      {
        id: 'proving_desk', at: 'proving_desk', label: 'A desk and a paper', kind: 'look',
        views: [{ text: "A candidate's desk, carried up from the Hall. On it is a sheet in green ink: 'PAPER FOR THE WARDEN. One question. The gate opens to one name. It is in everything you sold.' The Warden has written nothing on it." }],
      },
      {
        id: 'hob_clock', at: 'hob_clock', label: 'The clock', kind: 'look',
        views: [{ text: 'The Hall clock, or a portable copy of it, with two minute hands. The black hand, for Fold Time, is almost at twelve.' }],
      },
      {
        id: 'lantern_lamp', at: 'lantern_lamp', label: 'Lamp', kind: 'look',
        views: [{ text: "A storm lamp on the floor, turned down low. By its light you can see the Porter's shoes. As always, they are perfectly clean." }],
      },
      {
        id: 'stair_door', at: 'stair_door', label: 'The stair', kind: 'look',
        views: [{ text: 'The stairs you came up. Beside them is a second, smaller door, used by the man who winds the clocks.' }],
      },
    ],
  },
};
