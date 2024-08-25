const { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } = require('@solana/web3.js');

// Connect to the Solana devnet
const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

// Create a new keypair (this would be replaced by a real wallet in production)
const payer = Keypair.generate();
const userWallet = Keypair.generate();

// Airdrop SOL to the payer wallet
async function airdropSol() {
    const signature = await connection.requestAirdrop(payer.publicKey, 2 * LAMPORTS_PER_SOL);
    await connection.confirmTransaction(signature);
    console.log('Airdrop completed');
}

// Function to simulate a coin flip and handle bets
async function flipCoin(betAmount, userChoice) {
    // Ensure the payer has enough SOL
    const balance = await connection.getBalance(payer.publicKey);
    if (balance < betAmount) {
        throw new Error('Insufficient balance');
    }

    // Simulate coin flip
    const outcome = Math.random() < 0.5 ? 'heads' : 'tails';
    console.log(`Coin flip outcome: ${outcome}`);

    if (userChoice === outcome) {
        // User wins: double their bet
        console.log('User wins!');
        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: payer.publicKey,
                toPubkey: userWallet.publicKey,
                lamports: betAmount * 2,
            })
        );
        await connection.sendTransaction(transaction, [payer], { skipPreflight: false, preflightCommitment: 'confirmed' });
        console.log('Winnings transferred');
    } else {
        console.log('User loses');
        // Funds stay with the payer in a real-world scenario
    }
}

(async () => {
    try {
        await airdropSol();
        await flipCoin(0.1 * LAMPORTS_PER_SOL, 'heads'); // Example bet amount and choice
    } catch (error) {
        console.error('Error:', error);
    }
})();
