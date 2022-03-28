import React from "react";
import { BigNumber, ethers } from "ethers";
import Axios from "axios";
import CardDetail from "./CardDetail";
import otoAbi from "../ABI/otoAbi.json";
import wavaxAbi from "../wavaxAbi.json";

class OtoClassBased extends React.Component {
	constructor(props) {
		super(props);

		const avaxProvider = new ethers.providers.getDefaultProvider(
			"https://api.avax.network/ext/bc/C/rpc"
		);

		const firepitAddress = "0x000000000000000000000000000000000000dEaD";
		const treasuryAddress = "0xa225478725BE5F5ae612182Db99547e4dA86E66E";
		const vaultAddress = "0xAc9c036aF64Ad44a83acB7786e6942944949147D";

		const lpPair = "0x59Bd5b0edEDb3f4f5b37CB16F07636152FDb418c";

		const wavaxContract = new ethers.Contract(
			"0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7",
			wavaxAbi,
			avaxProvider
		);

		const otoContract = new ethers.Contract(
			"0x3e5a9F09923936427aD6e487b24E23a862FCf6b7",
			otoAbi,
			avaxProvider
		);

		this.state = {
			avaxProvider: avaxProvider,
			firepitAddress: firepitAddress,
			treasuryAddress: treasuryAddress,
			vaultAddress: vaultAddress,
			lpPair: lpPair,
			avaxPrice: 0,
			otoContract: otoContract,
			wavaxContract: wavaxContract,
			tokenDecimal: 5,
			otoPrice: 0,
			value: 0,
			result: 0,
			tokenSupply: {
				totalSupply: 0,
				circulatingSupply: 0,
				firepitPercentage: 0,
			},
			taxReceiverBalances: {
				treasury: 0,
				vault: 0,
				firepit: 0,
			},
			lpBalance: {
				avax: null,
				token: null,
			},
			signerAddy: "",
			signerBalance: 0,
			initRebasedTime: 0,
		};

		this.handleCalculateChange = this.handleCalculateChange.bind(this);
	}

	tokenFormatEther(value) {
		return ethers.utils.formatUnits(value, this.state.tokenDecimal);
	}

	wavaxFormatEther(value) {
		return ethers.utils.formatUnits(value, 18);
	}

	async getLPBalance() {
		const avaxBalance = await this.state.wavaxContract.balanceOf(
			this.state.lpPair
		);
		const tokenBalance = await this.state.otoContract.balanceOf(
			this.state.lpPair
		);
		this.setState({
			lpBalance: {
				avax: ethers.utils.formatUnits(avaxBalance, 18),
				token: this.tokenFormatEther(tokenBalance),
			},
		});
	}

	async getTaxReceiverBalances() {
		const firepitBalance = await this.state.otoContract.balanceOf(
			this.state.firepitAddress
		);
		const vaultBalance = await this.state.wavaxContract.balanceOf(
			this.state.vaultAddress
		);
		const treasuryBalance = await this.state.wavaxContract.balanceOf(
			this.state.treasuryAddress
		);
		this.setState({
			taxReceiverBalances: {
				firepit: this.tokenFormatEther(firepitBalance),
				vault: this.wavaxFormatEther(vaultBalance),
				treasury: this.wavaxFormatEther(treasuryBalance),
			},
		});
	}

	getTokenPrice() {
		if (
			this.state.lpBalance.avax &&
			this.state.lpBalance.token &&
			this.state.avaxPrice
		) {
			const avaxBalanceInUsd = this.state.lpBalance.avax * this.state.avaxPrice;
			const tokenPrice = (
				avaxBalanceInUsd / this.state.lpBalance.token
			).toFixed(this.state.tokenDecimal);
			this.setState({ otoPrice: tokenPrice });
		} else {
			return 0;
		}
	}
	async getTotalSupply() {
		let totalSupply;
		let firepitSupply = this.state.taxReceiverBalances.firepit;
		let firepitPercentage;
		const response = await this.state.otoContract._totalSupply();
		totalSupply = this.tokenFormatEther(response);
		firepitPercentage = ((firepitSupply / totalSupply) * 100).toFixed(2);
		this.setState({
			tokenSupply: {
				totalSupply: totalSupply,
				circulatingSupply: totalSupply - firepitSupply,
				firepitPercentage: firepitPercentage,
			},
		});
	}

	async getInitRebasedTime() {
		const startTime = await this.state.otoContract._initRebaseStartTime();
		let startTimeNumber = startTime.toNumber();
		this.setState({
			initRebasedTime: startTimeNumber
		});
	}

	getSecondsPastLastRebased() {
		const currentTime = Math.floor(new Date().getTime()/1000.0); //use epochconverter.com 's way to get without milliseconds
		console.log('currentTIme', currentTime);

		const difference = (currentTime - this.state.initRebasedTime); //900 because 60 * 15. 
		console.log('difference', difference);
		const secondsPastLastRebase = difference % 900;
		console.log('secondsPastLastRebase', secondsPastLastRebase);
	}

	getTokenInUsd(balance) {
		if (this.state.otoPrice) {
			return balance * this.state.otoPrice;
		}
	}

	handleCalculateChange(event) {
		let days = event.target.value;
		this.setState({ value: days });
		const rebaseTimesPerDay = 96;
		const rebaseRate = 0.02355 / 100;
		const tokenAmount = 7103; //dynamic from another input field
		let amountOfToken = this.calculateCompoundingRate(
			tokenAmount,
			rebaseTimesPerDay * days,
			rebaseRate
		);
		this.setState({ result: amountOfToken });
	}

	// var days = 1;
	// var amount = 1080;
	// for (var i = 0; i < 96 * days; i++) {
	// 	amount += amount * 0.0002355;
	// }

	calculateCompoundingRate(amount, rebaseTimes, rate) {
		for (var i = 0; i < rebaseTimes; i++) {
			amount += amount * rate;
		}
		return amount;
	}

	async componentDidMount() {
		await Axios.get(
			"https://api.coinstats.app/public/v1/coins/avalanche-2"
		).then((response) => {
			this.setState({ avaxPrice: response.data.coin.price });
		});
		await this.getLPBalance();
		await this.getTaxReceiverBalances();
		await this.getTotalSupply();
		await this.getTokenPrice();
		await this.getInitRebasedTime();
		this.getSecondsPastLastRebased();
	}

	connectWallet = async () => {
		const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
		await provider.send("eth_requestAccounts", []);
		let signer = await provider.getSigner();
		if (!this.state.signerAddy) {
			signer.signMessage("Connect Wallet to OTO");
		}
		let signerAddy = await signer.getAddress();
		this.setState({ signerAddy: signerAddy });
		//HIDE Connect wallet button once signerAddy has value
	};

	getSignerBalance = async () => {
		if (!this.state.signerAddy) {
			await this.connectWallet();
		} else {
			const balancePromise = await this.state.otoContract.balanceOf(
				this.state.signerAddy
			);
			const balance = this.tokenFormatEther(balancePromise);
			this.setState({ signerBalance: balance });
		}
	};

	render() {
		return (
			<div className="ui cards">
				<CardDetail>
					<button className="ui basic button" onClick={this.connectWallet}>
						<i className="money bill alternate user"></i>
						Connect Wallet
					</button>
				</CardDetail>
				<CardDetail result={this.state.signerBalance}>
					<button className="ui basic button" onClick={this.getSignerBalance}>
						<i className="money bill alternate user"></i>
						Get Balance
					</button>
				</CardDetail>
				<CardDetail header="Avax Price" desc={this.state.avaxPrice} />
				<CardDetail header="OTO Price" desc={this.state.otoPrice} />
				<CardDetail
					header="OTO Total Supply"
					desc={this.state.tokenSupply.totalSupply}
				/>
				<CardDetail
					header="OTO Circulating Supply"
					desc={this.state.tokenSupply.circulatingSupply}
				/>
				<CardDetail
					header="Firepit Percentage"
					desc={this.state.tokenSupply.firepitPercentage}
				/>
				<CardDetail
					header="Firepit Balance"
					desc={this.state.taxReceiverBalances.firepit}
				/>
				<CardDetail
					header="Treasury Balance"
					desc={this.state.taxReceiverBalances.treasury}
				/>
				<CardDetail
					header="Vault Balance"
					desc={this.state.taxReceiverBalances.vault}
				/>
				<CardDetail result={this.state.result} days={this.state.value}>
					<div className="ui input focus">
						<input
							type="number"
							value={this.state.value}
							onChange={this.handleCalculateChange}
							placeholder="Days"
						/>
					</div>
				</CardDetail>
			</div>
		);
	}
}

export default OtoClassBased;
