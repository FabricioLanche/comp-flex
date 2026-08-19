%{
%}

%%

[a-z] {printf("Solo un carácter en minúscula\n");}
. {printf("No es solo un carácter en minúscula\n");}
\n {return 0;}

%%

yywrap() {}

int main(){
  printf("Ingresa una cadena: ");
  yylex();

  return 0;
}