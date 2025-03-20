/* 

The project is developed as part of CS204: Computer Architecture class Project Phase 2 and Phase 3: Functional Simulator for subset of RISCV Processor

Developer's Names:
Group No:
Developer's Email ids:
Date: 

*/


/* main.cpp 
   Purpose of this file: The file handles the input and output, and
   invokes the simulator
*/


#include "myRISCVSim.h"
#include <stdio.h>
#include <stdlib.h>
#include "json.h"
int main(int argc, char** argv) {
  
  if(argc < 2) {
    printf("Incorrect number of arguments. Please invoke the simulator \n\t./myRISCVSim <input mc file> \n");
    exit(1);
  }
  
  //reset the processor
  reset_proc();
  //load the program memory
  load_program_memory(argv[1]);
  //run the simulator
  run_RISCVsim();

  swip_exit();

  return 1;
}
