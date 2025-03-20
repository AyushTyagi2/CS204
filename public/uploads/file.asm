.data        
byte_var:  .byte  0x12               
half_var:  .half  0x1234             
word_var:  .word  0x12345678         
dword_var: .dword 0x123456789ABCDEF0 
string_var: .asciiz "Hello, RISC-V!" 
.text
add x4 x5 x6
and x5 x5 x6
or x7 x6 x12
sll x6 x8 x13
slt x6 x7 x9
sra x6 x6 x8
srl x2 x2 x2
sub x5 x4 x13
xor x12 x3 x4
mul x6 x6 x9
div x5 x4 x6
rem x7 x6 x9
addi x7 x6 5
andi x5 x6 4
ori x6 x7 900
lb x6 0 x9
lh x12 0 x9
lw x7 8 x6 
jalr x9 x8 10
sb x9 8 x6
sw x6 9 x7
sh x9 9 x5
auipc x6 78
auipc x8 65
lui x3 75
lui x6 13
beq a0, a1, equal_case                
bne a0, a1, not_equal_case        
bge a1, a0, greater_or_equal_case 
blt a0, a1, less_than_case        
equal_case: jal x2 exit       
not_equal_case: jal x3 exit       
greater_or_equal_case: jal x4 exit       
less_than_case: jal x5 exit     
exit:
