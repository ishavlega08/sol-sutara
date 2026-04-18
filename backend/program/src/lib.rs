use anchor_lang::prelude::*;

declare_id!("3Kzq31P89HkR8SEofcmE8AU52pCdAxyFUwwFFscJHxgm");

#[program]
pub mod solsutara {
    use super::*;

    pub fn initialize_counter(ctx: Context<InitializeCounter>) -> Result<()> {
        ctx.accounts.counter.total_components = 0;
        ctx.accounts.counter.bump = ctx.bumps.counter;
        Ok(())
    }

    pub fn create_component(ctx: Context<CreateComponent>, metadata_uri: String) -> Result<()> {
        require!(!metadata_uri.is_empty(), SolSutaraError::EmptyMetadataUri);
        require!(metadata_uri.len() <= 200, SolSutaraError::MetadataUriTooLong);

        let counter = &mut ctx.accounts.counter;
        let component_id = counter.total_components;

        let component = &mut ctx.accounts.component;
        component.component_id = component_id;
        component.metadata_uri = metadata_uri;
        component.creator = ctx.accounts.creator.key();
        component.timestamp = Clock::get()?.unix_timestamp;
        component.bump = ctx.bumps.component;

        counter.total_components = counter
            .total_components
            .checked_add(1)
            .ok_or(SolSutaraError::CounterOverflow)?;

        emit!(ComponentCreated {
            component_id,
            creator: component.creator,
            timestamp: component.timestamp,
        });

        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeCounter<'info> {
    #[account(
        init,
        payer = payer,
        space = 8 + GlobalCounter::INIT_SPACE,
        seeds = [b"counter"],
        bump
    )]
    pub counter: Account<'info, GlobalCounter>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(metadata_uri: String)]
pub struct CreateComponent<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + Component::INIT_SPACE,
        seeds = [
            b"component",
            creator.key().as_ref(),
            &counter.total_components.to_le_bytes(),
        ],
        bump
    )]
    pub component: Account<'info, Component>,

    #[account(
        mut,
        seeds = [b"counter"],
        bump = counter.bump
    )]
    pub counter: Account<'info, GlobalCounter>,

    #[account(mut)]
    pub creator: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct GlobalCounter {
    pub total_components: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Component {
    pub component_id: u64,
    #[max_len(200)]
    pub metadata_uri: String,
    pub creator: Pubkey,
    pub timestamp: i64,
    pub bump: u8,
}

#[event]
pub struct ComponentCreated {
    pub component_id: u64,
    pub creator: Pubkey,
    pub timestamp: i64,
}

#[error_code]
pub enum SolSutaraError {
    #[msg("Metadata URI cannot be empty")]
    EmptyMetadataUri,
    #[msg("Metadata URI exceeds maximum length of 200 characters")]
    MetadataUriTooLong,
    #[msg("Global component counter overflow")]
    CounterOverflow,
}
