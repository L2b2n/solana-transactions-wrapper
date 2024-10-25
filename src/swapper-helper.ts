import fetch from "cross-fetch";

import { Wallet } from "@project-serum/anchor";
import {
  Connection,
  VersionedTransaction,
} from "@solana/web3.js";

import {
  Route,
  SwapResponse,
} from "./types";

/**
 * Get quote for the swap
 * @param {string} addressOfTokenOut The token that we are selling
 * @param {string} addressOfTokenIn The token that we are buying
 * @param {number} convertedAmountOfTokenOut The amount of tokens that we are selling
 * @param {number} slippage The slippage percentage
 * @returns Promise<Route>
 */
export const getQuote = async (
  addressOfTokenOut: string,
  addressOfTokenIn: string,
  convertedAmountOfTokenOut: number,
  slippage: number
): Promise<Route> => {
  try {
    const slippageBps = slippage * 100;
    const url = `https://quote-api.jup.ag/v6/quote?inputMint=${addressOfTokenOut}&outputMint=${addressOfTokenIn}&amount=${convertedAmountOfTokenOut}&slippageBps=${slippageBps}`;
    const resp = await fetch(url);

    if (!resp.ok) {
      const errorText = await resp.text();
      throw new Error(`Error fetching quote: ${resp.status} ${resp.statusText} ${errorText}`);
    }

    const quoteResponse: Route = await resp.json();
    return quoteResponse;
  } catch (error: any) {
    throw new Error(`Error fetching quote: ${error.message}`);
  }
};

/**
 * Get serialized transaction for the swap
 * @returns {Promise<string>} swapTransaction
 */
export const getSwapTransaction = async (
  quoteResponse: Route,
  walletPublicKey: string,
  buy: boolean,
  addr_mint: string = "",
  computeUnitLimit?: number // Neuer Parameter
): Promise<string> => {
  try {
    let body: any = {
      quoteResponse,
      userPublicKey: walletPublicKey,
      wrapAndUnwrapSol: true,
      restrictIntermediateTokens: false,
      prioritizationFeeLamports: "auto",
      autoMultiplier: 2,
    };

    if (computeUnitLimit) {
      body.computeUnitLimit = computeUnitLimit;
    }

    const resp = await fetch("https://quote-api.jup.ag/v6/swap", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const errorText = await resp.text();
      throw new Error(`Error getting swap transaction: ${resp.status} ${resp.statusText} ${errorText}`);
    }

    const swapResponse: SwapResponse = await resp.json();

    return swapResponse.swapTransaction;
  } catch (error: any) {
    throw new Error(`Error getting swap transaction: ${error.message}`);
  }
};

export const convertToInteger = (amount: number, decimals: number): number => {
  return Math.floor(amount * 10 ** decimals);
};

/**
 * Finalize and send the transaction
 * @param {string} swapTransaction Serialized transaction in base64
 * @param {Wallet} wallet Wallet to sign the transaction
 * @param {Connection} connection Connection to the Solana network
 * @returns {Promise<string>} txid Transaction ID
 */
export const finalizeTransaction = async (
  swapTransaction: string,
  wallet: Wallet,
  connection: Connection
): Promise<string> => {
  try {
    // Deserialize the transaction
    const swapTransactionBuf = Buffer.from(swapTransaction, "base64");
    let transaction = VersionedTransaction.deserialize(swapTransactionBuf);

    // Sign the transaction
    transaction.sign([wallet.payer]);

    const rawTransaction = transaction.serialize();
    const txid = await connection.sendRawTransaction(rawTransaction, {
      skipPreflight: false,
      preflightCommitment: "confirmed",
    });
    console.log(`Transaction sent with txid: ${txid}`);
    return txid;
  } catch (error: any) {
    throw new Error(`Error finalizing transaction: ${error.message}`);
  }
};

/**
 * Create connection to Solana RPC endpoint
 * @returns {Connection} connection
 */
export const createConnection = (RPC_ENDPOINT: string): Connection => {
  try {
    const connection = new Connection(RPC_ENDPOINT, "confirmed");
    return connection;
  } catch (error: any) {
    throw new Error(`Error creating connection: ${error.message}`);
  }
};
