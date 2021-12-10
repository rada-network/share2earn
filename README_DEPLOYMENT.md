# Deployment guide

Configuration .env file

```shell
PRIVATE_KEY=
RINKEBY_API_KEY=
ETHERSCAN_API_KEY=
BSC_API_KEY=
MNEMONIC=
```

The following tasks:

```shell
git pull # or using a tag to fetch latest code
npx hardhat accounts
npx hardhat compile
npx hardhat clean
npx hardhat test
```

Build & Deploy BSC testnet | Referral Single Contract

```shell
npx hardhat run scripts/ReferralSingleContract/deploy.js --network testnet
# npx hardhat run scripts/ReferralSingleContract/getImplementationAddress.js --network testnet
# Get implementation address above
# npx hardhat verify --network testnet TODO_implementation_address

# Copy Contract address to contractAddresses.js
npx hardhat run scripts/ReferralSingleContract/addProgram.js --network testnet

# Set Admins
npx hardhat run scripts/ReferralSingleContract/setAdmin.js --network testnet
# Upgrade V2
#npx hardhat run scripts/ReferralSingleContract/upgradeContract_prepare_v2.js --network testnet
npx hardhat run scripts/ReferralSingleContract/upgradeContract_v2.js --network testnet

# Change info program (if needle)
# npx hardhat run scripts/ReferralSingleContract/updateProgram.js --network testnet

```

Build & Deploy BSC testnet | Referral Admin Contract V2

```shell

npx hardhat run scripts/ReferralAdminContractV2/deploy.js --network testnet
# Copy Contract address to proxyAddresses.js
# Top-up tokens
npx hardhat run scripts/ReferralAdminContractV2/topUpContract.js --network testnet
# Emergency Withdraw
# npx hardhat run scripts/ReferralAdminContractV2/emergencyWithdraw.js --network testnet

# Add program, change program code (projectID) in source
npx hardhat run scripts/ReferralAdminContractV2/addProgram.js --network testnet

# Set Admins
npx hardhat run scripts/ReferralAdminContractV2/setAdmin.js --network testnet

# Change info program (if needle)
# npx hardhat run scripts/ReferralAdminContractV2/updateProgram.js --network testnet


# npx hardhat run scripts/ReferralAdminContractV2/getImplementationAddress.js --network testnet
# npx hardhat verify --network testnet TODO_implementation_address

# Upgrade V3
npx hardhat run scripts/ReferralAdminContractV2/upgradeContract_v3.js --network testnet

# NOTE: Update LIMIT Claim 1 RIR
```
