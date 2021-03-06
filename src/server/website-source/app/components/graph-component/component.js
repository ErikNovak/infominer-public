import Component from '@ember/component';
import { once } from '@ember/runloop';

import $ from 'jquery';

export default Component.extend({
    // component attributes
    classNames: ['graph'],
    tagName: 'svg',

    // container size
    attributeBindings: ['width', 'height'],
    width: 0,
    height: 0,

    // resize timer - for window resize
    resizeTimer: null,

    ///////////////////////////////////////////////////////
    // Component Life Cycle
    ///////////////////////////////////////////////////////

    didInsertElement() {
        let self = this;
        // set element width
        self._super(...arguments);
        self._handleResize();
        // set window resize listener
        $(window).on('resize', function () {
            clearTimeout(self.get('windowResize'));
            clearInterval(self.get('resizeTimer'));
            self.set('windowResize', setTimeout(function () {
                once(self, '_handleResize');
                self.set('resizeTimer', setInterval(self._checkResize.bind(self), 100));
            }, 500));
        });

        self.set('resizeTimer', setInterval(self._checkResize.bind(self), 100));
    },

    willDestroyElement() {
        this._super(...arguments);
        clearTimeout(this.get('windowResize'));
        clearInterval(this.get('resizeTimer'));
        $(window).off('resize');
    },


    ///////////////////////////////////////////////////////
    // Helper functions
    ///////////////////////////////////////////////////////

    _checkResize() {
        let self = this;
        if ($(self.element).width() >= 0 && $(self.element).width() !== self.get('width')) {
            once(self, '_handleResize');
        }
    },

    /**
     * Resizes the width and height.
     */
    _handleResize() {
        this.setProperties({
            width: $(this.element).width(),
            height: $(this.element).height()
        });
    },

    /**
     * Draws the graph
     */
    drawGraph() { }
});
