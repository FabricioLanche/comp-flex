import {
    ASTNode,
    ASTNodeType,
    DFA,
    DFAState
} from "./types";

export class ASTtoDFA {
    private states: DFAState[];
    private nextStateId: number;

    constructor() {
        this.states = [];
        this.nextStateId = 0;
    }

    private createState(isFinal: boolean = false): DFAState {
        const state: DFAState = {
            id: this.nextStateId++,
            isFinal,
            transitions: new Map()
        };
        this.states.push(state);
        return state;
    }

    private buildDFA(node: ASTNode): { start: number; final: number } {
        switch (node.type) {
            case ASTNodeType.ATOM:
                return this.buildAtomDFA(node.value);
            
            case ASTNodeType.CONCAT:
                return this.buildConcatDFA(node.left, node.right);
            
            case ASTNodeType.OR:
                return this.buildOrDFA(node.left, node.right);
            
            case ASTNodeType.PLUS:
                return this.buildPlusDFA(node.child);
            
            case ASTNodeType.STAR:
                return this.buildStarDFA(node.child);
            
            case ASTNodeType.QUESTION:
                return this.buildQuestionDFA(node.child);
            
            default:
                throw new Error(`Tipo de nodo AST no soportado: ${node}`);
        }
    }

    private buildAtomDFA(atom: string): { start: number; final: number } {
        const start = this.createState(false);
        const final = this.createState(true);
        start.transitions.set(atom, final.id);
        return { start: start.id, final: final.id };
    }

    private buildConcatDFA(left: ASTNode, right: ASTNode): { start: number; final: number } {
        const leftDFA = this.buildDFA(left);
        const rightDFA = this.buildDFA(right);

        // Conectar el final del izquierdo con el inicio del derecho
        const leftFinalState = this.states.find(s => s.id === leftDFA.final)!;
        leftFinalState.isFinal = false;
        leftFinalState.transitions.set('EPSILON', rightDFA.start);

        return { start: leftDFA.start, final: rightDFA.final };
    }

    private buildOrDFA(left: ASTNode, right: ASTNode): { start: number; final: number } {
        const leftDFA = this.buildDFA(left);
        const rightDFA = this.buildDFA(right);

        const start = this.createState(false);
        const final = this.createState(true);

        // Conectar nuevo inicio con ambos sub-DFAs
        start.transitions.set('EPSILON', leftDFA.start);
        start.transitions.set('EPSILON', rightDFA.start);

        // Conectar finales de ambos sub-DFAs con el nuevo final
        const leftFinalState = this.states.find(s => s.id === leftDFA.final)!;
        const rightFinalState = this.states.find(s => s.id === rightDFA.final)!;
        leftFinalState.isFinal = false;
        rightFinalState.isFinal = false;
        leftFinalState.transitions.set('EPSILON', final.id);
        rightFinalState.transitions.set('EPSILON', final.id);

        return { start: start.id, final: final.id };
    }

    private buildPlusDFA(child: ASTNode): { start: number; final: number } {
        const childDFA = this.buildDFA(child);

        const final = this.createState(true);

        // Conectar final del hijo con el nuevo final
        const childFinalState = this.states.find(s => s.id === childDFA.final)!;
        childFinalState.isFinal = false;
        childFinalState.transitions.set('EPSILON', childDFA.start);
        childFinalState.transitions.set('EPSILON', final.id);

        return { start: childDFA.start, final: final.id };
    }

    private buildStarDFA(child: ASTNode): { start: number; final: number } {
        const childDFA = this.buildDFA(child);

        const start = this.createState(true);
        const final = this.createState(true);

        // Conectar nuevo inicio con el hijo
        start.transitions.set('EPSILON', childDFA.start);

        // Conectar final del hijo con el nuevo final y de vuelta al hijo
        const childFinalState = this.states.find(s => s.id === childDFA.final)!;
        childFinalState.isFinal = false;
        childFinalState.transitions.set('EPSILON', childDFA.start);
        childFinalState.transitions.set('EPSILON', final.id);

        return { start: start.id, final: final.id };
    }

    private buildQuestionDFA(child: ASTNode): { start: number; final: number } {
        const childDFA = this.buildDFA(child);

        const start = this.createState(true);
        const final = this.createState(true);

        // Conectar nuevo inicio con el hijo y con el final
        start.transitions.set('EPSILON', childDFA.start);
        start.transitions.set('EPSILON', final.id);

        // Conectar final del hijo con el nuevo final
        const childFinalState = this.states.find(s => s.id === childDFA.final)!;
        childFinalState.isFinal = false;
        childFinalState.transitions.set('EPSILON', final.id);

        return { start: start.id, final: final.id };
    }

    convert(ast: ASTNode): DFA {
        this.states = [];
        this.nextStateId = 0;

        const { start, final } = this.buildDFA(ast);

        return {
            states: this.states,
            startState: start,
            finalStates: [final]
        };
    }
}
