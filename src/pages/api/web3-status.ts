import { NextApiRequest, NextApiResponse } from 'next';
import { ethers } from 'ethers';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Check if window.ethereum is available
    const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
    const network = await provider.getNetwork();

    res.status(200).json({
      connected: true,
      chainId: network.chainId,
      networkName: network.name
    });
  } catch (error) {
    res.status(500).json({
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 