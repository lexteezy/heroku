import React from "react";

const CardDetail = (props) => {
	return (
		<div className="card">
			<div className="content">
				<div className="header">{props.header}</div>
				<div className="meta">{props.meta}</div>
				<div className="description">{props.desc}</div>
			</div>
		</div>
	);
};

export default CardDetail;
