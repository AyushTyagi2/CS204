#include "myRISCVSim.h"
#include <iostream>
#include <fstream>
#include "json.hpp"

using json = nlohmann::json;

// Function to write execution data to JSON
void write_execution_json() {
    json execution_data;
    
    // Store register values
    for (int i = 0; i < 32; i++) {
        execution_data["registers"]["R" + std::to_string(i)] = R[i];
    }

    // Store memory values (only non-zero ones)
    json memory_data;
    for (unsigned int i = 0; i < 4000; i += 4) {
        unsigned int word = read_word((char*)MEM, i, 1);
        if (word != 0) {
            memory_data[std::to_string(i)] = word;
        }
    }
    execution_data["memory"] = memory_data;
    
    // Store program counter
    execution_data["PC"] = PC;

    // Write to a file
    std::ofstream output_file("/app/src/app/sim/execution_output.json");
    output_file << execution_data.dump(4); // Pretty print JSON with indentation
    output_file.close();

    std::cout << "Execution data written to execution_output.json\n";
}

// Call this function at the end of the simulation
void swip_exit() {
    write_execution_json();
    exit(0);
}
