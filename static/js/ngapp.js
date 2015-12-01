var app = angular.module('neoApp', ['ngRoute', 'ui.bootstrap']);

app.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
        $routeProvider.when('/relations', {
            templateUrl: 'partials/relations',
            controller: 'RelsCtrl'
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
                height: '='
            },
            link: function(scope, element, attrs) {
                var force = d3.layout.force()
                        .size([scope.width, scope.height])
                        .charge(-5)
                        .linkDistance(150);
                var svg = d3.select(element[0]).append('svg')
                        .attr('width', scope.width)
                        .attr('height', scope.height);

                function viz() {

                    force.nodes(scope.nodes)
                            .links(scope.links)
                            .start();
                    var link = svg.selectAll('.link')
                            .data(scope.links)
                            .enter().append("line")
                            .attr('class', 'link');
                    var node = svg.selectAll('.node')
                            .data(scope.nodes)
                            .attr('class', 'node')
                            .attr('r', 25)
                            .attr("title", function(d){
                                            return d.name;
                                });
                                
                    node.enter().append('circle').attr('class', 'node')
                            .attr('r', 25)
                            .attr("title", function(d){
                                            return d.name;
                                })
                                        .attr('cy', scope.height / 2)
                                        .attr('cx', scope.width / 2);
                                
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

                        node.attr("cx", function(d) {
                            return d.x;
                        })
                                .attr("cy", function(d) {
                                    return d.y;
                                });
                    })
                }
                
                scope.$watch(attrs.nodes, function(val){
                    //console.log(val);
                    //scope.nodes = val;
                    viz();
                })
                
                scope.$watch(attrs.links, function(val){
                    viz();
                })
                
            }
        };
    }]);

app.controller('RelsCtrl', ['$scope', '$http', '$q', '$uibModal', function($scope, $http, $q, $uibModal) {

        $scope.loadByType = function(which) {
            $http.get('/api/nodes/' + (which == 'from' ? $scope.fromType : $scope.toType))
                    .then(function(data) {

                        if (which == 'from')
                            $scope.fromEntities = data.data.data;
                        else
                            $scope.toEntities = data.data.data;
                    });
        };

        $scope.addRelationship = function() {
            $http.post('/api/relationship', {
                start: $scope.from._id,
                end: $scope.to._id,
                relationship: $scope.relationship
            }).then(function(data) {
                $scope.relationship = null;
            });
        };

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
        $scope.width = 500;
        $scope.height = 500;
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
                if ($scope.entityTypes.indexOf(node.label === -1))
                    $scope.entityTypes.push(node.label);
                if (which == 'from') {
                    $scope.fromType = node.label;
                }
                else
                    $scope.toType = node.label;
                $scope.loadByType(which);
            });
        };

        $scope.nodeQuery = function() {
            /* if from and to are defined, query to see how they're related */
            if ($scope.from && $scope.to) {
                $http.post('/api/relations', {
                    from: $scope.from._id,
                    to: $scope.to._id
                }).then(function(result) {
                    console.log(result);
                    $scope.nodeRelations = result.data.data;
                    $scope.nodes = [
                        result.data.data[0][0], result.data.data[0][2]

                    ];
                    $scope.links = [
                        {source: 0, target: 1}
                    ]
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