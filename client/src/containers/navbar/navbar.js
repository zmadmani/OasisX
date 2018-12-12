import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import { Menu, Responsive } from 'semantic-ui-react'
import './navbar.css'
import logo from '../../images/x.svg'

class Navbar extends Component {
  handleItemClick = (e, { name }) => this.setState({ activeItem: name })

  constructor(props) {
    super(props)
    this.state = {
      activeItem: ''
    }
  }

  componentDidUpdate() {
  }

  render() {
    const { children } = this.props
    const { activeItem } = this.state

    // var title = "OasisX"
    var other_buttons = []
    other_buttons.push(
      {
        name: 'WETH/DAI',
        href: '/WETH_DAI' 
      },
      {
        name: 'MKR/WETH',
        href: '/MKR_WETH'
      },
      {
        name: 'MKR/DAI',
        href: '/MKR_DAI'
      }
    )


    return (
      <div>
        <Responsive {...Responsive.onlyMobile}>

        </Responsive>

        <Responsive minWidth={Responsive.onlyTablet.minWidth}>
          <Menu 
            secondary 
            vertical
            size='mini'
            id='Navbar'
          >
            <Menu.Item
              name='Home'
              className='Navbar-item'
              as={Link}
              to={'/'}
            >
              <div className='Navbar-button' id='Navbar-logo'><img src={logo} alt='logo' className='Navbar-icon' /></div>
            </Menu.Item>
            {
              other_buttons.map((button, idx) => {
                return (
                    <Menu.Item
                      name={button.name}
                      active={activeItem === button.name}
                      className='Navbar-item'
                      onClick={this.handleToggle}
                      as={Link}
                      to={button.href}
                      key={idx}
                    >
                    <div className='Navbar-button'>{button.name}</div>
                  </Menu.Item>
                )
              })
            }
          </Menu>
          { children }
        </Responsive>
      </div>
    )
  }
}

export default Navbar;