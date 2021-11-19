const crypto = require('crypto')
const { ethers, upgrades, hardhatArguments } = require('hardhat');
const { addresses: referralAddresses } = require('./contractAddresses');

async function main() {
  [owner, ...addrs] = await ethers.getSigners();

  const network = hardhatArguments.network;
  const provider = ethers.provider;
  const referralAddress = referralAddresses[network];
  const referralContract = await ethers.getContractAt("ReferralSingleContract",referralAddress);

  const startFrom = 0;
  const addr = addrs[startFrom];
  const uid = crypto.createHash('md5').update(addr.address).digest('hex').substring(0,12);
  console.log(uid)
  console.log(addr.address)
  // const balance = await provider.getBalance(addr.address);
  // console.log(ethers.utils.formatUnits(balance,18));

  await referralContract.connect(addr).joinProgram(uid, '');

  for (let i=(startFrom+1);i<(startFrom+3);i++) {
    const addrJoin = addrs[i];
    const uidJoiner = crypto.createHash('md5').update(addrJoin.address).digest('hex').substring(0,12);
    console.log(uidJoiner)
    await referralContract.connect(addrJoin).joinProgram(uidJoiner, uid);
  }

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });