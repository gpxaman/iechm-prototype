#include "api.h"
#include "db.h"
#include "json_util.h"

#include <stdlib.h>
#include <string.h>

#define CR_COLS "id,title,description,material,dims,quantity,finish,timeline,status,project_id,files"

static cJSON *custom_request_row_json(sqlite3_stmt *st) {
    cJSON *o = cJSON_CreateObject();
    cJSON_AddStringToObject(o, "id", col_text(st, 0));
    cJSON_AddStringToObject(o, "title", col_text(st, 1));
    cJSON_AddStringToObject(o, "description", col_text(st, 2));
    cJSON_AddStringToObject(o, "material", col_text(st, 3));
    cJSON_AddStringToObject(o, "dims", col_text(st, 4));
    cJSON_AddStringToObject(o, "quantity", col_text(st, 5));
    cJSON_AddStringToObject(o, "finish", col_text(st, 6));
    cJSON_AddStringToObject(o, "timeline", col_text(st, 7));
    cJSON_AddStringToObject(o, "status", col_text(st, 8));
    const char *pid = col_text(st, 9);
    if (pid[0]) cJSON_AddStringToObject(o, "projectId", pid); else cJSON_AddNullToObject(o, "projectId");
    cJSON *files = cJSON_Parse(col_text(st, 10));
    cJSON_AddItemToObject(o, "files", files ? files : cJSON_CreateArray());
    return o;
}

HttpResponse api_custom_requests_list(HttpRequest *req, const char *param) {
    (void)req; (void)param;
    db_lock();
    cJSON *arr = cJSON_CreateArray();
    sqlite3_stmt *st;
    sqlite3_prepare_v2(g_db, "SELECT " CR_COLS " FROM custom_requests ORDER BY created_at DESC", -1, &st, NULL);
    while (sqlite3_step(st) == SQLITE_ROW) cJSON_AddItemToArray(arr, custom_request_row_json(st));
    sqlite3_finalize(st);
    db_unlock();
    return http_json(200, json_to_body(arr));
}

HttpResponse api_custom_requests_get(HttpRequest *req, const char *param) {
    (void)req;
    db_lock();
    sqlite3_stmt *st;
    sqlite3_prepare_v2(g_db, "SELECT " CR_COLS " FROM custom_requests WHERE id=?", -1, &st, NULL);
    sqlite3_bind_text(st, 1, param, -1, SQLITE_STATIC);
    HttpResponse res;
    if (sqlite3_step(st) == SQLITE_ROW) res = http_json(200, json_to_body(custom_request_row_json(st)));
    else res = http_text_error(404, "custom request not found");
    sqlite3_finalize(st);
    db_unlock();
    return res;
}

HttpResponse api_custom_requests_create(HttpRequest *req, const char *param) {
    (void)param;
    cJSON *body = json_parse_body(req->body);
    if (!body) return http_text_error(400, "invalid JSON body");

    char id[32];
    db_gen_id("cr", id, sizeof(id));
    const char *title = json_get_str(body, "title", "Custom component");
    const char *description = json_get_str(body, "description", "");
    const char *material = json_get_str(body, "material", "Not specified");
    const char *dims = json_get_str(body, "dims", "Not specified");
    const char *quantity = json_get_str(body, "quantity", "Not specified");
    const char *finish = json_get_str(body, "finish", "Not specified");
    const char *timeline = json_get_str(body, "timeline", "30 days (estimated)");
    const char *project_id = json_get_str(body, "projectId", NULL);
    cJSON *files = cJSON_GetObjectItemCaseSensitive(body, "files");
    char *files_json = files && cJSON_IsArray(files) ? cJSON_PrintUnformatted(files) : NULL;

    db_lock();
    sqlite3_stmt *st;
    sqlite3_prepare_v2(g_db,
        "INSERT INTO custom_requests(id,title,description,material,dims,quantity,finish,timeline,status,project_id,files,created_at) "
        "VALUES(?,?,?,?,?,?,?,?,'submitted',?,?,strftime('%s','now'))", -1, &st, NULL);
    sqlite3_bind_text(st, 1, id, -1, SQLITE_STATIC);
    sqlite3_bind_text(st, 2, title, -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(st, 3, description, -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(st, 4, material, -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(st, 5, dims, -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(st, 6, quantity, -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(st, 7, finish, -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(st, 8, timeline, -1, SQLITE_TRANSIENT);
    if (project_id) sqlite3_bind_text(st, 9, project_id, -1, SQLITE_TRANSIENT); else sqlite3_bind_null(st, 9);
    sqlite3_bind_text(st, 10, files_json ? files_json : "[]", -1, SQLITE_TRANSIENT);
    sqlite3_step(st);
    sqlite3_finalize(st);
    free(files_json);

    sqlite3_stmt *gst;
    sqlite3_prepare_v2(g_db, "SELECT " CR_COLS " FROM custom_requests WHERE id=?", -1, &gst, NULL);
    sqlite3_bind_text(gst, 1, id, -1, SQLITE_STATIC);
    sqlite3_step(gst);
    cJSON *result = custom_request_row_json(gst);
    sqlite3_finalize(gst);
    db_unlock();
    cJSON_Delete(body);
    return http_json(201, json_to_body(result));
}

HttpResponse api_custom_requests_update(HttpRequest *req, const char *param) {
    cJSON *body = json_parse_body(req->body);
    if (!body) return http_text_error(400, "invalid JSON body");
    const char *status = json_get_str(body, "status", NULL);

    db_lock();
    if (status) {
        sqlite3_stmt *st;
        sqlite3_prepare_v2(g_db, "UPDATE custom_requests SET status=? WHERE id=?", -1, &st, NULL);
        sqlite3_bind_text(st, 1, status, -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(st, 2, param, -1, SQLITE_STATIC);
        sqlite3_step(st);
        sqlite3_finalize(st);
    }
    sqlite3_stmt *gst;
    sqlite3_prepare_v2(g_db, "SELECT " CR_COLS " FROM custom_requests WHERE id=?", -1, &gst, NULL);
    sqlite3_bind_text(gst, 1, param, -1, SQLITE_STATIC);
    HttpResponse res;
    if (sqlite3_step(gst) == SQLITE_ROW) res = http_json(200, json_to_body(custom_request_row_json(gst)));
    else res = http_text_error(404, "custom request not found");
    sqlite3_finalize(gst);
    db_unlock();
    cJSON_Delete(body);
    return res;
}
