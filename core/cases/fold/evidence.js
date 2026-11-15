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
    desc: "A cup from the Hall with a clock face painted in the bottom. Pendry carried it back from the Syndics' tea on Sunday. There is half an inch of cold tea left in it.",
    facts: ['hall_tea'],
    lab: {
      steps: 6,
      result: "Digitoxin and related glycosides, with bits of foxglove leaf. Someone stirred a strong brew of the plant into ordinary black tea. The poison was only in the cup. The pot and the strainer on the same tray are clean.",
      facts: ['cup_foxglove'],
    },
  },
  paper_pendry: {
    name: "The Paper from Pendry's tube",
    icon: 'letter',
    desc: "One sheet of Company paper, written in green ink in a small, upright hand. It is laid out as an exam paper. It reached Pendry by the Bellows at eight on Sunday night.",
    doc: SYNDIC_PAPER('Ignatius Pendry, Grand Setter', 'You swore that you had examined it.'),
    facts: ['pendry_paper'],
  },
  autopsy_pendry: {
    name: 'Post-mortem: Ignatius Pendry',
    icon: 'doc',
    desc: "Dr Marsh's findings on Pendry.",
    doc: `COUNTY MORTUARY, RAVEL INFIRMARY: POST-MORTEM REPORT
Subject: PENDRY, Ignatius. Male, 71.
Examined Monday by L. Marsh, M.D.

CAUSE OF DEATH: Foxglove poisoning (digitalis, a poison that affects the heart).
The level in his blood was several times a fatal dose. His stomach held tea and bits of foxglove leaf. This was a brew made from the plant itself, not a medicine.

TIMING: Swallowed between 16:10 and 16:30 Greenwich time on Sunday (about four o'clock by the Fold's clocks). He felt ill from about 20:00. He died about midnight. His mind was clear until shortly before death.

OTHER FINDINGS:
1. All ten fingertips rubbed raw, with brass under the nails. He spent hours working at a metal object with rings.
2. No injury. No sign that he was held down. No injection.

NOTE: He could have been saved. The antidote, digoxin-specific antibody, is kept at this Infirmary, ten minutes from where he died. He did not come.`,
    facts: ['foxglove', 'drank_at_four', 'could_be_saved'],
  },
  autopsy_sallow: {
    name: 'Post-mortem: Marguerite Sallow',
    icon: 'doc',
    desc: "Dr Marsh's findings on Sallow.",
    doc: `COUNTY MORTUARY, RAVEL INFIRMARY: POST-MORTEM REPORT
Subject: SALLOW, Marguerite. Female, 66.
Examined Tuesday by L. Marsh, M.D.

CAUSE OF DEATH: Same as PENDRY. Foxglove, in tea.
TIMING: Same as PENDRY. Swallowed about 16:15 Greenwich time on Monday. She died about midnight.

OTHER FINDINGS:
1. Fingertips of the right hand rubbed raw.
2. One shoe off. She tried to force the hatch with her foot.

NOTE: These two deaths are the same crime, one day apart. Same poison, same hour, same result. Whoever is doing this has a method and sticks to it.`,
    facts: ['sallow_same'],
  },
  lock_pendry: {
    name: "Pendry's letter-lock",
    icon: 'chain',
    desc: "A Company letter-lock with seven brass rings, taken off the inside of Pendry's workshop door. It smells of fresh oil.",
    lab: {
      steps: 7,
      result: "The lock was taken apart, oiled and re-pinned in the last week, with the Hall's own clock oil. The scratches from a setting-pin lie UNDER the layer of oil, not on top of it. So the word was changed while the lock was open on a bench for its service, not afterwards. The only fingerprints are Pendry's.",
      facts: ['changed_at_service'],
    },
  },
  flask_sallow: {
    name: "Sallow's flask",
    icon: 'flask',
    desc: "A dented vacuum flask, and a cup with a compass rose painted in the bottom. Sallow had the flask filled at the Hall at four on Monday.",
    lab: {
      steps: 5,
      result: "Foxglove, the same as in Pendry's cup. As far as the test can tell, it is the same brew.",
      facts: ['flask_foxglove'],
    },
  },
  paper_sallow: {
    name: "The Paper from Sallow's tube",
    icon: 'letter',
    desc: "One sheet in green ink, in the same handwriting as Pendry's Paper. It reached the Meridian at eight on Monday night.",
    doc: SYNDIC_PAPER('Marguerite Sallow, Grand Setter', 'You drew the lines of all of it and read none.'),
    facts: ['sallow_paper'],
  },
  escrow_letter: {
    name: "Banker's letter from the atlas",
    icon: 'doc',
    desc: "A letter from a bank to Sallow, found pressed inside her largest atlas.",
    doc: `HOARE, MARCHMONT & CO., BANKERS
Private and confidential. To Mrs M. Sallow.

Re: Greywether plc / "The Lorimer Legacy"

We confirm that we are holding £11,000,000 (eleven million pounds) in escrow. This means we keep the money safe until the sale is completed on 31 October.

All four Syndics have signed an instruction telling us how to pay it. When the sale is completed, we will pay it in four equal parts of £2,750,000, into the personal accounts of:
  Mr A. CLAY
  Mr I. PENDRY
  Mrs M. SALLOW
  Mr L. VOSS

To be clear: none of this money will be paid to the Worshipful Company.`,
    facts: ['escrow_four'],
  },
  capacity_report: {
    name: 'Medical report from the sextant box',
    icon: 'doc',
    desc: "A doctor's report on Dame Hesper that was never sent to the court. It was hidden under the cloth lining of Sallow's sextant box.",
    doc: `CAPACITY ASSESSMENT (a test of whether she can make her own decisions). 2 March.
Dame Hesper LORIMER, 74. Seen at No. 4, the Almshouses, by Dr P. Fenwick. Also present: Sister D. Abara.

1. She cannot say the day, the month or the year.
2. Both hands shake badly. She cannot hold a pen to a line. She says herself that she has not written clearly "for years".
3. She does not know of any plan to sell her work. Asked if she would agree to one, she said: "You can't sell a crossword once it's solved. It's only squares then."
4. Her puzzle skill is still remarkable. With the nurse writing for her, she finished a cryptic crossword in twenty minutes.

OPINION: She is not able to manage her own affairs. She has NOT agreed, and cannot agree, to any sale of her property.

[Written in pencil across the top, in Sallow's hand:] Not sent to the court. A.C. says the affidavit will do. She can't have agreed to any of it. She couldn't have agreed to tea.`,
    facts: ['dame_incapable'],
  },
  paper_voss: {
    name: "The Paper from Voss's tube",
    icon: 'letter',
    desc: 'One sheet in green ink, in the same handwriting as the other Papers. It reached the Crux at eight.',
    doc: SYNDIC_PAPER('Lucan Voss, Grand Setter', 'You have had it across your own desk every October for twelve years, and you set crosswords for a living.'),
    facts: ['voss_paper'],
  },
  spiked_letter: {
    name: 'Letter from the Crux spike',
    icon: 'paper',
    desc: 'A letter to the editor of the Crux, in a small, upright hand. It has a blue pencil line through it.',
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
      result: "Company paper, Company green ink, and a steel nib. We compared it with the Invigilator's Papers. Beyond reasonable doubt, the same person wrote both. Whoever wrote to the Crux as 'a servant of the Hall' is the person writing to you as 'your Invigilator'.",
      facts: ['letter_same_hand'],
    },
  },
  stylometry_memo: {
    name: "Jonah's stylometry memo",
    icon: 'doc',
    desc: 'A printout of a report that Jonah was told to delete.',
    doc: `MEMO. To: the Syndics. From: J. Okafor-Reed. January.
STYLOMETRY OF THE LORIMER CORPUS: A STUDY OF WRITING STYLE, prepared for the checks before the Greywether sale.

Method: I measured how often small common words are used, and the rhythm of clue lengths, across 1,104 catalogued items.

Result: the work falls into TWO groups that do not overlap.
  Cluster A: 1971 to 2011. 1,092 items. One author.
  Cluster B: 2012 to 2023. The twelve Late Tithes. A different author.

Age does not explain the change. B is a different person: more exact, less impatient, and fonder of hidden second meanings. B may even be the better setter.

I do not know who B is. We should find out before we sell B's work under A's name.

[Reply, in the Warden's hand:] Clean the data. Delete this. A.C.`,
    facts: ['two_hands'],
  },
  faircopy_books: {
    name: 'The fair-copy books',
    icon: 'book',
    desc: "Twelve ledgers from the Warden's safe, for 2012 to 2023, in a small, upright hand. They are not copies of anything. On page after page, a clue in shaky pencil is crossed out, and a better one is written under it in ink. In the margin, the pencil has written 'yes'. By 2015 there is no pencil at all.",
    facts: ['faircopy_hand'],
    lab: {
      steps: 6,
      result: "The ink handwriting in the fair-copy books is the same as the handwriting on the Invigilator's Papers. The letter shapes, the pen-lifts, the hook on the g and the pressure on the down-strokes all match. There is no doubt at all.",
      facts: ['hand_match'],
    },
  },
  nina_sheet: {
    name: 'The hidden name',
    icon: 'paper',
    desc: 'Your own copy of three Late Tithes, with the line from corner to corner circled in each. Each one spells ARIADNE.',
  },
  codicil: {
    name: "Dame Hesper's Codicil",
    icon: 'letter',
    desc: "A signed statement found sealed behind Dame Hesper's portrait in the Hall. It is in shaky handwriting, and the Company's solicitor signed it as a witness.",
    doc: `To whoever looks.

I, Hesper Lorimer, write this on what I am told is a good day. Mr Tolland, solicitor, is with me, and he is holding the paper still.

My hand went in 2011, and my mind is going after it. The Tithes published under my name since 2012 are not mine. They are the work of ROBERT FETTLE, Porter of this Hall. He has made my fair copies since 1984. He learned the whole of this trade from my waste-paper basket, because nobody thought to stop him.

His Tithes are better than mine. I knew it at the time, and I was too proud of him to mind.

When I can no longer say so, let someone say it for me. I am proud to put my name beside his, not above it.

I have put this where it will always be behind me. I will forget where. That is the kind of joke I used to like.

Hesper Lorimer (VESPER). 9 June 2016.
Witness: G. Tolland.`,
    facts: ['codicil'],
  },
  key_144: {
    name: 'Key no. 144',
    icon: 'token',
    desc: "A plain steel key on a brass tag stamped 144. It is the master key. The Porter has kept it in his pocket for forty-six years. It came to you in a carrier with Paper IV.",
  },
};

const ROMAN = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV' };

/** A Paper from the Invigilator, with its covering note written when it was opened. */
export function letterEvidence(n, body) {
  return {
    name: `Paper ${ROMAN[n]}: covering note`,
    icon: 'letter',
    desc: 'A note in green ink on Company paper, in a small, upright hand. It came by the Bellows. The questions are on a separate sheet, in your notebook under Papers.',
    doc: `${body}\n\n[The questions set on this Paper are in your notebook, under Papers.]`,
    lab: {
      steps: 6,
      result: "Ordinary Company paper, and the Company's own green ink, which is kept in every room of the Hall. Written with a steel nib. No fingerprints. The handwriting is small, upright and very practised. It is the hand of a clerk or a copyist, someone who has spent a lifetime making neat copies.",
      facts: ['paper_hand'],
    },
  };
}
