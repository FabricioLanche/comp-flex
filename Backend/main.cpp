#include <iostream>
#include <vector>
#include <string>
#include <fstream>
#include <cstdlib>

using namespace std;

struct TokenDef {
    string name;
    string pattern;
};

vector<TokenDef> tokens;

const string BUTTONS[] = {"", "[a-z]", "[A-Z]", "[0-9]", "+", "*", "?", " or "};

void showMainMenu() {
    cout << "\n=== Comp-Flex Scanner Generator ===" << endl;
    cout << "  1. Agregar token" << endl;
    cout << "  2. Listar tokens" << endl;
    cout << "  3. Generar scanner" << endl;
}

void showPatternBuilder(const vector<string>& elems) {
    cout << "\n--- Constructor de Patron ---" << endl;
    cout << "Expresiones disponibles:" << endl;
    for (int i = 1; i <= 7; i++)
        cout << "  " << i << ". " << BUTTONS[i] << endl;

    cout << "\nElementos: ";
    if (elems.empty()) cout << "(vacio)";
    for (const auto& e : elems) cout << e;
    cout << endl;

    cout << "\n  [1-7] Agregar expresion" << endl;
    cout << "  d. Borrar ultima" << endl;
    cout << "  g. Guardar token" << endl;
}

void addToken() {
    vector<string> elems;
    string input;

    while (true) {
        showPatternBuilder(elems);
        cout << "\nSeleccione: ";
        getline(cin, input);

        if (input == "g") {
            if (elems.empty()) {
                cout << "Error: el patron no puede estar vacio." << endl;
                continue;
            }
            string name;
            cout << "Nombre del token: ";
            getline(cin, name);

            string pattern;
            for (const auto& e : elems) pattern += e;

            tokens.push_back({name, pattern});
            cout << "Token '" << name << "' guardado." << endl;
            return;
        } else if (input == "d") {
            if (!elems.empty()) elems.pop_back();
        } else if (input.length() == 1 && input[0] >= '1' && input[0] <= '7') {
            elems.push_back(BUTTONS[input[0] - '0']);
        } else {
            cout << "Opcion invalida." << endl;
        }
    }
}

void listTokens() {
    if (tokens.empty()) {
        cout << "\nNo hay tokens definidos." << endl;
        return;
    }
    cout << "\nTokens:" << endl;
    for (size_t i = 0; i < tokens.size(); i++)
        cout << "  " << tokens[i].name << " -> " << tokens[i].pattern << endl;
}

void writeConfig() {
    ofstream f("output/tokens.cfg");
    for (const auto& t : tokens)
        f << t.name << " " << t.pattern << endl;
    f.close();
}

void generateAndTest() {
    if (tokens.empty()) {
        cout << "\nError: defina al menos un token primero." << endl;
        return;
    }

    cout << "\nGenerando scanner..." << endl;
    writeConfig();

    if (system("npx tsx Backend/main.ts output/tokens.cfg") != 0) {
        cout << "Error al generar archivos C++." << endl;
        return;
    }

    cout << "Compilando..." << endl;
    if (system("cd output && g++ -o scanner main.cpp scanner.cpp token.cpp") != 0) {
        cout << "Error al compilar." << endl;
        return;
    }

    cout << "\n=== Probando Scanner ===" << endl;
    cout << "(Ctrl+C para volver al menu)\n" << endl;

    string input;
    while (true) {
        cout << "> ";
        if (!getline(cin, input)) break;
        if (input.empty()) continue;

        ofstream inf("output/test_input.txt");
        inf << input;
        inf.close();

        system("cd output && ./scanner test_input.txt");
    }
}

int main() {
    string input;

    while (true) {
        showMainMenu();
        cout << "Seleccione: ";
        getline(cin, input);

        if (input == "1") addToken();
        else if (input == "2") listTokens();
        else if (input == "3") generateAndTest();
        else cout << "Opcion invalida." << endl;
    }

    return 0;
}
