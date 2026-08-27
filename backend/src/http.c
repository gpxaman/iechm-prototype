#include "http.h"

#include <ctype.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/socket.h>
#include <unistd.h>

#define INITIAL_BUF 8192

static int recv_more(int fd, char **buf, size_t *len, size_t *cap) {
    if (*len + 4096 > *cap) {
        size_t newcap = (*cap) * 2;
        char *nb = realloc(*buf, newcap);
        if (!nb) return -1;
        *buf = nb;
        *cap = newcap;
    }
    ssize_t n = recv(fd, *buf + *len, *cap - *len - 1, 0);
    if (n <= 0) return -1;
    *len += (size_t)n;
    (*buf)[*len] = '\0';
    return (int)n;
}

static void trim(char *s) {
    size_t n = strlen(s);
    while (n > 0 && (s[n - 1] == '\r' || s[n - 1] == '\n' || s[n - 1] == ' ')) s[--n] = '\0';
    size_t start = 0;
    while (s[start] == ' ') start++;
    if (start > 0) memmove(s, s + start, strlen(s + start) + 1);
}

int http_read_request(int fd, HttpRequest *req) {
    memset(req, 0, sizeof(*req));

    size_t cap = INITIAL_BUF, len = 0;
    char *buf = malloc(cap);
    if (!buf) return -1;
    buf[0] = '\0';

    char *header_end = NULL;
    while (!(header_end = strstr(buf, "\r\n\r\n"))) {
        if (recv_more(fd, &buf, &len, &cap) < 0) {
            free(buf);
            return -1;
        }
        if (len > 1024 * 1024) { /* header bomb guard */
            free(buf);
            return -1;
        }
    }
    size_t headers_len = (size_t)(header_end - buf) + 4;

    /* --- request line --- */
    char *line_end = strstr(buf, "\r\n");
    if (!line_end) { free(buf); return -1; }
    *line_end = '\0';
    char method[8] = {0}, path_and_query[512] = {0}, version[16] = {0};
    if (sscanf(buf, "%7s %511s %15s", method, path_and_query, version) != 3) {
        free(buf);
        return -1;
    }
    strncpy(req->method, method, sizeof(req->method) - 1);

    char *qmark = strchr(path_and_query, '?');
    if (qmark) {
        *qmark = '\0';
        strncpy(req->query, qmark + 1, sizeof(req->query) - 1);
    }
    strncpy(req->path, path_and_query, sizeof(req->path) - 1);

    /* --- headers --- */
    char *cursor = line_end + 2;
    long content_length = 0;
    while (cursor < buf + headers_len - 2) {
        char *next = strstr(cursor, "\r\n");
        if (!next || next > buf + headers_len) break;
        size_t linelen = (size_t)(next - cursor);
        char linebuf[600];
        if (linelen >= sizeof(linebuf)) linelen = sizeof(linebuf) - 1;
        memcpy(linebuf, cursor, linelen);
        linebuf[linelen] = '\0';
        cursor = next + 2;
        if (linelen == 0) break;

        char *colon = strchr(linebuf, ':');
        if (!colon) continue;
        *colon = '\0';
        char *val = colon + 1;
        trim(val);
        if (req->header_count < HTTP_MAX_HEADERS) {
            strncpy(req->headers[req->header_count].name, linebuf, sizeof(req->headers[0].name) - 1);
            strncpy(req->headers[req->header_count].value, val, sizeof(req->headers[0].value) - 1);
            req->header_count++;
        }
        if (strcasecmp(linebuf, "Content-Length") == 0) {
            content_length = atol(val);
        }
    }

    /* --- body --- */
    if (content_length > 0) {
        size_t have = len - headers_len;
        while (have < (size_t)content_length) {
            if (recv_more(fd, &buf, &len, &cap) < 0) { free(buf); return -1; }
            have = len - headers_len;
        }
        req->body = malloc((size_t)content_length + 1);
        if (!req->body) { free(buf); return -1; }
        memcpy(req->body, buf + headers_len, (size_t)content_length);
        req->body[content_length] = '\0';
        req->body_len = (size_t)content_length;
    }

    free(buf);
    return 0;
}

void http_request_free(HttpRequest *req) {
    free(req->body);
    req->body = NULL;
}

const char *http_get_header(const HttpRequest *req, const char *name) {
    for (int i = 0; i < req->header_count; i++) {
        if (strcasecmp(req->headers[i].name, name) == 0) return req->headers[i].value;
    }
    return NULL;
}

static int hexval(char c) {
    if (c >= '0' && c <= '9') return c - '0';
    if (c >= 'a' && c <= 'f') return c - 'a' + 10;
    if (c >= 'A' && c <= 'F') return c - 'A' + 10;
    return -1;
}

static void url_decode(const char *src, char *dst, size_t dstsz) {
    size_t di = 0;
    for (size_t si = 0; src[si] && di + 1 < dstsz; si++) {
        if (src[si] == '%' && src[si + 1] && src[si + 2]) {
            int a = hexval(src[si + 1]), b = hexval(src[si + 2]);
            if (a >= 0 && b >= 0) {
                dst[di++] = (char)((a << 4) | b);
                si += 2;
                continue;
            }
        }
        dst[di++] = (src[si] == '+') ? ' ' : src[si];
    }
    dst[di] = '\0';
}

int http_query_param(const char *query, const char *key, char *out, size_t outsz) {
    if (!query || !*query) return 0;
    size_t keylen = strlen(key);
    const char *p = query;
    while (*p) {
        const char *eq = strchr(p, '=');
        const char *amp = strchr(p, '&');
        if (!amp) amp = p + strlen(p);
        if (eq && eq < amp && (size_t)(eq - p) == keylen && strncmp(p, key, keylen) == 0) {
            char raw[512];
            size_t vlen = (size_t)(amp - (eq + 1));
            if (vlen >= sizeof(raw)) vlen = sizeof(raw) - 1;
            memcpy(raw, eq + 1, vlen);
            raw[vlen] = '\0';
            url_decode(raw, out, outsz);
            return 1;
        }
        p = (*amp) ? amp + 1 : amp;
    }
    return 0;
}

void http_send_response(int fd, HttpResponse *res) {
    char header[512];
    const char *status_text = "OK";
    switch (res->status) {
        case 200: status_text = "OK"; break;
        case 201: status_text = "Created"; break;
        case 204: status_text = "No Content"; break;
        case 400: status_text = "Bad Request"; break;
        case 404: status_text = "Not Found"; break;
        case 405: status_text = "Method Not Allowed"; break;
        case 500: status_text = "Internal Server Error"; break;
        default: status_text = "OK"; break;
    }
    int n = snprintf(header, sizeof(header),
        "HTTP/1.1 %d %s\r\n"
        "Content-Type: %s\r\n"
        "Content-Length: %zu\r\n"
        "Access-Control-Allow-Origin: *\r\n"
        "Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS\r\n"
        "Access-Control-Allow-Headers: Content-Type\r\n"
        "Connection: close\r\n"
        "\r\n",
        res->status, status_text, res->content_type ? res->content_type : "application/json",
        res->body_len);
    if (n > 0) send(fd, header, (size_t)n, 0);
    if (res->body && res->body_len > 0) send(fd, res->body, res->body_len, 0);
    free(res->body);
    res->body = NULL;
}

HttpResponse http_json(int status, char *body) {
    HttpResponse res;
    res.status = status;
    res.content_type = "application/json";
    res.body = body;
    res.body_len = body ? strlen(body) : 0;
    return res;
}

HttpResponse http_no_content(int status) {
    HttpResponse res;
    res.status = status;
    res.content_type = "application/json";
    res.body = NULL;
    res.body_len = 0;
    return res;
}

HttpResponse http_text_error(int status, const char *message) {
    char *body = malloc(strlen(message) + 32);
    sprintf(body, "{\"error\":\"%s\"}", message);
    return http_json(status, body);
}
