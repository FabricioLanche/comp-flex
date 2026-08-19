#ifndef VISITOR_H
#define VISITOR_H
#include "ast.h"
#include <list>
#include <iostream>

class BinaryExp;
class NumberExp;
class Program;

class Visitor {
public:
    virtual int visit(BinaryExp* exp) = 0;
    virtual int visit(NumberExp* exp) = 0;
};

class GencodeVisitor : public Visitor {
public:
    explicit GencodeVisitor(std::ostream& output = std::cout);
    void gencode(Program* program);
    int visit(BinaryExp* exp) override;
    int visit(NumberExp* exp) override;

private:
    std::ostream& out;
};


#endif // VISITOR_H
