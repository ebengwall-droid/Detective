# Credits

Greyhaven's story, rules, rooms and interface were written for this project.
The people, furniture, surfaces and the libraries that draw them are the work
of others, used under the licences below.

## People

The cast and their motion-capture animation are from the **Microsoft
Rocketbox Avatar Library**, © 2020 Microsoft, MIT License.
<https://github.com/microsoft/Microsoft-Rocketbox>

`scripts/assets/cast.json` records which avatar plays whom and which captures
are used. The models in `public/assets/characters` and the clips in
`public/assets/anims` are converted and compressed copies.

> Permission is hereby granted, free of charge, to any person obtaining a copy
> of this software and associated documentation files (the "Software"), to deal
> in the Software without restriction, including without limitation the rights
> to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
> copies of the Software, and to permit persons to whom the Software is
> furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all
> copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
> IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
> FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
> AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
> LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
> OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
> SOFTWARE.

## Furniture, props, surfaces and light

Models, photographed materials, the lighting environment and the night
outside the windows are from **Poly Haven**, released into the public domain
(CC0).
<https://polyhaven.com>

`scripts/assets/props.json` lists each one by its Poly Haven name. CC0 asks
for no credit; these are the artists whose work is in the game, with thanks:

Amal Kumar, Aron Łyczek, Arrangemonk, Benny Weimer, Charlotte Baglioni,
Dairon Sanchez, Dario Barresi, Derek Wight, Dimitrios Savva, Greg Zaal,
Guillaume Monsergent, Hank Kaamura, James Ray Cock, Jenelle van Heerden, Joe
Seabuhr, John Malcolm, Jurita Burger, Kirill Sannikov, Kuutti Siitonen, L,
Luca B, Luis José Fernández Rodríguez, Mateusz Sadek, Monsta3D, PierreB3D,
ProgrammerOnCoffee, Rajil Jose Macatangay, Rico Cilliers, Rob Tuytel,
Satyaki Mandal, Sean Buckley, Sergej Majboroda, Serhii Khromov, SV Garip,
Tina, Ulan Cabanilla and Yann Kervran.

## Libraries

| | Licence | Used for |
|---|---|---|
| [three.js](https://threejs.org) | MIT | The 3D engine: rendering, skinned animation, glTF loading |
| [postprocessing](https://github.com/pmndrs/postprocessing) | Zlib | Bloom, depth of field, tone mapping, the film look |
| [N8AO](https://github.com/N8python/n8ao) | ISC | Ambient occlusion |
| [meshoptimizer](https://github.com/zeux/meshoptimizer) | MIT | Compressing models, and decoding them in the page (the plain-JavaScript decoder in `public/src/world/lib` is its reference decoder, by Jasper St. Pierre) |
| [@anthropic-ai/sdk](https://github.com/anthropics/anthropic-sdk-typescript) | Apache-2.0 | Talking to Claude from the server |

Preparing the assets (not shipped with the game): FBX2glTF (BSD-3-Clause),
glTF-Transform (MIT), sharp (Apache-2.0), esbuild (MIT).

## Type

Bricolage Grotesque, Instrument Sans, JetBrains Mono, Marcellus and Special
Elite, all under the SIL Open Font License, served by Google Fonts.
