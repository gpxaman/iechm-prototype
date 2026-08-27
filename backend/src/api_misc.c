#include "api.h"
#include "db.h"
#include "json_util.h"

#include <stdlib.h>
#include <string.h>
#include <time.h>

/* ---------------- notifications ---------------- */
HttpResponse api_notifications_list(HttpRequest *req, const char *param) {
    (void)req; (void)param;
    db_lock();
    cJSON *arr = cJSON_CreateArray();
    sqlite3_stmt *st;
    sqlite3_prepare_v2(g_db, "SELECT id,type,title,time,read FROM notifications ORDER BY time DESC", -1, &st, NULL);
    while (sqlite3_step(st) == SQLITE_ROW) {
        cJSON *o = cJSON_CreateObject();
        cJSON_AddStringToObject(o, "id", col_text(st, 0));
        cJSON_AddStringToObject(o, "type", col_text(st, 1));
        cJSON_AddStringToObject(o, "title", col_text(st, 2));
        cJSON_AddNumberToObject(o, "time", (double)sqlite3_column_int64(st, 3) * 1000.0);
        cJSON_AddBoolToObject(o, "read", sqlite3_column_int(st, 4) != 0);
        cJSON_AddItemToArray(arr, o);
    }
    sqlite3_finalize(st);
    db_unlock();
    return http_json(200, json_to_body(arr));
}

/* ---------------- orders ---------------- */
static cJSON *order_row_json(sqlite3_stmt *st) {
    cJSON *o = cJSON_CreateObject();
    cJSON_AddStringToObject(o, "id", col_text(st, 0));
    cJSON_AddStringToObject(o, "name", col_text(st, 1));
    cJSON_AddNumberToObject(o, "total", sqlite3_column_double(st, 2));
    cJSON_AddStringToObject(o, "status", col_text(st, 3));
    cJSON_AddNumberToObject(o, "date", (double)sqlite3_column_int64(st, 4) * 1000.0);
    return o;
}

HttpResponse api_orders_list(HttpRequest *req, const char *param) {
    (void)req; (void)param;
    db_lock();
    cJSON *arr = cJSON_CreateArray();
    sqlite3_stmt *st;
    sqlite3_prepare_v2(g_db, "SELECT id,name,total,status,date FROM orders ORDER BY date DESC", -1, &st, NULL);
    while (sqlite3_step(st) == SQLITE_ROW) cJSON_AddItemToArray(arr, order_row_json(st));
    sqlite3_finalize(st);
    db_unlock();
    return http_json(200, json_to_body(arr));
}

HttpResponse api_orders_create(HttpRequest *req, const char *param) {
    (void)param;
    cJSON *body = json_parse_body(req->body);
    if (!body) return http_text_error(400, "invalid JSON body");
    char id[32];
    db_gen_id("o", id, sizeof(id));
    const char *name = json_get_str(body, "name", "Order");
    double total = json_get_num(body, "total", 0);

    db_lock();
    sqlite3_stmt *st;
    sqlite3_prepare_v2(g_db, "INSERT INTO orders(id,name,total,status,date) VALUES(?,?,?,'Submitted',strftime('%s','now'))", -1, &st, NULL);
    sqlite3_bind_text(st, 1, id, -1, SQLITE_STATIC);
    sqlite3_bind_text(st, 2, name, -1, SQLITE_TRANSIENT);
    sqlite3_bind_double(st, 3, total);
    sqlite3_step(st);
    sqlite3_finalize(st);
    /* clear the cart on checkout */
    sqlite3_exec(g_db, "DELETE FROM cart", NULL, NULL, NULL);

    sqlite3_stmt *gst;
    sqlite3_prepare_v2(g_db, "SELECT id,name,total,status,date FROM orders WHERE id=?", -1, &gst, NULL);
    sqlite3_bind_text(gst, 1, id, -1, SQLITE_STATIC);
    sqlite3_step(gst);
    cJSON *result = order_row_json(gst);
    sqlite3_finalize(gst);
    db_unlock();
    cJSON_Delete(body);
    return http_json(201, json_to_body(result));
}

/* ---------------- cart ---------------- */
HttpResponse api_cart_list(HttpRequest *req, const char *param) {
    (void)req; (void)param;
    db_lock();
    cJSON *arr = cJSON_CreateArray();
    sqlite3_stmt *st;
    sqlite3_prepare_v2(g_db,
        "SELECT c.product_id, c.qty, p.name, p.price, p.category, p.moq, p.lead_time_days, p.stock "
        "FROM cart c JOIN products p ON p.id = c.product_id", -1, &st, NULL);
    while (sqlite3_step(st) == SQLITE_ROW) {
        cJSON *o = cJSON_CreateObject();
        cJSON_AddStringToObject(o, "productId", col_text(st, 0));
        cJSON_AddNumberToObject(o, "qty", sqlite3_column_int(st, 1));
        cJSON_AddStringToObject(o, "name", col_text(st, 2));
        cJSON_AddNumberToObject(o, "price", sqlite3_column_double(st, 3));
        cJSON_AddStringToObject(o, "category", col_text(st, 4));
        cJSON_AddNumberToObject(o, "moq", sqlite3_column_int(st, 5));
        cJSON_AddNumberToObject(o, "leadTimeDays", sqlite3_column_int(st, 6));
        cJSON_AddStringToObject(o, "stock", col_text(st, 7));
        cJSON_AddItemToArray(arr, o);
    }
    sqlite3_finalize(st);
    db_unlock();
    return http_json(200, json_to_body(arr));
}

HttpResponse api_cart_add(HttpRequest *req, const char *param) {
    (void)param;
    cJSON *body = json_parse_body(req->body);
    if (!body) return http_text_error(400, "invalid JSON body");
    const char *product_id = json_get_str(body, "productId", NULL);
    int qty = (int)json_get_num(body, "qty", 1);
    if (!product_id || qty <= 0) { cJSON_Delete(body); return http_text_error(400, "productId and positive qty required"); }

    db_lock();
    sqlite3_stmt *st;
    sqlite3_prepare_v2(g_db,
        "INSERT INTO cart(product_id, qty) VALUES(?, ?) "
        "ON CONFLICT(product_id) DO UPDATE SET qty = qty + excluded.qty", -1, &st, NULL);
    sqlite3_bind_text(st, 1, product_id, -1, SQLITE_TRANSIENT);
    sqlite3_bind_int(st, 2, qty);
    sqlite3_step(st);
    sqlite3_finalize(st);
    db_unlock();
    cJSON_Delete(body);
    return api_cart_list(req, NULL);
}

HttpResponse api_cart_remove(HttpRequest *req, const char *param) {
    db_lock();
    sqlite3_stmt *st;
    sqlite3_prepare_v2(g_db, "DELETE FROM cart WHERE product_id=?", -1, &st, NULL);
    sqlite3_bind_text(st, 1, param, -1, SQLITE_STATIC);
    sqlite3_step(st);
    sqlite3_finalize(st);
    db_unlock();
    return api_cart_list(req, NULL);
}

/* ---------------- user ---------------- */
static cJSON *user_row_json(sqlite3_stmt *st) {
    cJSON *o = cJSON_CreateObject();
    cJSON_AddStringToObject(o, "name", col_text(st, 0));
    cJSON_AddStringToObject(o, "email", col_text(st, 1));
    cJSON_AddStringToObject(o, "company", col_text(st, 2));
    cJSON_AddBoolToObject(o, "isPartner", sqlite3_column_int(st, 3) != 0);
    cJSON_AddBoolToObject(o, "isSupplier", sqlite3_column_int(st, 4) != 0);
    cJSON_AddStringToObject(o, "mode", col_text(st, 5));
    return o;
}

HttpResponse api_user_get(HttpRequest *req, const char *param) {
    (void)req; (void)param;
    db_lock();
    sqlite3_stmt *st;
    sqlite3_prepare_v2(g_db, "SELECT name,email,company,is_partner,is_supplier,mode FROM user WHERE id=1", -1, &st, NULL);
    sqlite3_step(st);
    cJSON *result = user_row_json(st);
    sqlite3_finalize(st);
    db_unlock();
    return http_json(200, json_to_body(result));
}

HttpResponse api_user_update(HttpRequest *req, const char *param) {
    (void)param;
    cJSON *body = json_parse_body(req->body);
    if (!body) return http_text_error(400, "invalid JSON body");

    db_lock();
    sqlite3_stmt *st;
    sqlite3_prepare_v2(g_db,
        "UPDATE user SET "
        "name = COALESCE(?, name), email = COALESCE(?, email), company = COALESCE(?, company), "
        "is_partner = COALESCE(?, is_partner), is_supplier = COALESCE(?, is_supplier), "
        "mode = COALESCE(?, mode) WHERE id=1", -1, &st, NULL);
    cJSON *v;
    v = cJSON_GetObjectItemCaseSensitive(body, "name");
    if (v && cJSON_IsString(v)) sqlite3_bind_text(st, 1, v->valuestring, -1, SQLITE_TRANSIENT); else sqlite3_bind_null(st, 1);
    v = cJSON_GetObjectItemCaseSensitive(body, "email");
    if (v && cJSON_IsString(v)) sqlite3_bind_text(st, 2, v->valuestring, -1, SQLITE_TRANSIENT); else sqlite3_bind_null(st, 2);
    v = cJSON_GetObjectItemCaseSensitive(body, "company");
    if (v && cJSON_IsString(v)) sqlite3_bind_text(st, 3, v->valuestring, -1, SQLITE_TRANSIENT); else sqlite3_bind_null(st, 3);
    v = cJSON_GetObjectItemCaseSensitive(body, "isPartner");
    if (v) sqlite3_bind_int(st, 4, cJSON_IsTrue(v) ? 1 : 0); else sqlite3_bind_null(st, 4);
    v = cJSON_GetObjectItemCaseSensitive(body, "isSupplier");
    if (v) sqlite3_bind_int(st, 5, cJSON_IsTrue(v) ? 1 : 0); else sqlite3_bind_null(st, 5);
    v = cJSON_GetObjectItemCaseSensitive(body, "mode");
    if (v && cJSON_IsString(v)) sqlite3_bind_text(st, 6, v->valuestring, -1, SQLITE_TRANSIENT); else sqlite3_bind_null(st, 6);
    sqlite3_step(st);
    sqlite3_finalize(st);
    db_unlock();
    cJSON_Delete(body);
    return api_user_get(req, NULL);
}

/* ---------------- catalogue scan (mock AI extraction) ---------------- */
HttpResponse api_catalogue_scan(HttpRequest *req, const char *param) {
    (void)param;
    cJSON *body = json_parse_body(req->body);
    const char *file_name = json_get_str(body, "fileName", "catalogue.pdf");

    srand((unsigned)time(NULL) ^ (unsigned)(size_t)req);
    int total = 300 + rand() % 80;
    int need_moq = 8 + rand() % 8;
    int need_price = 4 + rand() % 6;
    int need_spec = 2 + rand() % 5;

    cJSON *o = cJSON_CreateObject();
    cJSON_AddStringToObject(o, "fileName", file_name);
    cJSON_AddNumberToObject(o, "total", total);
    cJSON_AddNumberToObject(o, "needMoq", need_moq);
    cJSON_AddNumberToObject(o, "needPrice", need_price);
    cJSON_AddNumberToObject(o, "needSpec", need_spec);
    cJSON_AddNumberToObject(o, "ready", total - need_moq - need_price - need_spec);
    if (body) cJSON_Delete(body);
    return http_json(200, json_to_body(o));
}
