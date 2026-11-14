// Plays The Lamplighter from first briefing to epilogue through the game
// core, with no AI and no browser, and checks the case can actually be solved.
//
//   node scripts/playtest.mjs            golden path (best ending)
//   node scripts/playtest.mjs --verbose  print every line of dialogue
//
// It is also the fastest way to read the whole story in order.

import { GameSession, assertCaseValid } from '../core/engine.js';

const verbose = process.argv.includes('--verbose');
const failures = [];
let session;
let last;

function note(...args) {
  if (verbose) console.log(...args);
}
function expect(cond, message) {
  if (!cond) {
    failures.push(message);
    console.log(`  ✗ ${message}`);
  }
}
const has = {
  fact: (id) => id in session.state.facts,
  ev: (id) => id in session.state.evidence,
  ded: (id) => !!session.state.deductions[id]?.solved,
  flag: (id) => !!session.state.flags[id],
  unlocked: (id) => !!session.state.unlocked[id],
};

async function act(method, args = {}) {
  last = await session[method](args, {});
  for (const e of last.events) {
    if (e.type === 'act') console.log(`\n=== ACT ${e.act}: ${e.title} (${e.date}) — step ${session.state.steps} ===`);
    else if (e.type === 'fact') note(`    + fact: ${e.text}`);
    else if (e.type === 'evidence') note(`    + evidence: ${e.name}`);
    else if (e.type === 'unlock') note(`    + unlocked: ${e.name}`);
    else if (e.type === 'notify' || e.type === 'letter') note(`    ! ${e.text}`);
    else if (e.type === 'lab') note(`    + lab: ${e.result}`);
    else if (e.type === 'deduction') note(`    ? new question: ${e.q}`);
  }
  return last;
}
async function go(to) {
  note(`\n-> ${to}`);
  await act('travel', { to });
  expect(session.state.location === to, `could not travel to ${to}`);
}
async function look(...ids) {
  for (const id of ids) {
    const r = await act('examine', { id });
    note(`  [${r.title}] ${r.text.split('\n')[0].slice(0, 110)}`);
    if (r.letter) {
      const l = await act('readLetter');
      note(`  LETTER ${l.letter.n}:\n${l.letter.body.split('\n').map((x) => '      ' + x).join('\n')}`);
    }
  }
}
async function talk(id, ...lines) {
  const t = await act('talk', { id });
  if (t.talk.greeting) note(`  ${t.talk.name}: ${t.talk.greeting}`);
  for (const line of lines) {
    const r = typeof line === 'string' ? await act('say', { id, text: line }) : await act('present', { id, item: line.show, text: line.text });
    note(`  > ${typeof line === 'string' ? line : `(shows ${line.show})`}`);
    note(`  ${t.talk.name}: ${r.reply.say}`);
  }
}
async function ask(query) {
  const r = await act('laptopAsk', { query });
  note(`  HARBORNET "${query}" -> ${r.opened.join(', ') || '(nothing)'}`);
  return r;
}
async function deduce(id, option) {
  const r = await act('deduce', { id, option });
  note(`  DEDUCE ${id}=${option}: ${r.ok ? 'YES' : 'no'} — ${r.text.slice(0, 100)}`);
  return r;
}
async function wait(n) {
  // Burn steps by doing harmless things, the way a player would wander.
  for (let i = 0; i < n; i++) await act('laptopAsk', { query: 'tide tables' });
}

async function main() {
  assertCaseValid();
  session = new GameSession({ ai: null });
  await act('newGame', { name: 'Playtest' });

  // ----------------------------------------------------------- ACT ONE
  await talk('vance', 'Where do I start?');
  await talk('hale', 'What do we know so far?');
  await look('petrel_photo', 'vance_typewriter', 'evidence_shelves');
  expect(has.fact('hale_cox') && has.fact('corvin_e'), 'precinct observations');
  await act('observe', { id: 'vance' });
  expect(has.fact('vance_whistle_chain'), 'observing Vance in act 1 shows the chain');

  await go('brook_house');
  await look('armchair', 'lantern_brook', 'stain', 'basin', 'grate', 'desk_brook', 'phone_brook', 'ship_model', 'chart_wall', 'bureau', 'garden_door');
  expect(has.ev('lantern_brook') && has.ev('token_0155') && has.ev('burnt_letter') && has.ev('cashbox'), 'Gull Street evidence collected');
  expect(has.unlocked('lamp_shop'), 'lamp shop unlocked by the lantern');
  await talk('brandt', 'Who found him?', 'Any sign of forced entry?', 'Did the neighbours see anything?', 'Who has keys to this scene?');
  expect(has.ev('canvass_report'), 'Brandt hands over the canvass report');
  await talk('dray', 'What time did you leave last night?');
  expect(!has.fact('harbour_police_voice'), 'Dray must not crack without proof');
  await talk('dray', { show: 'canvass_report' }, 'What did the caller look like?', 'Was there a car?');
  expect(has.fact('harbour_police_voice') && has.fact('cape_can') && has.fact('plate_7k4'), "Dray's full testimony");

  await go('morgue');
  await talk('okoro', 'How did Brook die?', 'When did he die?', 'Why was there no struggle?', 'Where did the water come from?', 'Who would know how to use Morvane?');
  await look('report_brook', 'table_brook');
  expect(has.fact('brook_drowned_seawater') && has.fact('sedative_morvane') && has.fact('water_red_lead'), 'autopsy facts');

  await go('precinct');
  await act('labSubmit', { id: 'burnt_letter' });
  await act('labSubmit', { id: 'cashbox' });
  await ask('What is this brass token from Vale Lines?');
  expect(has.fact('calliope_known'), 'laptop identifies the token');
  expect(has.unlocked('tavern'), 'tavern unlocked');
  await ask('Tobias Fenn');
  await ask('Fenn custody record Eastgate');
  expect(has.fact('fenn_custody'), 'Fenn alibi findable on day one');
  await look('inbox');

  await go('lamp_shop');
  await look('lantern_rack', 'workbench', 'punches', 'token_jar', 'ledger', 'photo_lucy', 'counter');
  await act('observe', { id: 'fenn' });
  await talk('fenn', 'This lantern is one of yours.', 'Tell me about your family.', 'Who bought four lanterns in March?', { show: 'lantern_brook' });
  expect(has.fact('buyer_woman') && has.fact('swallowtail_fenn') && has.fact('lucy_photo'), 'lamp shop facts');

  await go('tavern');
  await look('plaque', 'lifebuoy', 'stairs');
  await talk('carrow', 'Tell me about the memorial.', 'What do you know about Tobias Fenn?', 'Tell me about Lucy Fenn.');
  await talk('strand', 'You named him the Lamplighter.', 'What happened at the Calliope inquiry?', 'Can I see your copy of the timeline?', 'Tell me about the letters.', 'Show me the second letter you held back.');
  expect(has.ev('inquiry_timeline') && has.ev('letter_strand'), 'Strand trades the timeline and the second letter');
  expect(has.fact('four_lights'), 'four lights');

  expect(session.state.act === 1, 'still day one until the player rests');
  expect(has.ev('letter_1') || session.state.letters.length > 0, 'first letter was delivered in act 1');
  expect(last.view.rest?.can, 'resting is allowed at the end of day one');
  await act('rest');
  expect(session.state.act === 2, `act 2 should have begun (act=${session.state.act})`);

  // ----------------------------------------------------------- ACT TWO
  await go('precinct');
  await look('inbox');
  await act('observe', { id: 'vance' });
  expect(has.fact('vance_whistle_cord'), "Vance's chain is gone in act 2");
  await go('vale_yacht');
  await look('body_vale', 'lantern_vale', 'glasses', 'chain_link', 'phone_vale', 'safe', 'galley', 'wet_prints', 'chart_table');
  await talk('brandt', 'What happened here?', 'What was it about Gull Street? The seal?');
  expect(has.fact('seal_broken'), 'Brandt reports the broken seal');
  await talk('ivale', 'When did you last see your husband?', 'Was he afraid of anyone?', 'Who had visited him lately? The police?', 'What was in the safe?');
  expect(has.fact('hale_visited_yacht'), 'Isolde gives up the Hale visit');
  expect(!has.ev('vale_tape'), 'Isolde keeps the tape until shown the dust');
  await talk('ivale', { show: 'safe_dust' });
  expect(has.ev('vale_tape'), 'Isolde hands over the tape');

  await deduce('pattern', 'tod');
  await deduce('pattern', 'calliope');
  await deduce('first', 'pell');
  expect(has.ded('pattern') && has.ded('first'), 'pattern and first light solved');

  await go('tavern');
  await talk('carrow', 'Who was Ambrose Pell?', 'How was Pell before he died?', "I need to see Pell's room. Give me the key.");
  expect(has.flag('pell_key'), 'Bess gives the key');
  await look('stairs');
  expect(session.state.location === 'pell_room', 'stairs lead to Pell\'s room');
  await look('tin_bath', 'lantern_pell', 'can_ring', 'bed', 'floorboard', 'table_pell');
  expect(has.ev('token_0110') && has.ev('pell_logbook') && has.ev('ampoule_cap'), "Pell's room evidence");
  await look('exit');
  expect(session.state.location === 'tavern', 'back down to the tavern');
  await talk('carrow', { show: 'pell_logbook' }, 'And Sergeant Hale? The Petrel?');
  expect(has.fact('pell_was_drinking') && has.fact('hale_turned_round'), "Bess's confession");

  await go('morgue');
  await talk('okoro', 'What about Vale?', 'Can you retest Ambrose Pell?');
  await look('report_brook');

  await go('precinct');
  await act('labSubmit', { id: 'ampoule_cap' });
  await act('labSubmit', { id: 'chain_link' });
  await act('labSubmit', { id: 'letter_strand' });
  await ask('marina gate log Customs Quay');
  await ask('plate 7K4');
  expect(has.fact('pool_car'), 'pool car traced');
  await ask('Morvane');
  await look('drug_locker');
  expect(has.ev('drug_page'), 'drug log found');
  await ask('sealed inquiry file access log');
  await ask('terminal B-12');
  await ask('where was Hale on 19 September dinner');
  expect(has.fact('archive_log') && has.fact('b12_vance') && has.fact('hale_dinner'), 'archive trail');
  await deduce('fourth', 'hale');
  expect(has.ded('fourth'), 'fourth light solved');

  await go('tavern');
  await talk('strand', { show: 'marina_log' }, 'Did you photograph it?');
  expect(has.ev('strand_photo'), 'Strand hands over the photograph');

  await go('brook_house');
  await look('garden_door', 'tunic_button');
  expect(has.ev('tunic_button'), 'planted button found');

  await go('vale_yacht');
  await talk('brandt', { show: 'tunic_button' });
  expect(has.fact('button_planted'), 'Brandt confirms the button was planted');
  await deduce('insider', 'police');
  expect(has.ded('insider'), 'insider solved');

  await go('morgue');
  await talk('okoro', 'Is it the same water in all three?');
  expect(has.fact('pell_retest'), 'Pell retest came back');

  expect(session.state.act === 2, 'still day two until the player rests');
  await act('rest');
  expect(session.state.act === 3, `act 3 should have begun (act=${session.state.act})`);

  // --------------------------------------------------------- ACT THREE
  await go('precinct');
  await look('inbox');
  expect(!last.view.location.npcs.some((n) => n.id === 'vance'), 'Vance is out at the start of act 3');
  await talk('fenn', 'Tell me how you killed them.', 'How did you get out to the yacht?');
  expect(has.fact('confession_wrong'), 'the confession has holes');
  await deduce('confession', 'shield');
  await look('vance_desk');
  expect(has.ev('drawer_contents'), "Vance's drawer opened while she is out");
  await look('hale_tunic');
  await talk('hale', { show: 'tunic_button' }, { show: 'burnt_letter' }, 'You commanded the Petrel that night.', 'Did you get a token?', 'Unseal the inquiry file.');
  expect(has.fact('hale_admits') && has.ev('token_hale') && has.flag('unsealed'), 'Hale confesses, shows his token, unseals the file');
  await ask('unsealed inquiry evidence radio log');
  expect(has.fact('sealed_truth'), 'sealed exhibits read');
  await deduce('frame', 'framed');
  expect(has.ded('frame'), 'frame solved');
  await ask('Calliope casualty list Lucy Fenn remains');
  await ask('was an unidentified child found down the coast at Harrowgate');
  await go('lamp_shop');
  await look('newspaper');
  expect(has.fact('fenn_newspaper'), 'ringed newspaper found');
  await go('precinct');
  await wait(6);
  expect(has.ev('infirmary_record'), 'Harrowgate replied');
  await talk('fenn', { show: 'infirmary_record' });
  expect(has.fact('fenn_knows'), 'Fenn tells the truth');

  const acc = await act('accuse', { suspect: 'vance', motive: 'justice', items: ['infirmary_record', 'drawer_contents'] });
  note(`  ACCUSE -> ${acc.verdict}: ${acc.text}`);
  expect(acc.verdict === 'vance_strong', `accusation should be strong (got ${acc.verdict})`);
  expect(session.state.act === 4, 'act 4 begins after the accusation');

  // ---------------------------------------------------------- ACT FOUR
  await go('lighthouse');
  const open = await act('talk', { id: 'vance' });
  note(`  Vance: ${open.talk.greeting}`);
  let end = null;
  for (let i = 0; i < 8 && !end; i++) {
    const chips = last.talk?.suggestions ?? last.suggestions ?? [];
    const line = chips[0] ?? 'Put the can down.';
    const r = await act('finaleSay', { text: line });
    note(`  > ${line}\n  Vance (${r.reply.mood}): ${r.reply.say}`);
    if (r.reply.ended) end = r.ending;
  }
  expect(end?.how === 'surrender', `best path should end in surrender (got ${end?.how})`);
  const epi = await act('epilogue');
  note(`\n${epi.ending.text}\n`);
  console.log(`\nEnding: ${end?.how} · score ${end?.score} · rank "${end?.rank}" · ${session.state.steps} steps`);
  console.log(`Truths: ${end?.truths.filter((t) => t.found).length}/${end?.truths.length}`);
  const facts = Object.keys(session.state.facts).length;
  const total = Object.keys(session.case.facts).length;
  console.log(`Facts found: ${facts}/${total}`);
  const missing = Object.keys(session.case.facts).filter((f) => !(f in session.state.facts));
  if (missing.length) console.log(`Not reached on this path: ${missing.join(', ')}`);

  if (failures.length) {
    console.log(`\n${failures.length} FAILURE(S)`);
    process.exit(1);
  }
  console.log('\nPlaytest passed.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
