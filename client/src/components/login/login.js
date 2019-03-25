import React, { Component } from 'react'
import { Redirect } from 'react-router-dom';
import { Input, Button } from 'semantic-ui-react'
import './login.css'
import HumanName from '../utils/humanname/humanname'

class Login extends Component {
  constructor(props) {
    super(props)
    this.state = {
      selected: "",
      phrase: "",
      password: "",
      redirect: false,
      saved_wallets: {},
      loading: false
    }

    this.handleRedirect = this.handleRedirect.bind(this)
  }

  componentDidMount() {
    var saved_wallets = this.getSavedAccounts()
    this.setState({ saved_wallets })
  }

  handleFieldChange(name, value) {
    this.setState({ [name]: value })
  }

  handleRedirect() {
    this.setState({ redirect: true, loading: false })
  }

  getSavedAccounts() {
    var localStorage = window.localStorage
    if(localStorage.getItem("encrypted_wallets")) {
      var stored_wallets = JSON.parse(localStorage.getItem("encrypted_wallets"))
      return stored_wallets
    }
    return {}
  }

  async handleLogin() {
    var { phrase, password, selected } = this.state
    var { options } = this.props

    this.setState({ loading: true })

    if(selected === "" && phrase !== "") {
      options.handleLogin(phrase, password)
    } else if(selected !== "") {
      await options.handleReLogin(selected, this.state.saved_wallets[selected], password)
    } else {
      console.log("ERROR: No account specified")
    }

    this.setState({ phrase: "", password: "", selected: "" })
    setTimeout(this.handleRedirect, 1000)
  }

  render() {
    var { phrase, password, redirect, saved_wallets, selected, loading } = this.state
    var { options } = this.props

    if(redirect) {
      return <Redirect to="/" />
    }

    var wallet_list = Object.keys(saved_wallets).map((key) => {
      var active = selected === key ? true : false
      var classes = active ? 'Login-option Login-highlighted' : 'Login-option'
      var field_change = active ? "" : key
      field_change = loading ? this.state.selected : field_change
      return <div key={key} className={classes} onClick={() => this.handleFieldChange("selected", field_change) } ><HumanName address={key} inactive_link /></div>
    })

    return (
      <div id="Login">
        <div className="LimitOrder-headers">Login</div>
        <div id="Login-wallets">
          {wallet_list}
        </div>
        <br />
        <Input
          label={{ content: "Mneumonic Phrase" }}
          labelPosition='left'
          placeholder='Enter Phrase...'
          value={phrase}
          onChange={(e) => { this.handleFieldChange("phrase", e.target.value) }}
          disabled={!options.readOnly || selected !== "" || loading}
          className="Login-input"
          fluid
        />
        <Input
          label={{ content: "Password" }}
          labelPosition='left'
          placeholder='Enter STRONG Password...'
          value={password}
          onChange={(e) => { this.handleFieldChange("password", e.target.value) }}
          disabled={!options.readOnly || loading}
          className="Login-input"
          type="password"
          fluid
        />
        <br />
        <Button id="Login-submit" color='green' disabled={!options.readOnly || password === "" || (phrase === "" && selected === "")} loading={loading} onClick={() => this.handleLogin()} >Login</Button>
      </div>
    )
  }
}

export default Login;