import Route from '@ember/routing/route';
import ENV from '../config/environment';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';
import { inject as service } from '@ember/service';
import $ from 'jquery';

/**
 * For development do not use authentication.
 * for other environments (production) user authentication.
 */
const DatasetRoute = ENV.environment === 'development' ?
    Route.extend({ }) :
    Route.extend(AuthenticatedRouteMixin);

export default DatasetRoute.extend({

    unloadExtra: service('unload-extra'),

    model(params) {
        // unload subsets and methods
        let { dataset_id } = params;
        const namespace = `api/datasets/${dataset_id}`;
        // modify namespace for subset and method model
        let subsetAdapter = this.get('store').adapterFor('subset');
        let methodAdapter = this.get('store').adapterFor('method');

        // check if the namespace has changed
        if (subsetAdapter.get('namespace') !== namespace) {
            // unload all data
            this.get('store').unloadAll();
            // set new namespace
            subsetAdapter.set('namespace', namespace);
            methodAdapter.set('namespace', namespace);
        }
        return this.get('store').findRecord('dataset', params.dataset_id);
    },

    actions: {
        /**
         * Deletes the dataset from the user library.
         */
        deleteDataset() {
            // delete dataset and send to backend
            // calls DELETE /api/datasets/:dataset_id
            this.modelFor(this.routeName).destroyRecord().then(() => {
                // remove modal backdrop and redirect to dataset library
                $('#delete-dataset-modal').modal('toggle');
                this.transitionTo('datasets');
            });
        },

        /**
         * Deletes the subset with the given id.
         * @param {Number | String} subsetId - The subset id.
         */
        deleteSubset(subsetId) {
            let self = this;
            $('#subset-delete-modal .modal-footer .btn-danger').html(
                '<i class="fa fa-circle-o-notch fa-spin fa-fw"></i>'
            );
            let subset = this.get('store').peekRecord('subset', subsetId);
            self.modelFor('dataset').get('hasSubsets').removeObject(subset);
            subset.destroyRecord().then(() => {
                // reload dataset model
                self.modelFor('dataset').reload().then((response) => {
                    self.get('unloadExtra.unload')(response, self.get('store'), 'method');
                    self.get('unloadExtra.unload')(response, self.get('store'), 'subset');
                    // if subset deleted through edit subset modal
                    if ($('#edit-subset-modal').hasClass('show')) {
                        $('#edit-subset-modal').modal('toggle');
                    } 
                    // hide the subset-delete-modal
                    $('#subset-delete-modal').modal('toggle');
                    let datasetId = parseInt(self.modelFor('dataset').get('id'));
                    self.transitionTo('dataset.subset', datasetId, 0);
                });
            });
        },

        /**
         * Deletes the method with the given id.
         * @param {Number | String} methodId - The method id.
         */
        deleteMethod(methodId) {
            let self = this;
            $('#method-delete-modal .modal-footer .btn-danger').html(
                '<i class="fa fa-circle-o-notch fa-spin fa-fw"></i>'
            );
            let method = this.get('store').peekRecord('method', methodId);
            self.modelFor('dataset').get('hasMethods').removeObject(method);
            method.set('appliedOn', null);
            method.destroyRecord().then(() => {
                // reload dataset model
                self.modelFor('dataset').reload().then((response) => {
                    self.get('unloadExtra.unload')(response, self.get('store'), 'method');
                    self.get('unloadExtra.unload')(response, self.get('store'), 'subset');
                    // hide the method-delete-modal
                    $('#method-delete-modal').modal('toggle');
                    let datasetId = parseInt(self.modelFor('dataset').get('id'));
                    self.transitionTo('dataset.subset', datasetId, 0);
                });
            });
        }

    }

});
