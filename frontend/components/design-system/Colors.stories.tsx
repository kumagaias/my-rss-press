import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { colors } from '../../lib/design-system';

const ColorSwatch = ({ name, value }: { name: string; value: string }) => (
  <div className="flex items-center gap-4 p-4 border rounded-lg">
    <div
      className="w-16 h-16 rounded-lg border shadow-sm"
      style={{ backgroundColor: value }}
    />
    <div>
      <div className="font-semibold">{name}</div>
      <div className="text-sm text-gray-600">{value}</div>
    </div>
  </div>
);

const ColorPalette = () => {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Primary Colors</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(colors.primary).map(([key, value]) => (
            <ColorSwatch key={key} name={`primary-${key}`} value={value} />
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Newspaper Theme Colors</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(colors.newspaper).map(([key, value]) => (
            <ColorSwatch key={key} name={`newspaper-${key}`} value={value} />
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Semantic Colors</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ColorSwatch name="success" value={colors.success} />
          <ColorSwatch name="warning" value={colors.warning} />
          <ColorSwatch name="error" value={colors.error} />
          <ColorSwatch name="info" value={colors.info} />
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Grayscale</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(colors.gray).map(([key, value]) => (
            <ColorSwatch key={key} name={`gray-${key}`} value={value} />
          ))}
        </div>
      </div>
    </div>
  );
};

const meta: Meta<typeof ColorPalette> = {
  title: 'Design System/Colors',
  component: ColorPalette,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof ColorPalette>;

export const AllColors: Story = {};
