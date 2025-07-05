import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LogViewer } from '../LogViewer';

// Mock functions need to be declared before jest.mock
const mockGetAllLogs = jest.fn();
const mockClearAllLogs = jest.fn();

// Mock the logger module
jest.mock('../../utils/logger', () => ({
  LogLevel: {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3
  },
  logger: {
    getAllLogs: jest.fn(),
    getStoredLogs: jest.fn(),
    clearStoredLogs: jest.fn(),
    exportLogs: jest.fn()
  }
}));

// Get the mocked functions after the module is mocked
import { logger, LogLevel } from '../../utils/logger';
const mockedLogger = logger as jest.Mocked<typeof logger>;

const defaultProps = {
  isOpen: true,
  onClose: jest.fn()
};

const mockLogs = [
  {
    id: '1',
    timestamp: '2023-01-01T10:00:00.000Z',
    level: LogLevel.INFO,
    category: 'API',
    message: 'Test info message',
    data: { test: 'data' }
  },
  {
    id: '2',
    timestamp: '2023-01-01T10:01:00.000Z',
    level: LogLevel.ERROR,
    category: 'UI',
    message: 'Test error message',
    error: new Error('Test error')
  }
];

describe('LogViewer Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedLogger.getAllLogs.mockReturnValue(mockLogs);
    mockedLogger.getStoredLogs.mockReturnValue(mockLogs);
  });

  it('renders log viewer modal when open', () => {
    render(<LogViewer {...defaultProps} />);

    expect(screen.getByText(/Plugin Logs/)).toBeInTheDocument();
    expect(screen.getByText('Test info message')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<LogViewer {...defaultProps} isOpen={false} />);

    expect(screen.queryByText(/Plugin Logs/)).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(<LogViewer {...defaultProps} />);

    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('displays log levels correctly', () => {
    render(<LogViewer {...defaultProps} />);

    // Use getAllByText since log levels appear both in filter and in log entries
    const infoElements = screen.getAllByText('INFO');
    const errorElements = screen.getAllByText('ERROR');
    
    expect(infoElements.length).toBeGreaterThan(0);
    expect(errorElements.length).toBeGreaterThan(0);
  });

  it('displays log categories', () => {
    render(<LogViewer {...defaultProps} />);

    expect(screen.getByText('[API]')).toBeInTheDocument();
    expect(screen.getByText('[UI]')).toBeInTheDocument();
  });

  it('displays timestamps', () => {
    render(<LogViewer {...defaultProps} />);

    // formatTime will convert ISO timestamps to locale time
    // We need to check for the actual formatted time strings
    const date1 = new Date('2023-01-01T10:00:00.000Z');
    const date2 = new Date('2023-01-01T10:01:00.000Z');
    const time1 = date1.toLocaleTimeString();
    const time2 = date2.toLocaleTimeString();
    
    expect(screen.getByText(time1)).toBeInTheDocument();
    expect(screen.getByText(time2)).toBeInTheDocument();
  });

  it('calls clearStoredLogs when clear button is clicked', () => {
    render(<LogViewer {...defaultProps} />);

    const clearButton = screen.getByText('Clear');
    fireEvent.click(clearButton);

    expect(mockedLogger.clearStoredLogs).toHaveBeenCalled();
  });

  it('handles empty log list', () => {
    mockedLogger.getAllLogs.mockReturnValue([]);
    mockedLogger.getStoredLogs.mockReturnValue([]);
    render(<LogViewer {...defaultProps} />);

    expect(screen.getByText('No logs match the current filters')).toBeInTheDocument();
  });

  it('shows log data when present', () => {
    render(<LogViewer {...defaultProps} />);

    // The data is automatically shown, no need to click
    expect(screen.getByText(/Data:/)).toBeInTheDocument();
    expect(screen.getByText(/"test": "data"/)).toBeInTheDocument();
  });

  it('shows error details for error logs', () => {
    render(<LogViewer {...defaultProps} />);

    // Error details are automatically shown
    const errorElements = screen.getAllByText(/Error:/);
    expect(errorElements.length).toBeGreaterThan(0);
    
    // Check that error details are displayed - using getAllByText for multiple matches
    const testErrorElements = screen.getAllByText(/Test error/);
    expect(testErrorElements.length).toBeGreaterThan(0);
  });

  it('applies correct styling for different log levels', () => {
    render(<LogViewer {...defaultProps} />);

    // Get the log level labels from the actual log entries, not the filter options
    const infoElements = screen.getAllByText('INFO');
    const errorElements = screen.getAllByText('ERROR');

    // Find the ones in the log entries (not in select options)
    const infoLevel = infoElements.find(el => el.style.fontWeight === 'bold');
    const errorLevel = errorElements.find(el => el.style.fontWeight === 'bold');

    expect(infoLevel).toHaveStyle({ color: 'rgb(255, 255, 255)', fontWeight: 'bold' });
    expect(errorLevel).toHaveStyle({ color: 'rgb(242, 72, 34)', fontWeight: 'bold' });
  });
});
