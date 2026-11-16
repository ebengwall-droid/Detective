// Plays The Invigilator from the Turnstile to the epilogue through the game
// core, with no AI and no browser, and checks the case can actually be solved.
//
//   node scripts/playtest.mjs            golden path (best ending)
//   node scripts/playtest.mjs --verbose  print every line of dialogue
//   node scripts/playtest.mjs --record f  also write every action to f as JSON
//                                         (the browser tests replay it)
//
// It is also the fastest way to read the whole story in order. It contains
// every answer: do not read it if you mean to play.

import fs from 'node:fs';
import { GameSession, assertCaseValid } from '../core/engine.js';

const verbose = process.argv.includes('--verbose');
const recordTo = process.argv.includes('--record') ? process.argv[process.argv.indexOf('--record') + 1] : null;
/** @type {{method: string, args: object, act: number}[]} */
const recorded = [];
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
  puz: (id) => session.state.puzzles[id]?.solved !== undefined,
  open: (id) => session.state.puzzles[id]?.open !== undefined,
  flag: (id) => !!session.state.flags[id],
  unlocked: (id) => !!session.state.unlocked[id],
};

async function act(method, args = {}) {
  recorded.push({ method, args, act: session.state?.act ?? 0 });
  last = await session[method](args, {});
  for (const e of last.events) {
    if (e.type === 'act') console.log(`\n=== ACT ${e.act}: ${e.title} (${e.date}) — step ${session.state.steps} ===`);
    else if (e.type === 'fact') note(`    + fact: ${e.text}`);
    else if (e.type === 'evidence') note(`    + evidence: ${e.name}`);
    else if (e.type === 'unlock') note(`    + unlocked: ${e.name}`);
    else if (e.type === 'notify' || e.type === 'letter') note(`    ! ${e.text}`);
    else if (e.type === 'lab') note(`    + lab: ${e.result}`);
    else if (e.type === 'deduction') note(`    ? new question: ${e.q}`);
    else if (e.type === 'puzzle' && e.opened) note(`    ? new puzzle: ${e.title}`);
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
    note(`  [${r.title}] ${String(r.text).split('\n')[0].slice(0, 110)}`);
    if (r.letter) {
      const l = await act('readLetter');
      note(`  PAPER ${l.letter.n}:\n${l.letter.body.split('\n').map((x) => '      ' + x).join('\n')}`);
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
  note(`  LECTERN "${query}" -> ${r.opened.join(', ') || '(nothing)'}`);
  return r;
}
async function deduce(id, option) {
  const r = await act('deduce', { id, option });
  note(`  DEDUCE ${id}=${option}: ${r.ok ? 'YES' : 'no'} — ${r.text.slice(0, 100)}`);
  expect(r.ok, `deduction ${id} should accept ${option}`);
  return r;
}
async function solve(id, answer) {
  expect(has.open(id), `puzzle ${id} should be open by now`);
  if (!has.open(id)) return null;
  const r = await act('solve', { id, answer });
  note(`  SOLVE ${id} = ${answer}: ${r.ok ? 'YES' : `no — ${r.text}`}`);
  expect(r.ok, `puzzle ${id} should accept ${answer}`);
  return r;
}
async function wait(n) {
  // Burn steps by doing harmless things, the way a player would wander.
  for (let i = 0; i < n; i++) await act('laptopAsk', { query: 'the weather on the Cut' });
}

async function main() {
  assertCaseValid();
  session = new GameSession({ ai: null });
  await act('newGame', { name: 'Playtest' });

  // ------------------------------------------------------------ MONDAY
  expect(session.state.location === 'gatehouse', 'the game begins at the Turnstile');
  await talk('kit', 'How does the gate work?', 'What is this place?');
  await look('slate', 'stone', 'notice', 'turnstile');
  const miss = await act('solve', { id: 'gate', answer: 'fdwfk' });
  expect(!miss.ok && session.state.puzzles.gate.attempts === 1, 'a wrong word does not open the gate');
  const h1 = await act('hint', { id: 'gate' });
  expect(h1.tier === 1 && !h1.last, 'the first hint is a nudge');
  await solve('gate', 'catch');
  expect(has.unlocked('hall') && has.unlocked('clockshop') && has.unlocked('mortuary'), 'the gate opens the Fold');

  await go('clockshop');
  await look('bench', 'door_pendry', 'window_bars', 'cup_pendry', 'tube_pendry', 'notepad', 'clocks', 'lodger', 'certificate', 'ledger_pendry', 'stove_pendry');
  expect(has.ev('cup_pendry') && has.ev('paper_pendry'), "Pendry's cup and Paper collected");
  expect(has.fact('locked_inside') && has.fact('pendry_paper') && has.fact('certificate_sole'), 'the workshop tells its story');
  expect(has.open('lock'), 'the word on the doors is an open question from the first day');
  await talk('wilf', 'Tell me about this morning.', 'Did he always lock himself in?', 'What about his tea?', 'Who looks after the lock?', 'What is the chess-player?');
  expect(has.fact('locks_oiled'), 'Wilf says who oiled the lock');
  await talk('kit', 'Where do I start?', 'Who are the Syndics?');

  await go('wheelshop');
  await talk('quoin', 'Did you hear anything on Sunday night?', "How do you change a letter-lock's word?");
  await look('fitting', 'wall_party', 'kit_photo', 'wheels', 'quoin_ledger');
  await solve('fitting', 'Patience');
  expect(has.flag('tool_wheel'), 'the fitting earns the Wheel');
  expect(!has.fact('ariadne_fettle'), 'the fitting ledger keeps its secret until you know what to look for');

  await go('mortuary');
  await talk('marsh', 'What killed him?', 'When did he take it?', 'Could he have been saved?', 'What happened to his hands?');
  await look('slab', 'report', 'samples');
  expect(has.fact('foxglove') && has.fact('drank_at_four') && has.ev('autopsy_pendry'), 'the post-mortem');

  await go('hall');
  await look('my_desk', 'lodge', 'keyboard', 'tea_table', 'hall_clock', 'back_chair', 'tithe_wall', 'portrait_hesper', 'portraits', 'clay_desk', 'clay_safe', 'strongbox');
  await talk('hob', 'How are the keys kept?', 'Who looks after the letter-locks?', "Who pours the Syndics' tea?", 'Who sits at the back of the Proving?');
  expect(has.fact('tea_porter') && has.fact('hob_invigilates'), 'the Porter answers plainly what he is plainly asked');
  await talk('clay', 'Who signs for Dame Hesper?', 'Tell me about the sale.');
  expect(has.unlocked('almshouse') && has.unlocked('stalemate') && has.unlocked('repository'), 'the rest of the Fold opens');
  await act('labSubmit', { id: 'cup_pendry' });
  expect(has.flag('letter_waiting'), 'Paper I has come');
  await look('tube');
  expect(has.ev('paper_1') && has.open('paper1a') && has.open('paper1b') && has.open('bellows'), 'Paper I and its questions');
  await solve('paper1a', 'the Lorimer Legacy');
  await solve('paper1b', 'Warden');
  await look('exchange');
  await solve('bellows', 'held since noon');
  await deduce('locked', 'remote');
  await ask('How does a Caesar cipher work?');

  const early = await act('rest');
  expect(early.ok, 'Monday can end once the scene, the doctor and the Hall are done');

  // ----------------------------------------------------------- TUESDAY
  expect(session.state.act === 2 && session.state.location === 'hall', 'Tuesday begins at your desk');
  await go('meridian');
  await look('bunk_sallow', 'door_sallow', 'tube_sallow', 'flask', 'chart_table', 'log_sallow', 'riddle_book', 'atlas', 'sextant');
  expect(has.ev('paper_sallow') && has.fact('masterplan') && !has.ev('escrow_letter'), 'the Meridian, before the Paper');
  await talk('nell', 'You found her?', 'Who crossed the Cut that night?', 'A towel.');
  await act('labSubmit', { id: 'flask_sallow' });

  await go('stalemate');
  await talk('ottilie', 'Who was here on Monday night?', "Who pours the Syndics' tea?", 'Who is upstairs?');
  await look('score_book', 'noticeboard', 'domino_table', 'chess_tables', 'draw_cake', 'piano', 'slate_board', 'stairs_crux');
  expect(session.state.location === 'stalemate', 'the stairs to the Crux are not yet your business');

  await go('repository');
  await talk('jonah', 'What exactly is the Lectern?', 'Could the Engine have set the Papers?', 'What do you think of the sale?');
  expect(has.fact('not_engine'), 'Jonah clears his machine');
  await look('waste_basket', 'early_case');

  await go('almshouse');
  await talk('dolores', 'How is she, really?', 'Who visits her?');
  await look('hesper_table', 'garden_window', 'visitors_book', 'photo_hall', 'night_latch', 'bookshelf_hesper', 'tea_tray');
  await talk('dolores', 'Who finishes her crossword?', 'Who cut the foxgloves?');
  await talk('hesper', "What is the four o'clock problem?", 'Do you know they are selling your work?');
  await act('observe', { id: 'hesper' });
  expect(has.fact('night_visitor') && has.fact('bed_planted') && has.fact('dame_tremor'), 'the Almshouse');

  await go('hall');
  expect(has.flag('letter_waiting'), 'Paper II has come');
  await look('tube');
  await solve('paper2a', 'money');
  await solve('paper2b', 'sextant');
  await go('meridian');
  await look('atlas', 'sextant');
  expect(has.ev('escrow_letter') && has.ev('capacity_report'), 'what Sallow hid');
  await deduce('sold', 'syndics');
  await go('hall');
  await talk('clay', { show: 'escrow_letter' }, 'You are one of two left.');
  expect(has.fact('clay_admits_money'), 'the Warden admits the fee');
  expect((await act('rest')).ok, 'Tuesday ends');

  // --------------------------------------------------------- WEDNESDAY
  expect(session.state.act === 3, 'Wednesday');
  await talk('kit', "The Dame's confession?", 'Who pours the tea?');
  await talk('hob', 'Do you see Dame Hesper?');
  expect(has.flag('letter_waiting'), 'Paper III has come');
  await look('tube');
  const before = session.state.steps;
  await solve('paper3', 'stalemate');
  await go('stalemate');
  await look('slate_board');
  await solve('slate', 'Censor');
  await look('stairs_crux');
  expect(session.state.location === 'crux', 'the stairs lead up to the Crux');
  await look('door_voss');
  expect(has.flag('voss_alive'), `Voss is reached in time (${session.state.steps - before} steps after the Paper)`);
  await talk('voss', 'What happened tonight?', 'What did the four of you do?', 'The letter on your spike?', 'Who is the Invigilator?');
  await look('tube_voss', 'spike', 'voss_desk', 'flask_voss', 'typewriter_voss', 'voss_chair');
  expect(has.fact('voss_confesses') && has.ev('spiked_letter'), 'one of the four says it aloud');
  await act('labSubmit', { id: 'spiked_letter' });

  await go('repository');
  await look('vitrines', 'server', 'rolls');
  await solve('nina', 'ARIADNE');
  expect(has.ev('nina_sheet'), 'the slanted name is something you can show people');
  await solve('ascii', 'lodge');
  await talk('jonah', { show: 'nina_sheet' });
  expect(has.fact('two_hands'), 'Jonah produces his memo');
  await look('jonah_desk', 'rolls');
  expect(has.ev('stylometry_memo') && has.fact('not_in_rolls'), 'the memo and the Rolls');

  await go('hall');
  await look('strongbox', 'register');
  await solve('lock', 'ariadne');
  await act('labSubmit', { id: 'lock_pendry' });
  await talk('hob', "Open the Warden's safe for me.");
  expect(has.ev('faircopy_books'), 'the Porter opens the safe');
  await act('labSubmit', { id: 'faircopy_books' });
  await talk('clay', 'What is in your safe?');

  await go('almshouse');
  await talk('hesper', 'Did you set the Papers?', { show: 'nina_sheet' }, 'Does he still come to see you?', 'Did you ever write down that it was his work?');
  expect(has.fact('dame_names_hob') && has.fact('ariadne_fettle') && has.fact('dame_asks'), 'Dame Hesper knows whose girl Ariadne was');
  expect(has.open('cryptic'), 'and gives her clue');
  await solve('cryptic', 'portrait');
  await go('hall');
  await look('portrait_hesper');
  expect(has.ev('codicil') && has.fact('codicil'), 'the Codicil was behind her');

  await deduce('confession', 'proud');
  await deduce('hand', 'third');
  await deduce('invisible', 'porter');
  await deduce('author', 'copyist');
  await wait(6);
  expect(has.fact('hand_match') && has.fact('changed_at_service') && has.fact('letter_same_hand'), 'the lab reports');

  const accused = await act('accuse', { suspect: 'hob', motive: 'author', items: ['faircopy_books', 'nina_sheet', 'codicil'] });
  expect(accused.verdict === 'hob_strong' && accused.final, `naming the Porter with proof is believed (got ${accused.verdict})`);

  // ---------------------------------------------------------- THURSDAY
  expect(session.state.act === 4 && has.ev('key_144'), 'the night of the Proving');
  expect(!has.unlocked('lantern'), 'nobody has told you where');
  await look('tube');
  await solve('paper4', 'tuition');
  await solve('bacon', 'Ariadne');
  await solve('meta', 'Lantern');
  expect(has.unlocked('lantern'), 'the seven answers give the place');
  await go('lantern');
  await look('orrery', 'proving_desk', 'hob_clock', 'grille_lock');
  await solve('grille', 'ARIADNE');
  let out = await act('talk', { id: 'hob' });
  expect(out.talk.finale, 'talking to the Porter in the Lantern is the finale');
  note(`  ${out.talk.greeting}`);
  let end = null;
  for (let i = 0; i < 8 && !end; i++) {
    const chip = (out.talk?.suggestions ?? out.suggestions ?? [])[0];
    out = await act('finaleSay', { text: chip ?? 'Put the clock down.' });
    note(`  > ${chip}\n  ${out.reply.say}`);
    if (out.reply.ended) end = out.ending;
  }
  expect(end?.how === 'surrender', `best path should end in surrender (got ${end?.how})`);
  const epi = await act('epilogue');
  note(`\n${epi.ending.text}\n`);
  console.log(`\nEnding: ${end?.how} · score ${end?.score} · rank "${end?.rank}" · ${session.state.steps} steps`);
  console.log(`Truths: ${end?.truths.filter((t) => t.found).length}/${end?.truths.length} · puzzles ${end?.puzzles.solved}/${end?.puzzles.of}`);
  const facts = Object.keys(session.state.facts).length;
  const total = Object.keys(session.case.facts).length;
  console.log(`Facts found: ${facts}/${total}`);
  const missing = Object.keys(session.case.facts).filter((f) => !(f in session.state.facts));
  if (missing.length) console.log(`Not reached on this path: ${missing.join(', ')}`);

  if (recordTo) fs.writeFileSync(recordTo, JSON.stringify(recorded));
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
