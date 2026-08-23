# Hacedor de Scanners

Generador de scanners léxicos para el curso de Compiladores. Define tokens con patrones regulares, genera código C++ y prueba el scanner en tiempo real.

> 🎥 **Video de la exposición:** debido a su peso (244 MB) no está versionado en el repositorio; se encuentra alojado en Google Drive:
> **[Ver TareaOpcional.mp4 en Drive](https://drive.google.com/file/d/1g95cg5B7Ec3wDGuAAOgslbkw9nGJMjkz/view?usp=sharing)**

## Gramática

```
A → A or B | B | C
B → BD | D
C → CE | E
D → F+ | F* | F? | F
E → + | - | * | / | ^
F → [a-z] | [A-Z] | [0-9] | (A)
```

## Símbolos disponibles

| Símbolo | Descripción |
|---------|-------------|
| `[a-z]` | Cualquier letra minúscula |
| `[A-Z]` | Cualquier letra mayúscula |
| `[0-9]` | Cualquier dígito |
| `+` | Uno o más (quantifier) / literal |
| `*` | Cero o más (quantifier) / literal |
| `?` | Cero o uno (quantifier) |
| `or` | Alternancia (ej: `[a-z]or[0-9]`) |
| `-`, `/`, `^` | Operadores literales |
| `(`, `)` | Agrupación |

## Requisitos

- Node.js >= 18
- Alternativa: Docker (para levantar todo con un solo comando, ver más abajo)

## Uso

Necesitas **2 terminales**:

```bash
# Terminal 1 — Backend server
cd Backend
npm install
npm run server

# Terminal 2 — Frontend
cd Fronted
npm install
npm run dev
```

Abre `http://localhost:5173` en el navegador.

**Paso 1:** Define tus tokens. Ej:
- `NUM` → `[0-9]+` (un número o más dígitos)
- `ID` → `[a-z][a-z0-9]*` (identificador)
- `PLUS` → `+` (operador suma)

**Paso 2:** Revisa el listado de tokens definidos.

**Paso 3:** Se generan 5 archivos C++ (`token.h`, `token.cpp`, `scanner.h`, `scanner.cpp`, `main.cpp`). Escribe una cadena de prueba y haz clic en ▶ para ver qué tokens identifica el scanner.

### CLI (línea de comandos)

```bash
cd Backend
npm run dev
```

Menú interactivo para agregar tokens, generar el scanner C++ y compilarlo (requiere g++ instalado).

## Alternativa: Docker Compose

Levanta backend + frontend con un solo comando (requiere Docker):

```bash
docker compose up --build
```

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000` (`POST /scan`, `GET /health`)
- Hot-reload incluido: los cambios en `Backend/` y `Fronted/` se reflejan automáticamente

Detener:

```bash
docker compose down
```

CLI interactivo dentro del contenedor:

```bash
docker compose run --rm backend npm run dev
```

## Estructura del proyecto

```
comp-flex/
├── Backend/
│   ├── scanner.ts       # Scanner léxico (tokeniza patrones)
│   ├── parser.ts        # Parser recursivo-desendente
│   ├── ast.ts           # Nodos AST y tipos
│   ├── visitor.ts       # Generador de código C++ (Visitor pattern)
│   ├── token.ts         # TokenType enum y clase Token
│   ├── server.ts        # HTTP server para /scan
│   └── cli.ts           # CLI interactivo
├── Fronted/
│   └── src/
│       ├── App.tsx              # Layout principal, manejo de estado
│       ├── engine.ts            # Conexión frontend ↔ backend
│       ├── types.ts             # Tipos compartidos
│       └── components/
│           ├── TokenConstructor.tsx  # Paso 1: definir tokens
│           ├── TokenList.tsx         # Paso 2: revisar tokens
│           ├── StringTester.tsx      # Paso 3: probar scanner
│           ├── CodePreview.tsx       # Visor de código C++ generado
│           └── StepIndicator.tsx     # Indicador de pasos
└── miscellaneous/
```

## Generación de código C++

El backend genera 5 archivos C++ usando el patrón Visitor:

| Archivo | Contenido |
|---------|-----------|
| `token.h` | Enum `Token::Type` con los tokens definidos |
| `token.cpp` | Implementación de `Token` y su impresión |
| `scanner.h` | Declaración de la clase `Scanner` |
| `scanner.cpp` | Funciones `match_*` generadas para cada token |
| `main.cpp` | Programa de prueba que lee un archivo y escanea |
