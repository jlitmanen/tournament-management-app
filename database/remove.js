const e = require('express');
const PocketBase = require('pocketbase/cjs');

const url = 'https://eye-sister.pockethost.io/'
const pb = new PocketBase(url)

async function removeContent(req, res) {
    var id = req.body.id === '' ? null : req.body.id;
    await pb.collection('content').delete(id);
};

module.exports = { removeContent };

