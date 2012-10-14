var redis = require('redis');
var db = redis.createClient();

var express = require('express');
var app = express();

app.use(express.methodOverride());

//CORS middleware
/*
app.use(function(req, res, next) {
    //res.header('Access-Control-Allow-Origin', config.allowedDomains);
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    next();
});
 */

var _post = function(req, res) {
  if
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  console.log(req);
  console.log('STORING', req.body);
  db.sadd('backupusers', req.params.id);
  db.set('backupuser:' + req.params.id, JSON.stringify(req.body), function(error, reply) {
    res.send('Consumed ' + req.params.id + '\n');
  });
}

app.post('/:id', _post);

app.get('/:id', function(req, res, next) {
  db.get('backupuser:' + req.params.id, function(error, reply) {
    console.log('RETURNING', JSON.parse(reply));
    res.send(JSON.parse(reply));
    next();
  });
});

app.use(function(err, req, res, next){
    console.error(err.stack);
    res.send(500, 'Something broke!');
});

//app.use(app.router);


app.listen(9999);
console.log('Listening on port 9999');
