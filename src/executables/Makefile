CC = g++
CFLAGS = -Wall -Wextra -g  # No need to specify include path if json.hpp is in the same folder
SRC = main.cpp myRISCVSim.cpp json.cpp
OBJ = $(SRC:.cpp=.o)
EXEC = myRISCVSim

all: $(EXEC)

$(EXEC): $(OBJ)
	$(CC) $(CFLAGS) $(OBJ) -o $(EXEC)

%.o: %.cpp
	$(CC) $(CFLAGS) -c $< -o $@

clean:
	del /Q *.o *.bak myRISCVSim.exe
