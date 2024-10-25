import bs58 from "bs58";

import { Wallet } from "@project-serum/anchor";
import {
  Connection,
  Keypair,
} from "@solana/web3.js";

import { buyToken } from "./buy-helper";
import { sellToken } from "./sell-helper";
import { createConnection } from "./swapper-helper";
import {
  buyConfig,
  sellConfig,
  TokensObject,
} from "./types";
import {
  getAccountTokens,
  getBalanceOfToken,
} from "./walletInfo";

/**
 * Function to buy a token with SOL
 * @param config The configuration object (as per buyConfig type)
 * @returns Promise<void>
 */
export const buy_token = async (config: buyConfig): Promise<void> => {
  const {
    RPC_ENDPOINT,
    WALLET_PRIVATE_KEY,
    ADDRESS_OF_TOKEN_TO_BUY,
    AMOUNT_OF_SOLANA_TO_SPEND,
    SLIPPAGE = 1,
    computeUnitLimit, // Neuer Parameter
  } = config;

  try {
    const connection: Connection = createConnection(RPC_ENDPOINT);
    console.log("Connection established 🚀");

    const wallet = new Wallet(
      Keypair.fromSecretKey(bs58.decode(WALLET_PRIVATE_KEY))
    );
    console.log("Wallet fetched ✅");

    console.log(`Trying to buy token using ${AMOUNT_OF_SOLANA_TO_SPEND} SOL...`);

    await buyToken(
      ADDRESS_OF_TOKEN_TO_BUY,
      AMOUNT_OF_SOLANA_TO_SPEND,
      SLIPPAGE,
      connection,
      wallet,
      computeUnitLimit // Übergeben des Wertes
    );
  } catch (error: any) {
    throw new Error(error.message);
  }
};

/**
 * Function to sell a token in your wallet for SOL
 * @param config The configuration object (as per sellConfig type)
 * @returns Promise<void>
 */
export const sell_token = async (config: sellConfig): Promise<void> => {
  const {
    SELL_ALL,
    RPC_ENDPOINT,
    WALLET_PRIVATE_KEY,
    ADDRESS_OF_TOKEN_TO_SELL,
    AMOUNT_OF_TOKEN_TO_SELL,
    SLIPPAGE = 1,
    computeUnitLimit, // Neuer Parameter
  } = config;

  if (!SELL_ALL && !AMOUNT_OF_TOKEN_TO_SELL) {
    throw new Error(
      "You need to specify AMOUNT_OF_TOKEN_TO_SELL if SELL_ALL is false"
    );
  }

  try {
    const connection: Connection = createConnection(RPC_ENDPOINT);
    console.log("Connection established 🚀");

    const wallet = new Wallet(
      Keypair.fromSecretKey(bs58.decode(WALLET_PRIVATE_KEY))
    );
    console.log("Wallet fetched ✅");

    console.log(
      `Selling ${
        SELL_ALL ? "all" : AMOUNT_OF_TOKEN_TO_SELL
      } of ${ADDRESS_OF_TOKEN_TO_SELL}...`
    );

    await sellToken(
      SELL_ALL,
      ADDRESS_OF_TOKEN_TO_SELL,
      SLIPPAGE,
      connection,
      wallet,
      wallet.publicKey.toString(),
      AMOUNT_OF_TOKEN_TO_SELL,
      computeUnitLimit // Übergeben des Wertes
    );
  } catch (error: any) {
    throw new Error(error.message);
  }
};

/**
 * Function to get all tokens in a wallet
 * @param RPC_ENDPOINT Your RPC endpoint to connect to
 * @param WALLET_PUBLIC_KEY The public key of the wallet you want to get tokens from
 * @returns {Promise<TokensObject>} Promise<TokensObject>
 */
export const get_tokens_balances = async (
  RPC_ENDPOINT: string,
  WALLET_PUBLIC_KEY: string
): Promise<TokensObject> => {
  if (!WALLET_PUBLIC_KEY) {
    throw new Error("No wallet public key specified");
  }
  if (!RPC_ENDPOINT) {
    throw new Error("No RPC endpoint specified");
  }
  const connection: Connection = createConnection(RPC_ENDPOINT);
  console.log("Connection established 🚀");
  console.log("Fetching tokens...");
  const result = await getAccountTokens(WALLET_PUBLIC_KEY, connection);
  return result;
};

/**
 * Gets balance of specified token in wallet
 * @param RPC_ENDPOINT Your RPC endpoint to connect to
 * @param WALLET_PUBLIC_KEY The public key of the wallet
 * @param TOKEN_ADDRESS The address of the token to get the balance of
 * @returns {Promise<number>} The balance of the token
 */
export const get_token_balance = async (
  RPC_ENDPOINT: string,
  WALLET_PUBLIC_KEY: string,
  TOKEN_ADDRESS: string
): Promise<number> => {
  if (!TOKEN_ADDRESS) {
    throw new Error("No token address specified");
  }
  if (!WALLET_PUBLIC_KEY) {
    throw new Error("No wallet public key specified");
  }
  if (!RPC_ENDPOINT) {
    throw new Error("No RPC endpoint specified");
  }
  const connection: Connection = createConnection(RPC_ENDPOINT);
  console.log("Connection established 🚀");
  console.log("Fetching token balance...");
  const result = await getBalanceOfToken(
    WALLET_PUBLIC_KEY,
    TOKEN_ADDRESS,
    connection
  );
  return result;
};
