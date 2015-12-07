describe('Graph Visualization Controller', function(){
    
    var $controller, $httpBackend, $scope, ctrl;
    
    var testGraph = {
                results: [
                    {
                        columns: [
                            "a",
                            "r",
                            "n"
                        ],
                        data: [
                            {
                                graph: {
                                    nodes: [
                                        {
                                            id: "128",
                                            labels: [
                                                "Application"
                                            ],
                                            properties: {
                                                name: "Online Giving",
                                                url: "https://giving.columbia.edu/giveonline",
                                                authentication: "n/a"
                                            }
                                        },
                                        {
                                            id: "201",
                                            labels: [
                                                "Functionality"
                                            ],
                                            properties: {
                                                name: "Credit Card Giving",
                                                desc: "Real-time giving via credit card to most any school/division"
                                            }
                                        }
                                    ],
                                    relationships: [
                                        {
                                            id: "129",
                                            type: "PROVIDES",
                                            startNode: "128",
                                            endNode: "201",
                                            properties: {}
                                        }
                                    ]
                                }
                            }]}]};
    
    beforeEach(module('neoApp'));
    
    beforeEach(inject(function(_$controller_, $injector){
        $controller = _$controller_;
        $httpBackend = $injector.get('$httpBackend');
        
        $httpBackend.when('GET', '/api/graph')
                .respond(testGraph);
        
        $scope = {
            nodes: [],
            links: []
        };
        ctrl = $controller('GraphCtrl', {$scope: $scope});
    }));
    
    afterEach(function(){
        $httpBackend.verifyNoOutstandingExpectation();
    });
    
    it('should poll the API to get a graph', function(){
        $httpBackend.expectGET('/api/graph');
        $scope.query();
    });
    
    it('should populate nodes and links', function(){
        $httpBackend.expectGET('/api/graph');
        $scope.query();
        $httpBackend.flush();
        expect($scope.nodes.length).toBeGreaterThan(0);
        expect($scope.links.length).toBeGreaterThan(0);
    })
    
    
    
})