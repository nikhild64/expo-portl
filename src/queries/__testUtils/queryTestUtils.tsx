import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, jest } from '@jest/globals';
import type { ReactNode } from 'react';

export const testQueryClients: QueryClient[] = [];

export function createTestQueryClient() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  });
  testQueryClients.push(queryClient);
  return queryClient;
}

export function createQueryWrapper() {
  const queryClient = createTestQueryClient();
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

export function createMutationWrapper() {
  const queryClient = createTestQueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
}

export function createSelectChain<T = unknown>(result: { data: T; error: null } | { data: null; error: { message: string } }) {
  const chain: {
    eq: jest.Mock;
    in: jest.Mock;
    order: jest.Mock;
    limit: jest.Mock;
    is: jest.Mock;
    select: jest.Mock;
    maybeSingle: jest.Mock;
    single: jest.Mock;
  } = {
    eq: jest.fn(),
    in: jest.fn(),
    order: jest.fn(),
    limit: jest.fn(),
    is: jest.fn(),
    select: jest.fn(),
    maybeSingle: jest.fn(),
    single: jest.fn(),
  };

  chain.eq.mockReturnValue(chain);
  chain.in.mockReturnValue(chain);
  chain.order.mockReturnValue(chain);
  chain.limit.mockReturnValue(chain);
  chain.is.mockReturnValue(chain);
  chain.select.mockReturnValue(chain);
  chain.maybeSingle.mockImplementation(async () => result);
  chain.single.mockImplementation(async () => result);

  const promise = Promise.resolve(result);
  Object.assign(chain, {
    then: promise.then.bind(promise),
    catch: promise.catch.bind(promise),
    finally: promise.finally.bind(promise),
  });

  return chain;
}

export function createUpdateChain(result: { data?: unknown; error?: { message: string } | null }) {
  const chain: { eq: jest.Mock; select: jest.Mock; single: jest.Mock; update: jest.Mock } = {
    eq: jest.fn(),
    select: jest.fn(),
    single: jest.fn(),
    update: jest.fn(),
  };
  chain.eq.mockReturnValue(chain);
  chain.select.mockReturnValue(chain);
  chain.single.mockImplementation(async () => result);
  return chain;
}

afterEach(async () => {
  const clients = testQueryClients.splice(0);
  await Promise.all(clients.map((client) => client.cancelQueries()));
  clients.forEach((client) => client.clear());
});
