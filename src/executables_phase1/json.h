#pragma once
#include "../executables_phase2/json.hpp"
#include <string>
#include <fstream>

class PipelineLogger {
     nlohmann::json pipeline_data;

public:
    void logStage(int cycle, const std::string& stage, const nlohmann::json& data) {
        // Ensure cycle entry exists
        if (pipeline_data.size() < cycle) {
            pipeline_data.push_back({{"cycle", cycle}});
        }

        // Add stage data to the correct cycle
        pipeline_data[cycle - 1][stage] = data;
    }

    void writeToFile(const std::string& filename = "pipeline.json") {
        std::ofstream out(filename);
        out << std::setw(4) << pipeline_data << std::endl;
    }
};
