import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { fonts, fontSize } from '../../lib/design-system';

const TypographyExample = () => {
  return (
    <div className="p-8 space-y-12">
      <div>
        <h2 className="text-2xl font-bold mb-6">Font Families</h2>
        <div className="space-y-4">
          <div className="p-4 border rounded-lg">
            <div className="text-sm text-gray-600 mb-2">Sans (UI Font)</div>
            <div className="font-sans text-xl">
              The quick brown fox jumps over the lazy dog
            </div>
            <div className="text-sm text-gray-500 mt-2">
              {fonts.sans.join(', ')}
            </div>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="text-sm text-gray-600 mb-2">Serif (Newspaper Font)</div>
            <div className="font-serif text-xl">
              The quick brown fox jumps over the lazy dog
            </div>
            <div className="text-sm text-gray-500 mt-2">
              {fonts.serif.join(', ')}
            </div>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="text-sm text-gray-600 mb-2">Mono (Code Font)</div>
            <div className="font-mono text-xl">
              The quick brown fox jumps over the lazy dog
            </div>
            <div className="text-sm text-gray-500 mt-2">
              {fonts.mono.join(', ')}
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-6">Font Sizes</h2>
        <div className="space-y-4">
          {Object.entries(fontSize).map(([key, value]) => (
            <div key={key} className="flex items-baseline gap-4 p-4 border rounded-lg">
              <div className="w-20 text-sm text-gray-600">{key}</div>
              <div style={{ fontSize: value }}>
                The quick brown fox jumps over the lazy dog
              </div>
              <div className="ml-auto text-sm text-gray-500">{value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const meta: Meta<typeof TypographyExample> = {
  title: 'Design System/Typography',
  component: TypographyExample,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof TypographyExample>;

export const AllTypography: Story = {};
