var neo4j = require('node-neo4j')
, request = require('request')
, db = new neo4j(process.env.NEO_HOST || 'neo:7474')
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
        var existingNodes;
        if (req.body.en){
            existingNodes = req.body.en.map(function(val){
                return parseInt(val);
            });
        }
        
        var q = "MATCH (n) WHERE Id(n) = {sourceId} OPTIONAL MATCH (n)-[r]-(m) RETURN n, r, m"
        if (existingNodes) {
            q = "MATCH (n) WHERE Id(n) = {sourceId} OPTIONAL MATCH (n)-[r]-(m) OPTIONAL MATCH (m)-[r2]-(x) where Id(x) IN {existing} RETURN n, r, m, r2, x";
        }
        
        db.beginAndCommitTransaction({statements: [
                {
                    statement: q,
                    parameters: {
                        sourceId: parseInt(req.params.id),
                        existing: existingNodes
                    },
                    resultDataContents: ['graph']
                }
        ]}, function(err, result){
            if (err) throw err;
            res.json(result);
        });
    },
    searchNodes: function(req, res){
        var q = "MATCH (n) where lower(n.name) =~ {term} return n.name, Id(n)";
        db.beginAndCommitTransaction({
            statements: [
                {
                    statement: q,
                    parameters: {
                        term: ('.*' + req.query.q + '.*').toLowerCase()
                    }
                }
            ]
        }, function(err, result){
            if (err) throw err;
            console.log(result);
            var out = [];
            result.results[0].data.forEach(function(val){
                out.push({id: val.row[1], name: val.row[0]});
            });
            //console.log(out);
            res.json(out);
        });
    },
    updateNode: function(req, res){
        var n = req.body.node;
        var tmp = {};
        n.displayProperties.forEach(function(val, i){
            tmp[val.name] = val.value;
        });
        db.updateNode(n.id, tmp, function(err, result){
            if (err) res.status(500).send(err);
            res.json(tmp);
        });
    }
};