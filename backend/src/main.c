#include "api.h"
#include "db.h"
#include "http.h"

#include <errno.h>
#include <pthread.h>
#include <signal.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <netinet/tcp.h>
#include <unistd.h>

#define DEFAULT_PORT 8787

static int starts_with(const char *s, const char *prefix) {
    return strncmp(s, prefix, strlen(prefix)) == 0;
}

/* Dispatches one already-parsed request to the matching handler. Encodes the
 * whole (small, fixed) route table as explicit checks - see the comment
 * block in api.h for why: a handful of nested-parameter routes
 * (/api/products/:id/similar, /api/projects/:id/requirements/:reqId) make a
 * fully generic pattern matcher more code than just writing the routes out. */
static HttpResponse dispatch(HttpRequest *req) {
    const char *m = req->method;
    const char *p = req->path;

    if (strcmp(m, "OPTIONS") == 0) return http_no_content(204);

    if (strcmp(m, "GET") == 0 && strcmp(p, "/api/health") == 0) return api_health(req, NULL);
    if (strcmp(m, "GET") == 0 && strcmp(p, "/api/categories") == 0) return api_categories_list(req, NULL);

    if (strcmp(m, "GET") == 0 && strcmp(p, "/api/products") == 0) return api_products_list(req, NULL);
    if (starts_with(p, "/api/products/")) {
        const char *rest = p + strlen("/api/products/");
        size_t rl = strlen(rest);
        if (strcmp(m, "GET") == 0 && rl > strlen("/similar") &&
            strcmp(rest + rl - strlen("/similar"), "/similar") == 0) {
            char id[128];
            size_t idlen = rl - strlen("/similar");
            if (idlen >= sizeof(id)) idlen = sizeof(id) - 1;
            memcpy(id, rest, idlen);
            id[idlen] = '\0';
            return api_products_similar(req, id);
        }
        if (strcmp(m, "GET") == 0 && rl > 0) return api_products_get(req, rest);
    }

    if (strcmp(m, "GET") == 0 && strcmp(p, "/api/projects") == 0) return api_projects_list(req, NULL);
    if (strcmp(m, "POST") == 0 && strcmp(p, "/api/projects") == 0) return api_projects_create(req, NULL);
    if (starts_with(p, "/api/projects/")) {
        const char *rest = p + strlen("/api/projects/");
        const char *reqs = strstr(rest, "/requirements/");
        if (reqs) {
            char combined[200];
            size_t projlen = (size_t)(reqs - rest);
            char projid[100];
            if (projlen >= sizeof(projid)) projlen = sizeof(projid) - 1;
            memcpy(projid, rest, projlen);
            projid[projlen] = '\0';
            const char *reqid = reqs + strlen("/requirements/");
            snprintf(combined, sizeof(combined), "%s/%s", projid, reqid);
            if (strcmp(m, "PATCH") == 0) return api_requirement_update(req, combined);
            if (strcmp(m, "DELETE") == 0) return api_requirement_delete(req, combined);
        } else if (strcmp(m, "GET") == 0 && *rest) {
            return api_projects_get(req, rest);
        }
    }

    if (strcmp(m, "GET") == 0 && strcmp(p, "/api/custom-requests") == 0) return api_custom_requests_list(req, NULL);
    if (strcmp(m, "POST") == 0 && strcmp(p, "/api/custom-requests") == 0) return api_custom_requests_create(req, NULL);
    if (starts_with(p, "/api/custom-requests/")) {
        const char *rest = p + strlen("/api/custom-requests/");
        if (strcmp(m, "GET") == 0 && *rest) return api_custom_requests_get(req, rest);
        if (strcmp(m, "PATCH") == 0 && *rest) return api_custom_requests_update(req, rest);
    }

    if (strcmp(m, "GET") == 0 && strcmp(p, "/api/deals") == 0) return api_deals_list(req, NULL);
    if (strcmp(m, "POST") == 0 && strcmp(p, "/api/deals") == 0) return api_deals_create(req, NULL);
    if (starts_with(p, "/api/deals/")) {
        const char *rest = p + strlen("/api/deals/");
        if (strcmp(m, "GET") == 0 && *rest) return api_deals_get(req, rest);
        if (strcmp(m, "PATCH") == 0 && *rest) return api_deals_update(req, rest);
    }

    if (strcmp(m, "GET") == 0 && strcmp(p, "/api/notifications") == 0) return api_notifications_list(req, NULL);
    if (strcmp(m, "GET") == 0 && strcmp(p, "/api/orders") == 0) return api_orders_list(req, NULL);
    if (strcmp(m, "POST") == 0 && strcmp(p, "/api/orders") == 0) return api_orders_create(req, NULL);

    if (strcmp(m, "GET") == 0 && strcmp(p, "/api/cart") == 0) return api_cart_list(req, NULL);
    if (strcmp(m, "POST") == 0 && strcmp(p, "/api/cart") == 0) return api_cart_add(req, NULL);
    if (starts_with(p, "/api/cart/") && strcmp(m, "DELETE") == 0) {
        return api_cart_remove(req, p + strlen("/api/cart/"));
    }

    if (strcmp(p, "/api/user") == 0) {
        if (strcmp(m, "GET") == 0) return api_user_get(req, NULL);
        if (strcmp(m, "PATCH") == 0) return api_user_update(req, NULL);
    }

    if (strcmp(m, "POST") == 0 && strcmp(p, "/api/ai/search") == 0) return api_ai_search(req, NULL);
    if (strcmp(m, "POST") == 0 && strcmp(p, "/api/ai/parse-build") == 0) return api_ai_parse_build(req, NULL);
    if (strcmp(m, "POST") == 0 && strcmp(p, "/api/ai/parse-custom-request") == 0) return api_ai_parse_custom_request(req, NULL);
    if (strcmp(m, "POST") == 0 && strcmp(p, "/api/catalogue/scan") == 0) return api_catalogue_scan(req, NULL);

    return http_text_error(404, "no such route");
}

typedef struct { int fd; } ConnArg;

static void *handle_conn(void *argp) {
    ConnArg *arg = (ConnArg *)argp;
    int fd = arg->fd;
    free(arg);

    HttpRequest req;
    if (http_read_request(fd, &req) == 0) {
        HttpResponse res = dispatch(&req);
        http_send_response(fd, &res);
        http_request_free(&req);
    }
    close(fd);
    return NULL;
}

int main(int argc, char **argv) {
    signal(SIGPIPE, SIG_IGN);

    int port = DEFAULT_PORT;
    const char *db_path = "data/iechm.db";
    for (int i = 1; i < argc; i++) {
        if (strcmp(argv[i], "--port") == 0 && i + 1 < argc) port = atoi(argv[++i]);
        else if (strcmp(argv[i], "--db") == 0 && i + 1 < argc) db_path = argv[++i];
    }

    db_init(db_path);

    int listen_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (listen_fd < 0) { perror("socket"); return 1; }
    int yes = 1;
    setsockopt(listen_fd, SOL_SOCKET, SO_REUSEADDR, &yes, sizeof(yes));

    struct sockaddr_in addr;
    memset(&addr, 0, sizeof(addr));
    addr.sin_family = AF_INET;
    addr.sin_addr.s_addr = htonl(INADDR_LOOPBACK); /* local-only, matches "run this locally" scope */
    addr.sin_port = htons((uint16_t)port);

    if (bind(listen_fd, (struct sockaddr *)&addr, sizeof(addr)) < 0) {
        perror("bind");
        return 1;
    }
    if (listen(listen_fd, 64) < 0) { perror("listen"); return 1; }

    fprintf(stderr, "iechm-backend listening on http://127.0.0.1:%d (db: %s)\n", port, db_path);

    for (;;) {
        struct sockaddr_in client_addr;
        socklen_t client_len = sizeof(client_addr);
        int client_fd = accept(listen_fd, (struct sockaddr *)&client_addr, &client_len);
        if (client_fd < 0) {
            if (errno == EINTR) continue;
            perror("accept");
            continue;
        }
        setsockopt(client_fd, IPPROTO_TCP, TCP_NODELAY, &yes, sizeof(yes));

        ConnArg *arg = malloc(sizeof(ConnArg));
        arg->fd = client_fd;
        pthread_t tid;
        if (pthread_create(&tid, NULL, handle_conn, arg) != 0) {
            close(client_fd);
            free(arg);
            continue;
        }
        pthread_detach(tid);
    }
}
