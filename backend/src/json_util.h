#ifndef IECHM_JSON_UTIL_H
#define IECHM_JSON_UTIL_H

#include "vendor/cJSON.h"
#include "vendor/sqlite3.h"

/* text column helper: returns "" instead of NULL-deref if the column is NULL */
const char *col_text(sqlite3_stmt *st, int idx);

/* Serializes a whole cJSON value to a heap string ready for HttpResponse.body.
 * Caller owns the returned pointer (must free). Frees `root`. */
char *json_to_body(cJSON *root);

/* Parses req->body as JSON. Returns NULL on empty/invalid body (caller should
 * treat as a 400). Caller must cJSON_Delete() the result. */
cJSON *json_parse_body(const char *body);

/* Convenience getters on a parsed JSON object; return default_ if missing/wrong type. */
const char *json_get_str(cJSON *obj, const char *key, const char *default_);
double json_get_num(cJSON *obj, const char *key, double default_);
int json_get_bool(cJSON *obj, const char *key, int default_);

#endif
