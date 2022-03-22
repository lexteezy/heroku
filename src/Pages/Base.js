import logo from "../logo.svg";
import "../App.css";
import strongNodeAbi from "../strongNodeAbi.json";
import playmateNodeAbi from "../playmateNodeAbi.json";
import thorNodeAbi from "../thorNodeAbi.json";
import nodacAbi from "../nodacAbi.json";
import wavaxAbi from "../wavaxAbi.json";
import { ethers } from "ethers";
import { useState, useEffect } from "react";
import Axios from "axios";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";

function Base() {
	const [strongNodeCount, setStrongNodeCount] = useState(0);
	const [playmatesNodeCount, setPlaymatesNodeCount] = useState(0);
	const [thorNodeCount, setThorNodeCount] = useState(0);
	const [userFTMTotalEarnings, setUserFTMTotalEarnings] = useState({
		balance: 0,
		realizedGains: 0,
		unpaidEarnings: 0,
	});
	const [userAVAXTotalEarnings, setUserAVAXTotalEarnings] = useState({
		balance: 0,
		realizedGains: 0,
		unpaidEarnings: 0,
	});
	const [nodacPrice, setNodacPrice] = useState(0);
	const [count, setCount] = useState(0);
	const [days, setDays] = useState(0);
	let state = { value: "" };

	let strongNodeContract;
	let playmateNodeContract;
	let thorNodeContract;
	let wavaxContract;
	let nodacContract;

	let signer;
	let signerAddy;
	let avaxPrice;
	//6dd32a74-9045-42f3-8796-02bb32573fbe API KEY

	const marketingWallet = "0xEd56a7F78b830518ff00808e2bAff0F4bDc722Ed";

	useEffect(() => {
		// const provider = new ethers.providers.Web3Provider(window.ethereum);
		Axios.get("https://api.coinstats.app/public/v1/coins/avalanche-2").then(
			(response) => {
				console.log(response.data);
				avaxPrice = response.data.coin.price;
				console.log("avaxPrice ", avaxPrice);
			}
		);
		const ethProvider = new ethers.providers.getDefaultProvider(1);
		strongNodeContract = new ethers.Contract(
			"0xFbdDaDD80fe7bda00B901FbAf73803F2238Ae655",
			strongNodeAbi,
			ethProvider
		);
		const avaxProvider = new ethers.providers.getDefaultProvider(
			"https://api.avax.network/ext/bc/C/rpc"
		);
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
		wavaxContract = new ethers.Contract(
			"0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7",
			wavaxAbi,
			avaxProvider
		);
		nodacContract = new ethers.Contract(
			"0x803e78269f7F013b7D13ba13243Be10C66418a70",
			nodacAbi,
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
		if (signerAddy) {
			getDynamicUserTotalEarnings("https://rpcapi.fantom.network", "FTM");
			getDynamicUserTotalEarnings(
				"https://api.avax.network/ext/bc/C/rpc",
				"AVAX"
			);
		}
		getNodacPrice();
		setCount(count + 1);
	}, [count === 1]);

	const getStrongNodeCount = async () => {
		// const provider = new ethers.providers.Web3Provider(window.ethereum);
		// const provider = new ethers.providers.getDefaultProvider(1);
		const strongNodeCount = await strongNodeContract.entityNodeCount(
			marketingWallet
		);

		setStrongNodeCount(String(strongNodeCount));
	};

	const getPlaymatesNodeCount = async () => {
		const playmatesNodeCount = await playmateNodeContract.balanceOf(
			marketingWallet
		);

		setPlaymatesNodeCount(String(playmatesNodeCount));
	};

	const getThorNodeCount = async () => {
		const thorNodeCount = await thorNodeContract.getNodeNumberOf(
			marketingWallet
		);

		setThorNodeCount(String(thorNodeCount));
	};

	const conenctWallet = async () => {
		console.log("connect Wallet");
		await window.ethereum.request({ method: "eth_requestAccounts" });
		const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
		await provider.send("eth_requestAccounts", []);
		signer = await provider.getSigner();
		signerAddy = await signer.getAddress();
		getDynamicUserTotalEarnings("https://rpcapi.fantom.network", "FTM");
		getDynamicUserTotalEarnings(
			"https://api.avax.network/ext/bc/C/rpc",
			"AVAX"
		);
	};

	const getNodacPrice = async () => {
		const avaxBalance = ethers.utils.formatUnits(
			await wavaxContract.balanceOf(
				"0xE175bd0B421331BfA06E619b77A022Ec98899aC3"
			),
			18
		);
		const nodacBalance = ethers.utils.formatUnits(
			await nodacContract.balanceOf(
				"0xE175bd0B421331BfA06E619b77A022Ec98899aC3"
			),
			18
		);
		console.log("avaxBalance ", avaxBalance, 18);
		console.log("nodacBalance ", nodacBalance, 18);
		const avaxBalanceInUsd = avaxBalance * avaxPrice;
		console.log(avaxPrice);
		console.log("avaxInUsd ", avaxBalanceInUsd);
		const nodacPrice = avaxBalanceInUsd / nodacBalance;
		console.log(nodacPrice);
		setNodacPrice(nodacPrice);
	};

	const getDynamicUserTotalEarnings = async (providerRpc, network) => {
		await window.ethereum.request({ method: "eth_requestAccounts" });
		const dynamicProvider = new ethers.providers.getDefaultProvider(
			providerRpc
		);
		//provider to get address from metamask
		const nodac = new ethers.Contract(
			"0x803e78269f7F013b7D13ba13243Be10C66418a70",
			nodacAbi,
			dynamicProvider
		);
		const balance = ethers.utils.formatUnits(await nodac.balanceOf(signerAddy));
		const totalEarnings = ethers.utils.formatUnits(
			await nodac.getUserRealizedGains(signerAddy)
		);
		const unpaidEarnings = ethers.utils.formatUnits(
			await nodac.getUserUnpaidEarnings(signerAddy)
		);
		const simplifiedBalance = (Math.round(balance * 100) / 100).toFixed(2);
		const simplifiedTotEarns = (Math.round(totalEarnings * 100) / 100).toFixed(
			2
		);
		const simplifiedUnpaidEarns = (
			Math.round(unpaidEarnings * 100) / 100
		).toFixed(2);
		if (network === "FTM") {
			setUserFTMTotalEarnings({
				balance: String(simplifiedBalance),
				realizedGains: String(simplifiedTotEarns),
				unpaidEarnings: String(simplifiedUnpaidEarns),
			});
		} else if (network === "AVAX") {
			setUserAVAXTotalEarnings({
				balance: String(simplifiedBalance),
				realizedGains: String(simplifiedTotEarns),
				unpaidEarnings: String(simplifiedUnpaidEarns),
			});
		}
	};

	// const calculateRewards = async (event) => {
	//   //enter days value
	//   const format =  1;
	//   console.log('format',format);
	//   const rebaseRate = 0.02362;
	//   const rebaseTimePerDay = (60 * 24) / 15;
	//   const nextYield = rebaseRate / 100;
	//   console.log(nextYield);
	//   let tokenAmount = format;
	//   const originalTokenAmount = tokenAmount;
	//   console.log('rebaseRate', rebaseRate);
	//   console.log('rebaseTimePerDay', rebaseTimePerDay);
	//   tokenAmount = tokenAmount * Math.pow((1+nextYield),96 * days);
	//   console.log(tokenAmount);
	//   tokenAmount = Number(tokenAmount).toFixed(2);
	//   // tokenAmount -= originalTokenAmount;
	//   console.log('originalTokenAmount', originalTokenAmount);
	//   console.log('tokenAmountAfter', days,'days: ', tokenAmount);
	// }

	const giveMeWelfarePlease = async () => {
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
	};

	return (
		<div className="App">
			<header className="App-header">
				<img src={logo} className="App-logo" alt="logo" />
				<button onClick={conenctWallet} type="submit">
					Connect Wallet
				</button>
				<p>Strong Node Count is {strongNodeCount}</p>
				<p>Playmates Node Count is {playmatesNodeCount}</p>
				<p>Thor Node Count is {thorNodeCount}</p>
				<p>NodacPrice is {nodacPrice}</p>
				<button onClick={giveMeWelfarePlease} type="submit">
					Claim Dividend
				</button>
				<table>
					<thead>
						<tr>
							<th>Balance</th>
							<th>Total Earnings</th>
							<th>Unrealized Gains</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>{userFTMTotalEarnings.balance}</td>
							<td>{userFTMTotalEarnings.realizedGains}</td>
							<td>{userFTMTotalEarnings.unpaidEarnings}</td>
						</tr>
					</tbody>
				</table>
				<table>
					<thead>
						<tr>
							<th>Balance</th>
							<th>Total Earnings</th>
							<th>Unrealized Gains</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>{userAVAXTotalEarnings.balance}</td>
							<td>{userAVAXTotalEarnings.realizedGains}</td>
							<td>{userAVAXTotalEarnings.unpaidEarnings}</td>
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
			<body></body>
		</div>
	);
}

export default Base;
