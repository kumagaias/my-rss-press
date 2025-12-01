import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Modal, ModalFooter } from './Modal';
import { Button } from './Button';
import { Input } from './Input';

const meta: Meta<typeof Modal> = {
  title: 'UI/Modal',
  component: Modal,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
    },
    closeOnOverlayClick: {
      control: 'boolean',
    },
    showCloseButton: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Modal>;

// Wrapper component to handle modal state
const ModalWrapper = (args: any) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
      <Modal {...args} isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export const Default: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    title: 'Modal Title',
    children: (
      <div>
        <p className="text-gray-600">
          This is a simple modal with default settings. Click outside or press ESC to close.
        </p>
      </div>
    ),
  },
};

export const WithForm: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    title: 'Newspaper Settings',
    children: (
      <div className="space-y-4">
        <Input label="Newspaper Name" placeholder="My Morning Digest" />
        <Input label="Your Name" placeholder="John Doe" />
        <div className="flex items-center">
          <input type="checkbox" id="public" className="mr-2" />
          <label htmlFor="public" className="text-sm text-gray-700">
            Make this newspaper public
          </label>
        </div>
      </div>
    ),
  },
};

export const WithFooter: Story = {
  render: (args) => {
    const [isOpen, setIsOpen] = useState(false);
    
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
        <Modal {...args} isOpen={isOpen} onClose={() => setIsOpen(false)}>
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to delete this newspaper? This action cannot be undone.
            </p>
          </div>
          <ModalFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setIsOpen(false)}>
              Confirm
            </Button>
          </ModalFooter>
        </Modal>
      </>
    );
  },
  args: {
    title: 'Confirm Deletion',
  },
};

export const SmallSize: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    title: 'Small Modal',
    size: 'sm',
    children: (
      <div>
        <p className="text-gray-600">This is a small modal.</p>
      </div>
    ),
  },
};

export const LargeSize: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    title: 'Large Modal',
    size: 'lg',
    children: (
      <div>
        <p className="text-gray-600 mb-4">
          This is a large modal with more content space.
        </p>
        <div className="space-y-4">
          <Input label="Field 1" />
          <Input label="Field 2" />
          <Input label="Field 3" />
          <Input label="Field 4" />
        </div>
      </div>
    ),
  },
};

export const ExtraLargeSize: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    title: 'Extra Large Modal',
    size: 'xl',
    children: (
      <div>
        <p className="text-gray-600 mb-4">
          This is an extra large modal for complex forms or detailed content.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <Input label="First Name" />
          <Input label="Last Name" />
          <Input label="Email" type="email" />
          <Input label="Phone" type="tel" />
        </div>
      </div>
    ),
  },
};

export const NoCloseButton: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    title: 'No Close Button',
    showCloseButton: false,
    children: (
      <div>
        <p className="text-gray-600 mb-4">
          This modal has no close button. You must use the action buttons to close it.
        </p>
        <ModalFooter>
          <Button variant="primary">OK</Button>
        </ModalFooter>
      </div>
    ),
  },
};

export const NoOverlayClose: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    title: 'No Overlay Close',
    closeOnOverlayClick: false,
    children: (
      <div>
        <p className="text-gray-600">
          This modal cannot be closed by clicking the overlay. Use the close button or ESC key.
        </p>
      </div>
    ),
  },
};

export const LongContent: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    title: 'Long Content',
    children: (
      <div className="space-y-4">
        {Array.from({ length: 20 }, (_, i) => (
          <p key={i} className="text-gray-600">
            This is paragraph {i + 1}. The modal content is scrollable when it exceeds the
            maximum height.
          </p>
        ))}
      </div>
    ),
  },
};
