/**
 * Lightweight order-2 Markov chain name generator.
 * Trains on a corpus of example names and produces new names
 * that statistically resemble the training set.
 */

const ORDER = 2;
const START = '^';
const END = '$';

type Chain = Map<string, Map<string, number>>;

function buildChain(names: string[]): Chain {
  const chain: Chain = new Map();
  for (const name of names) {
    const padded = START.repeat(ORDER) + name.toLowerCase() + END;
    for (let i = 0; i < padded.length - ORDER; i++) {
      const key = padded.slice(i, i + ORDER);
      const next = padded[i + ORDER];
      let exits = chain.get(key);
      if (!exits) { exits = new Map(); chain.set(key, exits); }
      exits.set(next, (exits.get(next) ?? 0) + 1);
    }
  }
  return chain;
}

function sampleChar(exits: Map<string, number>, rand: () => number): string {
  const total = [...exits.values()].reduce((a, b) => a + b, 0);
  let r = rand() * total;
  for (const [ch, count] of exits) {
    r -= count;
    if (r <= 0) return ch;
  }
  // fallback: return the last key
  return [...exits.keys()].at(-1) ?? END;
}

function generateOne(chain: Chain, rand: () => number): string {
  let state = START.repeat(ORDER);
  let result = '';
  for (let i = 0; i < 20; i++) {
    const exits = chain.get(state);
    if (!exits) break;
    const next = sampleChar(exits, rand);
    if (next === END) break;
    result += next;
    state = (state + next).slice(-ORDER);
  }
  return result ? result[0].toUpperCase() + result.slice(1) : '';
}

/**
 * Generate `count` unique names from the given corpus.
 * Falls back to randomly picking corpus names if the chain
 * can't produce enough valid results.
 */
export function generateNames(corpus: string[], count: number): string[] {
  const chain = buildChain(corpus);
  const lowerCorpus = new Set(corpus.map((n) => n.toLowerCase()));
  const rand = () => Math.random();

  const results = new Set<string>();
  let attempts = 0;
  const maxAttempts = count * 40;

  while (results.size < count && attempts < maxAttempts) {
    attempts++;
    const name = generateOne(chain, rand);
    if (
      name.length >= 3 &&
      name.length <= 14 &&
      !results.has(name) &&
      !lowerCorpus.has(name.toLowerCase())
    ) {
      results.add(name);
    }
  }

  // If we couldn't generate enough novel names, pad with shuffled corpus names
  if (results.size < count) {
    const shuffled = [...corpus].sort(() => rand() - 0.5);
    for (const name of shuffled) {
      if (results.size >= count) break;
      const titled = name[0].toUpperCase() + name.slice(1).toLowerCase();
      results.add(titled);
    }
  }

  return [...results];
}
