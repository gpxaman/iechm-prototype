CC := zig cc
CFLAGS := -O2 -Isrc -Wall -Wno-unused-parameter
LDFLAGS := -lpthread -ldl -lm

SRC := $(wildcard src/*.c) vendor/sqlite3.c vendor/cJSON.c
OBJDIR := build
OBJ := $(patsubst %.c,$(OBJDIR)/%.o,$(notdir $(SRC)))
VPATH := src:vendor

BIN := iechm-backend

.PHONY: all clean run

all: $(BIN)

$(OBJDIR):
	mkdir -p $(OBJDIR)

$(OBJDIR)/%.o: %.c | $(OBJDIR)
	$(CC) $(CFLAGS) -c $< -o $@

$(BIN): $(OBJ)
	$(CC) $(OBJ) $(LDFLAGS) -o $(BIN)

run: $(BIN)
	mkdir -p data
	./$(BIN)

clean:
	rm -rf $(OBJDIR) $(BIN)
