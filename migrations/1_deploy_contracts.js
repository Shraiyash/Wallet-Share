const SmartContractWallet = artifacts.require("SmarContracttWallet");
module.exports = function(deployer) {
    deployer.deploy(SmartContractWallet);
};