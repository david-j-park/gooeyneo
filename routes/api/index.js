var express = require('express')
, router = express.Router()
, api = require('./api');

router.get('/', api.hello);
router.get('/nodelabels', api.getNodeLabels);
router.get('/relationlabels', api.getRelationshipLabels);
router.get('/nodes/:label', api.getNodesWithLabel);
router.post('/relationship', api.createRelationship);
router.post('/relations', api.queryNodes);
router.post('/node', api.createNode);
router.get('/graph', api.graphQuery);
module.exports = router;