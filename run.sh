#!/bin/sh

# Navigate to the executables directory
cd /app/src/executables

# Compile the C++ executable
echo "🔧 Compiling 1.c++..."
g++ -o 1.out 1.c++

# Check if compilation was successful
if [ $? -eq 0 ]; then
    echo "✅ Compilation successful!"
else
    echo "❌ Compilation failed!"
    exit 1
fi

# Give execute permissions
chmod +x 1.out

# Run the compiled executable
echo "🚀 Running 1.out..."
./1.out
