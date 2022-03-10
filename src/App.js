import logo from './logo.svg';
import './App.css';
import strongNodeAbi from "./strongNodeAbi.json";
import playmateNodeAbi from "./playmateNodeAbi.json";
import thorNodeAbi from "./thorNodeAbi.json";
import nodacAbi from "./nodacAbi.json";
import { ethers } from "ethers";
import { useState, useEffect } from 'react';


function App() {
  const [strongNodeCount, setStrongNodeCount] = useState(0);
  const [playmatesNodeCount, setPlaymatesNodeCount] = useState(0);
  const [thorNodeCount, setThorNodeCount] = useState(0);
  const [userTotalEarnings, setUserTotalEarnings] = useState({
    realizedGains: 0,
    unpaidEarnings: 0
  });
  const [userFTMTotalEarnings, setUserFTMTotalEarnings] = useState({
    realizedGains: 0,
    unpaidEarnings: 0
  });
  const [userAVAXTotalEarnings, setUserAVAXTotalEarnings] = useState({
    realizedGains: 0,
    unpaidEarnings: 0
  });
  const [count, setCount] = useState(0);

  let strongNodeContract;
  let playmateNodeContract;
  let thorNodeContract;

  let signer;
  let signerAddy;



  const marketingWallet = "0xEd56a7F78b830518ff00808e2bAff0F4bDc722Ed";


  useEffect(() => {
    // const provider = new ethers.providers.Web3Provider(window.ethereum);
    const ethProvider = new ethers.providers.getDefaultProvider(1);
    strongNodeContract = new ethers.Contract(
      "0xFbdDaDD80fe7bda00B901FbAf73803F2238Ae655",
      strongNodeAbi,
      ethProvider
    );
    const avaxProvider = new ethers.providers.getDefaultProvider("https://api.avax.network/ext/bc/C/rpc");
    playmateNodeContract = new ethers.Contract(
      "0xc4a25F823582d9ccf5cf8C8BF5338073e7a51676",
      playmateNodeAbi,
      avaxProvider
    );
    thorNodeContract = new ethers.Contract(
      "0x2be139283d73Cd3a335A94c50BA2B28fdE1E06E1",
      thorNodeAbi,
      avaxProvider
    );

    // const ftmProvider = new ethers.providers.getDefaultProvider("https://rpcapi.fantom.network");

    // nodacContract = new ethers.Contract(
    //   "0x803e78269f7F013b7D13ba13243Be10C66418a70",
    //   nodacAbi,
    //   ftmProvider
    // );


    getStrongNodeCount();
    getPlaymatesNodeCount();
    getThorNodeCount();
    if(signerAddy) {
      getDynamicUserTotalEarnings("https://rpcapi.fantom.network", "FTM");
      getDynamicUserTotalEarnings("https://api.avax.network/ext/bc/C/rpc", "AVAX");
    }
    setCount(count + 1);
  }, [count === 1]);


  const getStrongNodeCount = async () => {
    // const provider = new ethers.providers.Web3Provider(window.ethereum);
    // const provider = new ethers.providers.getDefaultProvider(1);
    const strongNodeCount = await strongNodeContract.entityNodeCount(marketingWallet);

    setStrongNodeCount(String(strongNodeCount));
  }

  const getPlaymatesNodeCount = async () => {
    const playmatesNodeCount = await playmateNodeContract.balanceOf(marketingWallet);

    setPlaymatesNodeCount(String(playmatesNodeCount));
  }

  const getThorNodeCount = async () => {
    const thorNodeCount = await thorNodeContract.getNodeNumberOf(marketingWallet);

    setThorNodeCount(String(thorNodeCount));
  }

  const conenctWallet = async() => {
    console.log("connect Wallet");
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
    await provider.send("eth_requestAccounts", []);
    signer = await provider.getSigner();
    signerAddy = await signer.getAddress();
    getDynamicUserTotalEarnings("https://rpcapi.fantom.network", "FTM");
    getDynamicUserTotalEarnings("https://api.avax.network/ext/bc/C/rpc", "AVAX");
  }

  const getUserTotalEarnings = async() => {
    const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
    await provider.send("eth_requestAccounts", []);
    console.log(provider);
    const nodac = new ethers.Contract(
      "0x803e78269f7F013b7D13ba13243Be10C66418a70",
      nodacAbi,
      provider
    );
    const signer = await provider.getSigner();
    const signerAddress = await signer.getAddress();
    const totalEarnings = await nodac.getUserRealizedGains(signerAddress);
    const unpaidEarnings = await nodac.getUserUnpaidEarnings(signerAddress);

    setUserTotalEarnings({
      realizedGains: String(ethers.utils.formatUnits(totalEarnings, 18)),
      unpaidEarnings: String(ethers.utils.formatUnits(unpaidEarnings, 18))
    });
    
  }

  
  const getDynamicUserTotalEarnings = async(providerRpc, network) => {
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    const dynamicProvider = new ethers.providers.getDefaultProvider(providerRpc);
    //provider to get address from metamask
    const nodac = new ethers.Contract(
      "0x803e78269f7F013b7D13ba13243Be10C66418a70",
      nodacAbi,
      dynamicProvider
    );
    const totalEarnings = ethers.utils.formatUnits(await nodac.getUserRealizedGains(signerAddy));
    const unpaidEarnings = ethers.utils.formatUnits(await nodac.getUserUnpaidEarnings(signerAddy));
    const simplifiedTotEarns = (Math.round(totalEarnings * 100) / 100).toFixed(2);
    const simplifiedUnpaidEarns = (Math.round(unpaidEarnings * 100) / 100).toFixed(2);
    if(network === "FTM") {
      setUserFTMTotalEarnings({
        realizedGains: String(simplifiedTotEarns),
        unpaidEarnings: String(simplifiedUnpaidEarns)
      });
    } else if(network === "AVAX") {
      setUserAVAXTotalEarnings({
        realizedGains: String(simplifiedTotEarns),
        unpaidEarnings: String(simplifiedUnpaidEarns)
      });
    }
    
  }

  const giveMeWelfarePlease = async() => {
    const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
    console.log(provider);
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();
    const nodac = new ethers.Contract(
      "0x803e78269f7F013b7D13ba13243Be10C66418a70",
      nodacAbi,
      signer
    );
    await nodac.giveMeWelfarePlease();

    getUserTotalEarnings();
  }
  

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <button onClick={conenctWallet}
        type="submit">
          Connect Wallet
        </button>
        <p>
          Strong Node Count is {strongNodeCount}
        </p>
        <p>
          Playmates Node Count is {playmatesNodeCount}
        </p>
        <p>
          Thor Node Count is {thorNodeCount}
        </p>

        <button onClick={getUserTotalEarnings}
        type="submit">
          Get User Total Earnings
        </button>
        <table>
          <thead>
            <tr>
              <th>Total Earnings</th>
              <th>Unrealized Gains</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                {userTotalEarnings.realizedGains}
              </td>
              <td>
                {userTotalEarnings.unpaidEarnings}
              </td>
            </tr>
          </tbody>
        </table>
        <button onClick={giveMeWelfarePlease}
        type="submit">
          Claim Dividend
        </button>
        <table>
          <thead>
            <tr>
              <th rowSpan={2}>FTM</th>
            </tr>
            <tr>
              <th>Total Earnings</th>
              <th>Unrealized Gains</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                {userFTMTotalEarnings.realizedGains}
              </td>
              <td>
                {userFTMTotalEarnings.unpaidEarnings}
              </td>
            </tr>
          </tbody>
        </table>
        <table>
          <thead>
            <tr>
              <th rowSpan={2}>AVAX</th>
            </tr>
            <tr>
              <th>Total Earnings</th>
              <th>Unrealized Gains</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                {userAVAXTotalEarnings.realizedGains}
              </td>
              <td>
                {userAVAXTotalEarnings.unpaidEarnings}
              </td>
            </tr>
          </tbody>
        </table>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
