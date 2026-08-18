import {
    PatternToken,
    PatternTokenType,
    ASTNode,
    ASTNodeType,
    AtomNode,
    ConcatNode,
    OrNode,
    PlusNode,
    StarNode,
    QuestionNode
} from "./types";

export class PatternParser {
    private tokens: PatternToken[];
    private position: number;

    constructor(tokens: PatternToken[]) {
        this.tokens = tokens;
        this.position = 0;
    }

    private peek(): PatternToken {
        return this.tokens[this.position];
    }

    private advance(): PatternToken {
        const token = this.tokens[this.position];
        this.position++;
        return token;
    }

    private expect(type: PatternTokenType): PatternToken {
        const token = this.peek();
        if (token.type !== type) {
            throw new Error(
                `Se esperaba ${type} pero se encontró ${token.type} en posición ${token.position}`
            );
        }
        return this.advance();
    }

    // A -> A or B | B (manejado con while)
    parseA(): ASTNode {
        let left = this.parseB();

        while (this.peek().type === PatternTokenType.OR) {
            this.advance(); // consumir 'or'
            const right = this.parseB();
            left = { type: ASTNodeType.OR, left, right } as OrNode;
        }

        return left;
    }

    // B -> BC | C
    parseB(): ASTNode {
        let left = this.parseC();

        while (this.isStartOfC()) {
            const right = this.parseC();
            left = { type: ASTNodeType.CONCAT, left, right } as ConcatNode;
        }

        return left;
    }

    private isStartOfC(): boolean {
        const type = this.peek().type;
        return (
            type === PatternTokenType.ATOM_LOWER ||
            type === PatternTokenType.ATOM_UPPER ||
            type === PatternTokenType.ATOM_DIGIT
        );
    }

    // C -> D+ | D* | D? | D
    parseC(): ASTNode {
        const child = this.parseD();
        const next = this.peek();

        if (next.type === PatternTokenType.PLUS) {
            this.advance();
            return { type: ASTNodeType.PLUS, child } as PlusNode;
        } else if (next.type === PatternTokenType.STAR) {
            this.advance();
            return { type: ASTNodeType.STAR, child } as StarNode;
        } else if (next.type === PatternTokenType.QUESTION) {
            this.advance();
            return { type: ASTNodeType.QUESTION, child } as QuestionNode;
        }

        return child;
    }

    // D -> [a-z] | [A-Z] | [0-9]
    parseD(): AtomNode {
        const token = this.peek();

        if (
            token.type === PatternTokenType.ATOM_LOWER ||
            token.type === PatternTokenType.ATOM_UPPER ||
            token.type === PatternTokenType.ATOM_DIGIT
        ) {
            this.advance();
            return { type: ASTNodeType.ATOM, value: token.value };
        }

        throw new Error(
            `Se esperaba átomo pero se encontró ${token.type} en posición ${token.position}`
        );
    }

    parse(): ASTNode {
        const ast = this.parseA();

        if (this.peek().type !== PatternTokenType.EOF) {
            throw new Error(
                `Token inesperado ${this.peek().type} en posición ${this.peek().position}`
            );
        }

        return ast;
    }
}
