#include <iostream>
#include <fstream>
#include <sstream>
#include <unordered_map>
#include <vector>
#include <bitset>
#include <iomanip>
#include <algorithm>
#include <cctype>

using namespace std;

// Memory Segments
const int TEXT_SEGMENT_START = 0x00000000;
const int DATA_SEGMENT_START = 0x10000000;
int currentTextAddress = TEXT_SEGMENT_START;
int currentDataAddress = DATA_SEGMENT_START;
bool inTextSegment = false, inDataSegment = false;

// Symbol Table (Labels for .data memory locations)
unordered_map<string, int> symbolTable;

// Instruction Format Type Mapping
unordered_map<string, string> format_type = {
    //R-type
    {"add", "R"}, {"sub", "R"}, {"mul", "R"}, {"div", "R"}, {"and", "R"}, 
    {"or", "R"}, {"xor", "R"}, {"sll", "R"}, {"srl", "R"}, {"sra", "R"}, 
    {"slt", "R"}, {"sltu", "R"},{"rem","R"},

    // I-type instructions
    {"addi", "I"}, {"andi", "I"}, {"ori", "I"}, {"xori", "I"}, 
    {"slli", "I"}, {"srli", "I"}, {"srai", "I"}, {"slti", "I"}, {"sltiu", "I"}, 
    {"lw", "I"}, {"lb", "I"}, {"lh", "I"}, {"jalr", "I"},{"subi","I"},{ "ld", "I"},

    // S-type (store instructions)
    {"sw", "S"}, {"sb", "S"}, {"sh", "S"},{"sd", "S"},//sd should give error

    // B-type (branch instructions)
    {"beq", "B"}, {"bne", "B"}, {"blt", "B"}, {"bge", "B"}, 
    {"bltu", "B"}, {"bgeu", "B"},

    // U-type (immediate-based instructions)
    {"lui", "U"}, {"auipc", "U"},

    // J-type (jump instructions)
    {"jal", "J"}
}; 

// Opcode & Function Mappings
unordered_map<string, string> opcode_map = {
    {"add", "0110011"}, {"sub", "0110011"}, {"and", "0110011"}, {"or", "0110011"},
    {"xor", "0110011"}, {"sll", "0110011"}, {"slt", "0110011"}, {"sra", "0110011"},
    {"srl", "0110011"}, {"mul", "0110011"}, {"div", "0110011"}, {"rem", "0110011"},
    {"addi", "0010011"}, {"andi", "0010011"}, {"ori", "0010011"}, {"lw", "0000011"},
    {"sw", "0100011"}, {"beq", "1100011"}, {"bne", "1100011"}, {"jal", "1101111"},{"sh", "0100011"}, {"lui", "0110111"}, {"auipc", "0010111"},{"sb", "0100011"},{"jalr", "1100111"},
    {"bge","1100011"},{"blt","1100011"},{"lb","0000011"},{"lh","0000011"},{"ld","0000011"},{"sd","0100011"}
};

unordered_map<string, string> funct3_map = {
    {"add", "000"}, {"sub", "000"}, {"and", "111"}, {"or", "110"},
    {"xor", "100"}, {"sll", "001"}, {"slt", "010"}, {"sra", "101"},
    {"srl", "101"}, {"mul", "000"}, {"div", "100"}, {"rem", "110"},
    {"addi", "000"}, {"andi", "111"}, {"ori", "110"}, {"lw", "010"},{"lb","000"},{"lh","001"},
    {"sw", "010"}, {"beq", "000"}, {"bne", "001"}, {"jal", "NULL"}, {"sh","001"},{"lui","NULL"},{"auipc", "NULL"}, {"sb","000"},{"jalr", "000"},{"bge","101"},{"blt","100"},
    {"ld","011"},{"sd","011"}
    
};

unordered_map<string, string> funct7_map = {
    // R-type instructions
    {"add",  "0000000"}, {"and",  "0000000"}, {"or",   "0000000"},
    {"sll",  "0000000"}, {"slt",  "0000000"}, {"sra",  "0100000"},
    {"srl",  "0000000"}, {"sub",  "0100000"}, {"xor",  "0000000"},
    {"mul",  "0000001"}, {"div",  "0000001"}, {"rem",  "0000001"},

    // I-type instructions (funct7 not used)
    {"addi", "NULL"}, {"andi", "NULL"}, {"ori", "NULL"}, 
    {"lb", "NULL"}, {"ld", "NULL"}, {"lh", "NULL"}, {"lw", "NULL"}, {"jalr", "NULL"},

    // S-type instructions (funct7 not used)
    {"sb", "NULL"}, {"sw", "NULL"}, {"sd", "NULL"}, {"sh", "NULL"},

    // SB-type instructions (funct7 not used)
    {"beq", "NULL"}, {"bne", "NULL"}, {"bge", "NULL"}, {"blt", "NULL"},

    // U-type instructions (funct7 not used)
    {"auipc", "NULL"}, {"lui", "NULL"},

    // UJ-type instruction (funct7 not used)
    {"jal", "NULL"}
};



// Register Mapping
unordered_map<string, string> register_map;
unordered_map<string, int> label_map;

// Initialize register map
void init_register_map() {
    for (int i = 0; i < 32; i++) {
        register_map["x" + to_string(i)] = bitset<5>(i).to_string();
    }
}

// Trim Function
string trim(const string& str) {
    size_t first = str.find_first_not_of(" \t");
    if (first == string::npos) return "";
    size_t last = str.find_last_not_of(" \t");
    return str.substr(first, (last - first + 1));
}

// Helper Function: Check if String is a Valid Number
bool isNumber(const string& s) {
    return !s.empty() && s.find_first_not_of("-0123456789") == string::npos;
}

// Convert an instruction to machine code
string convert_to_machine_code(vector<string> tokens,int current_pc) {
    for(int i = 0;i<tokens.size();i++){
    std::cout<<tokens[i]<<" "<<endl;
}
    string opcode = opcode_map[tokens[0]];
    string type = format_type[tokens[0]];
    string funct3 = funct3_map[tokens[0]];
    string rd, rs1, rs2, imm, funct7;

    if (type == "R") {  // R-format
        rd = register_map[tokens[1]];
        rs1 = register_map[tokens[2]];
        rs2 = register_map[tokens[3]];
        funct7 = funct7_map[tokens[0]];
        cout<< funct7+" "+rs2+" "+ rs1+" " + funct3+" "+rd+" "+ opcode<<endl;
        
        return funct7+rs2+rs1+funct3+rd+opcode;
    }
    else if (type == "I") {  // I-format
        if (tokens[0] == "lw" || tokens[0] == "lh" || tokens[0] == "ld" || tokens[0] == "lb" ){
        rd = register_map[tokens[1]];
        rs1 = register_map[tokens[3]];
        imm = bitset<12>(stoi(tokens[2])).to_string();
        cout<< imm+" "+ rs1+" "+ funct3+" "+ rd+" "+ opcode<<endl;
        return imm+rs1+funct3+rd+opcode;    
        }
        
        else{
        rd = register_map[tokens[1]];
        rs1 = register_map[tokens[2]];
        imm = bitset<12>(stoi(tokens[3])).to_string();
        cout<< imm+" "+ rs1+" "+ funct3+" "+ rd+" "+ opcode<<endl;
        return imm+rs1+funct3+rd+opcode;
        }
        return imm + rs1 + funct3 + rd + opcode;
    }  else if (type == "S") {
        rs1 = register_map[tokens[3]];
        rs2 = register_map[tokens[1]];
        imm = bitset<12>(stoi(tokens[2])).to_string();
        cout << imm.substr(0,7) + " " + rs2 + " " +rs1+" "+funct3+" "+imm.substr(7,5)+opcode;
        return imm.substr(0,7)+ rs2 + rs1 +funct3+ imm.substr(7,5)+opcode  ;

    }
        else if (type == "B") {
        rs1 = register_map[tokens[1]];
        rs2 = register_map[tokens[2]];

        if (label_map.find(tokens[3]) == label_map.end()) {
            
            cerr << "Error: Label '" << tokens[3] << "' not found!" << endl;
            exit(1);
        }
        int offset = label_map[tokens[3]] - current_pc; 
        imm = bitset<13>(offset).to_string(); 
        cout<<imm<<endl;

        return imm[0] + imm.substr(2, 6) + rs2 + rs1 + funct3 + imm.substr(8, 4) + imm[1] + opcode;
    }
    else if (type == "U") {
        rd = register_map[tokens[1]];  
        int imm_value = stoi(tokens[2]);  
        
       
        cout<<imm_value<<endl;
        imm_value = imm_value << 12;
       
        imm = bitset<32>(imm_value).to_string();  
        cout<<imm<<endl;
        string imm_upper = imm.substr(0, 20);

    
        cout << imm_upper + " " + rd + " " + opcode << endl;
        return imm_upper + rd + opcode;
    }
    
       else if (type == "J") {
        rd = register_map[tokens[1]];
        if (label_map.find(tokens[2]) == label_map.end()) {
            cerr << "Error: Label '" << tokens[2] << "' not found!" << endl;
            exit(1);
        }
        
        int offset = label_map[tokens[2]] - current_pc;
      
        imm = bitset<21>(offset).to_string();
        cout<<"jal"<<" "<<imm<<endl;
        return imm[0] + imm.substr(10, 10) + imm[9] + imm.substr(2, 8) + rd + opcode;
    }
    return "";
}

// Process .data segment
void processDataLine(const string& line, ofstream &mcFile) {
    stringstream ss(line);
    string label, directive;
    ss >> label;

    if (label.back() == ':') {
        label.pop_back();
        symbolTable[label] = currentDataAddress;
        if (!(ss >> directive)) return;
    } else return;

    if (directive == ".asciiz") {
        string strVal;
        getline(ss, strVal);
        strVal = trim(strVal);
        if (strVal.front() == '"' && strVal.back() == '"') {
            strVal = strVal.substr(1, strVal.size() - 2);
        }
        for (char c : strVal) {
            mcFile << "0x" << hex << currentDataAddress << " 0x" << hex << int(c) << "\n";
            currentDataAddress += 1;
        }
        mcFile << "0x" << hex << currentDataAddress << " 0x00\n";  // Null terminator
        currentDataAddress += 1;
        return;
    }

    string value;
    while (ss >> value) {
        value = trim(value);
        if (!value.empty() && value.back() == ',') value.pop_back();
        if (isNumber(value)) {
            int num = stoi(value);
            mcFile << "0x" << hex << currentDataAddress << " 0x" << hex << num << "\n";
            currentDataAddress += 4;
        } else {
            cerr << "Warning: Skipping invalid data entry: " << value << endl;
        }
    }
}

// Process Assembly File
void processAssemblyFile(const string& inputFile, const string& outputFile) {
    ifstream asm_file(inputFile);
    ofstream mc_file(outputFile);
    string line;

    while (getline(asm_file, line)) {
        line = trim(line);
        cout<<line<<endl;
        if (line.empty() || line[0] == '#') continue;

        if (line == ".text") { inTextSegment = true; inDataSegment = false;}
        else if (line == ".data") { inDataSegment = true; inTextSegment = false; }

        if (inDataSegment) processDataLine(line, mc_file);
        else if(inTextSegment){ 
   
    string line;
    vector<string> instructions;
    int address = 0x0;
   //cout<<"here"<<endl;
   // asm_file.seekg(0, ios::beg);
    // *First Pass: Store label locations*
    while (getline(asm_file, line)) {
        cout<<"oh"<<endl;
        cout<<line<<endl;
        istringstream iss(line);
        vector<string> tokens;
        string word;
        //cout<<"sto";
        while (iss >> word) {tokens.push_back(word);
        //cout<<word<<" ";

        }       
        //cout<<endl;

        if (!tokens.empty() && tokens[0].back() == ':') {
           //cout<<"ooh"<<endl;
            string label = tokens[0].substr(0, tokens[0].size() - 1);
            label_map[label] = address; 
            instructions.push_back(line);  
            address += 4;   
        } else {
            //cout<<"ph"<<endl;
            instructions.push_back(line);
            address += 4;
        }
    }
    asm_file.close();
    cout << "First pass completed!" << endl;
    for(auto i:label_map){
        cout<<i.first<<" "<<i.second<<endl;
    }
   

    address = 0x0;
    for (const auto &instr : instructions) {
        istringstream iss(instr);
        vector<string> tokens;
        string word;
        while (iss >> word) tokens.push_back(word);

        if (tokens.empty()) continue;  
        
       
        if (tokens[0].back() == ':') {
            
            tokens.erase(tokens.begin());
            if (tokens.empty()) continue;

        }

        string machine_code = convert_to_machine_code(tokens, address);
        string opcode = opcode_map[tokens[0]];
        string func3 = funct3_map[tokens[0]];
        string func7 = funct7_map[tokens[0]];
        string type = format_type[tokens[0]];
        string rd, rs1, rs2, imm;

        if (type == "R") {  // R-format
            rd = register_map[tokens[1]];
            rs1 = register_map[tokens[2]];
            rs2 = register_map[tokens[3]];
            imm = "NULL";
        }
        else if (type == "I") {  // I-format
            if (tokens[0] == "lw" || tokens[0] == "lh" || tokens[0] == "ld" || tokens[0] == "lb"){
            rd = register_map[tokens[1]];
            rs1 = register_map[tokens[3]];
            imm = bitset<12>(stoi(tokens[2])).to_string();
            rs2 = "NULL"; }   
        
            
            else{
            rd = register_map[tokens[1]];
            rs1 = register_map[tokens[2]];
            imm = bitset<12>(stoi(tokens[3])).to_string();
            rs2 = "NULL";
            }
            
        }  else if (type == "S") {
            rs1 = register_map[tokens[3]];
            rs2 = register_map[tokens[1]];
            imm = bitset<12>(stoi(tokens[2])).to_string();
            rd = "NULL";
 } else if (type == "B") {
            rs1 = register_map[tokens[1]];
            rs2 = register_map[tokens[2]];
            int offset = label_map[tokens[3]] - address;
            imm = bitset<13>(offset).to_string(); 
            rd = "NULL";
        }
        else if (type == "U") {
            rd = register_map[tokens[1]]; 
            int imm_value = stoi(tokens[2]); 
        
            imm_value = imm_value << 12;
           
            imm = bitset<32>(imm_value).to_string();  
            string imm = imm.substr(0, 20);
            rs1 = "NULL"; rs2 = "NULL"; 
        
            
        }
        
        else if (type == "J") {
            rd = register_map[tokens[1]];
            int offset = label_map[tokens[2]] - address;
      
            imm = bitset<21>(offset).to_string();
            rs1 = "NULL"; rs2 = "NULL";
        }
        
        if (!machine_code.empty()) {
            mc_file << "0x" << hex << address << " 0x" 
                    << bitset<32>(stoul(machine_code, 0, 2)).to_ulong() 
                    << " , " << instr << " # " << opcode << "-" << func3 << "-" << func7 
                    << "-" << "-" << rd << "-" << rs1 << "-" << rs2 
                    << "-" << imm << endl;
            address += 4;
        }
    }


        
    }else{
        string line;
    vector<string> instructions;
    int address = 0x0;
 

    // *First Pass: Store label locations*
    asm_file.seekg(0, ios::beg);

    while (getline(asm_file, line)) {
        istringstream iss(line);
        vector<string> tokens;
        string word;
        //cout<<"sto";
        while (iss >> word) {tokens.push_back(word);
       // cout<<word<<" ";

        }       
        

        if (!tokens.empty() && tokens[0].back() == ':') {
          
            string label = tokens[0].substr(0, tokens[0].size() - 1);
            label_map[label] = address; 
            instructions.push_back(line);  
            address += 4;   
        } else {
           
            instructions.push_back(line);
            address += 4;
        }
    }
    asm_file.close();
    cout << "First pass completed!" << endl;
    for(auto i:label_map){
        cout<<i.first<<" "<<i.second<<endl;
    }
   

    address = 0x0;
    for (const auto &instr : instructions) {
        istringstream iss(instr);
        vector<string> tokens;
        string word;
        while (iss >> word) tokens.push_back(word);
        

        if (tokens.empty()) continue;  
        
       
        if (tokens[0].back() == ':') {
            
            tokens.erase(tokens.begin());
            if (tokens.empty()) continue;

        }

       string machine_code = convert_to_machine_code(tokens, address);
        string opcode = opcode_map[tokens[0]];
        string func3 = funct3_map[tokens[0]];
        string func7 = funct7_map[tokens[0]];
        string type = format_type[tokens[0]];
        cout<<type<<endl;
        string rd, rs1, rs2, imm;

        if (type == "R") {  // R-format
            rd = register_map[tokens[1]];
            rs1 = register_map[tokens[2]];
            rs2 = register_map[tokens[3]];
            imm = "NULL";
        }
        else if (type == "I") {  // I-format
            if (tokens[0] == "lw" || tokens[0] == "lh" || tokens[0] == "ld" || tokens[0] == "lb"){
            rd = register_map[tokens[1]];
            rs1 = register_map[tokens[3]];
            imm = bitset<12>(stoi(tokens[2])).to_string();
            rs2 = "NULL"; }   
        
            
            else{
            rd = register_map[tokens[1]];
            rs1 = register_map[tokens[2]];
            imm = bitset<12>(stoi(tokens[3])).to_string();
            rs2 = "NULL";
            }
            
        }  else if (type == "S") {
            rs1 = register_map[tokens[3]];
            rs2 = register_map[tokens[1]];
            imm = bitset<12>(stoi(tokens[2])).to_string();
            rd = "NULL";
 } else if (type == "B") {
            rs1 = register_map[tokens[1]];
            rs2 = register_map[tokens[2]];
            int offset = label_map[tokens[3]] - address;
            imm = bitset<13>(offset).to_string(); 
            rd = "NULL";
        }
        else if (type == "U") {
            rd = register_map[tokens[1]];  
            int imm_value = stoi(tokens[2]);  
        
            // Extract upper 20 bits
            imm_value = imm_value << 12;
           
            imm = bitset<32>(imm_value).to_string();  
            string imm = imm.substr(0, 20);
            rs1 = "NULL"; rs2 = "NULL"; 
        
            
        }
        
        else if (type == "J") {
            rd = register_map[tokens[1]];
            int offset = label_map[tokens[2]] - address;
      
            imm = bitset<21>(offset).to_string();
            rs1 = "NULL"; rs2 = "NULL";
        }
        
        if (!machine_code.empty()) {
            mc_file << "0x" << hex << address << " 0x" 
                    << bitset<32>(stoul(machine_code, 0, 2)).to_ulong() 
                    << " , " << instr << " # " << opcode << "-" << func3 << "-" << func7 
                    << "-" << "-" << rd << "-" << rs1 << "-" << rs2 
                    << "-" << imm << endl;
            address += 4;
        }
    }


        }
    }
   mc_file<<"0x"<<" "<<"Done_assembling"<<endl;
    asm_file.close();
    mc_file.close();
}

int main() {
    init_register_map();
    processAssemblyFile("input.asm", "output.mc");
    
    
    return 0;
}