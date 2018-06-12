// the formatter function for subset, method and documents
const formatter = require('./formatter');
const methodHandler = require('./method-handler');

// schema validator
const validator = require('../validator')({
    getSubsetDocuments: require('../../schemas/base-dataset/get-subset-documents')
});

module.exports = {

    /**
     * Creates a subset record in the database.
     * @param {Object} base - The QMiner base object.
     * @param {Object} subset - The subset to store.
     * @param {String} subset.label - The label of the subset.
     * @param {String} [subset.description] - The subset description.
     * @param {Number} subset.resultedIn - The id of the method that created the subset.
     * @param {Number[]} subset.documents - Array of document ids the subset contains.
     */
    create(base, subset) {
        // TODO: log activity

        let subsetId = base.store('Subsets').push({
            label:       subset.label,
            description: subset.description
        });
        let method = base.store('Methods')[subset.resultedIn];
        if (method && !method.deleted) {
            // add join to method
            base.store('Subsets')[subsetId].$addJoin('resultedIn', method);
            if (method.type === 'filter.manual') {
                subset.documents = method.result.docIds;
            }
        }

        if(subset.meta) {
            // use metadata to determine the documents in the subset
            if (!isNaN(parseFloat(subset.meta.clusterId))) {
                // subset contains documents that were in the cluster
                let clusterId = subset.meta.clusterId;
                subset.documents = method.result.clusters[clusterId].docIds;
                // update cluster information
                let clusters = method.result.clusters;
                clusters[clusterId].label = subset.label;
                clusters[clusterId].subset = {
                    created: true,
                    id: subsetId
                };
                method.result = { clusters };
            }
        }

        // add joins to documents/elements
        for (let documentId of subset.documents) {
            let document = base.store('Dataset')[documentId];
            if (document) { base.store('Subsets')[subsetId].$addJoin('hasElements', document); }
        }
        // return id of created subset
        return {
            subsets: {
                id: subsetId
            }
        };
    },

    /**
     * Gets information about the subsets in the database.
     * @param {Object} base - The QMiner base object.
     * @param {Number} [id] - The id of the subset.
     * @returns {Object} An array of subset representation objects.
     */
    get(base, id) {

        function getSubsetRelatedMethods(subset, fieldName) {
            let methods = subset[fieldName];
            if (methods && methods.length && methods[0].deleted !== undefined) {
                methods.filterByField('deleted', false);
            }
            return method.map(method => formatter.method(method));
        }

        let subsets = base.store('Subsets');
        let response = { subsets: null };
        if (!isNaN(parseFloat(id))) {
            // get one subset and format it
            let subset = subsets[id];
            if (!subset || subset.deleted) { return null; }
            response.subsets = formatter.subset(subset);

            response.methods = [ ];
            if (subset.resultedIn) {
                // set the resulted in method
                let resultedInMethod = [formatter.method(subset.resultedIn)];
                response.methods = response.methods.concat(resultedInMethod);
            }
            if (subset.usedBy.length) {
                // get methods that used the subset
                let usedByMethods = getSubsetRelatedMethods(subset, 'usedBy');
                response.methods = response.methods.concat(usedByMethods);
            }
            // remove the 'methods' property if none were given
            if (!response.methods.length) { delete response.methods; }
        } else {
            let allSubsets = subsets.allRecords;
            if (allSubsets && allSubsets.length && allSubsets[0].deleted !== undefined) {
                allSubsets.filterByField('deleted', false);
            }
            response.subsets = allSubsets.map(rec => formatter.subset(rec));
        }
        // return the subsets
        return response;
    },

    /**
     * Creates a subset record in the database.
     * @param {Object} base - The QMiner base object.
     * @param {Object} info - The subset information.
     * @param {String} info.label - The new subset label.
     * @param {String} [info.description] - The new subset description.
     */
    set(base, info) {
        // get subset info and update state
        let subset = base.store('Subsets')[info.subsetId];

        // update the subset label and description
        if (info.label) { subset.label = info.label; }
        if (info.description || info.description === null) {
            subset.description = info.description;
        }

        // return the subset information
        return { subsets: formatter.subset(subset) };
    },

    /**
     * Set the deleted flag for the subset and all its joins.
     * @param {Object} base - The QMiner base object.
     * @param {Number} id - The id of the subset.
     */
    delete(base, id) {
        let subsets = base.store('Subsets');
        if (!isNaN(parseFloat(id))) {
            let subset = subsets[id];
            // if no subset or already deleted just skip
            if (!subset || subset.deleted) { return null; }
            // set the deleted flag to true
            if (subset.deleted !== undefined && subset.deleted === false) {
                subset.deleted = true;
                // iterate through it's joins
                for (let i = 0; i < subset.usedBy.length; i++) {
                    let method = subset.usedBy[i];
                    methodHandler.delete(base, method.$id);
                }
            }
        }
    }


    /**
     * Gets documents that are part of the subset.
     * @param {Object} base - The QMiner base object.
     * @param {Number} id - Subset id.
     * @param {Object} [query] - Query for retrieving documents.
     * @param {Number} [query.limit=10] - The number of documents it retrieves.
     * @param {Number} [query.offset=0] - The retrieval starting point.
     * @param {Number} [query.page] - The page number based on the limit.
     * @param {Object} [query.sort] - The sort parameters.
     * @param {String} query.sort.fieldName - The field by which the sorting is done.
     * @param {String} [query.sort.sortType] - The flag specifiying is sort is done. Possible: `asc` or `desc`.
     * @returns {Object} The object containing the documents and it's metadata.
     */
    documents(base, id, query, fields) {
        // get database subsets

        if (id < 0 || base.store('Subsets').length <= id) {
            // TODO: log error
            return { errors: { message: 'The subset id does not match with any existing subsets' } };
        }

        // prepare the query parameters
        let offset = query.offset ? query.offset : 0;
        let limit = query.limit ? query.limit : 10;
        // if page exists, modify offset
        if (query.page) {
            offset = (query.page - 1) * limit;
        }
        // get page number - offset and limit are more reliable
        let page = Math.floor(offset/limit) + 1;

        // prepare qminer query
        let qmQuery = {
            $join: {
                $name: 'hasElements',
                $query: {
                    $from: 'Subsets',
                    $id: id
                }
            }
        };

        if (query.sort) {
            // TODO: check if sort object has expected schema
            const ascendingFlag = query.sort.sortType === 'desc' ? -1 : 1;
            const field = query.sort.field;
            // set sort to the query
            qmQuery.$sort = { };
            qmQuery.$sort[field] = ascendingFlag;
        }

        // add additional queries - keywords
        let queryParams = query.query;
        if (queryParams && queryParams.text) {
            qmQuery.$or = [ ];
            for (let field of queryParams.text.fields) {
                // add field and value to the query
                let fieldQuery = { };
                fieldQuery[field] = queryParams.text.keywords;
                qmQuery.$or.push(fieldQuery);
            }
        }
        // add additional queries - ranges
        if (queryParams && queryParams.number) {
            for (let field of queryParams.number) {
                // add field and value to the query
                qmQuery[field.field] = {
                    $gt: parseFloat(field.values[0]),
                    $lt: parseFloat(field.values[1])
                };
            }
        }
        // get the subset documents
        let subsetDocuments = base.search(qmQuery);

        // prepare field metadata
        let metaFields = fields
            .map(field => {
                let sortType = null;
                // if the documents were sorted by the field
                if (query.sort && query.sort.field === field.name) {
                    sortType = query.sort.sortType;
                }
                // return field metadata
                field.sortType = sortType;
                return field;
            });

        // document aggregates
        let aggregates = [];
        if (queryParams.calcAggr && queryParams.calcAggr === 'true') {
            for (let field of fields) {
                // get aggregate distribution
                if (field.aggregate) {
                    let distribution = methodHandler._aggregateByField(subsetDocuments, field);
                    aggregates.push({
                        field: field.name,
                        type: field.aggregate,
                        distribution
                    });
                }
            }
        }

        // prepare objects
        let documents = {
            documents: null,
            meta: {
                fields: metaFields,
                pagination: {
                    page,
                    limit,
                    documentCount: subsetDocuments.length,
                },
                query: queryParams && queryParams.text ? queryParams : null,
                aggregates
            }
        };

        // truncate the documents and format documents
        subsetDocuments.trunc(limit, offset);
        documents.documents = subsetDocuments.map(rec => formatter.document(rec));
        return documents;
    }

};