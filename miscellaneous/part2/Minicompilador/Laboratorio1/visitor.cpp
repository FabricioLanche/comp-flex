#include <iostream>
#include "ast.h"
#include "visitor.h"
#include <unordered_map>
using namespace std;

///////////////////////////////////////////////////////////////////////////////////

int BinaryExp::accept(Visitor* visitor) {
    return visitor->visit(this);
}

int NumberExp::accept(Visitor* visitor) {
    return visitor->visit(this);
}



///////////////////////////////////////////////////////////////////////////////////

GencodeVisitor::GencodeVisitor(ostream& output) : out(output) {}

int GencodeVisitor::visit(BinaryExp* exp) {
    exp->left->accept(this);
    out << "pushq %rax" << endl;
    exp->right->accept(this);
    switch(exp->op) {
        case PLUS_OP: {
            out << "movq %rax, %rcx" << endl;
            out << "popq %rax"<< endl;
            out << "addq %rcx ,%rax" << endl;
            break;
        }
        case MUL_OP: {
            out << "movq %rax, %rcx" << endl;
            out << "popq %rax"<< endl;
            out << "imulq %rcx ,%rax" << endl;
            break;
        }
        default:
            out << "# Operador desconocido" << endl;
    }
    return 0;
}

int GencodeVisitor::visit(NumberExp* exp) {
    out << "movq $" << exp->value << ", %rax" << endl; 
    return 0;
}


void GencodeVisitor::gencode(Program* program){
    out << ".data" << endl;
    out << "print_fmt:.string \"%ld\\n\" " << endl;
    out << ".text"<< endl;
    out << ".globl main"<<endl;
    out << "main:"<<endl;
    out << "pushq %rbp" << endl;
    out << "movq %rsp, %rbp" << endl;
    program->program->accept(this);
    out << "movq %rax, %rsi\n";
    out << "leaq print_fmt(%rip), %rdi\n";
    out << "movq $0, %rax\n";
    out << "call printf@PLT\n";
    out << "movq $0, %rax" << endl;
    out << "leave" << endl;
    out << "ret" << endl;
    out << ".section .note.GNU-stack,\"\",@progbits" << endl;

};

ostream& operator<<(ostream& out, Program& program) {
    GencodeVisitor generator(out);
    generator.gencode(&program);
    return out;
}

ostream& operator<<(ostream& out, Program* program) {
    if (program != nullptr) {
        out << *program;
    }
    return out;
}
