import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import { Menu, Responsive, Icon, Dropdown, Sidebar, Segment } from 'semantic-ui-react'
import './navbar.css'
import logo from '../../images/x.svg'
import Infobar from '../infobar/infobar'

class Navbar extends Component {
  handleItemClick = (e, { name }) => this.setState({ activeItem: name })

  constructor(props) {
    super(props)
    this.state = {
      activeItem: '',
      visible: false
    }
  }

  componentDidUpdate() {
  }

  toggleVisible = () => {
    this.setState({ visible: !this.state.visible })
  }

  render() {
    const { children, options } = this.props
    const { activeItem, visible } = this.state

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
          <Menu 
            borderless
            fixed='top'
            id='Navbar-mobile'
          >
            <Menu.Item
              name='Home'
              active={activeItem === 'Home'}
              href='/'
              className='Navbar-item'
            >
              <div className='Navbar-button-mobile' id='Navbar-logo-container'><img src={logo} alt='logo' id='Navbar-logo-mobile' /></div>
            </Menu.Item>
            <Dropdown item text='Markets' className='Navbar-dropdown'>
              <Dropdown.Menu>
                {
                  other_buttons.map((button, idx) => {
                    return (
                        <Dropdown.Item
                          name={button.name}
                          active={activeItem === button.name}
                          className='Navbar-item'
                          as={Link}
                          to={button.href}
                          key={idx}
                        >
                        {button.name}
                      </Dropdown.Item>
                    )
                  })
                }
              </Dropdown.Menu>
            </Dropdown>
            <Menu.Menu position='right'>
              <Menu.Item>
                <Icon name='sidebar' inverted onClick={ this.toggleVisible } />
              </Menu.Item>                
            </Menu.Menu>
          </Menu>
          <Sidebar as={Segment} animation="overlay" direction="right" visible={visible} id="Navbar-Side_info_bar">
            <Infobar options={options} padded={false} closeSidebar={this.toggleVisible} />
          </Sidebar>
          { children }
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
              <div className='Navbar-button' id='Navbar-logo-container'><img src={logo} alt='logo' className='Navbar-icon' /></div>
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