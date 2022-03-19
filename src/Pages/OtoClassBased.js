import React from "react";
import { ethers } from "ethers";
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
		};

		this.handleCalculateChange = this.handleCalculateChange.bind(this);
	}

	tokenFormatEther(value) {
		return ethers.utils.formatUnits(value, this.state.tokenDecimal);
	}

	getLPBalance() {
		let avaxBalance;
		let tokenBalance;
		this.state.wavaxContract.balanceOf(this.state.lpPair).then((res) => {
			avaxBalance = ethers.utils.formatUnits(res, 18);
			this.setState((prevState) => ({
				lpBalance: {
					...prevState.lpBalance,
					avax: avaxBalance,
				},
			}));
		});
		this.state.otoContract.balanceOf(this.state.lpPair).then((res) => {
			tokenBalance = this.tokenFormatEther(res);
			this.setState((prevState) => ({
				lpBalance: {
					...prevState.lpBalance,
					token: tokenBalance,
				},
			}));
		});
	}

	getTaxReceiverBalances() {
		let firepitBalance;
		let vaultBalance;
		let treasuryBalance;
		this.state.otoContract.balanceOf(this.state.firepitAddress).then((res) => {
			firepitBalance = this.tokenFormatEther(res);
			this.setState((prevState) => ({
				taxReceiverBalances: {
					...prevState.taxReceiverBalances,
					firepit: firepitBalance,
				},
			}));
		});
		this.state.otoContract.balanceOf(this.state.vaultAddress).then((res) => {
			vaultBalance = this.tokenFormatEther(res);
			this.setState((prevState) => ({
				taxReceiverBalances: {
					...prevState.taxReceiverBalances,
					vault: vaultBalance,
				},
			}));
		});
		this.state.otoContract.balanceOf(this.state.treasuryAddress).then((res) => {
			treasuryBalance = this.tokenFormatEther(res);
			this.setState((prevState) => ({
				taxReceiverBalances: {
					...prevState.taxReceiverBalances,
					treasury: treasuryBalance,
				},
			}));
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

	getTotalSupply() {
		let totalSupply;
		let firepitSupply = this.state.taxReceiverBalances.firepit;
		let firepitPercentage;
		this.state.otoContract._totalSupply().then((res) => {
			totalSupply = ethers.utils.formatUnits(res, this.state.tokenDecimal);
			firepitPercentage = ((firepitSupply / totalSupply) * 100).toFixed(2);
			this.setState({
				tokenSupply: {
					totalSupply: totalSupply,
					circulatingSupply: totalSupply - firepitSupply,
					firepitPercentage: firepitPercentage,
				},
			});
		});
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
		const rebaseRate = 0.02355 / 100; // 0.02355 or 0.02362 depende kay boss KEK
		const tokenAmount = 1;
		let amountOfToken = this.calculateCompoundingRate(
			tokenAmount,
			rebaseTimesPerDay * days,
			rebaseRate
		);
		this.setState({ result: amountOfToken });
	}

	calculateCompoundingRate(amount, rebaseTimes, rate) {
		for (var i = 0; i < rebaseTimes; i++) {
			amount += (amount * rate);
		}
		return amount;
	}

	componentDidMount() {
		Axios.get("https://api.coinstats.app/public/v1/coins/avalanche-2").then(
			(response) => {
				this.setState({ avaxPrice: response.data.coin.price });
			}
		);
		this.getLPBalance();
		this.getTotalSupply();
		this.getTaxReceiverBalances();
		// this.getTokenPrice();
	}

	render() {
		return (
			<div className="ui cards">
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
