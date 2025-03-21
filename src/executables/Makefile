CC = g++
CFLAGS = -Wall -Wextra -g
SRC = main.cpp myRISCVSim.cpp json.cpp
OBJ = $(SRC:.cpp=.o)
EXEC = myRISCVSim

all: $(EXEC)

$(EXEC): $(OBJ)
	$(CC) $(CFLAGS) $(OBJ) -o $(EXEC)

%.o: %.cpp
	$(CC) $(CFLAGS) -c $< -o $@

clean:
	rm -f *.o *.bak $(EXEC)  # Use `rm -f` instead of `del /Q`
