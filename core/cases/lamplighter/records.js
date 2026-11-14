// HARBORNET: what the detective's laptop can pull up.
//
// keys: words a query might use (the scripted fallback matches on these; the
//       AI assistant reads title + keys + body)
// if:   when the record becomes reachable (omit = always)
// facts / effects: paid out the first time the record is opened
// request: a record that has to be asked for and arrives `steps` actions later

/** @type {Record<string, any>} */
export const RECORDS = {
  brook_file: {
    title: 'Case 24-1011 · BROOK, Leland · homicide',
    kind: 'case',
    keys: ['brook', 'case', 'gull street', 'case file', 'victim', '24-1011'],
    body: `CASE 24-1011 — OPEN — HOMICIDE
Deceased: BROOK, Leland, 74. Retired Harbour Master.
Found: 11 Oct 07:15, study, 9 Gull Street, by housekeeper A. DRAY.
Scene: Off. T. BRANDT. Post-mortem: Dr A. OKORO, County Mortuary.
Assigned: Detective Bureau (you), with DS N. VANCE.

Summary: Deceased seated in armchair. Storm lantern burning in window. Brass token attached to lantern. No forced entry.

Press line: none. The Ledger is already calling the suspect "the Lamplighter".`,
  },
  brook_bio: {
    title: 'Person · BROOK, Leland',
    kind: 'person',
    keys: ['brook', 'leland', 'harbour master', 'harbor master'],
    body: `BROOK, Leland. b. 1951. Widower. No children.
Harbour Master, Port of Greyhaven, 1989–2011.
Witness, Court of Inquiry into the loss of the CALLIOPE.
Retired to 9 Gull Street. One domestic employee: DRAY, Agnes (days).
No record.`,
  },
  token_ref: {
    title: 'Object · Vale Lines boarding token',
    kind: 'object',
    keys: ['token', 'vale lines', 'boarding', 'brass disc', 'night ferry', 'one passage'],
    if: { any: ['ev:token_0155', 'ev:token_0231', 'ev:token_0110'] },
    body: `VALE LINES BOARDING TOKEN. Brass, 28 mm.
Issued at Customs Quay for the Greyhaven–Port Sorrow night ferry, one token per passage, surrendered on boarding.
The service ended twenty years ago, after the loss of the S.F. CALLIOPE (see incident record).
Unissued tokens for that sailing were later given by the Line to the families of the dead.`,
    facts: ['calliope_known'],
  },
  calliope_summary: {
    title: 'Incident · Loss of the ferry CALLIOPE',
    kind: 'incident',
    keys: ['calliope', 'ferry', 'wreck', 'marrow point', 'the teeth', 'sinking', '31', 'thirty-one', 'disaster'],
    body: `S.F. CALLIOPE, Vale Lines (owner: C. VALE). Night ferry, Greyhaven–Port Sorrow.
Lost on the Teeth off Marrow Point, 14 October, twenty years ago this month. 58 aboard. 31 dead.
The Marrow Point light was dark at the time.
Court of Inquiry: "mechanical failure of the lamp; no person culpable."
Memorial: the Anchor & Lamp, Customs Quay.

Inquiry timeline: public summary on file.
Inquiry evidence: SEALED.`,
    facts: ['calliope_known'],
    effects: [{ unlock: 'tavern' }],
  },
  inquiry_timeline: {
    title: 'Calliope inquiry · public timeline',
    kind: 'incident',
    keys: ['inquiry', 'timeline', 'sequence', '01:10', '01:55', '02:31', '03:05', 'times', 'court of inquiry', 'petrel'],
    if: 'fact:calliope_known',
    body: null, // same text as the evidence document; filled in by index.js
    effects: [{ ev: 'inquiry_timeline' }],
  },
  casualties: {
    title: 'Calliope · casualty list',
    kind: 'incident',
    keys: ['casualty', 'casualties', 'dead', 'victims of the calliope', 'lost', 'names', 'lucy fenn', 'marian fenn', 'remains', 'recovered', 'body never found'],
    if: 'fact:calliope_known',
    body: `S.F. CALLIOPE — THE LOST (31) — extract

ARDEN, Thomas (52)
BELL, Catherine (29)
BELL, infant
...
FENN, Marian (34)
FENN, Lucy (11) — PRESUMED LOST · NO REMAINS RECOVERED
...
HALLORAN, Peter (19), deckhand
...
QUILL, Edith (67) — PRESUMED LOST · NO REMAINS RECOVERED
...

Nine of the thirty-one were seen alive in the water after the vessel struck.
Four bodies were never recovered. One of the four was a child.`,
    facts: ['lucy_not_found', 'fenn_lost_family'],
  },
  fenn_bio: {
    title: 'Person · FENN, Tobias',
    kind: 'person',
    keys: ['fenn', 'tobias', 'lamp', 'lamp row', 'fenn & daughter', 'lamp maker'],
    body: `FENN, Tobias. b. 1958. Lamp-maker, "Fenn & Daughter", Lamp Row.
Widower. Wife MARIAN and daughter LUCY lost on the CALLIOPE.
Caution, twenty years ago: threatening words to C. VALE at the Court of Inquiry ("I'll see you in the dark").
Detained drunk at Eastgate most Octobers. Most recent: 10 Oct this year — see custody record E-4471.
Harbour dues: skiff MARIAN, hauled out 2 Sept, "planking stove in, unseaworthy". Not relaunched.`,
    facts: ['fenn_threat', 'fenn_skiff'],
    effects: [{ unlock: 'lamp_shop' }],
  },
  custody_eastgate: {
    title: 'Eastgate custody record E-4471',
    kind: 'log',
    keys: ['custody', 'eastgate', 'e-4471', 'fenn alibi', 'arrest', 'detained', 'cell', 'drunk'],
    body: null, // filled from the evidence document
    effects: [{ ev: 'custody_record' }],
  },
  vale_bio: {
    title: 'Person · VALE, Conrad',
    kind: 'person',
    keys: ['vale', 'conrad', 'vale lines', 'vale harbour', 'developer', 'second wind', 'yacht'],
    body: `VALE, Conrad. b. 1963. Chairman, Vale Harbour Development. Formerly owner, Vale Lines.
Wife: VALE, Isolde.
Motor yacht SECOND WIND, berth 14, Customs Quay marina.
Planning application: demolition of the disused Marrow Point lighthouse and redevelopment of Customs Quay. Hearing 20 October.
No record.`,
  },
  pell_bio: {
    title: 'Person · PELL, Ambrose',
    kind: 'person',
    keys: ['pell', 'ambrose', 'keeper', 'lighthouse keeper', 'marrow point light'],
    if: { any: ['fact:timeline_known', 'fact:pell_lodger', 'fact:pattern_calliope'] },
    body: `PELL, Ambrose. b. 1956. Keeper, Marrow Point light, 1988–2004 (light decommissioned).
Afterwards night-watchman, various. Lodged at the Anchor & Lamp, Customs Quay.
DECEASED 22 September this year. See sudden-death report SD-0922.`,
    facts: ['pell_lodger'],
  },
  pell_death_report: {
    title: 'Sudden death SD-0922 · PELL, Ambrose',
    kind: 'log',
    keys: ['pell death', 'sudden death', 'sd-0922', 'bath', 'accidental', 'drowning', '22 september'],
    if: { any: ['fact:timeline_known', 'fact:pell_lodger', 'fact:pattern_calliope'] },
    body: `SUDDEN DEATH REPORT SD-0922
PELL, Ambrose, 68. Top room, the Anchor & Lamp. Found 23 Sept 09:40 by landlady E. CARROW.

Deceased in a tin bath, water cold. Empty rum bottle on floor.
A storm lantern burning on the windowsill (deceased was a former lighthouse keeper).
No disturbance. Door unlocked.

Certified: Dr H. REESE (locum). "Accidental drowning while intoxicated."
No post-mortem ordered. Routine samples retained 30 days.
No suspicious circumstances. CLOSED.`,
    facts: ['pell_death_lantern', 'pell_lodger'],
  },
  hale_bio: {
    title: 'Directory · HALE, Desmond · Captain',
    kind: 'person',
    keys: ['hale', 'desmond', 'captain', 'the captain'],
    body: `HALE, Desmond. Captain, Harbour Division.
Joined Harbour Police 1991. Sergeant 1999. Inspector 2006. Captain 2014.
Marine service: police launches, 1993–2005.
Commissioner's commendation, 2006.
Service record for 13–14 October [20 yrs prior]: held with the CALLIOPE inquiry evidence. SEALED.`,
    facts: ['hale_promoted'],
  },
  vance_bio: {
    title: 'Directory · VANCE, Nora · Detective Sergeant',
    kind: 'person',
    keys: ['vance', 'nora', 'sergeant vance', 'ds vance', 'partner'],
    body: `VANCE, Nora. Detective Sergeant.
Harrowgate CID 2015–2021. Transferred to Greyhaven Harbour at own request, 2021.
Duties: Detective Bureau; aide to Capt. HALE (records, evidence book, pool vehicles).
Desk 4. Terminal B-12.
Next of kin: none listed.`,
    facts: ['vance_aide', 'vance_harrowgate'],
  },
  staff_bio: {
    title: 'Directory · OKORO, BRANDT',
    kind: 'person',
    keys: ['okoro', 'brandt', 'medical examiner', 'pathologist', 'scene of crime', 'soco', 'teo'],
    body: `OKORO, Ansel, M.D. County Medical Examiner since 2009. On leave 18–25 September (conference); locum Dr H. REESE.
BRANDT, Teodor. Constable, scene-of-crime. Joined 2019.`,
  },
  strand_bio: {
    title: 'Person · STRAND, Milo',
    kind: 'person',
    keys: ['strand', 'milo', 'reporter', 'ledger', 'journalist', 'press'],
    body: `STRAND, Milo. b. 1980. Crime reporter, the Greyhaven Ledger.
Covered the CALLIOPE Court of Inquiry as a junior.
Works from the snug of the Anchor & Lamp.
Two cautions for obstructing officers at a scene. Otherwise no record.`,
  },
  carrow_bio: {
    title: 'Person · CARROW, Elizabeth ("Bess")',
    kind: 'person',
    keys: ['carrow', 'bess', 'landlady', 'anchor', 'anchor & lamp', 'tavern', 'pub'],
    body: `CARROW, Elizabeth. b. 1953. Licensee, the Anchor & Lamp, Customs Quay, since 1986.
Witness, CALLIOPE Court of Inquiry (as to the movements of A. PELL).
No record.`,
    effects: [{ unlock: 'tavern' }],
  },
  dray_bio: {
    title: 'Person · DRAY, Agnes',
    kind: 'person',
    keys: ['dray', 'agnes', 'housekeeper', 'danny dray'],
    body: `DRAY, Agnes. b. 1966. Domestic, employed by L. BROOK nine years.
Son: DRAY, Daniel, 31. Two county court judgments for debt; known to owe money to the Marsh Lane bookmakers.
No record herself.`,
  },
  ivale_bio: {
    title: 'Person · VALE, Isolde',
    kind: 'person',
    keys: ['isolde', 'mrs vale', 'wife of vale', 'widow'],
    if: 'act>=2',
    body: `VALE, Isolde. b. 1975. Married C. VALE twenty-one years ago.
Sole beneficiary of his estate.
Night of 11–12 Oct: County Infirmary benefit, Grand Pier Hotel, until 01:00 (forty witnesses); driven home 01:20.
No record.`,
  },
  morvane_ref: {
    title: 'Substance · MORVANE',
    kind: 'object',
    keys: ['morvane', 'sedative', 'drug', 'injection', 'ampoule', 'needle'],
    if: { any: ['fact:sedative_morvane', 'fact:ampoule_cap'] },
    body: `MORVANE (injectable). Fast sedative; onset under one minute. Controlled.
Lawful holders in Greyhaven:
 — County Infirmary pharmacy.
 — Harbour Police launches (casualty kits; all marine officers trained to administer).
 — Harbour Precinct evidence cage, drug locker: seizure 19-0443, 24 ampoules, batch MV-4471-C.
Evidence stocks are logged in the controlled-drugs book kept in the cage.`,
    facts: ['police_morvane_training'],
  },
  motor_pool: {
    title: 'Motor pool · car 7 · GH-7K4',
    kind: 'log',
    keys: ['7k4', 'gh-7k4', 'plate', 'registration', 'car 7', 'pool car', 'motor pool', 'saloon', 'vehicle'],
    if: 'fact:plate_7k4',
    body: `VEHICLE: Car 7. Sentinel saloon, grey, UNMARKED. Reg. GH-7K4. Harbour Precinct pool.

REGISTER (last 30 days, night issues)
22 Sept   out 21:15   in 23:50   Capt Hale   p.p. NV
10 Oct    out 20:50   in 23:35   Capt Hale   p.p. NV
12 Oct    out 00:40   in 02:25   Capt Hale   p.p. NV

No other night issues.`,
    facts: ['pool_car'],
  },
  archive_access: {
    title: 'CALLIOPE inquiry evidence · SEALED · access log',
    kind: 'log',
    keys: ['sealed', 'inquiry evidence', 'access log', 'unseal', 'full inquiry', 'sealed file', 'who opened'],
    if: 'fact:calliope_known',
    body: `CALLIOPE — COURT OF INQUIRY — RECORD OF EVIDENCE
*** SEALED. Authorising officer: Capt. D. HALE. ***

Contents not available to this login.

ACCESS LOG (visible to all officers)
02 Mar   23:12   user HALE.D   terminal B-12
19 Sep   23:40   user HALE.D   terminal B-12
11 Oct   09:05   user HALE.D   terminal C-01`,
    facts: ['inquiry_sealed', 'archive_log'],
  },
  terminal_register: {
    title: 'Terminal register · Harbour Precinct',
    kind: 'log',
    keys: ['terminal', 'b-12', 'b12', 'c-01', 'desk 4', 'workstation', 'which desk'],
    if: 'fact:archive_log',
    body: `TERMINAL REGISTER
B-09   Detective Bureau, desk 1   (unassigned)
B-11   Detective Bureau, desk 3   (you)
B-12   Detective Bureau, desk 4   DS N. VANCE
C-01   Captain's office           Capt. D. HALE
E-02   Evidence cage              (aide to Captain)`,
    facts: ['b12_vance'],
  },
  ledger_dinner: {
    title: 'Ledger archive · Benevolent Fund dinner, 19 September',
    kind: 'press',
    keys: ['19 september', 'dinner', 'benevolent', 'grand pier', 'where was hale', 'hale alibi', 'ledger archive', 'cheque'],
    if: 'fact:archive_log',
    body: `THE GREYHAVEN LEDGER, 20 September
HARBOUR DIVISION RAISES £9,000

Captain Desmond Hale presented the cheque to the Seamen's Benevolent Fund at the Grand Pier Hotel last night.
[Photograph: Capt. Hale at the lectern. The ballroom clock behind him reads a quarter to twelve.]
"The Captain stayed to the last dance and was seen into a cab after one," said the Fund's secretary.`,
    facts: ['hale_dinner'],
  },
  desk_log: {
    title: 'Front desk log · deliveries and night duty',
    kind: 'log',
    keys: ['front desk', 'desk log', 'deliveries', 'courier', 'who delivered', 'letter delivered', 'night duty', 'overnight'],
    if: { any: ['ev:letter_1', 'ev:letter_2', 'ev:letter_3'] },
    body: `FRONT DESK LOG — extract

Deliveries addressed to the Detective Bureau, 10–13 Oct: NONE. No courier, no post, no hand delivery signed in.

Night duty
10–11 Oct   desk: Sgt PRYCE (Eastgate relief)
11–12 Oct   desk relief 22:00–06:00: DS N. VANCE
12–13 Oct   desk: Con. MARSH`,
    facts: ['letter_no_post'],
  },
  scene_photos: {
    title: 'Scene photographs · 9 Gull Street · first sweep',
    kind: 'log',
    keys: ['photographs', 'scene photos', 'photo log', 'first sweep', 'under the chair', 'button'],
    if: 'ev:tunic_button',
    body: `SCENE LOG — 9 GULL STREET — Off. T. BRANDT
11 Oct, first sweep, 07:55–08:40.

Frame 14 (08:10): armchair, front.
Frame 15 (08:10): armchair, underside and carpet beneath, torch-lit. NOTHING PRESENT.
Frame 16: hearth.
...
Scene sealed 11:20. Keys issued: BRANDT; Capt. HALE; DS VANCE; Detective Bureau (you).`,
    facts: ['button_planted', 'scene_keys'],
  },
  marina_log: {
    title: 'Customs Quay marina · gate log · night of 11–12 October',
    kind: 'log',
    keys: ['marina', 'gate log', 'customs quay', 'night watchman', 'who came', 'berth 14', 'pontoon'],
    if: 'act>=2',
    body: `CUSTOMS QUAY MARINA — GATE LOG (night watchman: J. Orme)

23:10   Mr C. VALE in, on foot. Berth 14.
00:50   Mr M. STRAND (press) in. "Meeting Mr Vale."
01:08   POLICE. Unmarked grey saloon. Waved through.
02:02   Same vehicle out.
02:20   Mr M. STRAND out.
05:30   Lamp seen burning in saloon of SECOND WIND. Police called.`,
  },
  tide_table: {
    title: 'Tide tables · Greyhaven',
    kind: 'object',
    keys: ['tide', 'tides', 'high water', 'low water'],
    body: `GREYHAVEN — HIGH WATER
22 Sept   04:12   16:40
10 Oct    06:48   19:15
12 Oct    08:20   20:51
14 Oct    09:44   22:10

No high or low water falls at 01:10, 01:55, 02:31 or 03:05 on any of these dates.`,
  },
  press_lamplighter: {
    title: 'Ledger · "The Lamplighter" coverage',
    kind: 'press',
    keys: ['lamplighter', 'newspaper', 'ledger', 'headline', 'coverage', 'article'],
    body: `THE GREYHAVEN LEDGER, 11 October, late edition. By MILO STRAND.

A LIGHT IN THE WINDOW
"...for the second time in a month the Ledger has received a typed letter, unsigned, pushed under its door. We print the first here. The writer lights a lamp for the dead. We have taken the liberty of a name: the Lamplighter."

[The printed letter:]
"There was a light at Marrow Point and men were paid to mind it. Count the ones who were paid. I am counting."`,
    effects: [{ unlock: 'tavern' }],
  },
  harrowgate_request: {
    title: 'Inter-force request · Harrowgate County',
    kind: 'request',
    keys: ['harrowgate', 'unidentified', 'jane doe', 'child found', 'survivor', 'washed up', 'down the coast', 'girl found', 'lucy alive', 'st brendan', 'trawler', 'was lucy found', 'inter-force'],
    if: { any: ['fact:lucy_not_found', 'fact:brook_buried_child'] },
    body: `HARBORNET holds Greyhaven records only.

A child lost from the CALLIOPE and never recovered could have come ashore outside this force's area. The next county south is Harrowgate.

INTER-FORCE REQUEST SUBMITTED: unidentified minors, coastal, 13–16 October, twenty years ago.
Replies by teleprinter. Expect an answer in a few hours.`,
    request: { job: 'harrowgate', steps: 9, effects: [{ ev: 'infirmary_record' }], notify: 'The teleprinter is running. Harrowgate has answered your request.' },
  },
  sealed_file: {
    title: 'CALLIOPE inquiry evidence · UNSEALED',
    kind: 'incident',
    keys: ['sealed', 'unsealed', 'inquiry evidence', 'radio log', 'petrel log', 'full inquiry'],
    if: 'flag:unsealed',
    body: `CALLIOPE — COURT OF INQUIRY — RECORD OF EVIDENCE
Unsealed on the authority of Capt. D. HALE.

EXHIBIT 9. Harbour office telephone log, 01:48: incoming, "Mr Vale, for the Harbour Master". Seven minutes.
EXHIBIT 14. Pilot station to Harbour Master, 01:12: "Marrow light is out." Acknowledged L.B.
EXHIBIT 22. PETREL radio log, 03:02: "Vale to Petrel. Bring her in, Sergeant." 03:05: "Petrel returning." Signed D. HALE, Sgt.
EXHIBIT 23. Statement of Con. R. Ames, PETREL: "There were nine or ten in the water to starboard. We could hear them. The Sergeant put the wheel over."
EXHIBIT 31. Harrowgate County to Harbour Master, 18 Oct: enquiry re an unidentified child. Reply 21 Oct, L. BROOK: "All minors accounted for."

None of these exhibits was put before the Court in open session.`,
    facts: ['sealed_truth', 'brook_buried_child'],
  },
};
