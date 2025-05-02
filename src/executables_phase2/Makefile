# Compiler
CC = g++
CXXFLAGS = -Wall -Wextra -g -std=c++17

# Source and Output Files
SRC = main.cpp myRISCVSim.cpp json.cpp
OBJ = $(SRC:.cpp=.o)
EXEC = myRISCVSim.exe

# Default target
all: $(EXEC)

# Linking the final executable
$(EXEC): $(OBJ)
	$(CC) $(CXXFLAGS) $(OBJ) -o $(EXEC)

# Compiling .cpp files to .o
%.o: %.cpp
	$(CC) $(CXXFLAGS) -c $< -o $@

# Clean build artifacts
clean:
	del /Q *.o *.obj *.bak $(EXEC) 2>nul || true
