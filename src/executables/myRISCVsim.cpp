/* 
   The project is developed as part of CS204: Computer Architecture class Project Phase 2 and Phase 3: 
   Functional Simulator for a subset of the RISCV Processor

   Developer's Names:
   Group No:
   Developer's Email ids:
   Date: 
*/
#include "myRISCVSim.h"
#include <stdlib.h>
#include <stdio.h>
#include <iostream>
#include <cstring>
using namespace std;

// Register file
 int32_t R[32];
 uint8_t MEM[4000] = {0};
 uint32_t PC = 0;

// Instruction Fields
static unsigned int instruction_word;
static unsigned int rd, rs1, rs2, funct3, funct7, imm;
static unsigned int operand1, operand2;


// Function to run the simulator loop
void run_RISCVsim() {
    while (true) {
        fetch();
        decode();
        if (instruction_word == 0x00) { // Check for exit condition
            printf("End of Program\n");
            break;
        }
        execute();
        mem();
        write_back();
    }
}


// Reset processor state
void reset_proc() {
    for (int i = 0; i < 32; i++) R[i] = 0;
    for (int i = 0; i < 4000; i++) MEM[i] = 0;
   // R[32] = 0; // Initialize PC to 0
    PC=0;
}

// Load program memory from file
void load_program_memory(char *file_name) {
    FILE *fp = fopen(file_name, "r");
    if (fp == NULL) {
        printf("Error opening input memory file: %s\n", file_name);
        exit(1);
    }

    unsigned int address, instruction;
    char line[100];  // Buffer for reading lines
    while (fgets(line, sizeof(line), fp)) {
        // If the line contains "Done_assembling", stop processing
        if (strstr(line, "Done_assembling")) {
            printf("Assembly finished. Stopping loading process.\n");
            break;
        }

        // Read only the first two hexadecimal numbers
        if (sscanf(line, "%x %x", &address, &instruction) != 2) {
            printf("Skipping invalid line: %s", line);
            continue;
        }

        if (address >= 4000) {  // Check for out-of-bounds memory access
            printf("Error: Attempted to load instruction at invalid address 0x%X\n", address);
            exit(1);
        }

        write_word((char*)MEM, address, instruction, 1);
        printf("Loaded instruction 0x%08X at address 0x%X\n", instruction, address);
    }

    fclose(fp);
}

// Write data memory to file
void write_data_memory() {
    FILE *fp = fopen("data_out.mem", "w");
    if (fp == NULL) {
        printf("Error opening data_out.mem file\n");
        return;
    }
    for (unsigned int i = 0; i < 4000; i += 4) {
        fprintf(fp, "%x %x\n", i, read_word((char*)MEM, i,1));
    }
    fclose(fp);
}

// Exit simulation
void swi_exit() {
    write_data_memory();
    exit(0);
}

void fetch() {
    instruction_word = read_word((char*)MEM, PC,1); // Fetch instruction from memory at PC

    printf("Fetched instruction: 0x%08X from address 0x%X\n", instruction_word, PC);
    
    PC += 4; // Increment PC
}


void decode() {
    unsigned int opcode = instruction_word & 0x7F; // Extract last 7 bits

    printf("Decoded opcode: 0x%X\n", opcode);

    switch (opcode) {
        case 0x33: // R-Type (ADD, SUB, AND, OR, etc.)
            rd = (instruction_word >> 7) & 0x1F;
            funct3 = (instruction_word >> 12) & 0x7;
            rs1 = (instruction_word >> 15) & 0x1F;
            rs2 = (instruction_word >> 20) & 0x1F;
            funct7 = (instruction_word >> 25) & 0x7F;
            printf("R-Type: rd=%d, rs1=%d, rs2=%d, funct3=%d, funct7=%d\n", rd, rs1, rs2, funct3, funct7);
            break;

        case 0x13: // I-Type (ADDI, ORI, ANDI, etc.)
            rd = (instruction_word >> 7) & 0x1F;
            funct3 = (instruction_word >> 12) & 0x7;
            rs1 = (instruction_word >> 15) & 0x1F;
            imm = (instruction_word >> 20) & 0xFFF; // 12-bit immediate
            printf("I-Type: rd=%d, rs1=%d, imm=%d, funct3=%d\n", rd, rs1, imm, funct3);
            break;

        case 0x23: // S-Type (SW, SB, etc.)
            funct3 = (instruction_word >> 12) & 0x7;
            rs1 = (instruction_word >> 15) & 0x1F;
            rs2 = (instruction_word >> 20) & 0x1F;
            imm = ((instruction_word >> 25) << 5) | ((instruction_word >> 7) & 0x1F);
            printf("S-Type: rs1=%d, rs2=%d, imm=%d, funct3=%d\n", rs1, rs2, imm, funct3);
            break;
        case 0x3://I-type(LW,LB,LH)
            rd = (instruction_word >> 7) & 0x1F;
            funct3 = (instruction_word >> 12) & 0x7;
            rs1 = (instruction_word >> 15) & 0x1F;
            imm = (instruction_word >> 20) & 0xFFF; // 12-bit immediate
            printf("I-Type: rd=%d, rs1=%d, imm=%d, funct3=%d\n", rd, rs1, imm, funct3);
            break;

        case 0x37:  // U-type (LUI)
             rd = (instruction_word >> 7) & 0x1F;  // Extract destination register
             imm = instruction_word & 0xFFFFF000;  // Upper 20 bits as immediate
            //R[rd] = imm;  // Load the upper immediate into rd
            break;

        case 0x17: { // AUIPC (Add Upper Immediate to PC)
             rd = (instruction_word >> 7) & 0x1F;     // Extract destination register
             imm = instruction_word & 0xFFFFF000;    // Extract upper 20-bit immediate
        
            // Execute: Add immediate to PC
            //registers[rd] = pc + imm; 
        
            // Debugging Output
            //printf("Write Back in x%d with value %d (PC + imm)\n", rd, registers[rd]);
        
            break;
            }
        case 0x63: // B-Type (BEQ, BNE, BLT, BGE, etc.)
            funct3 = (instruction_word >> 12) & 0x7;
            rs1 = (instruction_word >> 15) & 0x1F;
            rs2 = (instruction_word >> 20) & 0x1F;
            imm = ((instruction_word >> 31) << 12) | ((instruction_word >> 25) & 0x3F) | ((instruction_word >> 8) & 0xF) | ((instruction_word << 1) & 0x800);
            printf("B-Type: rs1=%d, rs2=%d, imm=%d, funct3=%d\n", rs1, rs2, imm, funct3);
            break;
        case 0x6F: // J-Type (JAL)
            rd = (instruction_word >> 7) & 0x1F;
            imm = ((instruction_word >> 31) << 20) | ((instruction_word >> 12) & 0xFF) | ((instruction_word >> 20) & 0x7FE) | ((instruction_word >> 21) & 0x7F);
            printf("J-Type: rd=%d, imm=%d\n", rd, imm);
            break;
               
            
        default:
            printf("Unknown opcode: 0x%X\n", opcode);
            break;
    }
}



void execute() {
    unsigned int opcode = instruction_word & 0x7F;
    int eff_addr;
    switch (opcode) {
        case 0x33: // R-Type (ADD, SUB, AND, OR, etc.)
            switch (funct3) {
                case 0x0: // ADD / SUB
                    if (funct7 == 0x00) {
                        operand1 = R[rs1] + R[rs2];  // ADD
                        printf("Executing ADD: %d + %d = %d\n", R[rs1], R[rs2], operand1);
                    } else if (funct7 == 0x20) {
                        operand1 = R[rs1] - R[rs2];  // SUB
                        printf("Executing SUB: %d - %d = %d\n", R[rs1], R[rs2], operand1);
                    } else if (funct7 == 0x1F) {
                        operand1 = R[rs1] * R[rs2];  // MUL
                        printf("Executing MUL: %d * %d = %d\n", R[rs1], R[rs2], operand1);
                    } 
                    break;
                case 0x7: // AND
                    operand1 = R[rs1] & R[rs2];
                    printf("Executing AND: %d & %d = %d\n", R[rs1], R[rs2], operand1);
                    break;
                case 0x6: // OR, REM
                    if(funct7 == 0x00){
                        operand1 = R[rs1] | R[rs2];  // OR
                        printf("Executing OR: %d | %d = %d\n", R[rs1], R[rs2], operand1);
                    }
                    else if(funct7 == 0x01){
                        operand1 = R[rs1] % R[rs2];  // REM
                        printf("Executing REM: %d %% %d = %d\n", R[rs1], R[rs2], operand1);

                    }
                    break;
                case 0x1: // SLL
                    operand1 = R[rs1] << R[rs2];
                    printf("Executing SLL: %d << %d = %d\n", R[rs1], R[rs2], operand1);
                    break;
                case 0x2: // SLT
                    operand1 = (R[rs1] < R[rs2]) ? 1 : 0;
                    printf("Executing SLT: %d < %d = %d\n", R[rs1], R[rs2], operand1);
                    break;
                case 0x5: // SRL / SRA
                    if (funct7 == 0x00) {
                        operand1 = R[rs1] >> R[rs2];  // SRL
                        printf("Executing SRL: %d >> %d = %d\n", R[rs1], R[rs2], operand1);
                    } else if (funct7 == 0x20) {
                        operand1 = (int)R[rs1] >> R[rs2];  // SRA
                        printf("Executing SRA: %d >> %d = %d\n", R[rs1], R[rs2], operand1);
                    }
                    break;
                case 0x4: // XOR, DIV, 
                    if(funct7 == 0x00){
                        operand1 = R[rs1] ^ R[rs2];  // XOR
                        printf("Executing XOR: %d ^ %d = %d\n", R[rs1], R[rs2], operand1);
                    }
                    else if(funct7 == 0x01){
                        operand1 = R[rs1] / R[rs2];  // DIV
                        printf("Executing DIV: %d / %d = %d\n", R[rs1], R[rs2], operand1);
                    }
                    break;
                
                default:
                    printf("Unknown R-Type operation\n");
                    break;
            }
            break;

        case 0x13: // I-Type (ADDI, ORI, ANDI)
            switch (funct3) {
                case 0x0: // ADDI
                    operand1 = R[rs1] + imm;
                    printf("Executing ADDI: %d + %d = %d\n", R[rs1], imm, operand1);
                    break;
                case 0x7: // ANDI
                    operand1 = R[rs1] & imm;
                    printf("Executing ANDI: %d & %d = %d\n", R[rs1], imm, operand1);
                    break;
                case 0x6: // ORI
                    operand1 = R[rs1] | imm;
                    printf("Executing ORI: %d | %d = %d\n", R[rs1], imm, operand1);
                    break;
                default:
                    printf("Unknown I-Type operation\n");
                    break;
            }
            break;
        case 0x23:
            switch(funct3){
                case 0x2: // SW
                     eff_addr = R[rs1] + imm;
                    operand2 = R[rs2];
                    printf("Executing SW: %d + %d = %d\n", R[rs1], imm, eff_addr);
                    break;
                case 0x0: // SB
                     eff_addr = R[rs1] + imm;
                    operand2 = R[rs2];
                    printf("Executing SB: %d + %d = %d\n", R[rs1], imm, eff_addr);
                    break;
                case 0x1: // SH
                     eff_addr = R[rs1] + imm;
                    operand2 = R[rs2];
                    printf("Executing SH: %d + %d = %d\n", R[rs1], imm, eff_addr);
                    break;
            }
            break;
            case 0x03: // I-Type (Load Instructions)
            switch(funct3) {
                case 0x0: // LB (Load Byte)
                     eff_addr = R[rs1] + imm;
                    printf("Executing LB: Base %d + Offset %d = Effective Address %d\n", R[rs1], imm, eff_addr);
                    break;
                case 0x1: // LH (Load Halfword)
                     eff_addr = R[rs1] + imm;
                    printf("Executing LH: Base %d + Offset %d = Effective Address %d\n", R[rs1], imm, eff_addr);
                    break;
                case 0x2: // LW (Load Word)
                     eff_addr = R[rs1] + imm;
                    printf("Executing LW: Base %d + Offset %d = Effective Address %d\n", R[rs1], imm, eff_addr);
                    break;
                default:
                    printf("Unknown Load operation\n");
                    break;
            }
            break;
     
            case 0x17: // AUIPC
            operand1 = PC + imm;
            printf("Executing AUIPC: PC %d + Immediate %d = %d\n", PC, imm, operand1);
            break;

        default:
            printf("Unknown instruction type in execute stage\n");
            break;
    }
}

// Memory access operations
void mem() {
    unsigned int opcode = instruction_word & 0x7F;

    switch (opcode) {
        case 0x03: // I-Type (Load Instructions)
            switch (funct3) {
                case 0x2: // LW (Load Word)
                    operand1 = read_word((char*)MEM, R[rs1] + imm,1);
                    printf("Memory Read (LW): Loaded %d from address %d into temporary register\n", operand1, R[rs1] + imm);
                    break;
                case 0x0: // LB (Load Byte)
                    operand1 = MEM[R[rs1] + imm]; // Load single byte
                    printf("Memory Read (LB): Loaded byte %d from address %d\n", operand1, R[rs1] + imm);
                    break;
                case 0x1:
                operand1 = read_word((char*)MEM, R[rs1] + imm,2);
                printf("Memory Read (LW): Loaded %d from address %d into temporary register\n", operand1, R[rs1] + imm);
                break;
                default:
                    printf("Unknown Load operation\n");
                    break;
            }
            break;

        case 0x23: // S-Type (Store Instructions)
            switch (funct3) {
                case 0x2: // SW (Store Word)
                    write_word((char*)MEM, R[rs1] + imm, operand2, 1);
                    printf("Memory Write (SW): Stored %d at address %d\n", operand2, R[rs1] + imm);
                    break;
                case 0x0: // SB (Store Byte)
                    MEM[R[rs1] + imm] = operand2 & 0xFF; // Store only lower byte
                    printf("Memory Write (SB): Stored byte %d at address %d\n", operand2 & 0xFF, R[rs1] + imm);
                    break;
                case 0x1://sh
                    write_word((char*)MEM, R[rs1] + imm, operand2, 3);
                    printf("Memory Write (SW): Stored %d at address %d\n", operand2, R[rs1] + imm);
                    break;
                default:
                    printf("Unknown Store operation\n");
                    break;
            }
            break;

        default:
            printf("No memory operation required\n");
            break;
    }
}


void write_back() {
    unsigned int opcode = instruction_word & 0x7F;

    switch (opcode) {
        case 0x33: // R-Type (ADD, SUB, AND, OR, etc.)
        case 0x13: // I-Type (ADDI, ANDI, ORI, etc.)
        case 0x03: // I-Type (Load Instructions like LW, LB)
            R[rd] = operand1; // Store the computed value in destination register
            printf("Write Back: Stored %d in R%d\n", operand1, rd);
            break;

        case 0x23: // S-Type (SW, SB)
            printf("Write Back: No register update required (Store instruction)\n");
            break;
        case 0x37: //U-type(LUI)
            R[rd] = imm;
            printf("Write Back in %d with imm %d\n", rd, imm);
            break;
        case 0x17://U-type(AUIPC)
            R[rd] = operand1 - 4;
            printf("Write Back in x%d with value %d (PC + imm)\n", rd, R[rd]);
            break;
        default:
            printf("Unknown instruction in write-back stage\n");
            break;
    }
}


unsigned int read_word(char *mem, unsigned int address, unsigned int intructn) {
    switch (intructn) {
        case 1: // lw
            return ((unsigned char)mem[address] |
                    ((unsigned char)mem[address + 1] << 8) |
                    ((unsigned char)mem[address + 2] << 16) |
                    ((unsigned char)mem[address + 3] << 24));
        case 2: // lh
            return ((unsigned char)mem[address] |
                    ((unsigned char)mem[address + 1] << 8));
        default:
            return 0; // Return a default value (e.g., 0) for invalid instruction types
    }
}



void write_word(char *mem, unsigned int address, unsigned int data, int instructn) {
    switch (instructn) {
        case 1: // sw (store word)
            mem[address] = data & 0xFF;
            mem[address + 1] = (data >> 8) & 0xFF;
            mem[address + 2] = (data >> 16) & 0xFF;
            mem[address + 3] = (data >> 24) & 0xFF;
            break;

        case 2: // sb (store byte)
            mem[address] = data & 0xFF;
            break;

        case 3: // sh (store half-word)
            mem[address] = data & 0xFF;
            mem[address + 1] = (data >> 8) & 0xFF;
            break;

        default:
            // Handle invalid instruction type (optional)
            break;
    }
}