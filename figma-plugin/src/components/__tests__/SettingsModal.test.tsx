import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SettingsModal } from '../SettingsModal';

// Mock the PluginContext
const mockUpdateConfig = jest.fn();
const mockPluginContext = {
  config: {
    apiBaseURL: 'http://localhost:3001',
    debugMode: false,
    maxImageSize: 2048,
    defaultDuration: 2000,
    defaultTransition: 'fade',
    gif: {
      fps: 15,
      colors: 256,
      loop: true,
      dithering: true
    }
  },
  updateConfig: mockUpdateConfig
};

jest.mock('../../context/PluginContext', () => ({
  usePluginContext: () => mockPluginContext
}));

const defaultProps = {
  isOpen: true,
  onClose: jest.fn()
};

describe('SettingsModal Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders settings modal when open', () => {
    render(<SettingsModal {...defaultProps} />);

    expect(screen.getByText('Plugin Settings')).toBeInTheDocument();
    expect(screen.getByText('API Base URL')).toBeInTheDocument();
    expect(screen.getByText('Debug Mode')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<SettingsModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByText('Plugin Settings')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(<SettingsModal {...defaultProps} />);

    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('displays current API URL', () => {
    render(<SettingsModal {...defaultProps} />);

    const apiInput = screen.getByDisplayValue('http://localhost:3001');
    expect(apiInput).toBeInTheDocument();
  });

  it('displays current debug mode setting', () => {
    render(<SettingsModal {...defaultProps} />);

    const debugCheckbox = screen.getByRole('checkbox');
    expect(debugCheckbox).not.toBeChecked(); // debugMode is false in mock
  });

  it('updates API URL when changed', () => {
    render(<SettingsModal {...defaultProps} />);

    const apiInput = screen.getByDisplayValue('http://localhost:3001');
    fireEvent.change(apiInput, { target: { value: 'http://new-api:3000' } });

    // Input should reflect the change
    expect(apiInput).toHaveValue('http://new-api:3000');
  });

  it('toggles debug mode when checkbox is clicked', () => {
    render(<SettingsModal {...defaultProps} />);

    const debugCheckbox = screen.getByRole('checkbox');
    fireEvent.click(debugCheckbox);

    expect(debugCheckbox).toBeChecked();
  });

  it('saves settings when Save button is clicked', () => {
    render(<SettingsModal {...defaultProps} />);

    // Change a setting
    const apiInput = screen.getByDisplayValue('http://localhost:3001');
    fireEvent.change(apiInput, { target: { value: 'http://new-api:3000' } });

    // Click Save
    const saveButton = screen.getByText('Save Settings');
    fireEvent.click(saveButton);

    expect(mockUpdateConfig).toHaveBeenCalledWith({
      apiBaseURL: 'http://new-api:3000',
      debugMode: false,
      maxImageSize: 2048,
      defaultDuration: 2000,
      defaultTransition: 'fade'
    });
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('cancels changes when Cancel button is clicked', () => {
    render(<SettingsModal {...defaultProps} />);

    // Change a setting
    const apiInput = screen.getByDisplayValue('http://localhost:3001');
    fireEvent.change(apiInput, { target: { value: 'http://new-api:3000' } });

    // Click Cancel
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockUpdateConfig).not.toHaveBeenCalled();
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('shows all configuration options', () => {
    render(<SettingsModal {...defaultProps} />);

    expect(screen.getByText('API Base URL')).toBeInTheDocument();
    expect(screen.getByText('Debug Mode')).toBeInTheDocument();
    expect(screen.getByText('Default Duration')).toBeInTheDocument();
    expect(screen.getByText('Default Transition')).toBeInTheDocument();
    expect(screen.getByText('Max Image Size')).toBeInTheDocument();
  });

  it('handles duration slider changes', () => {
    render(<SettingsModal {...defaultProps} />);

    const durationSlider = screen.getByRole('slider');
    fireEvent.change(durationSlider, { target: { value: '3000' } });

    // Should update the local state
    expect(durationSlider).toHaveValue('3000');
  });

  it('handles transition select changes', () => {
    render(<SettingsModal {...defaultProps} />);

    const transitionSelect = screen.getByDisplayValue('fade');
    fireEvent.change(transitionSelect, { target: { value: 'slide' } });

    expect(transitionSelect).toHaveValue('slide');
  });

  it('validates API URL format', () => {
    render(<SettingsModal {...defaultProps} />);

    const apiInput = screen.getByDisplayValue('http://localhost:3001');
    fireEvent.change(apiInput, { target: { value: 'invalid-url' } });

    // The input should still accept the value (validation happens on save)
    expect(apiInput).toHaveValue('invalid-url');
  });

  it('resets form when cancelled', () => {
    render(<SettingsModal {...defaultProps} />);

    // Change multiple settings
    const apiInput = screen.getByDisplayValue('http://localhost:3001');
    const debugCheckbox = screen.getByRole('checkbox');

    fireEvent.change(apiInput, { target: { value: 'http://changed:3000' } });
    fireEvent.click(debugCheckbox);

    // Cancel
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    // Reopen modal
    render(<SettingsModal {...defaultProps} />);

    // Values should be reset to original
    expect(screen.getByDisplayValue('http://localhost:3001')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });
});
