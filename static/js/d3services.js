var svcmodule = angular.module('d3Services', []);

svcmodule.factory('neoGraphToD3', function() {
    return function(neograph, graphToMerge, anchorNode, x, y) {
        var nodes = [], nodeIndex = [], links = [], linkIndex = [];
        if (graphToMerge) {
            nodes = graphToMerge.nodes || [];
            nodeIndex = graphToMerge.nindex || [];
            links = graphToMerge.links || [];
            linkIndex = graphToMerge.lindex || [];
        }
        neograph.results[0].data.forEach(function(val, i) {

            /* add nodes to array if not already present */
            val.graph.nodes.forEach(function(n) {
                if (nodeIndex.indexOf(n.id) === -1) {
                    //check whether this is our anchor node
                    if (n.id == anchorNode){
                        n.fixed = true;
                        n.x = x;
                        n.y = y;
                    }
                    nodes.push(n);
                    nodeIndex.push(n.id).toString();
                }
            });

            /* process links to d3's expected format */
            val.graph.relationships.forEach(function(l) {
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
                var w = angular.element(element[0]).parent()[0].clientWidth;
                console.log(w);
                scope.width = scope.width || w;
                scope.height = scope.height || w;
                var center = [scope.width / 2, scope.height / 2];
                var force = d3.layout.force()
                        .size([scope.width, scope.height])
                        .charge(-500)
                        .linkDistance(150)
                        .linkStrength(0.5)
                        .gravity(0.1)
                        .friction(0.6);
                var svg = d3.select(element[0]).append('svg')
                        .attr('width', scope.width)
                        .attr('height', scope.height);

                // "indexes" of ids in the nodes/links arrays
                var nindex = {}, lindex = {};
                scope.graph.nodes.forEach(function(val) {
                    nindex[val.id] = true;
                });
                scope.graph.links.forEach(function(val) {
                    lindex[val.id] = true;
                })
                
                var linkGroup = svg.append('g').attr('class', 'lg');
                    

                function viz() {

                    /* rotation/distance function for links */
                    function rotationAngle(p1, p2) {
                        var dy, dx;
                        dy = (p1.y - p2.y);
                        dx = (p2.x - p1.x);
                        var theta = Math.atan2(dy, dx) * 180 / Math.PI;
                        if (theta < 0)
                            theta = Math.abs(theta);
                        else
                            theta = 360 - theta;
                        return theta;
                    }

                    function linkLength(p1, p2) {
                        return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
                    }
                    
                    var drag = force.drag();
                    drag.on('dragend', function(d){
                        //console.log('Done dragging');
                        d.fixed = !d.fixed;
                    });
                    drag.on('dragstart', function(d){
                        //d.fixed = false;
                    })

                    force.nodes(scope.graph.nodes)
                            .links(scope.graph.links)
                            .start();

                    /* event handlers */
                    function nodeClick(d, i) {
                        if (typeof (scope.onNodeClick) === 'function')
                            scope.onNodeClick(d);
                    }

                    /* link labels */
                    var links = linkGroup.selectAll('.link')
                            .data(scope.graph.links);

                    var link = links.enter().append('g').attr("transform", function(d) {
                        var angle = rotationAngle(d.source, d.target);
                        return "translate(" + d.source.x + "," + d.source.y + ") " +
                                "rotate(" + angle + ")";
                    }).attr('class', 'link');
                            
                    link.append('text').attr('text-anchor', 'middle')
                            .each(function(d) {
                                lindex[d.id] = true;
                                //console.log(lindex);
                            });
                            
                    link.append('path');


                    /* link text */
                    var linkLabels = links.selectAll('text').text(function(d) {
                        return d.type;
                    }).attr('x', function(d) {
                        return linkLength(d.source, d.target) / 2;
                    }).on('click', function(d) {
                        //console.log(d);
                    });

                    /* link lines */
                    var linkLines = links.selectAll('path').attr('d', function(d) {
                        var l = linkLength(d.source, d.target);
                        var end = l - 25;
                        //console.log(end);
                        var p = "M25 0.5 L" + end + " 0.5 Z";
                        return p;
                    }).attr('class', 'connector');

                    var node = svg.selectAll('.node')
                            .data(scope.graph.nodes)
                            .attr('class', function(d){
                                return 'node ' + d.labels[0];
                    }).on('dblclick', nodeClick).on('click', function(d){
                        if (d3.event.defaultPrevented) return;
                        var el = d3.select(this);
                        el.classed('selected', !el.classed('selected'));
                    });

                    var grp = node.enter().append('g').attr("transform", function(d) {
                        return "translate(" + d.x + "," + d.y + ")";
                    }).attr('class', function(d){
                        return 'node ' + d.labels[0];
                    }).on('dblclick', nodeClick).call(drag).each(function(d) {
                        nindex[d.id] = true;
//                        console.log(nindex);
                    });

                    grp.append('circle')
                            .attr('r', 25);
                    grp.append('text')
                            .attr('text-anchor', 'middle');

                    node.selectAll('text').each(function(d) {
                        var el = d3.select(this);
                        var wds = d.properties.name.split(/\s|\./);
                        el.text('');
                        var max = (wds.length < 3 ? wds.length : 3);
                        for (var i = 0; i < max; i++) {
                            var tspan = el.append('tspan').text(wds[i]);
                            if (i > 0)
                                tspan.attr('x', 0).attr('dy', 12);
                        }
                        el.attr('dy', (max - 1) * -5);
                    }).attr('dominant-baseline', 'middle');

                    node.exit().each(function(d) {
                        //remove from index
                        nindex[d.id] = false;
                    }).remove();

                    links.exit().each(function(d) {
                        lindex[d.id] = false;
                    }).remove();

                    force.on('tick', function() {

                        links.attr("transform", function(d) {
                            var angle = rotationAngle(d.source, d.target); //(Math.atan2(d.target.y - d.source.y, d.target.x - d.source.x) * 180 / Math.PI);
                            return "translate(" + d.source.x + "," + d.source.y + ") " +
                                    "rotate(" + angle + ")";
                        });

                        linkLines.attr('d', function(d) {
                            var l = linkLength(d.source, d.target);
                            var p = "M25 0.5 L" + (l - 25) + " 0.5 l-7 -7 l0 14 l7 -7 Z";
                            
                            return p;
                        });

                        linkLabels.attr("transform", function(d) {

                            var angle = (Math.atan2(d.target.y - d.source.y, d.target.x - d.source.x) * 180 / Math.PI);
                            if (Math.abs(angle) > 90)
                                return "rotate (180 " + linkLength(d.source, d.target)/2 + " 0)";

                        }).attr('x', function(d) {
                            return linkLength(d.source, d.target) / 2;
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