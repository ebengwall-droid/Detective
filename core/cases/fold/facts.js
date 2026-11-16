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
  fold_hidden: { tag: 'record', text: "The Fold is not on any true map of Ravel. Its own people draw the maps, and they hide its streets in the fold of the page. You only find it if someone tells you, or if you work it out." },
  fold_time: { tag: 'record', text: "The Fold keeps its own time, eleven minutes behind Greenwich. Its clocks have two minute hands, one for each time. When the Fold says four o'clock, your watch says eleven minutes past four." },
  tithe_custom: { tag: 'record', text: 'Every member owes the Company one new puzzle a year, called a Tithe. The Tithes are pinned on the Wall of Tithes in the Hall.' },
  invigilator_chair: { tag: 'insider', text: 'At the Proving, the invigilator sits in a chair at the back with the clock, and says nothing for three hours. The candidates never turn round to look.' },
  lodger_trick: { tag: 'pattern', about: ['pendry'], text: "Pendry's chess machine, the Lodger, is a copy of a famous machine from 1770. That machine could not think: a man hidden inside it made the moves." },
  basket: { tag: 'pattern', about: ['hesper'], text: "Dame Hesper's old waste-paper basket is on display. Its label says more good clues were rescued from it than most setters ever write. It does not say who rescued them." },
  lunch_tin: { tag: 'testimony', about: ['hob', 'kit'], text: "When Kit was a child, the Porter left a puzzle in her lunch tin every Monday. She thought all porters did that." },
  unfair_known: { tag: 'pattern', key: true, text: "The Hundred Guineas puzzle of 1911 cannot be solved, and the Warden who set it knew that. The Fold's oldest rule is that a puzzle must have a solution, or it is not a fair puzzle." },

  // --------------------------------------------- 4 Nonesuch Row (Pendry)
  pendry_bench: { tag: 'scene', about: ['pendry'], text: 'Pendry died at his bench. There was no wound and no struggle. Whatever happened was quiet, and took hours.' },
  locked_inside: { tag: 'scene', about: ['pendry'], key: true, text: "Pendry's workshop was locked from the inside with his own seven-ring letter-lock. His own word, PENDRYS, did not open it." },
  no_entry: { tag: 'scene', about: ['pendry'], text: 'The workshop window is barred and painted shut. Nobody came in or out that way.' },
  hall_tea: { tag: 'scene', about: ['pendry'], text: "Pendry took the Syndics' tea at the Hall at four, and carried his last cup back to his bench." },
  pendry_paper: { tag: 'scene', about: ['pendry'], key: true, text: "At eight on Sunday night, a 'Paper for a Syndic' in green ink reached Pendry by the Bellows. It told him he had drunk foxglove at four, and the Infirmary could save him until midnight. His door would now open only to one name of seven letters: 'It is in everything you sold.'" },
  pendry_tries: { tag: 'scene', about: ['pendry'], text: 'Pendry tried at least 190 seven-letter words on his own lock. He tried LORIMER twice.' },
  certificate_sole: { tag: 'scene', about: ['pendry', 'hesper'], text: "Pendry signed a certificate saying the whole 'Lorimer Legacy' was Dame Hesper's own work. He said the fair copies of the later years were 'in a copyist's hand' and did not matter. He was paid £40,000." },
  pendry_quarter: { tag: 'scene', about: ['pendry'], text: "Pendry's ledger says: 'Greywether. On completion 31 Oct. My quarter: £2,750,000.' The money was for him, not for the Company." },
  wilf_found: { tag: 'testimony', about: ['wilf', 'pendry'], text: 'At 7:15 on Monday morning, Wilf found that the workshop door would not open. The constables took it off its hinges.' },
  word_was_pendrys: { tag: 'testimony', about: ['wilf', 'pendry'], text: "Pendry's lock word had been PENDRYS for years. It was still PENDRYS on Friday." },
  banging: { tag: 'testimony', about: ['quoin', 'pendry'], text: "On Sunday night, from ten until after eleven, Mrs Quoin heard a slow knocking through the wall from Pendry's workshop. She thought it was a clock." },
  worked_lock: { tag: 'forensic', about: ['pendry'], text: "Pendry's fingertips were rubbed raw, with brass under the nails. He spent hours trying to turn the rings of his lock." },
  foxglove: { tag: 'forensic', about: ['pendry'], key: true, text: 'Pendry died of foxglove (digitalis) poisoning. He drank a strong brew of the plant itself in his tea.' },
  drank_at_four: { tag: 'forensic', about: ['pendry'], key: true, text: 'Pendry drank the poison at about four in the afternoon. He was ill by eight and died around midnight. His mind was clear almost to the end.' },
  could_be_saved: { tag: 'forensic', about: ['pendry'], text: 'There is an antidote at the Infirmary. A victim brought there by about ten that night would have lived.' },
  cup_foxglove: { tag: 'forensic', about: ['pendry'], text: "The foxglove was in Pendry's own cup from the Hall tea, and in nobody else's." },

  // -------------------------------------------------------------- the Hall
  locks_oiled: { tag: 'insider', key: true, text: "On Saturday the Syndics' letter-locks were oiled and re-pinned, as they are every October before the Proving. This included Pendry's, Sallow's, Voss's, the Warden's and the Lantern grille. It is written in the Porter's daybook." },
  pins_open: { tag: 'insider', text: "A setting-pin can change a letter-lock's word in a minute. The pins hang on open hooks in the Porter's Lodge, a yard from the tea table. Anyone could take one." },
  own_cups: { tag: 'insider', text: "Each Syndic has their own cup at the four o'clock tea. Anyone who knew the cups could poison one person and nobody else." },
  tea_porter: { tag: 'insider', about: ['hob'], key: true, text: "The Porter has set out and poured the Syndics' tea for forty years. Nobody watches him do it. Several people had to stop and think before they could say who does it." },
  rack_wound: { tag: 'insider', about: ['hob'], text: "Anyone can leave a carrier in the hold-rack at the Bellows exchange, to be sent at a later time. The rack runs on clockwork, and the Porter winds it on Mondays." },
  held_carrier: { tag: 'pattern', key: true, text: 'Paper I was put in the hold-rack at noon, and the clockwork sent it at eight. Whoever sent the Papers could have been anywhere when they arrived.' },
  hob_invigilates: { tag: 'insider', about: ['hob'], key: true, text: 'The Porter, R. Fettle, has been the invigilator at every Proving since 1990.' },
  vesper_name: { tag: 'record', about: ['hesper'], text: "Dame Hesper Lorimer's pen-name as a setter is VESPER." },
  completion_31: { tag: 'record', about: ['clay'], text: "The sale to Greywether is due to be completed on 31 October. It covers the Lorimer Legacy, the Hall building itself, and a list of other properties." },
  hob_barred: { tag: 'testimony', about: ['hob', 'hesper'], text: "The Porter made Dame Hesper's fair copies for forty years. Since March he has not been allowed to visit her, because of a 'family only' rule." },
  hob_copyist: { tag: 'record', about: ['hob', 'hesper'], text: "Robert 'Hob' Fettle has made Dame Hesper's fair copies, the clean final copies of her puzzles, since 1984." },
  monday_alibis: { tag: 'testimony', about: ['ottilie', 'hob', 'jonah'], text: "Ottilie's score-book shows that half the Fold was at the Stalemate on Monday night. The Porter played dominoes from seven till ten, and Jonah played Go until closing." },
  crux_puff: { tag: 'record', about: ['voss'], text: "The Crux, edited by Lucan Voss, announced the sale as 'securing the Fold's future'." },
  censor_is_voss: { tag: 'record', about: ['voss'], text: "CENSOR, the setter of the Crux crossword, is the paper's editor, Lucan Voss. He is the third Syndic." },

  // ------------------------------------------------------------- the sale
  legacy_sale: { tag: 'pattern', key: true, text: "Dame Hesper's life's work and the Lectern are being sold to Greywether plc of London. The buyers call it 'the Lorimer Legacy'." },
  warden_signs: { tag: 'record', about: ['clay', 'hesper'], key: true, text: 'Since March, the court has let the Warden, Auberon Clay, sign for Dame Hesper as her deputy. So the man selling her work is also the man who is supposed to protect it.' },
  masterplan: { tag: 'scene', about: ['sallow'], key: true, text: "Sallow's last drawing is Greywether's masterplan. The sale includes the Hall and most of the Fold: the Stalemate, Quoin's shop, the Almshouses, the ferry and the Porter's Lodge." },
  follow_money: { tag: 'pattern', text: 'The answer to Paper II, Question 3 is MONEY. The Paper tells you to follow it.' },
  escrow_four: { tag: 'record', about: ['clay', 'pendry', 'sallow', 'voss'], key: true, text: 'The £11,000,000 from Greywether is to be paid in four equal parts into the personal accounts of Clay, Pendry, Sallow and Voss. None of it goes to the Company.' },
  clay_admits_money: { tag: 'testimony', about: ['clay'], text: "The Warden calls the eleven million 'a fee'. He says it pays four people who carried a negotiation that the Company could never have managed." },
  four_syndics: { tag: 'pattern', key: true, text: 'Pendry and Sallow were two of the four Syndics selling the Fold. The other two are Lucan Voss and the Warden.' },
  sextant_clue: { tag: 'pattern', text: 'The answer to Paper II, Question 4 is SEXTANT. There is a sextant on board the Meridian.' },
  no_manuscripts: { tag: 'record', about: ['hesper'], text: "No Late Tithe survives in Dame Hesper's own handwriting. There are only fair copies, 'in the hand of the Company's copyist'. In January the fair-copy books were moved into the Warden's keeping." },

  // ---------------------------------------------------- the Meridian (Sallow)
  sallow_found: { tag: 'scene', about: ['sallow', 'nell'], text: 'Nell found Marguerite Sallow dead at her chart table at dawn on Tuesday.' },
  sallow_locked: { tag: 'scene', about: ['sallow'], text: "The Meridian's hatch was locked from inside, with the letter-lock still set to Sallow's own word. It was just like Pendry's door, even down to the fresh oil on the rings." },
  sallow_paper: { tag: 'scene', about: ['sallow'], text: 'Sallow had the same Paper as Pendry, with the same single question.' },
  sallow_log: { tag: 'scene', about: ['sallow', 'hob'], text: "Sallow's log says the Porter serviced her hatch lock on Saturday. On Monday she had her flask filled at the Hall at four, and locked herself in at seven." },
  sallow_same: { tag: 'forensic', about: ['sallow'], text: 'Sallow died in exactly the same way as Pendry. She drank foxglove in the Hall tea at four, and was dead by midnight.' },
  flask_foxglove: { tag: 'forensic', about: ['sallow'], text: "There was foxglove in Sallow's flask, which was filled at the Hall at four." },
  nobody_crossed: { tag: 'testimony', about: ['nell'], text: 'Nobody crossed the Cut after the last ferry on either night. Whoever did this was already inside the Fold.' },

  // ----------------------------------------------------------- Dame Hesper
  dame_tremor: { tag: 'scene', about: ['hesper'], text: "Dame Hesper's hands shake all the time. She cannot hold a pen to a line." },
  dame_unaware: { tag: 'testimony', about: ['hesper'], text: 'Dame Hesper does not know her work has been sold, and she has signed nothing.' },
  dame_incapable: { tag: 'record', about: ['hesper'], key: true, text: "Since before March, Dame Hesper has not been able to write, or to say what day it is. She could not have agreed to the sale. She could not have written the Papers either." },
  two_pens: { tag: 'scene', about: ['hesper'], text: "Dame Hesper's morning crossword is in two handwritings: her own shaky pencil, and a small, upright ink that finishes every clue. The ink is dry before breakfast." },
  no_visitors: { tag: 'record', about: ['hesper', 'clay'], text: "By the Warden's order, only family may visit Dame Hesper. She has no family. Nobody has signed her visitors' book since March." },
  oiled_latch: { tag: 'scene', about: ['hesper'], text: 'The hinges, latch and lock on the door of No. 4 have been freshly oiled. Someone comes and goes quietly.' },
  night_visitor: { tag: 'testimony', about: ['hesper', 'dolores'], text: 'Someone with a key visits Dame Hesper at night and does the crossword with her. The nurse has decided not to find out who.' },
  night_hand: { tag: 'forensic', about: ['hesper'], text: "The ink that finishes Dame Hesper's crossword at night is in the same handwriting as the Invigilator's Papers." },
  foxglove_bed: { tag: 'scene', about: ['hesper'], text: "A bed of foxgloves grows under Dame Hesper's window. It was cut back recently. Each stem was cut with one clean slant, the way you cut a quill pen." },
  bed_planted: { tag: 'testimony', about: ['hob', 'hesper'], text: 'The Porter planted the foxglove bed for Dame Hesper in 1999.' },
  physic_foxglove: { tag: 'record', text: "The Company's Physic Garden at the Almshouses has always grown foxglove." },
  photo_1984: { tag: 'scene', about: ['hesper', 'hob'], text: "A photograph from 1984 shows Dame Hesper at her desk, with a young porter beside her holding the page flat. He is not looking at the camera. He is reading the page." },
  dame_confesses: { tag: 'testimony', about: ['hesper'], text: "Dame Hesper says she set the Papers herself. 'Who else is there?'" },
  confession_false: { tag: 'pattern', about: ['hesper'], key: true, text: "Dame Hesper's confession is false, but she believes it. She recognises her own style in the Papers, and cannot imagine who else could write like that." },
  hand_shook: { tag: 'testimony', about: ['hesper', 'quoin'], text: "Mrs Quoin says Dame Hesper's hand began to shake in 2011. Yet every fair copy since then has been perfectly steady." },

  // ------------------------------------------------------------ the Engine
  engine_log: { tag: 'scene', about: ['jonah'], text: "The Lectern's log shows that it has never generated an examination question for anyone." },
  not_engine: { tag: 'testimony', about: ['jonah'], key: true, text: "The Lectern did not set the Papers. Its log shows no such work. It cannot write a fair clue, only something that looks like one." },
  two_hands: { tag: 'forensic', about: ['jonah', 'hesper'], key: true, text: "Jonah's study of writing style shows that the Lorimer puzzles have two authors. One wrote everything up to 2011. Another wrote the twelve Late Tithes. The Syndics told him to delete his study." },
  lodge_nights: { tag: 'record', about: ['hob'], text: "Nearly every night since March, someone at the Porter's Lodge terminal has used the Lectern between two and four in the morning. They ask it to read Dame Hesper's 1987 lectures aloud." },
  third_hand: { tag: 'pattern', key: true, text: "The Papers were set by someone who knows Dame Hesper's mind better than the machine built from her work. Nobody counts this person as a setter. It is the Lodger's trick: a hidden person is doing the work." },

  // --------------------------------------------------------- the third Paper
  third_tonight: { tag: 'pattern', text: 'Paper III says the third candidate can still be saved. You must solve the slate at the Stalemate before the Hall clock strikes twelve.' },
  censor_named: { tag: 'pattern', about: ['voss'], key: true, text: "The slate at the Stalemate says: 'Candidate three sets as CENSOR.'" },
  voss_locked: { tag: 'scene', about: ['voss'], text: "Voss was locked in the Crux office. His letter-lock no longer opened to his own word. He had a cup from the Hall tea and a green-ink Paper." },
  voss_paper: { tag: 'scene', about: ['voss'], text: "Voss's Paper asks the same single question as the others: one name, seven letters, 'in everything you sold'." },
  voss_confesses: { tag: 'testimony', about: ['voss', 'clay', 'hob'], key: true, text: "Lucan Voss says all four Syndics knew the Late Tithes were not Dame Hesper's work. In January the Porter showed the Warden his books to prove it. They locked the books away and sold the work as hers anyway." },
  clay_took_books: { tag: 'testimony', about: ['clay', 'hob'], text: "In January the Porter brought the Warden his fair-copy books and began to make 'claims'. The Warden took the books and locked them in his safe." },
  spiked_letter: { tag: 'record', about: ['voss'], key: true, text: "Voss refused to print a letter to the Crux from 'a servant of the Hall'. It said: 'The Late Tithes are not what the Company is selling them as. Ask who made the fair copies, and why they are locked in the Warden's safe.'" },
  letter_same_hand: { tag: 'forensic', key: true, text: "The same person wrote the spiked letter from 'a servant of the Hall' and the Invigilator's Papers." },
  porter_clue: { tag: 'record', about: ['voss', 'hob'], text: "In next Friday's Crux crossword by CENSOR, 14 across is 'Carrier with ideas above his station? Stout fellow! (6)'. The answer is PORTER. In the margin: 'One for the Lodge.'" },

  // -------------------------------------------------------------- the name
  nina_ariadne: { tag: 'identity', key: true, text: 'Every Late Tithe hides the same name, running corner to corner through the solved square: ARIADNE. None of her puzzles from before 2012 do this.' },
  word_ariadne: { tag: 'identity', key: true, text: "ARIADNE opens Pendry's lock. It is the 'one name' that is 'in everything you sold'. Any of the victims could have walked out at any time." },
  epigraph_ariadne: { tag: 'identity', text: "The line at the top of Paper IV hides a word in its capital letters, using Bacon's cipher: ARIADNE." },
  not_in_rolls: { tag: 'record', text: "In six hundred years, there is no Ariadne in the Company's Rolls. There is no Fettle either, because the Rolls list members, not servants." },
  ariadne_fettle: { tag: 'identity', about: ['hob', 'ariadne'], key: true, text: "Ariadne Fettle was the Porter's daughter. She was the quickest child Mrs Quoin ever fitted, and she answered Nell's riddle three ways. She died of a fever in January 1998, aged nine." },
  dame_names_hob: { tag: 'identity', about: ['hesper', 'hob'], key: true, text: "When shown the name, Dame Hesper says: 'That's Hob's girl. He puts her in everything he sets. The Late Tithes are his, you know. All twelve of them. He learned it all from my waste-paper basket.'" },
  dame_asks: { tag: 'testimony', about: ['hesper', 'hob'], key: true, text: "Dame Hesper asks for the Porter: 'Tell Hob the four o'clock problem wants solving.'" },
  faircopy_hand: { tag: 'scene', about: ['hob', 'hesper'], key: true, text: "The fair-copy books are not just copies. In them, the 'copyist' crosses out Dame Hesper's clues and writes better ones, and she writes 'yes' in the margin." },
  hand_match: { tag: 'forensic', about: ['hob'], key: true, text: "The handwriting in the fair-copy books is the same as on the Invigilator's Papers." },
  changed_at_service: { tag: 'forensic', about: ['hob'], key: true, text: "Pendry's lock word was changed while the lock was open on a bench for oiling. The setting-pin's scratches are under the fresh oil, not on top of it." },
  paper_hand: { tag: 'forensic', text: "The Papers are written in Company ink, in a small, upright, practised hand. It is the hand of a clerk or a copyist." },
  portrait_clue: { tag: 'pattern', about: ['hesper'], text: "Dame Hesper's clue, 'left, characteristic, likeness', means PORTRAIT. She hid something behind her own portrait." },
  codicil: { tag: 'identity', about: ['hesper', 'hob'], key: true, text: "Dame Hesper's Codicil of 2016 was hidden behind her portrait. It says the Tithes since 2012 are the work of Robert Fettle. She wrote: 'I am proud to put my name beside his, not above it.'" },
  porter_can: { tag: 'insider', about: ['hob'], key: true, text: 'The Porter pours the tea, oils the locks, winds the hold-rack and invigilates the Proving. So he controls the cup, the lock, the carrier and the chair. Nobody notices him doing any of it, because it is his job.' },
  true_author: { tag: 'identity', about: ['hob', 'hesper'], key: true, text: "For twelve years, the Company's greatest work has been the Porter's. The four Syndics sold it as Dame Hesper's. When he told them, they locked up his books and stopped him from visiting her." },
  method: { tag: 'pattern', key: true, text: "The killer did not need to be there. Each victim was poisoned at the four o'clock tea. Their lock had already been given a new word, and their Paper came by clockwork. So nobody's alibi proves anything." },
  tuition: { tag: 'pattern', text: 'The answer to Paper IV, Question 7 is TUITION. The word now means teaching, but it first meant guardianship: keeping someone safe.' },
  lantern_known: { tag: 'pattern', key: true, text: "Take the first letter of the first answer, the second letter of the second, and so on through all seven. They spell LANTERN, the glass room on the roof of Setters' Hall." },
};
