var neo4j = require('node-neo4j')
, request = require('request')
, dbUrl = process.env.NEO_HOST + '/db/data'
, db = new neo4j(process.env.NEO_HOST)
, async = require('async');

var opts = {
    headers: {
        'Accept': 'application/json; charset=UTF-8'
    }
};

module.exports = {
    hello: function(req, res){
        res.send("Hello from API, world!");
    },
    getNodeLabels: function(req, res){
        db.listAllLabels(function(err, labels){
            if (err) throw err;
            res.json(labels);
        });
    }, 
    getRelationshipLabels: function(req, res){
        db.readRelationshipTypes(function(err, result){
            if (err) throw err;
            res.json(result);
        })
    },
    getNodesWithLabel: function(req, res){
        var q = "MATCH (n:{0}) RETURN n";
        
        db.cypherQuery(q.replace('{0}', req.params.label), function(err, result){
            if (err) throw err;
            res.json(result);
        })
    },
    createRelationship: function(req, res){
        var start = req.body.start;
        var end = req.body.end;
        var rel = req.body.relationship;
        db.insertRelationship(start, end, rel, null, function(err, relationship){
            if (err) throw err;
            res.json(relationship);
        });
    },
    createNode: function(req, res){
        var toInsert = { name: req.body.name };
        req.body.extendedProps.forEach(function(val, index){
            toInsert[val.name] = val.value;
        });
        db.insertNode(toInsert, req.body.label, function(err, result){
            if (err) throw err;
            res.json(result);
        });
    },
    queryNodes: function(req, res){
        var params = {fromid: req.body.from, toid: req.body.to};
        var q = ["MATCH (n)-[r]->(m)",
            "WHERE Id(n) = {fromid} and Id(m) = {toid}",
            "RETURN n, type(r), m"].join('\n');
        db.cypherQuery(q, params, function(err, result){
            if (err) throw err;
            res.json(result);
        })
    },
    graphQuery: function(req, res){
        var q = "MATCH (a:Application)-[r]->(n) RETURN a, r, n";
        db.beginAndCommitTransaction({statements: [
                {
                    statement: q,
                    parameters: {},
                    resultDataContents: ['graph']
                }
        ]}, function(err, result){
            if (err) throw err;
            res.json(result);
        });
    },
    relatedNodes: function(req, res){
        var q = "MATCH (n)-[r]-(m) WHERE Id(n) = {sourceId} RETURN n, r, m";
        db.beginAndCommitTransaction({statements: [
                {
                    statement: q,
                    parameters: {
                        sourceId: parseInt(req.params.id)
                    },
                    resultDataContents: ['graph']
                }
        ]}, function(err, result){
            if (err) throw err;
            res.json(result);
        });
    }
};