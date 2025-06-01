const CharityDonation = artifacts.require("CharityDonation");

module.exports = function(deployer) {
  deployer.deploy(CharityDonation);
}; 