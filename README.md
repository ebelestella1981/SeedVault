# SeedVault# 🌱 SeedVault: NFT Heirloom Seed Bank

Welcome to the ultimate blockchain-powered vault for preserving the world's heirloom seeds! This Web3 project uses NFTs to represent unique seed varieties, enabling secure ownership, lineage tracking, and community-driven biodiversity conservation on the Stacks blockchain.

## ✨ Features

🌍 **Biodiversity Preservation**: Register and mint NFTs for rare heirloom seeds, timestamping their origin to combat genetic erosion  
🔗 **Lineage Tracking**: Trace seed heritage through parent-child relationships for authentic breeding records  
💎 **NFT Ownership**: Tokenize seeds as unique, transferable assets with metadata for traits and history  
🛒 **Decentralized Marketplace**: Trade or gift seeds peer-to-peer while ensuring royalties support conservation  
🗳️ **Community Governance**: Vote on funding preservation initiatives using staked seed NFTs  
✅ **Authenticity Verification**: Instant checks against the blockchain to prevent counterfeits  
📊 **Impact Dashboard**: Track global seed diversity metrics and donation flows  
🚫 **Anti-Duplication**: Immutable hashes prevent fake registrations of seed varieties  

## 🛠 How It Works

**For Seed Stewards (Growers & Collectors)**

- Harvest and document your heirloom seeds (photos, traits, origin story)
- Generate a SHA-256 hash of seed data and call `register-variety` on the SeedRegistry contract
- Mint an NFT via the NFTOwnership contract, embedding metadata like yield potential and climate resilience
- Breed new seeds? Use LineageTracker to link parent NFTs for verified pedigrees

Your seeds are now eternally preserved and ownable—trade them on the ExchangeMarket to fund more planting!

**For Verifiers & Conservationists**

- Query `get-seed-lineage` to view full ancestry and authenticity proofs
- Call `verify-nft-ownership` on the Verification contract to confirm holder rights
- Stake NFTs in CommunityGovernance to vote on grants for seed banks worldwide
- Donate via DonationContract—royalties from trades auto-flow to verified eco-projects

That's it! One mint, endless impact—reviving lost varieties one NFT at a time.

## 📜 Core Smart Contracts (8 Total, Built in Clarity)

| Contract Name | Purpose | Key Functions |
|---------------|---------|---------------|
| **SeedRegistry** | Registers unique seed varieties with hashes | `register-variety`, `is-variety-registered?` |
| **NFTOwnership** | Mints and manages seed NFTs | `mint-seed-nft`, `transfer-nft` |
| **LineageTracker** | Tracks breeding relationships | `link-parent-child`, `get-lineage` |
| **ExchangeMarket** | Facilitates P2P seed trading | `list-for-sale`, `buy-seed`, `set-royalty` |
| **DonationContract** | Handles conservation donations | `donate-funds`, `distribute-grants` |
| **Verification** | Validates authenticity and ownership | `verify-seed`, `check-lineage-integrity` |
| **CommunityGovernance** | Enables DAO-like voting | `stake-nft`, `vote-proposal`, `execute-vote` |
| **MetadataStorage** | Stores off-chain seed details | `store-metadata`, `retrieve-metadata` |

## 🚀 Getting Started

1. Clone the repo and set up your Stacks dev environment (Clarinet recommended).
2. Deploy contracts to testnet: `clarinet deploy`.
3. Interact via the Clarity REPL or build a simple frontend with Stacks.js.

Join the seed revolution—let's NFT our way to a greener planet! 🌍✨