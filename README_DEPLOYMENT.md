# Deployment guide

Configuration .env file

```shell
PRIVATE_KEY=
RINKEBY_API_KEY=
ETHERSCAN_API_KEY=
BSC_API_KEY=
MNEMONIC=
```

Build & Deploy BSC testnet | RIRToken (fake)

```shell
npx hardhat run scripts/RIRToken/deploy.js --network testnet
# Copy Token address to tokenAddresses.js
# change new address at FrontEnd config
```

Build & Deploy BSC testnet | Referral Single Contract

```shell
npx hardhat run scripts/ReferralSingleContract/deploy.js --network testnet
# Copy Contract address to contractAddresses.js
npx hardhat run scripts/ReferralSingleContract/addProgram.js --network testnet

# Set Admins
npx hardhat run scripts/ReferralSingleContract/setAdmin.js --network testnet

# Change info program (if needle)
# npx hardhat run scripts/ReferralSingleContract/updateProgram.js --network testnet

```

Build & Deploy BSC testnet | Referral Admin Contract

```shell

npx hardhat run scripts/ReferralAdminContract/deploy.js --network testnet
# Copy Proxy address to proxyAddresses.js
# Top-up tokens
npx hardhat run scripts/ReferralAdminContract/topUpContract.js --network testnet

# Add program, change program code in source
npx hardhat run scripts/ReferralAdminContract/addProgram.js --network testnet

# Set Admins
npx hardhat run scripts/ReferralAdminContract/setAdmin.js --network testnet

# Change info program (if needle)
# npx hardhat run scripts/ReferralAdminContract/updateProgram.js --network testnet

# npx hardhat run scripts/ReferralAdminContract/getImplementationAddress.js --network testnet
# Get implementation address above
# npx hardhat verify --network testnet TODO_implementation_address

```
