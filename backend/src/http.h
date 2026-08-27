#ifndef IECHM_HTTP_H
#define IECHM_HTTP_H

#include <stddef.h>

#define HTTP_MAX_HEADERS 32

typedef struct {
    char name[64];
    char value[512];
} HttpHeader;

typedef struct {
    char method[8];
    char path[512];      /* decoded path, no query string */
    char query[512];     /* raw query string, may be empty */
    HttpHeader headers[HTTP_MAX_HEADERS];
    int header_count;
    char *body;           /* heap allocated, NUL-terminated, may be NULL */
    size_t body_len;
} HttpRequest;

typedef struct {
    int status;
    const char *content_type;
    char *body;            /* heap allocated; response layer takes ownership and frees it */
    size_t body_len;
} HttpResponse;

/* Reads one HTTP/1.1 request from the socket fd. Returns 0 on success, -1 on
 * error/EOF/malformed request. Caller must call http_request_free(). */
int http_read_request(int fd, HttpRequest *req);
void http_request_free(HttpRequest *req);

/* Looks up a header by case-insensitive name; returns NULL if absent. */
const char *http_get_header(const HttpRequest *req, const char *name);

/* Extracts a query-string parameter value into out (size outsz). Returns 1 if
 * found, 0 otherwise. Handles %XX decoding and '+' as space. */
int http_query_param(const char *query, const char *key, char *out, size_t outsz);

/* Sends a full HTTP/1.1 response (status line + headers + body) on fd, then
 * frees res->body. Always sends CORS headers permissive enough for a local
 * dev frontend on a different port. */
void http_send_response(int fd, HttpResponse *res);

/* Convenience response builders. `body` must be heap-allocated (or NULL);
 * ownership transfers to the HttpResponse / to http_send_response. */
HttpResponse http_json(int status, char *body);
HttpResponse http_no_content(int status);
HttpResponse http_text_error(int status, const char *message);

#endif
