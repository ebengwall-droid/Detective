// The spine of The Lamplighter: acts, story beats, objectives, deductions,
// the accusation, the finale at the lighthouse, and the endings.
//
// Free-form conversation and the director's letters are improvised by the
// model at run time. Everything here is fixed, so that however the player
// wanders the case always stays solvable and always reaches its end.

export const META = {
  id: 'lamplighter',
  title: 'The Lamplighter',
  series: 'Greyhaven',
  tagline: 'Four lights for four men who let the dark in.',
  city: 'Greyhaven',
  killerName: 'the Lamplighter',
};

/** What every character in town knows. Goes into every character prompt. */
export const WORLD = `Greyhaven is a rain-soaked harbour town. The time is the present day, mid-October, though the town feels decades older: rotary telephones, typewriters, oilskins, a newspaper called the Ledger.

The player is a police detective, new to Greyhaven (their fourth day), posted to the Harbour Precinct's Detective Bureau under Captain Desmond Hale and partnered with Detective Sergeant Nora Vance.

Common knowledge in town:
- Twenty years ago this week, on 14 October at 02:31, the night ferry Calliope (Vale Lines) struck the rocks called the Teeth off Marrow Point. The lighthouse was dark. Thirty-one of the fifty-eight aboard died. An inquiry found "mechanical failure of the lamp; no person culpable". There is a brass memorial in the Anchor & Lamp tavern on Customs Quay.
- Conrad Vale owned the ferry line; he is now the town's biggest developer and wants to demolish the old lighthouse.
- Tobias Fenn, the lamp-maker on Lamp Row ("Fenn & Daughter"), lost his wife Marian and his daughter Lucy, aged 11, on the Calliope.
- On the morning of 11 October the retired harbour master Leland Brook, 74, was found dead in his study at 9 Gull Street with a lit storm lantern in the window. The Ledger's reporter Milo Strand has named the killer "the Lamplighter".`;

export const ACTS = {
  1: {
    title: 'A Light in the Window',
    date: '11 October',
    card: [
      'Greyhaven. It has been raining since Tuesday.',
      'You are the new detective at the Harbour Precinct. This is your fourth day.',
      'At a quarter past seven this morning a housekeeper let herself into 9 Gull Street and found her employer dead in his armchair.',
      'There was a lantern burning in the window.',
    ],
  },
  2: {
    title: 'Second Wind',
    date: '12 October · 05:40',
    card: [
      'The telephone, in the dark.',
      'Customs Quay marina. A night-watchman has seen a lamp burning in the saloon of a yacht called the Second Wind.',
      'Her owner is Conrad Vale. He is sitting at his own table with his hands in his lap.',
      'That makes two.',
    ],
  },
  3: {
    title: 'The Wrong Man',
    date: '13 October · 07:10',
    card: [
      'A grey morning. The Ledger has run out of adjectives.',
      'On the bench outside the Detective Bureau an old man is sitting with his hat in his hands.',
      'It is Tobias Fenn, the lamp-maker.',
      'He says he has come to confess.',
    ],
  },
  4: {
    title: 'Five Past Three',
    date: '14 October · 02:20',
    card: [], // written at run time from how act three ended
  },
};

/** How act four opens, depending on what tipped it. */
export const ACT4_CARDS = {
  exposed: [
    'She went out through the bureau without her hat.',
    "Twenty minutes later you find the Captain's cane lying in the rain by the car-park barrier. Car 7 is gone.",
    'It is the fourteenth of October. Twenty years to the night.',
    'There is only one place this ends.',
  ],
  vance_strong: [
    'Hale hears you out without a word. Then he sends for Sergeant Vance.',
    'Her desk is empty. Her coat is gone. So, when you turn round, is the Captain.',
    'You find his cane lying in the rain by the car-park barrier. Car 7 is gone.',
    'It is the fourteenth of October. There is only one place this ends.',
  ],
  vance_weak: [
    "Hale will not hear it. 'On this? No.' He calls Vance in to clear it up, and she does, in four calm sentences, and smiles at you on her way out.",
    'Past two in the morning the desk rings. The Captain never got home. His cane is lying by the car-park barrier, and car 7 is gone.',
    'It is the fourteenth of October.',
    'She knows that you know. There is only one place this ends.',
  ],
  fenn: [
    'Tobias Fenn is charged at noon. He thanks the desk sergeant. The Commissioner telephones his congratulations; the Ledger sets it in forty-point.',
    'You do not sleep.',
    "Past two in the morning the desk rings. The Captain never got home. His cane is lying in the rain by the car-park barrier, and car 7 is gone.",
    'Four lights. You have only found three. And there is only one place the fourth would burn.',
  ],
  hale: [
    'The Commissioner suspends Captain Hale by telephone. Hale puts his badge on your desk without a word and limps out into the rain.',
    'You do not sleep.',
    "Past two in the morning the desk rings. Hale never got home. His cane is lying by the car-park barrier, and car 7 is gone.",
    'A guilty man does not leave his cane behind. Somebody took him. And there is only one place they would go.',
  ],
  timeout: [
    'Midnight comes and goes over your notes.',
    'Past two in the morning the desk rings. The Captain never got home. His cane is lying in the rain by the car-park barrier, and car 7 is gone.',
    'It is the fourteenth of October. Twenty years to the night.',
    'Four lights. There is only one place the fourth would burn.',
  ],
};

// --------------------------------------------------------------- beats
// Evaluated after every action; each fires once.

export const BEATS = [
  { id: 'start', when: true, do: [{ unlock: 'precinct' }, { unlock: 'brook_house' }, { unlock: 'morgue' }] },
  { id: 'unlock_shop', when: 'fact:lantern_maker', do: [{ unlock: 'lamp_shop' }] },
  { id: 'unlock_tavern', when: { any: ['fact:calliope_known', 'fact:fenn_lost_family'] }, do: [{ unlock: 'tavern' }] },
  { id: 'saw_lantern', when: 'examined:lantern_brook', do: [{ mark: 'saw_lantern' }] },
  {
    id: 'letter1',
    when: ['act:1', { stepsSince: 'saw_lantern', n: 10 }],
    do: [{ letter: 1 }],
  },
  { id: 'act2_open', when: 'act>=2', do: [{ unlock: 'vale_yacht' }] },
  { id: 'saw_vale', when: 'examined:lantern_vale', do: [{ mark: 'saw_vale' }] },
  { id: 'letter2', when: ['act:2', { stepsSince: 'saw_vale', n: 9 }], do: [{ letter: 2 }] },
  { id: 'pell_room_open', when: 'flag:pell_key', do: [{ unlock: 'pell_room' }] },
  { id: 'act3_open', when: 'act>=3', do: [{ flag: 'vance_out' }] },
  { id: 'letter3', when: ['act:3', { stepsSince: 'act3', n: 7 }], do: [{ letter: 3 }] },
  {
    id: 'vance_back',
    when: ['act:3', 'flag:vance_out', { stepsSince: 'act3', n: 20 }],
    do: [{ flag: 'vance_out', value: false }, { notify: 'Vance is back from Eastgate, with Fenn\'s custody sheet in her hand.' }, { ev: 'custody_record' }],
  },
  { id: 'drawer_wary', when: ['ev:drawer_contents', '!flag:vance_out'], do: [{ flag: 'vance_wary' }] },
  { id: 'act4_exposed', when: ['flag:vance_exposed', 'act<=3'], do: [{ act: 4, card: 'exposed' }] },
  { id: 'act4_accused', when: ['flag:accused', 'act<=3'], do: [{ act: 4, card: '$verdict' }] },
  
  { id: 'act4_open', when: 'act>=4', do: [{ unlock: 'lighthouse' }, { flag: 'vance_out', value: false }] },
];

// ---------------------------------------------------------- objectives
// `hints` run from a nudge to plain instruction; the inner voice uses them.

export const OBJECTIVES = [
  // Act one
  {
    id: 'o_scene', text: 'Examine the study at 9 Gull Street', if: true,
    done: ['examined:lantern_brook', { min: 3, of: ['examined:armchair', 'examined:stain', 'examined:grate', 'examined:basin', 'examined:desk_brook', 'examined:phone_brook', 'examined:bureau'] }],
    hints: [
      'A room where a man died will tell you how, if you look at all of it. Start with what the killer wanted seen.',
      'Go to 9 Gull Street. Examine the lantern in the window first, then everything with a marker beside it, then everything without.',
    ],
  },
  {
    id: 'o_witness', text: 'Question the housekeeper and the scene officer', if: 'visited:brook_house',
    done: ['met:dray', 'met:brandt'],
    hints: ['Two living people were in that house before you. Hear them both.', 'Talk to Officer Brandt and to Agnes Dray at Gull Street. Ask Brandt whether the neighbours saw anything.'],
  },
  {
    id: 'o_autopsy', text: 'Hear the autopsy from Dr Okoro', if: true,
    done: 'fact:brook_drowned_seawater',
    hints: ['The dead man has given a statement. It is at the County Mortuary.', 'Go to the County Mortuary and ask Dr Okoro how Brook died, when, and where the water came from.'],
  },
  {
    id: 'o_lab', text: 'Send what you have bagged to the lab', if: { any: ['ev:burnt_letter', 'ev:cashbox'] },
    done: { any: ['lab:burnt_letter', 'lab:cashbox', 'flag:lab_used'] },
    hints: ['Some evidence only talks under a lamp and a lens.', 'Open your laptop at the precinct, go to the Lab tab, and send in the burnt letter and the cash box.'],
  },
  {
    id: 'o_dray', text: "Test the housekeeper's story", if: { any: ['fact:canvass_bicycle', 'fact:cash_short'] },
    done: 'told:dray.d_truth',
    hints: ['She says she left at six. Something in your bag says otherwise.', "Show Agnes Dray the door-to-door report or the cash box. Use 'Show evidence' while you are talking to her."],
  },
  {
    id: 'o_lantern', text: 'Trace the lantern to its maker', if: 'fact:lantern_maker',
    done: 'met:fenn',
    hints: ["There is a name stamped under that lamp.", 'Go to Fenn & Daughter on Lamp Row and talk to Tobias Fenn. Look at his jar, his ledger and the photograph on the wall.'],
  },
  {
    id: 'o_token', text: 'Find out what the brass token is', if: 'fact:token_0155',
    done: 'fact:calliope_known',
    hints: ['Vale Lines. Night ferry. Somebody in this town remembers what that was.', 'Ask your laptop about the token, or ask Fenn about the jar on his counter.'],
  },
  {
    id: 'o_tavern', text: 'See the Calliope memorial at the Anchor & Lamp', if: 'fact:calliope_known',
    done: ['visited:tavern', 'examined:plaque'],
    hints: ['Thirty-one names on a brass plate. Go and read them.', 'Go to the Anchor & Lamp. Read the memorial, then talk to Bess Carrow and to the reporter, Strand.'],
  },
  {
    id: 'o_rest1', text: 'When you have done all you can today, call it a night (on the map)', if: ['act:1', 'examined:lantern_brook', 'fact:brook_drowned_seawater', { any: ['visited:lamp_shop', 'visited:tavern'] }],
    done: 'act>=2',
    hints: ['The day has given you what it is going to give. Sleep on it.', "Open the map and choose 'Call it a night'. Make sure you have finished with today's leads first."],
  },
  // Act two
  {
    id: 'o_yacht', text: 'Examine the Second Wind', if: 'act>=2',
    done: ['examined:lantern_vale', 'examined:safe', 'examined:chain_link'],
    hints: ['He fought. Fighting leaves things behind.', "Go to the marina. Examine the lantern, the evidence bag on the chart table, the safe, and the wet prints by the steps."],
  },
  {
    id: 'o_isolde', text: 'Question Isolde Vale and Officer Brandt', if: 'act>=2',
    done: ['met:ivale', 'told:brandt.b_seal'],
    hints: ['The widow has not put down her handbag. The scene officer has something on his mind.', "Ask Isolde Vale who visited her husband, and show her the photograph of the safe. Ask Brandt what he wanted to tell you about Gull Street."],
  },
  {
    id: 'o_pattern', text: 'Work out what the times mean', if: { any: ['fact:token_0231', ['fact:token_0155', 'fact:timeline_known']] },
    done: 'ded:pattern',
    hints: ['01:55. 02:31. One of those numbers is cast in brass on a tavern wall.', 'Get the inquiry timeline from Strand or your laptop, then open the case board and answer the first question.'],
  },
  {
    id: 'o_first', text: 'Find the first light', if: 'ded:pattern',
    done: 'ded:first',
    hints: ['The timeline does not start at 01:55.', 'Read the first line of the inquiry timeline, then answer the question on your case board.'],
  },
  {
    id: 'o_pell', text: "Search Ambrose Pell's room", if: { any: ['ded:first', 'fact:pell_lodger'] },
    done: ['examined:lantern_pell', 'examined:bed', 'examined:floorboard'],
    hints: ['An old keeper keeps a lamp. Nobody looked twice.', "Ask Bess Carrow for the key to Pell's room, then take the stairs in the Anchor. Look at the sill, under the bed, and at the floor beside it."],
  },
  {
    id: 'o_retest', text: 'Have Dr Okoro look again at Pell', if: { any: ['ded:first', 'fact:pell_lodger'] },
    done: 'fact:pell_retest',
    hints: ['A locum signed him off. Okoro did not.', 'Ask Dr Okoro to retest the samples kept from Ambrose Pell.'],
  },
  {
    id: 'o_fourth', text: 'Find the fourth light: 03:05', if: 'ded:pattern',
    done: 'ded:fourth',
    hints: ["'Officer commanding: name withheld.' Somebody in this town was there.", "Bess Carrow, Isolde Vale and Strand each know who had the Petrel. There is also a photograph in the Captain's office. Then answer the question on your case board."],
  },
  {
    id: 'o_plate', text: 'Trace the car: 7K4', if: 'fact:plate_7k4',
    done: 'fact:pool_car',
    hints: ['Three characters of a number plate are enough for a database.', "Ask your laptop about the plate '7K4'."],
  },
  {
    id: 'o_morvane', text: 'Find where the Morvane came from', if: { any: ['fact:sedative_morvane', 'fact:ampoule_cap'] },
    done: 'fact:drug_log',
    hints: ['Controlled drugs live in very few places. One of them is close.', 'Ask your laptop about Morvane, then look at the drug locker in the precinct evidence cage.'],
  },
  {
    id: 'o_seal', text: 'Find out who went back into Gull Street', if: 'fact:seal_broken',
    done: 'fact:button_planted',
    hints: ['Nobody breaks a seal to take nothing. Or to leave nothing.', 'Go back to the study at Gull Street and look under the armchair. Then ask Brandt about it.'],
  },
  {
    id: 'o_insider', text: 'How is the Lamplighter always a step ahead?', if: { min: 2, of: ['fact:seal_broken', 'fact:letter_no_post', 'fact:harbour_police_voice', 'fact:drug_log', 'fact:ampoule_batch', 'fact:strand_source', 'fact:photo_cape'] },
    done: 'ded:insider',
    hints: ['Unstamped letters. A re-taped seal. A voice at the door that said a word.', 'Open the case board and answer the question about how the killer stays ahead of you.'],
  },
  {
    id: 'o_rest2', text: 'When you have done all you can today, call it a night (on the map)', if: ['act:2', 'examined:lantern_vale', 'ded:pattern'],
    done: 'act>=3',
    hints: ['Two men dead and a page of times. Tomorrow will bring something. It always does.', "Open the map and choose 'Call it a night'. Make sure you have finished with today's leads first."],
  },
  // Act three
  {
    id: 'o_confession', text: "Test Tobias Fenn's confession", if: 'act>=3',
    done: 'ded:confession',
    hints: ['A man who did it knows how it was done.', 'Ask Fenn how he killed them and how he reached the yacht. Check his custody record on your laptop. Then answer the question on the case board.'],
  },
  {
    id: 'o_frame', text: "The Captain's name is on everything. Why?", if: { min: 2, of: ['fact:pool_car', 'fact:drug_log', 'fact:archive_log', 'fact:button_found'] },
    done: 'ded:frame',
    hints: ['Check one of those dates against where Hale actually was.', "Ask your laptop about the sealed inquiry file, then about terminal B-12 and about 19 September. Show Hale the button. Then use the case board."],
  },
  {
    id: 'o_protect', text: 'Who is Fenn protecting?', if: 'ded:confession',
    done: { any: ['fact:infirmary', 'fact:fenn_knows'] },
    hints: ['He taught that wick to one person. Her body was never found.', "Read the Calliope casualty list on your laptop, then ask it whether a child could have come ashore further down the coast. And look at what is on Fenn's counter now."],
  },
  {
    id: 'o_desk', text: "Vance is out. Her desk is not.", if: ['flag:vance_out', { any: ['ded:insider', 'ded:frame', 'fact:b12_vance', 'fact:letter_typeface'] }],
    done: 'ev:drawer_contents',
    hints: ['You have a drawer full of paperclips.', "Examine Vance's desk in the bureau while she is at Eastgate."],
  },
  {
    id: 'o_accuse', text: 'Name the Lamplighter', if: 'act:3',
    done: 'flag:accused',
    hints: ['When you are sure, say it to someone who can act on it.', "Open the case board and choose 'Make an arrest'. Pick who, and the evidence that proves it."],
  },
  // Act four
  {
    id: 'o_light', text: 'Get to Marrow Point', if: 'act>=4',
    done: 'visited:lighthouse',
    hints: ['03:05. The light.', 'Open the map and go to Marrow Point Light.'],
  },
  {
    id: 'o_finale', text: 'Stop the fourth light', if: 'visited:lighthouse',
    done: 'flag:finale_done',
    hints: ['She has not done it yet. She is waiting for the hour. Talk to her.', 'Talk to her. Use what you know: who she is, what her father did, and what you can prove.'],
  },
];

// ------------------------------------------------------- ending the day
// The player chooses when each day ends; `auto` is the backstop if they never do.

export const REST = {
  1: {
    if: ['examined:lantern_brook', 'fact:brook_drowned_seawater'],
    why: 'Not yet. You have not finished with the study at Gull Street, or heard what Dr Okoro has to say about the body.',
    warn: 'Go home for the night? Finish with today\'s leads first; tomorrow will bring its own.',
    auto: 150,
  },
  2: {
    if: ['examined:lantern_vale'],
    why: 'Not yet. Conrad Vale is still sitting at his own table aboard the Second Wind.',
    warn: 'Go home for the night? Tomorrow is the thirteenth.',
    auto: 170,
  },
  3: {
    if: true,
    warn: 'Go home without naming anyone? Tonight the thirteenth becomes the fourteenth, and the fourth light is still unlit.',
    card: 'timeout',
    auto: 190,
  },
};

// ----------------------------------------------------------- deductions

export const DEDUCTIONS = {
  pattern: {
    q: 'What do the times on the tokens mean?',
    if: { any: [['fact:token_0155', 'fact:token_0231'], ['fact:token_0155', 'fact:timeline_known'], ['fact:token_0155', 'fact:memorial_0231']] },
    options: [
      { id: 'tod', text: 'They are the times the victims died.', no: "Okoro puts Brook's death between ten and eleven at night. 01:55 is hours out. It is not that." },
      { id: 'tide', text: 'They are tide times. The killer comes and goes by water.', no: 'You check the tables. No high or low water falls on any of them. It is not that.' },
      { id: 'ferry', text: 'They are sailing times from the old ferry timetable.', no: 'The night ferry sailed once a night, at half past one. It is not that.' },
      { id: 'calliope', text: 'They are moments from the night the Calliope sank.', needs: { any: ['fact:timeline_known', 'fact:memorial_0231'] } },
    ],
    answer: 'calliope',
    solved: "02:31 is cast in brass on a tavern wall. 01:55 is the minute the harbour master waved the ferry out. Each token marks the moment one man failed the Calliope, and the Lamplighter is working down the inquiry's own timeline, line by line.",
    facts: ['pattern_calliope'],
  },
  first: {
    q: "The inquiry's timeline begins at 01:10. Whose light is that?",
    if: ['ded:pattern', 'fact:timeline_known'],
    options: [
      { id: 'brook', text: 'Leland Brook. He was the first to die.', no: "Brook's token says 01:55. Somebody else owns ten past one." },
      { id: 'none', text: 'No one yet. 01:10 is still to come.', no: 'The killer is working forward through the night, not back. 01:10 has already been paid.' },
      { id: 'pell', text: 'Ambrose Pell, the keeper whose light went dark.' },
      { id: 'vale', text: 'Conrad Vale, who owned the ferry.', no: "Vale's token says 02:31." },
    ],
    answer: 'pell',
    solved: 'Ambrose Pell, keeper of Marrow Point light. You look him up. He died on 22 September in a tin bath above the Anchor & Lamp, with a lantern burning on the sill, and a locum wrote "accident". Nobody lit a candle for him. Somebody lit a lamp.',
    facts: ['pell_first', 'pell_lodger'],
  },
  fourth: {
    q: 'Four lights. The last line reads 03:05. Who is it?',
    if: ['ded:pattern', { any: ['fact:timeline_known', 'fact:four_lights'] }],
    options: [
      { id: 'fenn', text: 'Tobias Fenn.', no: 'Fenn lost everything that night. He failed no one. It is not him.' },
      { id: 'master', text: "The Calliope's master. But he went down with her.", no: 'Then there would be no fourth lantern. The letter says four.' },
      { id: 'hale', text: 'Captain Desmond Hale.', needs: { any: ['fact:hale_cox', 'fact:hale_turned_round', 'fact:hale_visited_yacht', 'fact:petrel_hale_strand', 'fact:vale_tape', 'fact:sealed_truth', 'fact:hale_admits'] } },
      { id: 'strand', text: 'Milo Strand, who watched the inquiry and wrote nothing.', no: 'He was a junior reporter on a bench. The inquiry never named him. It is not him.' },
    ],
    answer: 'hale',
    solved: "03:05: the police launch Petrel recalled to harbour, officer commanding withheld. The officer was a 29-year-old sergeant called Desmond Hale. Your captain is the fourth light, and the anniversary is the fourteenth.",
    facts: ['fourth_is_hale'],
  },
  insider: {
    q: 'How is the Lamplighter always a step ahead of you?',
    if: { min: 2, of: ['fact:seal_broken', 'fact:letter_no_post', 'fact:harbour_police_voice', 'fact:drug_log', 'fact:ampoule_batch', 'fact:strand_source', 'fact:photo_cape'] },
    options: [
      { id: 'press', text: 'Strand is passing the killer what the police know.', no: 'Strand gets his news after the killer does, not before. It runs the other way.' },
      { id: 'watch', text: 'The killer watches the scenes from outside.', no: 'Watching does not get a letter onto your desk without a stamp, or tape across a door you sealed.' },
      { id: 'police', text: 'The killer is a police officer.' },
      { id: 'luck', text: 'Luck. And my own carelessness.', no: 'Once is luck. This is a key to the building.' },
    ],
    answer: 'police',
    solved: 'A police cape on the doorstep. Police tape on a broken seal. Letters with no stamp. A drug that lives in your own evidence cage. The Lamplighter draws a salary from the same paymaster you do.',
    facts: ['insider'],
  },
  confession: {
    q: "What is Tobias Fenn's confession worth?",
    if: ['act>=3', { any: ['fact:fenn_custody', 'fact:confession_wrong'] }],
    options: [
      { id: 'true', text: 'It is true. He did it.', no: 'He was in a cell when Brook died, and he does not know how they were killed. It cannot be true.' },
      { id: 'mad', text: 'It is false. Grief has finally turned his mind.', no: "He is not raving. He is careful. He is lying on purpose, and badly." },
      { id: 'shield', text: 'It is false. He is protecting someone.' },
    ],
    answer: 'shield',
    solved: 'He walked in the morning after the Ledger ran its photograph. He has every detail wrong and does not care. A man does that for one reason. The question is who Tobias Fenn has left in the world to protect.',
    facts: ['fenn_protecting'],
  },
  frame: {
    q: "The Captain's name is on the car, the drug book and the sealed file. What does that tell you?",
    if: { min: 2, of: ['fact:pool_car', 'fact:drug_log', 'fact:archive_log', 'fact:button_found'] },
    options: [
      { id: 'guilty', text: 'Hale is the Lamplighter, silencing the men who know what he did.', no: 'A heavy man with a cane did not go over a garden gate, and he was at a dinner when his login was used. It does not hold.' },
      { id: 'both', text: 'Hale and Fenn are in it together.', no: 'Nothing joins them but a ferry. It does not hold.' },
      { id: 'framed', text: "Someone is writing the Captain's name for him.", needs: { any: ['fact:hale_dinner', 'fact:button_planted', 'fact:hale_token', 'fact:tunic_missing', ['fact:photo_cape', 'fact:hale_limp'], ['fact:cape_can', 'fact:hale_limp']] } },
    ],
    answer: 'framed',
    solved: "Block capitals in a book he scrawls in. A login used while he was at a dinner. A button cut off with scissors and laid where you would find it. Hale is not the killer. He is the last victim, and he is being dressed to take the blame. Whoever is doing it can sign for him.",
    facts: ['hale_framed'],
  },
};

// ------------------------------------------------------------ accusation

export const ACCUSE = {
  if: 'act:3',
  suspects: ['fenn', 'hale', 'vance', 'strand', 'ivale', 'okoro', 'brandt', 'carrow', 'dray'],
  motives: [
    { id: 'revenge', text: 'Revenge for the Calliope' },
    { id: 'silence', text: 'To silence the men who knew a secret' },
    { id: 'money', text: 'Money' },
    { id: 'justice', text: "To force the truth about the Calliope into the open" },
  ],
  /** Independent lines of proof against Vance. Three make a case. */
  pillars: [
    { id: 'identity', label: 'She is Lucy Fenn', if: { any: ['fact:infirmary', 'fact:fenn_knows', 'fact:fenn_newspaper'] } },
    { id: 'typewriter', label: 'The letters were typed on her Corvin', if: ['fact:letter_typeface', 'fact:corvin_e'] },
    { id: 'car', label: 'She signed out the car, and the figure in the cape was her size', if: ['fact:pool_car', { any: ['fact:cape_can', 'fact:photo_cape'] }] },
    { id: 'chain', label: "The link in Vale's fist and her broken whistle chain", if: ['ev:chain_link', 'fact:vance_whistle_cord'] },
    { id: 'archive', label: "Hale's login was used at her terminal while he was at a dinner", if: ['fact:archive_log', 'fact:b12_vance', 'fact:hale_dinner'] },
    { id: 'drawer', label: 'The tide table, the punches and the forged confession in her drawer', if: 'fact:drawer' },
    { id: 'source', label: "Strand's informant is a woman inside the precinct", if: 'fact:strand_source' },
  ],
  halePillars: ['fact:pool_car', 'fact:drug_log', 'fact:archive_log', 'fact:button_found', 'fact:hale_visited_yacht', 'fact:burnt_letter', 'fact:vale_called_hale'],
  replies: {
    vance_strong: "*Hale reads everything you have laid on the blotter, slowly, twice. When he looks up he seems ten years older.* Three years she has brought me my post. ...Get her in here. No. Don't. I'll go myself.",
    vance_weak: "*Hale hears you to the end.* Vance. My sergeant. On this? No, Detective. Half this building types on Corvins and signs for cars. Bring me something that only fits her. Sergeant! A moment, if you would.",
    fenn: "*Hale lets out a long breath.* He's confessed and now you've signed it. Good. Charge him. The Commissioner will want to shake your hand. *He does not look relieved. He looks like a man who has been let off something.*",
    hale: "*The Commissioner's voice on the line is very even.* Captain Hale. I see. Detective, stay where you are. He is suspended as of this minute, pending inquiry. Tell him to leave his badge.",
    hale_weak: "*The Commissioner hears you out.* You are four days in this force, Detective, and you are accusing your own captain on this? Bring me evidence or do not telephone me again.",
    rejected: "*Hale does not even sit down.* No. On what? Bring me something I can put in front of a magistrate. And close the door on your way out.",
  },
};

// --------------------------------------------------------------- finale

export const FINALE = {
  maxTurns: 8,
  /** What the player can truthfully bring to bear, and what it sounds like. */
  levers: [
    { id: 'name', reply: '*Her head comes up.* ...Say it again. Nobody has said that name to me in twenty years. Nobody living.', if: { any: ['fact:infirmary', 'fact:fenn_knows', 'fact:fenn_newspaper'] }, has: 'knows she is Lucy Fenn, pulled from the sea at eleven', chip: 'Lucy. Lucy Fenn.', weight: 2, keys: ['lucy', 'fenn', 'eleven', 'whistle', 'trawler', 'harrowgate', 'mary dunne'] },
    { id: 'father', reply: "*For the first time her voice is not level.* He knew? He stood there and wrapped four lanterns in newspaper and he knew? ...And tonight he's in a cell with my murders round his neck. Oh, Dad. You stubborn old man.", if: { any: ['fact:fenn_knows', 'fact:fenn_protecting', 'fact:fenn_newspaper'] }, has: 'knows her father recognised her and has confessed to the murders to save her', chip: 'Your father confessed. To hang in your place.', weight: 2, keys: ['father', 'tobias', 'confess', 'hang', 'dad', 'shop', 'lamp-maker', 'lamp maker'] },
    { id: 'proof', reply: "Vale. In his own voice. *She looks at Hale, then at the lantern.* Then they don't need a fourth lamp to see by. Is that what you're telling me, Detective?", if: { any: ['ev:vale_tape', 'fact:sealed_truth', 'ev:pell_logbook'] }, has: "holds hard proof of what happened to the Calliope (Vale's taped confession, Pell's logbook, or the unsealed exhibits)", chip: 'I have the proof. It all comes out in court.', weight: 2, keys: ['tape', 'proof', 'logbook', 'unsealed', 'court', 'evidence', 'exhibit', 'recording', 'prove'] },
    { id: 'hale_confessed', reply: '*She turns to Hale.* You said it? Aloud, to a living person? *Hale nods.* Twenty years, Desmond. It took a brass token and three funerals.', if: 'fact:hale_admits', has: 'has already heard Hale admit he turned the Petrel back on Vale\'s word', chip: 'He has already confessed it to me.', weight: 1, keys: ['admitted', 'confessed', 'told me', 'hale said'] },
    { id: 'left_behind', reply: "'All minors accounted for.' *A sound that is not quite a laugh.* I was in a hospital bed forty miles away with my mouth shut for seven months. Leland Brook accounted for me in one line.", if: 'fact:brook_buried_child', has: 'knows Brook answered Harrowgate "all minors accounted for" and can prove she was written off', chip: "They wrote 'all minors accounted for'. I can prove it.", weight: 1, keys: ['accounted', 'minors', 'harrowgate asked', 'brook wrote', 'left you'] },
    { id: 'frame', reply: "*A long breath.* The button. I knew when I laid it down it was one touch too many. ...So he doesn't even get to be the villain. He only gets to be dead.", if: { any: ['fact:hale_framed', 'fact:drawer', 'fact:button_planted'] }, has: 'knows she has been framing Hale and that the staged suicide will fool nobody now', chip: "The frame is finished. Nobody will believe he did it.", weight: 1, keys: ['frame', 'framed', 'button', 'drawer', 'forged', 'suicide', 'nobody will believe'] },
    { id: 'thirtyone', reply: 'Thirty-one. Now say the nine. Nine of them could see his lamps. My mother was one of the nine.', if: 'fact:pattern_calliope', has: 'understands what the four lights are for', chip: 'Thirty-one. I know what the lights are for.', weight: 1, keys: ['thirty-one', '31', 'nine in the water', 'lights', 'calliope', 'your mother', 'marian'] },
  ],
  /** Scripted (no-AI) lines for when nothing the detective says lands. */
  cold: [
    "That's the oath talking. I took it too. Look what it did for the Calliope.",
    "I am not going to hurt you. I'd like that understood. Now tell me something true.",
    "You're spending the minutes, Detective. They don't come back. Ask the nine.",
    "*She checks her watch.* Is that all you brought up ninety-one steps?",
  ],
  open: {
    knew: "*The lantern room. Rain on sixteen panes. Hale is sitting against the parapet with rope round his chest and a lantern at his feet. She is standing between him and the great dead lens, a steel can beside her, and she does not turn round.* You found it, then. I thought you might. I'd have been disappointed in you, a little, if you hadn't.",
    blind: "*The lantern room. Rain on sixteen panes. Hale is sitting against the parapet with rope round his chest and a lantern at his feet. And between him and the great dead lens, with a steel can beside her, is your partner.* Hello, Detective. *She does not sound surprised. She sounds tired.* You'll want to sit down. It's a long way up and a longer story.",
  },
  /** Scripted (no-AI) resolution text. */
  ends: {
    surrender: "*For a long time there is only the rain. Then she lifts the whistle over her head, looks at it, and holds it out to you.* Give that to my father. Tell him I remembered the cut. *She kneels, takes out her own handcuffs, and puts them in your hand.* Do it properly, Detective. I taught you how.",
    spare: "*She looks at Hale. She looks at the lantern. At two minutes past three she bends and blows it out.* Let him say it in a courtroom, then. Let him say it with his own mouth. *She walks to the gallery door and opens it on the wind.* The sea had me once. It gave me back. We'll see if it's still feeling generous. *The door bangs. When you reach the rail there is nothing below but white water on the Teeth.*",
    finish: "*She looks at her watch.* Five past three. *She says it gently, the way you would to a child.* You should go down now, Detective. You don't want to see this, and I don't want you to. *You do not go down. It makes no difference.* \n\nWhen the lifeboat men come up the stairs at dawn there are four lanterns burning in Greyhaven, and one of them is at Marrow Point.",
  },
};

// ------------------------------------------------------------- director

export const DIRECTOR = {
  letters: {
    1: {
      brief: "First letter to the detective, after they have worked the Brook scene. Tone: measured, almost courteous; a teacher marking a new pupil. It should make clear the writer knows exactly how the detective spent the day.",
      fallback: (ctx) => `Detective.

You are new. That is why I am writing to you and not to the others.

${ctx.did ? `I am told you ${ctx.did}. Good. Most of them never look.` : 'You looked at the lamp before you looked at the man. Good. Most of them never look.'}
${ctx.missed ? `You did not ${ctx.missed}. Go back. A room is a sentence; you have read half of it.` : 'You were thorough. I had hoped for thorough.'}

He did not die at five to two. You know that by now. Ask yourself what did happen at five to two, and who was awake to see it.

There was a light at Marrow Point once. Count the men who were paid to mind it.

— L.`,
    },
    2: {
      brief: "Second letter, after Vale. Colder. The writer is two-thirds done and knows the detective is close to the pattern. It should hint that there was a death before Brook that nobody counted, without naming Pell.",
      fallback: (ctx) => `Detective.

Two thirty-one. It is on a wall in a public house. I did not think you would need it spelled out, and you did not.

${ctx.did ? `You ${ctx.did}. I notice these things.` : 'You are quicker than they are. I notice these things.'}
${ctx.missed ? `But you have not yet thought to ${ctx.missed}.` : ''}

You think I began at Gull Street. Read your list again from the top. The first line is not five to two. An old man died in this town three weeks ago and nobody lit so much as a candle. I lit a lamp.

Do not waste your pity on the one who makes them. He sold me nothing but brass and glass.

— L.`,
    },
    3: {
      brief: "Third letter, after Tobias Fenn has falsely confessed. The writer is angry for the first time: Fenn is innocent and must not be charged. This is the killer defending the scapegoat. It should also make plain that one light remains and when.",
      fallback: (ctx) => `Detective.

He did not do it and you know he did not.

Look at his hands. Ask him what was in the sink. An old man who has already lost everything walks into a police station to lose the rest, and your captain reaches for a pen. That is Greyhaven. That is exactly Greyhaven.

${ctx.did ? `You ${ctx.did}. So you have doubts. Have them louder.` : 'You have doubts. Have them louder.'}

If Tobias Fenn is charged I will consider it your doing. I have not been angry until today.

There is one light left. You have the time; it was posted five weeks ago. You know the place, because it is the only place.

— L.`,
    },
  },
  /** Things the letters can praise. First match wins. */
  did: [
    { if: 'told:dray.d_truth', text: 'got the truth out of the housekeeper' },
    { if: 'examined:floorboard', text: "found what the old keeper hid under his floor" },
    { if: 'lab:burnt_letter', text: 'had the ash from the grate read' },
    { if: 'examined:grate', text: 'went through the ash in the grate' },
    { if: 'fact:fenn_custody', text: 'troubled to find out where the lamp-maker really was that night' },
    { if: 'examined:phone_brook', text: 'read the pad beside his telephone' },
    { if: 'visited:tavern', text: 'went and read the thirty-one names' },
    { if: 'visited:lamp_shop', text: 'found your way to Lamp Row within the day' },
    { if: 'examined:stain', text: 'knelt and tasted the carpet, or near enough' },
    { if: 'met:okoro', text: 'went to hear what the doctor made of his lungs' },
  ],
  /** Things the letters can needle the detective for missing. First match wins. */
  missed: [
    { if: ['visited:brook_house', '!examined:grate'], text: 'look in the grate. He burned something there' },
    { if: ['visited:brook_house', '!examined:phone_brook'], text: 'read the pad beside his telephone' },
    { if: ['visited:brook_house', '!examined:bureau'], text: 'count the money in the bureau' },
    { if: ['ev:canvass_report', '!told:dray.d_truth'], text: 'ask the housekeeper why her bicycle was at the gate' },
    { if: ['ev:burnt_letter', '!sent:burnt_letter'], text: 'send the ash to your laboratory' },
    { if: ['act>=2', 'visited:vale_yacht', '!examined:safe'], text: 'look inside his safe, at the dust' },
    { if: ['act>=2', '!rec:marina_log'], text: 'ask who else came through the marina gate that night' },
    { if: ['act>=2', 'fact:lantern_maker', '!examined:ledger'], text: "turn back the pages of the lamp-maker's ledger" },
    { if: ['act>=3', '!rec:custody_eastgate'], text: 'ask Eastgate where he was on the tenth' },
    { if: ['fact:sedative_morvane', '!ev:drug_page'], text: 'ask where in this town a person finds Morvane' },
  ],
};

// -------------------------------------------------------------- endings

export const ENDINGS = {
  /** Truths the final report lists, found or missed. */
  truths: [
    { id: 't_method', label: 'How they died: sedated, then drowned in seawater carried from Marrow Point', if: ['fact:sedative_morvane', 'fact:brook_drowned_seawater'] },
    { id: 't_pattern', label: 'What the tokens meant', if: 'fact:pattern_calliope' },
    { id: 't_pell', label: 'That Ambrose Pell was the first victim', if: { any: ['fact:pell_retest', 'fact:pell_first'] } },
    { id: 't_fourth', label: 'That Captain Hale was the fourth light', if: 'fact:fourth_is_hale' },
    { id: 't_calliope', label: 'What really happened to the Calliope', if: { any: ['fact:vale_tape', 'fact:sealed_truth', ['fact:hale_admits', 'fact:pell_was_drinking']] } },
    { id: 't_dray', label: 'What Agnes Dray saw from the lane', if: 'fact:cape_can' },
    { id: 't_insider', label: 'That the killer was a police officer', if: 'fact:insider' },
    { id: 't_frame', label: 'That Hale was being framed', if: 'fact:hale_framed' },
    { id: 't_fenn', label: "That Fenn's confession was a lie told out of love", if: 'fact:fenn_protecting' },
    { id: 't_lucy', label: 'That Lucy Fenn survived the wreck', if: 'fact:infirmary' },
    { id: 't_vance', label: 'That your partner was the Lamplighter, before she told you herself', if: 'flag:knew_vance' },
  ],
  ranks: [
    { min: 0, title: 'Probationer', line: 'You were there. That is about all the report can say.' },
    { min: 35, title: 'Constable of the Watch', line: 'You followed where you were led. Greyhaven has plenty of those.' },
    { min: 55, title: 'Harbour Detective', line: 'You saw most of it, and you saw it late. But you saw it.' },
    { min: 75, title: 'Detective Inspector', line: 'You worked it the way it is meant to be worked. The dead would not complain.' },
    { min: 92, title: 'Keeper of the Light', line: 'Nothing stayed dark. They will not see your like on this coast again.' },
  ],
  /** Fixed prose for each way the lighthouse can end. The model may rewrite these in its own words. */
  outcomes: {
    surrender: 'Nora Vance, born Lucy Fenn, comes down ninety-one steps in her own handcuffs. Hale lives.',
    spare: 'Hale lives. Nora Vance goes out through the gallery door into the wind. No body is found. The sea has kept her before and given her back.',
    finish: 'At five past three there is a fourth lantern burning at Marrow Point. Captain Desmond Hale is dead.',
  },
};
