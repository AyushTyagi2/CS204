#ifndef MYRISCVSIM_H
#define MYRISCVSIM_H
#include <cstdint>

extern int32_t R[32];
extern uint8_t MEM[4000];
extern uint32_t PC;

// Function Prototypes
void run_RISCVsim();
void reset_proc();
void load_program_memory(char* file_name);
void write_data_memory();
void swi_exit();

// Instruction Execution Functions
void fetch();
void decode();
void execute();
void mem();
void write_back();

// Memory Functions
unsigned int read_word(char *mem, unsigned int address,unsigned int instructn);
void write_word(char *mem, unsigned int address, unsigned int data, int instruntn);

#endif // MYRISCVSIM_H
