export enum TokenType {
  OR,
  CONCAT,
  LPAREN,
  RPAREN,
  LOWERCASE,
  UPPERCASE,
  DIGIT,
  OPERATOR,
  STAR,
  PLUS,
  QUESTION,
  ERR,
  END,
}

export class Token {
  type: TokenType;
  text: string;

  constructor(type: TokenType, text: string = "") {
    this.type = type;
    this.text = text;
  }

  toString(): string {
    switch (this.type) {
      case TokenType.OR:         return `TOKEN(OR, "${this.text}")`;
      case TokenType.CONCAT:     return `TOKEN(CONCAT, "${this.text}")`;
      case TokenType.LPAREN:     return `TOKEN(LPAREN, "${this.text}")`;
      case TokenType.RPAREN:     return `TOKEN(RPAREN, "${this.text}")`;
      case TokenType.LOWERCASE:  return `TOKEN(LOWERCASE, "${this.text}")`;
      case TokenType.UPPERCASE:  return `TOKEN(UPPERCASE, "${this.text}")`;
      case TokenType.DIGIT:      return `TOKEN(DIGIT, "${this.text}")`;
      case TokenType.OPERATOR:   return `TOKEN(OPERATOR, "${this.text}")`;
      case TokenType.STAR:       return `TOKEN(STAR, "${this.text}")`;
      case TokenType.PLUS:       return `TOKEN(PLUS, "${this.text}")`;
      case TokenType.QUESTION:   return `TOKEN(QUESTION, "${this.text}")`;
      case TokenType.END:        return `TOKEN(END)`;
      case TokenType.ERR:        return `TOKEN(ERR, "${this.text}")`;
    }
  }
}
