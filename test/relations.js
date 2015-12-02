describe('Relations Controller', function() {

    beforeEach(module('neoApp'));

    var $controller, $httpBackend, $rootScope;

    beforeEach(inject(function(_$controller_, $injector) {
        $controller = _$controller_;
        $rootScope = $injector.get('$rootScope')
        $httpBackend = $injector.get('$httpBackend');
        $httpBackend.when('GET', '/api/nodelabels')
                .respond(['App']);
        $httpBackend.when('GET', '/api/relationlabels')
                .respond(['DOES']);
    }));

    beforeEach(function(){
        $httpBackend.expectGET('/api/nodelabels');
        $httpBackend.expectGET('/api/relationlabels');
    });
    
    afterEach(function(){
        $httpBackend.verifyNoOutstandingExpectation();
    });
    
    it('should initialize with relation/node labels', function(){
        var $scope = {};
        //$scope.relTypes = [];
        $controller('RelsCtrl', {$scope: $scope});
        $httpBackend.flush();
        expect($scope.relationTypes.length).toEqual(1);
        expect($scope.entityTypes.length).toEqual(1);
    })

    it('should capitalize and replace spaces and special characters in relations', function() {
        
        var $scope = {};
        var ctrl = $controller('RelsCtrl', {$scope: $scope});
        $scope.relationship = "abc def'&#";
        $scope.capitalize();
        expect($scope.relationship).toEqual("ABC_DEF");
        
    });

    

});