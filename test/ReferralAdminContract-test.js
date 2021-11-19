// We import Chai to use its asserting functions here.
const { expect } = require("chai");
const { ethers, upgrades } = require('hardhat');

describe("Referral Admin Contract", function () {

  let contractAdmin;
  let programCode;

  let rirToken;
  let meoToken;

  beforeEach(async function () {

    [owner, addr1, addr2, addr3, addr4, addr5, ...addrs] = await ethers.getSigners();

    // Get the ContractFactory and Signers here.
    const RIRToken = await ethers.getContractFactory("RIRToken");
    const MEOToken = await ethers.getContractFactory("MEOToken");
    const ReferralAdminContract = await ethers.getContractFactory("ReferralAdminContract");
    const ReferralSingleContract = await ethers.getContractFactory("ReferralSingleContract");

    rirToken = await RIRToken.deploy();
    meoToken = await MEOToken.deploy();

    // Add default program
    programCode =  "PGX";
    const startTime = Math.floor(Date.now() / 1000) - 10000;
    const endTime = Math.floor(Date.now() / 1000) + 10 * 86400;
    // const tokenAllocation = ethers.utils.parseUnits( "10" , 18 );
    // const incentiveRate = ethers.utils.parseUnits( "0.02" , 18 );

    // Add program to Referral Contract
    contractSingle = await ReferralSingleContract.deploy();
    // Set addr4 is Admin
    await contractSingle.setAdmin(addr4.address, true);
    await contractSingle.addProgram(programCode, startTime, endTime);


    contractAdmin = await upgrades.deployProxy(ReferralAdminContract, { kind: 'uups' });
    await rirToken.transfer(contractAdmin.address, ethers.utils.parseUnits( "100" , 18 ));
    await meoToken.transfer(contractAdmin.address, ethers.utils.parseUnits( "100" , 18 ));

    // Set addr4 is Admin
    await contractAdmin.setAdmin(addr4.address, true);

    // Add default program
    await contractAdmin.addProgram(programCode, rirToken.address, contractSingle.address);

    await contractAdmin.updateProgram(programCode,
      rirToken.address,
      contractSingle.address,
      ethers.utils.parseUnits( "0.02" , 18),
      ethers.utils.parseUnits( "0.01" , 18),
      ethers.utils.parseUnits( "0.001" , 18),
      ethers.utils.parseUnits( "10" , 18));


    // Join Program
    // Set user 1
    const uid1 = "123123";
    const uid2 = "456456";
    const uid3 = "789789";
    const uid4 = "7893aa";

    await contractSingle.connect(addr1).joinProgram(programCode, uid1, "");
    await contractSingle.connect(addr2).joinProgram(programCode, uid2 , uid1);
    await contractSingle.connect(addr3).joinProgram(programCode, uid3 , uid1);
    await contractSingle.connect(addr4).joinProgram(programCode, uid4 , uid2);

  });


  it('Deploy v1 and should set right owner', async function () {
    expect(await contractAdmin.admins(addr4.address)).to.equal(true);
  });

  /* it('Should get information of program', async function () {
    const program = await contractSingle.getProgram(programCode);
    console.log(program)
  }); */

  //
  it('Should calculate right incentive', async function () {

    await expect(contract.connect(addr2).calculateIncentive(programCode)).to.be.reverted;

    // await contractAdmin.connect(addr4).admins()

  });
  // Should pay hold incentive and join more user and pay hold incentive again
  // Should not pay hold incentive if over allocation
  // Should pause a program
  // Should update program like incentive, allocation
  // Should deny an incentive

});
