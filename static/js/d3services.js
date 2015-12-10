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

svcmodule.directive('d3Graph', [function() {
        return {
            restrict: 'E',
            scope: {
                nodes: '=',
                links: '=',
                width: '=',
                height: '=',
                graph: '='
            },
            link: function(scope, element, attrs) {

                var force = d3.layout.force()
                        .size([scope.width, scope.height])
                        .charge(-500)
                        .linkDistance(150)
                        .gravity(0.1);
                var svg = d3.select(element[0]).append('svg')
                        .attr('width', scope.width)
                        .attr('height', scope.height)
                        .append('g');

                function viz() {
                    console.log(scope.graph);
                    force.nodes(scope.graph.nodes)
                            .links(scope.graph.links)
                            .start();
                    var link = svg.selectAll('.link')
                            .data(scope.graph.links)
                            .enter().append("line")
                            .attr('class', 'link');
                    var linkText = svg.selectAll('.linkText')
                            .data(scope.graph.links)
                            .enter().append('g').attr("transform", function(d) {
                        return "translate(" + d.source.x + "," + d.source.y + ") " +
                                "rotate(" + (Math.atan2(d.target.y - d.source.y, d.target.x - d.source.x) * 180 / Math.PI) + ")";
                    }).attr('class', 'linkText');
                    linkText.append('text').attr('text-anchor', 'middle');
                    var linkLabels = linkText.selectAll('text').text(function(d) {
                        return d.type;
                    }).attr('x', force.linkDistance() / 2).on('click', function(d) {
                        console.log(d);
                    });

                    var node = svg.selectAll('.node')
                            .data(scope.graph.nodes)
                            .attr('class', 'node');

                    var grp = node.enter().append('g').attr("transform", function(d) {
                        return "translate(" + d.x + "," + d.y + ")";
                    }).attr('class', 'node').call(force.drag);

                    grp.append('circle')
                            .attr('r', 2);
                    grp.append('text')
                            .attr('text-anchor', 'middle');

                    node.selectAll('text').text(function(d) {
                        return d.properties.name;
                    });

                    node.exit().remove();

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
                            return "translate(" + d.source.x + "," + d.source.y + ") " +
                                    "rotate(" + (Math.atan2(d.target.y - d.source.y, d.target.x - d.source.x) * 180 / Math.PI) + ")";
                        });



                        node.attr("transform", function(d) {
                            return "translate(" + d.x + "," + d.y + ")";
                        });
                    })
                }

                scope.$watch(attrs.graph, function(val) {
                    viz();
                })

            }
        };
    }]);