import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Checkbox } from './Checkbox';

const meta: Meta<typeof Checkbox> = {
  title: 'UI/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  argTypes: {
    checked: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Default: Story = {
  args: {
    label: 'Accept terms and conditions',
  },
};

export const Checked: Story = {
  args: {
    label: 'I agree to the terms',
    checked: true,
  },
};

export const Unchecked: Story = {
  args: {
    label: 'Subscribe to newsletter',
    checked: false,
  },
};

export const WithHelperText: Story = {
  args: {
    label: 'Make this newspaper public',
    helperText: 'Public newspapers can be viewed by anyone',
  },
};

export const WithError: Story = {
  args: {
    label: 'Accept terms and conditions',
    error: 'You must accept the terms to continue',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled checkbox',
    disabled: true,
  },
};

export const DisabledChecked: Story = {
  args: {
    label: 'Disabled and checked',
    disabled: true,
    checked: true,
  },
};

export const NoLabel: Story = {
  args: {
    'aria-label': 'Select item',
  },
};

export const LongLabel: Story = {
  args: {
    label: 'I agree to the terms and conditions, privacy policy, and cookie policy. I understand that my data will be processed according to these policies.',
    helperText: 'Please read all policies carefully before accepting',
  },
};

export const FeedSelection: Story = {
  args: {
    label: 'Tech News RSS Feed',
    helperText: 'https://example.com/tech-feed',
    checked: true,
  },
};
