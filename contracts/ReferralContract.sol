// SPDX-License-Identifier: MIT
// pragma solidity >=0.8.0 <=0.8.4;
pragma solidity 0.8.2;

// import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
// import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract ReferralContract is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    struct Program {
        string code;
        address tokenAddress;
        uint256 incentiveL0;
        uint256 incentiveL1;
        uint256 incentiveL2;
        bool paused;
    }

    mapping(address => bool) public admins;

    mapping(string => Program) public programs;

    // Config users
    mapping(string => mapping(string => address)) public uidJoined; // program code => uid => sender address
    mapping(string => mapping(address => address)) public rUserFromReferer; // program code => sender address => referrer address
    mapping(string => mapping(address => address[])) public userReferees; // program code => referrer address  => user address[]
    mapping(string => address) public userJoined; // uid => user address
    mapping(address => string) public addressJoined; // user address => uid

    mapping(string => string[]) public holdReferrer; // programCode => uid referrer have incentive hold
    mapping(string => mapping(string => uint256)) public incentiveHold; // programCode => referrer uid => incentive hold

    IERC20Upgradeable public token;

    function initialize() initializer public {
        __Ownable_init();

        // Grant the approval role to a specified account
        admins[owner()] = true;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() initializer {}

    function _authorizeUpgrade(address) internal override onlyOwner {}

    // referrerCode is uid
    function joinProgram(string memory _programCode, string memory _uid, string memory _referrerCode) public {

        require(programs[_programCode].paused == false , "Program is pausing");
        require(programs[_programCode].tokenAddress != address(0) , "Program not found");

        bytes memory haveReferralCode = bytes(_referrerCode);
        if (haveReferralCode.length > 0) {
            require(keccak256(bytes(_uid)) != keccak256(bytes(_referrerCode)), "Cannot join yourself");
            require(userJoined[_referrerCode] != address(0), "Wrong referrer code");
        }

        require(uidJoined[_programCode][_uid] == address(0) , "User joined");

        // Validate, check this address joined but uid not the same
        if (rUserFromReferer[_programCode][msg.sender] != address(0)) {
            require(keccak256(bytes(_uid)) == keccak256(bytes(addressJoined[msg.sender])) , "This uid used other address");
        }
        // Claim reward to Referral
        if (haveReferralCode.length > 0) {
            // Owner of referrer code
            address referrerAddress = userJoined[_referrerCode];

            bool allowIncentive = true;

            // if referrer owner already got incentive from this sender then return
            if (rUserFromReferer[_programCode][msg.sender] != address(0)) {
                allowIncentive = false;
            }

            if (allowIncentive) {
                address tokenAddress = programs[_programCode].tokenAddress;
                token = IERC20Upgradeable(tokenAddress);
                // Assign new address to ReferralUser
                rUserFromReferer[_programCode][msg.sender] = referrerAddress;
                // User follow
                userReferees[_programCode][referrerAddress].push(msg.sender);

                // Pay for level up 1
                // Hold incentive
                if (incentiveHold[_programCode][_referrerCode]==0) {
                    holdReferrer[_programCode].push(_referrerCode);
                }
                incentiveHold[_programCode][_referrerCode] += programs[_programCode].incentiveL0;
                //token.transfer(referrerAddress, programs[_programCode].incentiveL0);

                // Check Level 1 up
                address userL0 = rUserFromReferer[_programCode][referrerAddress];
                if (userL0 != address(0)) {
                    // Pay for level up 2
                    // Hold incentive
                    if (incentiveHold[_programCode][addressJoined[userL0]]==0) {
                        holdReferrer[_programCode].push(addressJoined[userL0]);
                    }
                    incentiveHold[_programCode][addressJoined[userL0]] += programs[_programCode].incentiveL1;

                    // token.transfer(userL0, programs[_programCode].incentiveL1);

                    // Level 2 up
                    address userL1 = rUserFromReferer[_programCode][userL0];
                    if (userL1 != address(0)) {
                        // Pay for level up 3
                        // Hold incentive
                        if (incentiveHold[_programCode][addressJoined[userL1]]==0) {
                            holdReferrer[_programCode].push(addressJoined[userL1]);
                        }
                        incentiveHold[_programCode][addressJoined[userL1]] += programs[_programCode].incentiveL2;

                        // token.transfer(userL1, programs[_programCode].incentiveL2);
                    }
                }


            }
        }
        // add user to program
        uidJoined[_programCode][_uid] = msg.sender;
        userJoined[_uid] = msg.sender;
        addressJoined[msg.sender] = _uid;
    }

    // Add new program
    function addProgram(string memory _programCode, address _tokenAddress) public {
        require(admins[msg.sender] == true, "Caller is not a approval user");
        require(programs[_programCode].tokenAddress == address(0) , "Program is existing");
        programs[_programCode] = Program({
            code: _programCode,
            tokenAddress: _tokenAddress,
            paused: false,
            incentiveL0: 2 * 10 ** 18 / 100,  // Default 0.02 token
            incentiveL1: 1 * 10 ** 18 / 100,  // Default 0.01 token
            incentiveL2: 1 * 10 ** 18 / 1000 // Default 0.001 token
        });

    }
    // Remove program
    /* function removeCampaign(string memory programCode) onlyOwner public {
        require(programs[programCode].tokenAddress != address(0) , "Program not found");
        delete programs[programCode];
    } */

    function setPause(string memory _programCode, bool _pause) public {
        require(admins[msg.sender] == true, "Caller is not a approval user");
        programs[_programCode].paused = _pause;
    }

    function setIncentiveAmount(string memory _programCode, uint256 _amount1, uint256 _amount2, uint256 _amount3) public {
        require(admins[msg.sender] == true, "Caller is not a approval user");
        programs[_programCode].incentiveL0 = _amount1;
        programs[_programCode].incentiveL1 = _amount2;
        programs[_programCode].incentiveL2 = _amount3;
    }

    function version() virtual pure public returns (string memory) {
        return "v1";
    }

    /* function checkJoined(string memory programCode, address userAddress) public view returns (bool) {
        return rUserFromReferer[programCode][userAddress] != address(0);
    } */
    /* function getInfoProgram(string memory programCode) public view returns (string memory code, address tokenAddress, uint256 incentiveL0, uint256 incentiveL1, uint256 incentiveL2, bool paused) {
        Program memory p = programs[programCode];
        return (p.code, p.tokenAddress, p.incentiveL0, p.incentiveL1, p.incentiveL2, p.paused);
    } */
    /* function leaveProgram(string memory programCode) public {
        string memory uid = addressJoined[msg.sender];
        require(uidJoined[programCode][uid] != address(0) , "Account not found");
        uidJoined[programCode][uid] = address(0);
    } */
    function removeJoinProgram(string memory _programCode, string memory _uid) public {
        require(admins[msg.sender] == true, "Caller is not a approval user");
        require(uidJoined[_programCode][_uid] != address(0) , "Account not found");
        uidJoined[_programCode][_uid] = address(0);
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
    function approveAllIncentive(string memory _programCode) public  {
        // Check that the calling account has the approval role
        require(admins[msg.sender] == true, "Caller is not a approval user");
        require(programs[_programCode].tokenAddress != address(0) , "Program not found");

        address tokenAddress = programs[_programCode].tokenAddress;
        token = IERC20Upgradeable(tokenAddress);

        // Pay all incentive
        for (uint i=0; i<holdReferrer[_programCode].length; i++) {
            string memory uid = holdReferrer[_programCode][i];
            address referrerAddress = userJoined[uid];
            uint256 amount = incentiveHold[_programCode][uid];
            if (amount >0) {
                // Transfer token
                token.transfer(referrerAddress, amount);
                denyIncentive(_programCode,uid);
            }
        }
        // Clear Holder
        /* for (uint i=0; i<holdReferrer[_programCode].length; i++) {
            denyIncentive(_programCode,i);
        } */
    }
    // Remove incentive from holder
    function denyIncentive(string memory _programCode, string memory _uid) public {
        // Check that the calling account has the approval role
        require(admins[msg.sender] == true, "Caller is not a approval user");
        require(programs[_programCode].tokenAddress != address(0) , "Program not found");

        // Remove incentive
        incentiveHold[_programCode][_uid] = 0;
    }

    function getIncentiveHoldersCount(string memory _programCode) public view returns(uint holdersCount) {
        return holdReferrer[_programCode].length;
    }

    /* function removeIncentiveHold(string memory _programCode, uint _index) private {
        for (uint i = _index; i < holdReferrer[_programCode].length-1; i++) {
            holdReferrer[_programCode][i] = holdReferrer[_programCode][i+1];
        }
        delete holdReferrer[_programCode][holdReferrer[_programCode].length-1];
        holdReferrer[_programCode].length--;
    } */
    /* function removeIncentiveHold(string memory _programCode, uint _index) private {

        // Move the last element into the place to delete
        if (holdReferrer[_programCode].length>1) {
            holdReferrer[_programCode][_index] = holdReferrer[_programCode][holdReferrer[_programCode].length - 1];
        }
        // Remove the last element
        holdReferrer[_programCode].pop();
    } */

}
