var fs = require('fs');

const { ethers, upgrades, hardhatArguments } = require('hardhat');
const { addresses: referralAddresses } = require('./proxyAddresses');

async function main() {
  const [deployer] = await ethers.getSigners();

  const network = hardhatArguments.network;
  const referralAddress = referralAddresses[network];

  console.log("Save data from ReferralSingleContract address:", referralAddress);

  const program = "1";
  const referralContract = await ethers.getContractAt("ReferralSingleContract",referralAddress);


  const addresses = await referralContract.getJoinersAddress(program);

  await createTheFile(addresses);

  await getReferees(addresses, program, referralContract);

  console.log(addresses.length)
}
async function createTheFile(addresses) {
  return new Promise(resolve => {
    var file = fs.createWriteStream(__dirname + '/../../data/mainnet.txt');
    file.on('error', function(err) { console.log(err) });
    addresses.forEach(function(v) { file.write(v + '\n'); });
    file.end();
    file.on('finish', resolve);
  })
}
async function getReferees(addresses,program,referralContract) {
  for (const addr of addresses) {
    console.log('get from:',addr);
    await sleep(300);
    const refereesL1 = await referralContract.getJoinerRefereesL1Address(program, addr);
    if (refereesL1.length>0) {
      await createTheFileReferees(addr, refereesL1);
    }
  };
}

async function createTheFileReferees(address, referees) {
  return new Promise(resolve => {
    var file = fs.createWriteStream(__dirname + '/../../data/'+address+'.txt');
    file.on('error', function(err) { console.log(err) });
    referees.forEach(function(v) { file.write(v + '\n'); });
    file.end();
    file.on('finish', resolve);
  })
}


function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });