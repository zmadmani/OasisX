import React, { Component } from 'react'
import { ethers } from 'ethers';
import { Input, Form } from 'semantic-ui-react'

import './settings.css'

class Settings extends Component {
  constructor(props) {
    super(props)
    this.state = {
      gasPriceGwei: ethers.utils.formatUnits(this.props.options.gasPrice.toString(), 'gwei'),
      buttonStatus: "UPDATE"
    }
  }

  changeGasPrice = (gasPriceGwei) => {
    this.setState({ gasPriceGwei })
  }

  submit = () => {
    const { gasPriceGwei } = this.state;
    const { setGasPrice } = this.props;

    if(setGasPrice(gasPriceGwei)) {
      this.flashSuccess();
    } else {
      this.flashError();
    }
  }

  reset = () => {
    this.setState({ buttonStatus: "UPDATE" })
  }

  flashSuccess = () => {
    this.setState({ buttonStatus: "SUCCESS" });
    setTimeout(this.reset, 1500)
  }

  flashError = () => {
    this.setState({ buttonStatus: "FAILED" })
    setTimeout(this.reset, 1500)
  }

  render() {
    let { gasPriceGwei, buttonStatus } = this.state;
    const { options } = this.props;

    var buttonColor = "";
    if (buttonStatus === "SUCCESS") {
      buttonColor = 'green';
    } else if (buttonStatus === "FAILED") {
      buttonColor = 'red';
    }

    return (
      <div className="Settings">
        <div id="Settings-title">Settings</div>
        <Form onSubmit={this.handleSubmit} size='tiny' id="Settings-form">
          <div className="Settings-headers">Gas Price ({ethers.utils.formatUnits(options.gasPrice, 'gwei')}) <span id="Settings-warning"><a href='https://ethgasstation.info/' rel="noopener noreferrer" target="_blank">ETHER GAS STATION</a></span></div>
          <Form.Group unstackable className="Settings-formgroup">
            <Form.Field width={11}>
              <Input
                label={{ basic: true, content: "GWEI" }}
                labelPosition='right'
                placeholder='Enter Gas Price'
                value={gasPriceGwei}
                onChange={(e) => { this.changeGasPrice(e.target.value) }}
              />
            </Form.Field>
            <Form.Button color={buttonColor} width={5} className="Settings-button" onClick={ this.submit } >{buttonStatus}</Form.Button>
          </Form.Group>
        </Form>
      </div>
    );
  }
}

export default Settings
