# 🌱 Green Points - Aptos Blockchain Rewards System

A decentralized rewards platform built on Aptos blockchain where cafes can award eco-friendly points to students for sustainable actions, and students can redeem these points for rewards.

## 🎯 Overview

Green Points is a sustainable rewards ecosystem that incentivizes environmentally conscious behavior through blockchain technology. Students earn Green Points (GPNT) tokens from participating cafes for eco-friendly actions like using reusable cups, proper recycling, or participating in sustainability programs.

### Key Features
- **🔒 Secure**: Built on Aptos blockchain with robust smart contracts
- **🌐 Cross-Platform**: Chrome extension works on any website
- **⚡ Real-time**: Instant balance updates and transaction confirmation
- **🎛️ Admin-Controlled**: Merchant approval system for security
- **📱 User-Friendly**: Simple one-click operations via Petra wallet

## 🚀 Quick Start

### Prerequisites
- [Aptos CLI](https://aptos.dev/tools/aptos-cli/) installed
- [Petra Wallet](https://petra.app/) Chrome extension
- Chrome browser

### 1-Minute Setup

```bash
# Clone and navigate
git clone <repository-url>
cd Greenn

# Deploy the smart contract (requires funded admin account)
./scripts/compile.sh && ./scripts/publish.sh && ./scripts/init.sh

# Set up student account  
./scripts/register.sh

# Test the system
./scripts/award.sh 100    # Award 100 GPNT
./scripts/redeem.sh 50     # Redeem 50 GPNT

# Load Chrome extension
# 1. Open chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked" → select extension/ folder
```

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Chrome Ext.    │    │   Move Contract  │    │   CLI Scripts   │
│                 │    │                  │    │                 │
│  • Popup UI     │◄──►│  • GPNT Token    │◄──►│  • Deployment   │
│  • Petra Bridge │    │  • Admin Logic   │    │  • Registration │
│  • Balance API  │    │  • Merchant Mgmt │    │  • Award/Redeem │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         └────────────────────────▼────────────────────────┘
                            Aptos Devnet
```

## 📦 Components

### Move Smart Contract (`sources/points.move`)
- **GreenPoints**: Custom coin type with zero decimals
- **Admin Resource**: Holds mint/burn capabilities and merchant registry
- **Entry Functions**: Complete lifecycle management (init, register, award, redeem)
- **Events**: Comprehensive transaction logging
- **Security**: Admin-controlled minting, merchant approval system

### Chrome Extension (`extension/`)
- **popup.js**: Main UI logic with transaction coordination
- **content.js**: Secure bridge between popup and page context
- **aptos-client.js**: Direct blockchain interaction via Petra wallet
- **Robust Error Handling**: Transaction confirmation and detailed error reporting

### CLI Tools (`scripts/`)
- **Automated Deployment**: One-command contract setup
- **Multi-Profile Support**: Separate admin and student configurations
- **Batch Operations**: Streamlined award/redeem operations

## 📖 Usage Guide

### For Administrators

**Initial Setup**:
```bash
# Configure Aptos CLI
aptos init --profile admin --network devnet
aptos account fund-with-faucet --profile admin

# Deploy system
./scripts/publish.sh
./scripts/init.sh
```

**Manage Merchants**:
- Use Chrome extension popup for GUI
- Or CLI for batch operations

### For Cafes/Merchants

**Award Points**:
1. Open Chrome extension popup
2. Connect Petra wallet (ensure merchant approval)
3. Enter student address and amount
4. Click "Award Points"
5. Confirm transaction in Petra

### For Students

**Get Started**:
1. Install Petra wallet and set to Devnet
2. Open Chrome extension popup
3. Connect wallet and click "Register as Student"
4. Start earning points from participating merchants

**Check Balance**:
- Use extension popup "Check Balance" button
- View real-time GPNT balance

## 🛠️ Development

### Project Structure

```
Greenn/
├── sources/points.move      # Core smart contract
├── tests/points_test.move   # Contract unit tests
├── extension/               # Chrome extension files
│   ├── manifest.json       # Extension configuration
│   ├── popup.html          # UI layout
│   ├── popup.js            # Main logic
│   ├── content.js          # Page bridge
│   └── aptos-client.js     # Blockchain interface
├── scripts/                # CLI automation
│   ├── compile.sh          # Contract compilation
│   ├── publish.sh          # Deployment
│   ├── init.sh             # System initialization
│   ├── register.sh         # Student registration
│   ├── award.sh            # Point awards
│   └── redeem.sh           # Point redemptions
├── src/aptosClient.ts      # TypeScript utilities
└── Move.toml               # Move package configuration
```

### Smart Contract Development

```bash
# Compile and test
./scripts/compile.sh
aptos move test

# Deploy to devnet
./scripts/publish.sh
```

### Extension Development

```bash
# Load extension in developer mode
# Test on test-extension.html
# Debug with browser DevTools
```

## 🧪 Testing

### Contract Testing
```bash
# Run all tests
aptos move test --named-addresses Greenn=$ADMIN

# Test specific functions
aptos move test --filter test_award_points
```

### Integration Testing
```bash
# Full workflow test
./scripts/register.sh
./scripts/award.sh 100
# Check balance via extension (should show 100)
./scripts/redeem.sh 50
# Check balance again (should show 50)
```

### Extension Testing
1. Load `test-extension.html` in browser
2. Use browser DevTools for debugging
3. Test wallet connection and transactions

## 🐛 Troubleshooting

### Common Issues

**"Petra wallet not found"**:
- Install Petra extension
- Enable "Allow on all sites"
- Unlock wallet and switch to Devnet

**"Balance shows 0 after award"**:
- Ensure student is registered first
- Verify student address matches recipient
- Wait for transaction confirmation

**"Content script not loaded"**:
- Reload extension and webpage
- Check extension has sufficient permissions
- Try on a different website (not chrome:// pages)

### Debug Commands

```bash
# Check account balance
aptos account list --query balance --account $STUDENT

# View contract resources  
aptos account list --query resources --account $ADMIN

# Check transaction status
curl "https://fullnode.devnet.aptoslabs.com/v1/transactions/by_hash/TX_HASH"
```

## 🔧 Configuration

### Environment Setup (`~/.aptos/config.yaml`)
```yaml
profiles:
  admin:
    network: Devnet
    account: 0x81016bf623696dee3897ac2e423813a6657b3b7ca004c0c16bac663291da2ec3
  student:  
    network: Devnet
    account: 0x7ac9d4dd56d3e00eec939edbb2ad1a6b33925ddc7461e7dd298711613dede91b
```

### Network Migration

**Moving to Mainnet**:
1. Update Move.toml addresses
2. Configure mainnet CLI profiles
3. Fund accounts (no faucet on mainnet)
4. Update extension RPC endpoints
5. Thorough testing on testnet first

## 📋 Security Considerations

- **Admin Controls**: All minting requires admin signature
- **Merchant Approval**: Only admin-approved merchants can redeem
- **Private Key Safety**: Keys never leave user's wallet
- **Transaction Confirmation**: Extension waits for on-chain confirmation
- **Input Validation**: Amount > 0 checks in smart contract

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Run tests: `aptos move test && npm test`
4. Commit changes: `git commit -m 'Add amazing feature'`
5. Push to branch: `git push origin feature/amazing-feature`
6. Open Pull Request

### Development Guidelines
- Follow Move coding conventions
- Add comprehensive error handling
- Update documentation for new features
- Test on both Devnet and local environment

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Aptos Labs](https://aptos.dev/) for blockchain platform
- [Petra Wallet](https://petra.app/) for wallet infrastructure
- Move language community for documentation and examples

---

**Built with ❤️ for a sustainable future 🌱**

For support or questions, please open an issue or contact the development team.
