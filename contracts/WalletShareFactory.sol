// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {SmarContracttWallet} from "./SmartWallet.sol";

/**
 * Deploys one shared wallet per user and keeps track of who belongs to what.
 *
 * The app used to point at a single hard-coded wallet, which meant every
 * visitor was trying to join the deployer's wallet. Here each signup creates
 * their own, and the index below answers "which wallets am I in?" in a single
 * call — cheaper and far more reliable than asking the frontend to scan event
 * logs across every wallet ever created.
 */
contract WalletShareFactory {
    /// Guards recordMembership: only wallets this factory deployed may write.
    mapping(address => bool) public isWallet;

    mapping(address => address[]) private _walletsOf;
    mapping(address => mapping(address => bool)) private _isListed;

    event WalletCreated(address indexed wallet, address indexed owner, string name);
    event MembershipChanged(address indexed wallet, address indexed member, bool allowed);

    function createWallet(string calldata walletName) external returns (address wallet) {
        SmarContracttWallet created =
            new SmarContracttWallet(payable(msg.sender), walletName, address(this));
        wallet = address(created);

        isWallet[wallet] = true;
        _link(msg.sender, wallet);

        emit WalletCreated(wallet, msg.sender, walletName);
    }

    /// Called by a wallet whenever its membership changes.
    function recordMembership(address member, bool allowed) external {
        require(isWallet[msg.sender], "Caller is not a known wallet");
        if (allowed) {
            _link(member, msg.sender);
        }
        emit MembershipChanged(msg.sender, member, allowed);
    }

    /**
     * Wallets this user has ever been linked to. Membership can be revoked
     * afterwards, so entries are not pruned — the caller should still check
     * `isAllowed()`/`owner()` on each wallet before showing it as active. Kept
     * append-only on purpose: removing from a Solidity array costs far more gas
     * than letting the client filter.
     */
    function getWallets(address user) external view returns (address[] memory) {
        return _walletsOf[user];
    }

    function walletCount(address user) external view returns (uint256) {
        return _walletsOf[user].length;
    }

    function _link(address user, address wallet) internal {
        if (!_isListed[user][wallet]) {
            _isListed[user][wallet] = true;
            _walletsOf[user].push(wallet);
        }
    }
}
