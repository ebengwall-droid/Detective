// Everything the detective can come to know, as notebook entries.
//
// A fact is a single established point. Hotspots, people, lab results and
// records all pay out in facts, and the rest of the case (who will talk, which
// deductions open, how the finale goes) is gated on which facts you hold.
//
// tag: scene | forensic | testimony | record | pattern | insider | identity
// key: counts toward the final case rating

/** @type {Record<string, { text: string, tag: string, about?: string[], key?: boolean }>} */
export const FACTS = {
  // ------------------------------------------------- 9 Gull Street (Brook)
  no_forced_entry: { tag: 'scene', about: ['brook'], text: 'No forced entry at Gull Street. Brook opened the front door to his killer.' },
  chair_salt: { tag: 'scene', about: ['brook'], text: "Brook's collar and the chair back were soaked. The damp has dried to a white crust: salt." },
  seawater_floor: { tag: 'scene', about: ['brook'], text: 'A couple of gallons of seawater went into the study carpet. A ring pressed in the pile shows where a heavy can stood.' },
  basin_used: { tag: 'scene', about: ['brook'], text: 'The china basin from the hall washstand was on the hearth, wiped clean. Brook was drowned in it, sitting up.' },
  lantern_maker: { tag: 'scene', about: ['fenn'], text: 'The lantern is an Aldous No. 4 storm lantern, stamped FENN & DAUGHTER · LAMP ROW · GREYHAVEN.' },
  lantern_window: { tag: 'scene', about: ['brook'], text: 'The lantern was lit and set in the window that faces the harbour mouth and Marrow Point.' },
  wick_swallowtail: { tag: 'scene', text: "The lantern's wick is trimmed to a neat forked 'swallowtail'. Careful work by steady hands." },
  token_0155: { tag: 'scene', about: ['brook'], key: true, text: "A brass Vale Lines boarding token hung on the lantern. Punched into the back: 01:55." },
  burnt_letter: { tag: 'scene', about: ['brook', 'hale'], text: "Brook burned a letter he had started: 'Desmond — it has come for me too. 01:55. If you had not turned back—'" },
  burnt_letter_lab: { tag: 'forensic', about: ['brook', 'hale'], text: "Recovered from the ash: 'Conrad says say nothing. I say we are dead men already. We should go to the Ledger before the 14th.'" },
  brook_called_hale: { tag: 'scene', about: ['brook', 'hale'], text: "Brook's telephone pad shows the Harbour Precinct captain's line, rung twice on 8 October." },
  token_posted: { tag: 'scene', about: ['brook'], text: "A token-sized envelope postmarked 30 September in Brook's desk. His token came by post ten days before he died." },
  cash_short: { tag: 'scene', about: ['dray'], text: "Brook's housekeeping box is £340 short of what his own ledger says he drew on the 9th." },
  cash_prints: { tag: 'forensic', about: ['dray'], text: 'Fresh fingerprints on the cash box belong to Agnes Dray.' },
  canvass_bicycle: { tag: 'record', about: ['dray'], text: "A neighbour at number 14 saw Agnes Dray's bicycle at the garden gate at about 9:30 on the night Brook died. She says she left at six." },
  seal_broken: { tag: 'insider', key: true, text: 'The garden-door seal at Gull Street was cut and taped over again during the night, using police tape.' },
  scene_keys: { tag: 'insider', about: ['brandt', 'hale', 'vance'], text: 'Three people held keys to the sealed scene: Brandt, Captain Hale and DS Vance.' },
  button_found: { tag: 'scene', about: ['hale'], text: "A brass Harbour Division dress-tunic button was lying under Brook's chair on the second day." },
  button_planted: { tag: 'insider', about: ['hale'], key: true, text: "Brandt's first-sweep photographs show bare carpet under Brook's chair. The button was put there after the scene was sealed." },

  // ------------------------------------------------------------ forensics
  brook_drowned_seawater: { tag: 'forensic', about: ['brook'], key: true, text: 'Leland Brook drowned in seawater, in a dry study half a mile above the tide.' },
  brook_tod: { tag: 'forensic', about: ['brook'], text: "Brook died between 10 and 11 p.m. on 10 October. Whatever 01:55 means, it is not the time of death." },
  needle_mark: { tag: 'forensic', about: ['brook'], text: "A single needle puncture behind Brook's right ear, hidden in the hairline." },
  sedative_morvane: { tag: 'forensic', key: true, text: 'Brook was sedated with Morvane, a fast injectable sedative, before he was drowned.' },
  water_red_lead: { tag: 'forensic', text: "The water in Brook's lungs carried kelp and flakes of red-lead paint: open sea, taken from beside old painted ironwork." },
  hand_bruise: { tag: 'forensic', text: "A bruise across the back of Brook's neck where a hand held his face under. By its span, a small hand." },
  police_morvane_training: { tag: 'insider', text: 'Harbour police carry Morvane on the launches and every officer on the water is taught to inject it.' },
  vale_drowned: { tag: 'forensic', about: ['cvale'], text: 'Conrad Vale drowned in seawater, sedated with Morvane. Two punctures: the first attempt missed.' },
  vale_fought: { tag: 'forensic', about: ['cvale'], text: 'Vale fought. Bruised wrists, and a brass chain link closed in his right fist.' },
  vale_tod: { tag: 'forensic', about: ['cvale'], text: 'Vale died between 1:15 and 1:45 a.m. on 12 October.' },
  pell_retest: { tag: 'forensic', about: ['pell'], key: true, text: 'Retained samples from Ambrose Pell show seawater in the lungs and Morvane in the blood. He was murdered.' },
  water_marrow_point: { tag: 'forensic', key: true, text: 'The same water in all three men: red lead and kelp. The only ironwork on this coast still in red lead is the gallery rail at Marrow Point light.' },
  chain_link: { tag: 'forensic', key: true, text: "The link from Vale's fist comes from a fine brass curb chain, old, once mended with a spot of solder." },

  // ------------------------------------------------------------ lamp shop
  fenn_lost_family: { tag: 'testimony', about: ['fenn'], text: "Tobias Fenn's wife Marian and daughter Lucy were lost on the Calliope." },
  fenn_threat: { tag: 'testimony', about: ['fenn', 'cvale'], text: "At the inquiry Fenn told Conrad Vale: 'I'll see you in the dark.'" },
  jar_short: { tag: 'scene', about: ['fenn'], text: 'Fenn keeps the thirty-one unclaimed Calliope tokens the Line gave the families. The jar holds twenty-seven.' },
  fenn_punches: { tag: 'scene', about: ['fenn'], text: "Fenn's bench holds a set of number punches, the kind that stamped the times into the tokens." },
  ledger_four: { tag: 'scene', about: ['fenn'], text: "Fenn's ledger, 9 March: four Aldous No. 4 lanterns, paid in cash, 'for a memorial'." },
  buyer_woman: { tag: 'testimony', about: ['fenn'], key: true, text: "The four lanterns were bought by a woman of about thirty who paid cash and stood a long time in front of Lucy Fenn's photograph." },
  lucy_photo: { tag: 'identity', about: ['fenn'], text: "A photograph in Fenn's shop: Lucy at eleven on Customs Quay, a brass bosun's whistle on a chain around her neck." },
  swallowtail_fenn: { tag: 'identity', about: ['fenn'], key: true, text: "The swallowtail wick is Fenn's own cut. He says he taught it to one person only: 'a dead girl'." },
  fenn_tremor: { tag: 'identity', about: ['fenn'], text: "Fenn's hands shake. He could not trim that wick today, let alone find a vein with a needle." },
  fenn_newspaper: { tag: 'identity', about: ['fenn', 'vance'], key: true, text: "On Fenn's bench lies the Ledger's photograph of detectives at Gull Street. He has ringed the whistle at DS Vance's collar in pencil." },

  // --------------------------------------------------------------- tavern
  calliope_known: { tag: 'pattern', key: true, text: 'The tokens are boarding tokens for the Calliope, the night ferry lost off Marrow Point twenty years ago this 14 October. Thirty-one dead.' },
  memorial_0231: { tag: 'pattern', text: "The Calliope memorial: 'Struck the Teeth off Marrow Point, 14 October, 02:31. Thirty-one souls.'" },
  pell_lodger: { tag: 'testimony', about: ['pell'], text: 'Ambrose Pell, last keeper of Marrow Point light, lodged above the Anchor & Lamp and died there on 22 September.' },
  pell_token_post: { tag: 'testimony', about: ['pell'], text: 'A month before he died Pell was sent a brass ferry token with a time marked on it. It frightened him badly.' },
  pell_was_drinking: { tag: 'testimony', about: ['pell', 'carrow'], key: true, text: "On the night of the wreck Pell was drinking in the Anchor while his light stood dark. Conrad Vale's money bought silence, Bess Carrow's included." },
  hale_turned_round: { tag: 'testimony', about: ['hale'], key: true, text: "Bess Carrow: Sergeant Hale came in at dawn after the wreck, soaked through. 'I turned her round, Bess. God forgive me.'" },
  lucy_whistle_bess: { tag: 'identity', text: "Bess remembers Lucy Fenn 'always blowing that bosun's pipe her dad made her'." },
  lucy_not_found: { tag: 'identity', key: true, text: "Lucy Fenn, aged 11: 'presumed lost, no remains recovered'. The sea never gave her back." },
  strand_named_killer: { tag: 'testimony', about: ['strand'], text: "Milo Strand coined 'the Lamplighter'. He covered the Calliope inquiry as a junior reporter." },
  four_lights: { tag: 'pattern', about: ['strand'], key: true, text: "The letter Strand held back: 'Four lights for four men who let the dark in.' There will be a fourth." },
  petrel_hale_strand: { tag: 'testimony', about: ['hale', 'strand'], text: "Strand's inquiry notebook names the officer commanding the Petrel: Sergeant D. Hale." },
  strand_source: { tag: 'insider', about: ['strand'], key: true, text: "Strand has a source inside the precinct: a woman who telephones after midnight and calls herself 'a friend of the Calliope'." },
  strand_at_marina: { tag: 'testimony', about: ['strand'], text: "Strand was at the marina the night Vale died. His source told him to be there 'before two'." },
  photo_cape: { tag: 'insider', key: true, text: "Strand's photograph: a slight figure in a police oilskin leaving the Second Wind with a steel can, beside an unmarked car. Plate GH-7K4." },

  // ----------------------------------------------------------- Pell's room
  bath_salt: { tag: 'scene', about: ['pell'], text: "A salt tidemark on Pell's zinc bath. Bath water does not leave salt." },
  token_0110: { tag: 'scene', about: ['pell'], key: true, text: "Pell's lantern carries a token too: 01:10." },
  pell_logbook: { tag: 'scene', about: ['pell', 'cvale'], key: true, text: "Pell's hidden logbook: '01:10 she went dark. I was at Bess's.' And later: 'False entry made at Mr Vale's instruction.'" },
  can_ring: { tag: 'scene', about: ['pell'], text: "A rust ring on Pell's floorboards where a wet steel can was set down." },
  ampoule_cap: { tag: 'scene', about: ['pell'], text: "Under Pell's bed: the red plastic cap of a Morvane ampoule." },
  ampoule_batch: { tag: 'insider', key: true, text: "The ampoule cap's batch mark matches seizure 19-0443: the Morvane held in the Harbour Precinct's own evidence locker." },
  pell_death_lantern: { tag: 'record', about: ['pell'], text: "The sudden-death report on Pell notes 'a storm lantern burning on the sill'. Nobody thought twice. He was a lighthouse keeper." },

  // ---------------------------------------------------------------- yacht
  token_0231: { tag: 'scene', about: ['cvale'], key: true, text: "The token on Vale's lantern reads 02:31." },
  vale_let_in: { tag: 'scene', about: ['cvale'], text: 'Two glasses poured in the saloon. Vale welcomed his visitor aboard.' },
  small_boots: { tag: 'scene', text: "Wet prints on the yacht's companionway: a small boot, a woman's six." },
  safe_wiped: { tag: 'scene', about: ['cvale', 'ivale'], text: "Vale's safe stood open and wiped, with a clean oblong in the dust where something the size of a dictaphone had sat." },
  vale_called_hale: { tag: 'scene', about: ['cvale', 'hale'], text: "Vale's last call, 10:40 on the night he died: the Harbour Precinct captain's line. Four minutes." },
  vale_frightened: { tag: 'testimony', about: ['cvale'], text: 'Vale had been frightened for a month, since something small came in the post that he would not show his wife.' },
  hale_visited_yacht: { tag: 'testimony', about: ['hale', 'cvale'], key: true, text: "Isolde Vale: Captain Hale came aboard on the 9th and they quarrelled. Vale said, 'You turned the boat, Desmond, not me.'" },
  vale_tape: { tag: 'testimony', about: ['cvale', 'hale', 'pell', 'brook'], key: true, text: 'Vale on tape: he ordered the Calliope to sail, paid Pell and Brook to lie, and told Sergeant Hale to turn the Petrel back at five past three.' },

  // ------------------------------------------------------ the old inquiry
  timeline_known: { tag: 'pattern', key: true, text: 'The inquiry timeline: 01:10 light dark (keeper Pell) · 01:55 cleared to sail (harbour master Brook) · 02:31 struck the Teeth · 03:05 police launch Petrel recalled.' },
  inquiry_sealed: { tag: 'record', text: "The full Calliope inquiry file is sealed. Opening it takes Captain Hale's authority." },
  box_resealed: { tag: 'insider', text: 'The sealed Calliope evidence box in the precinct cage carries a fresh wax seal. Someone has been into it recently.' },
  sealed_truth: { tag: 'record', about: ['hale', 'cvale', 'brook'], key: true, text: "The unsealed exhibits: Vale telephoned Brook minutes before the clearance, and the Petrel's own radio log reads 'Vale to Petrel. Bring her in, Sergeant.' Signed D. Hale. None of it was shown in open court." },
  brook_buried_child: { tag: 'identity', about: ['brook'], key: true, text: "Exhibit 31: a week after the wreck Harrowgate asked the Harbour Master about an unidentified child. Brook answered, 'All minors accounted for.'" },
  hale_cox: { tag: 'record', about: ['hale'], text: "A photograph in the Captain's office: the police launch Petrel and her crew. The caption reads 'Sgt D. Hale, cox'n'." },
  hale_promoted: { tag: 'record', about: ['hale'], text: 'Hale made Inspector two years after the Calliope and Captain eight years after that.' },
  pattern_calliope: { tag: 'pattern', key: true, text: "Each token marks the moment one man failed the Calliope. The Lamplighter is working down the inquiry's own timeline." },
  pell_first: { tag: 'pattern', about: ['pell'], key: true, text: "Ambrose Pell, 01:10, was the first victim. His death was passed off as a drunk's accident." },
  fourth_is_hale: { tag: 'pattern', about: ['hale'], key: true, text: '03:05 belongs to the man who turned the Petrel back: Desmond Hale. He is the fourth light.' },

  // ------------------------------------------------------------ the inside
  letter_no_post: { tag: 'insider', key: true, text: "The Lamplighter's letters reach your desk with no stamp and no entry in the front-desk log. They are delivered from inside the building." },
  corvin_e: { tag: 'insider', about: ['vance'], text: "DS Vance's old Corvin portable drops its lowercase 'e' a hair below the line." },
  letter_typeface: { tag: 'insider', key: true, text: "The Lamplighter's letters were typed on a Corvin portable whose lowercase 'e' sits low." },
  harbour_police_voice: { tag: 'insider', about: ['dray'], key: true, text: "Agnes Dray heard Brook greet his killer at the door: 'Police? At this hour? ...Well, come in, Sergeant.'" },
  cape_can: { tag: 'testimony', about: ['dray'], key: true, text: "Dray saw the visitor from the lane: a police oilskin cape, hood up, carrying a steel can. 'Not a big person. Moved young.'" },
  plate_7k4: { tag: 'testimony', about: ['dray'], text: 'A dark saloon waited in the lane without lights. Part of the plate: 7K4.' },
  pool_car: { tag: 'insider', about: ['hale', 'vance'], key: true, text: "GH-7K4 is unmarked pool car 7. It was out on each night a man died, signed 'Capt Hale p.p. NV'." },
  drug_log: { tag: 'insider', about: ['hale'], key: true, text: "Six Morvane ampoules left the precinct drug locker on 20 September: 'for destruction, auth. Capt. D. Hale'. No destruction certificate exists." },
  archive_log: { tag: 'insider', about: ['hale', 'vance'], key: true, text: "The sealed Calliope file was opened with Hale's login on 2 March and 19 September, both times late at night from terminal B-12." },
  b12_vance: { tag: 'insider', about: ['vance'], key: true, text: 'Terminal B-12 is desk 4: DS Vance.' },
  hale_dinner: { tag: 'insider', about: ['hale'], key: true, text: 'On 19 September Hale was photographed at the Benevolent Fund dinner at 11:45 p.m. and stayed past one. He was not at terminal B-12 at 11:40.' },
  insider: { tag: 'insider', key: true, text: 'The Lamplighter is inside the police.' },
  hale_framed: { tag: 'insider', about: ['hale'], key: true, text: "Someone has been signing the Captain's name. Hale is being dressed to carry the murders." },
  hale_knew_tokens: { tag: 'testimony', about: ['hale', 'brook'], text: 'Hale admits Brook rang him twice: Brook had been sent a token and wanted to know if Hale had too. Hale told him to burn it and lock his door.' },
  hale_denies_logs: { tag: 'testimony', about: ['hale'], text: 'Hale denies all three logs: he never signed for Morvane, has not driven at night in two years, and has never used terminal B-12.' },
  hale_limp: { tag: 'testimony', about: ['hale'], text: 'Hale is a heavy man with a bad hip who walks with a cane. He does not vault garden gates.' },
  hale_admits: { tag: 'testimony', about: ['hale', 'cvale'], key: true, text: "Hale admits it: he commanded the Petrel, and at 03:05 he turned her back from the people in the water because Conrad Vale told him to." },
  hale_token: { tag: 'pattern', about: ['hale'], key: true, text: 'Hale has had a token of his own for five weeks: 03:05. He told no one.' },
  tunic_missing: { tag: 'insider', about: ['hale'], text: "Hale's dress tunic hangs in his office with one button gone. The threads were cut, not torn." },
  vance_aide: { tag: 'insider', about: ['vance', 'hale'], text: "DS Vance is Hale's aide for records and evidence. She keeps the evidence book and signs for him as routine." },
  vance_whistle_chain: { tag: 'identity', about: ['vance'], text: "DS Vance wears a brass bosun's whistle on a fine brass chain, worn smooth with handling." },
  vance_whistle_cord: { tag: 'identity', about: ['vance'], key: true, text: "Since the night Vale died, Vance's whistle hangs from a leather bootlace. She says the chain 'caught on a door'." },
  vance_harrowgate: { tag: 'identity', about: ['vance'], text: 'Vance came to Greyhaven three years ago from Harrowgate, at her own request.' },
  drawer: { tag: 'insider', about: ['vance'], key: true, text: "Vance's locked drawer: a Marrow Point tide table with 03:05 on the 14th ringed, number punches bright with brass filings, and a half-typed 'Confession of Desmond Hale'." },

  // ------------------------------------------------------------- identity
  fenn_custody: { tag: 'record', about: ['fenn'], key: true, text: 'Tobias Fenn spent the night Brook died in a cell at Eastgate station, 9:10 p.m. to 6 a.m. He cannot have killed him.' },
  fenn_skiff: { tag: 'record', about: ['fenn'], text: "Fenn's skiff has been hauled out as unseaworthy since 2 September." },
  confession_wrong: { tag: 'testimony', about: ['fenn'], key: true, text: 'Fenn confessed, but the details are wrong: he says he struck the men down, knows nothing of a needle, and says he rowed to the yacht in a boat that cannot float.' },
  fenn_protecting: { tag: 'identity', about: ['fenn'], key: true, text: "Fenn's confession is false. He is protecting someone." },
  infirmary: { tag: 'identity', about: ['vance'], key: true, text: 'Harrowgate, twenty years ago: a trawler landed an unidentified girl of about eleven with a brass bosun\'s whistle round her neck. She was fostered by a family named Vance.' },
  fenn_knows: { tag: 'identity', about: ['fenn', 'vance'], key: true, text: 'Fenn: the woman who bought the lanterns was his daughter. He knew her, said nothing, and confessed so that she would not hang.' },
};
