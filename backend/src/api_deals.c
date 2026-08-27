#include "api.h"
#include "db.h"
#include "json_util.h"

#include <string.h>

#define DEAL_COLS "id,customer,contact,need,value,status,notes,created_at,commission,paid"

static cJSON *deal_row_json(sqlite3_stmt *st) {
    cJSON *o = cJSON_CreateObject();
    cJSON_AddStringToObject(o, "id", col_text(st, 0));
    cJSON_AddStringToObject(o, "customer", col_text(st, 1));
    cJSON_AddStringToObject(o, "contact", col_text(st, 2));
    cJSON_AddStringToObject(o, "need", col_text(st, 3));
    cJSON_AddNumberToObject(o, "value", sqlite3_column_double(st, 4));
    cJSON_AddStringToObject(o, "status", col_text(st, 5));
    cJSON_AddStringToObject(o, "notes", col_text(st, 6));
    cJSON_AddNumberToObject(o, "createdAt", (double)sqlite3_column_int64(st, 7) * 1000.0);
    cJSON_AddNumberToObject(o, "commission", sqlite3_column_double(st, 8));
    cJSON_AddBoolToObject(o, "paid", sqlite3_column_int(st, 9) != 0);
    return o;
}

HttpResponse api_deals_list(HttpRequest *req, const char *param) {
    (void)req; (void)param;
    db_lock();
    cJSON *arr = cJSON_CreateArray();
    sqlite3_stmt *st;
    sqlite3_prepare_v2(g_db, "SELECT " DEAL_COLS " FROM deals ORDER BY created_at DESC", -1, &st, NULL);
    while (sqlite3_step(st) == SQLITE_ROW) cJSON_AddItemToArray(arr, deal_row_json(st));
    sqlite3_finalize(st);
    db_unlock();
    return http_json(200, json_to_body(arr));
}

HttpResponse api_deals_get(HttpRequest *req, const char *param) {
    (void)req;
    db_lock();
    sqlite3_stmt *st;
    sqlite3_prepare_v2(g_db, "SELECT " DEAL_COLS " FROM deals WHERE id=?", -1, &st, NULL);
    sqlite3_bind_text(st, 1, param, -1, SQLITE_STATIC);
    HttpResponse res;
    if (sqlite3_step(st) == SQLITE_ROW) res = http_json(200, json_to_body(deal_row_json(st)));
    else res = http_text_error(404, "deal not found");
    sqlite3_finalize(st);
    db_unlock();
    return res;
}

HttpResponse api_deals_create(HttpRequest *req, const char *param) {
    (void)param;
    cJSON *body = json_parse_body(req->body);
    if (!body) return http_text_error(400, "invalid JSON body");

    char id[32];
    db_gen_id("d", id, sizeof(id));
    const char *customer = json_get_str(body, "customer", "New opportunity");
    const char *contact = json_get_str(body, "contact", "Contact pending");
    const char *need = json_get_str(body, "need", "Details pending");
    const char *notes = json_get_str(body, "notes", "");
    double value = json_get_num(body, "value", 5000);
    double commission = value * 0.06;

    db_lock();
    sqlite3_stmt *st;
    sqlite3_prepare_v2(g_db,
        "INSERT INTO deals(id,customer,contact,need,value,status,notes,created_at,commission,paid) "
        "VALUES(?,?,?,?,?,'submitted',?,strftime('%s','now'),?,0)", -1, &st, NULL);
    sqlite3_bind_text(st, 1, id, -1, SQLITE_STATIC);
    sqlite3_bind_text(st, 2, customer, -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(st, 3, contact, -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(st, 4, need, -1, SQLITE_TRANSIENT);
    sqlite3_bind_double(st, 5, value);
    sqlite3_bind_text(st, 6, notes, -1, SQLITE_TRANSIENT);
    sqlite3_bind_double(st, 7, commission);
    sqlite3_step(st);
    sqlite3_finalize(st);

    sqlite3_stmt *gst;
    sqlite3_prepare_v2(g_db, "SELECT " DEAL_COLS " FROM deals WHERE id=?", -1, &gst, NULL);
    sqlite3_bind_text(gst, 1, id, -1, SQLITE_STATIC);
    sqlite3_step(gst);
    cJSON *result = deal_row_json(gst);
    sqlite3_finalize(gst);
    db_unlock();
    cJSON_Delete(body);
    return http_json(201, json_to_body(result));
}

HttpResponse api_deals_update(HttpRequest *req, const char *param) {
    cJSON *body = json_parse_body(req->body);
    if (!body) return http_text_error(400, "invalid JSON body");
    const char *status = json_get_str(body, "status", NULL);

    db_lock();
    if (status) {
        sqlite3_stmt *st;
        sqlite3_prepare_v2(g_db, "UPDATE deals SET status=? WHERE id=?", -1, &st, NULL);
        sqlite3_bind_text(st, 1, status, -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(st, 2, param, -1, SQLITE_STATIC);
        sqlite3_step(st);
        sqlite3_finalize(st);
    }
    sqlite3_stmt *gst;
    sqlite3_prepare_v2(g_db, "SELECT " DEAL_COLS " FROM deals WHERE id=?", -1, &gst, NULL);
    sqlite3_bind_text(gst, 1, param, -1, SQLITE_STATIC);
    HttpResponse res;
    if (sqlite3_step(gst) == SQLITE_ROW) res = http_json(200, json_to_body(deal_row_json(gst)));
    else res = http_text_error(404, "deal not found");
    sqlite3_finalize(gst);
    db_unlock();
    cJSON_Delete(body);
    return res;
}
