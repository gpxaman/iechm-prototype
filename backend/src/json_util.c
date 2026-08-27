#include "json_util.h"
#include <string.h>

const char *col_text(sqlite3_stmt *st, int idx) {
    const unsigned char *t = sqlite3_column_text(st, idx);
    return t ? (const char *)t : "";
}

char *json_to_body(cJSON *root) {
    char *s = cJSON_PrintUnformatted(root);
    cJSON_Delete(root);
    return s; /* cJSON allocates with its own malloc hooks (default = libc malloc), safe to free() by caller */
}

cJSON *json_parse_body(const char *body) {
    if (!body || !*body) return NULL;
    return cJSON_Parse(body);
}

const char *json_get_str(cJSON *obj, const char *key, const char *default_) {
    if (!obj) return default_;
    cJSON *v = cJSON_GetObjectItemCaseSensitive(obj, key);
    if (v && cJSON_IsString(v)) return v->valuestring;
    return default_;
}

double json_get_num(cJSON *obj, const char *key, double default_) {
    if (!obj) return default_;
    cJSON *v = cJSON_GetObjectItemCaseSensitive(obj, key);
    if (v && cJSON_IsNumber(v)) return v->valuedouble;
    return default_;
}

int json_get_bool(cJSON *obj, const char *key, int default_) {
    if (!obj) return default_;
    cJSON *v = cJSON_GetObjectItemCaseSensitive(obj, key);
    if (v && cJSON_IsBool(v)) return cJSON_IsTrue(v) ? 1 : 0;
    if (v && cJSON_IsNumber(v)) return v->valuedouble != 0;
    return default_;
}
