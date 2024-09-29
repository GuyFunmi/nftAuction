import { describe, it, expect, beforeEach } from 'vitest';
import { MockProvider } from '@clarity/clarity-js-sdk';
import { getTxResult } from '@stacks/transactions';

describe('Escrow Contract', () => {
  let provider: MockProvider;
  let deployer: string;
  let bidder1: string;
  let bidder2: string;

  beforeEach(async () => {
    provider = await MockProvider.fromProject('path/to/your/project');
    [deployer, bidder1, bidder2] = provider.address;

    await provider.mine([
      provider.contractDeploy('escrow', 'escrow', deployer),
    ]);
  });

  it('should deposit funds into escrow', async () => {
    const { result } = await provider.eval(
      'escrow',
      `(deposit u1 '${bidder1} u100)`,
      bidder1
    );
    expect(getTxResult(result)).toEqual('(ok true)');

    const escrowAmount = await provider.eval(
      'escrow',
      `(map-get escrow {auction-id: u1, bidder: '${bidder1}})`,
      deployer
    );
    expect(getTxResult(escrowAmount)).toEqual('(some {amount: u100})');
  });

  it('should withdraw funds from escrow', async () => {
    // Deposit funds first
    await provider.eval(
      'escrow',
      `(deposit u1 '${bidder1} u100)`,
      bidder1
    );

    // Withdraw funds
    const { result } = await provider.eval(
      'escrow',
      `(withdraw u1 '${bidder1})`,
      bidder1
    );
    expect(getTxResult(result)).toEqual('(ok u100)');

    // Check that escrow is empty
    const escrowAmount = await provider.eval(
      'escrow',
      `(map-get escrow {auction-id: u1, bidder: '${bidder1}})`,
      deployer
    );
    expect(getTxResult(escrowAmount)).toEqual('none');
  });

  it('should fail to withdraw when no funds are in escrow', async () => {
    const { result } = await provider.eval(
      'escrow',
      `(withdraw u1 '${bidder2})`,
      bidder2
    );
    expect(getTxResult(result)).toEqual('(err u200)');
  });
});