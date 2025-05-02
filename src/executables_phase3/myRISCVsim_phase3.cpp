#include <iostream>
#include <fstream>
#include <sstream>
#include <map>
#include <iomanip>
#include <cstdint>
#include <string>
#include <vector>
#include "json.h"
#include "json_regs.h"
using namespace std;

PipelineLogger logger;



// Pipeline register structure
struct PipelineRegister {
    uint32_t pc = 0;
    uint32_t instruction = 0;
    bool is_nop = true;

    // Decoded fields
    uint8_t rs1 = 0, rs2 = 0, rd = 0;
    int32_t imm = 0;
    int32_t rs1_val = 0, rs2_val = 0;

    // Control signals
    bool reg_write = false;
    bool mem_read = false;
    bool mem_write = false;
    bool alu_src = false;
    bool mem_to_reg = false;
    bool branch = false;
    bool jump = false;
    bool is_jalr = false;
    int alu_op = 0;
    int mem_size = 0; // 0:byte, 1:half, 2:word

    // Execution results
    int32_t alu_result = 0;
    int32_t mem_data = 0;
    bool branch_taken = false;
};

class RISCVSimulator {
    map<uint32_t, uint32_t> imem;
    map<uint32_t, int32_t> dmem;
    int32_t regs[32] = {0};
    uint32_t pc = 0;

    PipelineRegister IF_ID, ID_EX, EX_MEM, MEM_WB;

    int cycle_count = 0;
    int stall_count = 0;
    int forward_count = 0;
    bool enable_forwarding = false;
    bool enable_branch_pred = false;
    map<uint32_t, bool> bht; // branch history table
   uint32_t mispredict_count = 0;
    bool branch_mispredicted = false;
    uint32_t total_branches = 0;
    // btb declaration
    map<uint32_t, uint32_t> btb; // branch target buffer
    static constexpr uint32_t DATA_BASE = 0x10000000;
    // Immediate generators
    // 12‑bit I‑type

int32_t i_imm(uint32_t instr) {
    int32_t imm = (instr >> 20) & 0xFFF;       // bits [31:20]
    if (imm & 0x800)                          // if sign bit (bit 11) set
        imm |= ~0xFFF;                        // extend with 1s above bit 11
    return imm;
};


// 12‑bit S‑type
int32_t s_imm(uint32_t instr) {
    int32_t imm_lo = (instr >> 7) & 0x1F;      // bits [11:7]
    int32_t imm_hi = (instr >> 25) & 0x7F;     // bits [31:25]
    int32_t imm   = (imm_hi << 5) | imm_lo;    // form 12‑bit value
    if (imm & 0x800)                           // sign bit = bit 11
        imm |= ~0xFFF;
    return imm;
}

// 13‑bit B‑type (branch): imm[12|10:5|4:1|11] <<1
int32_t b_imm(uint32_t instr) {
    int32_t imm_11   = (instr >> 7) & 0x1;     // bit 7 → imm[11]
    int32_t imm_4to1 = (instr >> 8) & 0xF;     // bits [11:8] → imm[4:1]
    int32_t imm_10to5= (instr >> 25) & 0x3F;   // bits [30:25] → imm[10:5]
    int32_t imm_12   = (instr >> 31) & 0x1;    // bit 31 → imm[12]
    int32_t imm = (imm_12 << 12)
                | (imm_11 << 11)
                | (imm_10to5 << 5)
                | (imm_4to1 << 1);
    if (imm & (1 << 12))                       // sign bit = bit 12
        imm |= ~0x1FFF;                       // extend above bit 12
    return imm;
}

// 20‑bit U‑type
int32_t u_imm(uint32_t instr) {
    // Top 20 bits are already in place; just interpret as signed.
    return (int32_t)(instr & 0xFFFFF000);
}

// 21‑bit J‑type (jump): imm[20|10:1|11|19:12] <<1
int32_t j_imm(uint32_t instr) {
    int32_t imm_20    = (instr >> 31) & 0x1;   // bit 31 → imm[20]
    int32_t imm_10to1 = (instr >> 21) & 0x3FF; // bits [30:21]
    int32_t imm_11    = (instr >> 20) & 0x1;   // bit 20
    int32_t imm_19to12= (instr >> 12) & 0xFF;  // bits [19:12]
    int32_t imm = (imm_20 << 20)
                | (imm_19to12 << 12)
                | (imm_11 << 11)
                | (imm_10to1 << 1);
    if (imm & (1 << 20))                       // sign bit = bit 20
        imm |= ~0x1FFFFF;                     // extend above bit 20
    return imm;
}

public:
RISCVSimulator(const string& filename,
        bool forwarding,
        bool branch_pred)
    : enable_forwarding(forwarding),
    enable_branch_pred(branch_pred)
    {
    load_program(filename);
    regs[0] = 0;
    }

   
    void load_program(const string& filename) {
        ifstream file(filename);
        string line;
        while (getline(file, line)) {
            if (line.empty() || line[0] == '#') continue;
            istringstream iss(line);
            string addr_str, data_str;
            if (!(iss >> addr_str >> data_str)) continue;
            uint32_t addr = stoul(addr_str, nullptr, 16);
            uint32_t word = stoul(data_str, nullptr, 16);
            // if address is in data segment, initialize dmem
            if (addr >= DATA_BASE) {
                dmem[addr] = (int32_t)word;
                cout<<"Data stored at "<<hex<<addr<<" = "<<dec<<dmem[addr]<<endl;
            } else {
                // otherwise treat as instruction
                imem[addr] = word;
            }
        }
    }

    uint32_t read_instruction(uint32_t addr) {
        auto it = imem.find(addr);
        return (it != imem.end()) ? it->second : 0x00000013; // NOP
    }

    int32_t read_memory(uint32_t addr, uint8_t size) {
        auto it = dmem.find(addr);
        if (it == dmem.end()) return 0;
        int32_t value = it->second;
        switch(size) {
            case 0: return (int8_t)(value & 0xFF);
            case 1: return (int16_t)(value & 0xFFFF);
            default: return value;
        }
    }

    void write_memory(uint32_t addr, int32_t value, uint8_t size) {
        switch(size) {
            case 0:
                dmem[addr] = (dmem[addr] & ~0xFF) | (value & 0xFF);
                break;
            case 1:
                dmem[addr] = (dmem[addr] & ~0xFFFF) | (value & 0xFFFF);
                break;
            default:
                dmem[addr] = value;
        }
    }
    void dump_to_json(){
        JsonExporter::dumpSimulatorState(regs, dmem);

    };
    void run_simulation() {
        bool done = false;
    
        while (!done) {
            cycle_count++;
    
            // ==================== PREPARE NEXT REGISTER STATES ====================
            PipelineRegister next_ID_EX;
            PipelineRegister next_IF_ID = IF_ID; // start as a bubble by default
    
            // ==================== WB STAGE ====================
            if (!MEM_WB.is_nop && MEM_WB.reg_write && MEM_WB.rd != 0) {
                //cout<<MEM_WB.mem_to_reg<<" "<<MEM_WB.alu_result<<endl<<"check"<<endl;
                regs[MEM_WB.rd] =
                    MEM_WB.mem_to_reg ? MEM_WB.mem_data : MEM_WB.alu_result;
                cout << "[WB ] Cycle " << cycle_count
                     << " | Wrote x" << dec << (int)MEM_WB.rd
                     << " = 0x" << hex << regs[MEM_WB.rd] << dec << endl;
                     stringstream pc_stream;
                    pc_stream << "0x" << hex << MEM_WB.pc;

                    logger.logStage(cycle_count, "WB", {
                        {"pc", pc_stream.str()},
                        {"instruction", MEM_WB.instruction}  // assuming this is already a hex string like "0x00628293"
                    });




                inst_retired++;

                // classify by type
                if (MEM_WB.mem_read || MEM_WB.mem_write) {
                    load_store_cnt++;
                }
                else if (MEM_WB.branch || MEM_WB.jump) {
                    ctrl_cnt++;
                }
                else {
                    alu_cnt++;
                }

            }
    
            // ==================== MEM STAGE ====================
            if (!EX_MEM.is_nop) {
                if (EX_MEM.mem_read) {
                    EX_MEM.mem_data = read_memory(EX_MEM.alu_result, EX_MEM.mem_size);

                    
                    cout << "[MEM] Cycle " << cycle_count
                         << " | Read  [" << EX_MEM.mem_size << "] from 0x"
                         << hex << EX_MEM.alu_result
                         << " = 0x" << EX_MEM.mem_data << dec << endl;
                         stringstream pc_stream;

                         pc_stream << "0x" << hex<<EX_MEM.pc;
                         logger.logStage(cycle_count, "MEM", {
                            {"pc", pc_stream.str()},
                            {"instruction", EX_MEM.instruction}
                        });
                }
                if (EX_MEM.mem_write) {
                    write_memory(EX_MEM.alu_result, EX_MEM.rs2_val, EX_MEM.mem_size);

            
                    cout << "[MEM] Cycle " << cycle_count
                         << " | Write [" << EX_MEM.mem_size << "] to   0x"
                         << hex << EX_MEM.alu_result
                         << " <= 0x" << EX_MEM.rs2_val << dec << endl;

                        std::stringstream ss;
                        ss << "write at 0x" << std::hex << EX_MEM.alu_result;
                        stringstream pc_stream;

                        pc_stream << "0x" << hex<<EX_MEM.pc;
                        logger.logStage(cycle_count, "MEM", {
                            {"pc", pc_stream.str()},
                            {"instruction",EX_MEM.instruction},
                        });
                }if (!EX_MEM.mem_read && !EX_MEM.mem_write) {
                    cout << "[MEM] Cycle " << cycle_count
                        << " | No memory operation" << endl;

                        logger.logStage(cycle_count,"MEM",{
                            {"pc", "NO MEMORY OPERATION"},
                            {"instruction",""}
                        });
                }
            }
         
                // ==================== EX STAGE ====================
            ID_EX.alu_result   = 0;
            ID_EX.branch_taken = false;
            bool flush = false;
            int32_t flush_target = 0;
    
            if (!ID_EX.is_nop) {

                if (!ID_EX.mem_read && !ID_EX.mem_write 
                    && !ID_EX.branch && !ID_EX.jump)
                {
                    //
                }                


                int32_t op1 = get_forwarded_value(ID_EX.rs1, ID_EX.rs1_val);
                int32_t op2 = ID_EX.alu_src ? ID_EX.imm : get_forwarded_value(ID_EX.rs2, ID_EX.rs2_val);
    
                cout << "[EX ] Cycle " << cycle_count
                     << " | op1 = 0x" << hex << op1
                     << " | op2 = 0x" << op2 << dec << endl;

                     std::stringstream op1_ss, op2_ss,pc_stream;
                     op1_ss << "0x" << std::hex << op1;
                     op2_ss << "0x" << std::hex << op2;
                     pc_stream<< "0x"<<hex<<ID_EX.pc;
                                 
                     logger.logStage(cycle_count, "EX", {
                        {"pc",pc_stream.str()},
                         {"op1", op1_ss.str()},
                         {"op2", op2_ss.str()}
                     });

    
                
                switch (ID_EX.alu_op) {
                    case 0:  ID_EX.alu_result = op1 + op2; break;
                    case 1:  ID_EX.alu_result = op1 - op2; break;
                    case 2:  ID_EX.alu_result = op1 & op2; break;
                    case 3:  ID_EX.alu_result = op1 | op2; break;
                    case 4:  ID_EX.alu_result = op1 ^ op2; break;
                    case 5:  ID_EX.alu_result = op1 << (op2 & 0x1F); break;
                    case 6:  ID_EX.alu_result = (uint32_t)op1 >> (op2 & 0x1F); break;
                    case 7:  ID_EX.alu_result = op1 >> (op2 & 0x1F); break;
                    case 8:  ID_EX.alu_result = (op1 < op2) ? 1 : 0; break;
                    case 9:  ID_EX.alu_result = op1 * op2; break;
                    case 10: ID_EX.alu_result = op2 ? op1 / op2 : 0; break;
                    case 11: ID_EX.alu_result = op2 ? op1 % op2 : 0; cout<<op1<<" "<<op2<<endl;break;
                    case 12: ID_EX.alu_result = ID_EX.imm; break;
                    case 13: ID_EX.alu_result = ID_EX.pc + ID_EX.imm; break;
                }
    
                // Branch resolution
                if (ID_EX.branch) {
                    // Evaluate actual
                    total_branches++;
                    control_hazard_cnt++; 
                    cout<<"Control_hazard"<<" "<<"0x"<<ID_EX.pc<<endl;
                    std::stringstream ss;
                    ss << "0x" << std::hex << ID_EX.pc;
                    std::string hex_pc = ss.str();

                    // Then pass it to your logging function
                    logger.markControlHazard(hex_pc);

                    bool taken = false;
                    switch (ID_EX.alu_op) {
                      case 0:  taken = (op1 == op2); break; // BEQ
                      case 1:  taken = (op1 != op2); break; // BNE
                      case 4:  taken = (op1 <  op2); break; // BLT
                      case 5:  taken = (op1 >= op2); break; // BGE
                    }
                    ID_EX.branch_taken = taken;
                    int32_t target = ID_EX.pc + (taken ? ID_EX.imm : 4);
                    btb[ID_EX.pc] = ID_EX.pc + ID_EX.imm; // update btb with target
                  
                    if (enable_branch_pred) {
                        uint32_t idx  = ID_EX.pc;
                        bool     pred = bht[idx];
                     
                        if (pred != taken) {
                            branch_mispredicted = true;
                            mispredict_count++;
                            flush = true;
                            flush_target = target;
                            control_stall_cnt++;
                        }
                        // update predictor
                        bht[idx] = taken;
                    } else {
                        // old behavior: flush only on taken
                        if (taken) {
                            flush = true;
                            flush_target = target;
                        }
                    }
                
                    cout << "[EX ] Cycle " << cycle_count
                        << " | Branch(" << (taken?"T":"NT")
                        << ") – nextPC=0x" << hex << target << dec << endl;
                        std::stringstream target_ss,pc;
                        target_ss << "0x" << std::hex << target;
                            pc<<"0x"<<std::hex<<ID_EX.pc;
                        logger.logStage(cycle_count, "EX", {
                            {"pc", pc.str()},
                            {"instruction", ID_EX.instruction},
                            {"branch_taken", taken},
                            {"next_pc", target_ss.str()}
                        });

                }
                
                // Jump resolution
                if (ID_EX.jump) {
                    ID_EX.alu_result = ID_EX.pc + 4;  // return address (PC+4)
                    int32_t target;
                    if (ID_EX.is_jalr) {
                      target = (op1 + ID_EX.imm) & ~1;
                    } else {
                      target = ID_EX.pc + ID_EX.imm;
                    }
                    btb[ID_EX.pc] = ID_EX.pc + ID_EX.imm; // update btb with target
                    cout << "curr-pc: "<<hex<<ID_EX.pc<<" target-pc: "<<target<<endl;
                    cout << "[EX ] … Jump => nextPC=0x" << hex << target << dec << endl;
                    std::stringstream currpc_ss, target_ss;
                    currpc_ss << "0x" << std::hex << ID_EX.pc;
                    target_ss << "0x" << std::hex << target;
                                    
                    logger.logStage(cycle_count, "EX", {
                        {"type", "jump"},
                        {"pc", currpc_ss.str()},
                        {"target_pc", target_ss.str()},
                        {"instruction",ID_EX.instruction},
                    });

                    flush = true;
                    flush_target = target;
                  }
    
                // If we need to flush, update PC immediately
                if (flush) {
                    pc = flush_target;
                }
            }
    
            // ==================== HAZARD DETECTION ====================
            bool stall = detect_hazard();
           
            // ==================== ID STAGE ====================
            if (flush) {
                next_IF_ID.is_nop = true;
                next_ID_EX.is_nop = true;
                pc = flush_target; // update PC immediately
            } else if (stall) {
                stall_count++;
                data_stall_cnt++;
                next_ID_EX.is_nop = true; // bubble ID/EX
                // next_IF_ID unchanged => freeze IF/ID & PC
            } else {
                // ID stage
                if (!IF_ID.is_nop) {
                    decode(IF_ID, next_ID_EX);
                    cout<<"[ID ] Cycle " << cycle_count
                         << " | Decoding instruction 0x" << hex << IF_ID.instruction
                         << " at PC=0x" << IF_ID.pc << dec << endl;
                         std::stringstream pc_ss, instr_ss;
                         pc_ss << "0x" << std::hex << IF_ID.pc;
                         instr_ss << "0x" << std::hex << IF_ID.instruction;
                                         
                         logger.logStage(cycle_count, "ID", {
                             {"pc", pc_ss.str()},
                             {"instruction", instr_ss.str()}
                         });

                } else {
                    next_ID_EX.is_nop = true;
                }
                if (!flush && !stall) {
                    auto it = imem.find(pc);
                    if (it != imem.end()) {
                        uint32_t curr_pc   = pc;
                        uint32_t instr     = it->second;
                        uint32_t opcode    = instr & 0x7f;
                        bool     is_branch = (opcode == 0x63);
                
                        // Branch‑predict or fall back
                        if (enable_branch_pred && is_branch) {
                            // index by PC>>2
                            uint32_t idx = curr_pc;
                            bool     pred = bht[idx];
                            pc = curr_pc + (pred ? b_imm(instr) : 4);
                        } else {
                            pc += 4;
                        }
                
                        next_IF_ID.pc          = curr_pc;
                        next_IF_ID.instruction = instr;
                        next_IF_ID.is_nop      = false;
                        decode_regs(next_IF_ID);
                        cout << "[IF ] Cycle " << cycle_count
                             << " | Fetched 0x" << hex << instr
                             << " @ PC=0x" << curr_pc << dec << endl;
                             std::stringstream pc_ss, instr_ss;
                            pc_ss << "0x" << std::hex << curr_pc;
                            instr_ss << "0x" << std::hex << instr;
                                                
                            logger.logStage(cycle_count, "IF", {
                                {"pc", pc_ss.str()},
                                {"instruction", instr_ss.str()}
                            });

                    } else {
                        next_IF_ID.is_nop = true;
                    }

                    if(enable_branch_pred){
                        if(bht.empty()){
                             cout<<"empty"<<endl;
                         }
                         else{
                             
                             for(auto it = bht.begin(); it != bht.end(); ++it) {
                                 cout << "BHT: PC=0x" << hex << it->first
                                      << " Prediction=" << (it->second ? "T" : "NT") << dec << "\n";
                                      
                             }
                         }
             
                         cout<<endl;
                    
                         if(btb.empty()){
                             cout<<"empty"<<endl;
                         }
                         else{
                             for(auto it = btb.begin(); it != btb.end(); ++it) {
                                 cout << "BTB: PC=0x" << hex << it->first
                                      << " Target=0x" << it->second << dec << "\n";
                             }}
                         cout<<endl;}
                         logger.logBranchPredictor(bht, btb);
                         logger.writeToFile("prediction.json");
                        }
            }

            // update pipeline regs
            MEM_WB = EX_MEM;
            EX_MEM  = ID_EX;
            ID_EX   = next_ID_EX;
            IF_ID   = next_IF_ID;
            bool print_trace=false;
            if(knob4_trace_pipeline){
                print_trace=true;
            }
            if(print_trace){
                print_pipeline_registers(cycle_count);
            }
             if (enable_reg_dump){
                print_register_file();
             }
            // check done
            done = IF_ID.is_nop && ID_EX.is_nop && EX_MEM.is_nop && MEM_WB.is_nop
                   && imem.find(pc)==imem.end();
        }
    }


    void print_register_file() {
        cout << "[REGS] Cycle " << cycle_count << " Register File:\n";
        for (int i = 0; i < 32; i += 4) {
            cout << " x" << setw(2) << i << "=" << hex << setw(8)
                 << regs[i] << dec
                 << "  x" << setw(2) << (i+1) << "=" << hex << setw(8)
                 << regs[i+1] << dec
                 << "  x" << setw(2) << (i+2) << "=" << hex << setw(8)
                 << regs[i+2] << dec
                 << "  x" << setw(2) << (i+3) << "=" << hex << setw(8)
                 << regs[i+3] << dec
                 << "\n";
        }
    }
    

bool knob4_trace_pipeline=false; 
bool enable_reg_dump = false;

private:

// overall instruction retire count
uint32_t inst_retired   = 0;



// classifying instructions
uint32_t load_store_cnt = 0;
uint32_t alu_cnt        = 0;
uint32_t ctrl_cnt       = 0;

// hazard & stall breakdown
uint32_t data_hazard_cnt    = 0;
uint32_t data_stall_cnt     = 0;
uint32_t control_hazard_cnt = 0;
uint32_t control_stall_cnt  = 0;


bool detect_hazard() {
    // Only consider a load‑use hazard if ID/EX holds a load
    if (!ID_EX.is_nop && ID_EX.mem_read && ID_EX.rd != 0) {
        // figure out if the next instr is a store
        uint8_t next_opcode = IF_ID.instruction & 0x7f;
        bool is_store = (next_opcode == 0x23);

        bool rs1_match = (ID_EX.rd == IF_ID.rs1);
        bool rs2_match = (ID_EX.rd == IF_ID.rs2);

        // stall if base‑address (rs1) matches, OR if it's not a store
        // and rs2 also matches (i.e. any other use of the loaded value)
        if ( rs1_match ||
            (!is_store && rs2_match) )
        {
            return true; // need one‑cycle bubble
        }
    }

    // the rest of your RAW checks (when forwarding off) remain unchanged:
    if (!enable_forwarding) {
        if (!ID_EX.is_nop && ID_EX.reg_write &&
            (ID_EX.rd == IF_ID.rs1 || ID_EX.rd == IF_ID.rs2)){
            cout<<"data_hazard"<<" "<<"0x"<<ID_EX.pc<<endl;
            data_hazard_cnt++;
            std::stringstream ss;
            ss << "0x" << std::hex << ID_EX.pc;
            std::string hex_pc = ss.str();
            logger.markDataHazard(ss.str());

            return true;}
        if (!EX_MEM.is_nop && EX_MEM.reg_write &&
            (EX_MEM.rd == IF_ID.rs1 || EX_MEM.rd == IF_ID.rs2)){
            data_hazard_cnt++;
            cout<<"data_hazard"<<" "<<"0x"<<ID_EX.pc<<endl;
            std::stringstream ss;
            ss << "0x" << std::hex << ID_EX.pc;
            std::string hex_pc = ss.str();
            logger.markDataHazard(ss.str());

            return true;}
    }

    return false;
}

    void decode_regs(PipelineRegister& r) {
        uint32_t instr = r.instruction;
        r.rs1 = (instr >> 15) & 0x1f;
        r.rs2 = (instr >> 20) & 0x1f;
        r.rd  = (instr >> 7)  & 0x1f;
    }

    void decode(const PipelineRegister& in, PipelineRegister& out) {
        uint32_t instr   = in.instruction;
        uint32_t opcode  = instr & 0x7f;
        uint32_t funct3  = (instr >> 12) & 0x7;
        uint32_t funct7  = (instr >> 25) & 0x7f;

        out = PipelineRegister();
        out.pc          = in.pc;
        out.instruction = instr;
        out.rs1         = (instr >> 15) & 0x1f;
        out.rs2         = (instr >> 20) & 0x1f;
        out.rd          = (instr >> 7)  & 0x1f;
        out.rs1_val     = regs[out.rs1];
        out.rs2_val     = regs[out.rs2];
        out.is_nop      = false;

        switch(opcode) {
          case 0x33: // R‑type
            out.reg_write = true;
            out.alu_src   = false;
            switch(funct3) {
              case 0: out.alu_op = (funct7 & 0x20) ? 1 : 0; break;
              case 1: out.alu_op = 5; break;
              case 2: out.alu_op = 8; break;
             
              case 4: out.alu_op = 4; break;
              case 5: out.alu_op = (funct7 & 0x20) ? 7 : 6; break;
              case 6: out.alu_op = 3; break;
              case 7: out.alu_op = 2; break;
            }
            if (funct7 == 0x1) {
              // M‑extension (MUL/DIV/REM)
              switch(funct3) {
                case 0: out.alu_op = 9;  break;
                
                
                case 4: out.alu_op = 10; break;
               
                case 6: out.alu_op = 11; break;
               
              }
            }
            break;

          case 0x13: case 0x03: case 0x67: // I‑type
            out.reg_write = true;
            out.alu_src   = true;
            out.imm       = i_imm(instr);
            if (opcode == 0x03) {
              out.mem_read  = true;
              out.mem_to_reg= true;
              out.mem_size  = funct3;
            }
            else if (opcode == 0x67) {
              out.jump   = true;
                out.is_jalr = true;

              out.alu_op = 0;
            }
            else {
              switch(funct3) {
                case 0: out.alu_op = 0; break;
                case 1: out.alu_op = 5; break;
                
              
                case 4: out.alu_op = 4; break;
             
                case 6: out.alu_op = 3; break;
                case 7: out.alu_op = 2; break;
              }
            }
            break;

          case 0x23: // S‑type
            out.mem_write = true;
            out.alu_src   = true;
            out.imm       = s_imm(instr);
            out.mem_size  = funct3;
            break;

          case 0x63: // SB‑type
            out.branch    = true;
            out.alu_src   = false;
            out.imm       = b_imm(instr);
            out.alu_op    = funct3;
            break;

          case 0x37: case 0x17: // U‑type
            out.reg_write = true;
            out.alu_src   = true;
            out.imm       = u_imm(instr);
            out.alu_op    = (opcode == 0x37) ? 12 : 13;
            break;

          case 0x6f: // UJ‑type
            out.reg_write = true;
            out.jump      = true;
            out.imm       = j_imm(instr);
            // print the imm value and the current PC
            // cout << "[IF ] Cycle " << cycle_count
            //      << " | JUMP => PC next = 0x" << hex
            //      << (in.pc + out.imm) << dec << " "<<out.imm << endl;
            out.alu_op    = 0;
            break;
        
          
        }
    }

    int32_t get_forwarded_value(uint8_t reg, int32_t orig_val) {
        if (reg == 0 || !enable_forwarding)
            return orig_val;

        if (!EX_MEM.is_nop && EX_MEM.reg_write && EX_MEM.rd == reg && !EX_MEM.mem_read) {
            forward_count++;
            cout << "[Forwarding] From EX/MEM → ID/EX | Register x" << +reg 
                  << " | Value = " << EX_MEM.alu_result << std::endl;
                  cout<<"the current cycle is: "<<cycle_count<<endl;
                  logger.logStage(cycle_count, "forwarded",1);

            return EX_MEM.alu_result;
        }

        if (!MEM_WB.is_nop && MEM_WB.reg_write && MEM_WB.rd == reg) {
            forward_count++;
            cout << "[Forwarding] From MEM/WB → ID/EX | Register x" << +reg 
                  << " | Value = " << (MEM_WB.mem_to_reg ? MEM_WB.mem_data : MEM_WB.alu_result) 
                  << (MEM_WB.mem_to_reg ? " (from Memory)" : " (from ALU)") 
                  << std::endl;
                  cout<<"the current cycle is: "<<cycle_count<<endl;
                  logger.logStage(cycle_count, "forwarded",1);
                  logger.logRegistersToFile(regs);
                  

                  return MEM_WB.mem_to_reg ? MEM_WB.mem_data : MEM_WB.alu_result;
        }

        return orig_val;
    }

    void print_pipeline_registers(int cycle) {
        auto print_reg = [](const string& name, const PipelineRegister& reg) {
            cout << name << ": ";
            if (reg.is_nop) {
                cout << "NOP";
            } else {
                cout << "PC=0x" << hex << reg.pc << dec
                    
                     << " | instr=0x" << hex << reg.instruction << dec;
            }
            cout << endl;
        };
        cout << "=== [Cycle " << cycle << "] Pipeline Registers ===\n";
        print_reg("IF/ID ", IF_ID);
        print_reg("ID/EX ", ID_EX);
        print_reg("EX/MEM", EX_MEM);
        print_reg("MEM/WB", MEM_WB);
        cout << "=========================================\n";

        logger.logInterstageBuffers(cycle, IF_ID.instruction, ID_EX.instruction, EX_MEM.instruction, MEM_WB.instruction);
    }
public:
    void print_statistics() {
        cout << "\nSimulation Statistics:\n";
        cout << "Total cycles: " << cycle_count << "\n";
        cout << "Data forwarding: " << (enable_forwarding ? "Enabled" : "Disabled") << "\n";
        cout << "Stall count: " << stall_count << "\n";
        if (enable_forwarding)
            cout << "Forward count: " << forward_count << "\n";
        cout << "Instructions executed: " << imem.size() << "\n";
        cout << fixed << setprecision(2)
             << "CPI: " << (imem.size() ? (float)cycle_count / imem.size() : 0)
             << "\n";

             cout << "Branch prediction: "
             << (enable_branch_pred ? "Enabled" : "Disabled") << "\n";
        if (enable_branch_pred) {
            cout << "  Mispred rate:   "
            << (100.0 * mispredict_count / max(1, (int)total_branches))
            << "%\n";

            for(auto it = btb.begin(); it != btb.end(); ++it) {
                cout << "BTB: PC=0x" << hex << it->first
                     << " Target=0x" << it->second << dec << "\n";
            }

            for(auto it = bht.begin(); it != bht.end(); ++it) {
                cout << "BHT: PC=0x" << hex << it->first
                     << " Prediction=" << (it->second ? "T" : "NT") << dec << "\n";
            }
        }
        
        ofstream out("stats.txt");
        out << "Stat1_Total_Cycles                " << cycle_count         << "\n";
        out << "Stat2_Total_Instructions_Executed " << inst_retired        << "\n";
        out << "Stat3_CPI                         "
            << fixed << setprecision(2)
            << ((inst_retired>0) ? (double)cycle_count/inst_retired : 0.0)
            << "\n";
        out << "Stat4_Load_Store_Instructions     " << load_store_cnt      << "\n";
        out << "Stat5_ALU_Instructions            " << alu_cnt             << "\n";
        out << "Stat6_Control_Instructions        " << ctrl_cnt            << "\n";
        out << "Stat7_Total_Stalls                " << stall_count + control_stall_cnt << "\n";
        out << "Stat8_Data_Hazards                " << data_hazard_cnt     << "\n";
        out << "Stat9_Control_Hazards             " << control_hazard_cnt  << "\n";
        out << "Stat10_Branch_Mispredictions      " << mispredict_count    << "\n";
        out << "Stat11_Stalls_Data_Hazards        " << data_stall_cnt      << "\n";
        out << "Stat12_Stalls_Control_Hazards     " << control_stall_cnt   << "\n";
        out.close();

    }

};

int main(int argc, char* argv[]) {
    if (argc < 2) {
        cerr << "Usage: " << argv[0] << " <input_file> [--forwarding]\n";
        return 1;
    }
    bool forwarding = false, branch_pred = false;
    bool knob4=false, reg_dump = false;
    for (int i = 2; i < argc; i++) {
        if (string(argv[i]) == "--forwarding")
            forwarding = true;
       if (string(argv[i]) == "--branch-pred")
          branch_pred = true;
       if(string(argv[i]) == "--knob4")
          knob4 = true;
        if (string(argv[i]) == "--reg-dump")
            reg_dump = true;
    }
    
    RISCVSimulator sim(argv[1], forwarding, branch_pred);
    sim.knob4_trace_pipeline=knob4;
    sim.enable_reg_dump = reg_dump;
    sim.run_simulation();
    sim.print_statistics();
    sim.dump_to_json();

    logger.writeToFile("pipeline.json");

    return 0;
}