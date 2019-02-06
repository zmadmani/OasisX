import React, { Component } from 'react'
import { ethers } from 'ethers';
import { Charts, ChartContainer, ChartRow, YAxis, LineChart, BarChart, styler, Resizable } from "react-timeseries-charts";
import { TimeSeries, Index } from "pondjs";

import './chart.css'

const style = styler([
    { key: "price", color: "white", width: 1 },
    { key: "volume", color: "white" }
]);

class CrossHairs extends React.Component {
    render() {
        const { x, y } = this.props;
        const style = { pointerEvents: "none", stroke: "#ccc" };
        if (!(x === null) && !(y === null)) {
            return (
                <g>
                    <line style={style} x1={0} y1={y} x2={this.props.width} y2={y} />
                    <line style={style} x1={x} y1={0} x2={x} y2={this.props.height} />
                </g>
            );
        } else {
            return <g />;
        }
    }
}

class Chart extends Component {
  constructor(props) {
    super(props)
    this.state = {
      loading: true,
      tracker: null,
      chart_data: null,
      volume_data: null,
      timerange: null,
      x: null,
      y: null,
      selection: null
    }
  }

  componentDidMount() {
  }

  componentWillReceiveProps(nextProps) {
    if(nextProps.orders.length > 0) {
      var points = this.buildChartPoints(nextProps.orders)
      var chart_data = new TimeSeries({
        name: "Chart",
        columns: ["time", "price"],
        points: points
      })
      var timerange = chart_data.timerange()

      var volume_points = []
      for(var i = 0; i < nextProps.orders.length; i++) {
        var item = nextProps.orders[i]
        var vol = parseFloat(ethers.utils.formatUnits(item["curr_1"].toString(), 'ether'))
        if(i > 0) {
          var last_item = nextProps.orders[i-1]
          if(item["raw_timestamp"] === last_item["raw_timestamp"]) {
            volume_points[volume_points.length-1][1] += vol
          } else {
            volume_points.push([Index.getIndexString("1s", new Date(item["raw_timestamp"])), vol])
          }
        } else {
          volume_points.push([Index.getIndexString("1s", new Date(item["raw_timestamp"])), vol])
        }
      }

      volume_points.reverse()
      var volume_data = new TimeSeries({
        name: "Volume",
        columns: ["index", "volume"],
        points: volume_points
      })
      this.setState({loading: false, chart_data, volume_data, timerange })
    }
  }

  componentWillUnmount() {

  }

  componentWillMount() {
  }

  handleTrackerChange = (tracker) => {
    if(!tracker) {
      this.setState({ tracker, x: null, y: null })
    } else {
      this.setState({ tracker })
    }
  }

  handleTimeRangeChange = (timerange) => {
    this.setState({ timerange })
  }

  handleMouseMove = (x, y) => {
    this.setState({ x, y })
  }

  buildChartPoints(orders) {
    var chart_data = orders.map(function(order) {
      return [order["raw_timestamp"], order["price"], order["curr_2"]]
    })
    chart_data.reverse()
    return chart_data
  }

  render() {
    var { loading, chart_data, volume_data, timerange } = this.state
    var { currencies } = this.props

    var chart = <div id="Chart-loading">Loading...</div>
    if(chart_data && !loading) {
      var start_time = chart_data.range().begin()
      var end_time = chart_data.range().end()
      end_time.setHours(end_time.getHours() + 6)
      var min_val = chart_data.crop(timerange).min("price")
      var max_val = chart_data.crop(timerange).max("price")
      var padding = (max_val - min_val)*0.1
      var max_volume = volume_data.crop(timerange).max("volume")
      var volume_padding = (max_volume)*0.1
      chart = (
        <Resizable>
          <ChartContainer 
            timeRange={timerange} 
            minTime={start_time} 
            maxTime={end_time} 
            timeAxisAngledLabels={true}
            timeAxisHeight={80}
            paddingLeft={20}
            paddingRight={20}
            enablePanZoom={true}
            minDuration={1000 * 60 * 60}
            onTrackerChanged={this.handleTrackerChange}
            onBackgroundClick={() => this.setState({ selection: null })}
            onTimeRangeChanged={this.handleTimeRangeChange}
            onMouseMove={(x, y) => this.handleMouseMove(x, y) }
            showGrid
            style={{
                background: "#0b1215",
                borderStyle: "solid",
                borderWidth: 1,
                borderColor: "#0b1215",
                paddingTop: "1em"
            }}
            timeAxisStyle={{
                              ticks: {
                                  stroke: "#AAA",
                                  opacity: 0.25,
                                  "stroke-dasharray": "1,1"
                                  // Note: this isn't in camel case because this is
                                  // passed into d3's style
                              },
                              values: {
                                  fill: "#AAA",
                                  "font-size": 12
                              }
                          }}
          >
            <ChartRow height="325">
              <YAxis 
                id="price" 
                label={"Price (" + currencies[1] + " / " + currencies[0] + ")"} 
                min={min_val - padding} 
                max={max_val + padding}
                hideAxisLine 
                showGrid 
                width="50" 
                type="linear" 
                format=",.2f"
                style={{
                    ticks: {
                        stroke: "#AAA",
                        opacity: 0.25,
                        "stroke-dasharray": "1,1"
                        // Note: this isn't in camel case because this is
                        // passed into d3's style
                    }}}
              />
              <Charts>
                <LineChart 
                  axis="price"
                  series={chart_data} 
                  columns={["price"]} 
                  style={style}
                  interpolation="curveStepAfter"
                  selection={this.state.selection}
                  onSelectionChange={selection =>
                                      this.setState({ selection })
                                    }
                />
                <CrossHairs x={this.state.x} y={this.state.y} />
              </Charts>
            </ChartRow>
            <ChartRow height="75">
              <YAxis 
                id="amount" 
                label={"Volume (" + currencies[1] + ")"} 
                min={0}
                max={max_volume + volume_padding} 
                hideAxisLine
                showGrid
                width="50" 
                type="linear" 
                format=",.2r"
                style={{
                    ticks: {
                        stroke: "#AAA",
                        opacity: 0.25,
                        "stroke-dasharray": "1,1"
                        // Note: this isn't in camel case because this is
                        // passed into d3's style
                    }}}
              />
              <Charts>
                <BarChart
                    axis="amount"
                    style={style}
                    columns={["volume"]}
                    series={volume_data}
                />
              </Charts>
            </ChartRow>
          </ChartContainer>
        </Resizable>
      )
    }

    return (
      <div className="Chart">
        {chart}
      </div>
    );
  }
}

export default Chart

                // <BandChart
                //   axis="price"
                //   series={chart_data}
                //   column="price"
                //   aggregation={ {
                //       size: "30m",
                //       reducers: {
                //           outer: [percentile(5), percentile(95)],
                //           inner: [percentile(25), percentile(75)]
                //       }
                //   } }
                //   style={style}
                //   interpolation="curveBasis"
                // />