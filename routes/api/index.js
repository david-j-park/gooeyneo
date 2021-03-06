var express = require('express')
, router = express.Router()
, api = require('./api');

router.get('/', api.hello);
router.get('/nodelabels', api.getNodeLabels);
router.get('/relationlabels', api.getRelationshipLabels);
router.get('/nodes/:label', api.getNodesWithLabel);
router.post('/relationship', api.createRelationship);
router.post('/relations', api.queryNodes);
router.get('/node/:id/related', api.relatedNodes);
router.post('/node/:id/related', api.relatedNodes);
router.get('/node', api.searchNodes);
router.post('/node', api.createNode);
router.put('/node', api.updateNode);
router.get('/graph', api.graphQuery);
module.exports = router;