// Conversations: what a character says when no model is answering, the threads
// in a reply, what a live reply may carry, and the story's own calendar.

import test from 'node:test';
import assert from 'node:assert/strict';
import { GameSession } from '../core/engine.js';
import { CASE } from '../core/cases/fold/index.js';
import { npcSystem, npcSchema } from '../core/prompts.js';
import { intentOf, threadsIn, cleanThreads, subjects } from '../core/talk.js';

async function fresh(ai = null) {
  const session = new GameSession({ ai });
  await session.newGame({ name: 'Sam' });
  return session;
}

test('plain remarks are recognised for what they are', () => {
  const cases = {
    hello: ['hi', 'Hello!', 'hey there', 'good morning', 'Hi Kit'],
    who: ['who are you?', "what's your name", 'what do you do', 'tell me about yourself', 'how long have you worked here'],
    how: ['how are you', 'are you ok?', 'how are you feeling today'],
    thanks: ['thanks', 'thank you', 'cheers'],
    bye: ['bye', 'goodbye', "that's all"],
    next: ['what should I do', 'what now?', 'where do I go', "i'm stuck", 'help', 'any ideas'],
    ack: ['ok', 'I see', 'right', 'hmm', 'yes', 'go on'],
    case: ['who died?', 'what happened', 'what did you see?', 'tell me what you know'],
    accuse: ['did you do it?', 'did you kill him', 'it was you', 'you poisoned them'],
  };
  for (const [intent, lines] of Object.entries(cases)) for (const line of lines) assert.equal(intentOf(line), intent, `"${line}"`);
  for (const line of ['why is the gate locked', 'who pours the tea', 'tell me about Pendry', 'what time did he die']) assert.equal(intentOf(line), null, `"${line}" has a subject, not just a manner`);
});

test('different words for the same thing meet', () => {
  assert.deepEqual(subjects('who died?'), ['dead']);
  assert.ok(subjects('the victim was murdered').every((w) => w === 'dead'));
  assert.deepEqual(subjects('was he saved'), subjects('an antidote'));
  assert.equal(subjects('the clocks')[0], subjects('a clock')[0]);
  assert.deepEqual(subjects('the and of to you'), []);
});

test('nobody answers an ordinary remark with a non-sequitur', async () => {
  const session = await fresh();
  for (const [id, npc] of Object.entries(CASE.npcs)) {
    // Put each person through it as they are first met, without a model.
    session.state.npcs[id] = undefined;
    const st = session.npcState(id);
    st.sessionOpen = true;
    for (const line of ['hi', 'who are you?', 'how are you?', 'thanks', 'ok', 'did you do it?', 'what should I do?', 'bye']) {
      const reply = session.brain.scriptedReply(session.state, id, { text: line });
      assert.ok(reply.say && reply.say.length > 8, `${id} answers "${line}"`);
      assert.ok(!reply.lost, `${id} is not lost by "${line}"`);
      assert.ok(!npc.fallback.includes(reply.say), `${id} does not shrug at "${line}": ${reply.say}`);
    }
  }
});

test('free words find what a person knows, and admit it when they do not', async () => {
  const session = await fresh();
  await session.talk({ id: 'kit' });
  const say = async (text) => (await session.say({ id: 'kit', text })).reply;
  assert.match((await say('who died?')).say, /Pendry/);
  assert.match((await say('why is the gate locked')).say, /letter-lock/);
  assert.match((await say('what is this place exactly')).say, /Company of Setters/);
  assert.match((await say('why are the clocks wrong')).say, /eleven minutes/);
  const lost = await say('do you like marmalade');
  assert.ok(lost.lost, 'a question she cannot answer is flagged, so the screen can offer threads');
  assert.ok(CASE.npcs.kit.fallback.includes(lost.say));
});

test('the partner says what to do next, from the open objective', async () => {
  const session = await fresh();
  await session.talk({ id: 'kit' });
  const reply = (await session.say({ id: 'kit', text: 'what should I do now?' })).reply;
  assert.match(reply.say, /gate needs a word/i);
  session.npcState('marsh');
  const other = session.brain.scriptedReply(session.state, 'marsh', { text: 'what should I do now?' });
  assert.ok(!/gate needs a word/i.test(other.say), 'nobody else is told what the detective is working on');
});

test('pleasantries cost no time; questions do', async () => {
  const session = await fresh();
  await session.talk({ id: 'kit' });
  const before = session.state.steps;
  for (const line of ['hi', 'ok', 'thanks', 'how are you']) await session.say({ id: 'kit', text: line });
  assert.equal(session.state.steps, before);
  await session.say({ id: 'kit', text: 'who died?' });
  assert.equal(session.state.steps, before + 1);
});

test('a question answered in other words is no longer suggested', async () => {
  const session = await fresh();
  const talk = (await session.talk({ id: 'kit' })).talk;
  assert.ok(talk.suggestions.includes('What is this place?'));
  const res = await session.say({ id: 'kit', text: 'tell me about the fold' });
  assert.ok(!res.suggestions.includes('What is this place?'));
});

test('threads quote the line exactly and lead somewhere real', async () => {
  const session = await fresh();
  const talk = (await session.talk({ id: 'kit' })).talk;
  assert.ok(talk.threads.length >= 1, 'the greeting has something to pull on');
  for (const t of talk.threads) {
    assert.ok(talk.greeting.includes(t.on), `"${t.on}" is in the greeting`);
    assert.ok(CASE.npcs.kit.ask.some((a) => a.q === t.ask), `"${t.ask}" is one of her questions`);
  }
  // Pulling one asks its question and gets its answer.
  const res = await session.say({ id: 'kit', text: talk.threads[0].ask });
  assert.ok(!res.reply.lost);
  for (const t of res.reply.threads) assert.ok(res.reply.say.includes(t.on));
});

test('threads are never found inside a stage direction, and never overlap', () => {
  const leads = [
    { q: 'About the keys?', keys: ['keys', 'key'] },
    { q: 'About the clock?', keys: ['clock'] },
    { q: 'About the master key?', keys: ['master key'] },
  ];
  const found = threadsIn('*He turns a key on its hook.* The keys are kept here, and the master key stays with me. The clocks are wound Sundays.', leads);
  assert.deepEqual(found.map((t) => t.on).sort(), ['clocks', 'keys', 'master key']);
  assert.equal(threadsIn('*He looks at the clock.*', leads).length, 0);
});

test('a model may propose threads, but only ones that quote what it said', () => {
  const say = 'The master stays in my pocket, for fire. *He polishes.* Tea?';
  const kept = cleanThreads(say, [
    { on: 'The master', ask: 'Who else can use the master?' },
    { on: 'not in the line', ask: 'Dropped' },
    { on: 'He polishes', ask: 'Inside a stage direction' },
    { on: 'master', ask: 'Overlaps the first' },
    { on: 'Tea?', ask: 'x'.repeat(200) },
    { on: 'for fire', ask: 'Has there been a fire?' },
    'nonsense',
  ]);
  assert.deepEqual(kept, [
    { on: 'The master', ask: 'Who else can use the master?' },
    { on: 'for fire', ask: 'Has there been a fire?' },
  ]);
});

test('a live reply carries its threads through the game, and a broken one falls back to the script', async () => {
  let answer = JSON.stringify({ say: 'Ignatius Pendry. One of the four Syndics, and dead at his bench.', mood: 'guarded', told: ['k_pendry'], acts: [], threads: [{ on: 'the four Syndics', ask: 'Who are the Syndics?' }, { on: 'somewhere else', ask: 'No' }] });
  const ai = { describe: () => ({ live: true, label: 'test' }), complete: async () => ({ text: answer, refused: false }) };
  const session = await fresh(ai);
  await session.talk({ id: 'kit' });
  const res = await session.say({ id: 'kit', text: 'who died?' });
  assert.equal(res.reply.degraded, false);
  assert.deepEqual(res.reply.threads, [{ on: 'the four Syndics', ask: 'Who are the Syndics?' }]);
  answer = 'I am sorry, I cannot do that.';
  const res2 = await session.say({ id: 'kit', text: 'why is the gate locked' });
  assert.equal(res2.reply.degraded, true);
  assert.match(res2.reply.say, /letter-lock/, 'the fallback still answers the question');
});

test('the reply format asks for threads', async () => {
  const session = await fresh();
  const schema = npcSchema(CASE, 'kit', session.state);
  assert.ok(schema.required.includes('threads'));
  assert.equal(schema.properties.threads.items.additionalProperties, false);
  const system = npcSystem(CASE, 'kit', session.state);
  assert.match(system, /"threads"/);
  assert.match(system, /What the detective is working on/);
  assert.ok(!/What the detective is working on/.test(npcSystem(CASE, 'marsh', session.state)));
});

test('the calendar holds: he drank it on Sunday and was found on Monday', () => {
  assert.match(CASE.world, /four on Sunday/);
  assert.match(CASE.world, /On Monday morning/);
  assert.match(CASE.facts.banging.text, /Sunday night/);
  assert.match(CASE.evidence.paper_pendry.desc, /Sunday night/);
  assert.match(CASE.evidence.cup_pendry.desc, /on Sunday/);
  assert.match(CASE.evidence.autopsy_pendry.doc, /on Sunday/);
  assert.match(CASE.evidence.autopsy_sallow.doc, /on Monday/);
  const wilf = CASE.npcs.wilf.persona;
  assert.ok(!/On Monday Pendry went/.test(wilf) && /left at six on Sunday/.test(wilf));
  assert.ok(CASE.npcs.quoin.ask.some((a) => a.q === 'Did you hear anything on Sunday night?'));
});

test('on Monday nobody knows what happens on Tuesday or Wednesday', async () => {
  const session = await fresh();
  assert.equal(session.state.act, 1);
  const later = [/Sallow (was|has been) found/i, /Sallow died/i, /both died/i, /two of (the )?four/i, /has confessed/i, /she set the Papers/i, /On Wednesday/i];
  for (const id of ['kit', 'marsh', 'wilf', 'quoin', 'clay']) {
    const system = npcSystem(CASE, id, session.state);
    for (const re of later) assert.ok(!re.test(system), `${id}'s Monday sheet does not say ${re}`);
    assert.match(system, /Today is Monday/);
  }
  // By Wednesday the same sheets have caught up.
  session.state.act = 3;
  assert.match(npcSystem(CASE, 'marsh', session.state), /Sallow came in on Tuesday/);
  assert.match(npcSystem(CASE, 'clay', session.state), /confession/);
});

test('everyone has something to do while they think, and it is only ever a stage direction', async () => {
  const session = await fresh();
  const talk = (await session.talk({ id: 'kit' })).talk;
  assert.ok(talk.beats.length >= 2);
  for (const npc of Object.values(CASE.npcs)) {
    assert.ok(npc.small.beat.length >= 2, `${npc.name} has two`);
    for (const b of npc.small.beat) assert.match(b, /^\*[^*]+\*$/, `${npc.name}: ${b}`);
  }
});
