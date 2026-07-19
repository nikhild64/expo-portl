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
    eq: jest.Mock<any>;
    in: jest.Mock<any>;
    order: jest.Mock<any>;
    limit: jest.Mock<any>;
    is: jest.Mock<any>;
    select: jest.Mock<any>;
    maybeSingle: jest.Mock<any>;
    single: jest.Mock<any>;
    range: jest.Mock<any>;
    [key: string]: any;
  } = {
    eq: jest.fn<any>(),
    in: jest.fn<any>(),
    order: jest.fn<any>(),
    limit: jest.fn<any>(),
    is: jest.fn<any>(),
    select: jest.fn<any>(),
    maybeSingle: jest.fn<any>(),
    single: jest.fn<any>(),
    range: jest.fn<any>(),
  };

  chain.eq.mockReturnValue(chain);
  chain.in.mockReturnValue(chain);
  chain.order.mockReturnValue(chain);
  chain.limit.mockReturnValue(chain);
  chain.is.mockReturnValue(chain);
  chain.select.mockReturnValue(chain);
  chain.range.mockReturnValue(chain);
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
  const chain: { eq: jest.Mock<any>; select: jest.Mock<any>; single: jest.Mock<any>; update: jest.Mock<any>; [key: string]: any } = {
    eq: jest.fn<(...args: any[]) => any>(),
    select: jest.fn<(...args: any[]) => any>(),
    single: jest.fn<(...args: any[]) => any>(),
    update: jest.fn<(...args: any[]) => any>(),
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
