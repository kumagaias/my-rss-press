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
    expect(screen.getByText('Make this newspaper public')).toBeInTheDocument();
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

    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(true);

    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(false);
  });

  it('calls onSave with correct settings when save button is clicked', () => {
    render(
      <NewspaperSettingsModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        locale="en"
      />
    );

    const nameInput = screen.getAllByRole('textbox')[0] as HTMLInputElement;
    const userInput = screen.getAllByRole('textbox')[1] as HTMLInputElement;
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;

    fireEvent.change(nameInput, { target: { value: 'Tech News' } });
    fireEvent.change(userInput, { target: { value: 'Jane Smith' } });
    fireEvent.click(checkbox); // Toggle to false

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    expect(mockOnSave).toHaveBeenCalledWith({
      newspaperName: 'Tech News',
      userName: 'Jane Smith',
      isPublic: false,
    });
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
      />
    );

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        newspaperName: expect.stringMatching(/Newspaper$/),
      })
    );
  });

  it('trims whitespace from inputs', () => {
    render(
      <NewspaperSettingsModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        locale="en"
      />
    );

    const nameInput = screen.getAllByRole('textbox')[0] as HTMLInputElement;
    const userInput = screen.getAllByRole('textbox')[1] as HTMLInputElement;

    fireEvent.change(nameInput, { target: { value: '  Tech News  ' } });
    fireEvent.change(userInput, { target: { value: '  John Doe  ' } });

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    expect(mockOnSave).toHaveBeenCalledWith({
      newspaperName: 'Tech News',
      userName: 'John Doe',
      isPublic: true,
    });
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
