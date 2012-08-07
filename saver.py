import hashlib
import tornado.ioloop
import tornado.web

class MainHandler(tornado.web.RequestHandler):
    def post(self):
        payload = self.get_argument('payload')
        filename = hashlib.md5(payload).hexdigest()[:4] + '.json'
        open(filename, 'w').write(payload)
        self.write(filename)

application = tornado.web.Application([
    (r"/", MainHandler),
])

if __name__ == "__main__":
    application.listen(8888)
    tornado.ioloop.IOLoop.instance().start()
