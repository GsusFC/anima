declare var global: NodeJS.Global & typeof globalThis & {
  figma: any;
  fetch: jest.MockedFunction<any>;
  URL: {
    createObjectURL: jest.MockedFunction<any>;
    revokeObjectURL: jest.MockedFunction<any>;
  };
};
