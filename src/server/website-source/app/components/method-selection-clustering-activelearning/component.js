import Component from '@ember/component';
import { observer, set } from '@ember/object';
import { once } from '@ember/runloop';

export default Component.extend({
    // component attributes

    ///////////////////////////////////////////////////////
    // Component Life Cycle
    ///////////////////////////////////////////////////////

    init() {
        this._super(...arguments);
        // set default cluster number
        // set possible clustering types
        set(this, 'queryText', '');
    },

    didReceiveAttrs() {
        this._super(...arguments);
        // set the parameters of the method
        this._setParameters();
    },

    ///////////////////////////////////////////////////////
    // Actions
    ///////////////////////////////////////////////////////

    actions: {

    },

    ///////////////////////////////////////////////////////
    // Helper functions
    ///////////////////////////////////////////////////////

    _setParameters() {
        // set parameter values
        this.set('parameters.method', {
            queryText: this.get('queryText')
        });
    }
});
