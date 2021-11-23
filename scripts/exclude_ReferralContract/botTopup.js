const { ethers, upgrades, hardhatArguments } = require('hardhat');
const { addresses: referralAddresses } = require('./proxyAddresses');
const { addresses: meoAddresses } = require('../MEOToken/tokenAddresses');
const { addresses: rirAddresses } = require('../RIRToken/tokenAddresses');

async function main() {
  [owner, ...addrs] = await ethers.getSigners();

  const network = hardhatArguments.network;
  const referralAddress = referralAddresses[network];
  const provider = ethers.provider;
  const referralContract = await ethers.getContractAt("ReferralContract",referralAddress);

  for (var i=0;i<addrs.length;i++) {
    const addr = addrs[i];
    console.log(addr.address);
    await owner.sendTransaction({
      to: addr.address,
      value: ethers.utils.parseEther("0.01") // 1 ether
    })

    const balance = await provider.getBalance(addr.address);
    console.log(ethers.utils.formatUnits(balance,18));
  }

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });