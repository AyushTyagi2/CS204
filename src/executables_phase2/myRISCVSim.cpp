

#include "myRISCVSim.h"
#include <stdlib.h>
#include <stdio.h>
#include <iostream>
#include <stdint.h>
#include <map>
#include <cstring>   // For strcmp
#include <sstream>
using namespace std;

static const unsigned int DATA_SEG_BASE = 0x10000000;

// Memory maps: instructions and data
 map<unsigned int, unsigned int> instr_mem;
 map<unsigned int, unsigned int> data_mem;

// Register file and PC
unsigned int R[32];
unsigned int PC = 0;  // Program Counter
int clock_cycles = 0;

// Other globals (instruction fields, etc.)
static unsigned int instruction_word;
static unsigned int rd, rs1, rs2, funct3, funct7, imm;
static unsigned int operand1, operand2;

// Forward declarations of functions
void fetch();
void decode();
void execute();
void mem();
void write_back();

// Helper function for sign extending immediates.
int32_t sign_extend(unsigned int value, int bits) {
    int32_t mask = 1 << (bits - 1);
    return (value ^ mask) - mask;
}

// --- Memory Access Functions for Instruction Memory ---
unsigned int read_instr_word(unsigned int address) {
    if (instr_mem.find(address) != instr_mem.end())
        return instr_mem[address];
    else
        return 0;
}

void write_instr_word(unsigned int address, unsigned int instruction) {
    instr_mem[address] = instruction;
}

// --- Memory Access Functions for Data Memory ---
// Each key represents one byte. The functions below break a 32-bit word into 4 bytes and vice versa.
unsigned int read_data_word(unsigned int address) {
    unsigned int word = 0;
    word |= (data_mem.count(address) ? data_mem[address] : 0) & 0xFF;
    word |= ((data_mem.count(address + 1) ? data_mem[address + 1] : 0) & 0xFF) << 8;
    word |= ((data_mem.count(address + 2) ? data_mem[address + 2] : 0) & 0xFF) << 16;
    word |= ((data_mem.count(address + 3) ? data_mem[address + 3] : 0) & 0xFF) << 24;
    return word;
}

void write_data_word(unsigned int address, unsigned int data) {
    data_mem[address]     = data & 0xFF;
    data_mem[address + 1] = (data >> 8) & 0xFF;
    data_mem[address + 2] = (data >> 16) & 0xFF;
    data_mem[address + 3] = (data >> 24) & 0xFF;
}

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
        // Enforce x0 == 0
        R[0] = 0;
        clock_cycles++;
        cout << "Clock Cycles: " << clock_cycles << endl;
    }
}

void reset_proc() {
    for (int i = 0; i < 32; i++) 
        R[i] = 0;
    instr_mem.clear();
    data_mem.clear();
    PC = 0;
}

// --- Load Program Memory Function ---
// Reads the input file line-by-line.
// For addresses >= 0x10000000, it treats the next token as data and stores it bytewise in data_mem.
// Otherwise, the token (in hex) is stored as an instruction in instr_mem.
void load_program_memory(char *file_name) {
    FILE *fp = fopen(file_name, "r");
    if (fp == NULL) {
        printf("Error opening input mem file: %s\n", file_name);
        exit(1);
    }

    unsigned int address, value;
    char line[256];

    while (fgets(line, sizeof(line), fp)) {
        // Stop loading if "Done_assembling" is found
        if (strstr(line, "Done_assembling") != NULL) {
            printf("Encountered 'Done_assembling' marker. Stopping load.\n");
            break;
        }

        // Skip comments and empty lines
        if (line[0] == '#' || line[0] == '\n') continue;

        // Extract first two tokens: address and value
        std::stringstream ss(line);
        std::string addr_str, val_str;
        ss >> addr_str >> val_str;

        if (addr_str.empty() || val_str.empty()) continue;

        // Convert strings to integers
        try {
            address = std::stoul(addr_str, nullptr, 16);
            value = std::stoul(val_str, nullptr, 16);
        } catch (...) {
            printf("Warning: Skipping malformed line: %s", line);
            continue;
        }

        if (address >= DATA_SEG_BASE) {
            write_data_word(address, value);
            printf("Loaded data 0x%08X at address 0x%X\n", value, address);
        } else {
            write_instr_word(address, value);
            printf("Loaded instruction 0x%08X at address 0x%X\n", value, address);
        }
    }

    fclose(fp);
}
void fetch() {
    instruction_word = read_instr_word(PC);
    printf("Fetched instruction: 0x%08X from address 0x%X\n", instruction_word, PC);
    PC += 4;
}

void decode() {
    unsigned int opcode = instruction_word & 0x7F; // Extract last 7 bits
    printf("Decoded opcode: 0x%X\n", opcode);
    
    switch (opcode) {
        case 0x33: // R-Type
            rd     = (instruction_word >> 7)  & 0x1F;
            funct3 = (instruction_word >> 12) & 0x7;
            rs1    = (instruction_word >> 15) & 0x1F;
            rs2    = (instruction_word >> 20) & 0x1F;
            funct7 = (instruction_word >> 25) & 0x7F;
            printf("R-Type: rd=%d, rs1=%d, rs2=%d, funct3=%d, funct7=%d\n", rd, rs1, rs2, funct3, funct7);
            break;
        case 0x13: // I-Type (ADDI, ORI, ANDI, etc.)
            rd     = (instruction_word >> 7)  & 0x1F;
            funct3 = (instruction_word >> 12) & 0x7;
            rs1    = (instruction_word >> 15) & 0x1F;
            // Use the helper for sign extension (12-bit)
            imm = sign_extend((instruction_word >> 20) & 0xFFF, 12);
            printf("I-Type: rd=%d, rs1=%d, imm=%d, funct3=%d\n", rd, rs1, imm, funct3);
            break;
        case 0x23: // S-Type (SW, SB, etc.)
            funct3 = (instruction_word >> 12) & 0x7;
            rs1    = (instruction_word >> 15) & 0x1F;
            rs2    = (instruction_word >> 20) & 0x1F;
            imm = sign_extend((((instruction_word >> 25) << 5) | ((instruction_word >> 7) & 0x1F)), 12);
            printf("S-Type: rs1=%d, rs2=%d, imm=%d, funct3=%d\n", rs1, rs2, imm, funct3);
            break;
        case 0x3: // I-Type (Load: LW, LB, LH)
            rd     = (instruction_word >> 7)  & 0x1F;
            funct3 = (instruction_word >> 12) & 0x7;
            rs1    = (instruction_word >> 15) & 0x1F;
            imm = sign_extend((instruction_word >> 20) & 0xFFF, 12);
            printf("I-Type (Load): rd=%d, rs1=%d, imm=%d, funct3=%d\n", rd, rs1, imm, funct3);
            break;
        case 0x37:  // U-Type (LUI)
            rd  = (instruction_word >> 7)  & 0x1F;
            // For U-type, no sign extension is needed.
            imm = instruction_word & 0xFFFFF000;
            printf("U-Type (LUI): rd=%d, imm=0x%X (%d)\n", rd, imm, imm);
            break;
        case 0x17: // AUIPC
            rd  = (instruction_word >> 7)  & 0x1F;
            imm = instruction_word & 0xFFFFF000;
            printf("AUIPC: rd=%d, imm=%d\n", rd, imm);
            break;
        case 0x63: // B-Type (Branch Instructions)
            funct3 = (instruction_word >> 12) & 0x7;
            rs1    = (instruction_word >> 15) & 0x1F;
            rs2    = (instruction_word >> 20) & 0x1F;
            // B-type immediates are 13 bits (including sign bit)
            imm = sign_extend(
                (((instruction_word >> 31) & 0x1) << 12) |
                (((instruction_word >> 7)  & 0x1) << 11) |
                (((instruction_word >> 25) & 0x3F) << 5) |
                (((instruction_word >> 8)  & 0xF) << 1),
                13);
            printf("B-Type: rs1=%d, rs2=%d, imm=%d, funct3=%d\n", rs1, rs2, imm, funct3);
            break;
        case 0x6F: // J-Type (JAL)
            rd = (instruction_word >> 7) & 0x1F;
            {
                int32_t jimm = sign_extend(
                    (((instruction_word >> 31) & 0x1) << 20) |
                    (((instruction_word >> 12) & 0xFF) << 12) |
                    (((instruction_word >> 20) & 0x1) << 11) |
                    (((instruction_word >> 21) & 0x3FF) << 1),
                    21);
                imm = jimm;
                printf("J-Type (JAL): rd=%d, imm=%d\n", rd, imm);
            }
            break;
        case 0x67: // I-Type (JALR)
            rd     = (instruction_word >> 7)  & 0x1F;
            funct3 = (instruction_word >> 12) & 0x7;
            rs1    = (instruction_word >> 15) & 0x1F;
            imm = sign_extend((instruction_word >> 20) & 0xFFF, 12);
            printf("I-Type (JALR): rd=%d, rs1=%d, imm=%d\n", rd, rs1, imm);
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
        case 0x33: // R-Type
            switch (funct3) {
                case 0x0:
                    if (funct7 == 0x00) {
                        operand1 = R[rs1] + R[rs2];
                        printf("Executing ADD: %d + %d = %d\n", R[rs1], R[rs2], operand1);
                    } else if (funct7 == 0x20) {
                        operand1 = R[rs1] - R[rs2];
                        printf("Executing SUB: %d - %d = %d\n", R[rs1], R[rs2], operand1);
                    } else if (funct7 == 0x01) {
                        operand1 = R[rs1] * R[rs2];
                        printf("Executing MUL: %d * %d = %d\n", R[rs1], R[rs2], operand1);
                    }
                    break;
                case 0x4:
                    if (funct7 == 0x00) {
                        operand1 = R[rs1] ^ R[rs2];
                        printf("Executing XOR: %d ^ %d = %d\n", R[rs1], R[rs2], operand1);
                    } else if (funct7 == 0x01) {
                        if (R[rs2] == 0) {
                            printf("Error: Division by zero\n");
                            operand1 = 0;
                        } else {
                            operand1 = R[rs1] / R[rs2];
                            printf("Executing DIV: %d / %d = %d\n", R[rs1], R[rs2], operand1);
                        }
                    }
                    break;
                case 0x6:
                    if (funct7 == 0x00) {
                        operand1 = R[rs1] | R[rs2];
                        printf("Executing OR: %d | %d = %d\n", R[rs1], R[rs2], operand1);
                    } else if (funct7 == 0x01) {
                        if (R[rs2] == 0) {
                            printf("Error: Division by zero\n");
                            operand1 = 0;
                        } else {
                            operand1 = R[rs1] % R[rs2];
                            printf("Executing REM: %d %% %d = %d\n", R[rs1], R[rs2], operand1);
                        }
                    }
                    break;
                case 0x7:
                    operand1 = R[rs1] & R[rs2];
                    printf("Executing AND: %d & %d = %d\n", R[rs1], R[rs2], operand1);
                    break;
                case 0x1:
                    operand1 = R[rs1] << (R[rs2] & 31);
                    printf("Executing SLL: %d << %d = %d\n", R[rs1], R[rs2] & 31, operand1);
                    break;
                case 0x2:
                    operand1 = (R[rs1] < R[rs2]) ? 1 : 0;
                    printf("Executing SLT: %d < %d = %d\n", R[rs1], R[rs2], operand1);
                    break;
                case 0x5:
                    if (funct7 == 0x00) {
                        operand1 = (unsigned int)R[rs1] >> (R[rs2] & 31);
                        printf("Executing SRL: %d >> %d = %d\n", R[rs1], R[rs2] & 31, operand1);
                    } else if (funct7 == 0x20) {
                        operand1 = (int)R[rs1] >> (R[rs2] & 31);
                        printf("Executing SRA: %d >> %d = %d\n", R[rs1], R[rs2] & 31, operand1);
                    }
                    break;
                default:
                    printf("Unknown R-Type operation\n");
                    break;
            }
            break;
        case 0x13: // I-Type (ADDI, ORI, ANDI)
            switch (funct3) {
                case 0x0:
                    operand1 = R[rs1] + imm;
                    printf("Executing ADDI: %d + %d = %d\n", R[rs1], imm, operand1);
                    break;
                case 0x7:
                    operand1 = R[rs1] & imm;
                    printf("Executing ANDI: %d & %d = %d\n", R[rs1], imm, operand1);
                    break;
                case 0x6:
                    operand1 = R[rs1] | imm;
                    printf("Executing ORI: %d | %d = %d\n", R[rs1], imm, operand1);
                    break;
                default:
                    printf("Unknown I-Type operation\n");
                    break;
            }
            break;
        case 0x23:
            eff_addr = R[rs1] + imm;
            operand2 = R[rs2];
            printf("Executing Store: Address = %d, Value = %d\n", eff_addr, operand2);
            break;
        case 0x03:
            eff_addr = R[rs1] + imm;
            printf("Executing Load: Address = %d\n", eff_addr);
            break;
        case 0x63:
            switch (funct3) {
                case 0x0:
                    if (R[rs1] == R[rs2]) PC += imm - 4;
                    printf("Executing BEQ: %s\n", (R[rs1] == R[rs2]) ? "Branch Taken" : "No Branch");
                    break;
                case 0x1:
                    if (R[rs1] != R[rs2]) PC += imm - 4;
                    printf("Executing BNE: %s\n", (R[rs1] != R[rs2]) ? "Branch Taken" : "No Branch");
                    break;
                case 0x4:
                    if (R[rs1] < R[rs2]) PC += imm - 4;
                    printf("Executing BLT: %s\n", (R[rs1] < R[rs2]) ? "Branch Taken" : "No Branch");
                    break;
                case 0x5:
                    if (R[rs1] >= R[rs2]) PC += imm - 4;
                    printf("Executing BGE: %s\n", (R[rs1] >= R[rs2]) ? "Branch Taken" : "No Branch");
                    break;
                default:
                    printf("Unknown Branch operation\n");
                    break;
            }
            break;
        case 0x17:
            operand1 = PC + imm;
            printf("Executing AUIPC: PC %d + Immediate %d = %d\n", PC, imm, operand1);
            break;
        case 0x6F: { // JAL
                unsigned int link = PC;
                unsigned int target = (PC - 4) + imm;
                R[rd] = link;
                PC = target;
                printf("Executing JAL: Jumping to 0x%X, link stored in R%d = 0x%X\n", PC, rd, link);
                break;
            }
        case 0x67: { // JALR
                unsigned int link = PC;
                unsigned int target = (R[rs1] + imm) & ~1;
                R[rd] = link;
                PC = target;
                printf("Executing JALR: Jumping to 0x%X, link stored in R%d = 0x%X\n", PC, rd, link);
                break;
            }
        default:
            printf("Unknown instruction type in execute stage\n");
            break;
    }
}

void mem() {
    unsigned int opcode = instruction_word & 0x7F;
    int eff_addr;
    switch (opcode) {
        case 0x03:
            switch (funct3) {
                case 0x2:
                    eff_addr = R[rs1] + imm;
                    operand1 = read_data_word(eff_addr);
                    printf("Memory Read (LW): Loaded %d from address %d\n", operand1, eff_addr);
                    break;
                case 0x0:
                    eff_addr = R[rs1] + imm;
                    operand1 = read_data_word(eff_addr) & 0xFF;
                    printf("Memory Read (LB): Loaded byte %d from address %d\n", operand1, eff_addr);
                    break;
                case 0x1:
                    eff_addr = R[rs1] + imm;
                    operand1 = read_data_word(eff_addr) & 0xFFFF;
                    printf("Memory Read (LH): Loaded halfword %d from address %d\n", operand1, eff_addr);
                    break;
                default:
                    printf("Unknown Load operation\n");
                    break;
            }
            break;
        case 0x23:
            eff_addr = R[rs1] + imm;
            switch (funct3) {
                case 0x2:
                    write_data_word(eff_addr, operand2);
                    printf("Memory Write (SW): Stored %d at address %d\n", operand2, eff_addr);
                    break;
                case 0x0:
                    write_data_word(eff_addr, operand2 & 0xFF);
                    printf("Memory Write (SB): Stored byte %d at address %d\n", operand2 & 0xFF, eff_addr);
                    break;
                case 0x1:
                    write_data_word(eff_addr, operand2 & 0xFFFF);
                    printf("Memory Write (SH): Stored halfword %d at address %d\n", operand2 & 0xFFFF, eff_addr);
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
        case 0x33:
        case 0x13:
        case 0x03:
            R[rd] = operand1;
            printf("Write Back: Stored %d in R%d\n", operand1, rd);
            break;
        case 0x23:
            printf("Write Back: No register update required (Store instruction)\n");
            break;
        case 0x37:
            R[rd] = imm;
            printf("Write Back (LUI): Stored %d in R%d\n", imm, rd);
            break;
        case 0x17:
            R[rd] = operand1 - 4;
            printf("Write Back (AUIPC): Stored %d in R%d\n", R[rd], rd);
            break;
        default:
            printf("Unknown inn in write-back stage\n");
            break;
    }
}