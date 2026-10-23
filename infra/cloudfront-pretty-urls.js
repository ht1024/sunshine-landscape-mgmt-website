// CloudFront Function (viewer-request)
// Maps /about-us and /about-us/ -> /about-us/index.html
// Keeps real files and /assets/* unchanged.
function handler(event) {
  var request = event.request;
  var uri = request.uri;

  if (uri.startsWith('/assets/')) {
    return request;
  }

  if (uri.endsWith('/')) {
    request.uri = uri + 'index.html';
    return request;
  }

  if (uri.includes('.')) {
    return request;
  }

  request.uri = uri + '/index.html';
  return request;
}
