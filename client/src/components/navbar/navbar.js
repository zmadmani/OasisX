// Import Major Dependencies
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Responsive, Icon, Dropdown, Sidebar, Segment } from 'semantic-ui-react';

// Import CSS Files
import './navbar.css';

// Import Artifacts
import logo from '../../images/x.svg';
import Infobar from '../infobar/infobar';

const other_buttons = [
  { name: 'WETH/DAI', href: '/WETH_DAI' },
  { name: 'WETH/SAI', href: '/WETH_SAI' },
  { name: 'MKR/WETH', href: '/MKR_WETH'},
  { name: 'MKR/DAI', href: '/MKR_DAI'}
];

class Navbar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: false
    };
  }

  // Helper function to toggle the sidebar. Used only on mobile.
  toggleVisible = () => {
    this.setState({ visible: !this.state.visible });
  }

  render() {
    const { children, options } = this.props;
    const { visible } = this.state;

    return (
      <div>
        {/* Mobile Version of the navbar that displays at the top */}
        <Responsive {...Responsive.onlyMobile}>
          <Menu 
            borderless
            fixed='top'
            id='Navbar-mobile'
          >
            {/* Display a Logo Home button */}
            <Menu.Item name='Home' href='/' className='Navbar-item'>
              <div className='Navbar-button-mobile' id='Navbar-logo-container'><img src={logo} alt='logo' id='Navbar-logo-mobile' /></div>
            </Menu.Item>

            {/* Display dropdown of all other markets */}
            <Dropdown item text='Markets' className='Navbar-dropdown'>
              <Dropdown.Menu>
                {
                  other_buttons.map((button, idx) => {
                    return (
                        <Dropdown.Item
                          name={button.name}
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

            {/* Display a hamburger menu to toggle sidebar with information. */}
            <Menu.Menu position='right'>
              <Menu.Item>
                <Icon name='sidebar' inverted onClick={ this.toggleVisible } />
              </Menu.Item>                
            </Menu.Menu>
          </Menu>

          {/* Add sidebar infobar */}
          <Sidebar as={Segment} animation="overlay" direction="right" visible={visible} id="Navbar-Side_info_bar">
            <Infobar options={options} padded={false} closeSidebar={this.toggleVisible} />
          </Sidebar>
          { children }
        </Responsive>

        {/* Desktop Version of the navbar that is on the left side of the screen */}
        <Responsive minWidth={Responsive.onlyTablet.minWidth}>
          <Menu secondary vertical size='mini' id='Navbar'>
            {/* Display a Logo Home button */}
            <Menu.Item name='Home' className='Navbar-item' as={Link} to={'/'}>
              <div className='Navbar-button' id='Navbar-logo-container'><img src={logo} alt='logo' className='Navbar-icon' /></div>
            </Menu.Item>

            {/* Display the list of other buttons for all other markets */}
            {
              other_buttons.map((button, idx) => {
                return (
                    <Menu.Item
                      name={button.name}
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
          {/* Children are all content that will be rendered on page, it is put as a child to the navbar */}
          { children }
        </Responsive>
      </div>
    )
  }
}

export default Navbar;