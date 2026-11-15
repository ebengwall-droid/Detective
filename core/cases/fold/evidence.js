// Physical evidence and documents the detective can carry, send to the lab,
// and put in front of people.
//
// icon: a key into the client's icon set
// facts: learned the moment the item is taken
// lab: { steps, result, facts } — what the lab reports, `steps` actions later
// doc: long-form text shown when the item is opened (reports, letters)

const SYNDIC_PAPER = (name, jibe) => `PAPER FOR A SYNDIC
${name}

One question. Time allowed: until you fall asleep.

At four o'clock you drank foxglove with your tea. You will have felt it by now. The Infirmary can mend it until about midnight; it is ten minutes from your door.

Your door now opens to one name. Seven letters. It is in everything you sold.

${jibe}

You may not confer. I shall be at the back of the room.

— your Invigilator`;

/** @type {Record<string, any>} */
export const EVIDENCE = {
  cup_pendry: {
    name: "Pendry's teacup",
    icon: 'flask',
    desc: "A Hall cup with a clock face painted in the bottom, carried back from the Syndics' tea on Monday, with half an inch of cold tea in it.",
    facts: ['hall_tea'],
    lab: {
      steps: 6,
      result: "Digitoxin and related glycosides, with fragments of foxglove leaf. A strong infusion of the plant, stirred into ordinary black tea. The pot and the strainer on the same tray are clean: it was in the cup, not the pot.",
      facts: ['cup_foxglove'],
    },
  },
  paper_pendry: {
    name: "The Paper from Pendry's tube",
    icon: 'letter',
    desc: "One sheet of Company paper in green ink, in a small upright hand, set out like an examination paper. It reached him by the Bellows at eight on Monday night.",
    doc: SYNDIC_PAPER('Ignatius Pendry, Grand Setter', 'You swore that you had examined it.'),
    facts: ['pendry_paper'],
  },
  autopsy_pendry: {
    name: 'Post-mortem: Ignatius Pendry',
    icon: 'doc',
    desc: "Dr Marsh's findings on Pendry.",
    doc: `COUNTY MORTUARY, RAVEL INFIRMARY — POST-MORTEM REPORT
Subject: PENDRY, Ignatius. Male, 71.
Examined Monday by L. Marsh, M.D.

CAUSE OF DEATH: Poisoning by cardiac glycosides (Digitalis: foxglove).
Blood level several times the fatal. Stomach contains tea and fragments of foxglove leaf: a brew of the plant, not a medicine.

TIMING: Ingested 16:10 to 16:30 Greenwich (about four o'clock by the Fold's clocks). Onset of symptoms about 20:00. Death about midnight. Consciousness clear until shortly before.

OTHER FINDINGS:
— All ten fingertips abraded; brass under the nails. Hours of work at a metal object with rings.
— No injury. No restraint. No injection.

NOTE: This was survivable. Digoxin-specific antibody is held at this Infirmary, ten minutes from where he died. He did not come.`,
    facts: ['foxglove', 'drank_at_four', 'could_be_saved'],
  },
  autopsy_sallow: {
    name: 'Post-mortem: Marguerite Sallow',
    icon: 'doc',
    desc: "Dr Marsh's findings on Sallow.",
    doc: `COUNTY MORTUARY, RAVEL INFIRMARY — POST-MORTEM REPORT
Subject: SALLOW, Marguerite. Female, 66.
Examined Tuesday by L. Marsh, M.D.

CAUSE OF DEATH: As PENDRY. Foxglove, in tea.
TIMING: As PENDRY. Ingested about 16:15 Greenwich on Monday; death about midnight.

OTHER FINDINGS:
— Fingertips of the right hand abraded.
— One shoe removed; she tried the hatch with her foot.

NOTE: The two are the same event, a day apart. Same preparation, same hour, same result. Whoever does this has a method and keeps to it.`,
    facts: ['sallow_same'],
  },
  lock_pendry: {
    name: "Pendry's letter-lock",
    icon: 'chain',
    desc: "A Company privacy lock of seven brass rings, unscrewed from the inside of his workshop door. It smells of fresh oil.",
    lab: {
      steps: 7,
      result: "The lock was stripped, oiled and re-pinned within the last week, with the Hall's own clock oil. The setting-pin's scratches on the ring-cage lie UNDER the oil film, not over it: the word was changed while the lock was open on a bench being serviced, not afterwards. No fingerprints but the deceased's.",
      facts: ['changed_at_service'],
    },
  },
  flask_sallow: {
    name: "Sallow's flask",
    icon: 'flask',
    desc: "A dented vacuum flask and a cup with a compass rose in the bottom. She had it filled at the Hall at four on Monday.",
    lab: {
      steps: 5,
      result: 'Foxglove, as in the Pendry cup: the same preparation, to within the error of the test.',
      facts: ['flask_foxglove'],
    },
  },
  paper_sallow: {
    name: "The Paper from Sallow's tube",
    icon: 'letter',
    desc: 'One sheet, green ink, the same hand. It reached the Meridian at eight on Monday night.',
    doc: SYNDIC_PAPER('Marguerite Sallow, Grand Setter', 'You drew the lines of all of it and read none.'),
    facts: ['sallow_paper'],
  },
  escrow_letter: {
    name: "Banker's letter from the atlas",
    icon: 'doc',
    desc: "Found pressed in Sallow's largest atlas.",
    doc: `HOARE, MARCHMONT & CO., BANKERS
Private and confidential. To Mrs M. Sallow.

Re: Greywether plc / "The Lorimer Legacy"

We confirm that we hold in escrow the sum of £11,000,000 (eleven million pounds) pending completion on 31 October.

On completion, and in accordance with the instruction signed by all four Syndics, the sum is to be released in four equal parts of £2,750,000 to the personal accounts of:
  Mr A. CLAY
  Mr I. PENDRY
  Mrs M. SALLOW
  Mr L. VOSS

For the avoidance of doubt, no part is payable to the Worshipful Company.`,
    facts: ['escrow_four'],
  },
  capacity_report: {
    name: 'Medical report from the sextant box',
    icon: 'doc',
    desc: "A doctor's report on Dame Hesper that was never filed, hidden under the baize of Sallow's sextant box.",
    doc: `CAPACITY ASSESSMENT. 2 March.
Dame Hesper LORIMER, 74. Assessed at No. 4, the Almshouses, by Dr P. Fenwick. Present: Sister D. Abara.

— Cannot state the day, the month or the year.
— Marked intention tremor of both hands. Cannot hold a pen to a line. On her own account, has not written legibly "for years".
— Does not know of any proposal to sell her work. Asked whether she would agree to one, replied: "One can't sell a crossword once it's solved."
— Retains procedural skill to a remarkable degree. With the nurse writing for her, completed a cryptic crossword in twenty minutes.

OPINION: Lacks capacity to manage her affairs. Has NOT consented, and cannot consent, to any disposal of her property.

[In pencil, across the head, in Sallow's hand:] Not sent to the court. A.C. says the affidavit will do. She can't have agreed to any of it. She couldn't have agreed to tea.`,
    facts: ['dame_incapable'],
  },
  paper_voss: {
    name: "The Paper from Voss's tube",
    icon: 'letter',
    desc: 'One sheet, green ink, the same hand. It reached the Crux at eight.',
    doc: SYNDIC_PAPER('Lucan Voss, Grand Setter', 'You have had it across your own desk every October for twelve years, and you set crosswords for a living.'),
    facts: ['voss_paper'],
  },
  spiked_letter: {
    name: 'Letter from the Crux spike',
    icon: 'paper',
    desc: 'A letter to the editor in a small upright hand, with a blue pencil stroke through it.',
    doc: `To the Editor of the Crux.

Sir,

The Late Tithes are not what the Company is selling them as.

Ask who made the fair copies. Ask why, since January, the fair-copy books have been locked in the Warden's safe. Ask Mr Pendry how long he spent examining them before he signed.

I ask only that the thing be looked at. I have never asked the Company for anything else.

I am, Sir,
a servant of the Hall.

[Across it in blue pencil:] No. — L.V.`,
    facts: ['spiked_letter'],
    lab: {
      steps: 6,
      result: "Company paper, Company green ink, steel nib. Compared with the Invigilator's Papers: the same hand, beyond reasonable doubt. Whoever wrote to the Crux as 'a servant of the Hall' is writing to you as 'your Invigilator'.",
      facts: ['letter_same_hand'],
    },
  },
  stylometry_memo: {
    name: "Jonah's stylometry memo",
    icon: 'doc',
    desc: 'A printout Jonah was told to delete.',
    doc: `MEMO. To: the Syndics. From: J. Okafor-Reed. January.
STYLOMETRY OF THE LORIMER CORPUS, prepared for Greywether due diligence.

Method: function-word frequencies and clue-length rhythm over 1,104 catalogued items.

Result: the corpus falls into TWO clusters with no overlap.
  Cluster A: 1971 to 2011. 1,092 items. One author.
  Cluster B: 2012 to 2023. The twelve Late Tithes. A different author.

Cluster B is not Cluster A grown old. It is someone else: more exact, less impatient, fonder of a hidden second meaning. If anything, B is the better setter.

I do not know who B is. I recommend we find out before we sell B's work under A's name.

[Reply, in the Warden's hand:] Clean the data. Delete this. A.C.`,
    facts: ['two_hands'],
  },
  faircopy_books: {
    name: 'The fair-copy books',
    icon: 'book',
    desc: "Twelve ledgers from the Warden's safe, 2012 to 2023, in a small upright hand. They are not copies of anything. On page after page a clue in a shaky pencil is struck through and a better one written under it in ink; in the margin the pencil has written 'yes'. By 2015 there is no pencil at all.",
    facts: ['faircopy_hand'],
    lab: {
      steps: 6,
      result: "The ink hand of the fair-copy books and the hand of the Invigilator's Papers are the same hand. Letter forms, pen-lifts, the hook on the g, the pressure on down-strokes: there is no doubt at all.",
      facts: ['hand_match'],
    },
  },
  nina_sheet: {
    name: 'The slanted name',
    icon: 'paper',
    desc: 'Your own copy of three Late Tithes with the diagonals ringed. ARIADNE. ARIADNE. ARIADNE.',
  },
  codicil: {
    name: "Dame Hesper's Codicil",
    icon: 'letter',
    desc: "A sealed sheet from behind her portrait in the Hall, in a hand that wavers, witnessed by the Company's solicitor.",
    doc: `To whoever looks.

I, Hesper Lorimer, on what I am told is a good day, in the presence of Mr Tolland, solicitor, who is holding the paper still, say as follows.

My hand went in 2011 and my mind is going after it. The Tithes that have gone out under my name since 2012 are not mine. They are the work of ROBERT FETTLE, Porter of this Hall, who has made my fair copies since 1984 and who learned the whole of this trade out of my waste-paper basket, because nobody thought to stop him.

They are better than mine. I knew it at the time and was too proud of him to mind.

When I am past saying so, let it be said for me: I am proud to put my name beside his, not above it.

I have put this where it will always be behind me. I shall forget where. That is the kind of joke I used to like.

Hesper Lorimer (VESPER). 9 June 2016.
Witness: G. Tolland.`,
    facts: ['codicil'],
  },
  key_144: {
    name: 'Key no. 144',
    icon: 'token',
    desc: "A plain steel key on a brass tally stamped 144. The master. It has lived in the Porter's pocket for forty-six years, and it came to you in a carrier with Paper IV.",
  },
};

const ROMAN = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV' };

/** A Paper from the Invigilator, with its covering note written when it was opened. */
export function letterEvidence(n, body) {
  return {
    name: `Paper ${ROMAN[n]}: covering note`,
    icon: 'letter',
    desc: 'Green ink on Company paper, in a small upright hand, come by the Bellows. The questions are on a second sheet: see your Papers.',
    doc: `${body}\n\n[The questions set on this Paper are in your notebook, under Papers.]`,
    lab: {
      steps: 6,
      result: "Company stock paper and the Company's own green ink, which is kept in every room of the Hall. A steel nib. No fingerprints. The hand is small, upright and extremely practised: a clerk's hand, or a copyist's. The writer has spent a lifetime writing things out fair.",
      facts: ['paper_hand'],
    },
  };
}
