import React from "react";
import { Link } from "react-router-dom";

const NavigationBar = () => {
	return (
		<div className="navbar">
			<ul>
				<li>
					<Link to="/">Home</Link>
				</li>
				<li>
					<Link to="/oto">OTO</Link>
				</li>
				<li>
					<Link to="/otoclass">OTO Class Based</Link>
				</li>
				<li>
					<Link to="/content">Content</Link>
				</li>
			</ul>
		</div>
	);
};

export default NavigationBar;
