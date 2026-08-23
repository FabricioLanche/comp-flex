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
 * Parse a single pattern string and return an error message,
 * or null if the pattern is syntactically valid.
 */
export function validatePattern(pattern: string): string | null {
  try {
    const sc = new Scanner(pattern);
    const pa = new Parser(sc);
    pa.parseProgram();
    return null;
  } catch (e: unknown) {
    return e instanceof Error ? e.message : 'Patrón inválido';
  }
}

/**
 * Call the backend HTTP server to compile and run the scanner
 * on the given test string.
 */
export async function scanTokens(
  tokens: TokenDef[],
  input: string,
): Promise<string[]> {
  const res = await fetch('/scan', {
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
