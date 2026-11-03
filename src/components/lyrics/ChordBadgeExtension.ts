import { Node, mergeAttributes, InputRule } from '@tiptap/core';

export const ChordBadgeNode = Node.create({
  name: 'chordBadge',
  group: 'inline',
  inline: true,
  selectable: true,
  atom: true,

  addAttributes() {
    return {
      chord: {
        default: 'C',
        parseHTML: element => element.getAttribute('data-chord') || element.textContent?.replace(/[\[\]]/g, '').trim() || 'C',
        renderHTML: attributes => {
          return {
            'data-chord': attributes.chord,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-chord]',
      },
      {
        tag: 'chord-badge',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const chord = node.attrs.chord || 'C';
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-chord': chord,
        class: 'chord-badge inline-flex items-center px-1 py-0 my-0 mx-0.5 rounded font-mono font-bold text-[11px] sm:text-[12px] bg-[#1C1917] text-[#FAF9F5] shadow-2xs cursor-pointer select-none hover:bg-[#292524] active:scale-95 transition-all',
        title: `Akor ${chord} • Klik untuk diagram piano/fretboard & audio`,
      }),
      ['span', { class: 'chord-name tracking-tight pointer-events-none' }, chord],
    ];
  },

  addInputRules() {
    return [
      new InputRule({
        find: /\[([A-G][b#]?(?:m|maj|min|dim|aug|sus[24]|add9|[0-9])*)\]$/,
        handler: ({ state, range, match }) => {
          const chord = match[1];
          if (!chord) return;
          const { tr } = state;
          tr.replaceWith(range.from, range.to, this.type.create({ chord }));
        },
      }),
    ];
  },
});
