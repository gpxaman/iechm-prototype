#ifndef IECHM_API_H
#define IECHM_API_H

#include "http.h"

/* Every handler has the same shape: given the parsed request and (if the
 * route captured one) a path parameter string, produce a response. `param`
 * is NULL for routes with no captured segment. */
typedef HttpResponse (*ApiHandler)(HttpRequest *req, const char *param);

HttpResponse api_health(HttpRequest *req, const char *param);

HttpResponse api_categories_list(HttpRequest *req, const char *param);

HttpResponse api_products_list(HttpRequest *req, const char *param);
HttpResponse api_products_get(HttpRequest *req, const char *param);
HttpResponse api_products_similar(HttpRequest *req, const char *param);

HttpResponse api_projects_list(HttpRequest *req, const char *param);
HttpResponse api_projects_get(HttpRequest *req, const char *param);
HttpResponse api_projects_create(HttpRequest *req, const char *param);
HttpResponse api_requirement_update(HttpRequest *req, const char *param); /* param = "<projectId>/<reqId>" */
HttpResponse api_requirement_delete(HttpRequest *req, const char *param);

HttpResponse api_custom_requests_list(HttpRequest *req, const char *param);
HttpResponse api_custom_requests_get(HttpRequest *req, const char *param);
HttpResponse api_custom_requests_create(HttpRequest *req, const char *param);
HttpResponse api_custom_requests_update(HttpRequest *req, const char *param);

HttpResponse api_deals_list(HttpRequest *req, const char *param);
HttpResponse api_deals_get(HttpRequest *req, const char *param);
HttpResponse api_deals_create(HttpRequest *req, const char *param);
HttpResponse api_deals_update(HttpRequest *req, const char *param);

HttpResponse api_notifications_list(HttpRequest *req, const char *param);
HttpResponse api_orders_list(HttpRequest *req, const char *param);
HttpResponse api_orders_create(HttpRequest *req, const char *param);

HttpResponse api_cart_list(HttpRequest *req, const char *param);
HttpResponse api_cart_add(HttpRequest *req, const char *param);
HttpResponse api_cart_remove(HttpRequest *req, const char *param);

HttpResponse api_user_get(HttpRequest *req, const char *param);
HttpResponse api_user_update(HttpRequest *req, const char *param);

HttpResponse api_ai_search(HttpRequest *req, const char *param);
HttpResponse api_ai_parse_build(HttpRequest *req, const char *param);
HttpResponse api_ai_parse_custom_request(HttpRequest *req, const char *param);
HttpResponse api_catalogue_scan(HttpRequest *req, const char *param);

#endif
