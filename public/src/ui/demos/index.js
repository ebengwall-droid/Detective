// Every animated how-to, by lesson id (the part after "l_" in the case's records).

import { CORE } from './core.js';
import { CIPHERS } from './ciphers.js';
import { CODES } from './codes.js';
import { PUZZLES } from './puzzles.js';

export const DEMOS = { ...CORE, ...CIPHERS, ...CODES, ...PUZZLES };
