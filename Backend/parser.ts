import { Scanner } from "./scanner.js";
import { Token, TokenType } from "./token.js";
import {
  Pattern,
  Program,
  SequenceExp,
  OperatorExp,
  CharClass,
  GroupExp,
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
      throw new Error(`Error lexico: carácter no válido '${this.current.text}'`);
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
        throw new Error(`Error lexico: carácter no válido '${this.current.text}'`);
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
    return (
      this.current.type === TokenType.OPERATOR ||
      this.current.type === TokenType.PLUS ||
      this.current.type === TokenType.STAR
    );
  }

  // Entry point
  parseProgram(): Program {
    const pattern = this.parseA();
    if (!this.isAtEnd()) throw new Error(`Error sintactico: token inesperado ${this.current.toString()} después de completar el patrón`);
    return new Program(pattern);
  }

  // A → B ("or" B)* | C
  parseA(): Pattern {
    if (this.startsC()) return this.parseC();
    else {
      let result: Pattern = this.parseB();
      while (this.match(TokenType.OR)) {
        const right = this.parseB();
        result = binaryExp("or", result, right);
      }
      return result;
    }
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

  // D → F+ | F* | F? | F
  parseD(): Pattern {
    const atom = this.parseF();

    if (this.match(TokenType.STAR))     return quantifiedExp(atom, "star");
    if (this.match(TokenType.PLUS))     return quantifiedExp(atom, "plus");
    if (this.match(TokenType.QUESTION)) return quantifiedExp(atom, "optional");

    return atom;
  }

  // E → + | - | * | / | ^
  parseE(): OperatorExp {
    if (this.match(TokenType.OPERATOR)) return operatorExp(this.previous!.text);
    if (this.match(TokenType.PLUS))     return operatorExp(this.previous!.text);
    if (this.match(TokenType.STAR))     return operatorExp(this.previous!.text);
    throw new Error(`Error sintactico: se esperaba un operador (+, -, *, /, ^) válido pero se encontró ${this.current.toString()}`);
  }

  // F → LOWERCASE | UPPERCASE | DIGIT | "(" A ")"
  parseF(): CharClass | GroupExp {
    if (this.match(TokenType.LOWERCASE)) return charClass("lowercase");
    if (this.match(TokenType.UPPERCASE)) return charClass("uppercase");
    if (this.match(TokenType.DIGIT))     return charClass("digit");
    if (this.match(TokenType.LPAREN)) {
      const inner = this.parseA();
      if (!this.match(TokenType.RPAREN)) throw new Error(`Error sintactico: se esperaba ')' de cierre pero se encontró ${this.current.toString()}`);
      return groupExp(inner);
    }
    throw new Error(`Error sintactico: se esperaba [a-z], [A-Z], [0-9] o '(' pero se encontró ${this.current.toString()}`);
  }
}
