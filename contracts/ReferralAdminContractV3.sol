// SPDX-License-Identifier: MIT
pragma solidity 0.8.2;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";

interface ReferralSingleContractI {
    function setPause(string memory _programCode, bool _pause) external;
}

contract ReferralAdminContractV3 is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using SafeMathUpgradeable for uint256;


    // define event
    event ApproveIncentive(string _programCode);

    struct Program {
        string code;
        address tokenAddress;
        address referralAddress;
        uint256 incentiveLevel1;
        uint256 incentiveLevel2;
        uint256 incentiveLevel3;
        uint256 maxPerReferral;
        bool paused;
        uint256 tokenAllocation;
        uint256 tokenAmountIncentive;
        uint256 incentiveAmountHold;
    }

    mapping(address => bool) public admins;

    mapping(string => Program) public programs;

    mapping(string => mapping(address => uint256)) public incentiveHold; // program code => referrer address => incentive paid
    mapping(string => address[]) public holders; // program code => address holder

    mapping(string => mapping(address => uint256)) public incentivePaid; // program code => referrer address => incentive paid
    mapping(string => mapping(address => bool)) public denyUser; // program code => uid => true

    IERC20Upgradeable public token;

    // Upgrade v3
    mapping(address => mapping(address => uint256)) public claimableApproved; // token address => address user => amount
    mapping(address => uint256) public claimableAmount; // token address => amount
    mapping(address => uint256) public claimedAmount; // token address => amount
    mapping(address => uint256) public claimedCount; // token address => count
    mapping(string => uint256) public allowClaimValue; // program code => value require

    // define event
    event ClaimIncentive(string _programCode, uint256 _amount);

    function initialize() initializer public {
        __Ownable_init();

        // Grant the approval role to a specified account
        admins[owner()] = true;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() initializer {}

    function _authorizeUpgrade(address) internal override onlyOwner {}

    // Add new program
    function addProgram(string memory _programCode, address _tokenAddress, address _referralAddress) public onlyAdmin {

        require(programs[_programCode].tokenAddress == address(0) , "Program has already existed");
        programs[_programCode] = Program({
            code: _programCode,
            tokenAddress: _tokenAddress,
            referralAddress: _referralAddress,
            paused: false,
            incentiveLevel1: 2 * 10 ** 18 / 100,  // Default 0.02 token
            incentiveLevel2: 1 * 10 ** 18 / 100,  // Default 0.01 token
            incentiveLevel3: 1 * 10 ** 18 / 1000, // Default 0.001 token
            maxPerReferral: 2 * 10 ** 18, // Default 0.001 token
            tokenAllocation: 0,
            tokenAmountIncentive: 0,
            incentiveAmountHold: 0
        });

    }
    // Remove program
    /* function removeCampaign(string memory programCode) onlyOwner public {
        require(programs[programCode].tokenAddress != address(0) , "Program not found");
        delete programs[programCode];
    } */

    function setPause(string memory _programCode, bool _pause) public onlyAdmin {
        require(programs[_programCode].tokenAddress != address(0) , "Program not found");

        programs[_programCode].paused = _pause;

        Program memory program = programs[_programCode];
        ReferralSingleContractI referralContract = ReferralSingleContractI(program.referralAddress);
        referralContract.setPause(_programCode,_pause);

    }

    function updateProgram(string memory _programCode, address _tokenAddress, address _referralAddress, uint256 _amount1, uint256 _amount2, uint256 _amount3, uint256 _maxPerReferral, uint256 _tokenAllocation) public onlyAdmin {

        programs[_programCode].tokenAddress = _tokenAddress;
        programs[_programCode].referralAddress = _referralAddress;

        programs[_programCode].incentiveLevel1 = _amount1;
        programs[_programCode].incentiveLevel2 = _amount2;
        programs[_programCode].incentiveLevel3 = _amount3;
        programs[_programCode].maxPerReferral = _maxPerReferral;

        programs[_programCode].tokenAllocation = _tokenAllocation;
    }

    function version() virtual pure public returns (string memory) {
        return "v3";
    }

    function emergencyWithdrawToken(address _tokenAddress, uint256 _amount) public onlyOwner {
        token = IERC20Upgradeable(_tokenAddress);

        require(token.balanceOf(address(this)) >= _amount , "Amount exceeds");
        token.safeTransfer(owner(), _amount);
    }

    function setAdmin(address _adminAddress, bool _allow) public onlyOwner {
        admins[_adminAddress] = _allow;
    }

    // Approve pay all incentive in store
    function approveIncentive(string memory _programCode,address[] memory _addresses, uint[] memory _l1, uint[] memory _l2) public onlyAdmin {
        // Check that the calling account has the approval role
        require(programs[_programCode].tokenAddress != address(0) , "Program not found");
        Program memory program = programs[_programCode];

        require((program.tokenAmountIncentive <= program.tokenAllocation) , "Excess amount allocation");

        // Pay all incentive
        for (uint i=0; i < _addresses.length; i++) {
            address addr = _addresses[i];
            uint amount = program.incentiveLevel1*_l1[i] + program.incentiveLevel2*_l2[i];
            uint remainAmount;

            if (amount > program.maxPerReferral && program.maxPerReferral >= incentivePaid[_programCode][addr])
                remainAmount = program.maxPerReferral.sub(incentivePaid[_programCode][addr]);
            else if (amount < program.maxPerReferral && amount > incentivePaid[_programCode][addr])
                remainAmount = amount.sub(incentivePaid[_programCode][addr]);
            else remainAmount = 0;

            if (remainAmount > 0 && denyUser[_programCode][addr] == false) {
                if (program.tokenAmountIncentive < program.tokenAllocation) {

                    // Approve incentive
                    programs[_programCode].tokenAmountIncentive += remainAmount;
                    incentivePaid[_programCode][addr] += remainAmount;
                    claimableApproved[program.tokenAddress][addr] += remainAmount;
                    claimableAmount[program.tokenAddress] += remainAmount;
                }
            }
        }

        emit ApproveIncentive(_programCode);
    }

    // Set incentive from other contract
    function setIncentivePaid(string memory _programCode, address _addr, uint _amount) public onlyAdmin {
        // Check that the calling account has the approval role
        require(programs[_programCode].tokenAddress != address(0) , "Program not found");

        incentivePaid[_programCode][_addr] = _amount;
    }
    // Ban address
    function denyAddress(string memory _programCode, address _addr) public onlyAdmin {
        // Check that the calling account has the approval role
        require(programs[_programCode].tokenAddress != address(0) , "Program not found");

        // Remove incentive
        denyUser[_programCode][_addr] = true;
        incentiveHold[_programCode][_addr] = 0;
    }
    // Un-ban address
    function acceptAddress(string memory _programCode, address _addr) public onlyAdmin {
        // Check that the calling account has the approval role
        require(programs[_programCode].tokenAddress != address(0) , "Program not found");

        // Remove incentive
        denyUser[_programCode][_addr] = false;
    }

    // Get info program
    /* function getReferralInfo(string memory _programCode) public view returns (ReferralSingleContractI.Program memory info) {
        require(programs[_programCode].referralAddress != address(0) , "Program not found");

        Program memory program = programs[_programCode];
        ReferralSingleContractI referralContract = ReferralSingleContractI(program.referralAddress);

        info = referralContract.getProgram(_programCode);
        return info;
    } */
    function getTotalHolders(string memory _programCode) public view returns(uint) {
        return holders[_programCode].length;
    }

    modifier onlyAdmin() {
        require( (owner()==msg.sender || admins[msg.sender])== true, "Caller is not an approved user");
        _;
    }


    // V3
    // Set incentive paid from old version
    function setAmountIncentive(string memory _programCode, uint _amount) public onlyAdmin {
        // Check that the calling account has the approval role
        require(programs[_programCode].tokenAddress != address(0) , "Program not found");

        programs[_programCode].tokenAmountIncentive = _amount;
    }

    function updateLimitClaim(string memory _programCode, uint256 _amount) public onlyAdmin {
        require(programs[_programCode].tokenAddress != address(0) , "Program not found");
        allowClaimValue[_programCode] = _amount;
    }

    function claim(string memory _programCode) external {

        require(programs[_programCode].tokenAddress != address(0) , "Program not found");
        Program memory program = programs[_programCode];
        uint256 claimAmount = claimableApproved[program.tokenAddress][msg.sender];
        require( claimAmount > 0 , "Claimable not found");

        require( claimAmount >= allowClaimValue[_programCode] , "Not enough amount");

        token = IERC20Upgradeable(program.tokenAddress);

        require(token.balanceOf(address(this)) >= claimAmount, "Not enough token");
        require(programs[_programCode].tokenAllocation > claimedAmount[program.tokenAddress], "Over allocation token");

        require(
            token.transfer(msg.sender, claimAmount),
            "ERC20 transfer failed - claim token"
        );

        claimableApproved[program.tokenAddress][msg.sender] = 0;

        claimableAmount[program.tokenAddress] -= claimAmount;
        claimedAmount[program.tokenAddress] += claimAmount;
        claimedCount[program.tokenAddress] += 1;

        emit ClaimIncentive(_programCode, claimAmount);

    }
}
