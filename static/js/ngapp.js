var app = angular.module('neoApp', ['ngRoute', 'ui.bootstrap', 'd3Services']);

app.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
        $routeProvider.when('/relations', {
            templateUrl: 'partials/relations',
            controller: 'RelsCtrl'
        })
                .when('/graphviewer', {
                    templateUrl: 'partials/graphviz',
                    controller: 'GraphCtrl'
                });

        $locationProvider.html5Mode(true);
    }]);

app.directive('d3Graph', [function() {
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

app.controller('RelsCtrl', ['$scope', '$http', '$q', '$uibModal', '$window', function($scope, $http, $q, $uibModal, $window) {

        $scope.loadByType = function(which, preselect) {
            console.log(preselect);
            $http.get('/api/nodes/' + (which == 'from' ? $scope.fromType : $scope.toType))
                    .then(function(data) {

                        if (which == 'from') {
                            $scope.fromEntities = data.data.data;
                            $scope.from = $scope.fromEntities.filter(function(val) {
                                return val._id == preselect;
                            })[0];
                        }
                        else {
                            $scope.toEntities = data.data.data;
                            $scope.to = $scope.toEntities.filter(function(val) {
                                return val._id == preselect;
                            })[0];
                        }
                    });
        };

        $scope.addRelationship = function() {
            $http.post('/api/relationship', {
                start: $scope.from._id,
                end: $scope.to._id,
                relationship: $scope.relationship
            }).then(function(data) {
                if ($scope.relationTypes.indexOf($scope.relationship) === -1)
                    $scope.relationTypes.push($scope.relationship);
                $scope.relationship = null;
            });
        };

        $scope.capitalize = function() {
            if ($scope.relationship) {
                $scope.relationship = $scope.relationship.toUpperCase();
                $scope.relationship = $scope.relationship.replace(' ', '_');
                //remove special characters
                $scope.relationship = $scope.relationship.replace(/[^_0-9A-Z]/g, '')
            }
        }

        $scope.from = null;
        $scope.to = null;
        $scope.fromType = null;
        $scope.toType = null;
        $scope.entityTypes = [];
        $scope.fromEntities = [];
        $scope.toEntities = [];
        $scope.relationship = null;
        $scope.relationTypes = [];
        $scope.loading = true;
        $scope.nodeRelations = [];

        /* visualizer stuff */
        $scope.width = $window.innerWidth;
        $scope.height = $window.innerHeight;
        $scope.nodes = [];
        $scope.links = [];

        /* modal node add form */
        $scope.newNode = function(which) {
            $uibModal.open({
                templateUrl: 'partials/newnode',
                controller: 'ModalNodeCtrl',
                resolve: {
                    types: function() {
                        return $scope.entityTypes;
                    }
                }
            }).result.then(function(node) {
                if ($scope.entityTypes.indexOf(node.label) === -1)
                    $scope.entityTypes.push(node.label);
                if (which == 'from') {
                    $scope.fromType = node.label;
                }
                else
                    $scope.toType = node.label;
                $scope.loadByType(which, node._id);
            });
        };

        $scope.nodeQuery = function() {
            /* if from and to are defined, query to see how they're related */
            if ($scope.from && $scope.to) {
                $http.post('/api/relations', {
                    from: $scope.from._id,
                    to: $scope.to._id
                }).then(function(result) {
                    $scope.nodeRelations = result.data.data;
                });
            }
        }

        /* initialize */
        $q.all([
            $http.get('/api/nodelabels'),
            $http.get('/api/relationlabels')
        ]).then(function(results) {
            $scope.entityTypes = results[0].data;
            $scope.relationTypes = results[1].data;
            $scope.loading = false;
        });


    }]);

app.controller('GraphCtrl', ['$scope', '$http', 'neoGraphToD3', '$window', function($scope, $http, ngd3, $window) {

        $scope.width = $window.innerWidth;
        $scope.height = $window.innerHeight;
        $scope.graph = {nodes: [], links: []}

        $scope.query = function() {
            $http.get('/api/graph').then(function(result) {
                var res = ngd3(result.data);
                $scope.graph = {nodes: res.nodes,
                    links: res.links};
            });
        }

        $scope.query();
    }]);

app.controller('ModalNodeCtrl', ['$scope', '$http', '$uibModalInstance', 'types', function($scope, $http, $uibModalInstance, types) {

        $scope.types = types;
        $scope.newnode = {extendedProps: []};

        $scope.cancel = function() {
            $uibModalInstance.dismiss('Cancelled');
        };

        $scope.save = function() {
            $http.post('/api/node', $scope.newnode).then(function(resp) {
                if (resp.status === 200) {
                    $scope.newnode._id = resp.data._id;
                    $uibModalInstance.close($scope.newnode);
                }
                else
                    alert('Error saving that node!');
            });
        };
    }]);