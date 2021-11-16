// We import Chai to use its asserting functions here.
const { expect } = require("chai");
const { ethers, upgrades } = require('hardhat');

describe("Referral contract", function () {

  let ReferralContract;
  let RIRToken;
  let rirToken;
  let MEOToken;
  let meoToken;
  let contract;

  beforeEach(async function () {

    // Get the ContractFactory and Signers here.
    RIRToken = await ethers.getContractFactory("RIRToken");
    MEOToken = await ethers.getContractFactory("MEOToken");
    ReferralContract = await ethers.getContractFactory("ReferralContract");

    // ContractV2 = await ethers.getContractFactory("ReferralContractV2");
    // ContractV3 = await ethers.getContractFactory("ReferralContractV3");

    [owner, addr1, addr2, addr3, addr4, addr5, ...addrs] = await ethers.getSigners();

    rirToken = await RIRToken.deploy();
    meoToken = await MEOToken.deploy();

    contract = await upgrades.deployProxy(ReferralContract, { kind: 'uups' });
    await rirToken.transfer(contract.address, ethers.utils.parseUnits( "100" , 18 ));
    await meoToken.transfer(contract.address, ethers.utils.parseUnits( "100" , 18 ));

    // Set addr4 is Admin
    await contract.setAdmin(addr4.address, true);
  });

  /*
  // Contract don't have owner
  it('Deploy v1 and should set right owner', async function () {
    expect(await contract.owner()).to.equal(owner.address);
  }); */
  /* it('Upgrade v2', async function () {
    const contract = await upgrades.deployProxy(ReferralContract, [validUserContract.address], { kind: 'uups' });
    const contractV2 = await upgrades.upgradeProxy(contract, ContractV2);
    expect(await contractV2.version()).to.equal("v2");
  }); */

  it('Should RIRToken have balance 100 token', async function () {
    const contractBalance = await rirToken.balanceOf(contract.address);
    expect(contractBalance).to.equal(ethers.utils.parseUnits( "100" , 18 ));
  });

/*   it('Should add valid user and get uid', async function () {

    await validUserContract.setUser(addr4.address,"555555");

    await expect(await contract.getUserUid(addr4.address)).to.equal("555555");
  }); */

  it('Should add new program', async function () {
    const programCode =  "RIRProgram";
    const code = programCode;
    await contract.addProgram(code, rirToken.address);
    var program = await contract.programs(programCode);
    await expect(program.tokenAddress).to.equal(rirToken.address);

    // Get info program
    var p = await contract.programs(code);
    await expect(p.code).to.equal(code);
  });

  it('Should change incentives', async function () {
    const programCode =  "RIRProgram";
    await contract.addProgram(programCode, rirToken.address);
    await contract.setIncentiveAmount(programCode, 100,50,30);

    var program = await contract.programs(programCode);

    await expect(program.incentiveL0).to.equal(100);
    await expect(program.incentiveL1).to.equal(50);
    await expect(program.incentiveL2).to.equal(30);
  });
  it('Should get information program', async function () {
    const programCode =  "RIRProgram";
    await contract.addProgram(programCode, rirToken.address);
    var program = await contract.programs(programCode);
    await expect(program.code).to.equal(programCode);
  });

  it('Should add 2 programs and let one user join both', async function () {

    const programCode = "RIRProgram";
    await contract.addProgram(programCode, rirToken.address);
    await contract.addProgram("MEOProgram", meoToken.address);
    var program = await contract.programs(programCode);
    await expect(program.tokenAddress).to.equal(rirToken.address);
    program = await contract.programs("MEOProgram");
    await expect(program.tokenAddress).to.equal(meoToken.address);

    // Set user 1
    const uid1 = "123123";
    // Set user 2
    const uid2 = "456456";

    // Valid
    await expect(contract.connect(addr1).joinProgram(programCode, uid1,"")).to.not.be.reverted;
    // Valid
    await expect(contract.connect(addr2).joinProgram(programCode, uid2, uid1)).to.not.be.reverted;
    expect(await contract.rUserFromReferer(programCode,addr2.address)).to.equal(addr1.address);

    // valid
    await expect(contract.connect(addr2).joinProgram("MEOProgram", uid2,"")).to.not.be.reverted;

    // Check hold got incentive
    expect(await contract.incentiveHold(programCode,uid1)).to.equal(ethers.utils.parseUnits( "0.02" , 18 )); // 0.02 MEO

    // Admin approve All incentive
    await contract.connect(addr4).approveAllIncentive(programCode);

    // Check hold got incentive is 0
    expect(await contract.incentiveHold(programCode,uid1)).to.equal(0); // Already clear

    // Check balance incentive of user A
    expect(await rirToken.balanceOf(addr1.address)).to.equal(ethers.utils.parseUnits( "0.02" , 18 )); // 0.02 MEO

    // should un-valid, because addr1 not joined MEO program
    await expect(await contract.uidJoined(programCode,uid1)).to.equal(addr1.address);
    // should valid, because addr1 not joined MEO program
    await expect(await contract.uidJoined("MEOProgram",uid1)).to.equal("0x0000000000000000000000000000000000000000");

  });

  it('Should let a user join new program with referral code and check duplicate', async function () {

    // Set user 1
    const uid1 = "123123";
    // Set user 2
    const uid2 = "456456";
    // Set user 3
    const uid3 = "009900";
    // Set user 4
    const uid4 = "789789";


    // Add program
    await contract.addProgram("RIRProgram", rirToken.address);
    // Join with uid1 (no referral code)
    await contract.connect(addr1).joinProgram("RIRProgram", uid1, "");
    // Join with uid2 (with uid1)
    await contract.connect(addr2).joinProgram("RIRProgram", uid2, uid1);

    // Join with uid4 (with uid3)
    await expect(contract.connect(addr4).joinProgram("RIRProgram", uid4, uid3)).to.be.reverted;

    // Try join again with same address and uid1
    await expect(contract.connect(addr2).joinProgram("RIRProgram", uid2, uid1)).to.be.reverted;


    await expect(await contract.uidJoined("RIRProgram",uid1)).to.equal(addr1.address);
    await expect(await contract.uidJoined("RIRProgram",uid2)).to.equal(addr2.address);
    await expect(await contract.uidJoined("RIRProgram",uid4)).to.equal("0x0000000000000000000000000000000000000000");

  });


  it('Should join program successfully with referral code and got incentive | 1 level', async function () {

    const programCode =  "RIRProgram";
    // Set user 1
    const uid1 = "123123";
    // Set user 2
    const uid2 = "456456";
    // Set user 3
    const uid3 = "009900";
    // Set user 4
    const uid4 = "789789";

    // Add program
    await contract.addProgram(programCode, rirToken.address);

    // User A join program and got referral code
    await contract.connect(addr1).joinProgram(programCode, uid1, "");

    // User B join program with referral code of user A
    await contract.connect(addr2).joinProgram(programCode, uid2, uid1);

    // User C join program with referral code of user A
    await contract.connect(addr3).joinProgram(programCode, uid3, uid1);

    // const amountHold = await contract.incentiveHold(programCode,uid1);
    // console.log(ethers.utils.formatUnits(amountHold,0))

    // Refer successfully
    expect(await contract.uidJoined(programCode,uid1)).to.equal(addr1.address);
    expect(await contract.uidJoined(programCode,uid2)).to.equal(addr2.address);
    expect(await contract.uidJoined(programCode,uid3)).to.equal(addr3.address);

    // Admin approve All incentive
    await contract.connect(addr4).approveAllIncentive(programCode);

    // Check balance incentive of user A
    expect(await rirToken.balanceOf(addr1.address)).to.equal(ethers.utils.parseUnits( "0.04" , 18 )); // 0.04 RIR

  });

  it('Should join program successfully with referral code and got incentive | 2 level', async function () {
    const programCode =  "RIRProgram";
    // Set user 1
    const uid1 = "123123";
    // Set user 2
    const uid2 = "456456";
    // Set user 3
    const uid3 = "009900";
    // Set user 4
    const uid4 = "789789";

    // Add program
    await contract.addProgram(programCode, rirToken.address);

    // User A join program and give referral code
    await contract.connect(addr1).joinProgram(programCode, uid1, "");

    // User B join program with referral code of user A
    await contract.connect(addr2).joinProgram(programCode, uid2, uid1);

    // User C join program with referral code of user B
    await contract.connect(addr3).joinProgram(programCode, uid3, uid2);

    // Refer successfully
    expect(await contract.rUserFromReferer(programCode,addr2.address)).to.equal(addr1.address);

    // console.log(await contract.holdReferrer(programCode,0));
    // console.log(await contract.holdReferrer(programCode,1));

    // const amountHold = await contract.incentiveHold(programCode,uid2);
    // console.log(ethers.utils.formatUnits(amountHold,0))

    // Admin approve All incentive
    await contract.connect(addr4).approveAllIncentive(programCode);

    // Check balance incentive of user A
    expect(await rirToken.balanceOf(addr1.address)).to.equal(ethers.utils.parseUnits( "0.03" , 18 )); // 0.03 RIR
    // Check balance incentive of user B
    expect(await rirToken.balanceOf(addr2.address)).to.equal(ethers.utils.parseUnits( "0.02" , 18 )); // 0.02 RIR

  });

  it('Should join program successfully with referral code and got incentive | 3 level', async function () {
    const programCode =  "RIRProgram";

    // Set user 1
    const uid1 = "123123";
    // Set user 2
    const uid2 = "456456";
    // Set user 3
    const uid3 = "009900";
    // Set user 4
    const uid4 = "789789";
    // Set user 5
    const uid5 = "777777";

    // Add program
    await contract.addProgram(programCode, rirToken.address);

    // User A join program and give referral code
    await contract.connect(addr1).joinProgram(programCode, uid1, "");

    // User B join program with referral code of user A
    await contract.connect(addr2).joinProgram(programCode, uid2, uid1);
    // User A got 0.02
    // User B got 0

    // User C join program with referral code of user B
    await contract.connect(addr3).joinProgram(programCode, uid3, uid2);
    // User A got 0.01 => 0.03
    // User B got 0.02

    // User D join program with referral code of user C
    await contract.connect(addr4).joinProgram(programCode, uid4, uid3);
    // User E join program with referral code of user C
    await contract.connect(addr5).joinProgram(programCode, uid5, uid3);
    // User A got 0.002 => 0.032
    // User B got 0.02 => 0.04

    // Refer successfully
    expect(await contract.rUserFromReferer(programCode,addr2.address)).to.equal(addr1.address);
    expect(await contract.rUserFromReferer(programCode,addr3.address)).to.equal(addr2.address);

    // Admin approve All incentive
    await contract.connect(addr4).approveAllIncentive(programCode);

    // Check balance incentive of user A
    expect(await rirToken.balanceOf(addr1.address)).to.equal(ethers.utils.parseUnits( "0.032" , 18 )); // 0.032 RIR
    // Check balance incentive of user B
    expect(await rirToken.balanceOf(addr2.address)).to.equal(ethers.utils.parseUnits( "0.04" , 18 )); // 0.04 RIR

  });

  it('Should don\'t add incentive back to user leave and join again', async function () {
    const programCode =  "RIRProgram";
    // Set user 1
    const uid1 = "123123";
    // Set user 2
    const uid2 = "456456";

    // Add program
    await contract.addProgram(programCode, rirToken.address);

    // User A join program and got referral code
    await contract.connect(addr1).joinProgram(programCode, uid1, "");

    // User B join program with referral code of user A
    await contract.connect(addr2).joinProgram(programCode, uid2, uid1);

    // User B leaves program
    await contract.connect(owner).removeJoinProgram(programCode,uid2);
    // User B join again
    await contract.connect(addr2).joinProgram(programCode, uid2, uid1);

    // Admin approve All incentive
    await contract.connect(addr4).approveAllIncentive(programCode);

    expect(await rirToken.balanceOf(addr1.address)).to.equal(ethers.utils.parseUnits( "0.02" , 18 )); // 0.02 RIR

  });

  it('Trying cheating.....', async function () {
    const programCode =  "RIRProgram";
    // Set user 1
    const uid1 = "123123";
    // Set user 2
    const uid2 = "456456";
    // Set user 3
    const uid3 = "009900";
    // Set user 4
    const uid4 = "789789";

    // Add program
    await contract.addProgram(programCode, rirToken.address);

    // User A join program and got referral code
    await contract.connect(addr1).joinProgram(programCode, uid1, "");

    // User A want cheating, join itself again
    await expect(contract.connect(addr1).joinProgram(programCode, uid1, uid1)).to.be.reverted;
    // User B join
    await expect(contract.connect(addr2).joinProgram(programCode, uid2, uid1)).to.not.be.reverted;
    // User B want cheating, create difference uid
    await expect(contract.connect(addr2).joinProgram(programCode, uid3, uid1)).to.be.reverted;
  });

  it('Should withdraw an amount token in emergency', async function () {
    var contractBalance = await rirToken.balanceOf(contract.address);
    expect(contractBalance).to.equal(ethers.utils.parseUnits( "100" , 18 ));

    const tokenWithdraw = ethers.utils.parseUnits( "30" , 18 );

    await expect(contract.connect(addr2).emergencyWithdrawToken(tokenWithdraw)).to.be.reverted;

    await contract.connect(owner).emergencyWithdrawToken(rirToken.address, tokenWithdraw);

    contractBalance = await rirToken.balanceOf(contract.address);
    expect(contractBalance).to.equal(ethers.utils.parseUnits( "70" , 18 ));

  });
});
