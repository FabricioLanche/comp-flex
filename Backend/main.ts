import { TokenDef, GeneratedScanner } from "./types";
import { PatternLexer } from "./pattern-lexer";
import { PatternParser } from "./pattern-parser";
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
        fs.writeFileSync(path.join(this.outputDir, 'main.cpp'), scanner.mainCpp);

        console.log(`Archivos generados en ${this.outputDir}:`);
        console.log('  - scanner.cpp');
        console.log('  - scanner.h');
        console.log('  - token.cpp');
        console.log('  - token.h');
        console.log('  - main.cpp');
    }
}

if (require.main === module) {
    const configPath = process.argv[2];

    if (!configPath) {
        console.error('Uso: npx tsx Backend/main.ts <archivo_config>');
        process.exit(1);
    }

    if (!fs.existsSync(configPath)) {
        console.error(`Archivo no encontrado: ${configPath}`);
        process.exit(1);
    }

    const configContent = fs.readFileSync(configPath, 'utf-8');
    const tokens: TokenDef[] = [];

    for (const line of configContent.trim().split('\n')) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        const firstSpace = trimmed.indexOf(' ');
        if (firstSpace === -1) continue;
        tokens.push({
            name: trimmed.substring(0, firstSpace),
            pattern: trimmed.substring(firstSpace + 1)
        });
    }

    if (tokens.length === 0) {
        console.error('No se encontraron tokens en el archivo de configuracion.');
        process.exit(1);
    }

    const generator = new ScannerGenerator(tokens, './output');
    generator.writeFiles();
}
