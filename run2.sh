#!/bin/sh

# Navigate to the executables directory
cd /app/src/executables

# Compile the C++ executable
echo "🔧 Compiling myriscvsim.c++..."
g++ -Wall -Wextra -g main.cpp myRISCVsim.cpp json.cpp -o myRISCVSim.out

# Check if compilation was successful
if [ $? -eq 0 ]; then
    echo "✅ Compilation successful!"
else
    echo "❌ Compilation failed!"
    exit 1
fi

# Give execute permissions
chmod +x myRISCVSim.out

# Run the compiled executable
echo "🚀 Running myRISCVSim.out..."
./myRISCVSim.out output.mc
