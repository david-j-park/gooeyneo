var express = require('express')
, app = express()
, api = require('./routes/api')
, bodyparser = require('body-parser');

app.set('view engine', 'jade');

app.use('/api', bodyparser.json(), api);

app.get('/partials/:i', function(req, res){
    res.render('partials/' + req.params.i);
});

app.use(express.static('static'));
app.use(express.static('bower_components'));
/* redirect everything else to our angular app */
app.all('/*', function(req, res){
    res.render('home');
});

app.listen(process.env.PORT || 4005);
