import os
import subprocess
import shutil

# Archivos c++
programa = ["main.cpp", "scanner.cpp", "token.cpp", "parser.cpp", "ast.cpp", "visitor.cpp"]
executable = "compiler.exe" if os.name == "nt" else "compiler"

# Compilar
compile = ["g++"] + programa + ["-o", executable]
print("Compilando:", " ".join(compile))
result = subprocess.run(compile, capture_output=True, text=True)

if result.returncode != 0:
    print("Error en compilación:\n", result.stderr)
    exit(1)

print("Compilación exitosa")

# Ejecutar
input_dir = "inputs"
output_dir = "outputs"
os.makedirs(output_dir, exist_ok=True)

for i in range(1, 2):
    filename = f"input{i}.txt"
    filepath = os.path.join(input_dir, filename)

    if os.path.isfile(filepath):
        print(f"Ejecutando {filename}")
        run_cmd = [os.path.abspath(executable), filepath]
        result = subprocess.run(run_cmd, capture_output=True, text=True)

        # stdout contiene solamente ensamblador, así que se guarda como .s.
        output_file = os.path.join(output_dir, f"output{i}.s")
        with open(output_file, "w", encoding="utf-8") as f:
            f.write(result.stdout)

        # Los errores se muestran en la consola y no contaminan el archivo .s.
        if result.stderr:
            print(result.stderr, end="")

        # Archivos generados
        tokens_file = os.path.join(input_dir, f"input{i}_tokens.txt")  # se crea en inputs/
        ast_file = "ast.dot"  # se crea en raíz del proyecto

        # Mover archivo de tokens si existe
        if os.path.isfile(tokens_file):
            dest_tokens = os.path.join(output_dir, f"tokens_{i}.txt")
            shutil.move(tokens_file, dest_tokens)

        # Mover y convertir AST si existe
        if os.path.isfile(ast_file):
            dest_ast = os.path.join(output_dir, f"ast_{i}.dot")
            shutil.move(ast_file, dest_ast)

            # Convertir a PNG
            output_img = os.path.join(output_dir, f"ast_{i}.png")
            dot_cmd = ["dot", "-Tpng", dest_ast, "-o", output_img]
            subprocess.run(dot_cmd, capture_output=True, text=True)

    else:
        print(filename, "no encontrado en", input_dir)
