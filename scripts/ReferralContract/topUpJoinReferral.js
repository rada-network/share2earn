const { ethers, upgrades, hardhatArguments } = require('hardhat');
const { addresses: referralAddresses } = require('./proxyAddresses');
const { addresses: meoAddresses } = require('../MEOToken/tokenAddresses');
const { addresses: rirAddresses } = require('../RIRToken/tokenAddresses');

async function main() {
  const [deployer] = await ethers.getSigners();

  const network = hardhatArguments.network;
  const referralAddress = referralAddresses[network];

  console.log("Top-up contracts with the account:", deployer.address);
  console.log("With ReferralContract address:", referralAddress);

  // Sample top-up Tokens to contract
  const rirToken = await ethers.getContractAt("RIRToken",rirAddresses[network]);
  await rirToken.transfer(referralAddress, ethers.utils.parseUnits( "100" , 18 ));
  console.log("Top-up 100 RIR");

  const meoToken = await ethers.getContractAt("MEOToken",meoAddresses[network]);
  await meoToken.transfer(referralAddress, ethers.utils.parseUnits( "100" , 18 ));
  console.log("Top-up 100 MEO");

  const referralContract = await ethers.getContractAt("ReferralContract",referralAddress);
  await referralContract.addProgram("RIRProgram",rirAddresses[network]);
  console.log("RIRProgram joined");
  await referralContract.addProgram("MEOProgram",meoAddresses[network]);
  console.log("MEOProgram joined");
  await referralContract.addProgram("RIRProgramII",rirAddresses[network]);
  console.log("RIRProgramII joined");

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });