import { Extension, InputRule } from '@tiptap/core';

/**
 * SectionExtension
 * 
 * Automatically detects manual typing of song sections like:
 * [verse], [verse 1], [chorus], [chorus 2], [pre-chorus], [bridge], [hook], [intro], [outro]
 * and converts the block into a formatted H3 section title heading with standardized Title Case.
 * 
 * Once converted, the left gutter detects it as a section tag and renders 'SEC' without syllable count.
 */
export const SectionExtension = Extension.create({
  name: 'sectionExtension',

  addInputRules() {
    return [
      new InputRule({
        // Matches bracketed section tags right when the user types the closing ']'
        find: /(?:^|\s)\[(verse|chorus|bridge|pre-chorus|hook|outro|intro|interlude|solo)(?:\s*(\d+))?\]$/i,
        handler: ({ state, range, match }) => {
          const rawType = match[1].toLowerCase();
          const num = match[2] ? ` ${match[2]}` : '';

          const typeMap: Record<string, string> = {
            verse: 'Verse',
            chorus: 'Chorus',
            'pre-chorus': 'Pre-Chorus',
            bridge: 'Bridge',
            hook: 'Hook',
            intro: 'Intro',
            outro: 'Outro',
            interlude: 'Interlude',
            solo: 'Solo',
          };

          const formattedType = typeMap[rawType] || (rawType.charAt(0).toUpperCase() + rawType.slice(1));
          const formattedText = `[${formattedType}${num}]`;

          const { tr, schema } = state;

          // Determine exact position of opening '['
          const fullMatchStr = match[0];
          const bracketIndex = fullMatchStr.indexOf('[');
          const actualFrom = range.from + (bracketIndex > 0 ? bracketIndex : 0);
          const actualTo = range.to;

          // Replace typed string with standardized section title
          tr.replaceWith(actualFrom, actualTo, schema.text(formattedText));

          // Transform the parent paragraph block into an H3 heading
          const $pos = tr.doc.resolve(actualFrom);
          const blockDepth = $pos.depth;
          const blockStart = $pos.before(blockDepth);
          const blockEnd = $pos.after(blockDepth);

          if (schema.nodes.heading) {
            tr.setBlockType(blockStart, blockEnd, schema.nodes.heading, { level: 3 });
          }
        },
      }),
    ];
  },
});
