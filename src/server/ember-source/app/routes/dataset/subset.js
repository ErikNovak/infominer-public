import Route from '@ember/routing/route';

export default Route.extend({

    beforeModel() {
        // reload model for parent route
        this.modelFor('dataset').reload();
    },

    model(params) {
        // get the subset info
        return this.get('store').findRecord('subset', params.subset_id, { reload: true });
    },

    afterModel(model) {
        let methodId = model.belongsTo('resultedIn').id();
        if (!isNaN(parseFloat(methodId))) { this.get('store').findRecord('method', methodId); }
    }

});
