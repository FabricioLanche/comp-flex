// Token types for pattern lexer
export enum PatternTokenType {
    ATOM_LOWER = "ATOM_LOWER",   // [a-z]
    ATOM UPPER = "ATOM_UPPER",   // [A-Z]
    ATOM DIGIT = "ATOM_DIGIT",   // [0-9]
    PLUS = "PLUS",               // +
    STAR = "STAR",               // *
    QUESTION = "QUESTION",       // ?
    OR = "OR",                   // or
    EOF = "EOF"
}

export interface PatternToken {
    type: PatternTokenType;
    value: string;
    position: number;
}

// AST Node types
export enum ASTNodeType {
    ATOM = "ATOM",
    CONCAT = "CONCAT",
    OR = "OR",
    PLUS = "PLUS",
    STAR = "STAR",
    QUESTION = "QUESTION"
}

export interface AtomNode {
    type: ASTNodeType.ATOM;
    value: string; // "[a-z]", "[A-Z]", or "[0-9]"
}

export interface ConcatNode {
    type: ASTNodeType.CONCAT;
    left: ASTNode;
    right: ASTNode;
}

export interface OrNode {
    type: ASTNodeType.OR;
    left: ASTNode;
    right: ASTNode;
}

export interface PlusNode {
    type: ASTNodeType.PLUS;
    child: ASTNode;
}

export interface StarNode {
    type: ASTNodeType.STAR;
    child: ASTNode;
}

export interface QuestionNode {
    type: ASTNodeType.QUESTION;
    child: ASTNode;
}

export type ASTNode = AtomNode | ConcatNode | OrNode | PlusNode | StarNode | QuestionNode;

// DFA types
export interface DFAState {
    id: number;
    isFinal: boolean;
    transitions: Map<string, number>; // char -> state id
}

export interface DFA {
    states: DFAState[];
    startState: number;
    finalStates: number[];
}

// Token definition (metadata)
export interface TokenDef {
    name: string;      // e.g., "NUM", "IDENT"
    pattern: string;   // e.g., "[0-9]+"
}

// Generated scanner output
export interface GeneratedScanner {
    scannerCpp: string;
    scannerH: string;
    tokenCpp: string;
    tokenH: string;
}
