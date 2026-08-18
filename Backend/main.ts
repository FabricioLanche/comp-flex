import { TokenDef, GeneratedScanner } from "./types";
import { PatternLexer } from "./pattern-lexer";
import { PatternParser } from "./pattern-parser";
import { ASTtoDFA } from "./ast-to-dfa";
import { CppGenerator } from "./cpp-generator";
import * as fs from 'fs';
import * as path from 'path';

export class ScannerGenerator {
    private tokens: TokenDef[];
    private outputDir: string;

    constructor(tokens: TokenDef[], outputDir: string = './output') {
        this.tokens = tokens;
        this.outputDir = outputDir;
    }

    generate(): GeneratedScanner {
        // Validar patrones
        for (const token of this.tokens) {
            this.validatePattern(token.pattern);
        }

        // Generar código C++
        const generator = new CppGenerator(this.tokens);
        return generator.generate();
    }

    private validatePattern(pattern: string): void {
        const lexer = new PatternLexer(pattern);
        const tokens = lexer.tokenize();
        const parser = new PatternParser(tokens);
        parser.parse();
    }

    writeFiles(): void {
        const scanner = this.generate();

        // Crear directorio de salida si no existe
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }

        // Escribir archivos
        fs.writeFileSync(path.join(this.outputDir, 'scanner.cpp'), scanner.scannerCpp);
        fs.writeFileSync(path.join(this.outputDir, 'scanner.h'), scanner.scannerH);
        fs.writeFileSync(path.join(this.outputDir, 'token.cpp'), scanner.tokenCpp);
        fs.writeFileSync(path.join(this.outputDir, 'token.h'), scanner.tokenH);

        console.log(`Archivos generados en ${this.outputDir}:`);
        console.log('  - scanner.cpp');
        console.log('  - scanner.h');
        console.log('  - token.cpp');
        console.log('  - token.h');
    }
}

// Ejemplo de uso
if (require.main === module) {
    const tokens: TokenDef[] = [
        { name: 'NUM', pattern: '[0-9]+' },
        { name: 'IDENT', pattern: '[a-z][a-z0-9]*' },
        { name: 'PLUS', pattern: '+' },
        { name: 'MINUS', pattern: '-' },
        { name: 'MUL', pattern: '*' },
        { name: 'DIV', pattern: '/' }
    ];

    const generator = new ScannerGenerator(tokens, './output');
    generator.writeFiles();
}
