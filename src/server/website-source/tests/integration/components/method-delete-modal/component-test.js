import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('method-delete-modal', 'Integration | Component | method delete modal', {
  integration: true
});

test('it renders', function(assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{method-delete-modal}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#method-delete-modal}}
      template block text
    {{/method-delete-modal}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});
