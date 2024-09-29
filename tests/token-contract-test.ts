import { describe, it, expect, beforeEach } from 'vitest';
import { MockProvider } from '@clarity/clarity-js-sdk';
import { getTxResult } from '@stacks/transactions';

describe('Fungible Token Contract', () => {
  let provider: MockProvider;
  let deployer: string;
  let user1: string;
  let user2: string;

  beforeEach(async () => {
    provider = await MockProvider.fromProject('path/to/your/project');
    [deployer, user1, user2] = provider.address;

    await provider.mine([
      provider.contractDeploy('fungible-token', 'fungible-token', deployer),
    ]);
  });

  it('should mint tokens', async () => {
    const { result } = await provider.eval(
      'fungible-token',
      `(mint-tokens '${user1} u100)`,
      deployer
    );
    expect(getTxResult(result)).toEqual('(ok true)');

    const balance = await provider.eval(
      'fungible-token',
      `(map-get balances {address: '${user1}})`,
      deployer
    );
    expect(getTxResult(balance)).toEqual('(some {balance: u100})');
  });

  it('should transfer tokens', async () => {
    // Mint tokens to user1
    await provider.eval(
      'fungible-token',
      `(mint-tokens '${user1} u100)`,
      deployer
    );

    // Transfer tokens from user1 to user2
    const { result } = await provider.eval(
      'fungible-token',
      `(transfer-tokens '${user1} '${user2} u50)`,
      user1
    );
    expect(getTxResult(result)).toEqual('(ok true)');

    // Check balances
    const user1Balance = await provider.eval(
      'fungible-token',
      `(map-get balances {address: '${user1}})`,
      deployer
    );
    expect(getTxResult(user1Balance)).toEqual('(some {balance: u50})');

    const user2Balance = await provider.eval(
      'fungible-token',
      `(map-get balances {address: '${user2}})`,
      deployer
    );
    expect(getTxResult(user2Balance)).toEqual('(some {balance: u50})');
  });

  it('should fail to transfer tokens when balance is insufficient', async () => {
    // Mint tokens to user1
    await provider.eval(
      'fungible-token',
      `(mint-tokens '${user1} u100)`,
      deployer
    );

    // Attempt to transfer more tokens than available
    const { result } = await provider.eval(
      'fungible-token',
      `(transfer-tokens '${user1} '${user2} u150)`,
      user1
    );
    expect(getTxResult(result)).toEqual('(err u101)');
  });
});