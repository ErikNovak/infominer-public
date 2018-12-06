import Component from '@ember/component';
import { computed } from '@ember/object';
import $ from 'jquery';

export default Component.extend({
    // component attributes
    classNames: ['modal', 'modal-style--edit'],
    attributeBindings: ['tabindex', 'role'],
    tagName: 'div',
    tabindex: -1,
    role: 'dialog',

    ///////////////////////////////////////////////////////
    // Component Life Cycle
    ///////////////////////////////////////////////////////

    init() {
        this._super(...arguments);
        this.set('name', 'Subset');
        this.set('description', '');
    },

    didReceiveAttrs() {
        this._super(...arguments);
        // get cluster id and set subset name
        let parameters = this.get('parameters');
        let name = parameters.label != null ? parameters.label : 'Subset';
        // set parameters
        this.set('name', name);
        this.set('description', '');
    },

    invalid: computed('name', function () {
        return !this.get('name');
    }),

    ///////////////////////////////////////////////////////
    // Actions
    ///////////////////////////////////////////////////////

    actions: {
        /**
         * Change subset name.
         */
        changeSubsetName() {
            this.set('name', $(`#${this.get('id')} .modal-style--edit_description input`).val());
        },

        /**
         * Change subset description.
         */
        changeSubsetDescription() {
            this.set('description', $(`#${this.get('id')} .modal-style--edit_description textarea`).val());
        },

        /**
         * Save the subset.
         */
        saveSubset() {

            if (this.get('invalid')) { return; }

            // prepare subset info object
            const subset = {
                label: this.get('name'),
                description: this.get('description'),
                parameters: this.get('parameters')
            };

            // make it loading
            $(`#${this.elementId} .modal-footer .btn-primary`).html(
                '<i class="fa fa-circle-o-notch fa-spin fa-fw"></i>'
            );

            // invoke the route action on subset info
            this.get('createSubset')(subset);
        }
    }

});