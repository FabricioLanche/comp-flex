import type { TokenDef, CodeFile } from './types';
import { Scanner } from '@backend/scanner.js';
import { Parser } from '@backend/parser.js';
import { generateCppFiles as backendGenerate } from '@backend/visitor.js';
import type { TokenDef as BackendTokenDef } from '@backend/ast.js';

/**
 * Parse each token's pattern string into an AST,
 * validate it, and generate C++ files.
 */
export function generateCppFiles(tokens: TokenDef[]): CodeFile[] {
  if (tokens.length === 0) return [];

  const backendDefs: BackendTokenDef[] = [];

  for (const tok of tokens) {
    const sc = new Scanner(tok.pattern);
    const pa = new Parser(sc);
    const program = pa.parseProgram();
    backendDefs.push({ name: tok.name, pattern: program.pattern });
  }

  return backendGenerate(backendDefs);
}

/**
 * Call the backend HTTP server to compile and run the scanner
 * on the given test string.
 */
export async function scanTokens(
  tokens: TokenDef[],
  input: string,
): Promise<string[]> {
  const res = await fetch('http://localhost:3000/scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tokens, input }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Error al escanear');
  }

  return data.tokens as string[];
}
