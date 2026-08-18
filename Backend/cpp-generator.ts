import { TokenDef, GeneratedScanner } from "./types";

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
            tokenH: this.generateTokenH()
        };
    }

    private generateTokenH(): string {
        const tokenEnums = this.tokens.map(t => `        ${t.name},`).join('\n');
        
        return `#ifndef TOKEN_H
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
    : type(type, text(string(1, c))) { }

Token::Token(Type type, const string& source, int first, int last) 
    : type(type, text(source.substr(first, last))) { }

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

    private generatePatternCheck(pattern: string, tokenName: string): string {
        // Convertir patrón a código C++
        // Soporta: [a-z], [A-Z], [0-9], +, *, ?
        
        if (pattern === '[a-z]' || pattern === '[A-Z]' || pattern === '[0-9]') {
            return this.generateSimpleAtomCheck(pattern, tokenName);
        }
        
        if (pattern.endsWith('+')) {
            const atom = pattern.slice(0, -1);
            return this.generatePlusCheck(atom, tokenName);
        }
        
        if (pattern.endsWith('*')) {
            const atom = pattern.slice(0, -1);
            return this.generateStarCheck(atom, tokenName);
        }
        
        if (pattern.endsWith('?')) {
            const atom = pattern.slice(0, -1);
            return this.generateQuestionCheck(atom, tokenName);
        }
        
        // Patrón de un solo carácter
        if (pattern.length === 1) {
            return this.generateSingleCharCheck(pattern, tokenName);
        }
        
        throw new Error(`Patrón no soportado: ${pattern}`);
    }

    private generateSimpleAtomCheck(atom: string, tokenName: string): string {
        const condition = this.getAtomCondition(atom);
        return `if (${condition}) {
        current++;
        return new Token(Token::${tokenName}, input, first, current - first);
    }`;
    }

    private generatePlusCheck(atom: string, tokenName: string): string {
        const condition = this.getAtomCondition(atom);
        return `if (${condition}) {
        current++;
        while (current < input.length() && ${condition.replace('input[current]', 'input[current]')}) {
            current++;
        }
        return new Token(Token::${tokenName}, input, first, current - first);
    }`;
    }

    private generateStarCheck(atom: string, tokenName: string): string {
        const condition = this.getAtomCondition(atom);
        return `if (${condition}) {
        current++;
        while (current < input.length() && ${condition.replace('input[current]', 'input[current]')}) {
            current++;
        }
        return new Token(Token::${tokenName}, input, first, current - first);
    }
    // Caso vacío (cero ocurrencias)
    return new Token(Token::${tokenName}, "", 0, 0);`;
    }

    private generateQuestionCheck(atom: string, tokenName: string): string {
        const condition = this.getAtomCondition(atom);
        return `if (${condition}) {
        current++;
    }
    return new Token(Token::${tokenName}, input, first, current - first);`;
    }

    private generateSingleCharCheck(char: string, tokenName: string): string {
        return `if (input[current] == '${char}') {
        current++;
        return new Token(Token::${tokenName}, input[current - 1]);
    }`;
    }

    private getAtomCondition(atom: string): string {
        switch (atom) {
            case '[a-z]':
                return "input[current] >= 'a' && input[current] <= 'z'";
            case '[A-Z]':
                return "input[current] >= 'A' && input[current] <= 'Z'";
            case '[0-9]':
                return "isdigit(input[current])";
            default:
                throw new Error(`Átomo no soportado: ${atom}`);
        }
    }
}
