import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('document-table-create-subset', 'Integration | Component | document table create subset', {
  integration: true
});

test('it renders', function(assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{document-table-create-subset}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#document-table-create-subset}}
      template block text
    {{/document-table-create-subset}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});
