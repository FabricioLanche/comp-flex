import { Token, TokenType } from "./token.js";

function isWhitespace(c: string): boolean {
  return c === " " || c === "\n" || c === "\r" || c === "\t";
}

function isAlpha(c: string): boolean {
  return (c >= "a" && c <= "z") || (c >= "A" && c <= "Z");
}

function isAlphaNumeric(c: string): boolean {
  return isAlpha(c) || (c >= "0" && c <= "9");
}

export class Scanner {
  private input: string;
  private first: number;
  private current: number;

  constructor(input: string) {
    this.input = input;
    this.first = 0;
    this.current = 0;
  }

  private peek(offset: number = 0): string {
    const pos = this.current + offset;
    return pos < this.input.length ? this.input[pos] : "\0";
  }

  private matchAtomic(literal: string): boolean {
    for (let i = 0; i < literal.length; i++) {
      if (this.peek(i) !== literal[i]) return false;
    }
    this.current += literal.length;
    return true;
  }

  nextToken(): Token {
    while (this.current < this.input.length && isWhitespace(this.peek())) {
      this.current++;
    }

    if (this.current >= this.input.length) {
      return new Token(TokenType.END);
    }

    this.first = this.current;
    const c = this.peek();

    // Atomic literals: [a-z], [A-Z], [0-9]
    if (c === "[") {
      if (this.matchAtomic("[a-z]")) return new Token(TokenType.LOWERCASE, "[a-z]");
      if (this.matchAtomic("[A-Z]")) return new Token(TokenType.UPPERCASE, "[A-Z]");
      if (this.matchAtomic("[0-9]")) return new Token(TokenType.DIGIT, "[0-9]");
      this.current++;
      return new Token(TokenType.ERR, c);
    }

    // Keywords and identifiers
    if (isAlpha(c)) {
      // Check for "or" keyword even without surrounding spaces
      const remaining = this.input.substring(this.current);
      if (remaining.startsWith("or") && (this.current === 0 || !isAlphaNumeric(this.input[this.current - 1]))) {
        const nextChar = this.peek(2);
        if (nextChar === "\0" || !isAlphaNumeric(nextChar)) {
          this.current += 2;
          return new Token(TokenType.OR, "or");
        }
      }

      this.current++;
      while (this.current < this.input.length && isAlphaNumeric(this.peek())) {
        this.current++;
      }
      const text = this.input.substring(this.first, this.current);

      if (text === "or")  return new Token(TokenType.OR, text);

      return new Token(TokenType.CONCAT, text);
    }

    // Single characters
    this.current++;
    switch (c) {
      case "(": return new Token(TokenType.LPAREN, c);
      case ")": return new Token(TokenType.RPAREN, c);
      case "*": return new Token(TokenType.STAR, c);
      case "+": return new Token(TokenType.PLUS, c);
      case "?": return new Token(TokenType.QUESTION, c);
      default:  return new Token(TokenType.OPERATOR, c);
    }
  }
}

export function ejecutarScanner(scanner: Scanner, label: string): string {
  const lines: string[] = ["Scanner", ""];

  while (true) {
    const tok = scanner.nextToken();
    lines.push(tok.toString());

    if (tok.type === TokenType.END) {
      lines.push("");
      lines.push("Scanner exitoso");
      lines.push("");
      break;
    }
  }

  const output = lines.join("\n");
  console.log(`--- ${label} ---`);
  console.log(output);
  return output;
}
