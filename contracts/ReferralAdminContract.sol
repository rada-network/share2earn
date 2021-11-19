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

    struct Program {
        string code;
        address tokenAddress;
        address referralAddress;
        uint256 incentiveL0;
        uint256 incentiveL1;
        uint256 incentiveL2;
        bool paused;
        uint256 tokenAllocation;
        uint256 tokenIncentive;
        uint256 incentiveHold;
    }

    mapping(address => bool) public admins;

    mapping(string => Program) public programs;

    // Program
    // mapping(string => mapping(string => address)) public uidJoined; // program code => uid => sender address
    // mapping(string => mapping(address => address)) public rUserFromReferer; // program code => sender address => referrer address
    // mapping(string => mapping(string => string[])) public userReferees; // program code => uid => uid joiner[]
    // mapping(string => string[]) public refereesProgram; // programCode => uid joined

    mapping(string => mapping(address => uint256)) public incentiveHold; // program code => referrer address => incentive paid
    mapping(string => address[]) public holders; // program code => address holder


    mapping(string => mapping(address => uint256)) public incentivePaid; // program code => referrer address => incentive paid
    mapping(string => mapping(address => bool)) public denyUser; // program code => uid => true

    // Check
    // mapping(string => address) public userJoined; // uid => user address
    // mapping(address => string) public addressJoined; // user address => uid

    // Approve
    // mapping(string => string[]) public paidReferrer; // program code => uid referrer have incentive hold
    // mapping(string => mapping(string => uint256)) public paidIncentive; // program code => referrer uid => incentive hold

    IERC20Upgradeable public token;

    function initialize() initializer public {
        __Ownable_init();

        // Grant the approval role to a specified account
        // admins[owner()] = true;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() initializer {}

    function _authorizeUpgrade(address) internal override onlyOwner {}

    // Add new program
    function addProgram(string memory _programCode, address _tokenAddress, address _referralAddress) public onlyAdmin {
        // require(admins[msg.sender] == true, "Caller is not a approval user");
        require(programs[_programCode].tokenAddress == address(0) , "Program is existing");
        programs[_programCode] = Program({
            code: _programCode,
            tokenAddress: _tokenAddress,
            referralAddress: _referralAddress,
            paused: false,
            incentiveL0: 2 * 10 ** 18 / 100,  // Default 0.02 token
            incentiveL1: 1 * 10 ** 18 / 100,  // Default 0.01 token
            incentiveL2: 1 * 10 ** 18 / 1000, // Default 0.001 token
            tokenAllocation: 0,
            tokenIncentive: 0,
            incentiveHold: 0
        });

    }
    // Remove program
    /* function removeCampaign(string memory programCode) onlyOwner public {
        require(programs[programCode].tokenAddress != address(0) , "Program not found");
        delete programs[programCode];
    } */

    function setPause(string memory _programCode, bool _pause) public onlyAdmin {
        // require(admins[msg.sender] == true, "Caller is not a approval user");
        programs[_programCode].paused = _pause;
    }

    function updateProgram(string memory _programCode, address _tokenAddress, address _referralAddress, uint256 _amount1, uint256 _amount2, uint256 _amount3 , uint256 _tokenAllocation) public onlyAdmin {
        // require(admins[msg.sender] == true, "Caller is not a approval user");
        programs[_programCode].tokenAddress = _tokenAddress;
        programs[_programCode].referralAddress = _referralAddress;

        programs[_programCode].incentiveL0 = _amount1;
        programs[_programCode].incentiveL1 = _amount2;
        programs[_programCode].incentiveL2 = _amount3;

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

        address tokenAddress = program.tokenAddress;
        token = IERC20Upgradeable(tokenAddress);

        ReferralSingleContract referralContract = ReferralSingleContract(program.referralAddress);

        // Get list joiner have incentive
        address[] memory joinersAddress = referralContract.getJoinersAddress(_programCode);

        for(uint i=0; i < joinersAddress.length; i++){
            address joinerAddr = joinersAddress[i];
            address[] memory referres = referralContract.getJoinerRefereesAddress(_programCode,joinerAddr);
            if (referres.length > 0) {
                uint amountIncentive = program.incentiveL0*referres.length;
                if ((amountIncentive - incentivePaid[_programCode][joinerAddr])>=0){
                    incentiveHold[_programCode][joinerAddr] = amountIncentive - incentivePaid[_programCode][joinerAddr];
                    holders[_programCode].push(joinerAddr);
                }
            }
        }

    }
    // Approve pay all incentive in store
    function approveAllIncentive(string memory _programCode) public onlyAdmin {
        // Check that the calling account has the approval role
        require(programs[_programCode].tokenAddress != address(0) , "Program not found");
        Program memory program = programs[_programCode];

        address tokenAddress = program.tokenAddress;
        token = IERC20Upgradeable(tokenAddress);

        // Pay all incentive
        for (uint i=0; i<holders[_programCode].length; i++) {
            address referrerAddress = holders[_programCode][i];
            uint256 amount = incentiveHold[_programCode][referrerAddress];
            if (amount > 0 && denyUser[_programCode][referrerAddress] == false) {
                // Transfer token
                token.transfer(referrerAddress, amount);
                programs[_programCode].tokenIncentive += amount;
                incentivePaid[_programCode][referrerAddress] += amount;

                // Empty hold incentive
                incentiveHold[_programCode][referrerAddress] = 0;
            }
        }
        programs[_programCode].incentiveHold = 0;
    }
    // Remove incentive from holder
    function denyAddress(string memory _programCode, address _addr) public onlyAdmin {
        // Check that the calling account has the approval role
        // require(admins[msg.sender] == true, "Caller is not a approval user");
        require(programs[_programCode].tokenAddress != address(0) , "Program not found");

        // Remove incentive
        denyUser[_programCode][_addr] = true;
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
    // TODO: set private
    /* function getJoiners(string memory _programCode) public view returns (string[] memory joiners) {
        require(programs[_programCode].referralAddress != address(0) , "Program not found");

        Program memory program = programs[_programCode];
        ReferralSingleContract referralContract = ReferralSingleContract(program.referralAddress);
        joiners = referralContract.getJoiners(_programCode);
        return joiners;
    } */
    // TODO: set private
    /* function getJoinerReferees(string memory _programCode, string memory _uid) public view returns (string[] memory referees) {
        require(programs[_programCode].referralAddress != address(0) , "Program not found");

        Program memory program = programs[_programCode];
        ReferralSingleContract referralContract = ReferralSingleContract(program.referralAddress);
        referees = referralContract.getJoinerReferees(_programCode, _uid);
        return referees;
    } */
    // TODO: set private
    /* function getJoinersHaveIncentive(string memory _programCode) public view returns (string[] memory joiners) {
        require(programs[_programCode].referralAddress != address(0) , "Program not found");

        Program memory program = programs[_programCode];
        ReferralSingleContract referralContract = ReferralSingleContract(program.referralAddress);
        joiners = referralContract.getJoiners(_programCode);

        string[] memory joinerHaveIncentive;
        for(uint i=0; i<joiners.length; i++){
            joinerHaveIncentive.push(joiners[i]);
        }

        return joinerHaveIncentive;
    } */


    modifier onlyAdmin() {
        require( (owner()==msg.sender || admins[msg.sender]  )== true, "Caller is not a approval user");
        _;
    }

}
