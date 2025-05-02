#include <iostream>
#include <fstream>
#include <sstream>
#include <iomanip>
#include <string>
#include "json.h"  // Your PipelineLogger

std::string trim(const std::string& str) {
    const auto first = str.find_first_not_of(" \t");
    if (first == std::string::npos) return "";
    const auto last = str.find_last_not_of(" \t");
    return str.substr(first, last - first + 1);
}

int main() {
    std::ifstream asm_file("input.asm");

    if (!asm_file) {
        std::cerr << "Error opening input.asm file!" << std::endl;
        return 1;
    }

    PipelineLogger logger;
    unsigned int address = 0x0;
    int cycle = 1;
    bool in_text_section = false;

    std::string line;
    while (std::getline(asm_file, line)) {
        line = trim(line);

        if (line.empty() || line[0] == '#') continue;

        if (line == ".text") {
            in_text_section = true;
            continue;
        }

        if (!in_text_section || line.back() == ':') continue;

        // Format PC address
        std::stringstream pc_ss;
        pc_ss << "0x" << std::hex << address;

        logger.logStage(cycle, "instruction", {
            {"pc", pc_ss.str()},
            {"instruction", line}
        });

        address += 4;
        cycle++;
    }

    logger.writeToFile("pipeline.json");
    std::cout << "JSON file 'pipeline.json' has been generated.\n";
    return 0;
}
