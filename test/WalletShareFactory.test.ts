import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { SmarContracttWallet, WalletShareFactory } from "../typechain-types";

describe("WalletShareFactory", () => {
  async function deployFactoryFixture() {
    const [alice, bob, carol] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("WalletShareFactory");
    const factory = (await Factory.deploy()) as unknown as WalletShareFactory;
    await factory.waitForDeployment();

    return { factory, alice, bob, carol };
  }

  // Alice creates a wallet through the factory and we hand back a typed handle.
  async function createWallet(
    factory: WalletShareFactory,
    signer: HardhatEthersSigner,
    name = "Rent House",
  ) {
    const tx = await factory.connect(signer).createWallet(name);
    const receipt = await tx.wait();

    const created = receipt!.logs
      .map((log) => {
        try {
          return factory.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((parsed) => parsed?.name === "WalletCreated");

    const walletAddress = created!.args.wallet as string;
    const wallet = (await ethers.getContractAt(
      "SmarContracttWallet",
      walletAddress,
    )) as unknown as SmarContracttWallet;

    return { wallet, walletAddress };
  }

  // Produces the owner's off-chain signature for a bearer invite link.
  async function signInvite(
    wallet: SmarContracttWallet,
    walletAddress: string,
    owner: HardhatEthersSigner,
    inviteId: string,
    expiry: bigint,
  ) {
    const { chainId } = await ethers.provider.getNetwork();
    return owner.signTypedData(
      {
        name: "WalletShare",
        version: "1",
        chainId,
        verifyingContract: walletAddress,
      },
      {
        Invite: [
          { name: "wallet", type: "address" },
          { name: "inviteId", type: "bytes32" },
          { name: "expiry", type: "uint256" },
        ],
      },
      { wallet: walletAddress, inviteId, expiry },
    );
  }

  const anHourFromNow = async () => BigInt(await time.latest()) + 3600n;

  describe("creating wallets", () => {
    it("makes the caller the owner, not the factory", async () => {
      const { factory, alice } = await loadFixture(deployFactoryFixture);
      const { wallet } = await createWallet(factory, alice);

      expect(await wallet.owner()).to.equal(alice.address);
      expect(await wallet.owner()).to.not.equal(await factory.getAddress());
    });

    it("stores the wallet name", async () => {
      const { factory, alice } = await loadFixture(deployFactoryFixture);
      const { wallet } = await createWallet(factory, alice, "Ski Trip");

      expect(await wallet.name()).to.equal("Ski Trip");
    });

    it("lists the wallet under its creator", async () => {
      const { factory, alice } = await loadFixture(deployFactoryFixture);
      const { walletAddress } = await createWallet(factory, alice);

      expect(await factory.getWallets(alice.address)).to.deep.equal([walletAddress]);
    });

    it("keeps each user's wallets separate", async () => {
      const { factory, alice, bob } = await loadFixture(deployFactoryFixture);
      const { walletAddress: aliceWallet } = await createWallet(factory, alice);
      const { walletAddress: bobWallet } = await createWallet(factory, bob, "Bob's");

      expect(await factory.getWallets(alice.address)).to.deep.equal([aliceWallet]);
      expect(await factory.getWallets(bob.address)).to.deep.equal([bobWallet]);
    });

    it("lets one user own several wallets", async () => {
      const { factory, alice } = await loadFixture(deployFactoryFixture);
      await createWallet(factory, alice, "One");
      await createWallet(factory, alice, "Two");

      expect(await factory.walletCount(alice.address)).to.equal(2n);
    });
  });

  describe("membership index", () => {
    it("indexes a member added via setAccess", async () => {
      const { factory, alice, bob } = await loadFixture(deployFactoryFixture);
      const { wallet, walletAddress } = await createWallet(factory, alice);

      await wallet.connect(alice).setAccess(bob.address, true);

      expect(await factory.getWallets(bob.address)).to.deep.equal([walletAddress]);
    });

    it("rejects membership writes from something the factory didn't deploy", async () => {
      const { factory, alice, bob } = await loadFixture(deployFactoryFixture);

      await expect(
        factory.connect(alice).recordMembership(bob.address, true),
      ).to.be.revertedWith("Caller is not a known wallet");
    });

    it("keeps a revoked member listed, so the client must check access itself", async () => {
      const { factory, alice, bob } = await loadFixture(deployFactoryFixture);
      const { wallet, walletAddress } = await createWallet(factory, alice);

      await wallet.connect(alice).setAccess(bob.address, true);
      await wallet.connect(alice).setAccess(bob.address, false);

      expect(await factory.getWallets(bob.address)).to.deep.equal([walletAddress]);
      expect(await wallet.connect(bob).isAllowed()).to.equal(false);
    });
  });

  describe("invite links", () => {
    it("lets anyone holding a valid invite join", async () => {
      const { factory, alice, bob } = await loadFixture(deployFactoryFixture);
      const { wallet, walletAddress } = await createWallet(factory, alice);

      const inviteId = ethers.hexlify(ethers.randomBytes(32));
      const expiry = await anHourFromNow();
      const signature = await signInvite(wallet, walletAddress, alice, inviteId, expiry);

      await expect(wallet.connect(bob).acceptInvite(inviteId, expiry, signature))
        .to.emit(wallet, "InviteAccepted")
        .withArgs(bob.address, inviteId);

      expect(await wallet.connect(bob).isAllowed()).to.equal(true);
      expect(await factory.getWallets(bob.address)).to.deep.equal([walletAddress]);
    });

    it("costs the owner no transaction to create one", async () => {
      const { factory, alice, bob } = await loadFixture(deployFactoryFixture);
      const { wallet, walletAddress } = await createWallet(factory, alice);

      const before = await ethers.provider.getTransactionCount(alice.address);
      const inviteId = ethers.hexlify(ethers.randomBytes(32));
      const expiry = await anHourFromNow();
      await signInvite(wallet, walletAddress, alice, inviteId, expiry);

      // Signing is off-chain: the owner's nonce must not have moved.
      expect(await ethers.provider.getTransactionCount(alice.address)).to.equal(before);
      expect(await wallet.connect(bob).isAllowed()).to.equal(false);
    });

    it("refuses a second use of the same invite", async () => {
      const { factory, alice, bob, carol } = await loadFixture(deployFactoryFixture);
      const { wallet, walletAddress } = await createWallet(factory, alice);

      const inviteId = ethers.hexlify(ethers.randomBytes(32));
      const expiry = await anHourFromNow();
      const signature = await signInvite(wallet, walletAddress, alice, inviteId, expiry);

      await wallet.connect(bob).acceptInvite(inviteId, expiry, signature);

      await expect(
        wallet.connect(carol).acceptInvite(inviteId, expiry, signature),
      ).to.be.revertedWith("Invite already used");
    });

    it("refuses an expired invite", async () => {
      const { factory, alice, bob } = await loadFixture(deployFactoryFixture);
      const { wallet, walletAddress } = await createWallet(factory, alice);

      const inviteId = ethers.hexlify(ethers.randomBytes(32));
      const expiry = BigInt(await time.latest()) + 60n;
      const signature = await signInvite(wallet, walletAddress, alice, inviteId, expiry);

      await time.increase(120);

      await expect(
        wallet.connect(bob).acceptInvite(inviteId, expiry, signature),
      ).to.be.revertedWith("Invite expired");
    });

    it("refuses an invite signed by anyone but the owner", async () => {
      const { factory, alice, bob, carol } = await loadFixture(deployFactoryFixture);
      const { wallet, walletAddress } = await createWallet(factory, alice);

      const inviteId = ethers.hexlify(ethers.randomBytes(32));
      const expiry = await anHourFromNow();
      // Bob forges an invite to Alice's wallet.
      const signature = await signInvite(wallet, walletAddress, bob, inviteId, expiry);

      await expect(
        wallet.connect(carol).acceptInvite(inviteId, expiry, signature),
      ).to.be.revertedWith("Invalid invite");
    });

    it("refuses an invite meant for a different wallet", async () => {
      const { factory, alice, bob } = await loadFixture(deployFactoryFixture);
      const { walletAddress: first } = await createWallet(factory, alice, "One");
      const { wallet: second } = await createWallet(factory, alice, "Two");

      const inviteId = ethers.hexlify(ethers.randomBytes(32));
      const expiry = await anHourFromNow();
      // Signed against the first wallet, replayed against the second.
      const signature = await signInvite(second, first, alice, inviteId, expiry);

      await expect(
        second.connect(bob).acceptInvite(inviteId, expiry, signature),
      ).to.be.revertedWith("Invalid invite");
    });

    it("lets the owner revoke a link before it is redeemed", async () => {
      const { factory, alice, bob } = await loadFixture(deployFactoryFixture);
      const { wallet, walletAddress } = await createWallet(factory, alice);

      const inviteId = ethers.hexlify(ethers.randomBytes(32));
      const expiry = await anHourFromNow();
      const signature = await signInvite(wallet, walletAddress, alice, inviteId, expiry);

      await wallet.connect(alice).revokeInvite(inviteId);

      await expect(
        wallet.connect(bob).acceptInvite(inviteId, expiry, signature),
      ).to.be.revertedWith("Invite already used");
    });

    it("only lets the owner revoke", async () => {
      const { factory, alice, bob } = await loadFixture(deployFactoryFixture);
      const { wallet } = await createWallet(factory, alice);

      const inviteId = ethers.hexlify(ethers.randomBytes(32));

      await expect(wallet.connect(bob).revokeInvite(inviteId)).to.be.revertedWith(
        "Only owner can revoke",
      );
    });
  });
});
