// Physical evidence and documents the detective can carry, send to the lab,
// and put in front of people.
//
// icon: a key into the client's icon set
// facts: learned the moment the item is taken
// lab: { steps, result, facts } — what the lab reports, `steps` actions later
// doc: long-form text shown when the item is opened (reports, letters)

/** @type {Record<string, any>} */
export const EVIDENCE = {
  lantern_brook: {
    name: 'Storm lantern from Gull Street',
    icon: 'lantern',
    desc: "A brass Aldous No. 4 storm lantern, still warm when Brandt bagged it. Base stamped FENN & DAUGHTER · LAMP ROW · GREYHAVEN. The wick is trimmed to a careful forked tail.",
    facts: ['lantern_maker', 'wick_swallowtail'],
  },
  token_0155: {
    name: 'Boarding token, 01:55',
    icon: 'token',
    desc: "A brass disc the size of a florin. Front: VALE LINES · NIGHT FERRY · ONE PASSAGE. Back: 01:55, struck in with number punches, one digit at a time.",
    facts: ['token_0155'],
  },
  burnt_letter: {
    name: 'Burnt letter from the grate',
    icon: 'paper',
    desc: "Charred sheets in Brook's own hand. One corner survives: 'Desmond — it has come for me too. 01:55. If you had not turned back—'",
    facts: ['burnt_letter'],
    lab: {
      steps: 7,
      result: "Infra-red on the charred sheets brings up more of Brook's draft: 'Conrad says say nothing. I say we are dead men already. We should go to the Ledger before the 14th.' The letter was never sent.",
      facts: ['burnt_letter_lab'],
    },
  },
  cashbox: {
    name: 'Housekeeping cash box',
    icon: 'box',
    desc: "A japanned tin from Brook's bureau. His pocket ledger says he drew £400 on the 9th. The box holds sixty.",
    facts: ['cash_short'],
    lab: {
      steps: 5,
      result: "Fingerprints on the lid and the till tray: Leland Brook, old and smudged. Agnes Dray, fresh, both hands.",
      facts: ['cash_prints'],
    },
  },
  canvass_report: {
    name: 'Door-to-door report, Gull Street',
    icon: 'doc',
    desc: "Brandt's notes from the neighbours.",
    doc: `GREYHAVEN HARBOUR POLICE — HOUSE-TO-HOUSE
Gull Street, 11 October, 06:50–07:40. Off. T. Brandt.

No. 7 — no reply.
No. 11 — heard nothing. Retired to bed 21:00.
No. 14 (Mrs Halloran) — at her front window about 21:30 letting the cat in. Saw the Brook housekeeper's bicycle leaning on the garden gate of no. 9. "The green one with the basket. She never comes of an evening." Did not see Mrs Dray herself.
No. 14 also — a motor car in the back lane "with no lamps lit". Could not describe.
No. 16 — away.

Note: Mrs Dray states she left no. 9 at 18:00 and did not return.`,
    facts: ['canvass_bicycle'],
  },
  autopsy_brook: {
    name: 'Autopsy report: Leland Brook',
    icon: 'doc',
    desc: "Dr Okoro's findings on Brook.",
    doc: `COUNTY MORTUARY, GREYHAVEN — POST-MORTEM REPORT
Subject: BROOK, Leland. Male, 74.
Examined 11 October by A. Okoro, M.D.

CAUSE OF DEATH: Drowning. Salt water.
Lungs heavy and waterlogged. Fluid is seawater: marine diatoms, kelp fragments, and flakes of red-lead paint. This is open-sea water taken beside old painted ironwork, not harbour water and not tap water with salt added.

TIME OF DEATH: 22:00–23:00, 10 October.

OTHER FINDINGS:
— Single needle puncture behind the right ear, in the hairline. Preliminary screen positive for MORVANE (injectable sedative).
— Bruise across the nape, the span of a hand. A small hand.
— Water-wrinkling of the face only. Clothing dry except the collar. He was drowned sitting upright, face held in a basin.
— No defensive injuries. He was already sedated.

REMARK: The deceased did not go to the sea. The sea was brought to him.`,
    facts: ['brook_drowned_seawater', 'brook_tod', 'needle_mark', 'sedative_morvane', 'water_red_lead', 'hand_bruise'],
  },
  autopsy_vale: {
    name: 'Autopsy report: Conrad Vale',
    icon: 'doc',
    desc: "Dr Okoro's findings on Vale.",
    doc: `COUNTY MORTUARY, GREYHAVEN — POST-MORTEM REPORT
Subject: VALE, Conrad. Male, 61.
Examined 12 October by A. Okoro, M.D.

CAUSE OF DEATH: Drowning. Salt water. Same fluid profile as BROOK: diatoms, kelp, red-lead paint.

TIME OF DEATH: 01:15–01:45, 12 October.

OTHER FINDINGS:
— TWO needle punctures behind the right ear. The first is shallow and angled: a miss. Morvane positive.
— Bruising at both wrists. Abrasion to the knuckles of the right hand.
— Right fist closed in spasm around a link of fine brass chain (passed to Off. Brandt).
— Bruise at the nape, small hand, as before.

REMARK: The same hand, the same method. This one fought.`,
    facts: ['vale_drowned', 'vale_fought', 'vale_tod'],
  },
  ledger_entry: {
    name: "Fenn's sales ledger, 9 March",
    icon: 'book',
    desc: "A line in Tobias Fenn's copperplate: '9 Mar — 4 × Aldous No. 4, trimmed & filled — cash — (for a memorial)'. No name.",
    facts: ['ledger_four'],
  },
  token_0231: {
    name: 'Boarding token, 02:31',
    icon: 'token',
    desc: "The same brass, the same punches. Back: 02:31. It hung from the bail of the lantern in Vale's saloon.",
    facts: ['token_0231'],
  },
  chain_link: {
    name: 'Brass chain link',
    icon: 'chain',
    desc: "One link of fine chain, bagged. Brandt had to open the dead man's fingers to get it.",
    facts: ['vale_fought'],
    lab: {
      steps: 8,
      result: "A 2 mm brass curb link, old; worn bright on the inside from long wear against skin. One side carries a blob of solder: the chain was mended once, by an amateur. Skin cells on the link give a female DNA profile. Matching it to a person will take weeks.",
      facts: ['chain_link'],
    },
  },
  safe_dust: {
    name: "Photograph: Vale's safe",
    icon: 'photo',
    desc: "Brandt's flash photograph of the open safe on the Second Wind. The steel is wiped clean, but the dust on the shelf is not: a sharp clean oblong, about five inches by three.",
    facts: ['safe_wiped'],
  },
  vale_tape: {
    name: 'Dictaphone tape: Conrad Vale',
    icon: 'tape',
    desc: "A miniature cassette. Isolde Vale took it from the safe before the police arrived.",
    doc: `[TRANSCRIPT — voice identified by Mrs I. Vale as Conrad Vale]

"...This is Conrad Vale, and if you are hearing it I am dead, and I would like someone to hang for it besides me.

On the night of the thirteenth of October the Calliope had to be in Port Sorrow by morning or the Line lost the mail contract, and with it everything. The Marrow Point light was reported dark at ten past one. Pell was drunk in the Anchor; he was always drunk in the Anchor. I telephoned Leland Brook at the harbour office and I told him she sailed or he was finished. At five to two he cleared her.

She struck at two thirty-one.

The police boat got out to them. A sergeant called Hale. I got him on the set and I told him to bring the Petrel home, that there was nothing to be done and the Line would see him right. He turned her round at five past three. There were people in the water who could see his lamps.

I paid Pell to alter his log. I paid Brook. I paid the woman at the Anchor. Hale I didn't pay. Hale I promoted.

Somebody has sent each of us the time. Mine is two thirty-one. I don't know who. I only know they're right."`,
    facts: ['vale_tape'],
  },
  token_0110: {
    name: 'Boarding token, 01:10',
    icon: 'token',
    desc: "From the lantern on Ambrose Pell's windowsill. Back: 01:10. It has been hanging there for three weeks.",
    facts: ['token_0110'],
  },
  pell_logbook: {
    name: "Pell's logbook",
    icon: 'book',
    desc: "The keeper's own book, wrapped in oilcloth under a floorboard with a roll of old banknotes.",
    doc: `MARROW POINT LIGHT — KEEPER'S LOG — A. PELL
(the private book. not the one I gave them)

13 Oct. Glass falling all day. Trimmed & filled at dusk. Lit 18:05.
23:40 left the light. Wind SW 8.
14 Oct. 01:10 she went dark. I was at Bess's. I saw her go from the window & I did not go.
02:31 —
dawn. 31.

19 Oct. Mr Vale's man came. The official book now reads LAMP FAILED 02:25, MECHANICAL. False entry made at Mr Vale's instruction. £200. Bess the same.

I have kept this one so that there is one true thing.`,
    facts: ['pell_logbook'],
  },
  ampoule_cap: {
    name: 'Ampoule cap',
    icon: 'vial',
    desc: "A red plastic snap-cap, the kind that seals a 2 ml glass ampoule. Embossed: MORVANE. It had rolled under Pell's bed.",
    facts: ['ampoule_cap'],
    lab: {
      steps: 6,
      result: "Batch mark MV-4471-C. That batch was never sold in this county. Twenty-four ampoules of it were seized in 2019 (case 19-0443) and have been held ever since in one place: the drug locker of the Harbour Precinct evidence cage.",
      facts: ['ampoule_batch'],
    },
  },
  tunic_button: {
    name: 'Dress-tunic button',
    icon: 'button',
    desc: "Brass, fouled-anchor crest: Harbour Division, senior officers' dress tunic. It was under Brook's armchair on the second day. Four thread ends still in the shank, cut square.",
    facts: ['button_found'],
  },
  strand_photo: {
    name: "Strand's photograph",
    icon: 'photo',
    desc: "One frame, pushed three stops, grainy as wet sand. Customs Quay at night. A figure in a long police oilskin, hood up, stepping off the Second Wind with a steel can. Slight; the cape hangs to the ankles. Behind, an unmarked saloon. The plate is legible: GH-7K4.",
    facts: ['photo_cape', 'plate_7k4'],
  },
  letter_strand: {
    name: "The Lamplighter's second letter to the Ledger",
    icon: 'letter',
    desc: "Typed, unsigned. Strand held it back from print.",
    doc: `To the Ledger.

You gave me a name. I had not thought to want one.

You wrote that I am mad. I am the only one in Greyhaven who can still count. Thirty-one. Say it.

Four lights for four men who let the dark in. You have seen two. The inquiry sat eleven days and found no one. I have found them all in a season.

Print this or do not. The lamps say it better.`,
    facts: ['four_lights'],
    lab: {
      steps: 6,
      result: "Typed on a Corvin portable, c. 1960. The lowercase 'e' is out of alignment and prints a fraction below the line throughout. The paper is plain bond; the envelope is Harbour Police internal stock, the kind kept in every desk at the precinct.",
      facts: ['letter_typeface'],
    },
  },
  inquiry_timeline: {
    name: 'Calliope inquiry: public timeline',
    icon: 'doc',
    desc: "The inquiry's own summary of the night, as published.",
    doc: `COURT OF INQUIRY INTO THE LOSS OF THE S.F. CALLIOPE
PUBLISHED SUMMARY — SEQUENCE OF EVENTS, 13–14 OCTOBER

23:15  Storm cone hoisted at the harbour office.
01:10  Marrow Point light observed dark from the pilot station. (Keeper: A. PELL.)
01:30  Scheduled sailing of CALLIOPE, Vale Lines, 58 souls. Held at the berth.
01:55  CALLIOPE cleared to sail by the Harbour Master, L. BROOK.
02:31  CALLIOPE struck the Teeth off Marrow Point.
02:44  Distress flare sighted.
02:52  Police launch PETREL on scene among survivors.
03:05  PETREL recalled to harbour owing to sea state. (Officer commanding: name withheld by order of the Court.)
04:40  Lifeboat recovers 27 survivors.

Lost: 31.

FINDING: Mechanical failure of the Marrow Point lamp at or about 02:25. No person found culpable.
The full record of evidence is SEALED.`,
    facts: ['timeline_known', 'calliope_known'],
  },
  infirmary_record: {
    name: 'Harrowgate County record',
    icon: 'doc',
    desc: 'The reply to your inter-force request.',
    doc: `HARROWGATE COUNTY CONSTABULARY — RECORDS
Reply to request from Greyhaven Harbour (Detective Bureau)
Re: unidentified minors, coastal, 13–16 October [20 yrs prior]

ONE ENTRY FOUND.

14 Oct, 06:20. Trawler MARY DUNNE (Harrowgate) landed one female child, approx. 11 years, taken from the sea eleven miles south of Marrow Point. Hypothermic. Did not speak.
Admitted St Brendan's Infirmary as "UNIDENTIFIED GIRL (SEA)".
Effects: nightdress; ONE BRASS BOSUN'S WHISTLE ON A CHAIN, which she would not give up.

18 Oct. Enquiry sent to Greyhaven Harbour Office re missing children from the CALLIOPE.
21 Oct. Reply, signed L. Brook, Harbour Master: "All minors from the CALLIOPE are accounted for."

No name established. Child remained mute for seven months.
Discharged to County care. Fostered, later adopted: Mr R. and Mrs E. VANCE, ship's chandlers, Fish Quay, Harrowgate.
Name given on adoption: NORA VANCE.`,
    facts: ['infirmary'],
  },
  custody_record: {
    name: 'Eastgate custody record E-4471',
    icon: 'doc',
    desc: 'Custody sheet from Eastgate station for the night Brook died.',
    doc: `EASTGATE DIVISION — CUSTODY RECORD E-4471

FENN, Tobias. M, 66. Lamp-maker, Lamp Row.
Detained 10 October 21:10, outside the offices of Vale Harbour Development, Customs Quay.
Drunk and disorderly. Shouting at the building. No damage.
Cell 3. Checked hourly; asleep from 22:00.
Released without charge 11 October 06:00.

Remarks: "Same as last October." — Sgt Pryce.`,
    facts: ['fenn_custody'],
  },
  drawer_contents: {
    name: "Contents of Vance's drawer",
    icon: 'box',
    desc: "From the locked drawer of desk 4. A printed tide table for Marrow Point, with 03:05 on the 14th ringed in pencil. A set of steel number punches in an oilcloth roll, bright brass filings in the grooves. And a sheet of bond from the Corvin, half typed: 'CONFESSION OF DESMOND HALE. I, being of sound mind, declare that I am the man the newspapers call—'",
    facts: ['drawer'],
  },
  token_hale: {
    name: 'Boarding token, 03:05',
    icon: 'token',
    desc: "Hale took it from his locked drawer and set it on the blotter. Back: 03:05. He has had it five weeks.",
    facts: ['hale_token'],
  },
  drug_page: {
    name: 'Drug locker log, 20 September',
    icon: 'doc',
    desc: "A page of the controlled-drugs book from the evidence cage.",
    doc: `HARBOUR PRECINCT — CONTROLLED SUBSTANCES — SEIZURE 19-0443
MORVANE 2 ml amp. × 24

20 Sept   OUT   6 amp.   "For destruction."   Auth: CAPT. D. HALE
          Balance: 18.

(No destruction certificate is filed. The entry is in neat block capitals. Every other entry in the Captain's name, back to 2019, is in a sloping scrawl.)`,
    facts: ['drug_log'],
  },
};

/** The Lamplighter's letters are written at run time; this is their shell. */
export function letterEvidence(n, body) {
  return {
    name: n === 1 ? 'Letter from the Lamplighter' : `Letter from the Lamplighter (${n})`,
    icon: 'letter',
    desc: 'Typed on plain bond, in an unstamped envelope left on your desk.',
    doc: body,
    lab: {
      steps: 6,
      result: "Typed on a Corvin portable, c. 1960. The lowercase 'e' is out of alignment and prints a fraction below the line throughout. No postmark, no fingerprints. The envelope is Harbour Police internal stock, the kind kept in every desk at the precinct.",
      facts: ['letter_typeface'],
    },
  };
}
