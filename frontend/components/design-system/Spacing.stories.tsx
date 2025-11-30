import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { spacing } from '../../lib/design-system';

const SpacingExample = () => {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-6">Spacing Scale</h2>
        <div className="space-y-4">
          {Object.entries(spacing).map(([key, value]) => (
            <div key={key} className="flex items-center gap-4">
              <div className="w-20 text-sm text-gray-600">{key}</div>
              <div className="flex items-center gap-2">
                <div
                  className="bg-primary-500"
                  style={{ width: value, height: '2rem' }}
                />
                <div className="text-sm text-gray-500">{value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-6">Usage Examples</h2>
        <div className="space-y-6">
          <div className="border rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-4">Padding Examples</div>
            <div className="space-y-2">
              <div className="bg-gray-100 p-2 inline-block">p-2 (0.5rem / 8px)</div>
              <div className="bg-gray-100 p-4 inline-block">p-4 (1rem / 16px)</div>
              <div className="bg-gray-100 p-6 inline-block">p-6 (1.5rem / 24px)</div>
              <div className="bg-gray-100 p-8 inline-block">p-8 (2rem / 32px)</div>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-4">Margin Examples</div>
            <div className="space-y-2">
              <div className="bg-gray-100 inline-block">
                <div className="bg-primary-500 text-white p-2 m-2">m-2</div>
              </div>
              <div className="bg-gray-100 inline-block">
                <div className="bg-primary-500 text-white p-2 m-4">m-4</div>
              </div>
              <div className="bg-gray-100 inline-block">
                <div className="bg-primary-500 text-white p-2 m-6">m-6</div>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-4">Gap Examples (Flexbox)</div>
            <div className="flex gap-2 mb-2">
              <div className="bg-primary-500 text-white p-2">gap-2</div>
              <div className="bg-primary-500 text-white p-2">gap-2</div>
              <div className="bg-primary-500 text-white p-2">gap-2</div>
            </div>
            <div className="flex gap-4 mb-2">
              <div className="bg-primary-500 text-white p-2">gap-4</div>
              <div className="bg-primary-500 text-white p-2">gap-4</div>
              <div className="bg-primary-500 text-white p-2">gap-4</div>
            </div>
            <div className="flex gap-8">
              <div className="bg-primary-500 text-white p-2">gap-8</div>
              <div className="bg-primary-500 text-white p-2">gap-8</div>
              <div className="bg-primary-500 text-white p-2">gap-8</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const meta: Meta<typeof SpacingExample> = {
  title: 'Design System/Spacing',
  component: SpacingExample,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof SpacingExample>;

export const AllSpacing: Story = {};
