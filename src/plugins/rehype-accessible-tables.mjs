import { visit } from 'unist-util-visit';

/**
 * Make GFM-generated data tables accessible:
 *  - add `scope="col"` to header cells in <thead> (GFM tables are column-header tables)
 *  - wrap each <table> in a focusable, labelled scroll region so keyboard users
 *    can reach and scroll wide tables on narrow viewports (WCAG 1.3.1 / 2.1.1)
 *
 * @type {import('rehype').Plugin<[], import('hast').Root>}
 */
export default function rehypeAccessibleTables() {
  return (tree) => {
    // 1. Add scope="col" to <th> cells inside <thead>.
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'thead') return;
      visit(node, 'element', (cell) => {
        if (cell.tagName === 'th') {
          cell.properties = cell.properties || {};
          if (!cell.properties.scope) {
            cell.properties.scope = 'col';
          }
        }
      });
    });

    // 2. Wrap each <table> in a focusable region for horizontal scrolling.
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'table' || !parent || typeof index !== 'number') return;
      // Skip if already wrapped.
      if (parent.tagName === 'div' && parent.properties?.role === 'region') return;

      const wrapper = {
        type: 'element',
        tagName: 'div',
        properties: {
          className: ['table-region'],
          role: 'region',
          'aria-label': 'Table, scroll horizontally to view all columns',
          tabIndex: 0
        },
        children: [node]
      };
      parent.children[index] = wrapper;
    });
  };
}
