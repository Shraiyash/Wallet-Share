import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { SmarContracttWallet } from "../typechain-types";

const votesNeeded = 3n;

describe("SmarContracttWallet", () => {
  // Deploys a fresh wallet with the first signer as owner.
  async function deployWalletFixture() {
    const [owner, memberA, memberB, voter1, voter2, voter3, recipient] =
      await ethers.getSigners();

    const Wallet = await ethers.getContractFactory("SmarContracttWallet");
    // Standalone deployment: owner passed explicitly, no factory to notify.
    const wallet = (await Wallet.deploy(
      owner.address,
      "Test Wallet",
      ethers.ZeroAddress,
    )) as unknown as SmarContracttWallet;
    await wallet.waitForDeployment();

    return { wallet, owner, memberA, memberB, voter1, voter2, voter3, recipient };
  }

  // Fund the wallet so transfers have something to draw from.
  async function fundWallet(wallet: SmarContracttWallet, amount: bigint) {
    await wallet.deposit({ value: amount });
  }

  describe("Deployment", () => {
    it("sets the deployer as the owner", async () => {
      const { wallet, owner } = await loadFixture(deployWalletFixture);
      expect(await wallet.owner()).to.equal(owner.address);
    });

    it("reports the owner via isOwner()", async () => {
      const { wallet, owner, memberA } = await loadFixture(deployWalletFixture);
      expect(await wallet.isOwner(owner.address)).to.equal(true);
      expect(await wallet.isOwner(memberA.address)).to.equal(false);
    });

    it("starts with a zero balance", async () => {
      const { wallet } = await loadFixture(deployWalletFixture);
      expect(await ethers.provider.getBalance(await wallet.getAddress())).to.equal(0n);
    });
  });

  describe("Deposits", () => {
    it("accepts deposits via deposit() and tracks per-user totals", async () => {
      const { wallet, owner } = await loadFixture(deployWalletFixture);
      const amount = ethers.parseEther("1.5");

      await expect(wallet.deposit({ value: amount }))
        .to.emit(wallet, "Deposit")
        .withArgs(owner.address, amount);

      expect(await wallet.userDeposits(owner.address)).to.equal(amount);
      expect(await ethers.provider.getBalance(await wallet.getAddress())).to.equal(amount);
    });

    it("accumulates repeated deposits from the same user", async () => {
      const { wallet, memberA } = await loadFixture(deployWalletFixture);
      await wallet.connect(memberA).deposit({ value: ethers.parseEther("1") });
      await wallet.connect(memberA).deposit({ value: ethers.parseEther("2") });
      expect(await wallet.userDeposits(memberA.address)).to.equal(ethers.parseEther("3"));
    });

    it("rejects a zero-value deposit", async () => {
      const { wallet } = await loadFixture(deployWalletFixture);
      await expect(wallet.deposit({ value: 0 })).to.be.revertedWith(
        "Deposit must be greater than 0"
      );
    });

    it("accepts plain ETH transfers via receive()", async () => {
      const { wallet, owner } = await loadFixture(deployWalletFixture);
      const amount = ethers.parseEther("0.25");
      await expect(
        owner.sendTransaction({ to: await wallet.getAddress(), value: amount })
      )
        .to.emit(wallet, "Deposit")
        .withArgs(owner.address, amount);
      // receive() does NOT credit userDeposits — only the explicit deposit() does.
      expect(await wallet.userDeposits(owner.address)).to.equal(0n);
    });
  });

  describe("Access control", () => {
    it("lets the owner grant access and lists allowed users", async () => {
      const { wallet, memberA } = await loadFixture(deployWalletFixture);
      await expect(wallet.setAccess(memberA.address, true))
        .to.emit(wallet, "AccessSet")
        .withArgs(memberA.address, true);

      expect(await wallet.allowed(memberA.address)).to.equal(true);
      expect(await wallet.getAllowedUsers()).to.deep.equal([memberA.address]);
    });

    it("excludes revoked users from getAllowedUsers()", async () => {
      const { wallet, memberA, memberB } = await loadFixture(deployWalletFixture);
      await wallet.setAccess(memberA.address, true);
      await wallet.setAccess(memberB.address, true);
      await wallet.setAccess(memberA.address, false);

      expect(await wallet.getAllowedUsers()).to.deep.equal([memberB.address]);
    });

    it("does not duplicate a user granted access twice", async () => {
      const { wallet, memberA } = await loadFixture(deployWalletFixture);
      await wallet.setAccess(memberA.address, true);
      await wallet.setAccess(memberA.address, true);
      expect(await wallet.getAllowedUsers()).to.deep.equal([memberA.address]);
    });

    it("reverts when a non-owner tries to set access", async () => {
      const { wallet, memberA, memberB } = await loadFixture(deployWalletFixture);
      await expect(
        wallet.connect(memberA).setAccess(memberB.address, true)
      ).to.be.revertedWith("Only owner can set access");
    });

    it("reports isAllowed() correctly for owner and members", async () => {
      const { wallet, owner, memberA } = await loadFixture(deployWalletFixture);
      expect(await wallet.connect(owner).isAllowed()).to.equal(true);
      expect(await wallet.connect(memberA).isAllowed()).to.equal(false);
      await wallet.setAccess(memberA.address, true);
      expect(await wallet.connect(memberA).isAllowed()).to.equal(true);
    });
  });

  describe("Spending limits", () => {
    it("lets the owner set a limit; reverts for non-owners", async () => {
      const { wallet, memberA } = await loadFixture(deployWalletFixture);
      await wallet.setLimit(memberA.address, ethers.parseEther("1"));
      expect(await wallet.limits(memberA.address)).to.equal(ethers.parseEther("1"));

      await expect(
        wallet.connect(memberA).setLimit(memberA.address, 5n)
      ).to.be.revertedWith("You are not authorized for this action");
    });
  });

  describe("Transfers", () => {
    it("lets the owner transfer without any limit", async () => {
      const { wallet, owner, recipient } = await loadFixture(deployWalletFixture);
      await fundWallet(wallet.connect(owner) as SmarContracttWallet, ethers.parseEther("5"));

      const amount = ethers.parseEther("2");
      await expect(
        wallet.transferFunds(recipient.address, amount)
      ).to.changeEtherBalance(recipient, amount);
    });

    it("enforces the limit for a non-owner and decrements it (limits are in wei)", async () => {
      const { wallet, memberA, recipient } = await loadFixture(deployWalletFixture);
      await fundWallet(wallet, ethers.parseEther("10"));

      // Limit and transfer amount MUST be in the same unit (wei). This is the
      // invariant the frontend previously violated: setLimit stored a raw
      // number as wei while transferFunds compared against a parseEther value.
      const limit = ethers.parseEther("1");
      await wallet.setLimit(memberA.address, limit);

      const spend = ethers.parseEther("0.4");
      await expect(
        wallet.connect(memberA).transferFunds(recipient.address, spend)
      ).to.changeEtherBalance(recipient, spend);

      expect(await wallet.limits(memberA.address)).to.equal(limit - spend);
    });

    it("reverts when a non-owner exceeds their limit", async () => {
      const { wallet, memberA, recipient } = await loadFixture(deployWalletFixture);
      await fundWallet(wallet, ethers.parseEther("10"));
      await wallet.setLimit(memberA.address, ethers.parseEther("1"));

      await expect(
        wallet.connect(memberA).transferFunds(recipient.address, ethers.parseEther("2"))
      ).to.be.revertedWith("Transfer Limit Exceeded");
    });

    it("reverts when a non-owner has no limit set", async () => {
      const { wallet, memberA, recipient } = await loadFixture(deployWalletFixture);
      await fundWallet(wallet, ethers.parseEther("10"));
      await expect(
        wallet.connect(memberA).transferFunds(recipient.address, 1n)
      ).to.be.revertedWith("Transfer Limit Exceeded");
    });

    it("reverts when the contract balance is insufficient", async () => {
      const { wallet, owner, recipient } = await loadFixture(deployWalletFixture);
      await fundWallet(wallet, ethers.parseEther("1"));
      await expect(
        wallet.connect(owner).transferFunds(recipient.address, ethers.parseEther("2"))
      ).to.be.revertedWith("Insufficient contract balance");
    });
  });

  describe("Governance (voting for a new owner)", () => {
    async function withVotersFixture() {
      const base = await loadFixture(deployWalletFixture);
      await base.wallet.assignVoter(base.voter1.address);
      await base.wallet.assignVoter(base.voter2.address);
      await base.wallet.assignVoter(base.voter3.address);
      return base;
    }

    it("only the owner can assign voters", async () => {
      const { wallet, memberA, voter1 } = await loadFixture(deployWalletFixture);
      await expect(
        wallet.connect(memberA).assignVoter(voter1.address)
      ).to.be.revertedWith("You are not authorized for this action");
    });

    it("records assigned voters in the voter list", async () => {
      const { wallet, voter1, voter2 } = await loadFixture(deployWalletFixture);
      await wallet.assignVoter(voter1.address);
      await wallet.assignVoter(voter2.address);
      expect(await wallet.getVoterList()).to.deep.equal([
        voter1.address,
        voter2.address,
      ]);
    });

    it("rejects votes from non-authorized addresses", async () => {
      const { wallet, memberA, recipient } = await withVotersFixture();
      await expect(
        wallet.connect(memberA).voteForNewOwner(recipient.address)
      ).to.be.revertedWith("You are not authorized for this action");
    });

    it("prevents a voter from voting twice for the same candidate", async () => {
      const { wallet, voter1, recipient } = await withVotersFixture();
      await wallet.connect(voter1).voteForNewOwner(recipient.address);
      await expect(
        wallet.connect(voter1).voteForNewOwner(recipient.address)
      ).to.be.revertedWith("You have already voted");
    });

    it("transfers ownership once the vote threshold is reached", async () => {
      const { wallet, voter1, voter2, voter3, recipient } = await withVotersFixture();

      await wallet.connect(voter1).voteForNewOwner(recipient.address);
      await wallet.connect(voter2).voteForNewOwner(recipient.address);
      // Not enough votes yet.
      expect(await wallet.owner()).to.not.equal(recipient.address);

      await wallet.connect(voter3).voteForNewOwner(recipient.address);
      // votesNeeded (3) reached.
      expect(votesNeeded).to.equal(3n);
      expect(await wallet.owner()).to.equal(recipient.address);
    });

    it("resets the tally when voters switch to a different candidate", async () => {
      const { wallet, voter1, voter2, memberA, memberB } = await withVotersFixture();

      await wallet.connect(voter1).voteForNewOwner(memberA.address);
      // Switching candidate resets the count, so this single vote for memberB
      // must not carry memberA's tally forward.
      await wallet.connect(voter2).voteForNewOwner(memberB.address);
      expect(await wallet.owner()).to.not.equal(memberB.address);
    });
  });
});
