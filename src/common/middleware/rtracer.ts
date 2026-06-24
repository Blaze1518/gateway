import { AsyncLocalStorage } from 'async_hooks';

export const storage = new AsyncLocalStorage<Map<string, any>>();

export const getRequestId = () => {
  const store = storage.getStore();
  return store?.get('requestId');
};
