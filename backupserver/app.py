#!/usr/bin/env python
import json
import logging
from pprint import pprint
import tornado.httpserver
import tornado.ioloop
import tornado.options
import tornado.web
import redis.client
from tornado.options import define, options

REDIS_HOST = 'localhost'
REDIS_PORT = 6379

define("debug", default=False, help="run in debug mode", type=bool)
define("port", default=8000, help="run on the given port", type=int)


class MainHandler(tornado.web.RequestHandler):
    def get(self):
        self.write("See source for how to use this")


class BackupHandler(tornado.web.RequestHandler):
    def get(self, _id):
        self.set_header('Access-Control-Allow-Origin', '*')
        self.set_header('Access-Control-Allow-Methods', 'GET')
        self.set_header('Access-Control-Allow-Headers', 'Content-Type')

        key = 'backupuser:%s' % _id
        data = self.application.redis.get(key)
        if data:
            data = json.loads(data)
        else:
            data = {}
        logging.info("FOR %s RETURNING %d states" % (_id, len(data)))
        #print "RETURNING", repr(key)
        #pprint(data)
        self.write(data)

    def post(self, _id):
        self.set_header('Access-Control-Allow-Origin', '*')
        self.set_header('Access-Control-Allow-Methods', 'POST')
        self.set_header('Access-Control-Allow-Headers', 'Content-Type')
        states = {}
        added = []
        for key, value in self.request.arguments.items():
            try:
                timestamp = int(value[0])
                added.append(key)
            except:
                continue
            states[key] = timestamp
 #       pprint(states)
        logging.info("FOR %s NOW HAS %d states" % (_id, len(states)))
        if states:
            self.application.redis.sadd('backupusers', _id)
            key = 'backupuser:%s' % _id
            self.application.redis.set(key, json.dumps(states))
            logging.info("SET %s" % ', '.join(added))
        self.write("Consumed %s" % _id)


class BackupDeleteHandler(tornado.web.RequestHandler):

    def post(self, _id):
        self.set_header('Access-Control-Allow-Origin', '*')
        self.set_header('Access-Control-Allow-Methods', 'POST')
        self.set_header('Access-Control-Allow-Headers', 'Content-Type')
        key = 'backupuser:%s' % _id
        data = self.application.redis.get(key)
        removed = []
        if data:
            states = json.loads(data)
            state = self.get_argument('state')
            try:
                states.pop(state)
                removed.append(state)
            except:
                pass
    #        pprint(states)
            if removed:
                self.application.redis.set(key, json.dumps(states))
            logging.info("FOR %s NOW HAS %d states" % (_id, len(states)))
            logging.info("REMOVED %s" % ', '.join(removed))
        else:
            states = {}
        self.write("Removed %s" % ', '.join(removed))


class Application(tornado.web.Application):
    def __init__(self):
        app_settings = dict(
            debug=options.debug,
        )
        routes = [
            (r"/", MainHandler),
            (r"/(\d+)/delete", BackupDeleteHandler),
            (r"/(\d+)", BackupHandler),
        ]
        super(Application, self).__init__(routes, **app_settings)
        self.redis = redis.client.Redis(REDIS_HOST, REDIS_PORT)


def main():
    tornado.options.parse_command_line()
    http_server = tornado.httpserver.HTTPServer(Application())
    print "Starting tornado on port", options.port
    http_server.listen(options.port)
    try:
        tornado.ioloop.IOLoop.instance().start()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
