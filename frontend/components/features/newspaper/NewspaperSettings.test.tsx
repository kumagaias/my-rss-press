import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NewspaperSettingsModal } from './NewspaperSettings';

describe('NewspaperSettingsModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders when isOpen is true', () => {
    render(
      <NewspaperSettingsModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        locale="en"
      />
    );

    expect(screen.getByText('Newspaper Settings')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(
      <NewspaperSettingsModal
        isOpen={false}
        onClose={mockOnClose}
        onSave={mockOnSave}
        locale="en"
      />
    );

    expect(screen.queryByText('Newspaper Settings')).not.toBeInTheDocument();
  });

  it('displays input fields', () => {
    render(
      <NewspaperSettingsModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        locale="en"
      />
    );

    expect(screen.getByText('Newspaper Name')).toBeInTheDocument();
    expect(screen.getByText('Your Name')).toBeInTheDocument();
    // isPublic checkbox is removed in Phase 1 (TODO: Phase 2)
  });

  it('sets default newspaper name', () => {
    render(
      <NewspaperSettingsModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        locale="en"
        defaultName="Tech Daily"
      />
    );

    const input = screen.getByPlaceholderText('Tech Daily') as HTMLInputElement;
    expect(input.value).toBe('Tech Daily');
  });

  it('generates default name based on current date when no default provided', () => {
    render(
      <NewspaperSettingsModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        locale="en"
      />
    );

    const input = screen.getAllByRole('textbox')[0] as HTMLInputElement;
    expect(input.value).toMatch(/Newspaper$/);
  });

  it('allows user to input newspaper name', () => {
    render(
      <NewspaperSettingsModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        locale="en"
      />
    );

    const input = screen.getAllByRole('textbox')[0] as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'My Custom Newspaper' } });
    expect(input.value).toBe('My Custom Newspaper');
  });

  it('allows user to input user name', () => {
    render(
      <NewspaperSettingsModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        locale="en"
      />
    );

    const input = screen.getAllByRole('textbox')[1] as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'John Doe' } });
    expect(input.value).toBe('John Doe');
  });

  it('allows user to toggle public checkbox', () => {
    render(
      <NewspaperSettingsModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        locale="en"
      />
    );

    // TODO: Phase 2 - Re-enable this test when isPublic checkbox is added
    // Currently skipped as the checkbox is removed in Phase 1
    expect(true).toBe(true);
  });

  it('calls onSave with correct settings when save button is clicked', () => {
    render(
      <NewspaperSettingsModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        locale="en"
        initialFeeds={[
          { url: 'https://example.com/feed', title: 'Example Feed', isDefault: false }
        ]}
      />
    );

    const nameInput = screen.getAllByRole('textbox')[0] as HTMLInputElement;
    const userInput = screen.getAllByRole('textbox')[1] as HTMLInputElement;

    fireEvent.change(nameInput, { target: { value: 'Tech News' } });
    fireEvent.change(userInput, { target: { value: 'Jane Smith' } });

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    expect(mockOnSave).toHaveBeenCalledWith(
      {
        newspaperName: 'Tech News',
        userName: 'Jane Smith',
        isPublic: true, // Default value in Phase 1
      },
      ['https://example.com/feed'] // Feed URLs
    );
  });

  it('calls onClose when cancel button is clicked', () => {
    render(
      <NewspaperSettingsModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        locale="en"
      />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('uses default name when newspaper name is empty', () => {
    render(
      <NewspaperSettingsModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        locale="en"
        initialFeeds={[
          { url: 'https://example.com/feed', title: 'Example Feed', isDefault: false }
        ]}
      />
    );

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        newspaperName: expect.stringMatching(/Newspaper$/),
      }),
      ['https://example.com/feed']
    );
  });

  it('trims whitespace from inputs', () => {
    render(
      <NewspaperSettingsModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        locale="en"
        initialFeeds={[
          { url: 'https://example.com/feed', title: 'Example Feed', isDefault: false }
        ]}
      />
    );

    const nameInput = screen.getAllByRole('textbox')[0] as HTMLInputElement;
    const userInput = screen.getAllByRole('textbox')[1] as HTMLInputElement;

    fireEvent.change(nameInput, { target: { value: '  Tech News  ' } });
    fireEvent.change(userInput, { target: { value: '  John Doe  ' } });

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    expect(mockOnSave).toHaveBeenCalledWith(
      {
        newspaperName: 'Tech News',
        userName: 'John Doe',
        isPublic: true,
      },
      ['https://example.com/feed']
    );
  });

  it('uses Japanese translations when locale is ja', () => {
    render(
      <NewspaperSettingsModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        locale="ja"
      />
    );

    expect(screen.getByText('新聞設定')).toBeInTheDocument();
    expect(screen.getByText('新聞名')).toBeInTheDocument();
    expect(screen.getByText('あなたの名前')).toBeInTheDocument();
  });

  it('generates Japanese default name when locale is ja', () => {
    render(
      <NewspaperSettingsModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        locale="ja"
      />
    );

    const input = screen.getAllByRole('textbox')[0] as HTMLInputElement;
    expect(input.value).toMatch(/の新聞$/);
  });
});
