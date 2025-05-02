#pragma once
#include "../executables_phase2/json.hpp"
#include <string>
#include <fstream>
#include <unordered_map>
#include <iomanip>
#include <sstream>

class PipelineLogger {
    nlohmann::json pipeline_data;
    int max_cycles = -1;

public:
    // Load the cycle limit from the first line of stats.txt
    void loadCycleLimit(const std::string& statsFile = "stats.txt") {
        std::ifstream file(statsFile);
        std::string label;
        int value;
        if (file >> label >> value) {
            max_cycles = value;
        }
    }

    void logStage(int cycle, const std::string& stage, const nlohmann::json& data) {
        if (max_cycles != -1 && cycle > max_cycles) return;

        while (pipeline_data.size() < cycle) {
            pipeline_data.push_back({{"cycle", static_cast<int>(pipeline_data.size() + 1)}});
        }
        pipeline_data[cycle - 1][stage] = data;
    }

    void logInterstageBuffers(int cycle,
        const nlohmann::json& IF_ID,
        const nlohmann::json& ID_EX,
        const nlohmann::json& EX_MEM,
        const nlohmann::json& MEM_WB) {
        if (max_cycles != -1 && cycle > max_cycles) return;

        while (pipeline_data.size() < cycle) {
            pipeline_data.push_back({{"cycle", static_cast<int>(pipeline_data.size() + 1)}});
        }

        pipeline_data[cycle - 1]["InterstageBuffers"] = {
            {"IF_ID", IF_ID},
            {"ID_EX", ID_EX},
            {"EX_MEM", EX_MEM},
            {"MEM_WB", MEM_WB}
        };
    }

    void markDataHazard(const std::string& pc) {
        for (auto& entry : pipeline_data) {
            if (entry.contains("ID") && entry["ID"].contains("pc") && entry["ID"]["pc"] == pc) {
                entry["ID"]["Hazard"] = "Data";
                break;
            }
        }
    }

    void markControlHazard(const std::string& pc) {
        for (auto& entry : pipeline_data) {
            if (entry.contains("IF") && entry["IF"].contains("pc") && entry["IF"]["pc"] == pc) {
                entry["IF"]["Hazard"] = "Control";
                break;
            }
        }
    }

    void logRegistersToFile(int32_t regs[32], const std::string& filename = "registers.json") {
        nlohmann::json reg_json;
        for (int i = 0; i < 32; ++i) {
            std::string regName = "x" + std::to_string(i);
            reg_json[regName] = regs[i];
        }

        std::ofstream out(filename);
        out << std::setw(4) << reg_json << std::endl;
    }

    void logBranchPredictor(
        const std::map<uint32_t, bool>& bht,
        const std::map<uint32_t, uint32_t>& btb
    ) {
        nlohmann::json predictorData;

        for (const auto& entry : bht) {
            std::stringstream pcHex;
            pcHex << "0x" << std::hex << entry.first;
            predictorData["BHT"][pcHex.str()] = entry.second ? "T" : "NT";
        }

        for (const auto& entry : btb) {
            std::stringstream pcHex, targetHex;
            pcHex << "0x" << std::hex << entry.first;
            targetHex << "0x" << std::hex << entry.second;
            predictorData["BTB"][pcHex.str()] = targetHex.str();
        }

        if (!pipeline_data.empty()) {
            pipeline_data.back()["BranchPredictor"] = predictorData;
        } else {
            pipeline_data.push_back({{"BranchPredictor", predictorData}});
        }
    }

    void writeToFile(const std::string& filename = "pipeline.json") {
        std::ofstream out(filename);
        out << std::setw(4) << pipeline_data << std::endl;
    }
};
