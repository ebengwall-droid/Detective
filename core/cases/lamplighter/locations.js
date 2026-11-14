// Places, and what can be examined in them.
//
// A hotspot is attached to a prop in scenes.js (`at`) or to a point (`p`,
// `size`). `views` are tried in order and the first whose `if` holds is used,
// so the same object can read differently as the case moves on. Each view
// pays out its facts / evidence / effects once.
//
// kind: look | take | use | exit   (drives the icon and the verb on screen)

export const LOCATIONS = {
  // ------------------------------------------------------------- precinct
  precinct: {
    name: 'Harbour Precinct',
    sub: 'Detective Bureau, third floor',
    map: [36, 30],
    start: true,
    arrive: 'Harbour Precinct, third floor. The Detective Bureau smells of wet coats and old paper.',
    hotspots: [
      {
        id: 'laptop', at: 'laptop', label: 'Your laptop', kind: 'use', action: 'laptop',
        views: [{ text: 'HARBORNET. Records, the lab queue, your mail.' }],
      },
      {
        id: 'board', at: 'board', label: 'Case board', kind: 'use', action: 'board',
        views: [{ text: 'The case board. Everything you know, and the holes between.' }],
      },
      {
        id: 'inbox', at: 'inbox', label: 'In-tray', kind: 'look',
        views: [
          { if: 'flag:letter_waiting', text: "An envelope that wasn't there before. Plain, unstamped, DETECTIVE typed across the front. Nobody in the room is looking at you.", effects: [{ call: 'takeLetter' }], repeat: true },
          { text: 'Your in-tray. Requisition forms and a welcome memo nobody signed.' },
        ],
      },
      {
        id: 'my_desk', at: 'my_desk', label: 'Your desk', kind: 'look',
        views: [{ text: "Desk 3. Yours since Monday. Someone left a ring of coffee on it and a drawer full of someone else's paperclips." }],
      },
      {
        id: 'vance_typewriter', at: 'vance_typewriter', label: "Vance's typewriter", kind: 'look',
        views: [{
          text: "An old Corvin portable, grey enamel worn to the metal at the corners. Vance types her reports on it; she says the terminals lose things. There's a requisition in the roller. Every lowercase e on the page hangs a hair below its line.",
          facts: ['corvin_e'],
        }],
      },
      {
        id: 'vance_desk', at: 'vance_desk', label: "Vance's desk", kind: 'look',
        views: [
          { if: 'ev:drawer_contents', text: 'You have put everything back exactly as it lay. Your hands were not quite steady doing it.' },
          {
            if: 'flag:vance_out',
            text: "Vance's desk, and Vance across town at Eastgate for another hour. The top drawer is locked. It's the kind of lock you open with a paperclip, and you have a drawer full of paperclips.\n\nInside: a printed tide table for Marrow Point, with one line ringed in pencil — the 14th, 03:05. An oilcloth roll of steel number punches, bright brass filings caught in the grooves. And a sheet from the Corvin, half typed: 'CONFESSION OF DESMOND HALE. I, being of sound mind, declare that I am the man the newspapers call—'",
            ev: ['drawer_contents'],
          },
          { text: "Vance's desk. Squared-off stacks, a cold mug, the Corvin. The top drawer is locked, and its owner is ten feet away." },
        ],
      },
      {
        id: 'drug_locker', at: 'drug_locker', label: 'Drug locker', kind: 'look',
        views: [
          { if: 'ev:drug_page', text: 'Eighteen ampoules where the book once said twenty-four.' },
          {
            if: { any: ['fact:sedative_morvane', 'fact:ampoule_cap'] },
            text: "The controlled-drugs locker, and the book chained to it. Seizure 19-0443: Morvane, twenty-four ampoules. You run a finger down the column.\n\n20 September. Six out. 'For destruction. Auth: Capt. D. Hale.' No certificate clipped to the page. And the entry is in neat block capitals. Every other line in the Captain's name, back to 2019, is a sloping scrawl.",
            ev: ['drug_page'],
          },
          { text: 'A steel locker inside the evidence cage, with a ledger on a chain. Controlled drugs. Nothing in this case points here. Yet.' },
        ],
      },
      {
        id: 'evidence_shelves', at: 'evidence_shelves', label: 'Evidence shelves', kind: 'look',
        views: [{
          text: 'Rows of archive boxes. One on the bottom shelf is water-stained and labelled CALLIOPE — COURT OF INQUIRY — SEALED BY ORDER. The wax seal on its lid is glossy and new.',
          facts: ['box_resealed'],
        }],
      },
      {
        id: 'petrel_photo', at: 'petrel_photo', label: 'Framed photograph', kind: 'look',
        views: [{
          text: "A police launch at a quay, five men in oilskins squinting at the camera. The mount is lettered in white ink: PETREL — Harbour Police No. 2 launch. Sgt D. HALE, cox'n. The young sergeant in the middle has the Captain's jaw and none of his weight.",
          facts: ['hale_cox'],
        }],
      },
      {
        id: 'hale_tunic', at: 'hale_tunic', label: 'Coat-stand', kind: 'look',
        views: [
          {
            if: 'fact:button_found',
            text: "The Captain's dress tunic, on the stand since the Mayor's dinner. Brass buttons with the fouled anchor. The second from the top is gone. Four thread ends stand up from the cloth, cut off square. Nobody loses a button like that. Somebody used scissors.",
            facts: ['tunic_missing'],
          },
          { text: "A coat-stand: the Captain's raincoat, his hat, and a dress tunic in a cleaner's wrapper pushed up to the collar." },
        ],
      },
      {
        id: 'hale_desk', at: 'hale_desk', label: "The Captain's desk", kind: 'look',
        views: [
          { if: 'ev:token_hale', text: 'The token lies on the blotter where he put it. 03:05. Neither of you has moved it.' },
          { text: "A blotter, a telephone, an ashtray he isn't supposed to have. The right-hand drawer is locked, and he keeps a hand near it." },
        ],
      },
      {
        id: 'coffee', at: 'coffee', label: 'Coffee', kind: 'look',
        views: [{ text: 'It has been on the ring since the night shift. It tastes like a confession.' }],
      },
      {
        id: 'bench', at: 'bench', label: 'Bench', kind: 'look',
        views: [{ text: 'The bench where people wait to be believed.' }],
      },
      { id: 'exit', at: 'exit', label: 'Leave the bureau', kind: 'exit', action: 'map', views: [{ text: '' }] },
    ],
  },

  // ------------------------------------------------- 9 Gull Street, study
  brook_house: {
    name: '9 Gull Street',
    sub: "Leland Brook's study",
    map: [60, 17],
    start: true,
    arrive: '9 Gull Street. A tall thin house on the hill. From the study you can see the whole harbour, and the dark place where the light used to be.',
    hotspots: [
      {
        id: 'armchair', at: 'armchair', label: 'The armchair', kind: 'look',
        views: [{
          text: 'A wing chair in oxblood leather, turned toward the window. Tape marks where his head rested. The collar of the antimacassar is stiff and white-edged: salt. Whatever soaked him, it was not rain.',
          facts: ['chair_salt'],
        }],
      },
      {
        id: 'lantern_brook', at: 'lantern_brook', label: 'The lantern', kind: 'take',
        views: [{
          text: "A storm lantern on the table in the window, still burning; Brandt hasn't had the heart to put it out. Brass, well kept. The base is stamped FENN & DAUGHTER · LAMP ROW · GREYHAVEN, and the wick is trimmed to a neat forked tail.\n\nFrom here the window looks straight down the harbour to the black gap at Marrow Point.\n\nHanging from the bail on a loop of wire: a brass disc. VALE LINES · NIGHT FERRY · ONE PASSAGE. And on the back, punched in a digit at a time: 01:55.",
          ev: ['lantern_brook', 'token_0155'],
          facts: ['lantern_window'],
          effects: [{ unlock: 'lamp_shop' }],
        }],
      },
      {
        id: 'stain', at: 'stain', label: 'Wet carpet', kind: 'look', size: [1.2, 0.3, 1.2],
        views: [{
          text: "The carpet by the hearth is dark and squelching. You crouch. A white tidemark is drying at the edge, and in the middle of the wet there's a ring pressed into the pile, a foot across. Something heavy and full stood here.",
          facts: ['seawater_floor'],
        }],
      },
      {
        id: 'basin', at: 'basin', label: 'Washstand', kind: 'look',
        views: [{
          text: 'A washstand that belongs in the hall, carried in here. The china basin has been wiped dry and set back on it. One frond of kelp, the length of your finger, is stuck under the rim.',
          facts: ['basin_used'],
        }],
      },
      {
        id: 'grate', at: 'grate', label: 'The grate', kind: 'take',
        views: [{
          text: "A cold grate. He burned paper here recently: curled black sheets, and one corner the fire missed. Brook's hand, a broad nib:\n\n'Desmond — it has come for me too. 01:55. If you had not turned back—'",
          ev: ['burnt_letter'],
        }],
      },
      {
        id: 'desk_brook', at: 'desk_brook', label: "Brook's desk", kind: 'look',
        views: [{
          text: "A harbour master's desk: tide tables, a paperweight shaped like a bollard. In the top drawer an envelope, slit open and empty, no bigger than your palm. Postmark Greyhaven, 30 September. No letter was ever in it. There's a round dent pressed into the paper.",
          facts: ['token_posted'],
        }],
      },
      {
        id: 'phone_brook', at: 'phone_brook', label: 'Telephone', kind: 'look', size: [0.4, 0.3, 0.4],
        views: [{
          text: "A black telephone and a pad beside it. He pressed hard; the last number is embossed three sheets down. Greyhaven 4-1100. That is the Harbour Precinct: the Captain's direct line. Dated the 8th, and underneath: 'again 6 pm'.",
          facts: ['brook_called_hale'],
        }],
      },
      {
        id: 'ship_model', at: 'ship_model', label: 'Model ship', kind: 'look',
        views: [{ text: 'A model under glass, a foot and a half long: a white ferry with a red funnel. The plate reads S.F. CALLIOPE — VALE LINES. Somebody has kept the glass spotless.' }],
      },
      {
        id: 'chart_wall', at: 'chart_wall', label: 'Harbour chart', kind: 'look',
        views: [{ text: 'A harbour chart, framed. Somebody has pencilled a small cross on the rocks off Marrow Point, and gone over it so many times the paper has worn through.' }],
      },
      {
        id: 'bureau', at: 'bureau', label: 'Bureau', kind: 'take',
        views: [
          { if: 'ev:cashbox', text: 'The bureau. The cash box is bagged and tagged.' },
          {
            text: "A bureau with the flap down. A japanned cash box labelled HOUSEKEEPING in Brook's hand, and his pocket ledger beside it: 'drew £400, 9th.' You count what is in the box. Sixty.",
            ev: ['cashbox'],
          },
        ],
      },
      {
        id: 'garden_door', at: 'garden_door', label: 'Garden door', kind: 'look',
        views: [
          {
            if: 'act>=2',
            text: 'The garden door. Brandt sealed it with tape across the jamb on the eleventh. This tape is new. Under it the old strip has been sliced through and pressed back down. Whoever came in this way had a roll of police tape in their pocket.',
            facts: ['seal_broken'],
          },
          { text: 'The door to the garden. Locked, and bolted on the inside. Nobody came in this way.' },
        ],
      },
      {
        id: 'tunic_button', at: 'tunic_button', label: 'Something under the chair', kind: 'take', size: [0.3, 0.2, 0.3],
        if: ['act>=2', '!ev:tunic_button'],
        views: [{
          text: 'Brass, catching the floodlight. A uniform button with a fouled anchor on it, lying in plain sight under the front rail of the armchair.\n\nYou looked under this chair yesterday.',
          ev: ['tunic_button'],
        }],
      },
      { id: 'exit', at: 'exit', label: 'Leave', kind: 'exit', action: 'map', views: [{ text: '' }] },
    ],
  },

  // --------------------------------------------------------------- morgue
  morgue: {
    name: 'County Mortuary',
    sub: 'Examination room',
    map: [20, 20],
    start: true,
    arrive: 'County Mortuary. The basement is the only warm room in the building, and nobody thanks it.',
    hotspots: [
      {
        id: 'table_brook', at: 'table_brook', label: 'Leland Brook', kind: 'look',
        views: [{ text: "Leland Brook, seventy-four, under a sheet. A paper tag on the toe. You lift a corner: an old man's hands, clean nails, no cuts. He didn't fight." }],
      },
      {
        id: 'table_vale', at: 'table_vale', label: 'Second table', kind: 'look',
        views: [
          { if: 'act>=2', text: "Conrad Vale. Even dead he looks expensive. The knuckles of the right hand are split, and the fingers are still half curled around something that isn't there any more." },
          { text: 'An empty table, hosed down and waiting. They always fill.' },
        ],
      },
      {
        id: 'report_brook', at: 'report_brook', label: "Okoro's reports", kind: 'take',
        views: [
          { if: ['act>=2', '!ev:autopsy_vale'], text: "Two reports on the clipboard now. Brook's, and under it, still warm from the typewriter, Conrad Vale's. You read them standing up.", ev: ['autopsy_brook', 'autopsy_vale'] },
          { if: '!ev:autopsy_brook', text: "Okoro's clipboard: the post-mortem on Leland Brook, typed and signed. You read it standing up.", ev: ['autopsy_brook'] },
          { text: 'The reports. You have copies.' },
        ],
      },
      {
        id: 'lockers', at: 'lockers', label: 'Cold lockers', kind: 'look',
        views: [
          { if: { any: ['fact:pell_lodger', 'fact:pell_first'] }, text: "Twelve steel doors. One card, not yet taken down: PELL, A. — RELEASED FOR CREMATION 26 SEPT. So there is no body to look at. Only whatever the mortuary kept." },
          { text: 'Twelve steel doors, cold to the touch. Most of the card slots are empty.' },
        ],
      },
      {
        id: 'fridge', at: 'fridge', label: 'Specimen fridge', kind: 'look',
        views: [
          { if: 'job:pell_retest', text: "Pell's retained samples, relabelled in Okoro's hand: SEAWATER. MORVANE +. Three weeks in the cold, waiting for somebody to ask." },
          { text: 'Racks of labelled vials behind glass. Routine retained samples: thirty days for every unattended death in the county.' },
        ],
      },
      { id: 'lightbox', at: 'lightbox', label: 'X-ray viewer', kind: 'look', views: [{ text: 'Two chest films on the viewer. Lungs like wet sponge.' }] },
      { id: 'sink', at: 'sink', label: 'Sink', kind: 'look', views: [{ text: 'Steel, scrubbed until it squeaks. A row of jars on the splashback, each holding a few ounces of cloudy water with a name on it.' }] },
      { id: 'exit', at: 'exit', label: 'Leave', kind: 'exit', action: 'map', views: [{ text: '' }] },
    ],
  },

  // ------------------------------------------------------------ lamp shop
  lamp_shop: {
    name: 'Fenn & Daughter',
    sub: 'Lamp Row',
    map: [27, 46],
    arrive: 'Lamp Row. Fenn & Daughter is the last shop on the street with its sign still lit.',
    hotspots: [
      {
        id: 'lantern_rack', at: 'lantern_rack', label: 'Shelves of lanterns', kind: 'look',
        views: [{ text: "Storm lanterns by the dozen, brass and tin. A card on the shelf: ALDOUS No. 4 — OUR OWN PATTERN. It's the lamp from Gull Street, forty times over." }],
      },
      {
        id: 'workbench', at: 'workbench', label: 'Workbench', kind: 'look',
        views: [{
          text: "A lamp-maker's bench: snips, a soldering iron, a vise. He has been trimming wicks. There's a row of them, and every tail is ragged. The hand that cut these was shaking.",
          facts: ['fenn_tremor'],
        }],
      },
      {
        id: 'punches', at: 'punches', label: 'Number punches', kind: 'look', size: [0.5, 0.3, 0.4],
        views: [{
          text: 'An oilcloth roll of steel punches, letters and the ten numerals, for striking a maker\'s mark into brass. The numerals are dull with dust. Nobody has had these out in months.',
          facts: ['fenn_punches'],
        }],
      },
      {
        id: 'token_jar', at: 'token_jar', label: 'Jar of tokens', kind: 'look', size: [0.35, 0.4, 0.35],
        views: [{
          text: "A sweet jar on the counter, a third full of brass discs. A label in faded ink: 'CALLIOPE — 31 — from the Line.' You tip them out and count. Twenty-seven.",
          facts: ['jar_short', 'calliope_known'],
        }],
      },
      {
        id: 'ledger', at: 'ledger', label: 'Sales ledger', kind: 'take',
        views: [{
          text: "The sales ledger, a broad book in copperplate. You turn back through the year.\n\n9 March: '4 × Aldous No. 4, trimmed & filled — cash — (for a memorial).'\n\nNo name. Every other cash sale in the book has a name.",
          ev: ['ledger_entry'],
        }],
      },
      {
        id: 'photo_lucy', at: 'photo_lucy', label: 'Photograph', kind: 'look',
        views: [{
          text: "A photograph in a brass frame, hung where he can see it from the bench. A girl of ten or eleven on Customs Quay, squinting, gap-toothed, furious at being made to stand still. Round her neck, on a chain, a brass bosun's whistle. On the mount: Lucy, aged 11.",
          facts: ['lucy_photo', 'fenn_lost_family'],
        }],
      },
      {
        id: 'newspaper', at: 'newspaper', label: 'Newspaper', kind: 'look', size: [0.5, 0.3, 0.5],
        if: 'act>=3',
        views: [{
          text: "Yesterday's Ledger, folded to the front page: DETECTIVES AT GULL STREET. A photograph of you on the step, and Vance beside you with her collar open.\n\nHe has taken a pencil and drawn a ring on the picture. Not round a face. Round the whistle at her throat.",
          facts: ['fenn_newspaper'],
        }],
      },
      {
        id: 'counter', at: 'counter', label: 'Counter', kind: 'look',
        views: [{ text: "A shop counter worn pale where forty years of elbows have rested. Above the door the sign reads FENN & DAUGHTER. The '& DAUGHTER' is in a brighter gilt than the rest. It was added later." }],
      },
      { id: 'exit', at: 'exit', label: 'Leave', kind: 'exit', action: 'map', views: [{ text: '' }] },
    ],
  },

  // --------------------------------------------------------------- tavern
  tavern: {
    name: 'The Anchor & Lamp',
    sub: 'Customs Quay',
    map: [45, 49],
    arrive: 'The Anchor & Lamp, Customs Quay. The clock over the bar says 2:31. It always does.',
    hotspots: [
      {
        id: 'plaque', at: 'plaque', label: 'Memorial', kind: 'look',
        views: [{
          text: "A brass plate the height of a child. S.F. CALLIOPE. 02:31. Thirty-one names. You find FENN twice: M., and L.\n\nBelow the names, one line: THE LIGHT WAS DARK.\n\nA lantern burns on the shelf underneath. Somebody trims it every day.",
          facts: ['memorial_0231', 'calliope_known', 'fenn_lost_family'],
        }],
      },
      { id: 'lifebuoy', at: 'lifebuoy', label: 'Lifebuoy', kind: 'look', views: [{ text: 'A cork lifebuoy over the fire, the paint gone to scabs. You can just read the stencil: CALLIOPE · GREYHAVEN.' }] },
      { id: 'photo_ferry', at: 'photo_ferry', label: 'Photograph', kind: 'look', views: [{ text: 'The Calliope alongside at Customs Quay on a summer evening, her rail crowded. Everyone is waving at whoever held the camera.' }] },
      {
        id: 'stairs', at: 'stairs', label: 'Stairs', kind: 'exit',
        views: [
          { if: 'flag:pell_key', text: '', action: { travel: 'pell_room' }, repeat: true },
          { text: 'Stairs to the lodgers\' rooms. A chain across, and a card: PRIVATE. Bess has the key.' },
        ],
      },
      { id: 'snug', at: 'snug', label: "Strand's table", kind: 'look', views: [{ text: "Strand's corner: a portable typewriter, three notebooks, a glass that has ringed the table. He has written LAMPLIGHTER on a beer mat and underlined it twice." }] },
      { id: 'bar', at: 'bar', label: 'The bar', kind: 'look', views: [{ text: 'Mahogany, brass rail, forty years of rings. The till is older than you are.' }] },
      { id: 'exit', at: 'exit', label: 'Leave', kind: 'exit', action: 'map', views: [{ text: '' }] },
    ],
  },

  // ----------------------------------------------------------- Pell's room
  pell_room: {
    name: "Pell's room",
    sub: 'Above the Anchor & Lamp',
    map: null,
    parent: 'tavern',
    arrive: 'The top room. Nobody has opened the window since they carried him down.',
    hotspots: [
      {
        id: 'tin_bath', at: 'tin_bath', label: 'Tin bath', kind: 'look',
        views: [{
          text: "A zinc hip bath in the middle of the boards. This is where he was. It's dry now. Round the inside, a hand's width below the rim, runs a line of white crust. You wet a finger and taste it.\n\nSalt.",
          facts: ['bath_salt'],
        }],
      },
      {
        id: 'lantern_pell', at: 'lantern_pell', label: 'Lantern on the sill', kind: 'take',
        views: [{
          text: 'A storm lantern on the sill, long burned out, a brown crust of spent oil in the glass. Fenn & Daughter on the base.\n\nAnd on the bail, where nobody thought to look, because of course an old keeper keeps a lamp: a brass token. 01:10.',
          ev: ['token_0110'],
        }],
      },
      {
        id: 'can_ring', at: 'can_ring', label: 'Mark on the floor', kind: 'look', size: [0.8, 0.3, 0.8],
        views: [{
          text: 'A ring of rust on the boards, a foot across, with a spray of dried white round it. Someone set down a wet steel can here and left it long enough to mark the wood.',
          facts: ['can_ring'],
        }],
      },
      {
        id: 'bed', at: 'bed', label: 'Under the bed', kind: 'take',
        views: [{
          text: 'An iron bedstead. You go down on one knee and put the torch under it. Dust, a boot, and against the skirting where it rolled: a red plastic cap, the snap-off kind, MORVANE embossed on the top.',
          ev: ['ampoule_cap'],
        }],
      },
      {
        id: 'floorboard', p: [1.25, 0.05, 0.55], size: [0.7, 0.25, 0.5], label: 'Loose floorboard', kind: 'take',
        views: [{
          text: 'One board by the bed does not sit flush. It lifts on the first try; he had it out often. Underneath, an oilcloth packet: a keeper\'s logbook, and a roll of twenty-year-old banknotes.',
          ev: ['pell_logbook'],
        }],
      },
      {
        id: 'table_pell', at: 'table_pell', label: 'Table', kind: 'look',
        views: [{
          text: 'A deal table. A rum bottle on its side, a glass, a pile of post he never opened, and one envelope he did: palm-sized, postmarked 28 August, nothing in it now.',
          facts: ['pell_token_post'],
        }],
      },
      { id: 'exit', at: 'exit', label: 'Back downstairs', kind: 'exit', views: [{ text: '', action: { travel: 'tavern' }, repeat: true }] },
    ],
  },

  // ---------------------------------------------------------------- yacht
  vale_yacht: {
    name: 'The Second Wind',
    sub: 'Berth 14, Customs Quay marina',
    map: [57, 55],
    arrive: 'Customs Quay marina, berth 14. The Second Wind sits very still for a boat in this weather.',
    hotspots: [
      {
        id: 'body_vale', at: 'body_vale', label: 'Conrad Vale', kind: 'look',
        views: [{ text: 'Conrad Vale under a sheet on the saloon floor, waiting for the mortuary van. Brandt says he was sitting at the table when they came aboard, set back in his seat with his hands in his lap. The carpet under the table is wet through.' }],
      },
      {
        id: 'lantern_vale', at: 'lantern_vale', label: 'The lantern', kind: 'take',
        views: [{
          text: 'A storm lantern hung from the deckhead beam, burning steadily, swinging a little with the boat. The same pattern, the same forked wick.\n\nOn the bail, a brass token. 02:31.',
          ev: ['token_0231'],
        }],
      },
      {
        id: 'glasses', at: 'glasses', label: 'Two glasses', kind: 'look', size: [0.5, 0.3, 0.4],
        views: [{ text: 'Two tumblers and the good whisky. One glass drunk, one untouched. He poured for a guest.', facts: ['vale_let_in'] }],
      },
      {
        id: 'chain_link', at: 'chain_link', label: 'Evidence bag', kind: 'take', size: [0.35, 0.25, 0.35],
        views: [{
          text: "An evidence bag on the chart table, Brandt's initials across the seal. One link of fine brass chain. 'Had to open his fingers to get it,' Brandt says.",
          ev: ['chain_link'],
        }],
      },
      {
        id: 'phone_vale', at: 'phone_vale', label: 'Ship-to-shore telephone', kind: 'look', size: [0.4, 0.3, 0.4],
        views: [{
          text: "The ship-to-shore handset. Brandt has already pulled the list. One call out last night: 22:40, four minutes. Greyhaven 4-1100.\n\nThe Captain's line.",
          facts: ['vale_called_hale'],
        }],
      },
      {
        id: 'safe', at: 'safe', label: 'Safe', kind: 'take',
        views: [{
          text: 'A small safe bolted to the bulkhead, door open. Wiped: not a print, not a smear. But the shelf inside has a week of dust on it, and in the dust there is a clean oblong, five inches by three. Something sat there until very recently.',
          ev: ['safe_dust'],
        }],
      },
      { id: 'galley', at: 'galley', label: 'Galley sink', kind: 'look', views: [{ text: 'The galley sink is brim-full. You dip a finger: cold, and salt. A strand of kelp turns slowly in it.' }] },
      {
        id: 'wet_prints', at: 'wet_prints', label: 'Wet prints', kind: 'look', size: [0.9, 0.3, 0.9],
        views: [{ text: 'Wet prints drying on the companionway treads, coming down and going up. You lay your own boot beside one. It is half the size.', facts: ['small_boots'] }],
      },
      {
        id: 'chart_table', at: 'chart_table', label: 'Chart table', kind: 'look',
        views: [{ text: "A chart of the harbour approaches, and across it a roll of architect's drawings: CUSTOMS QUAY REDEVELOPMENT — VALE HARBOUR. On the sheet for Marrow Point someone has written DEMOLISH and initialled it C.V." }],
      },
      { id: 'exit', at: 'exit', label: 'Go ashore', kind: 'exit', action: 'map', views: [{ text: '' }] },
    ],
  },

  // ----------------------------------------------------------- lighthouse
  lighthouse: {
    name: 'Marrow Point Light',
    sub: 'The lantern room',
    map: [86, 62],
    arrive: 'Marrow Point. Ninety-one steps, and the wind trying every one of them.',
    hotspots: [
      { id: 'lens', at: 'lens', label: 'The great lens', kind: 'look', views: [
        { if: 'flag:light_relit', text: 'The lens turns. For the first time in twenty years there is a light at Marrow Point.' },
        { text: 'The lens of Marrow Point, taller than a man, a beehive of glass in a brass cage. It has not turned in twenty years.' },
      ] },
      { id: 'lantern_four', at: 'lantern_four', label: 'The fourth lantern', kind: 'look', views: [{ text: 'The fourth lantern, burning on the boards. On the bail, the last token. 03:05.' }] },
      { id: 'jerrycan', at: 'jerrycan', label: 'Steel can', kind: 'look', views: [{ text: 'A steel jerry can, wet to the shoulder. The sea is sixty feet straight down and she has carried it up every step.' }] },
      { id: 'exit', at: 'exit', label: 'The stairs down', kind: 'exit', views: [
        { if: 'flag:finale_done', text: '', action: 'map', repeat: true },
        { text: 'Not yet. Not while there are two people in this room and one lantern.' },
      ] },
    ],
  },
};
