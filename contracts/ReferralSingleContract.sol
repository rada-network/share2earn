// SPDX-License-Identifier: MIT
pragma solidity 0.8.2;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract ReferralSingleContract is Initializable, UUPSUpgradeable, OwnableUpgradeable {

    // define event
    event JoinProgram(string _uid, string _referCode);
    mapping(address => bool) public admins;
    address public addressAdminContract;
    // Config programs
    struct Program {
        string code;
        bool paused;
        uint256 startTime;
        uint256 endTime;
    }
    mapping(string => Program) public programs;
    // Config users
    mapping(string => mapping(string => address)) public uidJoined;// program code => uid => sender address
    mapping(string => mapping(address => string)) public addressJoined;// program code => uid => sender address
    mapping(string => mapping(address => address[])) public refereesListAddress;  // program code => uid => referral code
    mapping(string => mapping(address => address)) public rUserFromReferer; // program code => sender address => referrer address

    mapping(string => address[]) public joinersAddress; // program code => address[]
    // Check
    // mapping(string => address) public userJoined; // uid => user address
    // mapping(address => string) public addressJoined; // user address => uid

    function initialize() initializer public {
        __Ownable_init();

        // Grant the approval role to a specified account
        admins[owner()] = true;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() initializer {}

    function _authorizeUpgrade(address) internal override onlyOwner {}

    function joinProgram(string memory _programCode, string memory _uid, string memory _referCode) public {
        require(programs[_programCode].paused == false , "Program has paused");
        // Check end time
        require(programs[_programCode].startTime <= block.timestamp && programs[_programCode].endTime >= block.timestamp, "Program has expired");

        require(uidJoined[_programCode][_uid] == address(0) , "The user joined");
        bytes memory tempEmptyString = bytes(addressJoined[_programCode][msg.sender]); // Uses memory
        require(tempEmptyString.length == 0 , "The address joined");

        // Validate, check this address joined but uid not the same
        if (rUserFromReferer[_programCode][msg.sender] != address(0)) {
            require(keccak256(bytes(_uid)) == keccak256(bytes(addressJoined[_programCode][msg.sender])) , "This user id used by another address");
        }

        bytes memory haveReferralCode = bytes(_referCode);

        if (haveReferralCode.length>0) {
            address referrerAddress = uidJoined[_programCode][_referCode];

            refereesListAddress[_programCode][referrerAddress].push(msg.sender);
            // Save address of referrer
            rUserFromReferer[_programCode][msg.sender] = referrerAddress;
        }
        uidJoined[_programCode][_uid] = msg.sender;
        addressJoined[_programCode][msg.sender] = _uid;
        joinersAddress[_programCode].push(msg.sender);

        emit JoinProgram(_uid, _referCode);
    }

    // Add new program
    function addProgram(string memory _programCode, uint256 _startTime, uint256 _endTime) public {
        require(admins[msg.sender] == true, "Caller is not an approved user");
        require(programs[_programCode].endTime == 0 , "Program has already existed");
        programs[_programCode] = Program({
            code: _programCode,
            paused: false,
            startTime: _startTime,
            endTime: _endTime
        });

    }

    function setPause(string memory _programCode, bool _pause) public {
        require(admins[msg.sender] == true, "Caller is not an approved user");
        programs[_programCode].paused = _pause;
    }

    function updateProgram(string memory _programCode, uint256 _startTime, uint256 _endTime) public {
        require(admins[msg.sender] == true, "Caller is not an approved user");
        programs[_programCode].startTime = _startTime;
        programs[_programCode].endTime = _endTime;
    }

    function setAddressAdminContract(address _addressAdminContract) onlyAdmin public {
        addressAdminContract = _addressAdminContract;
    }
    function getProgram(string memory _programCode) public view returns(Program memory) {
        return programs[_programCode];
    }

    function getJoinersAddress(string memory _programCode) public view returns(address[] memory) {
        return joinersAddress[_programCode];
    }
    /* function getJoinerReferees(string memory _programCode, string memory _uid) public view returns(string[] memory) {
        return refereesList[_programCode][_uid];
    } */
    function getJoinerRefereesL1Address(string memory _programCode, address _address) public view returns(address[] memory) {
        return refereesListAddress[_programCode][_address];
    }

    function getTotalRefereesL1(string memory _programCode, address _address) public view returns(uint) {
        return refereesListAddress[_programCode][_address].length;
    }
    function getTotalRefereesL2(string memory _programCode, address _address) public view returns(uint) {
        address[] memory refereesL1 = refereesListAddress[_programCode][_address];
        uint totalRefereesL2;
        for (uint i=0;i<refereesL1.length;i++) {
            totalRefereesL2 += refereesListAddress[_programCode][refereesL1[i]].length;
        }
        return totalRefereesL2;
    }
    function getTotalRefereesL1L2(string memory _programCode, address _address) public view returns(uint[2] memory) {
        uint[2] memory totalReferess;
        totalReferess[0] = getTotalRefereesL1(_programCode,_address);
        totalReferess[1] = getTotalRefereesL2(_programCode,_address);
        return totalReferess;
    }
    function setAdmin(address _adminAddress, bool _allow) public onlyAdmin {
        admins[_adminAddress] = _allow;
    }

    modifier onlyAdmin() {
        require(admins[msg.sender] == true, "Caller is not an approved user");
        _;
    }
}
