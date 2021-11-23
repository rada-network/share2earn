// SPDX-License-Identifier: MIT
pragma solidity 0.8.2;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "./ReferralSingleContract.sol";

contract ReferralAdminContract is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    // define event
    event ApproveAllIncentive(string _programCode);

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

        require(programs[_programCode].tokenAddress == address(0) , "Program is existing");
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

        Program memory program = programs[_programCode];

        ReferralSingleContract referralContract = ReferralSingleContract(program.referralAddress);

        programs[_programCode].paused = _pause;
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
        return "v1";
    }

    function emergencyWithdrawToken(address _tokenAddress, uint256 _amount) public onlyOwner {
        token = IERC20Upgradeable(_tokenAddress);

        require(token.balanceOf(address(this)) >= _amount , "Amount exceeds");
        token.safeTransfer(owner(), _amount);
    }

    function setAdmin(address _adminAddress, bool _allow) public onlyOwner {
        admins[_adminAddress] = _allow;
    }

    function calculateIncentive(string memory _programCode) public onlyAdmin {
        require(programs[_programCode].tokenAddress != address(0) , "Program not found");
        Program memory program = programs[_programCode];



        require(((program.tokenAmountIncentive+program.incentiveAmountHold) <= program.tokenAllocation) , "Excess amount allocation");

        ReferralSingleContract referralContract = ReferralSingleContract(program.referralAddress);

        // Get list joiner have incentive
        address[] memory joinersAddress = referralContract.getJoinersAddress(_programCode);

        for(uint i=0; i < joinersAddress.length; i++){
            address joinerAddr = joinersAddress[i];
            uint totalLevel1 = referralContract.getTotalRefereesL1(_programCode,joinerAddr);
            uint totalLevel2 = referralContract.getTotalRefereesL2(_programCode,joinerAddr);

            if (totalLevel1 > 0) {
                uint amountIncentiveLevel1 = program.incentiveLevel1 * totalLevel1;
                uint amountIncentiveLevel2 = program.incentiveLevel2 * totalLevel2;
                uint rewardIncentive = amountIncentiveLevel1+amountIncentiveLevel2;
                if (denyUser[_programCode][joinerAddr] == false) {

                    int remainReward = int(program.maxPerReferral - incentivePaid[_programCode][joinerAddr]);
                    int remainAmount = int(rewardIncentive - incentivePaid[_programCode][joinerAddr]);
                    if (remainAmount > remainReward)
                        remainAmount = remainReward;

                    if (remainAmount>0){
                        uint amount = uint(remainAmount);

                        incentiveHold[_programCode][joinerAddr] = amount;
                        holders[_programCode].push(joinerAddr);
                        program.incentiveAmountHold += amount;
                    }
                }
            }
        }

    }
    // Approve pay all incentive in store
    function approveAllIncentive(string memory _programCode) public onlyAdmin {
        // Check that the calling account has the approval role
        require(programs[_programCode].tokenAddress != address(0) , "Program not found");
        Program memory program = programs[_programCode];

        require((program.tokenAmountIncentive <= program.tokenAllocation) , "Excess amount allocation");


        address tokenAddress = program.tokenAddress;
        token = IERC20Upgradeable(tokenAddress);

        // Pay all incentive
        for (uint i=0; i<holders[_programCode].length; i++) {
            address referrerAddress = holders[_programCode][i];
            uint256 amount = incentiveHold[_programCode][referrerAddress];
            if (amount > 0 && denyUser[_programCode][referrerAddress] == false) {
                if (program.tokenAmountIncentive <= program.tokenAllocation) {
                    // Transfer token
                    token.safeTransfer(referrerAddress, amount);
                    programs[_programCode].tokenAmountIncentive += amount;
                    incentivePaid[_programCode][referrerAddress] += amount;

                    // Empty hold incentive
                    incentiveHold[_programCode][referrerAddress] = 0;
                }
            } else {
                incentiveHold[_programCode][referrerAddress] = 0;
            }
        }
        programs[_programCode].incentiveAmountHold = 0;
        delete holders[_programCode];

        emit ApproveAllIncentive(_programCode);
    }
    // Remove incentive from holder
    function denyAddress(string memory _programCode, address _addr) public onlyAdmin {
        // Check that the calling account has the approval role
        require(programs[_programCode].tokenAddress != address(0) , "Program not found");

        // Remove incentive
        denyUser[_programCode][_addr] = true;
        incentiveHold[_programCode][_addr] = 0;
    }
    function acceptAddress(string memory _programCode, address _addr) public onlyAdmin {
        // Check that the calling account has the approval role
        require(programs[_programCode].tokenAddress != address(0) , "Program not found");

        // Remove incentive
        denyUser[_programCode][_addr] = false;
    }
    /* function getIncentiveHoldersCount(string memory _programCode) public view returns(uint) {
        return holdReferrer[_programCode].length;
    } */

    /* function getIncentiveHolders(string memory _programCode) public view returns(string[] memory) {
        return holdReferrer[_programCode];
    } */
    /* function getJoiners(string memory _programCode) public view returns(string[] memory) {
        return refereesProgram[_programCode];
    } */
    /* function getJoinerReferees(string memory _programCode, string memory _uid) public view returns(string[] memory) {
        return userReferees[_programCode][_uid];
    } */
    /* function getTotalJoiner(string memory _programCode) public view returns(uint) {
        return refereesProgram[_programCode].length;
    } */


    // Get info program
    function getReferralInfo(string memory _programCode) public view returns (ReferralSingleContract.Program memory info) {
        require(programs[_programCode].referralAddress != address(0) , "Program not found");

        Program memory program = programs[_programCode];
        ReferralSingleContract referralContract = ReferralSingleContract(program.referralAddress);

        info = referralContract.getProgram(_programCode);
        return info;
    }
    function getTotalHolders(string memory _programCode) public view returns(uint) {
        return holders[_programCode].length;
    }

    modifier onlyAdmin() {
        require( (owner()==msg.sender || admins[msg.sender]  )== true, "Caller is not a approval user");
        _;
    }

}
