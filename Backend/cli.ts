import * as readline from "readline";
import { execFileSync } from "child_process";
import { writeFileSync, unlinkSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { Scanner } from "./scanner.js";
import { Parser } from "./parser.js";
import { TokenDef, Pattern } from "./ast.js";
import { generateCpp } from "./visitor.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, "output");

const PATTERN_ELEMENTS = [
  { key: "2",  label: "+",     text: "+" },
  { key: "3",  label: "-",     text: "-" },
  { key: "4",  label: "/",     text: "/" },
  { key: "5",  label: "*",     text: "*" },
  { key: "6",  label: "^",     text: "^" },
  { key: "7",  label: "[a-z]", text: "[a-z]" },
  { key: "8",  label: "[A-Z]", text: "[A-Z]" },
  { key: "9",  label: "[0-9]", text: "[0-9]" },
  { key: "10", label: "(",     text: "(" },
  { key: "11", label: ")",     text: ")" },
  { key: "12", label: "or",    text: " or " },
];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(prompt: string): Promise<string> {
  return new Promise((resolve) => rl.question(prompt, resolve));
}

function clear(): void {
  if (process.stdout.isTTY) console.clear();
}

// ── Menu Principal ─────────────────────────────────────────────

async function mainMenu(tokens: TokenDef[]): Promise<void> {
  while (true) {
    clear();
    console.log("=== Hacedor de Scanners ===\n");

    if (tokens.length === 0) {
      console.log("  No hay tokens definidos.\n");
    } else {
      console.log(`  Tokens definidos: ${tokens.length}\n`);
    }

    console.log("  1) Agregar token");
    console.log("  2) Ver listado de tokens");
    console.log("  3) Generar scanner");
    console.log("  4) Salir\n");

    const opt = await ask("  > ");

    switch (opt.trim()) {
      case "1":
        await addToken(tokens);
        break;
      case "2":
        if (tokens.length === 0) {
          await ask("  No hay tokens. Presione Enter...");
        } else {
          await showTokenList(tokens);
        }
        break;
      case "3":
        if (tokens.length === 0) {
          await ask("  Necesita al menos un token. Presione Enter...");
        } else {
          await generateAndRun(tokens);
        }
        break;
      case "4":
        rl.close();
        return;
      default:
        break;
    }
  }
}

// ── Agregar Token ──────────────────────────────────────────────

async function addToken(tokens: TokenDef[]): Promise<void> {
  const patternParts: string[] = [];

  while (true) {
    clear();
    console.log("=== Agregar Token ===\n");

    const patternStr =
      patternParts.length > 0 ? patternParts.join("") : "(vacio)";
    console.log(`  Patron actual: ${patternStr}\n`);

    console.log("  Elementos disponibles:\n");
    for (const el of PATTERN_ELEMENTS) {
      const label = el.label.padEnd(8);
      process.stdout.write(`  ${el.key}) ${label}\n`);
    }
    console.log("\n");

    console.log("  0) Eliminar ultimo");
    console.log("  1) Guardar y poner nombre\n");

    const opt = await ask("  > ");

    if (opt.trim() === "0") {
      if (patternParts.length > 0) {
        const removed = patternParts.pop()!;
        console.log(`  Eliminado: ${removed}`);
        await ask("  Presione Enter...");
      }
      continue;
    }

    if (opt.trim() === "1") {
      if (patternParts.length === 0) {
        await ask("  El patron no puede estar vacio. Presione Enter...");
        continue;
      }

      const patStr = patternParts.join("");

      try {
        const sc = new Scanner(patStr);
        const pa = new Parser(sc);
        pa.parseProgram();
      } catch (e: any) {
        await ask(`  Error: ${e.message}. Presione Enter...`);
        continue;
      }

      clear();
      console.log("=== Guardar Token ===\n");
      console.log(`  Patron: ${patStr}\n`);
      const name = await ask("  Nombre del token: ");

      if (name.trim().length === 0) {
        await ask("  Nombre vacio. Presione Enter...");
        continue;
      }

      if (tokens.some((t) => t.name === name.trim())) {
        await ask(
          `  Ya existe un token con el nombre "${name.trim()}". Presione Enter...`
        );
        continue;
      }

      const sc2 = new Scanner(patStr);
      const pa2 = new Parser(sc2);
      const program = pa2.parseProgram();
      tokens.push({ name: name.trim(), pattern: program.pattern });

      console.log(`\n  Token "${name.trim()}" guardado.`);
      await ask("  Presione Enter...");
      return;
    }

    const element = PATTERN_ELEMENTS.find((el) => el.key === opt.trim());
    if (element) {
      patternParts.push(element.text);
    }
  }
}

// ── Listado de Tokens ──────────────────────────────────────────

async function showTokenList(tokens: TokenDef[]): Promise<void> {
  clear();
  console.log("=== Listado de Tokens ===\n");

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const num = String(i + 1).padEnd(3);
    const name = t.name.padEnd(10);
    const pattern = patternToString(t.pattern);
    console.log(`  ${num}) ${name} -> ${pattern}`);
  }

  console.log();
  await ask("  Presione Enter para volver...");
}

function patternToString(p: Pattern): string {
  switch (p.kind) {
    case "charclass":
      switch (p.value) {
        case "lowercase":
          return "[a-z]";
        case "uppercase":
          return "[A-Z]";
        case "digit":
          return "[0-9]";
      }
      break;
    case "operator":
      return p.op;
    case "quantified": {
      const inner = patternToString(p.atom);
      const q =
        p.quantifier === "star"
          ? "*"
          : p.quantifier === "plus"
          ? "+"
          : "?";
      return inner + q;
    }
    case "sequence":
      return p.elements.map((e: Pattern) => patternToString(e)).join("");
    case "group":
      return "(" + patternToString(p.inner) + ")";
    case "binary": {
      const left = patternToString(p.left);
      const right = patternToString(p.right);
      return `${left} ${p.op} ${right}`;
    }
  }
  return "?";
}

// ── Generar Scanner ────────────────────────────────────────────

async function generateAndRun(tokens: TokenDef[]): Promise<void> {
  clear();
  console.log("=== Generar Scanner ===\n");
  console.log("  Generando codigo C++...");
  generateCpp(tokens, OUTPUT_DIR);
  console.log("  Codigo generado.");

  console.log("  Compilando...");
  try {
    execFileSync("g++", ["-std=c++17", "-o", "scanner_test", "token.cpp", "scanner.cpp", "main.cpp"], {
      cwd: OUTPUT_DIR,
      stdio: "pipe",
    });
  } catch (e: any) {
    console.log("  Error de compilacion:");
    console.log(e.stderr?.toString() || e.message);
    await ask("\n  Presione Enter...");
    return;
  }
  console.log("  Scanner compilado.\n");

  console.log(
    "  Escriba las cadenas a escanear (Enter vacio para salir):\n"
  );

  const testRl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const askTest = (p: string): Promise<string> =>
    new Promise((resolve) => testRl.question(p, resolve));

  while (true) {
    const input = await askTest("  > ");
    if (input.trim() === "") break;

    const tmpFile = join(OUTPUT_DIR, "_test_input.txt");
    writeFileSync(tmpFile, input + "\n");

    try {
      const result = execFileSync("./scanner_test", [tmpFile], {
        cwd: OUTPUT_DIR,
        encoding: "utf-8",
        stdio: ["ignore", "pipe", "pipe"],
      });
      const lines = result.split("\n").filter((l: string) => l.startsWith("TOKEN("));
      for (const line of lines) {
        console.log(`  ${line}`);
      }
    } catch (e: any) {
      const stdout = e.stdout?.toString() || "";
      const lines = stdout
        .split("\n")
        .filter((l: string) => l.startsWith("TOKEN("));
      for (const line of lines) {
        console.log(`  ${line}`);
      }
    }

    try { unlinkSync(tmpFile); } catch {}
    console.log();
  }

  testRl.close();
  console.log("\n  Scanner finalizado.");
  await ask("  Presione Enter para volver...");
}

// ── Entry Point ────────────────────────────────────────────────

const tokens: TokenDef[] = [];
mainMenu(tokens);
