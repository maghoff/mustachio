function reactComponent(React) {
	return React.createElement('p', null, 'Hello, World at ' + (new Date()));
}

if (typeof module !== 'undefined') module.exports = reactComponent;
