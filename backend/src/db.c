#include "db.h"

#include <pthread.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

sqlite3 *g_db = NULL;
static pthread_mutex_t g_mutex = PTHREAD_MUTEX_INITIALIZER;

void db_lock(void) { pthread_mutex_lock(&g_mutex); }
void db_unlock(void) { pthread_mutex_unlock(&g_mutex); }

void db_gen_id(const char *prefix, char *out, size_t outsz) {
    static int counter = 0;
    counter++;
    snprintf(out, outsz, "%s_%lx%02x", prefix, (long)time(NULL), (unsigned)(counter & 0xff));
}

static void must_exec(const char *sql, const char *what) {
    char *errmsg = NULL;
    if (sqlite3_exec(g_db, sql, NULL, NULL, &errmsg) != SQLITE_OK) {
        fprintf(stderr, "db: failed to %s: %s\n", what, errmsg ? errmsg : "?");
        sqlite3_free(errmsg);
        exit(1);
    }
}

static const char *SCHEMA_SQL =
    "PRAGMA journal_mode=WAL;"
    "CREATE TABLE IF NOT EXISTS categories("
    "  id TEXT PRIMARY KEY, name TEXT NOT NULL, icon TEXT NOT NULL);"
    "CREATE TABLE IF NOT EXISTS products("
    "  id TEXT PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL,"
    "  price REAL NOT NULL, moq INTEGER NOT NULL, lead_time_days INTEGER NOT NULL,"
    "  stock TEXT NOT NULL, description TEXT NOT NULL, specs TEXT NOT NULL);"
    "CREATE TABLE IF NOT EXISTS projects("
    "  id TEXT PRIMARY KEY, name TEXT NOT NULL, prompt TEXT NOT NULL, created_at INTEGER NOT NULL);"
    "CREATE TABLE IF NOT EXISTS requirements("
    "  id TEXT PRIMARY KEY, project_id TEXT NOT NULL, group_name TEXT NOT NULL,"
    "  name TEXT NOT NULL, status TEXT NOT NULL, matched_product_id TEXT, note TEXT,"
    "  sort_order INTEGER NOT NULL DEFAULT 0);"
    "CREATE TABLE IF NOT EXISTS custom_requests("
    "  id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL,"
    "  material TEXT NOT NULL, dims TEXT NOT NULL, quantity TEXT NOT NULL,"
    "  finish TEXT NOT NULL, timeline TEXT NOT NULL, status TEXT NOT NULL,"
    "  project_id TEXT, files TEXT NOT NULL, created_at INTEGER NOT NULL);"
    "CREATE TABLE IF NOT EXISTS deals("
    "  id TEXT PRIMARY KEY, customer TEXT NOT NULL, contact TEXT NOT NULL,"
    "  need TEXT NOT NULL, value REAL NOT NULL, status TEXT NOT NULL, notes TEXT NOT NULL,"
    "  created_at INTEGER NOT NULL, commission REAL NOT NULL, paid INTEGER NOT NULL DEFAULT 0);"
    "CREATE TABLE IF NOT EXISTS notifications("
    "  id TEXT PRIMARY KEY, type TEXT NOT NULL, title TEXT NOT NULL,"
    "  time INTEGER NOT NULL, read INTEGER NOT NULL DEFAULT 0);"
    "CREATE TABLE IF NOT EXISTS orders("
    "  id TEXT PRIMARY KEY, name TEXT NOT NULL, total REAL NOT NULL,"
    "  status TEXT NOT NULL, date INTEGER NOT NULL);"
    "CREATE TABLE IF NOT EXISTS cart("
    "  product_id TEXT PRIMARY KEY, qty INTEGER NOT NULL);"
    "CREATE TABLE IF NOT EXISTS user("
    "  id INTEGER PRIMARY KEY CHECK(id=1), name TEXT NOT NULL, email TEXT NOT NULL,"
    "  company TEXT NOT NULL, is_partner INTEGER NOT NULL DEFAULT 0,"
    "  is_supplier INTEGER NOT NULL DEFAULT 0, mode TEXT NOT NULL DEFAULT 'buy');";

static void exec1(const char *sql) {
    sqlite3_stmt *st = NULL;
    if (sqlite3_prepare_v2(g_db, sql, -1, &st, NULL) != SQLITE_OK) {
        fprintf(stderr, "db: prepare failed: %s (%s)\n", sqlite3_errmsg(g_db), sql);
        exit(1);
    }
    if (sqlite3_step(st) != SQLITE_DONE) {
        fprintf(stderr, "db: step failed: %s (%s)\n", sqlite3_errmsg(g_db), sql);
        exit(1);
    }
    sqlite3_finalize(st);
}

/* ---- seed: categories ---- */
typedef struct { const char *id, *name, *icon; } CategorySeed;
static const CategorySeed CATEGORIES[] = {
    {"electronics", "Electronics", "bolt"},
    {"enclosures", "Enclosures & Metal", "box"},
    {"sensors", "Sensors", "target"},
    {"power", "Power & Battery", "bolt"},
    {"connectors", "Connectors & Cable", "wrench"},
    {"fasteners", "Fasteners & Hardware", "wrench"},
    {"packaging", "Packaging", "box"},
};

/* ---- seed: products ---- */
typedef struct {
    const char *id, *name, *category, *stock, *desc, *specs_json;
    double price;
    int moq, lead_time;
} ProductSeed;
static const ProductSeed PRODUCTS[] = {
    {"p1", "Stainless Steel Bottle Body — 500ml", "enclosures", "In stock",
     "Double-wall 18/8 stainless steel bottle shell, laser-etch ready, 500ml capacity.",
     "{\"Material\":\"18/8 Stainless Steel\",\"Capacity\":\"500ml\",\"Wall\":\"Double\",\"Finish\":\"Brushed\"}", 3.4, 500, 12},
    {"p2", "Food-Grade Bottle Lid, Threaded", "enclosures", "In stock",
     "PP threaded lid with integrated silicone gasket seat.",
     "{\"Material\":\"Polypropylene\",\"Thread\":\"GPI 28-410\",\"Color\":\"Natural / Black\"}", 0.85, 500, 10},
    {"p3", "Silicone Sealing Ring Set", "enclosures", "In stock",
     "Food-grade silicone O-ring and gasket set, FDA compliant.",
     "{\"Material\":\"Food-grade Silicone\",\"Durometer\":\"40A\",\"Temp\":\"-40C to 200C\"}", 0.12, 1000, 7},
    {"p4", "Digital Temperature Sensor — Waterproof", "sensors", "In stock",
     "DS18B20-class waterproof probe, +/-0.5C accuracy, digital 1-Wire output.",
     "{\"Accuracy\":\"+/-0.5C\",\"Interface\":\"1-Wire\",\"Range\":\"-10C to 85C\"}", 1.9, 200, 14},
    {"p5", "BLE 5.2 Module, Low-Power", "electronics", "Limited stock",
     "Bluetooth Low Energy 5.2 SoC module with onboard antenna, ultra-low idle draw.",
     "{\"Protocol\":\"BLE 5.2\",\"Range\":\"~30m\",\"Idle\":\"2.1uA\"}", 2.6, 100, 18},
    {"p6", "32-bit MCU, Ultra-Low-Power", "electronics", "In stock",
     "ARM Cortex-M0+ microcontroller, ideal for sensor + BLE integration.",
     "{\"Core\":\"Cortex-M0+\",\"Flash\":\"128KB\",\"Package\":\"QFN32\"}", 1.4, 250, 16},
    {"p7", "LiPo Rechargeable Battery — 850mAh", "power", "In stock",
     "UN38.3-certified lithium polymer cell with protection PCB.",
     "{\"Capacity\":\"850mAh\",\"Voltage\":\"3.7V\",\"Cert\":\"UN38.3\"}", 2.1, 300, 20},
    {"p8", "USB-C Charging Module", "power", "In stock",
     "USB-C input charge/protection board, 5V/1A.",
     "{\"Input\":\"USB-C 5V\",\"Output\":\"1A max\",\"Protection\":\"OVP/OCP\"}", 0.65, 500, 11},
    {"p9", "IP67 Waterproof Cable Connector", "connectors", "In stock",
     "2-pin waterproof push-lock connector, IP67 rated.",
     "{\"Rating\":\"IP67\",\"Pins\":\"2\",\"Current\":\"3A\"}", 0.9, 1000, 9},
    {"p10", "Machined Aluminum Enclosure, 80x50x25mm", "enclosures", "Made to order",
     "CNC-machined 6061 aluminum enclosure, anodized finish available.",
     "{\"Material\":\"6061 Aluminum\",\"Finish\":\"Anodized\",\"Size\":\"80x50x25mm\"}", 6.2, 100, 24},
    {"p11", "Water Flow Sensor, Hall-Effect", "sensors", "Limited stock",
     "Hall-effect flow sensor for liquid consumption tracking, pulse output.",
     "{\"Type\":\"Hall-effect\",\"Output\":\"Pulse\",\"Range\":\"0.3-6L/min\"}", 2.3, 150, 15},
    {"p12", "M2.5 Stainless Fastener Kit", "fasteners", "In stock",
     "Stainless M2.5 screws, washers, and standoffs for enclosure assembly.",
     "{\"Material\":\"A2 Stainless\",\"Size\":\"M2.5\",\"Kit\":\"Screw+washer+standoff\"}", 0.04, 5000, 6},
    {"p13", "Recycled-Fiber Retail Box, Small", "packaging", "In stock",
     "FSC-certified recycled fiber retail packaging, custom print available.",
     "{\"Material\":\"Recycled Fiber\",\"Print\":\"Up to 4-color\",\"Cert\":\"FSC\"}", 0.5, 1000, 14},
    {"p14", "IoT Motion & Tamper Sensor", "sensors", "In stock",
     "PIR + accelerometer combo for tamper and motion detection.",
     "{\"Detect\":\"PIR + Accel\",\"Output\":\"Digital + I2C\",\"Voltage\":\"3.3V\"}", 3.1, 200, 17},
    {"p15", "LiFePO4 Cell, 3.2V 6Ah", "power", "Made to order",
     "High-cycle-life LiFePO4 cell for scooter/EV-class power packs.",
     "{\"Chemistry\":\"LiFePO4\",\"Voltage\":\"3.2V\",\"Capacity\":\"6Ah\"}", 5.4, 100, 22},
    {"p16", "Brushless Hub Motor, 350W", "electronics", "Made to order",
     "350W brushless DC hub motor for light electric vehicles.",
     "{\"Power\":\"350W\",\"Voltage\":\"36V\",\"Type\":\"Hub-drive\"}", 38, 20, 28},
    {"p17", "Solar Charge Controller, MPPT 5W", "power", "In stock",
     "Compact MPPT controller for small solar-powered sensor nodes.",
     "{\"Type\":\"MPPT\",\"MaxInput\":\"5W\",\"Output\":\"5V regulated\"}", 3.8, 150, 19},
    {"p18", "LoRaWAN Module, 868/915MHz", "electronics", "Limited stock",
     "Long-range low-power module for outdoor sensor connectivity.",
     "{\"Protocol\":\"LoRaWAN\",\"Freq\":\"868/915MHz\",\"Range\":\"~5km line-of-sight\"}", 4.7, 100, 21},
    {"p19", "Soil Moisture Sensor, Capacitive", "sensors", "In stock",
     "Corrosion-resistant capacitive sensor for agricultural monitoring.",
     "{\"Type\":\"Capacitive\",\"Output\":\"Analog 0-3V\",\"Life\":\"Corrosion resistant\"}", 1.2, 200, 13},
    {"p20", "IP65 Junction Enclosure, ABS", "enclosures", "In stock",
     "Injection-molded ABS enclosure with gasketed lid, IP65.",
     "{\"Material\":\"ABS\",\"Rating\":\"IP65\",\"Mount\":\"Wall/DIN\"}", 1.6, 300, 10},
};
#define N_PRODUCTS (int)(sizeof(PRODUCTS) / sizeof(PRODUCTS[0]))
#define N_CATEGORIES (int)(sizeof(CATEGORIES) / sizeof(CATEGORIES[0]))

/* ---- seed: requirements per project (group, name, status, matched product, note) ---- */
typedef struct { const char *group, *name, *status, *product, *note; } ReqSeed;

static const ReqSeed PROJ1_REQS[] = {
    {"Bottle System", "Stainless steel bottle body", "available", "p1", NULL},
    {"Bottle System", "Food-grade lid", "available", "p2", NULL},
    {"Bottle System", "Silicone sealing components", "available", "p3", NULL},
    {"Sensors", "Temperature sensor", "available", "p4", NULL},
    {"Sensors", "Water flow / consumption sensor", "custom", NULL,
     "No exact match — closest sensors are lower-precision. Custom request recommended."},
    {"Electronics", "Microcontroller", "available", "p6", NULL},
    {"Electronics", "Bluetooth module", "similar", "p5", "Close match — confirm range needs."},
    {"Power", "Rechargeable battery", "available", "p7", NULL},
    {"Power", "Charging components", "available", "p8", NULL},
};
static const ReqSeed PROJ2_REQS[] = {
    {"Sensing", "Soil moisture sensor", "available", "p19", NULL},
    {"Sensing", "Temperature sensor", "available", "p4", NULL},
    {"Power", "Solar charge controller", "available", "p17", NULL},
    {"Power", "Battery", "available", "p7", NULL},
    {"Connectivity", "LoRaWAN module", "available", "p18", NULL},
    {"Connectivity", "Microcontroller", "available", "p6", NULL},
    {"Enclosure", "Outdoor-rated housing", "similar", "p20", "Close match — check IP rating against your site conditions."},
};
static const ReqSeed PROJ3_REQS[] = {
    {"Power", "Battery cells", "available", "p7", NULL},
    {"Power", "USB-C fast charge module", "available", "p8", NULL},
    {"Enclosure", "Rugged IP65 housing", "custom", NULL, "Drop-rating requires a custom enclosure."},
    {"Electronics", "Battery management IC", "info", NULL, "Need target output wattage to recommend."},
};

typedef struct {
    const char *id, *name, *prompt;
    int days_ago;
    const ReqSeed *reqs;
    int n_reqs;
} ProjectSeed;
static const ProjectSeed PROJECTS[] = {
    {"proj1", "Smart Water Bottle", "I am building a smart water bottle that tracks water consumption and temperature.", 6, PROJ1_REQS, 9},
    {"proj2", "Agricultural Soil Sensor", "A solar-powered soil sensor network for small farms.", 19, PROJ2_REQS, 7},
    {"proj3", "Portable Power Bank", "A rugged 20,000mAh portable power bank for outdoor use.", 2, PROJ3_REQS, 4},
};
#define N_PROJECTS (int)(sizeof(PROJECTS) / sizeof(PROJECTS[0]))

typedef struct {
    const char *id, *title, *description, *material, *dims, *quantity, *finish, *timeline, *status, *project_id, *files_json;
} CustomRequestSeed;
static const CustomRequestSeed CUSTOM_REQUESTS[] = {
    {"cr1", "Water consumption flow sensor — high precision",
     "Need a compact, food-safe flow sensor accurate enough to log sips, not just full pours.",
     "Food-grade polymer", "Not specified", "50 units (pilot)", "Not specified", "30 days",
     "feasibility", "proj1", "[\"sketch-flow-path.pdf\"]"},
    {"cr2", "Rugged IP65 power bank housing",
     "Drop-rated to 1.2m, IP65, needs to fit a 20,000mAh cell stack plus PCB.",
     "ABS + TPU overmold", "150x74x26mm approx.", "100 units (pilot)", "Textured, black", "45 days",
     "quote", "proj3", "[\"powerbank-cad.step\",\"ref-photo.jpg\"]"},
    {"cr3", "Waterproof aluminum enclosure for IoT device",
     "I need a waterproof aluminum enclosure for an IoT device.",
     "Aluminum", "Not specified", "100 units", "Not specified", "30 days",
     "review", NULL, "[]"},
    {"cr4", "Custom PCB — 4-layer sensor board",
     "4-layer board for a multi-sensor array, castellated edges for module mounting.",
     "FR4", "40x30mm", "250 units", "ENIG", "21 days",
     "production", NULL, "[\"gerbers.zip\"]"},
    {"cr5", "Branded retail unboxing insert",
     "Custom foam insert for retail box to hold bottle + charging cable.",
     "EVA foam", "Fits 500ml bottle", "1,000 units", "Black, laser-etched logo", "25 days",
     "delivered", NULL, "[]"},
};
#define N_CUSTOM_REQUESTS (int)(sizeof(CUSTOM_REQUESTS) / sizeof(CUSTOM_REQUESTS[0]))

typedef struct {
    const char *id, *customer, *contact, *need, *status, *notes;
    double value, commission;
    int days_ago, paid;
} DealSeed;
static const DealSeed DEALS[] = {
    {"d1", "Nimbus Robotics", "Aditi Rao - aditi@nimbusrobotics.io",
     "5,000 waterproof connectors for a new outdoor robotics line.", "discussion",
     "Warm intro via a mutual founder friend.", 14000, 840, 9, 0},
    {"d2", "Verdant Farms Co-op", "Marcus Webb - marcus@verdantfarms.com",
     "Soil sensors + solar controllers for 40-acre pilot.", "quoted",
     "Budget approved for Q4; wants pilot first.", 22000, 1320, 15, 0},
    {"d3", "Solstice Wearables", "Priya N. - priya@solsticewear.com",
     "Custom battery pack + BLE module sourcing for a fitness band.", "won",
     "Converted after pilot run — recurring order likely.", 9000, 540, 38, 1},
    {"d4", "Loop Mobility", "Dan K. - dan@loopmobility.co",
     "Hub motors and controllers for scooter prototype.", "contacted", "", 31000, 1860, 3, 0},
    {"d5", "Ferra Kitchenware", "Contact pending",
     "Packaging supplier for a new retail line.", "review",
     "Submitted via voice note — needs contact details.", 6000, 360, 1, 0},
    {"d6", "Bexley Instruments", "Tom H. - tom@bexley-inst.com",
     "PCB fabrication for lab equipment sensor board.", "lost",
     "Went with an in-house supplier.", 4200, 0, 52, 0},
};
#define N_DEALS (int)(sizeof(DEALS) / sizeof(DEALS[0]))

typedef struct { const char *id, *type, *title; int minutes_ago, read; } NotificationSeed;
static const NotificationSeed NOTIFICATIONS[] = {
    {"n1", "request", "Quote ready for Rugged IP65 power bank housing", 40, 0},
    {"n2", "deal", "Nimbus Robotics moved to \"In Discussion\"", 300, 0},
    {"n3", "order", "Your order of BLE 5.2 Modules shipped", 1200, 1},
    {"n4", "project", "AI found 2 new matches for Agricultural Soil Sensor", 1800, 1},
    {"n5", "deal", "Commission paid: $540 from Solstice Wearables", 4320, 1},
};
#define N_NOTIFICATIONS (int)(sizeof(NOTIFICATIONS) / sizeof(NOTIFICATIONS[0]))

typedef struct { const char *id, *name, *status; double total; int hours_ago; } OrderSeed;
static const OrderSeed ORDERS[] = {
    {"o1", "BLE 5.2 Module x100", "Shipped", 260, 20},
    {"o2", "Stainless Steel Bottle Body x500", "In production", 1700, 96},
    {"o3", "Silicone Sealing Ring Set x1000", "Delivered", 120, 264},
};
#define N_ORDERS (int)(sizeof(ORDERS) / sizeof(ORDERS[0]))

static void seed_categories(void) {
    sqlite3_stmt *st;
    sqlite3_prepare_v2(g_db, "INSERT INTO categories(id,name,icon) VALUES(?,?,?)", -1, &st, NULL);
    for (int i = 0; i < N_CATEGORIES; i++) {
        sqlite3_reset(st);
        sqlite3_bind_text(st, 1, CATEGORIES[i].id, -1, SQLITE_STATIC);
        sqlite3_bind_text(st, 2, CATEGORIES[i].name, -1, SQLITE_STATIC);
        sqlite3_bind_text(st, 3, CATEGORIES[i].icon, -1, SQLITE_STATIC);
        sqlite3_step(st);
    }
    sqlite3_finalize(st);
}

static void seed_products(void) {
    sqlite3_stmt *st;
    sqlite3_prepare_v2(g_db,
        "INSERT INTO products(id,name,category,price,moq,lead_time_days,stock,description,specs) "
        "VALUES(?,?,?,?,?,?,?,?,?)", -1, &st, NULL);
    for (int i = 0; i < N_PRODUCTS; i++) {
        const ProductSeed *p = &PRODUCTS[i];
        sqlite3_reset(st);
        sqlite3_bind_text(st, 1, p->id, -1, SQLITE_STATIC);
        sqlite3_bind_text(st, 2, p->name, -1, SQLITE_STATIC);
        sqlite3_bind_text(st, 3, p->category, -1, SQLITE_STATIC);
        sqlite3_bind_double(st, 4, p->price);
        sqlite3_bind_int(st, 5, p->moq);
        sqlite3_bind_int(st, 6, p->lead_time);
        sqlite3_bind_text(st, 7, p->stock, -1, SQLITE_STATIC);
        sqlite3_bind_text(st, 8, p->desc, -1, SQLITE_STATIC);
        sqlite3_bind_text(st, 9, p->specs_json, -1, SQLITE_STATIC);
        sqlite3_step(st);
    }
    sqlite3_finalize(st);
}

static void seed_projects(void) {
    sqlite3_stmt *pst, *rst;
    sqlite3_prepare_v2(g_db, "INSERT INTO projects(id,name,prompt,created_at) VALUES(?,?,?,?)", -1, &pst, NULL);
    sqlite3_prepare_v2(g_db,
        "INSERT INTO requirements(id,project_id,group_name,name,status,matched_product_id,note,sort_order) "
        "VALUES(?,?,?,?,?,?,?,?)", -1, &rst, NULL);
    time_t now = time(NULL);
    for (int i = 0; i < N_PROJECTS; i++) {
        const ProjectSeed *p = &PROJECTS[i];
        sqlite3_reset(pst);
        sqlite3_bind_text(pst, 1, p->id, -1, SQLITE_STATIC);
        sqlite3_bind_text(pst, 2, p->name, -1, SQLITE_STATIC);
        sqlite3_bind_text(pst, 3, p->prompt, -1, SQLITE_STATIC);
        sqlite3_bind_int64(pst, 4, (sqlite3_int64)(now - (time_t)p->days_ago * 86400));
        sqlite3_step(pst);
        for (int j = 0; j < p->n_reqs; j++) {
            const ReqSeed *r = &p->reqs[j];
            char id[32];
            snprintf(id, sizeof(id), "%s_req%d", p->id, j);
            sqlite3_reset(rst);
            sqlite3_bind_text(rst, 1, id, -1, SQLITE_TRANSIENT);
            sqlite3_bind_text(rst, 2, p->id, -1, SQLITE_STATIC);
            sqlite3_bind_text(rst, 3, r->group, -1, SQLITE_STATIC);
            sqlite3_bind_text(rst, 4, r->name, -1, SQLITE_STATIC);
            sqlite3_bind_text(rst, 5, r->status, -1, SQLITE_STATIC);
            if (r->product) sqlite3_bind_text(rst, 6, r->product, -1, SQLITE_STATIC);
            else sqlite3_bind_null(rst, 6);
            if (r->note) sqlite3_bind_text(rst, 7, r->note, -1, SQLITE_STATIC);
            else sqlite3_bind_null(rst, 7);
            sqlite3_bind_int(rst, 8, j);
            sqlite3_step(rst);
        }
    }
    sqlite3_finalize(pst);
    sqlite3_finalize(rst);
}

static void seed_custom_requests(void) {
    sqlite3_stmt *st;
    sqlite3_prepare_v2(g_db,
        "INSERT INTO custom_requests(id,title,description,material,dims,quantity,finish,timeline,status,project_id,files,created_at) "
        "VALUES(?,?,?,?,?,?,?,?,?,?,?,?)", -1, &st, NULL);
    time_t now = time(NULL);
    for (int i = 0; i < N_CUSTOM_REQUESTS; i++) {
        const CustomRequestSeed *c = &CUSTOM_REQUESTS[i];
        sqlite3_reset(st);
        sqlite3_bind_text(st, 1, c->id, -1, SQLITE_STATIC);
        sqlite3_bind_text(st, 2, c->title, -1, SQLITE_STATIC);
        sqlite3_bind_text(st, 3, c->description, -1, SQLITE_STATIC);
        sqlite3_bind_text(st, 4, c->material, -1, SQLITE_STATIC);
        sqlite3_bind_text(st, 5, c->dims, -1, SQLITE_STATIC);
        sqlite3_bind_text(st, 6, c->quantity, -1, SQLITE_STATIC);
        sqlite3_bind_text(st, 7, c->finish, -1, SQLITE_STATIC);
        sqlite3_bind_text(st, 8, c->timeline, -1, SQLITE_STATIC);
        sqlite3_bind_text(st, 9, c->status, -1, SQLITE_STATIC);
        if (c->project_id) sqlite3_bind_text(st, 10, c->project_id, -1, SQLITE_STATIC);
        else sqlite3_bind_null(st, 10);
        sqlite3_bind_text(st, 11, c->files_json, -1, SQLITE_STATIC);
        sqlite3_bind_int64(st, 12, (sqlite3_int64)now - (i * 3600));
        sqlite3_step(st);
    }
    sqlite3_finalize(st);
}

static void seed_deals(void) {
    sqlite3_stmt *st;
    sqlite3_prepare_v2(g_db,
        "INSERT INTO deals(id,customer,contact,need,value,status,notes,created_at,commission,paid) "
        "VALUES(?,?,?,?,?,?,?,?,?,?)", -1, &st, NULL);
    time_t now = time(NULL);
    for (int i = 0; i < N_DEALS; i++) {
        const DealSeed *d = &DEALS[i];
        sqlite3_reset(st);
        sqlite3_bind_text(st, 1, d->id, -1, SQLITE_STATIC);
        sqlite3_bind_text(st, 2, d->customer, -1, SQLITE_STATIC);
        sqlite3_bind_text(st, 3, d->contact, -1, SQLITE_STATIC);
        sqlite3_bind_text(st, 4, d->need, -1, SQLITE_STATIC);
        sqlite3_bind_double(st, 5, d->value);
        sqlite3_bind_text(st, 6, d->status, -1, SQLITE_STATIC);
        sqlite3_bind_text(st, 7, d->notes, -1, SQLITE_STATIC);
        sqlite3_bind_int64(st, 8, (sqlite3_int64)(now - (time_t)d->days_ago * 86400));
        sqlite3_bind_double(st, 9, d->commission);
        sqlite3_bind_int(st, 10, d->paid);
        sqlite3_step(st);
    }
    sqlite3_finalize(st);
}

static void seed_notifications(void) {
    sqlite3_stmt *st;
    sqlite3_prepare_v2(g_db, "INSERT INTO notifications(id,type,title,time,read) VALUES(?,?,?,?,?)", -1, &st, NULL);
    time_t now = time(NULL);
    for (int i = 0; i < N_NOTIFICATIONS; i++) {
        const NotificationSeed *n = &NOTIFICATIONS[i];
        sqlite3_reset(st);
        sqlite3_bind_text(st, 1, n->id, -1, SQLITE_STATIC);
        sqlite3_bind_text(st, 2, n->type, -1, SQLITE_STATIC);
        sqlite3_bind_text(st, 3, n->title, -1, SQLITE_STATIC);
        sqlite3_bind_int64(st, 4, (sqlite3_int64)(now - (time_t)n->minutes_ago * 60));
        sqlite3_bind_int(st, 5, n->read);
        sqlite3_step(st);
    }
    sqlite3_finalize(st);
}

static void seed_orders(void) {
    sqlite3_stmt *st;
    sqlite3_prepare_v2(g_db, "INSERT INTO orders(id,name,total,status,date) VALUES(?,?,?,?,?)", -1, &st, NULL);
    time_t now = time(NULL);
    for (int i = 0; i < N_ORDERS; i++) {
        const OrderSeed *o = &ORDERS[i];
        sqlite3_reset(st);
        sqlite3_bind_text(st, 1, o->id, -1, SQLITE_STATIC);
        sqlite3_bind_text(st, 2, o->name, -1, SQLITE_STATIC);
        sqlite3_bind_double(st, 3, o->total);
        sqlite3_bind_text(st, 4, o->status, -1, SQLITE_STATIC);
        sqlite3_bind_int64(st, 5, (sqlite3_int64)(now - (time_t)o->hours_ago * 3600));
        sqlite3_step(st);
    }
    sqlite3_finalize(st);
}

static void seed_user(void) {
    exec1("INSERT INTO user(id,name,email,company,is_partner,is_supplier,mode) "
          "VALUES(1,'','','',0,0,'buy')");
}

void db_init(const char *path) {
    if (sqlite3_open(path, &g_db) != SQLITE_OK) {
        fprintf(stderr, "db: failed to open %s: %s\n", path, sqlite3_errmsg(g_db));
        exit(1);
    }
    must_exec(SCHEMA_SQL, "create schema");

    sqlite3_stmt *count_st;
    sqlite3_prepare_v2(g_db, "SELECT COUNT(*) FROM products", -1, &count_st, NULL);
    sqlite3_step(count_st);
    int existing = sqlite3_column_int(count_st, 0);
    sqlite3_finalize(count_st);

    if (existing == 0) {
        must_exec("BEGIN", "begin seed txn");
        seed_categories();
        seed_products();
        seed_projects();
        seed_custom_requests();
        seed_deals();
        seed_notifications();
        seed_orders();
        seed_user();
        must_exec("COMMIT", "commit seed txn");
        fprintf(stderr, "db: seeded demo data into %s\n", path);
    }
}
