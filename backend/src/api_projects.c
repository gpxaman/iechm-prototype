#include "api.h"
#include "db.h"
#include "json_util.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static cJSON *requirement_row_json(sqlite3_stmt *st) {
    cJSON *o = cJSON_CreateObject();
    cJSON_AddStringToObject(o, "id", col_text(st, 0));
    cJSON_AddStringToObject(o, "group", col_text(st, 1));
    cJSON_AddStringToObject(o, "name", col_text(st, 2));
    cJSON_AddStringToObject(o, "status", col_text(st, 3));
    const char *mp = col_text(st, 4);
    if (mp[0]) cJSON_AddStringToObject(o, "matchedProductId", mp); else cJSON_AddNullToObject(o, "matchedProductId");
    const char *note = col_text(st, 5);
    if (note[0]) cJSON_AddStringToObject(o, "note", note); else cJSON_AddNullToObject(o, "note");
    return o;
}

static cJSON *requirements_for_project(const char *project_id) {
    cJSON *arr = cJSON_CreateArray();
    sqlite3_stmt *st;
    sqlite3_prepare_v2(g_db,
        "SELECT id,group_name,name,status,matched_product_id,note FROM requirements "
        "WHERE project_id=? ORDER BY sort_order", -1, &st, NULL);
    sqlite3_bind_text(st, 1, project_id, -1, SQLITE_STATIC);
    while (sqlite3_step(st) == SQLITE_ROW) cJSON_AddItemToArray(arr, requirement_row_json(st));
    sqlite3_finalize(st);
    return arr;
}

static cJSON *custom_request_ids_for_project(const char *project_id) {
    cJSON *arr = cJSON_CreateArray();
    sqlite3_stmt *st;
    sqlite3_prepare_v2(g_db, "SELECT id FROM custom_requests WHERE project_id=?", -1, &st, NULL);
    sqlite3_bind_text(st, 1, project_id, -1, SQLITE_STATIC);
    while (sqlite3_step(st) == SQLITE_ROW) cJSON_AddItemToArray(arr, cJSON_CreateString(col_text(st, 0)));
    sqlite3_finalize(st);
    return arr;
}

static cJSON *project_row_json(sqlite3_stmt *st) {
    cJSON *o = cJSON_CreateObject();
    const char *id = col_text(st, 0);
    cJSON_AddStringToObject(o, "id", id);
    cJSON_AddStringToObject(o, "name", col_text(st, 1));
    cJSON_AddStringToObject(o, "prompt", col_text(st, 2));
    cJSON_AddNumberToObject(o, "createdAt", (double)sqlite3_column_int64(st, 3) * 1000.0);
    cJSON_AddItemToObject(o, "requirements", requirements_for_project(id));
    cJSON_AddItemToObject(o, "customRequestIds", custom_request_ids_for_project(id));
    return o;
}

HttpResponse api_projects_list(HttpRequest *req, const char *param) {
    (void)req; (void)param;
    db_lock();
    cJSON *arr = cJSON_CreateArray();
    sqlite3_stmt *st;
    sqlite3_prepare_v2(g_db, "SELECT id,name,prompt,created_at FROM projects ORDER BY created_at DESC", -1, &st, NULL);
    while (sqlite3_step(st) == SQLITE_ROW) cJSON_AddItemToArray(arr, project_row_json(st));
    sqlite3_finalize(st);
    db_unlock();
    return http_json(200, json_to_body(arr));
}

HttpResponse api_projects_get(HttpRequest *req, const char *param) {
    (void)req;
    db_lock();
    sqlite3_stmt *st;
    sqlite3_prepare_v2(g_db, "SELECT id,name,prompt,created_at FROM projects WHERE id=?", -1, &st, NULL);
    sqlite3_bind_text(st, 1, param, -1, SQLITE_STATIC);
    HttpResponse res;
    if (sqlite3_step(st) == SQLITE_ROW) res = http_json(200, json_to_body(project_row_json(st)));
    else res = http_text_error(404, "project not found");
    sqlite3_finalize(st);
    db_unlock();
    return res;
}

HttpResponse api_projects_create(HttpRequest *req, const char *param) {
    (void)param;
    cJSON *body = json_parse_body(req->body);
    if (!body) return http_text_error(400, "invalid JSON body");

    const char *prompt = json_get_str(body, "prompt", "");
    cJSON *scenario = cJSON_GetObjectItemCaseSensitive(body, "scenario");
    const char *label = scenario ? json_get_str(scenario, "label", "Untitled Project") : "Untitled Project";
    const char *name = json_get_str(body, "name", label);
    cJSON *groups = scenario ? cJSON_GetObjectItemCaseSensitive(scenario, "groups") : NULL;

    char project_id[32];
    db_gen_id("proj", project_id, sizeof(project_id));

    db_lock();
    sqlite3_stmt *pst;
    sqlite3_prepare_v2(g_db, "INSERT INTO projects(id,name,prompt,created_at) VALUES(?,?,?,strftime('%s','now'))", -1, &pst, NULL);
    sqlite3_bind_text(pst, 1, project_id, -1, SQLITE_STATIC);
    sqlite3_bind_text(pst, 2, name, -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(pst, 3, prompt, -1, SQLITE_TRANSIENT);
    sqlite3_step(pst);
    sqlite3_finalize(pst);

    if (groups && cJSON_IsArray(groups)) {
        sqlite3_stmt *rst;
        sqlite3_prepare_v2(g_db,
            "INSERT INTO requirements(id,project_id,group_name,name,status,matched_product_id,note,sort_order) "
            "VALUES(?,?,?,?,?,?,?,?)", -1, &rst, NULL);
        int order = 0;
        cJSON *g;
        cJSON_ArrayForEach(g, groups) {
            const char *gname = json_get_str(g, "group", "");
            cJSON *items = cJSON_GetObjectItemCaseSensitive(g, "items");
            cJSON *it;
            cJSON_ArrayForEach(it, items) {
                char req_id[40];
                snprintf(req_id, sizeof(req_id), "%s_req%d", project_id, order);
                const char *iname = json_get_str(it, "name", "");
                const char *status = json_get_str(it, "status", "info");
                const char *mpid = json_get_str(it, "matchedProductId", NULL);
                const char *note = json_get_str(it, "note", NULL);
                sqlite3_reset(rst);
                sqlite3_bind_text(rst, 1, req_id, -1, SQLITE_TRANSIENT);
                sqlite3_bind_text(rst, 2, project_id, -1, SQLITE_TRANSIENT);
                sqlite3_bind_text(rst, 3, gname, -1, SQLITE_TRANSIENT);
                sqlite3_bind_text(rst, 4, iname, -1, SQLITE_TRANSIENT);
                sqlite3_bind_text(rst, 5, status, -1, SQLITE_TRANSIENT);
                if (mpid) sqlite3_bind_text(rst, 6, mpid, -1, SQLITE_TRANSIENT); else sqlite3_bind_null(rst, 6);
                if (note) sqlite3_bind_text(rst, 7, note, -1, SQLITE_TRANSIENT); else sqlite3_bind_null(rst, 7);
                sqlite3_bind_int(rst, 8, order);
                sqlite3_step(rst);
                order++;
            }
        }
        sqlite3_finalize(rst);
    }

    sqlite3_stmt *gst;
    sqlite3_prepare_v2(g_db, "SELECT id,name,prompt,created_at FROM projects WHERE id=?", -1, &gst, NULL);
    sqlite3_bind_text(gst, 1, project_id, -1, SQLITE_STATIC);
    sqlite3_step(gst);
    cJSON *result = project_row_json(gst);
    sqlite3_finalize(gst);
    db_unlock();
    cJSON_Delete(body);
    return http_json(201, json_to_body(result));
}

/* param is "<projectId>/<reqId>" */
static int split_two(const char *param, char *a, size_t asz, char *b, size_t bsz) {
    const char *slash = strchr(param, '/');
    if (!slash) return -1;
    size_t alen = (size_t)(slash - param);
    if (alen >= asz) alen = asz - 1;
    memcpy(a, param, alen);
    a[alen] = '\0';
    strncpy(b, slash + 1, bsz - 1);
    b[bsz - 1] = '\0';
    return 0;
}

HttpResponse api_requirement_update(HttpRequest *req, const char *param) {
    char project_id[32], req_id[40];
    if (split_two(param, project_id, sizeof(project_id), req_id, sizeof(req_id)) < 0)
        return http_text_error(400, "expected /api/projects/:projectId/requirements/:reqId");

    cJSON *body = json_parse_body(req->body);
    if (!body) return http_text_error(400, "invalid JSON body");

    db_lock();
    cJSON *status = cJSON_GetObjectItemCaseSensitive(body, "status");
    cJSON *note = cJSON_GetObjectItemCaseSensitive(body, "note");
    if (status && cJSON_IsString(status)) {
        sqlite3_stmt *st;
        sqlite3_prepare_v2(g_db, "UPDATE requirements SET status=? WHERE id=? AND project_id=?", -1, &st, NULL);
        sqlite3_bind_text(st, 1, status->valuestring, -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(st, 2, req_id, -1, SQLITE_STATIC);
        sqlite3_bind_text(st, 3, project_id, -1, SQLITE_STATIC);
        sqlite3_step(st);
        sqlite3_finalize(st);
    }
    if (note && cJSON_IsString(note)) {
        sqlite3_stmt *st;
        sqlite3_prepare_v2(g_db, "UPDATE requirements SET note=? WHERE id=? AND project_id=?", -1, &st, NULL);
        sqlite3_bind_text(st, 1, note->valuestring, -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(st, 2, req_id, -1, SQLITE_STATIC);
        sqlite3_bind_text(st, 3, project_id, -1, SQLITE_STATIC);
        sqlite3_step(st);
        sqlite3_finalize(st);
    }

    sqlite3_stmt *gst;
    sqlite3_prepare_v2(g_db, "SELECT id,group_name,name,status,matched_product_id,note FROM requirements WHERE id=?", -1, &gst, NULL);
    sqlite3_bind_text(gst, 1, req_id, -1, SQLITE_STATIC);
    HttpResponse res;
    if (sqlite3_step(gst) == SQLITE_ROW) res = http_json(200, json_to_body(requirement_row_json(gst)));
    else res = http_text_error(404, "requirement not found");
    sqlite3_finalize(gst);
    db_unlock();
    cJSON_Delete(body);
    return res;
}

HttpResponse api_requirement_delete(HttpRequest *req, const char *param) {
    (void)req;
    char project_id[32], req_id[40];
    if (split_two(param, project_id, sizeof(project_id), req_id, sizeof(req_id)) < 0)
        return http_text_error(400, "expected /api/projects/:projectId/requirements/:reqId");
    db_lock();
    sqlite3_stmt *st;
    sqlite3_prepare_v2(g_db, "DELETE FROM requirements WHERE id=? AND project_id=?", -1, &st, NULL);
    sqlite3_bind_text(st, 1, req_id, -1, SQLITE_STATIC);
    sqlite3_bind_text(st, 2, project_id, -1, SQLITE_STATIC);
    sqlite3_step(st);
    sqlite3_finalize(st);
    db_unlock();
    return http_no_content(204);
}
