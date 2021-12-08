// We import Chai to use its asserting functions here.
const { expect } = require("chai");
const { ethers, upgrades } = require('hardhat');

describe("Test Contract", function () {


  beforeEach(async function () {

    [owner, addr1, addr2, addr3, addr4, addr5, addr6, ...addrs] = await ethers.getSigners();

    // Get the ContractFactory and Signers here.
    const TestMathContract = await ethers.getContractFactory("TestMathContract");

    // Add program to Referral Contract
    testContract = await upgrades.deployProxy(TestMathContract, { kind: 'uups' });

  });

  it('Deploy v1 and should set right owner', async function () {
    expect(await testContract.subMath(20,10)).to.equal(10);
  });


});
