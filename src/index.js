import logo from "./logo.svg";
import strongNodeAbi from "./strongNodeAbi.json";
import playmateNodeAbi from "./playmateNodeAbi.json";
import thorNodeAbi from "./thorNodeAbi.json";
import nodacAbi from "./nodacAbi.json";
import wavaxAbi from "./wavaxAbi.json";
import { ethers } from "ethers";
import { useState, useEffect } from "react";
import Axios from "axios";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import Oto from "./Pages/Oto";
// import Base from "./Pages/Base";
import OtoClassBased from "./Pages/OtoClassBased";
import NavigationBar from "./NavigationBar";
import Content from "./Pages/Content";
import Home from "./Pages/Home";
import ReactDOM from "react-dom";
import React from "react";

const App = () => {
	return (
		<>
			<Router>
        <NavigationBar/>
				<Routes>
					<Route path="/" exact element={<Home />} />
					<Route path="/oto" element={<Oto />} />
					<Route path="/otoclass" element={<OtoClassBased />} />
					<Route path="/content" element={<Content/>}/>
				</Routes>
			</Router>
		</>
	);
};

ReactDOM.render(<App />, document.getElementById("root"));
