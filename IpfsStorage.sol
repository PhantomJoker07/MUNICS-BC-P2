//SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

contract IpfsStorage {

    // STRUCTS
    struct File {
        address owner;
        string   addr;
        mapping (address => bool) userHasReadAccess;
        mapping (address => bool) userHasWriteAccess;
        bool    isPublic;
        bool    Erased;
    }


    //GlOBAL VARIABLES
    File[] private files;
    uint private fileCount;
    mapping (address => uint[]) private userOwnedFiles;


    //SET PARAMETERS
    function setWriteAccess(address user, uint fileIndex, bool value) public validIndex(fileIndex) onlyOwner(fileIndex) {
        files[fileIndex].userHasWriteAccess[user] = value;
    }

    function setReadAccess(address user, uint fileIndex, bool value) public validIndex(fileIndex) onlyOwner(fileIndex) {
        files[fileIndex].userHasReadAccess[user] = value;
    }

    function setPublicFlag(uint fileIndex, bool value) public validIndex(fileIndex) onlyOwner(fileIndex) {
        files[fileIndex].isPublic = value;
    }


    //MODIFIERS
     modifier validRead(uint fileIndex) {
        require(files[fileIndex].userHasReadAccess[msg.sender] || files[fileIndex].isPublic);
        _;
    }

    modifier validWrite(uint fileIndex) {
        require(files[fileIndex].userHasWriteAccess[msg.sender]);
        _;
    }

    modifier onlyOwner(uint fileIndex){
        require(files[fileIndex].owner==msg.sender);
        _;
    }

    modifier validIndex(uint fileIndex) {
        require (fileIndex >= 0 && fileIndex < fileCount);
        require(!files[fileIndex].Erased);
        _;
    } 


    //MAIN METHODS
    function addFileIPFS(string memory file) external returns (uint index){
        File storage newFile = files.push(); 
        newFile.owner = msg.sender;
        newFile.addr = file;
        userOwnedFiles[msg.sender].push(fileCount);
        newFile.isPublic = true;
        fileCount++;
        setReadAccess(msg.sender, fileCount - 1, true);
        setWriteAccess(msg.sender, fileCount - 1, true);
        return fileCount - 1;
    }

    function readFileIPFS(uint fileIndex) external view validIndex(fileIndex) validRead(fileIndex) returns (string memory file) {
        return files[fileIndex].addr;
    }

    function editFileIPFS(uint oldFileIndex, string memory newFile) external validIndex(oldFileIndex) validWrite(oldFileIndex) {
        files[oldFileIndex].addr = newFile;
    }

    function deleteFileIPFS(uint fileIndex) external validIndex(fileIndex) validWrite(fileIndex) returns (string memory _file) {
        files[fileIndex].Erased = true;
        return files[fileIndex].addr;
    }

    function getPublicFilesIPFS() external view returns (uint[] memory filesIndex) {
        bool [] memory defaultAns = new bool[](fileCount);
        uint publicFilesCount = 0;
        for (uint i = 0; i < fileCount; i++){
            if (files[i].isPublic && !files[i].Erased) {
                defaultAns[i] = true;
                publicFilesCount++;
            }
        }
        uint [] memory ans = new uint[](publicFilesCount);
        uint j = 0;
        for (uint i = 0; i < fileCount; i++){
            if(defaultAns[i]){
                ans[j] = i;
                j++;
            }
        }
        return ans;
    }

    function getFilesOwnedIPFS() external view returns (uint[] memory filesIndex) {
        uint _fileCount = userOwnedFiles[msg.sender].length;
        bool [] memory defaultAns = new bool[](_fileCount);
        uint ownedFilesCount = 0;
        for (uint i = 0; i < fileCount; i++){
            uint index = userOwnedFiles[msg.sender][i];
            if (!files[index].Erased) {
                defaultAns[i] = true;
                ownedFilesCount++;
            }
        }
        uint [] memory ans = new uint[](ownedFilesCount);
        uint j = 0;
        for (uint i = 0; i < fileCount; i++){
            if(defaultAns[i]){
                ans[j] = i;
                j++;
            }
        }
        return ans;
    }

}