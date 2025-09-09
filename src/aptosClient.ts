// src/aptosClient.ts - TypeScript SDK utility (standalone implementation)

const APTOS_RPC_URL = 'https://fullnode.mainnet.aptoslabs.com/v1';

export interface GreenPointsBalance {
  balance: number;
  formatted: string;
}

export interface CoinStoreResource {
  data: {
    coin: {
      value: string;
    };
  };
}

/**
 * Get Green Points balance for a user
 * @param adminAddr - The admin address that deployed the module
 * @param userAddr - The user address to check balance for
 * @returns Promise<GreenPointsBalance>
 */
export async function getGpntBalance(
  adminAddr: string, 
  userAddr: string
): Promise<GreenPointsBalance> {
  try {
    const coinType = `${adminAddr}::green_points::GreenPoints`;
    const encodedCoinType = encodeURIComponent(coinType);
    const resourceType = `0x1::coin::CoinStore<${encodedCoinType}>`;
    
    const response = await fetch(
      `${APTOS_RPC_URL}/accounts/${userAddr}/resource/${encodeURIComponent(resourceType)}`
    );

    if (!response.ok) {
      if (response.status === 404) {
        // User not registered or no balance
        return {
          balance: 0,
        formatted: '0 GPNT'
        };
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: CoinStoreResource = await response.json();
    const rawBalance = parseInt(data.data.coin.value);
    
    // Convert from smallest units (decimals from CoinInfo)
    const balance = rawBalance / Math.pow(10, 0); // GPNT has 0 decimals

    return {
      balance,
      formatted: `${balance} GPNT`
    };
  } catch (error) {
    console.error('Error fetching balance:', error);
    return {
      balance: 0,
      formatted: '0 GPNT'
    };
  }
}

/**
 * Check if user is registered for Green Points
 * @param adminAddr - The admin address
 * @param userAddr - The user address
 * @returns Promise<boolean>
 */
export async function isUserRegistered(
  adminAddr: string, 
  userAddr: string
): Promise<boolean> {
  try {
    const coinType = `${adminAddr}::green_points::GreenPoints`;
    const encodedCoinType = encodeURIComponent(coinType);
    const resourceType = `0x1::coin::CoinStore<${encodedCoinType}>`;
    
    const response = await fetch(
      `${APTOS_RPC_URL}/accounts/${userAddr}/resource/${encodeURIComponent(resourceType)}`
    );
    
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get account information
 * @param accountAddress - The account address to query
 * @returns Promise with account data or null if not found
 */
export async function getAccountInfo(accountAddress: string): Promise<any> {
  try {
    const response = await fetch(`${APTOS_RPC_URL}/accounts/${accountAddress}`);
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching account info:', error);
    return null;
  }
}
