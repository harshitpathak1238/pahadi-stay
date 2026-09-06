import { Mark, Node } from '@tiptap/core';

const parseAttribute = (name: string) => (element: HTMLElement) => element.getAttribute(name) || null;

export const GenericDiv = Node.create({
  name: 'genericDiv',
  group: 'block',
  content: 'block*',
  defining: true,
  isolating: true,
  addAttributes() {
    return {
      class: { default: null, parseHTML: parseAttribute('class'), renderHTML: (attributes: { class?: string | null }) => attributes.class ? { class: attributes.class } : {} },
      style: { default: null, parseHTML: parseAttribute('style'), renderHTML: (attributes: { style?: string | null }) => attributes.style ? { style: attributes.style } : {} },
    };
  },
  parseHTML() {
    return [{ tag: 'div' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', HTMLAttributes, 0];
  },
});

export const GenericSpan = Mark.create({
  name: 'genericSpan',
  inclusive: true,
  addAttributes() {
    return {
      class: { default: null, parseHTML: parseAttribute('class'), renderHTML: (attributes: { class?: string | null }) => attributes.class ? { class: attributes.class } : {} },
      style: { default: null, parseHTML: parseAttribute('style'), renderHTML: (attributes: { style?: string | null }) => attributes.style ? { style: attributes.style } : {} },
    };
  },
  parseHTML() {
    return [{ tag: 'span' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['span', HTMLAttributes, 0];
  },
});

export const GenericArticle = Node.create({
  name: 'genericArticle',
  group: 'block',
  content: 'block*',
  defining: true,
  addAttributes() {
    return {
      class: { default: null, parseHTML: parseAttribute('class'), renderHTML: (attributes: { class?: string | null }) => attributes.class ? { class: attributes.class } : {} },
      style: { default: null, parseHTML: parseAttribute('style'), renderHTML: (attributes: { style?: string | null }) => attributes.style ? { style: attributes.style } : {} },
    };
  },
  parseHTML() {
    return [{ tag: 'article' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['article', HTMLAttributes, 0];
  },
});
