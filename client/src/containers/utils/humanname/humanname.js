import React, { Component } from 'react'

import './humanname.css'

var first_names = ["JAMES", "JOHN", "ROBERT", "MICHAEL", "WILLIAM", "DAVID", "RICHARD", "CHARLES", "JOSEPH", "THOMAS", "CHRISTOPHER", "DANIEL", "PAUL", "MARK", "DONALD", "GEORGE", "KENNETH", "STEVEN", "EDWARD", "BRIAN", "RONALD", "ANTHONY", "KEVIN", "JASON", "MATTHEW", "GARY", "TIMOTHY", "JOSE", "LARRY", "JEFFREY", "FRANK", "SCOTT", "ERIC", "STEPHEN", "ANDREW", "RAYMOND", "GREGORY", "JOSHUA", "JERRY", "DENNIS", "WALTER", "PATRICK", "PETER", "HAROLD", "DOUGLAS", "HENRY", "CARL", "ARTHUR", "RYAN", "ROGER", "JOE", "JUAN", "JACK", "ALBERT", "JONATHAN", "JUSTIN", "TERRY", "GERALD", "KEITH", "SAMUEL", "WILLIE", "RALPH", "LAWRENCE", "NICHOLAS", "ROY", "BENJAMIN", "BRUCE", "BRANDON", "ADAM", "HARRY", "FRED", "WAYNE", "BILLY", "STEVE", "LOUIS", "JEREMY", "AARON", "RANDY", "HOWARD", "EUGENE", "CARLOS", "RUSSELL", "BOBBY", "VICTOR", "MARTIN", "ERNEST", "PHILLIP", "TODD", "JESSE", "CRAIG", "ALAN", "SHAWN", "CLARENCE", "SEAN", "PHILIP", "CHRIS", "JOHNNY", "EARL", "JIMMY", "ANTONIO", "DANNY", "BRYAN", "TONY", "LUIS", "MIKE", "STANLEY", "LEONARD", "NATHAN", "DALE", "MANUEL", "RODNEY", "CURTIS", "NORMAN", "ALLEN", "MARVIN", "VINCENT", "GLENN", "JEFFERY", "TRAVIS", "JEFF", "CHAD", "JACOB", "LEE", "MELVIN", "ALFRED", "KYLE", "FRANCIS", "BRADLEY", "JESUS", "HERBERT", "FREDERICK", "RAY", "JOEL", "EDWIN", "DON", "EDDIE", "RICKY", "TROY", "RANDALL", "BARRY", "ALEXANDER", "BERNARD", "MARIO", "LEROY", "FRANCISCO", "MARCUS", "MICHEAL", "THEODORE", "CLIFFORD", "MIGUEL", "OSCAR", "JAY", "JIM", "TOM", "CALVIN", "ALEX", "JON", "RONNIE", "BILL", "LLOYD", "TOMMY", "LEON", "DEREK", "WARREN", "DARRELL", "JEROME", "FLOYD", "LEO", "ALVIN", "TIM", "WESLEY", "GORDON", "DEAN", "GREG", "JORGE", "DUSTIN", "PEDRO", "DERRICK", "DAN", "LEWIS", "ZACHARY", "COREY", "HERMAN", "MAURICE", "VERNON", "ROBERTO", "CLYDE", "GLEN", "HECTOR", "SHANE", "RICARDO", "SAM", "RICK", "LESTER", "BRENT", "RAMON", "CHARLIE", "TYLER", "GILBERT", "GENE"]
var last_names = ["SMITH", "JOHNSON", "WILLIAMS", "JONES", "BROWN", "DAVIS", "MILLER", "WILSON", "MOORE", "TAYLOR", "ANDERSON", "THOMAS", "JACKSON", "WHITE", "HARRIS", "MARTIN", "THOMPSON", "GARCIA", "MARTINEZ", "ROBINSON", "CLARK", "RODRIGUEZ", "LEWIS", "LEE", "WALKER", "HALL", "ALLEN", "YOUNG", "HERNANDEZ", "KING", "WRIGHT", "LOPEZ", "HILL", "SCOTT", "GREEN", "ADAMS", "BAKER", "GONZALEZ", "NELSON", "CARTER", "MITCHELL", "PEREZ", "ROBERTS", "TURNER", "PHILLIPS", "CAMPBELL", "PARKER", "EVANS", "EDWARDS", "COLLINS", "STEWART", "SANCHEZ", "MORRIS", "ROGERS", "REED", "COOK", "MORGAN", "BELL", "MURPHY", "BAILEY", "RIVERA", "COOPER", "RICHARDSON", "COX", "HOWARD", "WARD", "TORRES", "PETERSON", "GRAY", "RAMIREZ", "JAMES", "WATSON", "BROOKS", "KELLY", "SANDERS", "PRICE", "BENNETT", "WOOD", "BARNES", "ROSS", "HENDERSON", "COLEMAN", "JENKINS", "PERRY", "POWELL", "LONG", "PATTERSON", "HUGHES", "FLORES", "WASHINGTON", "BUTLER", "SIMMONS", "FOSTER", "GONZALES", "BRYANT", "ALEXANDER", "RUSSELL", "GRIFFIN", "DIAZ", "HAYES", "MYERS", "FORD", "HAMILTON", "GRAHAM", "SULLIVAN", "WALLACE", "WOODS", "COLE", "WEST", "JORDAN", "OWENS", "REYNOLDS", "FISHER", "ELLIS", "HARRISON", "GIBSON", "MCDONALD", "CRUZ", "MARSHALL", "ORTIZ", "GOMEZ", "MURRAY", "FREEMAN", "WELLS", "WEBB", "SIMPSON", "STEVENS", "TUCKER", "PORTER", "HUNTER", "HICKS", "CRAWFORD", "HENRY", "BOYD", "MASON", "MORALES", "KENNEDY", "WARREN", "DIXON", "RAMOS", "REYES", "BURNS", "GORDON", "SHAW", "HOLMES", "RICE", "ROBERTSON", "HUNT", "BLACK", "DANIELS", "PALMER", "MILLS", "NICHOLS", "GRANT", "KNIGHT", "FERGUSON", "ROSE", "STONE", "HAWKINS", "DUNN", "PERKINS", "HUDSON", "SPENCER", "GARDNER", "STEPHENS", "PAYNE", "PIERCE", "BERRY", "MATTHEWS", "ARNOLD", "WAGNER", "WILLIS", "RAY", "WATKINS", "OLSON", "CARROLL", "DUNCAN", "SNYDER", "HART", "CUNNINGHAM", "BRADLEY", "LANE", "ANDREWS", "RUIZ", "HARPER", "FOX", "RILEY", "ARMSTRONG", "CARPENTER", "WEAVER", "GREENE", "LAWRENCE", "ELLIOTT", "CHAVEZ", "SIMS", "AUSTIN", "PETERS", "KELLEY", "FRANKLIN", "LAWSON"]
var colors = ["#001f3f", "#0074D9", "#7FDBFF", "#39CCCC", "#2ECC40", "#01FF70", "#FFDC00", "#FF851B", "#3D9970", "#F15152", "#111111", "#AAAAAA", "#DDDDDD"]
var fontColors = ["#FFFFFF", "#FFFFFF", "#111111", "#111111", "#111111", "#111111", "#111111", "#111111", "#111111", "#111111", "#FFFFFF", "#111111", "#111111"]
class HumanName extends Component {
  shouldComponentUpdate(nextProps, nextState) {
    if(this.props.address !== nextProps.address) {
      return true
    } else {
      return false
    }
  }

  getName(address) {
    var web3 = this.props.drizzle.web3
    var two_hundred = web3.utils.toBN("200")

    address = address.substr(2)
    var portion_1 = web3.utils.hexToNumberString(address.substr(0, 20))
    var portion_2 = web3.utils.hexToNumberString(address.substr(20, 40))
    
    portion_1 = web3.utils.toBN(portion_1).mod(two_hundred).toString()
    portion_2 = web3.utils.toBN(portion_2).mod(two_hundred).toString()

    if(portion_1 !== 0 && portion_2 !== 0) {
      var initials = first_names[portion_1][0] + last_names[portion_2][0]
      return [first_names[portion_1] + " " + last_names[portion_2], initials]
    } else {
      return [address, "0x"]
    }
  }

  getColor(address) {
    var web3 = this.props.drizzle.web3
    var num_colors = web3.utils.toBN("13")

    address = address.substr(2)
    var long_num = web3.utils.hexToNumberString(address)

    var color_idx = web3.utils.toBN(long_num).mod(num_colors).toString()
    return [colors[color_idx], fontColors[color_idx]]
  }

  render() {
    var { address, icon_only, inactive_link } = this.props

    var [ name, initials ] = this.getName(address)
    var [ backgroundColor, fontColor ] = this.getColor(address)
    name = (<div className="HumanName-name">{name}</div>)
    var color = {
      "backgroundColor": backgroundColor,
      "color": fontColor
    }
    var onClick = () => window.open('https://etherscan.io/address/' + address, '_blank')
    if(inactive_link) {
      onClick = null
    }

    var icon = (<div className="HumanName-circle" style={color}><span className="HumanName-initials">{initials}</span></div>)
    var final = (<span className="HumanName" title={address} onClick={onClick}>{icon}{name}</span>)
    if( icon_only ) {
      final = (<span className="HumanName" title={address} onClick={onClick}>{icon}</span>)
    }
    return final

  }
}

export default HumanName
