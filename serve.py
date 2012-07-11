from SimpleHTTPServer import BaseHTTPServer, SimpleHTTPRequestHandler


class LessSimpleHTTPRequestHandler(SimpleHTTPRequestHandler):

    def guess_type(self, path):
        if path.endswith('.appcache'):
            return 'text/cache-manifest'
        return SimpleHTTPRequestHandler.guess_type(self, path)

if __name__ == '__main__':
    BaseHTTPServer.test(LessSimpleHTTPRequestHandler,
                        BaseHTTPServer.HTTPServer)
