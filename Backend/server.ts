import http from "http";
import { Scanner } from "./scanner.js";
import { Parser } from "./parser.js";
import { TokenDef, Pattern } from "./ast.js";

const PORT = 3000;

function parseBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString()));
    req.on("error", reject);
  });
}

// ── Scanner TS (replica la lógica del C++ generado) ────────────

function matchPattern(node: Pattern, input: string, pos: number): number {
  switch (node.kind) {
    case "charclass":
      return matchCharClass(node.value, input, pos);
    case "operator":
      if (pos >= input.length || input[pos] !== node.op) return 0;
      return 1;
    case "group":
      return matchPattern(node.inner, input, pos);
    case "sequence":
      return matchSequence(node.elements, input, pos);
    case "quantified":
      return matchQuantified(node.atom, node.quantifier, input, pos);
    case "binary":
      return matchBinary(node.left, node.right, input, pos);
    default:
      return 0;
  }
}

function matchCharClass(
  value: "lowercase" | "uppercase" | "digit",
  input: string,
  pos: number,
): number {
  if (pos >= input.length) return 0;
  const c = input[pos];
  switch (value) {
    case "lowercase": return c >= "a" && c <= "z" ? 1 : 0;
    case "uppercase": return c >= "A" && c <= "Z" ? 1 : 0;
    case "digit":     return c >= "0" && c <= "9" ? 1 : 0;
  }
}

function matchSequence(elements: Pattern[], input: string, pos: number): number {
  let total = 0;
  for (const elem of elements) {
    const len = matchPattern(elem, input, pos + total);
    if (len === 0) return 0;
    total += len;
  }
  return total;
}

function matchQuantified(
  atom: Pattern,
  quantifier: "star" | "plus" | "optional",
  input: string,
  pos: number,
): number {
  let total = 0;

  if (quantifier === "star" || quantifier === "plus") {
    if (quantifier === "plus") {
      const first = matchPattern(atom, input, pos);
      if (first === 0) return 0;
      total += first;
    }
    // Greedy: match as many as possible
    while (pos + total < input.length) {
      const next = matchPattern(atom, input, pos + total);
      if (next === 0) break;
      total += next;
    }
    return total;
  }

  // optional
  return matchPattern(atom, input, pos);
}

function matchBinary(
  left: Pattern,
  right: Pattern,
  input: string,
  pos: number,
): number {
  const leftLen = matchPattern(left, input, pos);
  if (leftLen > 0) return leftLen;
  return matchPattern(right, input, pos);
}

function isWhitespace(c: string): boolean {
  return c === " " || c === "\n" || c === "\r" || c === "\t";
}

/**
 * Run scanner on input string using parsed token definitions.
 * Mimics the generated C++ Scanner::nextToken() logic.
 */
function runScan(input: string, defs: TokenDef[]): string[] {
  const results: string[] = [];
  let pos = 0;

  while (true) {
    // Skip whitespace (como C++ is_white_space)
    while (pos < input.length && isWhitespace(input[pos])) pos++;

    if (pos >= input.length) {
      results.push("TOKEN(END)");
      break;
    }

    let matched = false;
    for (const def of defs) {
      const len = matchPattern(def.pattern, input, pos);
      if (len > 0) {
        const lexema = input.substring(pos, pos + len);
        results.push(`TOKEN(${def.name}, "${lexema}")`);
        pos += len;
        matched = true;
        break;
      }
    }

    if (!matched) {
      const c = input[pos];
      results.push(`TOKEN(ERR, "${c}")`);
      pos++;
    }
  }

  return results;
}

// ── HTTP Server ────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }

  if (req.method === "POST" && req.url === "/scan") {
    try {
      const body = JSON.parse(await parseBody(req));
      const { input, tokens } = body as {
        input: string;
        tokens: { name: string; pattern: string }[];
      };

      if (!input || typeof input !== "string") {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Falta el campo 'input'" }));
        return;
      }
      if (!Array.isArray(tokens) || tokens.length === 0) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Faltan tokens definidos" }));
        return;
      }

      // Parsear patrones
      const defs: TokenDef[] = [];
      for (const tok of tokens) {
        try {
          const sc = new Scanner(tok.pattern);
          const pa = new Parser(sc);
          const program = pa.parseProgram();
          defs.push({ name: tok.name, pattern: program.pattern });
        } catch (e: any) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              error: `Patrón inválido para "${tok.name}": ${e.message}`,
            }),
          );
          return;
        }
      }

      // Ejecutar scanner TS
      const tokenLines = runScan(input, defs);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ tokens: tokenLines }));
    } catch (e: any) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: e.message || "Error interno" }));
    }
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, () => {
  console.log(`Backend server: http://localhost:${PORT}`);
  console.log(`  POST /scan   — ejecutar scanner`);
  console.log(`  GET  /health — verificar estado`);
});
