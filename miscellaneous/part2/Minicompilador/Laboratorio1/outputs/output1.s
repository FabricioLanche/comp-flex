.data
print_fmt:.string "%ld\n" 
.text
.globl main
main:
pushq %rbp
movq %rsp, %rbp
movq $1, %rax
pushq %rax
movq $2, %rax
movq %rax, %rcx
popq %rax
addq %rcx ,%rax
pushq %rax
movq $3, %rax
movq %rax, %rcx
popq %rax
addq %rcx ,%rax
pushq %rax
movq $4, %rax
movq %rax, %rcx
popq %rax
addq %rcx ,%rax
pushq %rax
movq $5, %rax
movq %rax, %rcx
popq %rax
addq %rcx ,%rax
pushq %rax
movq $6, %rax
movq %rax, %rcx
popq %rax
addq %rcx ,%rax
pushq %rax
movq $7, %rax
movq %rax, %rcx
popq %rax
addq %rcx ,%rax
pushq %rax
movq $8, %rax
movq %rax, %rcx
popq %rax
addq %rcx ,%rax
pushq %rax
movq $9, %rax
movq %rax, %rcx
popq %rax
addq %rcx ,%rax
pushq %rax
movq $10, %rax
movq %rax, %rcx
popq %rax
addq %rcx ,%rax
movq %rax, %rsi
leaq print_fmt(%rip), %rdi
movq $0, %rax
call printf@PLT
movq $0, %rax
leave
ret
.section .note.GNU-stack,"",@progbits
