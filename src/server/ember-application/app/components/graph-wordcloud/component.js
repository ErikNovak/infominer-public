// extend from graph component
import GraphComponent from '../graph-component/component';
import { observer, set } from '@ember/object';

// d3 visualizations
import { min, max } from 'd3-array';
import { select } from 'd3-selection';
import { scaleLinear, scaleQuantize } from 'd3-scale';
// used to create the wordcloud
import cloud from 'npm:d3-cloud';

// declare new graph component
const WordCloudComponent = GraphComponent.extend({
    // component attributes
    classNames: ['wordcloud'],

    // wordcloud font size
    maxFontSize: 36,
    minFontSize: 10,

    ///////////////////////////////////////////////////////
    // Component Life Cycle
    ///////////////////////////////////////////////////////

    init() {
        this._super(...arguments);
        set(this, 'data', []);
        set(this, 'colorClass', ['small', 'medium', 'large']);
    },

    didReceiveAttrs() {
        this._super(...arguments);
        this.prepareText(this.get('keywords'));
    },

    ///////////////////////////////////////////////////////
    // Helper functions
    ///////////////////////////////////////////////////////

    /**
     * Prepares the data used to generate the wordcloud.
     * @param {Object[]} keywords - Array of `keyword` and `weight` values.
     */
    prepareText(keywords) {
        keywords = keywords.slice(0, 50);
        // get minimum and maximum weights
        let minWeight = min(keywords, d => d.weight);
        let maxWeight = max(keywords, d => d.weight);
        // get minimum and maximum font size
        let minFontSize = this.get('minFontSize');
        let maxFontSize = this.get('maxFontSize');

        let colorClass = this.get('colorClass');

        // set font size scale
        let fontScale = scaleLinear()
            .domain([minWeight, maxWeight])
            .range([minFontSize, maxFontSize]);

        // set text color class
        let textSizeClass = scaleQuantize()
            .domain([minWeight, maxWeight])
            .range(colorClass);

        // get keywords data
        let data = keywords.map(function(d) {
            return {
                text: d.keyword.toUpperCase(),
                size: minWeight === maxWeight ?
                    maxFontSize : fontScale(d.weight),
                colorClass: minWeight === maxWeight ?
                    colorClass[colorClass.length-1] :
                    textSizeClass(d.weight)
            };
        });
        // set the data
        this.set('data', data);
    },

    dataObserver: observer('data', 'width', 'height', function () {
        let self = this;
        Ember.run.once(function () { setTimeout(function () { self.drawGraph(); }, 2000); });
    }),

    /**
     * Prepares the cloud canvas.
     */
    drawGraph() {
        // get the container size
        let width = this.get('width');
        let height = this.get('height');

        // get keywords data
        let data = this.get('data');

        // prepare wordcloud
        cloud().size([width, height])
            .words(data)
            .rotate(0)
            .random(() => 0.5)
            .font('Open Sans')
            .fontSize(d => d.size)
            .on('end', this._createWordCloud.bind(this))
            .start();
    },

    /**
     * Draws the wordcloud on the creen.
     * @param {Object[]} words - Array of words generated by `prepareText`.
     */
    _createWordCloud(words) {
        // get the container size
        let width = this.get('width');
        let height = this.get('height');

        // remove previous g components
        select(this.element).selectAll('g').remove();

        // create a new wordcloud
        select(this.element)
            .attr('width', width)
            .attr('height', height)
          .append('g')
            .attr('transform', `translate(${width/2}, ${height/2})`)
          .selectAll('text')
            .data(words)
          .enter().append('text')
            .style('font-size', d => `${d.size}px`)
            .attr('class', d => d.colorClass)
            .attr('text-anchor', 'middle')
            .attr('transform', d => `translate(${d.x},${d.y})`)
            .text(d => d.text);
    }

});

// add positional parameters
WordCloudComponent.reopenClass({
    positionalParams: ['keywords']
});
// export wordcloud component
export default WordCloudComponent;