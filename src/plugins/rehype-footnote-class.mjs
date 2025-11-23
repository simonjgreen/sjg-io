import { visitParents } from 'unist-util-visit-parents';

/** @type {import('rehype').Plugin<[], import('hast').Root>} */
export default function rehypeFootnoteClass() {
  return (tree) => {
    visitParents(tree, 'element', (node, ancestors) => {
      // Find li elements
      if (node.tagName === 'li') {
        // Check ancestors to see if we're in section.footnotes > ol
        for (const ancestor of ancestors) {
          if (ancestor.type === 'element') {
            // Check if ancestor is section with footnotes class
            if (ancestor.tagName === 'section') {
              let sectionClasses = [];
              if (ancestor.properties?.className) {
                if (typeof ancestor.properties.className === 'string') {
                  sectionClasses = [ancestor.properties.className];
                } else if (Array.isArray(ancestor.properties.className)) {
                  sectionClasses = ancestor.properties.className;
                }
              }
              
              const hasFootnotesClass = sectionClasses.some(c => 
                typeof c === 'string' && (c === 'footnotes' || c.includes('footnotes'))
              );
              
              if (hasFootnotesClass) {
                // Check if there's an ol in the ancestor path
                const hasOl = ancestors.some(a => 
                  a.type === 'element' && a.tagName === 'ol'
                );
                
                if (hasOl) {
                  // This li is in footnotes - add the class
                  if (!node.properties) {
                    node.properties = {};
                  }
                  
                  let liClasses = [];
                  if (node.properties.className) {
                    if (typeof node.properties.className === 'string') {
                      liClasses = [node.properties.className];
                    } else if (Array.isArray(node.properties.className)) {
                      liClasses = node.properties.className;
                    }
                  }
                  
                  if (!liClasses.includes('footnote-item')) {
                    node.properties.className = [...liClasses, 'footnote-item'];
                  }
                  break;
                }
              }
            }
          }
        }
      }
    });
  };
}
