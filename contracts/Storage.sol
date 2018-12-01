pragma solidity ^0.4.18;

contract Storage {
  address public owner;
  mapping (string => string) _storage;

  function Storage() public {
    owner = msg.sender;
  }

  modifier onlyOwner() {
    if (msg.sender == owner)
      _;
  }

  function transferOwnership(address newOwner) onlyOwner public {
    if (newOwner != address(0)) owner = newOwner;
  }

  function set(string key, string value) onlyOwner public {
  	require(bytes(_storage[key]).length == 0);
    _storage[key] = value;
  }

  function get(string key) onlyOwner view returns (string) {
    require(bytes(_storage[key]).length > 0);
    return _storage[key];
  }

  function unset(string key) onlyOwner public returns (string) {
  	require(bytes(_storage[key]).length > 0);
  	string storage prev = _storage[key];
  	delete _storage[key];
  	return prev;
  }

  function update(string key, string value) onlyOwner public {
  	require(bytes(_storage[key]).length > 0);
  	_storage[key] = value;
  }
}
