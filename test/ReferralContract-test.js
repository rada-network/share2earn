// We import Chai to use its asserting functions here.
const { expect } = require("chai");
const { ethers, upgrades } = require('hardhat');

describe("Referral contract", function () {

  let ReferralContract;
  let ValidUserContract;
  let validUserContract;
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
    ValidUserContract = await ethers.getContractFactory("ValidUserContract");

    // ContractV2 = await ethers.getContractFactory("ReferralContractV2");
    // ContractV3 = await ethers.getContractFactory("ReferralContractV3");

    [owner, addr1, addr2, addr3, addr4, addr5, ...addrs] = await ethers.getSigners();

    validUserContract = await upgrades.deployProxy(ValidUserContract, { kind: 'uups' });
    rirToken = await RIRToken.deploy();
    meoToken = await MEOToken.deploy();

    contract = await upgrades.deployProxy(ReferralContract, [validUserContract.address], { kind: 'uups' });
    await rirToken.transfer(contract.address, ethers.utils.parseUnits( "100" , 18 ));
    await meoToken.transfer(contract.address, ethers.utils.parseUnits( "100" , 18 ));

    // Set Valid User
    // Set user 1
    const uid1 = "123123";
    await validUserContract.setUser(addr1.address,uid1);
    // Set user 2
    const uid2 = "456456";
    await validUserContract.setUser(addr2.address,uid2);

    const uid3 = "789789";
    await validUserContract.setUser(addr3.address,uid3);
  });

  it('Deploy v1 and should set right owner', async function () {
    expect(await contract.admin()).to.equal(owner.address);
  });
  /* it('Upgrade v2', async function () {
    const contract = await upgrades.deployProxy(ReferralContract, [validUserContract.address], { kind: 'uups' });
    const contractV2 = await upgrades.upgradeProxy(contract, ContractV2);
    expect(await contractV2.version()).to.equal("v2");
  }); */

  it('Should RIRToken have balance 100 token', async function () {
    const contractBalance = await rirToken.balanceOf(contract.address);
    expect(contractBalance).to.equal(ethers.utils.parseUnits( "100" , 18 ));
  });

  it('Should add valid user and get uid', async function () {

    await validUserContract.setUser(addr4.address,"555555");

    await expect(await contract.getUserUid(addr4.address)).to.equal("555555");
  });

  it('Should add new program', async function () {

    await contract.addProgram("RIRProgram", rirToken.address);

    await expect(await contract.programs("RIRProgram")).to.equal(rirToken.address);
  });

  it('Should add 2 programs and let one user join both', async function () {

    await contract.addProgram("RIRProgram", rirToken.address);
    await contract.addProgram("MEOProgram", meoToken.address);

    await expect(await contract.programs("RIRProgram")).to.equal(rirToken.address);
    await expect(await contract.programs("MEOProgram")).to.equal(meoToken.address);

    // Valid
    let uid = "";
    await expect(contract.connect(addr1).joinProgram("RIRProgram", uid)).to.not.be.reverted;

    // Valid
    uid = "123123";
    await expect(contract.connect(addr2).joinProgram("RIRProgram", uid)).to.not.be.reverted;

    // valid
    uid = "123123";
    await expect(contract.connect(addr2).joinProgram("MEOProgram", uid)).to.not.be.reverted;

    // Check balance incentive of user A
    expect(await meoToken.balanceOf(addr1.address)).to.equal(ethers.utils.parseUnits( "0.02" , 18 )); // 0.02 MEO

    // should un-valid, because addr1 not joined MEO program
    uid = "123123";
    await expect(await contract.uidJoined("MEOProgram",uid)).to.equal(false);

  });

  it('Should let a user cannot join new program with this user\s uid', async function () {

    const uid = "123123";

    // Add program
    await contract.addProgram("RIRProgram", rirToken.address);

    await expect(contract.connect(addr4).joinProgram("RIRProgram", uid)).to.be.reverted;

  });

  it('Should let a user join new program with referral code and check duplicate', async function () {

    // Set user 1
    const uid1 = "123123";
    // Set user 2
    const uid2 = "456456";
    // This uid not valid
    const uid4 = "789789";


    // Add program
    await contract.addProgram("RIRProgram", rirToken.address);
    // Join with uid1 (no referral code)
    await contract.connect(addr1).joinProgram("RIRProgram", "");
    // Join with uid2 (with uid1)
    await contract.connect(addr2).joinProgram("RIRProgram", uid1);

    // Join with uid4 (with uid1)
    await expect(contract.connect(addr4).joinProgram("RIRProgram", uid1)).to.be.reverted;

    // Try join again with same address and uid1
    await expect(contract.connect(addr2).joinProgram("RIRProgram", uid1)).to.be.reverted;


    await expect(await contract.uidJoined("RIRProgram",uid1)).to.equal(true);
    await expect(await contract.uidJoined("RIRProgram",uid2)).to.equal(true);
    await expect(await contract.uidJoined("RIRProgram",uid4)).to.equal(false);

  });

  it('Should join program successfully with referral code and got incentive | 1 level', async function () {

    // Add program
    await contract.addProgram("RIRProgram", rirToken.address);

    // User A join program and got referral code
    await contract.connect(addr1).joinProgram("RIRProgram", "");
    const referralCode = await contract.getUserUid(addr1.address);

    // User B join program with referral code of user A
    await contract.connect(addr2).joinProgram("RIRProgram", referralCode);
    const uid2 = await contract.getUserUid(addr2.address);
    // User C join program with referral code of user A
    await contract.connect(addr3).joinProgram("RIRProgram", referralCode);
    const uid3 = await contract.getUserUid(addr3.address);

    // Refer successfully
    expect(await contract.uidJoined("RIRProgram",referralCode)).to.equal(true);
    expect(await contract.uidJoined("RIRProgram",uid2)).to.equal(true);
    expect(await contract.uidJoined("RIRProgram",uid3)).to.equal(true);

    // Check balance incentive of user A
    expect(await rirToken.balanceOf(addr1.address)).to.equal(ethers.utils.parseUnits( "0.04" , 18 )); // 0.04 RIR

  });

  it('Should join program successfully with referral code and got incentive | 2 level', async function () {

    // Add program
    await contract.addProgram("RIRProgram", rirToken.address);

    // User A join program and got referral code
    await contract.connect(addr1).joinProgram("RIRProgram","");
    const referralCode = await contract.getUserUid(addr1.address);

    // User B join program with referral code of user A
    await contract.connect(addr2).joinProgram("RIRProgram", referralCode);
    const referralCodeUserB = await contract.getUserUid(addr2.address);

    // User C join program with referral code of user B
    await contract.connect(addr3).joinProgram("RIRProgram",referralCodeUserB);

    // Refer successfully
    expect(await contract.rUserFromUser("RIRProgram",addr2.address)).to.equal(addr1.address);
    // expect(await contract.rUserFromUser("RIRProgram",addr3.address)).to.equal(addr2.address);

    // Check balance incentive of user A
    expect(await rirToken.balanceOf(addr1.address)).to.equal(ethers.utils.parseUnits( "0.03" , 18 )); // 0.03 RIR
    // Check balance incentive of user B
    expect(await rirToken.balanceOf(addr2.address)).to.equal(ethers.utils.parseUnits( "0.02" , 18 )); // 0.02 RIR

  });

  it('Should join program successfully with referral code and got incentive | 3 level', async function () {
    // Add program
    await contract.addProgram("RIRProgram", rirToken.address);

    // Set user
    const uid4 = "666666";
    await validUserContract.setUser(addr4.address,uid4);
    const uid5 = "777777";
    await validUserContract.setUser(addr5.address,uid5);

    // User A join program and got referral code
    await contract.connect(addr1).joinProgram("RIRProgram","");
    const referralCode = await contract.getUserUid(addr1.address);

    // User B join program with referral code of user A
    await contract.connect(addr2).joinProgram("RIRProgram",referralCode);
    const referralCodeUserB = await contract.getUserUid(addr2.address);
    // User A got 0.02
    // User B got 0

    // User C join program with referral code of user B
    await contract.connect(addr3).joinProgram("RIRProgram",referralCodeUserB);
    const referralCodeUserC = await contract.getUserUid(addr3.address);
    // User A got 0.01 => 0.03
    // User B got 0.02

    // User D join program with referral code of user C
    await contract.connect(addr4).joinProgram("RIRProgram", referralCodeUserC);
    // User E join program with referral code of user C
    await contract.connect(addr5).joinProgram("RIRProgram", referralCodeUserC);
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

  /* it('Should transfer back token from Referral Contract', async function () {

    await contract.addProgram("RIRProgram", rirToken.address);
    await rirToken.transferFrom(contract.address, owner.address, ethers.utils.parseUnits( "50" , 18 ));

    const contractBalance = await rirToken.balanceOf(contract.address);
    expect(contractBalance).to.equal(ethers.utils.parseUnits( "50" , 18 ));
  }); */

  it('Should transfer back token from Referral Contract', async function () {

    await contract.transferBack(rirToken.address, ethers.utils.parseUnits( "50" , 18 ));

    const contractBalance = await rirToken.balanceOf(contract.address);
    expect(contractBalance).to.equal(ethers.utils.parseUnits( "50" , 18 ));
  });

});