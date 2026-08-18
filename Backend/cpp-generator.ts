import { TokenDef, GeneratedScanner, ASTNode, ASTNodeType } from "./types";
import { PatternLexer } from "./pattern-lexer";
import { PatternParser } from "./pattern-parser";

export class CppGenerator {
    private tokens: TokenDef[];

    constructor(tokens: TokenDef[]) {
        this.tokens = tokens;
    }

    generate(): GeneratedScanner {
        return {
            scannerCpp: this.generateScannerCpp(),
            scannerH: this.generateScannerH(),
            tokenCpp: this.generateTokenCpp(),
            tokenH: this.generateTokenH(),
            mainCpp: this.generateMainCpp()
        };
    }


    private generateMainCpp(): string {
        return `#include <iostream>
#include <fstream>
#include <string>
#include "scanner.h"

using namespace std;

int main(int argc, char* argv[]) {
    if (argc < 2) {
        cout << "Uso: ./scanner <archivo_entrada>" << endl;
        return 1;
    }

    ifstream inFile(argv[1]);
    if (!inFile.is_open()) {
        cout << "Error: no se pudo abrir " << argv[1] << endl;
        return 1;
    }

    string input;
    getline(inFile, input);
    inFile.close();

    Scanner scanner(input.c_str());
    Token* tok;

    string outName = string(argv[1]) + "_tokens.txt";
    ofstream outFile(outName);

    outFile << "Entrada: " << input << endl << endl;

    while (true) {
        tok = scanner.nextToken();

        outFile << *tok << endl;
        cout << *tok << endl;

        if (tok->type == Token::END) {
            delete tok;
            outFile << "\\nScanner exitoso" << endl;
            break;
        }
        if (tok->type == Token::ERR) {
            delete tok;
            outFile << "Caracter invalido" << endl;
            outFile << "Scanner no exitoso" << endl;
            break;
        }
        delete tok;
    }

    outFile.close();
    return 0;
}
`;
    }

    private generateTokenH(): string {
        const tokenEnums = this.tokens.map(t => `        ${t.name},`).join('\n');
        
        return `
#ifndef TOKEN_H
#define TOKEN_H

#include <string>
#include <ostream>

using namespace std;

class Token {
public:
    // Tipos de token
    enum Type {
${tokenEnums}
        ERR,     // Error
        END      // Fin de entrada
    };

    // Atributos
    Type type;
    string text;

    // Constructores
    Token(Type type);
    Token(Type type, char c);
    Token(Type type, const string& source, int first, int last);

    // Sobrecarga de operadores de salida
    friend ostream& operator<<(ostream& outs, const Token& tok);
    friend ostream& operator<<(ostream& outs, const Token* tok);
};

#endif // TOKEN_H
`;
    }

    private generateTokenCpp(): string {
        const tokenCases = this.tokens.map(t => 
            `        case Token::${t.name}:   outs << "TOKEN(${t.name}, \\""  << tok.text << "\\")"; break;`
        ).join('\n');

        return `#include <iostream>
#include "token.h"

using namespace std;

// -----------------------------
// Constructores
// -----------------------------

Token::Token(Type type) 
    : type(type), text("") { }

Token::Token(Type type, char c) 
    : type(type), text(string(1, c)) { }

Token::Token(Type type, const string& source, int first, int last) 
    : type(type), text(source.substr(first, last)) { }

// -----------------------------
// Sobrecarga de operador <<
// -----------------------------

// Para Token por referencia
ostream& operator<<(ostream& outs, const Token& tok) {
    switch (tok.type) {
${tokenCases}
        case Token::ERR:    outs << "TOKEN(ERR, \\""    << tok.text << "\\")"; break;
        case Token::END:    outs << "TOKEN(END)"; break;
    }
    return outs;
}

// Para Token puntero
ostream& operator<<(ostream& outs, const Token* tok) {
    if (!tok) return outs << "TOKEN(NULL)";
    return outs << *tok;  // delega al otro
}
`;
    }

    private generateScannerH(): string {
        return `#ifndef SCANNER_H
#define SCANNER_H

#include <string>
#include "token.h"
using namespace std;

class Scanner {
private:
    string input;
    int first;
    int current;

public:
    // Constructor
    Scanner(const char* in_s);

    // Retorna el siguiente token
    Token* nextToken();

    // Destructor
    ~Scanner();
};

// Ejecutar scanner
void ejecutar_scanner(Scanner* scanner, const string& InputFile);

#endif // SCANNER_H
`;
    }

    private generateScannerCpp(): string {
        const tokenChecks = this.tokens.map(t => 
            `    // ${t.name}
    ${this.generatePatternCheck(t.pattern, t.name)}`
        ).join('\n\n');

        return `#include <iostream>
#include <cstring>
#include <fstream>
#include "token.h"
#include "scanner.h"

using namespace std;

// -----------------------------
// Constructor
// -----------------------------
Scanner::Scanner(const char* s): input(s), first(0), current(0) { 
}

// -----------------------------
// Función auxiliar
// -----------------------------

bool is_white_space(char c) {
    return c == ' ' || c == '\\n' || c == '\\r' || c == '\\t';
}

// -----------------------------
// nextToken: obtiene el siguiente token
// -----------------------------

Token* Scanner::nextToken() {
    Token* token;

    // Saltar espacios en blanco
    while (current < input.length() && is_white_space(input[current])) 
        current++;

    // Fin de la entrada
    if (current >= input.length()) 
        return new Token(Token::END);

    first = current;

${tokenChecks}

    // Carácter inválido
    token = new Token(Token::ERR, input[current]);
    current++;
    return token;
}

// -----------------------------
// Destructor
// -----------------------------

Scanner::~Scanner() { }

// -----------------------------
// Función de prueba
// -----------------------------

void ejecutar_scanner(Scanner* scanner, const string& InputFile) {
    Token* tok;

    // Crear nombre para archivo de salida
    string OutputFileName = InputFile;
    size_t pos = OutputFileName.find_last_of(".");
    if (pos != string::npos) {
        OutputFileName = OutputFileName.substr(0, pos);
    }
    OutputFileName += "_tokens.txt";

    ofstream outFile(OutputFileName);
    if (!outFile.is_open()) {
        cerr << "Error: no se pudo abrir el archivo " << OutputFileName << endl;
        return;
    }

    outFile << "Iniciando Scanner para archivo: " << InputFile << endl << endl;

    while (true) {
        tok = scanner->nextToken();

        if (tok->type == Token::END) {
            outFile << *tok << endl;
            delete tok;
            outFile << "\\nScanner exitoso" << endl << endl;
            outFile.close();
            return;
        }

        if (tok->type == Token::ERR) {
            outFile << *tok << endl;
            delete tok;
            outFile << "Caracter invalido" << endl << endl;
            outFile << "Scanner no exitoso" << endl << endl;
            outFile.close();
            return;
        }

        outFile << *tok << endl;
        delete tok;
    }
}
`;
    }

    // ===================== AST → C++ =====================

    private generateCondition(node: ASTNode): string {
        switch (node.type) {
            case ASTNodeType.ATOM:
                return this.atomCondition(node.value);
            case ASTNodeType.CONCAT:
                return `${this.generateCondition(node.left)} && ${this.generateCondition(node.right)}`;
            case ASTNodeType.OR:
                return `(${this.generateCondition(node.left)} || ${this.generateCondition(node.right)})`;
            case ASTNodeType.PLUS:
            case ASTNodeType.STAR:
            case ASTNodeType.QUESTION:
                return this.generateCondition(node.child);
            default:
                throw new Error(`Tipo de nodo no soportado: ${node}`);
        }
    }

    private generateNode(node: ASTNode, tokenName: string, indent: string = "    "): string {
        const I = indent;
        const J = indent + "    ";

        switch (node.type) {
            case ASTNodeType.ATOM: {
                const cond = this.atomCondition(node.value);
                return `if (${cond}) {\n${J}current++;\n${J}return new Token(Token::${tokenName}, input, first, current - first);\n${I}}`;
            }

            case ASTNodeType.OR: {
                const leftCode = this.generateNode(node.left, tokenName, indent);
                const rightCode = this.generateNode(node.right, tokenName, indent);
                return `${leftCode}\n${I}${rightCode}`;
            }

            case ASTNodeType.PLUS: {
                const cond = this.generateCondition(node.child);
                return `if (${cond}) {\n${J}current++;\n${J}while (current < input.length() && ${cond}) {\n${J}    current++;\n${J}}\n${J}return new Token(Token::${tokenName}, input, first, current - first);\n${I}}`;
            }

            case ASTNodeType.STAR: {
                const cond = this.generateCondition(node.child);
                return `if (${cond}) {\n${J}current++;\n${J}while (current < input.length() && ${cond}) {\n${J}    current++;\n${J}}\n${J}return new Token(Token::${tokenName}, input, first, current - first);\n${I}}\n${I}return new Token(Token::${tokenName}, "", 0, 0);`;
            }

            case ASTNodeType.QUESTION: {
                const cond = this.generateCondition(node.child);
                return `if (${cond}) {\n${J}current++;\n${I}}\n${I}return new Token(Token::${tokenName}, input, first, current - first);`;
            }

            case ASTNodeType.CONCAT: {
                const leftCond = this.generateCondition(node.left);

                const rightIsQuantifier =
                    node.right.type === ASTNodeType.PLUS ||
                    node.right.type === ASTNodeType.STAR ||
                    node.right.type === ASTNodeType.QUESTION;

                if (rightIsQuantifier) {
                    const rightBody = this.generateNodeNoReturn(node.right, tokenName, J);
                    return `if (${leftCond}) {\n${J}current++;\n${J}${rightBody}\n${I}}`;
                }

                const rightCode = this.generateNode(node.right, tokenName, J);
                return `if (${leftCond}) {\n${J}current++;\n${J}${rightCode}\n${I}}`;
            }

            default:
                throw new Error(`Tipo de nodo no soportado: ${node}`);
        }
    }

    private generateNodeNoReturn(node: ASTNode, tokenName: string, indent: string = "    "): string {
        const I = indent;
        const J = indent + "    ";

        switch (node.type) {
            case ASTNodeType.PLUS: {
                const cond = this.generateCondition(node.child);
                return `while (current < input.length() && ${cond}) {\n${J}current++;\n${I}}\n${I}return new Token(Token::${tokenName}, input, first, current - first);`;
            }

            case ASTNodeType.STAR: {
                const cond = this.generateCondition(node.child);
                return `while (current < input.length() && ${cond}) {\n${J}current++;\n${I}}\n${I}return new Token(Token::${tokenName}, input, first, current - first);`;
            }

            case ASTNodeType.QUESTION: {
                const cond = this.generateCondition(node.child);
                return `if (${cond}) {\n${J}current++;\n${I}}\n${I}return new Token(Token::${tokenName}, input, first, current - first);`;
            }

            default:
                return this.generateNode(node, tokenName, indent);
        }
    }

    private atomCondition(atom: string): string {
        switch (atom) {
            case "[a-z]":
                return "input[current] >= 'a' && input[current] <= 'z'";
            case "[A-Z]":
                return "input[current] >= 'A' && input[current] <= 'Z'";
            case "[0-9]":
                return "isdigit(input[current])";
            default:
                throw new Error(`Átomo no soportado: ${atom}`);
        }
    }

    private generatePatternCheck(pattern: string, tokenName: string): string {
        const lexer = new PatternLexer(pattern);
        const tokens = lexer.tokenize();
        const parser = new PatternParser(tokens);
        const ast = parser.parse();
        return this.generateNode(ast, tokenName);
    }
}
