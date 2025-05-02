#include "myRISCVSim.h"
#include <iostream>
#include <fstream>
#include <sstream>
#include <iomanip>
#include "json.hpp"

using json = nlohmann::json;

// Function to write execution data to JSON
void write_execution_json() {
    json execution_data;

    
    // Store register values
    for (int i = 0; i < 32; i++) {
        execution_data["registers"]["R" + std::to_string(i)] = R[i];
    }

    // Store program counter
    execution_data["PC"] = PC;
    execution_data["clock_cycles"] = clock_cycles;
    std::cout << "this is your output " << clock_cycles << std::endl;
    // Store memory values (only non-zero words)
    json memory_data;
    for (const auto& entry : data_mem) {
        uint32_t addr = entry.first;
    
        // align to word boundary
        if (addr % 4 != 0) continue;
    
        uint32_t word = read_data_word(addr);
        if (word != 0) {
            std::stringstream ss;
            ss << "0x" << std::hex << addr;
            memory_data[ss.str()] = word;
            std::cout << "This is your word: " << word <<endl;
        }
    }
    
    execution_data["memory"] = memory_data;

    // Write to a file
    std::ofstream output_file("execution_output.json");
    output_file << execution_data.dump(4); // Pretty print with 4-space indentation
    output_file.close();

    std::cout << "Execution data written to execution_output.json\n";
}

// Call this function at the end of the simulation
void swip_exit() {
    write_execution_json();
    exit(0);
}
