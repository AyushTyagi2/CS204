#!/bin/sh

# Navigate to the executables directory
cd src/executables_phase2

# Compile the C++ executable
#echo "🔧 Compiling myriscvsim.cpp..."
#g++ -Wall -Wextra -g main.cpp myRISCVSim.cpp json.cpp -o myRISCVSim.out

# Check if compilation was successful
#if [ $? -eq 0 ]; then
#    echo "✅ Compilation successful!"
#else
#    echo "❌ Compilation failed!"
#    exit 1
#fi

# Give execute permissions
chmod +x myRISCVSim.exe

# Run the compiled executable
echo "🚀 Running myRISCVSim.out..."
./myRISCVSim.exe ../executables_phase1/output.mc
