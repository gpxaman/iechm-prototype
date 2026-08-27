#include "api.h"
#include "db.h"
#include "json_util.h"

#include <stdio.h>
#include <string.h>

HttpResponse api_health(HttpRequest *req, const char *param) {
    (void)req; (void)param;
    cJSON *o = cJSON_CreateObject();
    cJSON_AddStringToObject(o, "status", "ok");
    cJSON_AddStringToObject(o, "service", "iechm-backend");
    return http_json(200, json_to_body(o));
}

HttpResponse api_categories_list(HttpRequest *req, const char *param) {
    (void)req; (void)param;
    db_lock();
    cJSON *arr = cJSON_CreateArray();
    sqlite3_stmt *st;
    sqlite3_prepare_v2(g_db, "SELECT id,name,icon FROM categories", -1, &st, NULL);
    while (sqlite3_step(st) == SQLITE_ROW) {
        cJSON *o = cJSON_CreateObject();
        cJSON_AddStringToObject(o, "id", col_text(st, 0));
        cJSON_AddStringToObject(o, "name", col_text(st, 1));
        cJSON_AddStringToObject(o, "icon", col_text(st, 2));
        cJSON_AddItemToArray(arr, o);
    }
    sqlite3_finalize(st);
    db_unlock();
    return http_json(200, json_to_body(arr));
}

static cJSON *product_row_json(sqlite3_stmt *st) {
    cJSON *o = cJSON_CreateObject();
    cJSON_AddStringToObject(o, "id", col_text(st, 0));
    cJSON_AddStringToObject(o, "name", col_text(st, 1));
    cJSON_AddStringToObject(o, "category", col_text(st, 2));
    cJSON_AddNumberToObject(o, "price", sqlite3_column_double(st, 3));
    cJSON_AddNumberToObject(o, "moq", sqlite3_column_int(st, 4));
    cJSON_AddNumberToObject(o, "leadTimeDays", sqlite3_column_int(st, 5));
    cJSON_AddStringToObject(o, "stock", col_text(st, 6));
    cJSON_AddStringToObject(o, "description", col_text(st, 7));
    cJSON *specs = cJSON_Parse(col_text(st, 8));
    cJSON_AddItemToObject(o, "specs", specs ? specs : cJSON_CreateObject());
    return o;
}

#define PRODUCT_COLS "id,name,category,price,moq,lead_time_days,stock,description,specs"

HttpResponse api_products_list(HttpRequest *req, const char *param) {
    (void)param;
    char category[128] = {0}, q[256] = {0};
    http_query_param(req->query, "category", category, sizeof(category));
    http_query_param(req->query, "q", q, sizeof(q));

    db_lock();
    cJSON *arr = cJSON_CreateArray();
    sqlite3_stmt *st;
    sqlite3_prepare_v2(g_db,
        "SELECT " PRODUCT_COLS " FROM products WHERE "
        "(?1 = '' OR category = ?1) AND "
        "(?2 = '' OR name LIKE ?2 OR description LIKE ?2 OR category LIKE ?2) "
        "ORDER BY id", -1, &st, NULL);
    sqlite3_bind_text(st, 1, category, -1, SQLITE_STATIC);
    if (q[0]) {
        char like[300];
        snprintf(like, sizeof(like), "%%%s%%", q);
        sqlite3_bind_text(st, 2, like, -1, SQLITE_TRANSIENT);
    } else {
        sqlite3_bind_text(st, 2, "", -1, SQLITE_STATIC);
    }
    while (sqlite3_step(st) == SQLITE_ROW) cJSON_AddItemToArray(arr, product_row_json(st));
    sqlite3_finalize(st);
    db_unlock();
    return http_json(200, json_to_body(arr));
}

HttpResponse api_products_get(HttpRequest *req, const char *param) {
    (void)req;
    db_lock();
    sqlite3_stmt *st;
    sqlite3_prepare_v2(g_db, "SELECT " PRODUCT_COLS " FROM products WHERE id=?", -1, &st, NULL);
    sqlite3_bind_text(st, 1, param, -1, SQLITE_STATIC);
    HttpResponse res;
    if (sqlite3_step(st) == SQLITE_ROW) {
        res = http_json(200, json_to_body(product_row_json(st)));
    } else {
        res = http_text_error(404, "product not found");
    }
    sqlite3_finalize(st);
    db_unlock();
    return res;
}

HttpResponse api_products_similar(HttpRequest *req, const char *param) {
    (void)req;
    db_lock();
    char category[64] = {0};
    sqlite3_stmt *cst;
    sqlite3_prepare_v2(g_db, "SELECT category FROM products WHERE id=?", -1, &cst, NULL);
    sqlite3_bind_text(cst, 1, param, -1, SQLITE_STATIC);
    if (sqlite3_step(cst) == SQLITE_ROW) {
        strncpy(category, (const char *)sqlite3_column_text(cst, 0), sizeof(category) - 1);
    }
    sqlite3_finalize(cst);

    cJSON *arr = cJSON_CreateArray();
    if (category[0]) {
        sqlite3_stmt *st;
        sqlite3_prepare_v2(g_db,
            "SELECT " PRODUCT_COLS " FROM products WHERE category=? AND id<>? LIMIT 4", -1, &st, NULL);
        sqlite3_bind_text(st, 1, category, -1, SQLITE_STATIC);
        sqlite3_bind_text(st, 2, param, -1, SQLITE_STATIC);
        while (sqlite3_step(st) == SQLITE_ROW) cJSON_AddItemToArray(arr, product_row_json(st));
        sqlite3_finalize(st);
    }
    db_unlock();
    return http_json(200, json_to_body(arr));
}
