var app = angular.module('neoApp', ['ngRoute', 'ui.bootstrap', 'd3Services']);

app.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
        $routeProvider.when('/relations', {
            templateUrl: 'partials/relations',
            controller: 'RelsCtrl'
        })
                .when('/graphviewer', {
                    templateUrl: 'partials/graphviz',
                    controller: 'GraphCtrl'
                })
                .when('/minigraph', {
                    templateUrl: 'partials/mini',
                    controller: 'MiniCtrl'
                });

        $locationProvider.html5Mode(true);
    }]);

app.controller('MiniCtrl', ['$scope', function($scope) {
        $scope.nextId = 3;
        $scope.graph = {
            nodes: [{
                    _id: 1,
                    x: 0,
                    y:250,
                    properties: {
                        name: "Node 1"
                    }
                },
                {
                    _id: 2,
                    x: 500,
                    y: 250,
                    properties: {
                        name: "Node 2"                    
                    }
                }],
            links: [{
                    source: 0,
                    target: 1,
                    type: "RELATES_TO"
                }]
        }
        
        $scope.addNode = function(){
            $scope.graph.nodes.push({
                _id: $scope.nextId,
                x: 50,
                y: 50,
                properties: {
                    name: "Node " + $scope.nextId
                }
            });
            $scope.graph.links.push({
                source: $scope.nextId - 2,
                target: $scope.nextId - 1,
                type: "RELATES_TO"
            });
            $scope.nextId++;
            //console.log($scope.graph);
        }
        
        $scope.nodeClick = function(node){
            console.log(node);
        }
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