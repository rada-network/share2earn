const { ethers, upgrades, hardhatArguments } = require('hardhat');
const { addresses: referralAddresses } = require('./proxyAddresses');

async function main() {
  const [deployer] = await ethers.getSigners();

  const network = hardhatArguments.network;
  const referralAddress = referralAddresses[network];

  console.log("Change incentive with the account:", deployer.address);
  console.log("With ReferralContract address:", referralAddress);

  const program = "MEOProgram";

  const referralContract = await ethers.getContractAt("ReferralContract",referralAddress);
  await referralContract.setIncentiveAmountL0(program,ethers.utils.parseUnits( "0.03" , 18 ));
  console.log("Change Incentive 0: ", program);
  await referralContract.setIncentiveAmountL1(program,ethers.utils.parseUnits( "0.015" , 18 ));
  console.log("Change Incentive 1: ", program);
  await referralContract.setIncentiveAmountL2(program,ethers.utils.parseUnits( "0.002" , 18 ));
  console.log("Change Incentive 2: ", program);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });