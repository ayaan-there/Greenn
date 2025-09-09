# Green Points on Aptos

A loyalty points system built on Aptos blockchain using the Coin standard, with a Chrome extension for easy interaction.

## Quick Start

### Environment Setup
```bash
export ADMIN=0x81016bf623696dee3897ac2e423813a6657b3b7ca004c0c16bac663291da2ec3
export STUDENT=0x7ac9d4dd56d3e00eec939edbb2ad1a6b33925ddc7461e7dd298711613dede91b
export CAFE=0xcafe123...  # Optional merchant address
```

### Move Package Commands
```bash
# Compile and publish (if not already published)
./scripts/compile.sh
./scripts/publish.sh

# Initialize the coin system
./scripts/init.sh

# Register student for Green Points
./scripts/register.sh

# Award 100 points to student
./scripts/award.sh 100

# Redeem 50 points from student
./scripts/redeem.sh 50

# Test the module
aptos move test --named-addresses Greenn=$ADMIN
```

### Chrome Extension Setup
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `extension/` folder
4. Install Petra wallet if not already installed
5. Click the Green Points extension icon to open popup

### TypeScript SDK Usage
```bash
# Install dependencies (optional - standalone implementation included)
npm install

# Type check
npm run type-check

# Use in your app
import { getGpntBalance, isUserRegistered } from './src/aptosClient';
const balance = await getGpntBalance(adminAddr, userAddr);
const registered = await isUserRegistered(adminAddr, userAddr);
```

## Architecture

### Move Module (`sources/points.move`)
- **GreenPoints**: Coin type with `drop` ability
- **Admin**: Resource holding mint/burn capabilities and merchant registry
- **Events**: AwardedEvent, RedeemedEvent for tracking transactions
- **Entry Functions**: init, register, set_merchant, award, redeem_from, redeem_self

### Chrome Extension (`extension/`)
- **manifest.json**: MV3 configuration with content script injection
- **popup.html/js**: UI for balance checking, awarding, and redeeming
- **content.js**: Message bridge between popup and page context  
- **aptos-client.js**: Petra wallet integration and Aptos RPC calls

### Key Features
- ✅ Coin standard compliance with proper capability management
- ✅ Admin-controlled minting and merchant approval system
- ✅ Event emission for award/redeem tracking
- ✅ Chrome extension with Petra wallet integration
- ✅ TypeScript SDK utilities for balance queries
- ✅ Comprehensive test suite

### Security Notes
- Admin controls all minting and merchant approvals
- Only approved merchants can redeem points from users
- Freeze capability is destroyed (not used)
- Private keys never leave the user's wallet
- Extension communicates with wallet through secure message passing

## File Structure
```
├── Move.toml              # Package configuration with named address
├── sources/points.move    # Core Move module
├── tests/points_test.move # Unit tests
├── scripts/*.sh          # CLI automation scripts
├── extension/            # Chrome Extension (MV3)
└── src/aptosClient.ts    # TypeScript SDK utilities
```

Ready to run! 🚀
