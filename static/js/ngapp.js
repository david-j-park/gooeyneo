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
                height: '='
            },
            link: function(scope, element, attrs) {
                
                function ellipsize() {
        var self = d3.select(this),
            textLength = self.node().getComputedTextLength(),
            text = self.text();
        while (textLength > (width - 2 * padding) && text.length > 0) {
            text = text.slice(0, -1);
            self.text(text + '...');
            textLength = self.node().getComputedTextLength();
        }
    } 
                
                var force = d3.layout.force()
                        .size([scope.width, scope.height])
                        .charge(-500)
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
                            .attr('class', 'node');
                                
                    var grp = node.enter().append('g').attr("transform", function (d) {
                        return "translate(" + d.x + "," + d.y + ")";
                    }).attr('class', 'node').call(force.drag);
                    
                    grp.append('circle')
                            .attr('r', 30);
                    grp.append('text')
                            .attr('text-anchor', 'middle');
                                
                    node.selectAll('text').text(function(d){
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

                        node.attr("transform", function(d) {
                             return "translate(" + d.x + "," + d.y + ")";
                        });
                    })
                }
                
                scope.$watch(attrs.nodes, function(val){
                    //console.log(val);
                    //scope.nodes = val;
                    viz();
                })
                
                /*
                scope.$watch(attrs.links, function(val){
                    viz();
                })
                */
            }
        };
    }]);

app.controller('RelsCtrl', ['$scope', '$http', '$q', '$uibModal', function($scope, $http, $q, $uibModal) {

        $scope.loadByType = function(which, preselect) {
            console.log(preselect);
            $http.get('/api/nodes/' + (which == 'from' ? $scope.fromType : $scope.toType))
                    .then(function(data) {

                        if (which == 'from') {
                            $scope.fromEntities = data.data.data;
                            $scope.from = $scope.fromEntities.filter(function(val){
                                return val._id == preselect;
                            })[0];
                        }
                        else {
                            $scope.toEntities = data.data.data;
                            $scope.to = $scope.toEntities.filter(function(val){
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
                if ($scope.relationTypes.indexOf($scope.relationship) === -1) $scope.relationTypes.push($scope.relationship);
                $scope.relationship = null;
            });
        };
        
        $scope.capitalize = function(){
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
                if ($scope.entityTypes.indexOf(node.label) === -1) $scope.entityTypes.push(node.label);
                if (which == 'from') {
                    $scope.fromType = node.label;
                }
                else $scope.toType = node.label;
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
                    /*
                    $scope.nodes = [
                        result.data.data[0][0], result.data.data[0][2]

                    ];
                    $scope.links = [
                        {source: 0, target: 1}
                    ]
                    */
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

app.controller('GraphCtrl', ['$scope', '$http', 'neoGraphToD3', function($scope, $http, ngd3){
    
    $scope.nodes = [];
    $scope.links= [];
    
    $scope.query = function(){
        $http.get('/api/graph').then(function(result){
            var res = ngd3(result.data);
            $scope.nodes = res.nodes;
            $scope.links = res.links;
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