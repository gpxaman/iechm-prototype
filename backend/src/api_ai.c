#include "api.h"
#include "db.h"
#include "json_util.h"

#include <ctype.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* Portable case-insensitive substring search (avoids relying on the
 * GNU-only strcasestr). */
static int ci_contains(const char *haystack, const char *needle) {
    size_t hn = strlen(haystack), nn = strlen(needle);
    if (nn == 0) return 1;
    if (nn > hn) return 0;
    for (size_t i = 0; i + nn <= hn; i++) {
        size_t j = 0;
        for (; j < nn; j++) {
            if (tolower((unsigned char)haystack[i + j]) != tolower((unsigned char)needle[j])) break;
        }
        if (j == nn) return 1;
    }
    return 0;
}

static void to_lower_buf(const char *src, char *dst, size_t dstsz) {
    size_t i = 0;
    for (; src[i] && i + 1 < dstsz; i++) dst[i] = (char)tolower((unsigned char)src[i]);
    dst[i] = '\0';
}

/* ---------------- /api/ai/search ---------------- */
#define PRODUCT_COLS "id,name,category,price,moq,lead_time_days,stock,description,specs"

static cJSON *product_row_json_local(sqlite3_stmt *st) {
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

HttpResponse api_ai_search(HttpRequest *req, const char *param) {
    (void)param;
    cJSON *body = json_parse_body(req->body);
    const char *text = json_get_str(body, "text", "");

    db_lock();
    cJSON *hits = cJSON_CreateArray();
    int hit_count = 0;
    sqlite3_stmt *st;
    sqlite3_prepare_v2(g_db, "SELECT " PRODUCT_COLS " FROM products", -1, &st, NULL);

    /* tokenize the query into words >3 chars, matched against name/category/description */
    char words[16][64];
    int nwords = 0;
    char lower[512];
    to_lower_buf(text, lower, sizeof(lower));
    char *save = NULL;
    char tmp[512];
    strncpy(tmp, lower, sizeof(tmp) - 1);
    tmp[sizeof(tmp) - 1] = '\0';
    for (char *tok = strtok_r(tmp, " \t,.!?", &save); tok && nwords < 16; tok = strtok_r(NULL, " \t,.!?", &save)) {
        if (strlen(tok) > 3) strncpy(words[nwords++], tok, sizeof(words[0]) - 1);
    }

    while (sqlite3_step(st) == SQLITE_ROW && hit_count < 6) {
        const char *name = col_text(st, 1), *category = col_text(st, 2), *desc = col_text(st, 7);
        int matched = 0;
        for (int i = 0; i < nwords && !matched; i++) {
            if (ci_contains(name, words[i]) || ci_contains(category, words[i]) || ci_contains(desc, words[i])) matched = 1;
        }
        if (matched) {
            cJSON_AddItemToArray(hits, product_row_json_local(st));
            hit_count++;
        }
    }
    sqlite3_finalize(st);
    db_unlock();

    const char *kind = hit_count >= 3 ? "exact" : (hit_count > 0 ? "similar" : "none");
    cJSON *o = cJSON_CreateObject();
    cJSON_AddStringToObject(o, "kind", kind);
    cJSON_AddItemToObject(o, "products", hits);
    if (body) cJSON_Delete(body);
    return http_json(200, json_to_body(o));
}

/* ---------------- /api/ai/parse-build ---------------- */
/* Scripted demo scenarios, mirroring the ones a human sourcing expert would
 * sketch for these four common pitches. Falls back to a generic first-pass
 * breakdown for anything else. */
static const char *SCENARIO_WATER_BOTTLE =
"{\"label\":\"Smart Water Bottle\",\"summary\":\"A hydration + temperature tracking smart bottle.\",\"groups\":["
"{\"group\":\"Bottle System\",\"items\":["
"{\"name\":\"Stainless steel bottle body\",\"status\":\"available\",\"matchedProductId\":\"p1\"},"
"{\"name\":\"Food-grade lid\",\"status\":\"available\",\"matchedProductId\":\"p2\"},"
"{\"name\":\"Silicone sealing components\",\"status\":\"available\",\"matchedProductId\":\"p3\"}]},"
"{\"group\":\"Sensors\",\"items\":["
"{\"name\":\"Temperature sensor\",\"status\":\"available\",\"matchedProductId\":\"p4\"},"
"{\"name\":\"Water flow / consumption sensor\",\"status\":\"custom\",\"note\":\"No exact match — closest sensors are lower-precision. Custom request recommended.\"}]},"
"{\"group\":\"Electronics\",\"items\":["
"{\"name\":\"Microcontroller\",\"status\":\"available\",\"matchedProductId\":\"p6\"},"
"{\"name\":\"Bluetooth module\",\"status\":\"similar\",\"matchedProductId\":\"p5\",\"note\":\"Close match — confirm range needs.\"}]},"
"{\"group\":\"Power\",\"items\":["
"{\"name\":\"Rechargeable battery\",\"status\":\"available\",\"matchedProductId\":\"p7\"},"
"{\"name\":\"Charging components\",\"status\":\"available\",\"matchedProductId\":\"p8\"}]}]}";

static const char *SCENARIO_SECURITY_DEVICE =
"{\"label\":\"IoT Security Device\",\"summary\":\"A connected security sensor with tamper and motion detection.\",\"groups\":["
"{\"group\":\"Enclosure\",\"items\":["
"{\"name\":\"Weatherproof housing\",\"status\":\"similar\",\"matchedProductId\":\"p10\",\"note\":\"Close match — dimensions may need adjusting.\"},"
"{\"name\":\"Mounting hardware\",\"status\":\"available\",\"matchedProductId\":\"p12\"}]},"
"{\"group\":\"Sensing\",\"items\":["
"{\"name\":\"Motion & tamper sensor\",\"status\":\"available\",\"matchedProductId\":\"p14\"}]},"
"{\"group\":\"Connectivity\",\"items\":["
"{\"name\":\"Bluetooth module\",\"status\":\"similar\",\"matchedProductId\":\"p5\"},"
"{\"name\":\"Microcontroller\",\"status\":\"available\",\"matchedProductId\":\"p6\"}]},"
"{\"group\":\"Power\",\"items\":["
"{\"name\":\"Battery\",\"status\":\"available\",\"matchedProductId\":\"p7\"},"
"{\"name\":\"Tamper-resistant enclosure fasteners\",\"status\":\"custom\",\"note\":\"Security-rated fastener not in catalogue yet.\"}]}]}";

static const char *SCENARIO_ELECTRIC_SCOOTER =
"{\"label\":\"Electric Scooter\",\"summary\":\"A light electric vehicle drivetrain and power system.\",\"groups\":["
"{\"group\":\"Drivetrain\",\"items\":["
"{\"name\":\"Hub motor\",\"status\":\"available\",\"matchedProductId\":\"p16\"},"
"{\"name\":\"Motor controller\",\"status\":\"custom\",\"note\":\"Needs a custom-rated controller for your target voltage.\"}]},"
"{\"group\":\"Power\",\"items\":["
"{\"name\":\"Battery pack cells\",\"status\":\"available\",\"matchedProductId\":\"p15\"},"
"{\"name\":\"Charging port\",\"status\":\"available\",\"matchedProductId\":\"p8\"}]},"
"{\"group\":\"Frame & Enclosure\",\"items\":["
"{\"name\":\"Battery enclosure\",\"status\":\"custom\",\"note\":\"Custom-dimension enclosure required for pack layout.\"},"
"{\"name\":\"Fastener kit\",\"status\":\"available\",\"matchedProductId\":\"p12\"}]}]}";

static const char *SCENARIO_SOLAR =
"{\"label\":\"Solar-Powered Sensor\",\"summary\":\"An off-grid environmental sensor node.\",\"groups\":["
"{\"group\":\"Sensing\",\"items\":["
"{\"name\":\"Soil moisture sensor\",\"status\":\"available\",\"matchedProductId\":\"p19\"},"
"{\"name\":\"Temperature sensor\",\"status\":\"available\",\"matchedProductId\":\"p4\"}]},"
"{\"group\":\"Power\",\"items\":["
"{\"name\":\"Solar charge controller\",\"status\":\"available\",\"matchedProductId\":\"p17\"},"
"{\"name\":\"Battery\",\"status\":\"available\",\"matchedProductId\":\"p7\"}]},"
"{\"group\":\"Connectivity\",\"items\":["
"{\"name\":\"LoRaWAN module\",\"status\":\"available\",\"matchedProductId\":\"p18\"},"
"{\"name\":\"Microcontroller\",\"status\":\"available\",\"matchedProductId\":\"p6\"}]},"
"{\"group\":\"Enclosure\",\"items\":["
"{\"name\":\"Outdoor-rated housing\",\"status\":\"similar\",\"matchedProductId\":\"p20\",\"note\":\"Close match — check IP rating against your site conditions.\"}]}]}";

HttpResponse api_ai_parse_build(HttpRequest *req, const char *param) {
    (void)param;
    cJSON *body = json_parse_body(req->body);
    const char *text = json_get_str(body, "text", "");

    const char *matched_json = NULL;
    if (ci_contains(text, "water bottle")) matched_json = SCENARIO_WATER_BOTTLE;
    else if (ci_contains(text, "security device")) matched_json = SCENARIO_SECURITY_DEVICE;
    else if (ci_contains(text, "electric scooter")) matched_json = SCENARIO_ELECTRIC_SCOOTER;
    else if (ci_contains(text, "solar")) matched_json = SCENARIO_SOLAR;

    cJSON *result;
    if (matched_json) {
        result = cJSON_Parse(matched_json);
    } else {
        char label[80];
        if (text[0]) {
            snprintf(label, sizeof(label), "%.60s%s", text, strlen(text) > 60 ? "…" : "");
        } else {
            strcpy(label, "Your Project");
        }
        char generic[2200];
        snprintf(generic, sizeof(generic),
            "{\"label\":\"%s\",\"summary\":\"A first pass based on what you described — refine anything below.\",\"groups\":["
            "{\"group\":\"Core Components\",\"items\":["
            "{\"name\":\"Primary enclosure / housing\",\"status\":\"similar\",\"matchedProductId\":\"p20\",\"note\":\"Closest stock option — likely needs dimension changes.\"},"
            "{\"name\":\"Control electronics (MCU)\",\"status\":\"available\",\"matchedProductId\":\"p6\"}]},"
            "{\"group\":\"Power\",\"items\":["
            "{\"name\":\"Battery\",\"status\":\"available\",\"matchedProductId\":\"p7\"},"
            "{\"name\":\"Charging module\",\"status\":\"available\",\"matchedProductId\":\"p8\"}]},"
            "{\"group\":\"Connectivity\",\"items\":["
            "{\"name\":\"Wireless module\",\"status\":\"similar\",\"matchedProductId\":\"p5\",\"note\":\"Confirm range and protocol needs.\"}]},"
            "{\"group\":\"Manufacturing\",\"items\":["
            "{\"name\":\"Assembly & testing\",\"status\":\"info\",\"note\":\"Tell us your target quantity so we can scope this.\"}]}]}",
            label);
        result = cJSON_Parse(generic);
    }
    if (body) cJSON_Delete(body);
    return http_json(200, json_to_body(result));
}

/* ---------------- /api/ai/parse-custom-request ---------------- */
HttpResponse api_ai_parse_custom_request(HttpRequest *req, const char *param) {
    (void)param;
    cJSON *body = json_parse_body(req->body);
    const char *text = json_get_str(body, "text", "");

    const char *material = "Not specified";
    if (ci_contains(text, "aluminum") || ci_contains(text, "aluminium")) material = "Aluminum";
    else if (ci_contains(text, "steel")) material = "Stainless Steel";
    else if (ci_contains(text, "plastic") || ci_contains(text, "abs") || ci_contains(text, "polymer")) material = "ABS Polymer";
    else if (ci_contains(text, "wood")) material = "Wood";

    int waterproof = ci_contains(text, "waterproof") || ci_contains(text, "ip6") || ci_contains(text, "ip7");

    char quantity[64] = "Not specified";
    for (const char *p = text; *p; p++) {
        if (isdigit((unsigned char)*p)) {
            char num[32];
            int n = 0;
            while (*p && (isdigit((unsigned char)*p) || *p == ',') && n < 30) num[n++] = *p++;
            num[n] = '\0';
            snprintf(quantity, sizeof(quantity), "%s units", num);
            break;
        }
    }

    char component[128];
    snprintf(component, sizeof(component), "%.60s%s", text[0] ? text : "Custom component", strlen(text) > 60 ? "…" : "");

    cJSON *o = cJSON_CreateObject();
    cJSON_AddStringToObject(o, "component", component);
    cJSON_AddStringToObject(o, "material", material);
    cJSON_AddStringToObject(o, "dims", "Not specified");
    cJSON_AddStringToObject(o, "quantity", quantity);
    cJSON_AddStringToObject(o, "finish", waterproof ? "Sealed / waterproof finish" : "Not specified");
    cJSON_AddStringToObject(o, "timeline", "30 days (estimated)");
    if (body) cJSON_Delete(body);
    return http_json(200, json_to_body(o));
}
