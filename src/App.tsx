import React, { useState, useEffect } from "react";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  PublicKey,
} from "@solana/web3.js";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  ConnectionProvider,
  WalletProvider,
  useWallet,
} from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";

import "@solana/wallet-adapter-react-ui/styles.css";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "./components/ui/card";
import { Button } from "./components/ui/button";
import { RefreshCw } from "lucide-react";
import { Slider } from "./components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import { Toaster } from "./components/ui/toaster";
import { useToast } from "./components/ui/use-toast";

function App() {
  const [betAmount, setBetAmount] = useState(0);
  const [choice, setChoice] = useState("");
  const [result, setResult] = useState("");
  const [connection, setConnection] = useState<Connection | null>(null);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const wallet: any = useWallet();
  const { toast } = useToast();
  useEffect(() => {
    const network = WalletAdapterNetwork.Devnet;
    const connection = new Connection(
      "https://api.devnet.solana.com",
      "confirmed"
    );
    setConnection(connection);

    if (wallet.connected) {
      getBalance(connection, wallet.publicKey);
    }
  }, [wallet.connected]);

  const getBalance = async (connection: Connection, publicKey: PublicKey) => {
    try {
      const balance = await connection.getBalance(publicKey);
      setBalance(balance);
    } catch (error) {
      console.error("Failed to fetch balance:", error);
    }
  };

  const airdropSol = async () => {
    if (!connection || !wallet.connected) {
      alert("Please connect your wallet first!");
      return;
    }

    try {
      setLoading(true);
      const signature = await connection.requestAirdrop(
        wallet.publicKey,
        2 * LAMPORTS_PER_SOL
      );
      await connection.confirmTransaction(signature, "confirmed");
      toast({ description: "Airdrop successful!" });
      getBalance(connection, wallet.publicKey); // Update balance after airdrop
      console.log("Airdrop completed");
    } catch (error: any) {
      toast({
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const flipCoin = async () => {
    if (!wallet.connected || !connection) {
      alert("Please connect your wallet!");
      return;
    }
    if (!choice || !balance) {
      alert("Add choice or choose bet amount.");
      return;
    }
    try {
      setLoading(true);
      const balance = await connection.getBalance(wallet.publicKey);
      setBalance(balance);
      const lamportsToBet = betAmount * LAMPORTS_PER_SOL;

      if (balance < lamportsToBet) {
        throw new Error("Insufficient balance");
      }

      // Ensure that the program ID is correctly set
      const programId = new PublicKey(
        "FHfaH5kgWSB1QAwHzsW7RveRnEDp2qzYJpjgdtN99tdV"
      ); // Replace with your actual deployed Program ID
      // Construct the instruction
      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
          { pubkey: programId, isSigner: false, isWritable: true },
        ],
        programId: programId,
        data: Buffer.from([choice === "heads" ? 0 : 1]), // Sending 0 for heads, 1 for tails
      });

      // Create and send the transaction
      const transaction = new Transaction().add(instruction);
      const signature = await wallet.sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, "confirmed");

      console.log(`Transaction confirmed with signature: ${signature}`);

      // Generate Solscan link
      const solscanLink = `https://solscan.io/tx/${signature}?cluster=devnet`;
      setResult(`Transaction confirmed! Check it on Solscan: ${solscanLink}`);
    } catch (error: any) {
      toast({
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSliderChange = (val: number[]) => {
    setBetAmount(Math.round(val[0]));
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="flex items-center flex-col">
        <h1 className="text-4xl font-bold">Coiner</h1>
        <text className="mt-2">Try your luck and earn real Crypto!</text>
        <Card className="p-4 rounded m-4 max-w-96">
          <CardTitle>Wallet</CardTitle>
          <CardDescription className="my-4">
            {wallet.connected
              ? "You have connected your crypto wallet click the button below for wallet actions."
              : "Connect your Crypto Wallet and Play!"}
          </CardDescription>
          <WalletMultiButton style={{ height: 36 }}>Wallet</WalletMultiButton>
          <p className="max-w-80 text-sm mt-2 text-[#aaa]">
            {wallet.connected ? wallet.publicKey.toString() : ""}
          </p>
        </Card>
      </div>
      {wallet.connected &&
        (loading ? (
          <Card className="flex justify-center items-center p-4 rounded m-4 h-96 w-96">
            <CardContent>Loading...</CardContent>
          </Card>
        ) : (
          <Card className="p-4 rounded m-4 min-w-96 max-w-96">
            <p className="text-2xl font-bold">
              Balance: {balance / LAMPORTS_PER_SOL} SOL
            </p>
            <CardDescription className="mt-2">
              No Crypto to spend Don't worry!
            </CardDescription>
            <Button
              className="bg-black text-white rounded my-2 hover:bg-[#222]"
              onClick={airdropSol}
            >
              Get 2 SOL from Faucet
            </Button>
            <CardDescription className="my-2 text-lg font-bold">
              Bet Crypto ${betAmount}
            </CardDescription>
            <Slider
              defaultValue={[1]}
              max={balance / LAMPORTS_PER_SOL}
              className="rounded-lg my-2"
              min={1}
              step={1}
              onValueChange={handleSliderChange}
              aria-label="Slider"
            />
            <Select
              onValueChange={(value: "heads" | "tails") => setChoice(value)}
            >
              <SelectTrigger className="w-[180px] border-[#f7f7f7] rounded my-4">
                <SelectValue placeholder="Choose side" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="heads">Heads</SelectItem>
                <SelectItem value="tails">Tails</SelectItem>
              </SelectContent>
            </Select>
            <Button
              className="bg-[#f7f7f7] text-black rounded my-2 hover:bg-[#f7f7f7]"
              onClick={flipCoin}
            >
              Flip Coin
            </Button>
            <Toaster />

            <Button
              className="bg-white text-black rounded my-2"
              onClick={() => {
                if (wallet.connected && connection) {
                  getBalance(connection, wallet.publicKey);
                }
              }}
            >
              <RefreshCw className="h-4 w-4 mx-2" /> Refresh Balance
            </Button>
          </Card>
        ))}
    </div>
  );
}

const AppWrapper = () => {
  const wallets = [new PhantomWalletAdapter(), new SolflareWalletAdapter()];

  return (
    <ConnectionProvider endpoint={"https://api.devnet.solana.com"}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <App />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default AppWrapper;
