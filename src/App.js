import React, { useCallback, useEffect, useState } from "react";
import './App.css';
import { create } from 'kubo-rpc-client'
import { CID } from 'kubo-rpc-client'
import { ethers } from "ethers"
import { Buffer } from "buffer"
import logo from "./ethereumLogo.png"
import { addresses, abis } from "./contracts"

var filesIndex = [];
const ZERO_ADDRESS ="0x0000000000000000000000000000000000000000000000000000000000000000";
let client
const defaultProvider = new ethers.providers.Web3Provider(window.ethereum);
// version 6
//const defaultProvider = new ethers.BrowserProvider(window.ethereum);
const ipfsContract = new ethers.Contract(
  addresses.ipfs,
  abis.ipfs,
  defaultProvider
);
//contract = new ethers.Contract(address, abi, defaultProvider);
// async function readCurrentUserFile() {
//   const result = await ipfsContract.userFiles(
//     defaultProvider.getSigner().getAddress()
//   );
//   console.log({ result });
//   return result;
// }

  function App() {
  const [ipfsHash, setIpfsHash] = useState("");
  //NEW//
  const [textPublicFiles, setTextPublicFiles] = useState("No files yet");
  const [textPersonalFiles, setTextPersonalFiles] = useState("No files yet");
  const [textOperationResult, setTextOperationResult] = useState("No operation yet");
  const [textChangePublicState, setChangePublicState] = useState("Default");
  //////

  useEffect(() => {
    window.ethereum.enable();
  }, []);
  /*
  *
  let abi = JSON.parse('[{"inputs": [{"internalType": "string","name": "file","type":
  "string"}],"name": "setFileIPFS","outputs": [],"stateMutability":
  "nonpayable","type": "function"},{"inputs": [{"internalType": "address","name":
  "","type": "address"}],"name": "userFiles","outputs": [{"internalType":
  "string","name": "","type": "string"}],"stateMutability": "view","type":
  "function"}]')
  let address = "0x7d2C909F0b4d2fb2993b92CC343A6834585831BF";
  *
  */
  let [connected, setConnected] = useState(false);
  const [file, setFile] = useState(null);
  // useEffect(() => {
  //   async function readFile() {
  //     const file = await readCurrentUserFile();
  //     if (file !== ZERO_ADDRESS) setIpfsHash(file);
  //   }
  //   readFile();
  // }, []);
  async function addFileIPFS(hash) {
    const ipfsWithSigner = ipfsContract.connect(defaultProvider.getSigner());
    console.log("TX contract");
    const tx = await ipfsWithSigner.addFileIPFS(hash);
    console.log({ tx });
    setIpfsHash(hash);
  }
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log(file)
      // conectar a la instancia en local de ipfs
      const client = await create('/ip4/127.0.0.1/tcp/5001')
      // añadir le archivo a ipfs
      const result = await client.add(file)
      // añadir al fs del nodo ipfs en local para poder visualizarlo en el dashboard
      await client.files.cp(`/ipfs/${result.cid}`, `/${result.cid}`)
      console.log(result.cid)
      // añadir el CID de ipfs a ethereum a traves del smart contract
      const index = await addFileIPFS(result.cid.toString());
    } catch (error) {
      console.log(error.message);
    }

  };
  const retrieveFile = (e) => {
    const data = e.target.files[0];
    const reader = new window.FileReader();
    reader.readAsArrayBuffer(data);
    console.log(data);
    reader.onloadend = () => {
      console.log("Buffer data: ", Buffer(reader.result));
      setFile(Buffer(reader.result));
    }
    e.preventDefault();
  }



//NEW METHODS//
async function getPublicFilesIPFS() {
  const ipfsWithSigner = ipfsContract.connect(defaultProvider.getSigner());
  console.log("TX contract");
  const tx = await ipfsWithSigner.getPublicFilesIPFS();
  console.log({ tx });
  return tx;
}

const getPublicFiles = async () => {
  setTextPublicFiles("working...");
  try {
    const index = await getPublicFilesIPFS();
    setTextPublicFiles(index.toString());
  } catch (error) {
    console.log(error.message);
    setTextPublicFiles(error.message);
  }

}

async function getPersonalFilesIPFS() {
  const ipfsWithSigner = ipfsContract.connect(defaultProvider.getSigner());
  console.log("TX contract");
  const tx = await ipfsWithSigner.getFilesOwnedIPFS();
  console.log({ tx });
  return tx;
}

const getPersonalFiles = async () => {
  setTextPersonalFiles("working...");
  try {
    const index = await getPersonalFilesIPFS();
    setTextPersonalFiles(index.toString());
  } catch (error) {
    console.log(error.message);
    setTextPersonalFiles(error.message);
  }

}

async function readFileIPFS(index) {
  const ipfsWithSigner = ipfsContract.connect(defaultProvider.getSigner());
  console.log("TX contract");
  const tx = await ipfsWithSigner.readFileIPFS(index);
  console.log({ tx });
  return tx;
}

async function deleteFileIPFS(index) {
  const ipfsWithSigner = ipfsContract.connect(defaultProvider.getSigner());
  console.log("TX contract");
  const tx = await ipfsWithSigner.deleteFileIPFS(index);
  console.log({ tx });
  return tx;
}


const operateWithFiles = async () => {
  var option = document.getElementById("optionsOWF").value;
  var input = document.getElementById("inputOWF").value;
  setTextOperationResult("working...");
  try{
    var strResult = "Error";
    if (option === "Read") {
      const result = await readFileIPFS(input);
      strResult = result.toString();
      if (strResult.length > 0){
        const client = await create('/ip4/127.0.0.1/tcp/5001');
        const res = await client.cat(`/${result}`);
        setTextOperationResult(strResult);
      }
      else {
        setTextOperationResult("No File");
      }
    }
    else if (option === "Delete") {
      const cid = await readFileIPFS(input)
      const result = await deleteFileIPFS(input);
      strResult = cid.toString();
      if (strResult.length > 0){
        const client = await create('/ip4/127.0.0.1/tcp/5001');
        const _cid = CID.parse(strResult);
        const _result = await client.pin.rm(_cid, {recursive: true, force: true});
        await client.files.rm(`/${cid}`);
        console.log(_result);
        setTextOperationResult(strResult);

      }
      else {
        setTextOperationResult("There is no file to delete!");
      }
    } 
    else if (option === "Edit"){
      //Unavaliable for now
    }
  } catch (error) {
    console.log(error.message);
    //setTextOperationResult(error.message);
    setTextOperationResult("The operation failed due to an error or insufficient privileges");
  }
  
}

async function setPublicFlag(input,value) {
  const ipfsWithSigner = ipfsContract.connect(defaultProvider.getSigner());
  console.log("TX contract");
  const tx = await ipfsWithSigner.setPublicFlag(input,value);
  console.log({ tx });
  return tx;
}
  
const changePublicState = async () => {
  var option = document.getElementById("optionsCPS").value;
  var input = document.getElementById("inputCPS").value;
  try {
    var value = false;
    if (option === "Public"){
      value = true;
    } 
    const result = await setPublicFlag(input,value);
    setChangePublicState("Visibility set to " + option);
  } catch (error) {
    console.log(error.message);
    //setChangePublicState(error.message);
    setChangePublicState("The operation failed due to an error or insufficient privileges");
  }
}

  return (
    <div className="App">
    <header className="App-header">
    <img src={logo} className="App-logo" alt="logo" />
    <p>
    Upload a file to store it on IPFS and save the hash on ethereum.
    </p>
    <form className="form" onSubmit={handleSubmit}>
    <input type="file" name="data" onChange={retrieveFile} />
    <button type="submit" className="btn">Upload</button>
    </form>
    </header>

  <header className="App-getFiles">
    <p>Show a list of available files:</p>
	<div class="GetFile-buttons">
    <button type="button" class="btn" onClick={getPublicFiles}>Public files</button>
    <p>Public Files: {textPublicFiles}</p>
    <button type="button" class="btn" onClick={getPersonalFiles}>Files Owned</button>
    <p>Files Owned: {textPersonalFiles}</p>
	</div>  
  </header>

  <header className="App-opFiles">
  <p>Operate with files</p>
	<form>
  		<label for="optionsOWF">Choose an option:</label>
  		<select id="optionsOWF">
    		<option value="Read">Read</option>
    		<option value="Delete">Delete</option>
  		</select>
	</form>
  <form>
  		<label for="inputOWF">Enter file index:</label>
  		<input type="number" id="inputOWF" placeholder="Enter file index"/>
	</form>
  <button type="button" class="btn" onClick={operateWithFiles}>Execute</button>
  <p>Result: {textOperationResult}</p>
  </header>

<header className="App-pubState">
<p>Change file public state</p>
<form>
  <label for="inputCPS">File index:</label>
  <input type="number" id="inputCPS" placeholder="Enter integer"/>
</form>

<form>
  <label for="optionsCPS">Status:</label>
  <select id="optionsCPS">
    <option value="Public">Public</option>
    <option value="Private">Private</option>
  </select>
</form>

<button type="button" class="btn" onClick={changePublicState}>Execute</button>
    <p>Result: {textChangePublicState}</p>
  </header>

    </div>
  );

}
export default App;
//http://0.0.0.0:5001/ipfs/bafybeibozpulxtpv5nhfa2ue3dcjx23ndh3gwr5vwllk7ptoyfwnfjjr4q/#/files