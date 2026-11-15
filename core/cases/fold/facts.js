// Everything the detective can come to know, as notebook entries.
//
// A fact is a single established point. Hotspots, people, lab results,
// records and solved puzzles all pay out in facts, and the rest of the case
// (who will talk, which deductions open, how the finale goes) is gated on
// which facts you hold.
//
// tag: scene | forensic | testimony | record | pattern | insider | identity
// key: counts toward the final case rating

/** @type {Record<string, { text: string, tag: string, about?: string[], key?: boolean }>} */
export const FACTS = {
  // ------------------------------------------------------------- the Fold
  fold_hidden: { tag: 'record', text: "The Fold is on no accurate map: its own people draw Ravel's maps and let their streets fall in the fold of the page. You get in by being told, or by working it out." },
  fold_time: { tag: 'record', text: 'The Fold keeps its own time, eleven minutes behind Greenwich. Every clock here has two minute hands. When the Fold says four, your watch says eleven past.' },
  tithe_custom: { tag: 'record', text: 'Every member owes the Company one new puzzle a year, the Tithe. They are pinned on the Wall of Tithes in the Hall.' },
  invigilator_chair: { tag: 'insider', text: 'At the Proving one person sits in a chair at the back with the clock and says nothing for three hours. The candidates never look round. That person is called the invigilator.' },
  lodger_trick: { tag: 'pattern', about: ['pendry'], text: "Pendry's chess-playing automaton, 'the Lodger', copies a famous machine of 1770. That one never had a mind. It had a man hidden inside it." },
  basket: { tag: 'pattern', about: ['hesper'], text: "Dame Hesper's waste-paper basket is kept as a relic: 'from which more good clues were rescued than most setters ever write'. The label does not say who rescued them." },
  lunch_tin: { tag: 'testimony', about: ['hob', 'kit'], text: "When Kit was a child the Porter left a puzzle in her lunch tin every Monday. She thought everybody's porter did." },
  tithe_done: { tag: 'record', text: 'You have paid a tithe of your own: an old puzzle off the Wall, solved.' },
  unfair_known: { tag: 'pattern', key: true, text: "The Hundred Guineas of 1911 cannot be won; it was set by a Warden who knew there was no way out. The Fold's oldest lesson: a puzzle nobody can solve is not a puzzle." },

  // --------------------------------------------- 4 Nonesuch Row (Pendry)
  pendry_bench: { tag: 'scene', about: ['pendry'], text: 'Pendry died at his bench with no wound and no struggle. Whatever happened took hours, and was quiet.' },
  locked_inside: { tag: 'scene', about: ['pendry'], key: true, text: "Pendry's workshop was locked from the inside with his own seven-ring letter-lock. His own word, PENDRYS, did not open it." },
  no_entry: { tag: 'scene', about: ['pendry'], text: 'The workshop window is barred and painted shut. Nobody came or went that way.' },
  hall_tea: { tag: 'scene', about: ['pendry'], text: "Pendry took the Syndics' tea at the Hall at four and carried his last cup back to his bench." },
  pendry_paper: { tag: 'scene', about: ['pendry'], key: true, text: "A green-ink 'Paper for a Syndic' reached Pendry by the Bellows at eight: he had drunk foxglove at four, the Infirmary could save him until midnight, and his door now opened to 'one name, in everything you sold'." },
  pendry_tries: { tag: 'scene', about: ['pendry'], text: 'Pendry tried at least a hundred and ninety seven-letter words on his own lock, LORIMER among them, twice.' },
  certificate_sole: { tag: 'scene', about: ['pendry', 'hesper'], text: "Pendry certified the whole 'Lorimer Legacy' as Dame Hesper's sole work, and dismissed the fair copies of the later years as 'in a copyist's hand and of no consequence'. His fee was £40,000." },
  pendry_quarter: { tag: 'scene', about: ['pendry'], text: "Pendry's ledger: 'Greywether. On completion 31 Oct. My quarter: £2,750,000.' His, not the Company's." },
  wilf_found: { tag: 'testimony', about: ['wilf', 'pendry'], text: 'Wilf found the door would not open at 7:15 on Monday morning. The constables took it off its hinges.' },
  word_was_pendrys: { tag: 'testimony', about: ['wilf', 'pendry'], text: "Pendry's lock word was PENDRYS and had been for years. It still was on Friday." },
  banging: { tag: 'testimony', about: ['quoin', 'pendry'], text: "Mrs Quoin heard a slow knocking through the party wall from ten until past eleven on Sunday night, and took it for a clock." },
  worked_lock: { tag: 'forensic', about: ['pendry'], text: "Pendry's fingertips were rubbed raw, with brass under the nails. He spent hours trying to turn the rings of his lock." },
  foxglove: { tag: 'forensic', about: ['pendry'], key: true, text: 'Pendry died of foxglove (digitalis) poisoning: a strong brew of the plant itself, drunk in tea.' },
  drank_at_four: { tag: 'forensic', about: ['pendry'], key: true, text: 'He drank it at about four in the afternoon, was ill by eight, and died around midnight, clear-headed nearly to the end.' },
  could_be_saved: { tag: 'forensic', about: ['pendry'], text: 'There is an antidote. Anyone brought to the Infirmary by about ten that night would have lived.' },
  cup_foxglove: { tag: 'forensic', about: ['pendry'], text: "Pendry's own cup from the Hall tea held foxglove. Nobody else's did." },

  // -------------------------------------------------------------- the Hall
  locks_oiled: { tag: 'insider', key: true, text: "On Saturday the Syndics' letter-locks were oiled and re-pinned, as every October before the Proving: Pendry's, Sallow's, Voss's, the Warden's, the Lantern grille. It is in the Porter's daybook." },
  pins_open: { tag: 'insider', text: "A letter-lock's word is changed with a setting-pin, in a minute. The pins hang on open hooks in the Porter's Lodge, a yard from the tea table. Anyone could take one." },
  own_cups: { tag: 'insider', text: "Each Syndic has their own cup at the four o'clock tea. Anyone who knew the cups could poison one person and nobody else." },
  tea_porter: { tag: 'insider', about: ['hob'], key: true, text: "The Porter lays and pours the Syndics' tea, and has for forty years. Nobody watches him do it; several people had to think before they could say who does." },
  rack_wound: { tag: 'insider', about: ['hob'], text: "Anyone may leave a carrier in the hold-rack of the Bellows exchange to be sent later. The rack is clockwork; the Porter winds it on Mondays." },
  held_carrier: { tag: 'pattern', key: true, text: 'Paper I was put into the hold-rack at noon and sent by clockwork at eight. Whoever posted the Papers could be anywhere when they arrived.' },
  hob_invigilates: { tag: 'insider', about: ['hob'], key: true, text: 'The Porter, R. Fettle, has been the invigilator at every Proving since 1990.' },
  vesper_name: { tag: 'record', about: ['hesper'], text: "Dame Hesper Lorimer's pen-name as a setter is VESPER." },
  completion_31: { tag: 'record', about: ['clay'], text: "The sale to Greywether completes on 31 October: 'the Lorimer Legacy, together with the freehold of Setters' Hall and the properties scheduled'." },
  hob_barred: { tag: 'testimony', about: ['hob', 'hesper'], text: "The Porter was Dame Hesper's fair-copyist for forty years. Since March he has not been allowed to see her: 'family only'." },
  hob_copyist: { tag: 'record', about: ['hob', 'hesper'], text: "Robert 'Hob' Fettle has made Dame Hesper's fair copies since 1984." },
  monday_alibis: { tag: 'testimony', about: ['ottilie', 'hob', 'jonah'], text: "On Monday night half the Fold was in the Stalemate, in Ottilie's score-book: the Porter at dominoes from seven till ten, Jonah at Go till closing." },
  crux_puff: { tag: 'record', about: ['voss'], text: "The Crux, edited by Lucan Voss, announced the sale as 'securing the Fold's future'." },
  censor_is_voss: { tag: 'record', about: ['voss'], text: 'CENSOR, who sets the Crux crossword, is its editor, Lucan Voss: the third Syndic.' },

  // ------------------------------------------------------------- the sale
  legacy_sale: { tag: 'pattern', key: true, text: "The buyers call it 'the Lorimer Legacy': Dame Hesper's life's work and the Lectern, sold to Greywether plc of London." },
  warden_signs: { tag: 'record', about: ['clay', 'hesper'], key: true, text: 'Since March the court has let the Warden, Auberon Clay, sign for Dame Hesper as her deputy. The man who sold her work is the man set to look after it.' },
  masterplan: { tag: 'scene', about: ['sallow'], key: true, text: "Sallow's last drawing is the Greywether masterplan. The sale takes the Hall and most of the Fold: the Stalemate, Quoin's, the Almshouses, the ferry, the Porter's Lodge." },
  follow_money: { tag: 'pattern', text: 'Paper II: MONEY. Follow it.' },
  escrow_four: { tag: 'record', about: ['clay', 'pendry', 'sallow', 'voss'], key: true, text: 'The £11,000,000 from Greywether is to be paid in four equal parts into the personal accounts of Clay, Pendry, Sallow and Voss. Not to the Company.' },
  clay_admits_money: { tag: 'testimony', about: ['clay'], text: "The Warden calls the eleven million 'a fee, for four people who carried the negotiation'." },
  four_syndics: { tag: 'pattern', key: true, text: 'Pendry and Sallow were two of the four Syndics selling the Fold. The other two are Lucan Voss and the Warden.' },
  sextant_clue: { tag: 'pattern', text: 'Paper II: a SEXTANT. There is one aboard the Meridian.' },
  no_manuscripts: { tag: 'record', about: ['hesper'], text: "No manuscript of a Late Tithe survives in Dame Hesper's own hand. Only fair copies, 'in the hand of the Company's copyist', and the fair-copy books were moved to the Warden's keeping in January." },

  // ---------------------------------------------------- the Meridian (Sallow)
  sallow_found: { tag: 'scene', about: ['sallow', 'nell'], text: 'Nell found Marguerite Sallow dead at her chart table at first light on Tuesday.' },
  sallow_locked: { tag: 'scene', about: ['sallow'], text: "The Meridian's hatch was locked inside with a letter-lock standing at her own word. The same as Pendry, down to the oil on the rings." },
  sallow_paper: { tag: 'scene', about: ['sallow'], text: 'Sallow had the same Paper as Pendry, with the same single question.' },
  sallow_log: { tag: 'scene', about: ['sallow', 'hob'], text: "Sallow's log: the Porter serviced her hatch lock on Saturday; on Monday she had her flask filled at the Hall at four and locked herself in at seven." },
  sallow_same: { tag: 'forensic', about: ['sallow'], text: 'Sallow died exactly as Pendry did: foxglove in the Hall tea at four, dead by midnight.' },
  flask_foxglove: { tag: 'forensic', about: ['sallow'], text: "Foxglove in Sallow's flask, filled at the Hall at four." },
  nobody_crossed: { tag: 'testimony', about: ['nell'], text: 'Nobody crossed the Cut after the last ferry on either night. Whoever did this was already inside the Fold.' },

  // ----------------------------------------------------------- Dame Hesper
  dame_tremor: { tag: 'scene', about: ['hesper'], text: "Dame Hesper's hands shake constantly. She could not hold a pen to a line." },
  dame_unaware: { tag: 'testimony', about: ['hesper'], text: 'Dame Hesper does not know her work has been sold, and has signed nothing.' },
  dame_incapable: { tag: 'record', about: ['hesper'], key: true, text: "Since before March Dame Hesper has been unable to write or to say what day it is. She could not have agreed to a sale, and she could not have written the Papers." },
  two_pens: { tag: 'scene', about: ['hesper'], text: "Dame Hesper's morning crossword is done in two hands: her own failing pencil, and a small upright ink that finishes every clue. The ink is dry before breakfast." },
  no_visitors: { tag: 'record', about: ['hesper', 'clay'], text: "By the Warden's order Dame Hesper may be visited by 'family only'. She has no family. Nobody has signed her book since March." },
  oiled_latch: { tag: 'scene', about: ['hesper'], text: 'The door of No. 4 has been freshly oiled: hinges, latch and lock. Somebody comes and goes quietly.' },
  night_visitor: { tag: 'testimony', about: ['hesper', 'dolores'], text: 'Somebody visits Dame Hesper at night with a key and does the crossword with her. The nurse has chosen not to see who.' },
  night_hand: { tag: 'forensic', about: ['hesper'], text: "The ink that finishes Dame Hesper's crossword at night is the hand of the Invigilator's Papers." },
  foxglove_bed: { tag: 'scene', about: ['hesper'], text: "A bed of foxgloves grows under Dame Hesper's window. It was cut back lately, each stem with one clean slant, like cutting a pen." },
  bed_planted: { tag: 'testimony', about: ['hob', 'hesper'], text: 'The Porter planted the foxglove bed for Dame Hesper in 1999.' },
  physic_foxglove: { tag: 'record', text: "The Company's Physic Garden at the Almshouses has always grown foxglove." },
  photo_1984: { tag: 'scene', about: ['hesper', 'hob'], text: "A photograph of 1984: Dame Hesper at her desk, and a young porter at her elbow holding the page flat. He is not looking at the camera. He is reading the page." },
  dame_confesses: { tag: 'testimony', about: ['hesper'], text: "Dame Hesper says she set the Papers herself. 'Who else is there?'" },
  confession_false: { tag: 'pattern', about: ['hesper'], key: true, text: "Dame Hesper's confession is false and honest: she knows her own manner when she sees it and cannot imagine who else could set it." },
  hand_shook: { tag: 'testimony', about: ['hesper', 'quoin'], text: "Mrs Quoin: Dame Hesper's hand began to shake in 2011, and every fair copy since has been as steady as engraving." },

  // ------------------------------------------------------------ the Engine
  engine_log: { tag: 'scene', about: ['jonah'], text: "The Lectern's log shows that it has never generated an examination question for anyone." },
  not_engine: { tag: 'testimony', about: ['jonah'], key: true, text: "The Lectern did not set the Papers. Its log is empty, and it cannot set a fair clue, only something that looks like one." },
  two_hands: { tag: 'forensic', about: ['jonah', 'hesper'], key: true, text: "Jonah's stylometry: the Lorimer corpus is two writers. Everything to 2011 is one; the twelve Late Tithes are another. The Syndics told him to delete it." },
  lodge_nights: { tag: 'record', about: ['hob'], text: "Nearly every night since March, between two and four, somebody at the Porter's Lodge terminal has asked the Lectern to read aloud Dame Hesper's lectures of 1987." },
  third_hand: { tag: 'pattern', key: true, text: 'The Papers are set by someone who knows Dame Hesper\'s mind better than the machine made from it, and whom nobody counts as a setter. A person inside the cabinet.' },

  // --------------------------------------------------------- the third Paper
  third_tonight: { tag: 'pattern', text: 'Paper III: the third candidate can be kept alive, if the slate at the Stalemate is solved before the Hall strikes twelve.' },
  censor_named: { tag: 'pattern', about: ['voss'], key: true, text: "The slate: 'Candidate three sets as CENSOR.'" },
  voss_locked: { tag: 'scene', about: ['voss'], text: "Voss was locked in the Crux office behind a letter-lock that no longer answered to his word, with a cup from the Hall tea and a green-ink Paper." },
  voss_paper: { tag: 'scene', about: ['voss'], text: "Voss's Paper asks the same single question: one name, seven letters, 'in everything you sold'." },
  voss_confesses: { tag: 'testimony', about: ['voss', 'clay', 'hob'], key: true, text: "Lucan Voss: all four Syndics knew the Late Tithes were not Dame Hesper's work. In January the Porter told the Warden so, with his books; they locked up the books and sold the work as hers." },
  clay_took_books: { tag: 'testimony', about: ['clay', 'hob'], text: "In January the Porter brought the Warden his fair-copy books and 'made claims'. The Warden took the books and locked them in his safe." },
  spiked_letter: { tag: 'record', about: ['voss'], key: true, text: "A letter to the Crux, spiked by Voss: 'The Late Tithes are not what the Company is selling them as. Ask who made the fair copies, and why they are locked in the Warden's safe. A servant of the Hall.'" },
  letter_same_hand: { tag: 'forensic', key: true, text: "The spiked letter from 'a servant of the Hall' and the Invigilator's Papers were written by the same hand." },
  porter_clue: { tag: 'record', about: ['voss', 'hob'], text: "Next Friday's Crux crossword, by CENSOR, 14 across: 'Carrier with ideas above his station? Stout fellow! (6)'. PORTER. In the margin: 'One for the Lodge.'" },

  // -------------------------------------------------------------- the name
  nina_ariadne: { tag: 'identity', key: true, text: 'Every one of the Late Tithes hides the same name, corner to corner through the solved square: ARIADNE. Nothing she set before 2012 does.' },
  word_ariadne: { tag: 'identity', key: true, text: "ARIADNE opens Pendry's lock. It is the 'one name, in everything you sold'. Any of them could have walked out at any minute." },
  epigraph_ariadne: { tag: 'identity', text: "The line at the head of Paper IV hides a word in its capitals, by Bacon's cipher: ARIADNE." },
  not_in_rolls: { tag: 'record', text: "There is no Ariadne in the Company's Rolls, in six hundred years. Nor any Fettle: the Rolls list members, not servants." },
  ariadne_fettle: { tag: 'identity', about: ['hob', 'ariadne'], key: true, text: "Ariadne Fettle was the Porter's daughter: the quickest child Mrs Quoin ever fitted, who answered Nell's riddles three ways. She died of a fever in January 1998, aged nine." },
  dame_names_hob: { tag: 'identity', about: ['hesper', 'hob'], key: true, text: "Dame Hesper, shown the name: 'That's Hob's girl. He puts her in everything. They're his, the late ones. All twelve. He had it out of my waste-paper basket.'" },
  dame_asks: { tag: 'testimony', about: ['hesper', 'hob'], key: true, text: "Dame Hesper asks for him: 'Tell Hob the four o'clock problem wants solving.'" },
  faircopy_hand: { tag: 'scene', about: ['hob', 'hesper'], key: true, text: "The fair-copy books are not a copyist's work. In them the 'copyist' strikes out Dame Hesper's clues and writes better ones, and she writes 'yes' in the margin." },
  hand_match: { tag: 'forensic', about: ['hob'], key: true, text: "The hand of the fair-copy books is the hand of the Invigilator's Papers." },
  changed_at_service: { tag: 'forensic', about: ['hob'], key: true, text: "The word of Pendry's lock was changed while the lock was open on a bench being oiled: the setting-pin's scratches lie under the fresh oil, not over it." },
  paper_hand: { tag: 'forensic', text: "The Papers are in Company ink and a small, upright, practised hand: a clerk's or a copyist's." },
  portrait_clue: { tag: 'pattern', about: ['hesper'], text: "Dame Hesper's clue: left, characteristic, likeness. PORTRAIT. She hid something behind her own." },
  codicil: { tag: 'identity', about: ['hesper', 'hob'], key: true, text: "Dame Hesper's Codicil of 2016, hidden behind her portrait: 'The Tithes since 2012 are the work of Robert Fettle. I am proud to put my name beside his, not above it.'" },
  porter_can: { tag: 'insider', about: ['hob'], key: true, text: 'The cup, the lock, the carrier, the chair: the Porter pours the tea, oils the locks, winds the hold-rack and invigilates the Proving. He can do all four unseen. It is his job.' },
  true_author: { tag: 'identity', about: ['hob', 'hesper'], key: true, text: "For twelve years the Company's greatest work has been the Porter's. The four Syndics sold it as Dame Hesper's, and when he said so they locked up his books and shut him out of her room." },
  method: { tag: 'pattern', key: true, text: 'Nobody had to be in the room. Each was poisoned at the four o\'clock tea, their lock was given a new word beforehand, and their Paper came by clockwork. No alibi in the Fold means anything.' },
  tuition: { tag: 'pattern', text: 'Paper IV: TUITION. Before it meant teaching, the word meant guardianship: keeping someone safe.' },
  lantern_known: { tag: 'pattern', key: true, text: "The seven answers, read down their slope, spell LANTERN: the glass room on the roof of Setters' Hall." },
};
