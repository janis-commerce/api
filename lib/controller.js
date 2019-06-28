'use strict';

const path = require('path');

class Controller {

	static get moduleFilePath() {
		return path.join(process.cwd(), 'node_modules', '@janiscommerce/model-controller');
	}

	static getControllerModule() {
		if(typeof this._Controller === 'undefined') {
			try {
				const { Controller } = require(this.moduleFilePath);  //eslint-disable-line
				this._Controller = Controller;
			} catch(err) {
				throw new Error('Package \'@janiscommerce/model-controller\' not installed. Please run: npm install @janiscommerce/model-controller');
			}
		}

		return this._Controller;
	}

	static get(controllerName) {
		return this.getControllerModule()
			.getInstance(controllerName);
	}

}

module.exports = Controller;
