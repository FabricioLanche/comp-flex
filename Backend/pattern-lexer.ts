import { PatternToken, PatternTokenType } from "./types";

export class PatternLexer {
    private input: string;
    private position: number;

    constructor(input: string) {
        this.input = input;
        this.position = 0;
    }

    private peek(): string {
        if (this.position >= this.input.length) {
            return '\0';
        }
        return this.input[this.position];
    }

    private advance(): string {
        const c = this.input[this.position];
        this.position++;
        return c;
    }

    private skipWhitespace(): void {
        while (this.position < this.input.length && /\s/.test(this.input[this.position])) {
            this.position++;
        }
    }

    tokenize(): PatternToken[] {
        const tokens: PatternToken[] = [];

        while (this.position < this.input.length) {
            this.skipWhitespace();

            if (this.position >= this.input.length) break;

            const startPos = this.position;
            const c = this.peek();

            if (c === '[') {
                const atom = this.readAtom();
                tokens.push({
                    type: this.getAtomType(atom),
                    value: atom,
                    position: startPos
                });
            } else if (c === '+') {
                this.advance();
                tokens.push({
                    type: PatternTokenType.PLUS,
                    value: '+',
                    position: startPos
                });
            } else if (c === '*') {
                this.advance();
                tokens.push({
                    type: PatternTokenType.STAR,
                    value: '*',
                    position: startPos
                });
            } else if (c === '?') {
                this.advance();
                tokens.push({
                    type: PatternTokenType.QUESTION,
                    value: '?',
                    position: startPos
                });
            } else if (c === 'o' && this.input.substr(this.position, 2) === 'or') {
                this.advance();
                this.advance();
                tokens.push({
                    type: PatternTokenType.OR,
                    value: 'or',
                    position: startPos
                });
            } else {
                throw new Error(`Carácter inesperado '${c}' en posición ${startPos}`);
            }
        }

        tokens.push({
            type: PatternTokenType.EOF,
            value: '',
            position: this.position
        });

        return tokens;
    }

    private readAtom(): string {
        let atom = '';
        
        if (this.peek() !== '[') {
            throw new Error(`Se esperaba '[' en posición ${this.position}`);
        }
        
        atom += this.advance(); // [
        
        if (this.peek() === '^') {
            atom += this.advance(); // ^
        }
        
        while (this.position < this.input.length && this.peek() !== ']') {
            atom += this.advance();
        }
        
        if (this.peek() !== ']') {
            throw new Error(`Se esperaba ']' en posición ${this.position}`);
        }
        
        atom += this.advance(); // ]
        
        return atom;
    }

    private getAtomType(atom: string): PatternTokenType {
        if (atom === '[a-z]') return PatternTokenType.ATOM_LOWER;
        if (atom === '[A-Z]') return PatternTokenType.ATOM_UPPER;
        if (atom === '[0-9]') return PatternTokenType.ATOM_DIGIT;
        throw new Error(`Átomo no soportado: ${atom}`);
    }
}
