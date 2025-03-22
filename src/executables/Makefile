CC = g++
CFLAGS = -Wall -Wextra -g
SRC = main.cpp myRISCVSim.cpp json.cpp
OBJ = $(SRC:.cpp=.o)
EXEC = 1.out  # Forces the output file to be 1.out

all: $(EXEC)

$(EXEC): $(OBJ)
	$(CC) $(CFLAGS) $(OBJ) -o $(EXEC)

%.o: %.cpp
	$(CC) $(CFLAGS) -c $< -o $@

clean:
	del /Q *.o *.bak $(EXEC)  # Windows del command (no rm)
