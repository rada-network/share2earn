// SPDX-License-Identifier: MIT
pragma solidity 0.8.2;

// import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
// import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
// import "@openzeppelin/contracts/access/Ownable.sol";

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";

interface ReferralSingleContractI {
    /* struct Program {
        string code;
        bool paused;
        uint256 startTime;
        uint256 endTime;
    } */

    function setPause(string memory _programCode, bool _pause) external;
    /* function getJoinersAddress(string memory _programCode) external view returns(address[] memory);
    function getTotalRefereesL1(string memory _programCode, address _address) external view returns(uint);
    function getTotalRefereesL2(string memory _programCode, address _address) external view returns(uint);
    function getProgram(string memory _programCode) external view returns(Program memory); */
}

contract ReferralAdminContractV2 is Initializable, UUPSUpgradeable, OwnableUpgradeable {
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
        return "v2";
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
    function approveIncentive(string memory _programCode,address[] memory _addresses, uint[] memory _amountList) public onlyAdmin {
        // Check that the calling account has the approval role
        require(programs[_programCode].tokenAddress != address(0) , "Program not found");
        Program memory program = programs[_programCode];

        require((program.tokenAmountIncentive <= program.tokenAllocation) , "Excess amount allocation");

        token = IERC20Upgradeable(program.tokenAddress);
        uint totalAmount = 0;
        for (uint i=0; i < _addresses.length; i++) {
            totalAmount = totalAmount + _amountList[i];
        }
        require(token.balanceOf(address(this)) >= totalAmount , "Contract out of token");



        // Pay all incentive
        for (uint i=0; i < _addresses.length; i++) {
            address addr = _addresses[i];
            uint remainAmount = _amountList[i];
            if (remainAmount > program.maxPerReferral)
                remainAmount = 0;

            if (remainAmount > 0 && denyUser[_programCode][addr] == false) {
                if (program.tokenAmountIncentive <= program.tokenAllocation) {
                    // Transfer token
                    token.safeTransfer(addr, remainAmount);
                    programs[_programCode].tokenAmountIncentive += remainAmount;
                    incentivePaid[_programCode][addr] += remainAmount;
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

}
