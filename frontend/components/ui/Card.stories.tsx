import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './Card';
import { Button } from './Button';

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  tags: ['autodocs'],
  argTypes: {
    padding: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg'],
    },
    shadow: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg'],
    },
    hover: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  args: {
    children: (
      <div>
        <h3 className="text-lg font-bold mb-2">Card Title</h3>
        <p className="text-gray-600">This is a simple card with default styling.</p>
      </div>
    ),
  },
};

export const WithComponents: Story = {
  args: {
    children: (
      <>
        <CardHeader>
          <CardTitle>Newspaper Card</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            This is a card using the Card component system with header, content, and footer.
          </p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Created:</span>
              <span className="font-medium">2025-12-01</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Views:</span>
              <span className="font-medium">42</span>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <div className="flex gap-2">
            <Button variant="primary" size="sm">
              View
            </Button>
            <Button variant="outline" size="sm">
              Share
            </Button>
          </div>
        </CardFooter>
      </>
    ),
  },
};

export const NoPadding: Story = {
  args: {
    padding: 'none',
    children: (
      <div>
        <img
          src="https://via.placeholder.com/400x200"
          alt="Placeholder"
          className="w-full rounded-t-lg"
        />
        <div className="p-6">
          <h3 className="text-lg font-bold mb-2">Image Card</h3>
          <p className="text-gray-600">Card with no padding to accommodate full-width image.</p>
        </div>
      </div>
    ),
  },
};

export const SmallPadding: Story = {
  args: {
    padding: 'sm',
    children: (
      <div>
        <h3 className="text-lg font-bold mb-2">Compact Card</h3>
        <p className="text-gray-600">This card has small padding.</p>
      </div>
    ),
  },
};

export const LargePadding: Story = {
  args: {
    padding: 'lg',
    children: (
      <div>
        <h3 className="text-lg font-bold mb-2">Spacious Card</h3>
        <p className="text-gray-600">This card has large padding for more breathing room.</p>
      </div>
    ),
  },
};

export const NoShadow: Story = {
  args: {
    shadow: 'none',
    className: 'border border-gray-200',
    children: (
      <div>
        <h3 className="text-lg font-bold mb-2">Flat Card</h3>
        <p className="text-gray-600">This card has no shadow, using a border instead.</p>
      </div>
    ),
  },
};

export const LargeShadow: Story = {
  args: {
    shadow: 'lg',
    children: (
      <div>
        <h3 className="text-lg font-bold mb-2">Elevated Card</h3>
        <p className="text-gray-600">This card has a large shadow for emphasis.</p>
      </div>
    ),
  },
};

export const WithHover: Story = {
  args: {
    hover: true,
    children: (
      <div>
        <h3 className="text-lg font-bold mb-2">Interactive Card</h3>
        <p className="text-gray-600">Hover over this card to see the shadow effect.</p>
      </div>
    ),
  },
};

export const NewspaperPreview: Story = {
  args: {
    hover: true,
    children: (
      <>
        <div className="aspect-video bg-newspaper-paper rounded-t-lg mb-4 flex items-center justify-center">
          <span className="text-newspaper-ink font-serif text-2xl">Newspaper Preview</span>
        </div>
        <CardContent>
          <CardTitle>Tech Morning Digest</CardTitle>
          <p className="text-gray-600 mt-2 mb-4">
            Your daily dose of technology news, curated by AI.
          </p>
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>By John Doe</span>
            <span>42 views</span>
          </div>
        </CardContent>
      </>
    ),
  },
};
