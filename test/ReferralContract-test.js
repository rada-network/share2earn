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

    const code = "RIRProgram";
    await contract.addProgram(code, rirToken.address);
    var program = await contract.programs("RIRProgram");
    await expect(program.tokenAddress).to.equal(rirToken.address);

    // Get info program
    var p = await contract.getInfoProgram(code);
    await expect(p.code).to.equal(code);
  });
  it('Should change incentives', async function () {

    await contract.addProgram("RIRProgram", rirToken.address);
    await contract.setIncentiveAmountL0("RIRProgram", 100);
    await contract.setIncentiveAmountL1("RIRProgram", 50);
    await contract.setIncentiveAmountL2("RIRProgram", 30);

    var program = await contract.programs("RIRProgram");

    await expect(program.incentiveL0).to.equal(100);
    await expect(program.incentiveL1).to.equal(50);
    await expect(program.incentiveL2).to.equal(30);
  });
  it('Should get information program', async function () {
    await contract.addProgram("RIRProgram", rirToken.address);
    var program = await contract.getInfoProgram("RIRProgram");
    await expect(program.code).to.equal("RIRProgram");
  });

  it('Should add 2 programs and let one user join both', async function () {

    await contract.addProgram("RIRProgram", rirToken.address);
    await contract.addProgram("MEOProgram", meoToken.address);
    var program = await contract.programs("RIRProgram");
    await expect(program.tokenAddress).to.equal(rirToken.address);
    program = await contract.programs("MEOProgram");
    await expect(program.tokenAddress).to.equal(meoToken.address);

    // Set user 1
    const uid1 = "123123";
    // Set user 2
    const uid2 = "456456";
    // Set user 3
    const uid3 = "009900";
    // Set user 4
    const uid4 = "789789";

    // Valid
    await expect(contract.connect(addr1).joinProgram("RIRProgram", uid1,"")).to.not.be.reverted;
    // Valid
    await expect(contract.connect(addr2).joinProgram("RIRProgram", uid2, uid1)).to.not.be.reverted;
    expect(await contract.rUserFromUser("RIRProgram",addr2.address)).to.equal(addr1.address);

    // console.log(await contract.debug());
    // valid
    await expect(contract.connect(addr2).joinProgram("MEOProgram", uid2,"")).to.not.be.reverted;

    // Check balance incentive of user A
    expect(await rirToken.balanceOf(addr1.address)).to.equal(ethers.utils.parseUnits( "0.02" , 18 )); // 0.02 MEO

    // should un-valid, because addr1 not joined MEO program
    await expect(await contract.uidJoined("RIRProgram",uid1)).to.equal(addr1.address);
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

    // User A join program and got referral code
    await contract.connect(addr1).joinProgram("RIRProgram", uid1, "");

    // User B join program with referral code of user A
    await contract.connect(addr2).joinProgram("RIRProgram", uid2, uid1);
    // User C join program with referral code of user A
    await contract.connect(addr3).joinProgram("RIRProgram", uid3, uid1);

    // Refer successfully
    expect(await contract.uidJoined("RIRProgram",uid1)).to.equal(addr1.address);
    expect(await contract.uidJoined("RIRProgram",uid2)).to.equal(addr2.address);
    expect(await contract.uidJoined("RIRProgram",uid3)).to.equal(addr3.address);

    // Check balance incentive of user A
    expect(await rirToken.balanceOf(addr1.address)).to.equal(ethers.utils.parseUnits( "0.04" , 18 )); // 0.04 RIR

  });

  it('Should join program successfully with referral code and got incentive | 2 level', async function () {

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

    // User A join program and give referral code
    await contract.connect(addr1).joinProgram("RIRProgram", uid1, "");

    // User B join program with referral code of user A
    await contract.connect(addr2).joinProgram("RIRProgram", uid2, uid1);

    // User C join program with referral code of user B
    await contract.connect(addr3).joinProgram("RIRProgram", uid3, uid2);

    // Refer successfully
    expect(await contract.rUserFromUser("RIRProgram",addr2.address)).to.equal(addr1.address);

    // Check balance incentive of user A
    expect(await rirToken.balanceOf(addr1.address)).to.equal(ethers.utils.parseUnits( "0.03" , 18 )); // 0.03 RIR
    // Check balance incentive of user B
    expect(await rirToken.balanceOf(addr2.address)).to.equal(ethers.utils.parseUnits( "0.02" , 18 )); // 0.02 RIR

  });

  it('Should join program successfully with referral code and got incentive | 3 level', async function () {


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
    await contract.addProgram("RIRProgram", rirToken.address);

    // User A join program and give referral code
    await contract.connect(addr1).joinProgram("RIRProgram", uid1, "");

    // User B join program with referral code of user A
    await contract.connect(addr2).joinProgram("RIRProgram", uid2, uid1);
    // User A got 0.02
    // User B got 0

    // User C join program with referral code of user B
    await contract.connect(addr3).joinProgram("RIRProgram", uid3, uid2);
    // User A got 0.01 => 0.03
    // User B got 0.02

    // User D join program with referral code of user C
    await contract.connect(addr4).joinProgram("RIRProgram", uid4, uid3);
    // User E join program with referral code of user C
    await contract.connect(addr5).joinProgram("RIRProgram", uid5, uid3);
    // User A got 0.002 => 0.032
    // User B got 0.02 => 0.04

    // Refer successfully
    expect(await contract.rUserFromUser("RIRProgram",addr2.address)).to.equal(addr1.address);
    expect(await contract.rUserFromUser("RIRProgram",addr3.address)).to.equal(addr2.address);

    // Check balance incentive of user A
    expect(await rirToken.balanceOf(addr1.address)).to.equal(ethers.utils.parseUnits( "0.032" , 18 )); // 0.032 RIR
    // Check balance incentive of user B
    expect(await rirToken.balanceOf(addr2.address)).to.equal(ethers.utils.parseUnits( "0.04" , 18 )); // 0.04 RIR

  });

  it('Should transfer back token from Referral Contract', async function () {

    await contract.transferBack(rirToken.address, ethers.utils.parseUnits( "50" , 18 ));

    const contractBalance = await rirToken.balanceOf(contract.address);
    expect(contractBalance).to.equal(ethers.utils.parseUnits( "50" , 18 ));
  });
  it('Should don\'t add incentive back to user leave and join again', async function () {

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
    await contract.addProgram("RIRProgram", rirToken.address);

    // User A join program and got referral code
    await contract.connect(addr1).joinProgram("RIRProgram", uid1, "");

    // User B join program with referral code of user A
    await contract.connect(addr2).joinProgram("RIRProgram", uid2, uid1);

    // User B leaves program
    await contract.connect(addr2).leaveProgram("RIRProgram");
    // User B join again
    await contract.connect(addr2).joinProgram("RIRProgram", uid2, uid1);

    expect(await rirToken.balanceOf(addr1.address)).to.equal(ethers.utils.parseUnits( "0.02" , 18 )); // 0.02 RIR

  });

  it('Trying cheating.....', async function () {

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

    // User A join program and got referral code
    await contract.connect(addr1).joinProgram("RIRProgram", uid1, "");

    // User A want cheating, join itself again
    await expect(contract.connect(addr1).joinProgram("RIRProgram", uid1, uid1)).to.be.reverted;
    // User B join
    await expect(contract.connect(addr2).joinProgram("RIRProgram", uid2, uid1)).to.not.be.reverted;
    // User B want cheating, create difference uid
    await expect(contract.connect(addr2).joinProgram("RIRProgram", uid3, uid1)).to.be.reverted;
  });

  it('Should withdraw an amount token in emergency', async function () {
    var contractBalance = await rirToken.balanceOf(contract.address);
    expect(contractBalance).to.equal(ethers.utils.parseUnits( "100" , 18 ));

    const tokenWithdraw = ethers.utils.parseUnits( "50" , 18 );

    await expect(contract.connect(addr2).emergencyWithdrawToken(tokenWithdraw)).to.be.reverted;

    await contract.connect(owner).emergencyWithdrawToken(rirToken.address, tokenWithdraw);

    contractBalance = await rirToken.balanceOf(contract.address);
    expect(contractBalance).to.equal(tokenWithdraw);

  });
});
