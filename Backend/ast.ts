import type { Visitor } from "./visitor.js";

export type BinaryOp = "or";

// ── AST Node interfaces (como Exp del profe) ──────────────────

export interface BinaryExp {
  kind: "binary";
  op: BinaryOp;
  left: Pattern;
  right: Pattern;
  accept(visitor: Visitor): string;
}

export interface SequenceExp {
  kind: "sequence";
  elements: Pattern[];
  accept(visitor: Visitor): string;
}

export interface QuantifiedExp {
  kind: "quantified";
  atom: CharClass | GroupExp;
  quantifier: "star" | "plus" | "optional";
  accept(visitor: Visitor): string;
}

export interface OperatorExp {
  kind: "operator";
  op: string;
  accept(visitor: Visitor): string;
}

export interface CharClass {
  kind: "charclass";
  value: "lowercase" | "uppercase" | "digit";
  accept(visitor: Visitor): string;
}

export interface GroupExp {
  kind: "group";
  inner: Pattern;
  accept(visitor: Visitor): string;
}

export type Pattern =
  | BinaryExp
  | SequenceExp
  | QuantifiedExp
  | OperatorExp
  | CharClass
  | GroupExp;

// ── Program wrapper (como Program del profe) ───────────────────

export class Program {
  pattern: Pattern;

  constructor(pattern: Pattern) {
    this.pattern = pattern;
  }

  accept(visitor: Visitor): string {
    return visitor.visitProgram(this);
  }
}

// ── Token definition ───────────────────────────────────────────

export interface TokenDef {
  name: string;
  pattern: Pattern;
}

// ── Factory functions ──────────────────────────────────────────

export function binaryExp(op: BinaryOp, left: Pattern, right: Pattern): BinaryExp {
  return {
    kind: "binary", op, left, right,
    accept(visitor: Visitor) { return visitor.visitBinaryExp(this); },
  };
}

export function sequenceExp(elements: Pattern[]): SequenceExp {
  return {
    kind: "sequence", elements,
    accept(visitor: Visitor) { return visitor.visitSequenceExp(this); },
  };
}

export function quantifiedExp(
  atom: CharClass | GroupExp,
  quantifier: "star" | "plus" | "optional"
): QuantifiedExp {
  return {
    kind: "quantified", atom, quantifier,
    accept(visitor: Visitor) { return visitor.visitQuantifiedExp(this); },
  };
}

export function operatorExp(op: string): OperatorExp {
  return {
    kind: "operator", op,
    accept(visitor: Visitor) { return visitor.visitOperatorExp(this); },
  };
}

export function charClass(value: "lowercase" | "uppercase" | "digit"): CharClass {
  return {
    kind: "charclass", value,
    accept(visitor: Visitor) { return visitor.visitCharClass(this); },
  };
}

export function groupExp(inner: Pattern): GroupExp {
  return {
    kind: "group", inner,
    accept(visitor: Visitor) { return visitor.visitGroupExp(this); },
  };
}
