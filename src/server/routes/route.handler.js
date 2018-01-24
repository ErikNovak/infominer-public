/**
 * Adds api routes to express  app.
 * @param {Object} app - Express app.
 * @param {Object} pg - Postgres wrapper.
 * @param {Object} processHandler - Child process container.
 */
module.exports = function (app, pg, processHandler) {

    /////////////////////////////////////////////////////////////////////
    // Functions used for sending messages to child processes
    /////////////////////////////////////////////////////////////////////

    /**
     * Sends a message to the child process.
     * @param {Number} childId - The child process id.
     * @param {String} owner - The owner of the dataset.
     * @param {Object} msg - The message content.
     * @param {Function} callback - The function executed at the end.
     */
    function sendToProcess(childId, owner, msg, callback) {
        let sendMessage = function (err) {
            if (err) { return callback(err); }
            processHandler.sendAndWait(childId, msg, callback);
        };

        if (processHandler.childExist(childId)) {
            // send the request to the process
            sendMessage();
        } else {
            // opens
            _openProcess(childId, owner, sendMessage);
        }
    }

    /**
     * Sends a message to the child process.
     * @param {Number} childId - The child process id.
     * @param {String} owner - The owner of the dataset.
     * @param {Function} callback - The function executed at the end.
     * @private
     */
    function _openProcess(childId, owner, callback) {
        // get the dataset information
        pg.select({ id: childId, owner }, 'datasets', (err, results) => {
            if (err) {
                // TODO: log error
                return callback(err);
            } else if (results.length === 1) {
                let datasetInfo = results[0];
                // initiate child process
                processHandler.createChild(childId);
                // open dataset in child process
                let openParams = {
                    cmd: 'open_dataset',
                    content: {
                        params: {
                            datasetId: childId,
                            label: datasetInfo.label,
                            description: datasetInfo.description,
                            created: datasetInfo.created,
                            mode: 'open',
                            dbPath: datasetInfo.dbpath
                        }
                    }
                };
                processHandler.sendAndWait(childId, openParams, function (xerr) {
                    if (xerr) { return callback(xerr); }
                    callback();
                });
            } else {
                callback({});
            }
        });
    }

    /////////////////////////////////////////////////////////////////////
    // API Routes
    /////////////////////////////////////////////////////////////////////

    require('./v1/v1.dataset.js')(app, pg, processHandler, sendToProcess);
    require('./v1/v1.subset.js') (app, pg, processHandler, sendToProcess);
    require('./v1/v1.method.js') (app, pg, processHandler, sendToProcess);

};