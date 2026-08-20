import {
  Pattern,
  TokenDef,
  Program,
  BinaryExp,
  SequenceExp,
  QuantifiedExp,
  OperatorExp,
  CharClass,
  GroupExp,
} from "./ast.js";

// ── Visitor interface (como el profe) ──────────────────────────

export interface Visitor {
  visitBinaryExp(exp: BinaryExp): string;
  visitSequenceExp(exp: SequenceExp): string;
  visitQuantifiedExp(exp: QuantifiedExp): string;
  visitOperatorExp(exp: OperatorExp): string;
  visitCharClass(exp: CharClass): string;
  visitGroupExp(exp: GroupExp): string;
  visitProgram(program: Program): string;
}

// ── CppGeneratorVisitor (como GencodeVisitor del profe) ────────

export class CppGeneratorVisitor implements Visitor {
  private posVar: string;

  constructor() {
    this.posVar = "p";
  }

  // ── Entry point (como gencode del profe) ─────────────────────

  generateFiles(tokenDefs: TokenDef[]): GeneratedFile[] {
    const names = tokenDefs.map((t) => t.name);

    return [
      { name: "token.h",    code: this.genTokenH(names) },
      { name: "token.cpp",  code: this.genTokenCpp(names) },
      { name: "scanner.h",  code: this.genScannerH() },
      { name: "scanner.cpp", code: this.genScannerCpp(tokenDefs) },
      { name: "main.cpp",   code: this.genTestMain() },
    ];
  }

  // ── Visitor methods (cada nodo genera su código C++) ────────

  visitBinaryExp(exp: BinaryExp): string {
    const leftBody = this.genMatchBodyNoReturn(exp.left, this.posVar);
    const rightBody = this.genMatchBodyNoReturn(exp.right, this.posVar);
    return `if (${leftBody.trim()}) { return true; }
    else if (${rightBody.trim()}) { return true; }
    return false;`;
  }

  visitSequenceExp(exp: SequenceExp): string {
    const lines: string[] = [];
    const saved = this.posVar;

    for (const elem of exp.elements) {
      if (elem.kind === "quantified") {
        const atomCheck = this.genAtomCheck(elem.atom, "p");
        switch (elem.quantifier) {
          case "star":
            lines.push(`    while (p < (int)input.length()) {`);
            lines.push(`        ${atomCheck} { p++; }`);
            lines.push(`        else break;`);
            lines.push(`    }`);
            break;
          case "plus":
            lines.push(`    if (p >= (int)input.length()) return false;`);
            lines.push(`    ${atomCheck} { p++; }`);
            lines.push(`    else return false;`);
            lines.push(`    while (p < (int)input.length()) {`);
            lines.push(`        ${atomCheck} { p++; }`);
            lines.push(`        else break;`);
            lines.push(`    }`);
            break;
          case "optional":
            lines.push(`    if (p < (int)input.length()) {`);
            lines.push(`        ${atomCheck} { p++; }`);
            lines.push(`    }`);
            break;
        }
      } else if (elem.kind === "charclass") {
        const cond = this.charClassCondition(elem.value, "p");
        lines.push(`    if (p < (int)input.length() && ${cond}) { p++; }`);
        lines.push(`    else return false;`);
      } else if (elem.kind === "operator") {
        const escaped = escapeChar(elem.op);
        lines.push(`    if (p < (int)input.length() && input[p] == '${escaped}') { p++; }`);
        lines.push(`    else return false;`);
      } else {
        this.posVar = "p";
        const body = elem.accept(this);
        this.posVar = saved;
        lines.push(`    { ${body.split("\n").join("\n    ")} }`);
        lines.push(`    else return false;`);
      }
    }

    lines.push(`    ${saved} = p;`);
    lines.push(`    return true;`);
    return lines.join("\n");
  }

  visitQuantifiedExp(exp: QuantifiedExp): string {
    const atomCheck = this.genAtomCheck(exp.atom, "p");
    switch (exp.quantifier) {
      case "star":
        return `    while (p < (int)input.length()) {
        ${atomCheck} { p++; }
        else break;
    }
    ${this.posVar} = p;
    return true;`;
      case "plus":
        return `    if (p >= (int)input.length()) return false;
    ${atomCheck} { p++; }
    else return false;
    while (p < (int)input.length()) {
        ${atomCheck} { p++; }
        else break;
    }
    ${this.posVar} = p;
    return true;`;
      case "optional":
        return `    if (p < (int)input.length()) {
        ${atomCheck} { p++; }
    }
    ${this.posVar} = p;
    return true;`;
    }
  }

  visitOperatorExp(exp: OperatorExp): string {
    const escaped = escapeChar(exp.op);
    return `    if (p >= (int)input.length()) return false;
    if (input[p] == '${escaped}') { ${this.posVar} = p + 1; return true; }
    return false;`;
  }

  visitCharClass(exp: CharClass): string {
    const cond = this.charClassCondition(exp.value, this.posVar);
    return `    if (p >= (int)input.length()) return false;
    if (!${cond}) return false;
    p++;
    while (p < (int)input.length() && ${cond}) p++;
    ${this.posVar} = p;
    return true;`;
  }

  visitGroupExp(exp: GroupExp): string {
    return exp.inner.accept(this);
  }

  visitProgram(program: Program): string {
    return program.pattern.accept(this);
  }

  // ── Helpers privados ────────────────────────────────────────

  private genMatchBodyNoReturn(p: Pattern, posVar: string): string {
    if (p.kind === "charclass") {
      const cond = this.charClassCondition(p.value, posVar);
      return `[&]() {
        int _p = ${posVar};
        if (_p >= (int)input.length()) return false;
        if (!(${cond})) return false;
        _p++;
        while (_p < (int)input.length() && (${cond})) _p++;
        ${posVar} = _p;
        return true;
    }()`;
    }
    if (p.kind === "operator") {
      const escaped = escapeChar(p.op);
      return `([&, _saved = ${posVar}]() {
        if (_saved >= (int)input.length()) return false;
        if (input[_saved] == '${escaped}') { ${posVar} = _saved + 1; return true; }
        return false;
    }())`;
    }
    if (p.kind === "quantified") {
      const atomCheck = this.genAtomCheckNoReturn(p.atom, "_p");
      switch (p.quantifier) {
        case "star":
          return `[&, _saved = ${posVar}]() {
        int _p = _saved;
        while (_p < (int)input.length()) {
            ${atomCheck} { _p++; }
            else break;
        }
        ${posVar} = _p;
        return true;
    }()`;
        case "plus":
          return `[&, _saved = ${posVar}]() {
        int _p = _saved;
        if (_p >= (int)input.length()) return false;
        ${atomCheck} { _p++; }
        else return false;
        while (_p < (int)input.length()) {
            ${atomCheck} { _p++; }
            else break;
        }
        ${posVar} = _p;
        return true;
    }()`;
        case "optional":
          return `[&, _saved = ${posVar}]() {
        int _p = _saved;
        if (_p < (int)input.length()) {
            ${atomCheck} { _p++; }
        }
        ${posVar} = _p;
        return true;
    }()`;
      }
    }
    if (p.kind === "sequence") {
      const saved = this.posVar;
      this.posVar = "_p";
      const lines: string[] = [];
      lines.push(`[&, _saved = ${posVar}]() {`);
      lines.push(`    int _p = _saved;`);
      for (const elem of p.elements) {
        if (elem.kind === "quantified") {
          const atomCheck = this.genAtomCheckNoReturn(elem.atom, "_p");
          switch (elem.quantifier) {
            case "star":
              lines.push(`    while (_p < (int)input.length()) {`);
              lines.push(`        ${atomCheck} { _p++; }`);
              lines.push(`        else break;`);
              lines.push(`    }`);
              break;
            case "plus":
              lines.push(`    if (_p >= (int)input.length()) return false;`);
              lines.push(`    ${atomCheck} { _p++; }`);
              lines.push(`    else return false;`);
              lines.push(`    while (_p < (int)input.length()) {`);
              lines.push(`        ${atomCheck} { _p++; }`);
              lines.push(`        else break;`);
              lines.push(`    }`);
              break;
            case "optional":
              lines.push(`    if (_p < (int)input.length()) {`);
              lines.push(`        ${atomCheck} { _p++; }`);
              lines.push(`    }`);
              break;
          }
        } else if (elem.kind === "charclass") {
          const cond = this.charClassCondition(elem.value, "_p");
          lines.push(`    if (_p < (int)input.length() && ${cond}) { _p++; }`);
          lines.push(`    else return false;`);
        } else if (elem.kind === "operator") {
          const escaped = escapeChar(elem.op);
          lines.push(`    if (_p < (int)input.length() && input[_p] == '${escaped}') { _p++; }`);
          lines.push(`    else return false;`);
        }
      }
      lines.push(`    ${posVar} = _p;`);
      lines.push(`    return true;`);
      lines.push(`}()`);
      this.posVar = saved;
      return lines.join("\n");
    }
    if (p.kind === "group") {
      return this.genMatchBodyNoReturn(p.inner, posVar);
    }
    return p.accept(this);
  }

  private genAtomCheck(atom: CharClass | GroupExp, posVar: string): string {
    if (atom.kind === "charclass") {
      return `if (${this.charClassCondition(atom.value, posVar)})`;
    }
    const saved = this.posVar;
    this.posVar = posVar;
    const inner = atom.inner.accept(this);
    this.posVar = saved;
    return `if ([&]() {
        ${inner.split("\n").join("\n        ")}
    }()`;
  }

  private genAtomCheckNoReturn(atom: CharClass | GroupExp, posVar: string): string {
    if (atom.kind === "charclass") {
      return `if (${this.charClassCondition(atom.value, posVar)})`;
    }
    return `if (${this.genMatchBodyNoReturn(atom.inner, posVar)})`;
  }

  private charClassCondition(value: string, posVar: string): string {
    switch (value) {
      case "lowercase": return `islower(input[${posVar}])`;
      case "uppercase": return `isupper(input[${posVar}])`;
      case "digit":     return `isdigit(input[${posVar}])`;
      default:          return `false`;
    }
  }

  // ── Generadores de templates C++ (como el profe) ────────────

  private genTokenH(userNames: string[]): string {
    const userCases = userNames.map((v) => `        ${v},`).join("\n");
    return `#ifndef TOKEN_H
#define TOKEN_H

#include <string>
#include <ostream>

using namespace std;

class Token {
public:
    enum Type {
${userCases}
        ERR,
        END
    };

    Type type;
    string text;

    Token(Type type);
    Token(Type type, char c);
    Token(Type type, const string& source, int first, int last);

    friend ostream& operator<<(ostream& outs, const Token& tok);
    friend ostream& operator<<(ostream& outs, const Token* tok);
};

#endif // TOKEN_H
`;
  }

  private genTokenCpp(userNames: string[]): string {
    const userCases = userNames
      .map((v) => `        case Token::${v}:   outs << "TOKEN(${v}, \\"" << tok.text << "\\")"; break;`)
      .join("\n");

    return `#include <iostream>
#include "token.h"

using namespace std;

Token::Token(Type type)
    : type(type), text("") { }

Token::Token(Type type, char c)
    : type(type), text(string(1, c)) { }

Token::Token(Type type, const string& source, int first, int last)
    : type(type), text(source.substr(first, last)) { }

ostream& operator<<(ostream& outs, const Token& tok) {
    switch (tok.type) {
${userCases}
        case Token::END:    outs << "TOKEN(END)"; break;
        default:            outs << "TOKEN(ERR, \\"" << tok.text << "\\")"; break;
    }
    return outs;
}

ostream& operator<<(ostream& outs, const Token* tok) {
    if (!tok) return outs << "TOKEN(NULL)";
    return outs << *tok;
}
`;
  }

  private genScannerH(): string {
    return `#ifndef SCANNER_H
#define SCANNER_H

#include <string>
#include "token.h"
using namespace std;

class Scanner {
private:
    string input;
    int first;
    int current;

public:
    Scanner(const char* in_s);
    Token* nextToken();
    ~Scanner();
};

void ejecutar_scanner(Scanner* scanner, const string& InputFile);

#endif // SCANNER_H
`;
  }

  private genScannerCpp(tokenDefs: TokenDef[]): string {
    const matchFns = tokenDefs.map((t) => this.genMatchFunction(t)).join("\n");

    const ifChain = tokenDefs
      .map((t, i) => {
        const keyword = i === 0 ? "if" : "else if";
        return `    ${keyword} (match_${t.name}(input, current)) {
        token = new Token(Token::${t.name}, input, first, current - first);
    }`;
      })
      .join("\n");

    return `#include <iostream>
#include <cstring>
#include <fstream>
#include "token.h"
#include "scanner.h"

using namespace std;

Scanner::Scanner(const char* s): input(s), first(0), current(0) { }

bool is_white_space(char c) {
    return c == ' ' || c == '\\n' || c == '\\r' || c == '\\t';
}

${matchFns}

Token* Scanner::nextToken() {
    Token* token;

    while (current < (int)input.length() && is_white_space(input[current]))
        current++;

    if (current >= (int)input.length())
        return new Token(Token::END);

    first = current;

${ifChain}
    else {
        token = new Token(Token::ERR, input, first, 1);
        current++;
    }

    return token;
}

Scanner::~Scanner() { }

void ejecutar_scanner(Scanner* scanner, const string& InputFile) {
    Token* tok;

    string OutputFileName = InputFile;
    size_t pos = OutputFileName.find_last_of(".");
    if (pos != string::npos) {
        OutputFileName = OutputFileName.substr(0, pos);
    }
    OutputFileName += "_tokens.txt";

    ofstream outFile(OutputFileName);
    if (!outFile.is_open()) {
        cerr << "Error: no se pudo abrir el archivo " << OutputFileName << endl;
        return;
    }

    outFile << "Scanner" << endl << endl;

    while (true) {
        tok = scanner->nextToken();

        if (tok->type == Token::END) {
            outFile << *tok << endl;
            delete tok;
            outFile << endl << "Scanner exitoso" << endl << endl;
            outFile.close();
            return;
        }

        outFile << *tok << endl;
        delete tok;
    }
}
`;
  }

  private genMatchFunction(def: TokenDef): string {
    const saved = this.posVar;
    this.posVar = "pos";
    const body = def.pattern.accept(this);
    this.posVar = saved;
    return `bool match_${def.name}(const string& input, int& pos) {
    int p = pos;
${body}
}`;
  }

  private genTestMain(): string {
    return `#include <iostream>
#include <fstream>
#include <string>
#include "scanner.h"

using namespace std;

int main(int argc, const char* argv[]) {
    if (argc != 2) {
        cout << "Uso: " << argv[0] << " <archivo_de_entrada>" << endl;
        return 1;
    }

    ifstream infile(argv[1]);
    if (!infile.is_open()) {
        cout << "No se pudo abrir el archivo: " << argv[1] << endl;
        return 1;
    }

    string input, line;
    while (getline(infile, line)) {
        input += line + '\\n';
    }
    infile.close();

    Scanner scanner(input.c_str());
    Token* tok;

    while (true) {
        tok = scanner.nextToken();
        if (tok->type == Token::END) {
            delete tok;
            break;
        }
        cout << *tok << endl;
        delete tok;
    }

    return 0;
}
`;
  }
}

// ── Utilidad ───────────────────────────────────────────────────

function escapeChar(c: string): string {
  if (c === "'") return "\\'";
  if (c === "\\") return "\\\\";
  if (c === "\0") return "\\0";
  return c;
}

// ── Tipos y funciones de conveniencia ──────────────────────────

export interface GeneratedFile {
  name: string;
  code: string;
}

export function generateCppFiles(tokenDefs: TokenDef[]): GeneratedFile[] {
  const visitor = new CppGeneratorVisitor();
  return visitor.generateFiles(tokenDefs);
}
