namespace JsonExporter {

    inline void dumpSimulatorState(
        int32_t regs[32],
        const std::map<uint32_t, int32_t>& dmem,
        const std::string& filename = "simulator_state.json"
    ) {
        nlohmann::json jsonOut;

        // Add registers
        for (int i = 0; i < 32; ++i) {
            std::string regName = "R" + std::to_string(i);
            std::stringstream valHex;
            valHex  << std::hex << std::setfill('0') << std::setw(8) << regs[i];
            jsonOut["registers"][regName] = valHex.str();
        }

        // Add data memory
        if (dmem.empty()) {
            jsonOut["memory"] = nullptr;
        } else {
            nlohmann::json memoryJson;
            for (auto it = dmem.begin(); it != dmem.end(); ++it) {
                std::stringstream addrHex, valHex;
                addrHex <<"0x"<< std::hex << it->first;
                valHex  << std::hex << std::setfill('0') << std::setw(8) << it->second;
                memoryJson[addrHex.str()] = valHex.str();
            }
            
            jsonOut["memory"] = memoryJson;
        }

        // Write to file
        std::ofstream out(filename);
        out << std::setw(4) << jsonOut << std::endl;
    }

}
