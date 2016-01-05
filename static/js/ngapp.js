var app = angular.module('neoApp', ['ngRoute', 'ui.bootstrap', 'd3Services']);

app.config(['$routeProvider', '$locationProvider', '$compileProvider', function($routeProvider, $locationProvider, $compileProvider) {
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
                })
                .when('/explorer', {
                    controller: 'ExploreCtrl',
                    templateUrl: 'partials/explorer'
                })
                .when('/reports', {
                    controller: 'RptCtrl',
                    templateUrl: 'partials/reports'
                }).otherwise({
                    controller: 'ExploreCtrl',
                    templateUrl: 'partials/explorer'
                });

        $locationProvider.html5Mode(true);
        
        //whitelist data urls
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|data):/);
    }]);

app.controller('NavCtrl', ['$scope', '$location', function($scope, $location) {
        /* todo: handle '/' case */
        $scope.$on('$locationChangeSuccess', function(e, newUrl) {
            $scope.curUrl = $location.url();
        });

        $scope.curUrl = $location.url();
    }]);

app.controller('RptCtrl', ['$scope', '$http', function($scope, $http) {

        $scope.objectTypes = [];
        $scope.objects = [];
        $scope.cols = [];

        $scope.getNodes = function(oType) {
            $http.get('/api/nodes/' + oType).then(function(results) {
                var obs = results.data.data;
                // extract unique property names so we can build columns
                var cols = [];
                obs.forEach(function(val, i) {
                    cols = _.union(cols, Object.keys(val));
                });
                //put 'name' col at front
                cols.unshift(cols.splice(cols.indexOf('name'), 1)[0]);
                $scope.cols = cols;
                $scope.objects = obs;
                $scope.exportLink = getExportLink();
                $scope.selectedType = oType;
            });
        };
        
        $scope.exportLink = "";
        
        
        function getExportLink(label){
            var link = "data:text/csv;charset=utf-8,", recordSep = encodeURIComponent("\r\n");
            $scope.cols.forEach(function(val, index){
                if (index > 0) link += ',';
                link += encodeURIComponent('"' + val + '"');
            });
            link += recordSep;
            var tmpRow = [], tmpRows = [];
            $scope.objects.forEach(function(val, i){
                //loop through cols and write value to row
                for (var c=0; c<$scope.cols.length; c++){
                    tmpRow.push('"' + (val[$scope.cols[c]] || ' ') + '"');
                }
                tmpRows.push(encodeURIComponent(tmpRow.join(',')));
                tmpRow = [];
            });
            link += tmpRows.join(recordSep);
            link += recordSep;
           
            
            return link;
        };

        /* load object types */
        $http.get('/api/nodelabels').then(function(results) {
            $scope.objectTypes = results.data;

        });

    }]);

app.controller('MiniCtrl', ['$scope', function($scope) {
        $scope.nextId = 3;
        $scope.graph = {
            nodes: [{
                    id: 1,
                    x: 0,
                    y: 250,
                    properties: {
                        name: "Node 1"
                    }
                },
                {
                    id: 2,
                    x: 500,
                    y: 250,
                    properties: {
                        name: "Node 2"
                    }
                }],
            links: [{
                    source: 0,
                    target: 1,
                    type: "RELATES_TO",
                    id: 100
                }]
        }

        $scope.addNode = function() {
            $scope.graph.nodes.push({
                id: $scope.nextId,
                x: 50,
                y: 50,
                properties: {
                    name: "Node " + $scope.nextId
                }
            });
            $scope.graph.links.push({
                source: $scope.nextId - 2,
                target: $scope.nextId - 1,
                type: "RELATES_TO",
                id: $scope.nextId + 100
            });
            $scope.nextId++;
            //console.log($scope.graph);
        }

        $scope.nodeClick = function(node) {
            console.log(node);
        }
    }]);

app.controller('ExploreCtrl', ['$scope', '$http', 'neoGraphToD3', function($scope, $http, ngd3) {
        var linkIndex = [], nodeindex = [];
        $scope.graph = {nodes: [], links: []};
        $scope.width = undefined;
        $scope.height = 800;
        $scope.startNode = 59;
        $scope.searchTerm = "";
        $scope.results = [];
        $scope.searching = false;
        $scope.collapseSearch = false;
        $scope.selectedNode = undefined;
        $scope.dirty = false;
        $scope.trashbin = [];

        $scope.search = function() {
            $scope.searching = true;
            $http.get('/api/node?q=' + $scope.searchTerm).then(function(resp) {
                $scope.results = resp.data;
                $scope.searching = false;
                $scope.collapseSearch = false;
            });
        };

        $scope.keyHandler = function(e) {
            if (e.keyCode === 13)
                $scope.search();
        }

        $scope.reset = function() {
            $scope.graph = {nodes: [], links: []};
            $scope.searchTerm = "";
            $scope.selectedNode = null;
            $scope.dirty = false;
        };

        $scope.chooseStart = function(id) {
            loadRelated(id, $scope.graph.nodes.length === 0);
            $scope.collapseSearch = true;
        };

        $scope.nodeClick = function(n) {
            loadRelated(n.id);
            
        };
        
        $scope.nodeSelected = function(n){
            $scope.$apply(function(){
                //convert properties to an array before binding
                var tmp = [];
                Object.keys(n.properties).forEach(function(val, i){
                    tmp.push({name: val, value: n.properties[val]});
                });
                n.displayProperties = tmp;
                $scope.selectedNode = n;
                
            });
        }
        
        $scope.addProperty = function(){
            $scope.selectedNode.displayProperties.push({name: "", value: ""});
        }
        
        $scope.deleteProp = function(i){
            $scope.trashbin.push($scope.selectedNode.displayProperties.splice(i, 1)[0]);
            $scope.dirty = true;
        }
        
        $scope.restore = function(prop){
            $scope.selectedNode.displayProperties.push($scope.trashbin.splice(prop, 1)[0]);
        }
        
        $scope.saveProperty = function(){
            $scope.selectedNode.properties[$scope.newProp.name] = $scope.newProp.value;
            $scope.newProp = undefined;
        }
        
        $scope.cancelProperty = function(){
            $scope.newProp = undefined;
        }
        
        $scope.updateNode = function(){
            $scope.saving = true;
            $http.put('/api/node', {node: $scope.selectedNode}).then(function(data){
                $scope.saving = false;
                $scope.dirty = false;
                $scope.graph.nodes[$scope.graph.nindex.indexOf($scope.selectedNode.id)].properties = data.data;
            }, function(err){
                alert(err);
            })
        }
        
        function loadRelated(nid, initialize) {
            $http.post('/api/node/' + nid + '/related', {
                en: $scope.graph.nindex
            }).then(function(data) {
                if (initialize) {
                    $scope.graph = ngd3(data.data, $scope.graph, nid, $scope.width / 2, $scope.height / 2);
                } else
                    $scope.graph = ngd3(data.data, $scope.graph);

            });
        }



    }])

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
        $scope.graph = {nodes: [], links: []};
        $scope.nodeClick = function(node) {
            console.log(node);
        };

        $scope.query = function() {
            $http.get('/api/graph').then(function(result) {
                var res = ngd3(result.data);
                $scope.graph = {nodes: res.nodes,
                    links: res.links};
            });
        };

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