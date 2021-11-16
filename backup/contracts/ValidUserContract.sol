// SPDX-License-Identifier: MIT
// pragma solidity >=0.8.0 <=0.8.4;
pragma solidity 0.8.2;

// import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
// import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract ValidUserContract is Initializable, UUPSUpgradeable, OwnableUpgradeable { // ERC20Upgradeable,

    address public admin;
    mapping(address => string) public addressUsers;
    mapping(string => address) public uidUsers;

    function initialize() initializer public {
        __Ownable_init();
        admin = msg.sender;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() initializer {}

    function _authorizeUpgrade(address) internal override onlyOwner {}

    function setUser(address addressUser, string memory uid)  public { // onlyOwner

        bytes memory checkUid = bytes(uid);
        require(checkUid.length > 0 , "Empty uid");

        require(addressUser != address(0) , "Empty address");

        // Check exist
        bytes memory checkExist = bytes(addressUsers[addressUser]);
        require(checkExist.length == 0 , "Existing address");

        // Check exist uid
        require(uidUsers[uid] == address(0) , "Existing uid");

        addressUsers[addressUser] = uid;
        uidUsers[uid] = addressUser;
    }
    function unsetUser(address addressUser)  public { // onlyOwner
        string memory uid = addressUsers[addressUser];
        addressUsers[addressUser] = '';
        uidUsers[uid] = address(0);
    }

    function version() virtual pure public returns (string memory) {
        return "v1";
    }

}
