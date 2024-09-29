import { describe, it, expect, beforeEach } from 'vitest';
import { MockProvider } from '@clarity/clarity-js-sdk';
import { getTxResult } from '@stacks/transactions';

describe('NFT Auction Contract', () => {
  let provider: MockProvider;
  let deployer: string;
  let wallet1: string;
  let wallet2: string;

  beforeEach(async () => {
    provider = await MockProvider.fromProject('path/to/your/project');
    [deployer, wallet1, wallet2] = provider.address;

    // Deploy the contract
    await provider.mine([
      provider.contractDeploy('nft-auction', 'nft-auction', deployer),
    ]);
  });

  it('should start an auction', async () => {
    const { result } = await provider.eval(
      'nft-auction',
      '(start-auction u1 u10 u100)',
      deployer
    );
    expect(getTxResult(result)).toEqual('(ok true)');
  });

  it('should place a bid', async () => {
    // Start auction
    await provider.eval('nft-auction', '(start-auction u1 u10 u100)', deployer);

    // Place bid
    const { result } = await provider.eval(
      'nft-auction',
      '(place-bid u150)',
      wallet1
    );
    expect(getTxResult(result)).toEqual('(ok true)');
  });

  it('should end auction', async () => {
    // Start auction
    await provider.eval('nft-auction', '(start-auction u1 u10 u100)', deployer);

    // Place bids
    await provider.eval('nft-auction', '(place-bid u150)', wallet1);
    await provider.eval('nft-auction', '(place-bid u200)', wallet2);

    // Advance blockchain
    await provider.mineBlocks(11);

    // End auction
    const { result } = await provider.eval(
      'nft-auction',
      '(end-auction)',
      deployer
    );
    expect(getTxResult(result)).toEqual('(ok true)');
  });

  it('should return correct auction info', async () => {
    // Start auction
    await provider.eval('nft-auction', '(start-auction u1 u10 u100)', deployer);

    // Place bid
    await provider.eval('nft-auction', '(place-bid u150)', wallet1);

    // Get auction info
    const { result } = await provider.eval(
      'nft-auction',
      '(get-auction-info)',
      deployer
    );
    const auctionInfo = getTxResult(result);
    
    expect(auctionInfo).toEqual(
      expect.objectContaining({
        'end-height': expect.any(String),
        'highest-bid': 'u150',
        'highest-bidder': expect.stringContaining(wallet1),
        'token-id': 'u1'
      })
    );
  });
});