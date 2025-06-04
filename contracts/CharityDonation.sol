// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title CharityDonation
 * @dev 一個透明的慈善捐贈平台智能合約
 */
contract CharityDonation {
    // 合約擁有者
    address public owner;
    
    // 慈善項目結構
    struct CharityProject {
        string name;
        string description;
        address payable beneficiary;
        uint256 fundraisingGoal;
        uint256 totalDonated;
        bool isActive;
        uint256 createdAt;
    }
    
    // 捐款記錄結構
    struct Donation {
        address donor;
        uint256 amount;
        uint256 timestamp;
        string message;
    }
    
    // 支出記錄結構
    struct Expense {
        string description;
        uint256 amount;
        uint256 timestamp;
        address recipient;
    }
    
    // 項目ID到項目的映射
    mapping(uint256 => CharityProject) public projects;
    
    // 項目ID到捐款數組的映射
    mapping(uint256 => Donation[]) public donations;
    
    // 項目ID到支出數組的映射
    mapping(uint256 => Expense[]) public expenses;
    
    // 項目ID到已提取金額的映射
    mapping(uint256 => uint256) public withdrawnAmounts;
    
    // 項目總數
    uint256 public projectCount;
    
    // 事件定義
    event ProjectCreated(uint256 indexed projectId, string name, address beneficiary, uint256 goal);
    event DonationReceived(uint256 indexed projectId, address indexed donor, uint256 amount, string message);
    event FundsWithdrawn(uint256 indexed projectId, address indexed beneficiary, uint256 amount);
    event ExpenseRecorded(uint256 indexed projectId, string description, uint256 amount, address recipient);
    event ProjectStatusChanged(uint256 indexed projectId, bool isActive);
    
    // 構造函數
    constructor() {
        owner = msg.sender;
        projectCount = 0;
    }
    
    // 修飾符：只有合約擁有者可以調用
    modifier onlyOwner() {
        require(msg.sender == owner, "Only contract owner can call this function");
        _;
    }
    
    // 修飾符：只有項目受益人可以調用
    modifier onlyBeneficiary(uint256 _projectId) {
        require(msg.sender == projects[_projectId].beneficiary, "Only project beneficiary can call this function");
        _;
    }
    
    // 修飾符：只有合約擁有者或項目受益人可以調用
    modifier onlyOwnerOrBeneficiary(uint256 _projectId) {
        require(
            msg.sender == owner || msg.sender == projects[_projectId].beneficiary, 
            "Only contract owner or project beneficiary can call this function"
        );
        _;
    }
    
    // 修飾符：項目必須存在
    modifier projectExists(uint256 _projectId) {
        require(_projectId < projectCount, "Project does not exist");
        _;
    }
    
    // 修飾符：項目必須處於活躍狀態
    modifier projectActive(uint256 _projectId) {
        require(projects[_projectId].isActive, "Project is not active");
        _;
    }
    
    /**
     * @dev 創建新的慈善項目
     */
    function createProject(
        string memory _name,
        string memory _description,
        address payable _beneficiary,
        uint256 _fundraisingGoal
    ) public onlyOwner {
        uint256 projectId = projectCount;
        
        projects[projectId] = CharityProject({
            name: _name,
            description: _description,
            beneficiary: _beneficiary,
            fundraisingGoal: _fundraisingGoal,
            totalDonated: 0,
            isActive: true,
            createdAt: block.timestamp
        });
        
        projectCount++;
        
        emit ProjectCreated(projectId, _name, _beneficiary, _fundraisingGoal);
    }
    
    /**
     * @dev 向指定項目捐款
     */
    function donate(uint256 _projectId, string memory _message) public payable projectExists(_projectId) projectActive(_projectId) {
        require(msg.value > 0, "Donation amount must be greater than 0");
        
        // 更新項目總捐款金額
        projects[_projectId].totalDonated += msg.value;
        
        // 記錄捐款
        donations[_projectId].push(Donation({
            donor: msg.sender,
            amount: msg.value,
            timestamp: block.timestamp,
            message: _message
        }));
        
        emit DonationReceived(_projectId, msg.sender, msg.value, _message);
    }
    
    /**
     * @dev 提取資金（合約擁有者或受益人可以調用）
     */
    function withdrawFunds(uint256 _projectId, uint256 _amount) public projectExists(_projectId) onlyOwnerOrBeneficiary(_projectId) {
        CharityProject storage project = projects[_projectId];
        
        require(_amount > 0, "Withdrawal amount must be greater than 0");
        require(_amount <= address(this).balance, "Insufficient contract balance");
        
        // 檢查可用餘額（總捐款 - 已提取金額）
        uint256 availableBalance = project.totalDonated - withdrawnAmounts[_projectId];
        require(_amount <= availableBalance, "Insufficient available project balance");
        
        // 更新已提取金額
        withdrawnAmounts[_projectId] += _amount;
        
        // 轉移資金到受益人地址（無論是誰調用這個函數）
        project.beneficiary.transfer(_amount);
        
        emit FundsWithdrawn(_projectId, project.beneficiary, _amount);
    }
    
    /**
     * @dev 記錄項目支出
     */
    function recordExpense(
        uint256 _projectId,
        string memory _description,
        uint256 _amount,
        address _recipient
    ) public projectExists(_projectId) onlyBeneficiary(_projectId) {
        expenses[_projectId].push(Expense({
            description: _description,
            amount: _amount,
            timestamp: block.timestamp,
            recipient: _recipient
        }));
        
        emit ExpenseRecorded(_projectId, _description, _amount, _recipient);
    }
    
    /**
     * @dev 更改項目狀態（活躍/非活躍）
     */
    function toggleProjectStatus(uint256 _projectId) public projectExists(_projectId) onlyOwner {
        projects[_projectId].isActive = !projects[_projectId].isActive;
        
        emit ProjectStatusChanged(_projectId, projects[_projectId].isActive);
    }
    
    /**
     * @dev 獲取項目捐款數量
     */
    function getDonationCount(uint256 _projectId) public view projectExists(_projectId) returns (uint256) {
        return donations[_projectId].length;
    }
    
    /**
     * @dev 獲取項目支出數量
     */
    function getExpenseCount(uint256 _projectId) public view projectExists(_projectId) returns (uint256) {
        return expenses[_projectId].length;
    }
    
    /**
     * @dev 獲取項目可用餘額
     */
    function getAvailableBalance(uint256 _projectId) public view projectExists(_projectId) returns (uint256) {
        return projects[_projectId].totalDonated - withdrawnAmounts[_projectId];
    }
    
    /**
     * @dev 獲取項目已提取金額
     */
    function getWithdrawnAmount(uint256 _projectId) public view projectExists(_projectId) returns (uint256) {
        return withdrawnAmounts[_projectId];
    }
    
    /**
     * @dev 獲取合約餘額
     */
    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }
} 