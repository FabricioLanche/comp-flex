import { Scanner } from "./scanner.js";
import { Token, TokenType } from "./token.js";
import {
  Pattern,
  Program,
  SequenceExp,
  OperatorExp,
  binaryExp,
  sequenceExp,
  quantifiedExp,
  operatorExp,
  charClass,
  groupExp,
} from "./ast.js";

export class Parser {
  private scanner: Scanner;
  private current: Token;
  private previous: Token | null;

  constructor(scanner: Scanner) {
    this.scanner = scanner;
    this.previous = null;
    this.current = scanner.nextToken();
    if (this.current.type === TokenType.ERR) {
      throw new Error("Error lexico");
    }
  }

  private match(ttype: TokenType): boolean {
    if (this.check(ttype)) {
      this.advance();
      return true;
    }
    return false;
  }

  private check(ttype: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.current.type === ttype;
  }

  private advance(): boolean {
    if (!this.isAtEnd()) {
      this.previous = this.current;
      this.current = this.scanner.nextToken();
      if (this.current.type === TokenType.ERR) {
        throw new Error("Error lexico");
      }
      return true;
    }
    return false;
  }

  private isAtEnd(): boolean {
    return this.current.type === TokenType.END;
  }

  private startsB(): boolean {
    return (
      this.current.type === TokenType.LOWERCASE ||
      this.current.type === TokenType.UPPERCASE ||
      this.current.type === TokenType.DIGIT ||
      this.current.type === TokenType.LPAREN
    );
  }

  private startsC(): boolean {
    return this.current.type === TokenType.OPERATOR;
  }

  // Entry point (como parseProgram del profe)
  parseProgram(): Program {
    const pattern = this.parsePattern();
    if (!this.isAtEnd()) {
      throw new Error("Error sintactico: tokens sobrantes");
    }
    return new Program(pattern);
  }

  // A → B ("or" B)* | C
  parsePattern(): Pattern {
    if (this.startsC()) {
      return this.parseC();
    }

    let result: Pattern = this.parseB();

    while (this.check(TokenType.OR)) {
      this.advance();
      const right = this.parseB();
      result = binaryExp("or", result, right);
    }

    return result;
  }

  // B → D+
  parseB(): SequenceExp {
    const elements: Pattern[] = [];
    elements.push(this.parseD());

    while (this.startsB()) {
      elements.push(this.parseD());
    }

    return sequenceExp(elements);
  }

  // C → E+
  parseC(): SequenceExp {
    const elements: Pattern[] = [];
    elements.push(this.parseE());

    while (this.startsC()) {
      elements.push(this.parseE());
    }

    return sequenceExp(elements);
  }

  // D → F ("+" | "*" | "?")?
  parseD(): Pattern {
    const atom = this.parseF();

    if (
      this.current.type === TokenType.PLUS ||
      this.current.type === TokenType.STAR ||
      this.current.type === TokenType.QUESTION
    ) {
      const qt = this.current.type;
      this.advance();

      if (atom.kind === "charclass" || atom.kind === "group") {
        const q =
          qt === TokenType.STAR
            ? "star"
            : qt === TokenType.PLUS
            ? "plus"
            : "optional";
        return quantifiedExp(atom, q);
      }
    }

    return atom;
  }

  // E → OPERATOR
  parseE(): OperatorExp {
    if (!this.match(TokenType.OPERATOR)) {
      throw new Error("Error sintactico: se esperaba OPERATOR");
    }
    return operatorExp(this.previous!.text);
  }

  // F → LOWERCASE | UPPERCASE | DIGIT | "(" A ")"
  parseF(): Pattern {
    if (this.match(TokenType.LOWERCASE)) return charClass("lowercase");
    if (this.match(TokenType.UPPERCASE)) return charClass("uppercase");
    if (this.match(TokenType.DIGIT))     return charClass("digit");

    if (this.match(TokenType.LPAREN)) {
      const inner = this.parsePattern();
      if (!this.match(TokenType.RPAREN)) {
        throw new Error("Error sintactico: se esperaba ')'");
      }
      return groupExp(inner);
    }

    throw new Error("Error sintactico");
  }
}
