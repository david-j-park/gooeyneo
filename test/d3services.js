describe('d3Services', function() {

    beforeEach(module('d3Services'));

    describe('graph converter', function() {

        it('should convert a neo4j graph to d3 nodes/links', function() {
            var converter;
            
            inject(function($injector){
                converter = $injector.get('neoGraphToD3');
            });
            
            var test = {
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
            
            var result = converter(test);
            
            expect(result.nodes.length).toEqual(2);
            expect(result.links.length).toEqual(1);

        })

    })

})