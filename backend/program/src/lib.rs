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
        component.parents = Vec::new();

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

    pub fn link_components(
        ctx: Context<LinkComponents>,
        _parent_component_id: u64,
        _child_component_id: u64,
    ) -> Result<()> {
        // Prevent self-linking by comparing account keys
        require!(
            ctx.accounts.parent_component.key() != ctx.accounts.child_component.key(),
            SolSutaraError::SelfLink
        );

        let parent_id = ctx.accounts.parent_component.component_id;
        let child = &mut ctx.accounts.child_component;

        // Prevent duplicate link
        require!(
            !child.parents.contains(&parent_id),
            SolSutaraError::DuplicateLink
        );

        // Guard against exceeding pre-allocated parent slots
        require!(child.parents.len() < 10, SolSutaraError::TooManyParents);

        let child_id = child.component_id;
        child.parents.push(parent_id);

        emit!(ComponentLinked {
            parent_component_id: parent_id,
            child_component_id: child_id,
        });

        Ok(())
    }
}

// ─── Account Contexts ────────────────────────────────────────────────────────

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

#[derive(Accounts)]
pub struct LinkComponents<'info> {
    /// Parent component — validated via PDA seeds stored in account data
    #[account(
        seeds = [
            b"component",
            parent_component.creator.as_ref(),
            &parent_component.component_id.to_le_bytes(),
        ],
        bump = parent_component.bump,
    )]
    pub parent_component: Account<'info, Component>,

    /// Child component — mutable, parents vec will be updated
    #[account(
        mut,
        seeds = [
            b"component",
            child_component.creator.as_ref(),
            &child_component.component_id.to_le_bytes(),
        ],
        bump = child_component.bump,
    )]
    pub child_component: Account<'info, Component>,

    pub authority: Signer<'info>,
}

// ─── Account Structs ─────────────────────────────────────────────────────────

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
    /// IDs of parent components (up to 10 parents per component)
    #[max_len(10)]
    pub parents: Vec<u64>,
}

// ─── Events ───────────────────────────────────────────────────────────────────

#[event]
pub struct ComponentCreated {
    pub component_id: u64,
    pub creator: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct ComponentLinked {
    pub parent_component_id: u64,
    pub child_component_id: u64,
}

// ─── Errors ───────────────────────────────────────────────────────────────────

#[error_code]
pub enum SolSutaraError {
    #[msg("Metadata URI cannot be empty")]
    EmptyMetadataUri,
    #[msg("Metadata URI exceeds maximum length of 200 characters")]
    MetadataUriTooLong,
    #[msg("Global component counter overflow")]
    CounterOverflow,
    #[msg("A component cannot be linked to itself")]
    SelfLink,
    #[msg("This parent-child relationship already exists")]
    DuplicateLink,
    #[msg("Component already has the maximum number of parents (10)")]
    TooManyParents,
}
