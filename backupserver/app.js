var redis = require('redis');
var db = redis.createClient();

var express = require('express');
var app = express();


app.use(express.bodyParser());

app.post('/:id', function(req, res){
  console.log('BODY', req.body);
  db.sadd('backupusers', req.params.id);
  db.set('backupuser:' + req.params.id, JSON.stringify(req.body));
  res.send('Consumed ' + req.params.id + '\n');
});

app.get('/:id', function(req, res) {
  db.get('backupuser:' + req.params.id, function(error, reply) {
    res.send(JSON.parse(reply));
  });
});

app.listen(9999);
console.log('Listening on port 9999');
