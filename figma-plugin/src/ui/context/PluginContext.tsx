// Plugin context for global state management
import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { AuthState, DetectedFrame, ExportProgress, ExportResult, UserInfo } from '@shared/types';

interface PluginState {
  auth: AuthState;
  frames: {
    detected: DetectedFrame[];
    selected: string[];
    loading: boolean;
  };
  export: {
    inProgress: boolean;
    progress?: ExportProgress;
    results?: ExportResult;
  };
  ui: {
    activeTab: 'frames' | 'settings' | 'export';
    showAdvanced: boolean;
  };
}

type PluginAction = 
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: UserInfo; apiKey: string } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'FRAMES_LOADING' }
  | { type: 'FRAMES_DETECTED'; payload: DetectedFrame[] }
  | { type: 'FRAMES_SELECT'; payload: string[] }
  | { type: 'EXPORT_START' }
  | { type: 'EXPORT_PROGRESS'; payload: ExportProgress }
  | { type: 'EXPORT_COMPLETE'; payload: ExportResult }
  | { type: 'EXPORT_ERROR'; payload: string }
  | { type: 'UI_SET_TAB'; payload: 'frames' | 'settings' | 'export' }
  | { type: 'UI_TOGGLE_ADVANCED' };

const initialState: PluginState = {
  auth: { 
    authenticated: false, 
    loading: false 
  },
  frames: { 
    detected: [], 
    selected: [], 
    loading: false 
  },
  export: { 
    inProgress: false 
  },
  ui: {
    activeTab: 'frames',
    showAdvanced: false
  }
};

function pluginReducer(state: PluginState, action: PluginAction): PluginState {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        auth: { ...state.auth, loading: true, error: undefined }
      };
      
    case 'AUTH_SUCCESS':
      return {
        ...state,
        auth: { 
          authenticated: true, 
          user: action.payload.user, 
          apiKey: action.payload.apiKey,
          loading: false,
          error: undefined
        }
      };
      
    case 'AUTH_FAILURE':
      return {
        ...state,
        auth: { 
          authenticated: false, 
          loading: false, 
          error: action.payload 
        }
      };
      
    case 'AUTH_LOGOUT':
      return {
        ...state,
        auth: { 
          authenticated: false, 
          loading: false 
        },
        frames: { 
          detected: [], 
          selected: [], 
          loading: false 
        }
      };
      
    case 'FRAMES_LOADING':
      return {
        ...state,
        frames: { 
          ...state.frames, 
          loading: true 
        }
      };
      
    case 'FRAMES_DETECTED':
      return {
        ...state,
        frames: { 
          detected: action.payload, 
          selected: [], 
          loading: false 
        }
      };
      
    case 'FRAMES_SELECT':
      return {
        ...state,
        frames: { 
          ...state.frames, 
          selected: action.payload 
        }
      };
      
    case 'EXPORT_START':
      return {
        ...state,
        export: { 
          inProgress: true, 
          progress: undefined, 
          results: undefined 
        }
      };
      
    case 'EXPORT_PROGRESS':
      return {
        ...state,
        export: { 
          ...state.export, 
          progress: action.payload 
        }
      };
      
    case 'EXPORT_COMPLETE':
      return {
        ...state,
        export: { 
          inProgress: false, 
          results: action.payload,
          progress: undefined
        }
      };
      
    case 'EXPORT_ERROR':
      return {
        ...state,
        export: { 
          inProgress: false, 
          progress: undefined 
        }
      };
      
    case 'UI_SET_TAB':
      return {
        ...state,
        ui: { 
          ...state.ui, 
          activeTab: action.payload 
        }
      };
      
    case 'UI_TOGGLE_ADVANCED':
      return {
        ...state,
        ui: { 
          ...state.ui, 
          showAdvanced: !state.ui.showAdvanced 
        }
      };
      
    default:
      return state;
  }
}

const PluginContext = createContext<{
  state: PluginState;
  dispatch: React.Dispatch<PluginAction>;
} | null>(null);

export const PluginProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(pluginReducer, initialState);
  
  return (
    <PluginContext.Provider value={{ state, dispatch }}>
      {children}
    </PluginContext.Provider>
  );
};

export const usePlugin = () => {
  const context = useContext(PluginContext);
  if (!context) {
    throw new Error('usePlugin must be used within PluginProvider');
  }
  return context;
};
