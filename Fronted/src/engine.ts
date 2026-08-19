import type { TokenDef, ScanResult } from './types';

/**
 * Build a DFA from token definitions.
 *
 * TODO: connect to the real backend engine:
 *   1. Parse each regex with PatternLexer + PatternParser
 *   2. Build NFA via Thompson's construction
 *   3. Convert NFA → DFA via subset construction
 *
 * For now returns a placeholder object.
 */
export function buildDFA(_tokens: TokenDef[]): object {
  return { ready: true };
}

/**
 * Run the scanner on an input string using the DFA.
 *
 * TODO: replace stub with real DFA traversal + maximal munch.
 *
 * Returns an array of recognized tokens or lexical errors.
 */
export function runScanner(_dfa: object, input: string, tokens: TokenDef[]): ScanResult[] {
  const results: ScanResult[] = [];
  const firstName = tokens.length > 0 ? tokens[0].name : 'UNKNOWN';
  let i = 0;

  while (i < input.length) {
    if (input[i] === ' ' || input[i] === '\t' || input[i] === '\n') {
      i++;
      continue;
    }

    let lexema = '';
    const start = i;
    while (i < input.length && input[i] !== ' ' && input[i] !== '\t' && input[i] !== '\n') {
      lexema += input[i];
      i++;
    }

    // Stub: label everything as the first token
    results.push({ type: 'token', name: firstName, lexema, position: start });
  }

  return results;
}
