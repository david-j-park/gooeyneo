var svcmodule = angular.module('d3Services', []);

svcmodule.factory('neoGraphToD3', function(){
    return function(neograph){
        var nodes = [], nodeIndex = [], links = [], linkIndex = [];
        
        neograph.results[0].data.forEach(function(val, i){
            
            /* add nodes to array if not already present */
            val.graph.nodes.forEach(function(n){
                if (nodeIndex.indexOf(n.id) === -1) {
                    nodes.push(n);
                    nodeIndex.push(n.id).toString();
                }
            });
            
            /* process links to d3's expected format */
            val.graph.relationships.forEach(function(l){
                links.push({
                    source: nodeIndex.indexOf(l.startNode),
                    target: nodeIndex.indexOf(l.endNode),
                    type: l.type,
                    id: l.id,
                    properties: l.properties
                });
            });
            
        });
        
        return {
            nodes: nodes,
            links: links
        };
    };
});