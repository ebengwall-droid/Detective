// Print what is inside a glTF/GLB: meshes, materials, morph targets, bones, animations.
//   node scripts/assets/inspect.mjs file.glb [--bones] [--targets]
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';

const file = process.argv[2];
const flag = (n) => process.argv.includes(`--${n}`);
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
const doc = await io.read(file);
const root = doc.getRoot();
console.log('extensions:', root.listExtensionsUsed().map((e) => e.extensionName).join(', ') || 'none');
for (const mesh of root.listMeshes()) {
  const names = mesh.getExtras()?.targetNames ?? [];
  console.log(`mesh "${mesh.getName()}" prims=${mesh.listPrimitives().length} targets=${mesh.listPrimitives()[0]?.listTargets().length} weights=${mesh.getWeights().length} named=${names.length}`);
  for (const prim of mesh.listPrimitives()) {
    const pos = prim.getAttribute('POSITION');
    const idx = prim.getIndices();
    console.log(`   prim mat="${prim.getMaterial()?.getName()}" verts=${pos.getCount()} tris=${idx ? idx.getCount() / 3 : pos.getCount() / 3} attrs=${prim.listSemantics().join(',')} targets=${prim.listTargets().length}`);
  }
  if (flag('targets')) console.log('   target names:', names.join(' | '));
}
for (const m of root.listMaterials()) {
  console.log(`material "${m.getName()}" alpha=${m.getAlphaMode()} base=${m.getBaseColorFactor().map((v) => v.toFixed(2))} rough=${m.getRoughnessFactor()} metal=${m.getMetallicFactor()} tex=${m.getBaseColorTexture()?.getName() ?? '-'} normal=${m.getNormalTexture()?.getName() ?? '-'} double=${m.getDoubleSided()}`);
}
for (const t of root.listTextures()) console.log(`texture "${t.getName()}" ${t.getMimeType()} ${t.getSize()?.join('x')} ${(t.getImage()?.byteLength / 1024).toFixed(0)}KB uri=${t.getURI()}`);
for (const s of root.listSkins()) console.log(`skin "${s.getName()}" joints=${s.listJoints().length}`);
const nodes = root.listNodes();
console.log('nodes:', nodes.length);
if (flag('bones')) {
  const walk = (n, d) => {
    const t = n.getTranslation().map((v) => v.toFixed(3)).join(',');
    console.log(`${'  '.repeat(d)}${n.getName()} [${t}]${n.getMesh() ? ' <mesh>' : ''}${n.getSkin() ? ' <skin>' : ''}`);
    for (const c of n.listChildren()) walk(c, d + 1);
  };
  for (const scene of root.listScenes()) for (const n of scene.listChildren()) walk(n, 0);
}
for (const a of root.listAnimations()) {
  const ch = a.listChannels();
  const paths = {};
  let dur = 0;
  for (const c of ch) {
    paths[c.getTargetPath()] = (paths[c.getTargetPath()] ?? 0) + 1;
    const input = c.getSampler().getInput();
    dur = Math.max(dur, input.getMax([])[0]);
  }
  console.log(`animation "${a.getName()}" channels=${ch.length} ${JSON.stringify(paths)} duration=${dur.toFixed(2)}s keys=${ch[0]?.getSampler().getInput().getCount()}`);
}
