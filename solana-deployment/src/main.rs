use solana_program::{
    account_info::AccountInfo,
    entrypoint,
    entrypoint::ProgramResult,
    program::invoke,
    program_error::ProgramError,
    pubkey::Pubkey,
    system_instruction,
    sysvar::{rent::Rent, Sysvar},
};

use rand::Rng; // For random number generation

entrypoint!(process_instruction);

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let user_account = next_account_info(accounts_iter)?;

    // Parse the instruction data to get the user's bet amount and choice
    let bet_amount = u64::from_le_bytes(instruction_data[..8].try_into().unwrap());
    let user_choice = instruction_data[8]; // 0 for heads, 1 for tails

    // Generate a random number (0 or 1) to simulate the coin flip
    let outcome = rand::thread_rng().gen_range(0..2);

    if user_choice == outcome {
        // User wins: Double the bet amount and transfer it back to the user
        let winnings = bet_amount * 2;
        let transfer_instruction = system_instruction::transfer(
            &program_id,
            &user_account.key,
            winnings,
        );
        invoke(&transfer_instruction, accounts)?;
    } else {
        // User loses: No transfer is needed; the contract keeps the bet amount
        // In a real-world scenario, you might want to add the funds to a contract's treasury
    }

    Ok(())
}
