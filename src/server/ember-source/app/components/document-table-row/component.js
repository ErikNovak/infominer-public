import Component from '@ember/component';

export default Component.extend({
    // component attributes
    classNames: ['document'],
    classNameBindings: ['selected'],
    selected: false,

    // component attributes
    dataTarget: '',

    // component tag
    tagName: 'tr',

    nWords: 10,

    ///////////////////////////////////////////////////////
    // Component Life Cycle
    ///////////////////////////////////////////////////////

    init() {
        this._super(...arguments);
        this.set('selected', false);
    },

    didReceiveAttrs() {
        this._super(...arguments);

        // get document valueObject and fields
        const document = this.get('document');
        const fields = this.get('fields');

        // save document values
        let docValues = [ ];
        // get values in the fields order
        for (let field of fields) {
            let value = document.get(`values.${field.name}`);
            if (field.type == 'string') { value = this._trimContent(value, this.get('nWords')); }
            docValues.push({ value: value, field: field.name });
        }
        // save values
        this.set('index', document.get('id'));
        this.set('selected', document.get('selected'));
        this.set('docValues', docValues);

        // set link with expanded info
        this.set('dataTarget', `#document-${document.id}`);
    },

    ///////////////////////////////////////////////////////
    // Actions
    ///////////////////////////////////////////////////////

    actions: {
        /**
         * Toggles if the document is selected or not.
         */
        selectDocument() {
            // get checkbox status
            this.toggleProperty('selected');
            this.set('document.selected', this.get('selected'));

        }
    },

    /**
     *
     * @param {String} content - Content to be trimmed.
     * @param {Number} nWords - How many words the content can contain.
     * @returns {String} Trimmed content.
     */

    _trimContent(string, nWords) {
        const stringWords = string.split(' ');
        if (stringWords.length < nWords) { return string; }
        let newWords = stringWords.slice(0, nWords);
        return newWords.join(' ') + ' ...';
    }

});
