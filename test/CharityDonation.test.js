const CharityDonation = artifacts.require("CharityDonation");
const { expectRevert, expectEvent, time } = require('@openzeppelin/test-helpers');
const Web3 = require('web3');
const web3 = new Web3();

contract("CharityDonation", (accounts) => {
  let charityDonation;
  const [owner, beneficiary1, beneficiary2, donor1, donor2, donor3] = accounts;
  
  beforeEach(async () => {
    charityDonation = await CharityDonation.new({ from: owner });
  });

  describe("Contract Deployment", () => {
    it("should set the correct owner", async () => {
      const contractOwner = await charityDonation.owner();
      assert.equal(contractOwner, owner, "Contract owner should be the deployer");
    });

    it("should initialize project count to 0", async () => {
      const count = await charityDonation.projectCount();
      assert.equal(count.toNumber(), 0, "Initial project count should be 0");
    });
  });

  describe("Project Creation", () => {
    it("should allow owner to create project", async () => {
      const goal = web3.utils.toWei("10", "ether");
      const tx = await charityDonation.createProject(
        "Test Project",
        "Test Description",
        beneficiary1,
        goal,
        { from: owner }
      );
      
      const project = await charityDonation.projects(0);
      assert.equal(project.name, "Test Project");
      assert.equal(project.description, "Test Description");
      assert.equal(project.beneficiary, beneficiary1);
      assert.equal(project.fundraisingGoal.toString(), goal);
      assert.equal(project.totalDonated.toString(), "0");
      assert.equal(project.isActive, true);
      
      expectEvent(tx, "ProjectCreated", {
        projectId: "0",
        name: "Test Project",
        beneficiary: beneficiary1,
        goal: goal
      });
    });

    it("should reject project creation by non-owner", async () => {
      await expectRevert(
        charityDonation.createProject(
          "Test Project",
          "Test Description",
          beneficiary1,
          web3.utils.toWei("10", "ether"),
          { from: donor1 }
        ),
        "Only contract owner can call this function"
      );
    });

    it("should increment project count after creation", async () => {
      await charityDonation.createProject(
        "Project 1",
        "Description 1",
        beneficiary1,
        web3.utils.toWei("5", "ether"),
        { from: owner }
      );
      
      const count = await charityDonation.projectCount();
      assert.equal(count.toNumber(), 1);
    });
  });

  describe("Donations", () => {
    beforeEach(async () => {
      await charityDonation.createProject(
        "Test Project",
        "Test Description",
        beneficiary1,
        web3.utils.toWei("10", "ether"),
        { from: owner }
      );
    });

    it("should accept donations to active project", async () => {
      const donationAmount = web3.utils.toWei("1", "ether");
      const tx = await charityDonation.donate(0, "Good luck!", {
        from: donor1,
        value: donationAmount
      });
      
      const project = await charityDonation.projects(0);
      assert.equal(project.totalDonated.toString(), donationAmount);
      
      expectEvent(tx, "DonationReceived", {
        projectId: "0",
        donor: donor1,
        amount: donationAmount,
        message: "Good luck!"
      });
    });

    it("should reject zero donations", async () => {
      await expectRevert(
        charityDonation.donate(0, "Test message", {
          from: donor1,
          value: 0
        }),
        "Donation amount must be greater than 0"
      );
    });

    it("should reject donations to non-existent project", async () => {
      await expectRevert(
        charityDonation.donate(999, "Test message", {
          from: donor1,
          value: web3.utils.toWei("1", "ether")
        }),
        "Project does not exist"
      );
    });

    it("should reject donations to inactive project", async () => {
      // Deactivate the project
      await charityDonation.toggleProjectStatus(0, { from: owner });
      
      await expectRevert(
        charityDonation.donate(0, "Test message", {
          from: donor1,
          value: web3.utils.toWei("1", "ether")
        }),
        "Project is not active"
      );
    });

    it("should track multiple donations correctly", async () => {
      const donation1 = web3.utils.toWei("1", "ether");
      const donation2 = web3.utils.toWei("2", "ether");
      
      await charityDonation.donate(0, "First donation", {
        from: donor1,
        value: donation1
      });
      
      await charityDonation.donate(0, "Second donation", {
        from: donor2,
        value: donation2
      });
      
      const project = await charityDonation.projects(0);
      const expectedTotal = web3.utils.toBN(donation1).add(web3.utils.toBN(donation2));
      assert.equal(project.totalDonated.toString(), expectedTotal.toString());
      
      const donationCount = await charityDonation.getDonationCount(0);
      assert.equal(donationCount.toNumber(), 2);
    });
  });

  describe("Fund Withdrawal", () => {
    beforeEach(async () => {
      await charityDonation.createProject(
        "Test Project",
        "Test Description",
        beneficiary1,
        web3.utils.toWei("10", "ether"),
        { from: owner }
      );
      
      // Add some donations
      await charityDonation.donate(0, "Donation 1", {
        from: donor1,
        value: web3.utils.toWei("5", "ether")
      });
    });

    it("should allow beneficiary to withdraw funds", async () => {
      const withdrawAmount = web3.utils.toWei("2", "ether");
      
      const tx = await charityDonation.withdrawFunds(0, withdrawAmount, {
        from: beneficiary1
      });
      
      const withdrawnAmount = await charityDonation.getWithdrawnAmount(0);
      const availableBalance = await charityDonation.getAvailableBalance(0);
      
      assert.equal(withdrawnAmount.toString(), withdrawAmount);
      assert.equal(availableBalance.toString(), web3.utils.toWei("3", "ether"));
      
      expectEvent(tx, "FundsWithdrawn", {
        projectId: "0",
        beneficiary: beneficiary1,
        amount: withdrawAmount
      });
    });

    it("should reject withdrawal by non-beneficiary", async () => {
      await expectRevert(
        charityDonation.withdrawFunds(0, web3.utils.toWei("1", "ether"), {
          from: donor1
        }),
        "Only project beneficiary can call this function"
      );
    });

    it("should reject withdrawal exceeding available balance", async () => {
      await expectRevert(
        charityDonation.withdrawFunds(0, web3.utils.toWei("10", "ether"), {
          from: beneficiary1
        }),
        "Insufficient"
      );
    });

    it("should prevent double spending", async () => {
      const withdrawAmount = web3.utils.toWei("3", "ether");
      
      // First withdrawal
      await charityDonation.withdrawFunds(0, withdrawAmount, {
        from: beneficiary1
      });
      
      // Second withdrawal should exceed available balance
      await expectRevert(
        charityDonation.withdrawFunds(0, withdrawAmount, {
          from: beneficiary1
        }),
        "Insufficient"
      );
    });

    it("should reject zero withdrawal amount", async () => {
      await expectRevert(
        charityDonation.withdrawFunds(0, 0, {
          from: beneficiary1
        }),
        "Withdrawal amount must be greater than 0"
      );
    });
  });

  describe("Expense Recording", () => {
    beforeEach(async () => {
      await charityDonation.createProject(
        "Test Project",
        "Test Description",
        beneficiary1,
        web3.utils.toWei("10", "ether"),
        { from: owner }
      );
    });

    it("should allow beneficiary to record expenses", async () => {
      const tx = await charityDonation.recordExpense(
        0,
        "Office supplies",
        web3.utils.toWei("0.5", "ether"),
        accounts[5],
        { from: beneficiary1 }
      );
      
      const expenseCount = await charityDonation.getExpenseCount(0);
      assert.equal(expenseCount.toNumber(), 1);
      
      expectEvent(tx, "ExpenseRecorded", {
        projectId: "0",
        description: "Office supplies",
        amount: web3.utils.toWei("0.5", "ether"),
        recipient: accounts[5]
      });
    });

    it("should reject expense recording by non-beneficiary", async () => {
      await expectRevert(
        charityDonation.recordExpense(
          0,
          "Test expense",
          web3.utils.toWei("1", "ether"),
          accounts[5],
          { from: donor1 }
        ),
        "Only project beneficiary can call this function"
      );
    });
  });

  describe("Project Status Management", () => {
    beforeEach(async () => {
      await charityDonation.createProject(
        "Test Project",
        "Test Description",
        beneficiary1,
        web3.utils.toWei("10", "ether"),
        { from: owner }
      );
    });

    it("should allow owner to toggle project status", async () => {
      let project = await charityDonation.projects(0);
      assert.equal(project.isActive, true);
      
      const tx = await charityDonation.toggleProjectStatus(0, { from: owner });
      
      project = await charityDonation.projects(0);
      assert.equal(project.isActive, false);
      
      expectEvent(tx, "ProjectStatusChanged", {
        projectId: "0",
        isActive: false
      });
    });

    it("should reject status change by non-owner", async () => {
      await expectRevert(
        charityDonation.toggleProjectStatus(0, { from: donor1 }),
        "Only contract owner can call this function"
      );
    });
  });

  describe("View Functions", () => {
    beforeEach(async () => {
      await charityDonation.createProject(
        "Test Project",
        "Test Description",
        beneficiary1,
        web3.utils.toWei("10", "ether"),
        { from: owner }
      );
      
      await charityDonation.donate(0, "Test donation", {
        from: donor1,
        value: web3.utils.toWei("3", "ether")
      });
      
      await charityDonation.withdrawFunds(0, web3.utils.toWei("1", "ether"), {
        from: beneficiary1
      });
    });

    it("should return correct available balance", async () => {
      const available = await charityDonation.getAvailableBalance(0);
      assert.equal(available.toString(), web3.utils.toWei("2", "ether"));
    });

    it("should return correct withdrawn amount", async () => {
      const withdrawn = await charityDonation.getWithdrawnAmount(0);
      assert.equal(withdrawn.toString(), web3.utils.toWei("1", "ether"));
    });

    it("should return correct contract balance", async () => {
      const contractBalance = await charityDonation.getContractBalance();
      assert.equal(contractBalance.toString(), web3.utils.toWei("2", "ether"));
    });
  });
});

