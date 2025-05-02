#ifndef MYRISCVSIM_H
#define MYRISCVSIM_H
#include <map>
using namespace std;
extern  map<unsigned int,unsigned int> instr_mem;
extern  map<unsigned int,unsigned int> data_mem;
extern unsigned int R[32];
extern unsigned int PC;
extern int clock_cycles;
// Function Prototypes
void run_RISCVsim();
void reset_proc();
void load_program_memory(char* file_name);


// Instruction Execution Functions
void fetch();
void decode();
void execute();
void mem();
void write_back();

// Memory Functions
unsigned int read_instr_word(unsigned int address);
void write_data_word(unsigned int address, unsigned int data);
void reset_proc();
unsigned int read_data_word(unsigned int address);


unsigned int read_instr_word(unsigned int address);

#endif // MYRISCVSIM_H