#ifndef IECHM_DB_H
#define IECHM_DB_H

#include <stddef.h>

#include "vendor/sqlite3.h"

/* Opens (creating if needed) the SQLite database at `path`, creates the
 * schema if missing, and seeds it with demo data on first run only (i.e. if
 * the products table is empty). Exits the process on unrecoverable error. */
void db_init(const char *path);

/* The single shared connection + the mutex guarding all access to it.
 * SQLite's amalgamation is built in serialized threading mode by default,
 * but we still serialize access ourselves so multi-statement operations
 * (e.g. "insert project, then insert N requirements") are atomic from the
 * API's point of view. */
extern sqlite3 *g_db;
void db_lock(void);
void db_unlock(void);

/* Generates a short unique id like "prefix_<hex>", writing into `out`
 * (must be >= 20 bytes). Not cryptographically strong - fine for a local
 * demo dataset. */
void db_gen_id(const char *prefix, char *out, size_t outsz);

#endif
