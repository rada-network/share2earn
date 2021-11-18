const { ethers, upgrades, hardhatArguments } = require('hardhat');
const { addresses: rirAddresses } = require('../RIRToken/tokenAddresses');

async function main() {
  const [deployer] = await ethers.getSigners();

  const network = hardhatArguments.network;

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());
  const ReferralContractSingle = await ethers.getContractFactory("ReferralContractSingle");

  const programCode = "PGX";
  const endTime = Math.floor(Date.now() / 1000) + 10 * 86400;
  const tokenAllocation = ethers.utils.parseUnits( "10" , 18 );
  const incentiveRate = ethers.utils.parseUnits( "0.02" , 18 );

  const contract = await ReferralContractSingle.deploy(programCode, tokenAllocation, incentiveRate, endTime);

  console.log("Contract address:", contract.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });