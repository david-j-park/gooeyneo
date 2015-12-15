var svcmodule = angular.module('d3Services', []);

svcmodule.factory('neoGraphToD3', function(){
    return function(neograph, graphToMerge){
        var nodes = [], nodeIndex = [], links = [], linkIndex = [];
        if (graphToMerge) {
            nodes = graphToMerge.nodes || [];
            nodeIndex = graphToMerge.nindex || [];
            links = graphToMerge.links || [];
            linkIndex = graphToMerge.lindex || [];
        }
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
                linkIndex.push(l.id);
            });
            
        });
        
        return {
            nodes: nodes,
            links: links,
            nindex: nodeIndex,
            lindex: linkIndex
        };
    };
});

svcmodule.directive('d3Graph', [function() {
        return {
            restrict: 'E',
            scope: {
                width: '=',
                height: '=',
                graph: '=',
                onNodeClick: '='
            },
            link: function(scope, element, attrs) {
                var center = [scope.width / 2, scope.height / 2];
                var force = d3.layout.force()
                        .size([scope.width, scope.height])
                        .charge(-500)
                        .linkDistance(150)
                        .gravity(0.1)
                        .friction(0.6);
                var svg = d3.select(element[0]).append('svg')
                        .attr('width', scope.width)
                        .attr('height', scope.height)
                        .append('g');
                
                // "indexes" of ids in the nodes/links arrays
                var nindex = {}, lindex = {};
                scope.graph.nodes.forEach(function(val){
                    nindex[val.id] = true;
                });
                scope.graph.links.forEach(function(val){
                    lindex[val.id] = true;
                })
                
                function viz() {
                    force.nodes(scope.graph.nodes)
                            .links(scope.graph.links)
                            .start();
                    
                    /* event handlers */
                    function nodeClick(d, i){
                        if (typeof(scope.onNodeClick) == 'function') scope.onNodeClick(d);
                    }
                    
                    /* connectors */
                    var link = svg.selectAll('.link')
                            .data(scope.graph.links);
                    link.enter().append("line")
                            .attr('class', 'link');
                    
                    /* link labels */
                    var linkText = svg.selectAll('.linkText')
                            .data(scope.graph.links);
                    
                    linkText.enter().append('g').attr("transform", function(d) {
                        var angle = (Math.atan2(d.target.y - d.source.y, d.target.x - d.source.x) * 180 / Math.PI);
                        if (Math.abs(angle) > 90) angle = Math.abs(angle) - 180;
                        return "translate(" + d.source.x + "," + d.source.y + ") " +
                                "rotate(" + angle + ")";
                    }).attr('class', 'linkText').append('text').attr('text-anchor', 'middle')
                            .each(function(d){
                                lindex[d.id] = true;
                                console.log(lindex);
                    }).on('contextmenu', function(d){
                        d3.event.preventDefault();
                        console.log(d.id);
                    });
                    
                    
                    
                    var linkLabels = linkText.selectAll('text').text(function(d) {
                        return d.type;
                    }).attr('x', force.linkDistance() / 2).on('click', function(d) {
                        //console.log(d);
                    });

                    var node = svg.selectAll('.node')
                            .data(scope.graph.nodes)
                            .attr('class', 'node').on('dblclick', nodeClick);

                    var grp = node.enter().append('g').attr("transform", function(d) {
                        return "translate(" + d.x + "," + d.y + ")";
                    }).attr('class', 'node').on('dblclick', nodeClick).call(force.drag).each(function(d){
                        nindex[d._id] = true;
//                        console.log(nindex);
                    });

                    grp.append('circle')
                            .attr('r', 2);
                    grp.append('text')
                            .attr('text-anchor', 'middle');

                    node.selectAll('text').text(function(d) {
                        return d.properties.name;
                    });

                    node.exit().each(function(d){
                        //remove from index
                        nindex[d.id] = false; 
                    }).remove();
                    
                    link.exit().each(function(d){
                        lindex[d.id] = false;
                    }).remove();

                    force.on('tick', function() {
                        link.attr("x1", function(d) {
                            return d.source.x;
                        })
                                .attr("y1", function(d) {
                                    return d.source.y;
                                })
                                .attr("x2", function(d) {
                                    return d.target.x;
                                })
                                .attr("y2", function(d) {
                                    return d.target.y;
                                });
                        linkText.attr("transform", function(d) {
                            var angle = (Math.atan2(d.target.y - d.source.y, d.target.x - d.source.x) * 180 / Math.PI);
                            return "translate(" + d.source.x + "," + d.source.y + ") " +
                                    "rotate(" + angle + ")";
                        });
                        
                        linkLabels.attr("transform", function(d){
                            var angle = (Math.atan2(d.target.y - d.source.y, d.target.x - d.source.x) * 180 / Math.PI);
                            if (Math.abs(angle) > 90) return "rotate (180 75 0)";
                        })



                        node.attr("transform", function(d) {
                            return "translate(" + d.x + "," + d.y + ")";
                        });
                    });
                    
                    
                }

                scope.$watch(attrs.graph, function(old, newval) {
                    viz();
                }, true)

            }
        };
    }]);