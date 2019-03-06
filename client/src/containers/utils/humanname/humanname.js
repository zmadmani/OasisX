// Import Major Dependencies
import React, { Component } from 'react';
import { ethers } from 'ethers';

// Import CSS Files
import './humanname.css';

// Set up constants
const first_names = ["JAMES", "JOHN", "ROBERT", "MICHAEL", "WILLIAM", "DAVID", "RICHARD", "CHARLES", "JOSEPH", "THOMAS", "CHRISTOPHER", "DANIEL", "PAUL", "MARK", "DONALD", "GEORGE", "KENNETH", "STEVEN", "EDWARD", "BRIAN", "RONALD", "ANTHONY", "KEVIN", "JASON", "MATTHEW", "GARY", "TIMOTHY", "JOSE", "LARRY", "JEFFREY", "FRANK", "SCOTT", "ERIC", "STEPHEN", "ANDREW", "RAYMOND", "GREGORY", "JOSHUA", "JERRY", "DENNIS", "WALTER", "PATRICK", "PETER", "HAROLD", "DOUGLAS", "HENRY", "CARL", "ARTHUR", "RYAN", "ROGER", "JOE", "JUAN", "JACK", "ALBERT", "JONATHAN", "JUSTIN", "TERRY", "GERALD", "KEITH", "SAMUEL", "WILLIE", "RALPH", "LAWRENCE", "NICHOLAS", "ROY", "BENJAMIN", "BRUCE", "BRANDON", "ADAM", "HARRY", "FRED", "WAYNE", "BILLY", "STEVE", "LOUIS", "JEREMY", "AARON", "RANDY", "HOWARD", "EUGENE", "CARLOS", "RUSSELL", "BOBBY", "VICTOR", "MARTIN", "ERNEST", "PHILLIP", "TODD", "JESSE", "CRAIG", "ALAN", "SHAWN", "CLARENCE", "SEAN", "PHILIP", "CHRIS", "JOHNNY", "EARL", "JIMMY", "ANTONIO", "DANNY", "BRYAN", "TONY", "LUIS", "MIKE", "STANLEY", "LEONARD", "NATHAN", "DALE", "MANUEL", "RODNEY", "CURTIS", "NORMAN", "ALLEN", "MARVIN", "VINCENT", "GLENN", "JEFFERY", "TRAVIS", "JEFF", "CHAD", "JACOB", "LEE", "MELVIN", "ALFRED", "KYLE", "FRANCIS", "BRADLEY", "JESUS", "HERBERT", "FREDERICK", "RAY", "JOEL", "EDWIN", "DON", "EDDIE", "RICKY", "TROY", "RANDALL", "BARRY", "ALEXANDER", "BERNARD", "MARIO", "LEROY", "FRANCISCO", "MARCUS", "MICHEAL", "THEODORE", "CLIFFORD", "MIGUEL", "OSCAR", "JAY", "JIM", "TOM", "CALVIN", "ALEX", "JON", "RONNIE", "BILL", "LLOYD", "TOMMY", "LEON", "DEREK", "WARREN", "DARRELL", "JEROME", "FLOYD", "LEO", "ALVIN", "TIM", "WESLEY", "GORDON", "DEAN", "GREG", "JORGE", "DUSTIN", "PEDRO", "DERRICK", "DAN", "LEWIS", "ZACHARY", "COREY", "HERMAN", "MAURICE", "VERNON", "ROBERTO", "CLYDE", "GLEN", "HECTOR", "SHANE", "RICARDO", "SAM", "RICK", "LESTER", "BRENT", "RAMON", "CHARLIE", "TYLER", "GILBERT", "GENE"];
const last_names = ["SMITH", "JOHNSON", "WILLIAMS", "JONES", "BROWN", "DAVIS", "MILLER", "WILSON", "MOORE", "TAYLOR", "ANDERSON", "THOMAS", "JACKSON", "WHITE", "HARRIS", "MARTIN", "THOMPSON", "GARCIA", "MARTINEZ", "ROBINSON", "CLARK", "RODRIGUEZ", "LEWIS", "LEE", "WALKER", "HALL", "ALLEN", "YOUNG", "HERNANDEZ", "KING", "WRIGHT", "LOPEZ", "HILL", "SCOTT", "GREEN", "ADAMS", "BAKER", "GONZALEZ", "NELSON", "CARTER", "MITCHELL", "PEREZ", "ROBERTS", "TURNER", "PHILLIPS", "CAMPBELL", "PARKER", "EVANS", "EDWARDS", "COLLINS", "STEWART", "SANCHEZ", "MORRIS", "ROGERS", "REED", "COOK", "MORGAN", "BELL", "MURPHY", "BAILEY", "RIVERA", "COOPER", "RICHARDSON", "COX", "HOWARD", "WARD", "TORRES", "PETERSON", "GRAY", "RAMIREZ", "JAMES", "WATSON", "BROOKS", "KELLY", "SANDERS", "PRICE", "BENNETT", "WOOD", "BARNES", "ROSS", "HENDERSON", "COLEMAN", "JENKINS", "PERRY", "POWELL", "LONG", "PATTERSON", "HUGHES", "FLORES", "WASHINGTON", "BUTLER", "SIMMONS", "FOSTER", "GONZALES", "BRYANT", "ALEXANDER", "RUSSELL", "GRIFFIN", "DIAZ", "HAYES", "MYERS", "FORD", "HAMILTON", "GRAHAM", "SULLIVAN", "WALLACE", "WOODS", "COLE", "WEST", "JORDAN", "OWENS", "REYNOLDS", "FISHER", "ELLIS", "HARRISON", "GIBSON", "MCDONALD", "CRUZ", "MARSHALL", "ORTIZ", "GOMEZ", "MURRAY", "FREEMAN", "WELLS", "WEBB", "SIMPSON", "STEVENS", "TUCKER", "PORTER", "HUNTER", "HICKS", "CRAWFORD", "HENRY", "BOYD", "MASON", "MORALES", "KENNEDY", "WARREN", "DIXON", "RAMOS", "REYES", "BURNS", "GORDON", "SHAW", "HOLMES", "RICE", "ROBERTSON", "HUNT", "BLACK", "DANIELS", "PALMER", "MILLS", "NICHOLS", "GRANT", "KNIGHT", "FERGUSON", "ROSE", "STONE", "HAWKINS", "DUNN", "PERKINS", "HUDSON", "SPENCER", "GARDNER", "STEPHENS", "PAYNE", "PIERCE", "BERRY", "MATTHEWS", "ARNOLD", "WAGNER", "WILLIS", "RAY", "WATKINS", "OLSON", "CARROLL", "DUNCAN", "SNYDER", "HART", "CUNNINGHAM", "BRADLEY", "LANE", "ANDREWS", "RUIZ", "HARPER", "FOX", "RILEY", "ARMSTRONG", "CARPENTER", "WEAVER", "GREENE", "LAWRENCE", "ELLIOTT", "CHAVEZ", "SIMS", "AUSTIN", "PETERS", "KELLEY", "FRANKLIN", "LAWSON"];
const colors = ["#001f3f", "#0074D9", "#7FDBFF", "#39CCCC", "#2ECC40", "#01FF70", "#FFDC00", "#FF851B", "#3D9970", "#F15152", "#111111", "#AAAAAA", "#DDDDDD"];
const fontColors = ["#FFFFFF", "#FFFFFF", "#111111", "#111111", "#111111", "#111111", "#111111", "#111111", "#111111", "#111111", "#FFFFFF", "#111111", "#111111"];

class HumanName extends Component {
  // Only update the component if the address has changed since no other change will effect output.
  shouldComponentUpdate(nextProps, nextState) {
    if(this.props.address !== nextProps.address) {
      return true;
    } else {
      return false;
    }
  }

  // Convert the address to a name using the mapping scheme
  getName(address) {
    // If the address is an empty string then return the appropriate response
    if(address.length === 0) {
      return [address, "0x"];
    }

    const num_names = ethers.utils.bigNumberify("200");
    
    // Split the address into 2 equal lengths to create the first and last names
    let first_name_idx = ethers.utils.bigNumberify(address.substr(0, 22)).toString();
    let last_name_idx = ethers.utils.bigNumberify("0x" + address.substr(22, 40)).toString();
    
    // Mod the numbers by 200 to get a response that is within the max index of 200 to be used to retrieve a first and last name
    first_name_idx = ethers.utils.bigNumberify(first_name_idx).mod(num_names).toString();
    last_name_idx = ethers.utils.bigNumberify(last_name_idx).mod(num_names).toString();

    const initials = first_names[first_name_idx][0] + last_names[last_name_idx][0];
    return [first_names[first_name_idx] + " " + last_names[last_name_idx], initials];
  }

  // Convert the address to a color using the mapping scheme
  getColor(address) {
    // If the address is an empty string then return the appropriate response
    if(address.length === 0) {
      return [colors[0], fontColors[0]];
    }

    const num_colors = ethers.utils.bigNumberify("13");
    const long_num = ethers.utils.bigNumberify(address).toString();

    // Mode the number by 13 to get a response within the max index of 13 to be used to retrieve the colors
    const color_idx = ethers.utils.bigNumberify(long_num).mod(num_colors).toString()
    return [colors[color_idx], fontColors[color_idx]]
  }

  /** ################# RENDER ################# **/

  render() {
    const { address, icon_only, inactive_link } = this.props;

    // If the address is null then render an empty circle
    if(!address) {
      return (<div className="HumanName-circle"></div>);
    }

    // Get the computed name and colors
    let [ name, initials ] = this.getName(address);
    const [ backgroundColor, fontColor ] = this.getColor(address);
    
    name = (<div className="HumanName-name">{name}</div>);
    const color = { "backgroundColor": backgroundColor, "color": fontColor };

    // OnClick function will open up a tab with the account information in etherscan
    let onClick = () => window.open('https://etherscan.io/address/' + address, '_blank');
    if(inactive_link) {
      onClick = null;
    }

    const icon = (<div className="HumanName-circle" style={color}>{initials}</div>)
    let final = (<span className="HumanName" title={address} onClick={onClick}>{icon} {name}</span>)
    if( icon_only ) {
      final = (<span className="HumanName" title={address} onClick={onClick}>{icon}</span>)
    }
    return final

  }
}

export default HumanName
