// Import Major Dependencies
import React, { Component } from 'react';
import { ethers } from 'ethers';
import { format } from "d3-format";
import { timeFormat } from "d3-time-format";
import { ChartCanvas, Chart } from "react-stockcharts";
import { BarSeries, CandlestickSeries, LineSeries } from "react-stockcharts/lib/series";
import { XAxis, YAxis } from "react-stockcharts/lib/axes";
import { CrossHairCursor, CurrentCoordinate } from "react-stockcharts/lib/coordinates";
import { OHLCTooltip, MovingAverageTooltip } from "react-stockcharts/lib/tooltip";
import { discontinuousTimeScaleProvider } from "react-stockcharts/lib/scale" 
import { fitWidth } from "react-stockcharts/lib/helper";
import { last } from "react-stockcharts/lib/utils";
import { ema } from "react-stockcharts/lib/indicator";

// Import CSS Files
import './chart.css';

// Set the appearance of the candle chart
const candlesAppearance = {
  wickStroke: "#7a8692",
  fill: function fill(d) {
    return d.close > d.open ? "rgba(0, 255, 0, 0.5)" : "rgba(255, 0, 0, 0.5)";
  },
  widthRatio: 0.8,
  opacity: 1,
};

class CandleChart extends Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }
  
  shouldComponentUpdate(nextProps, nextState) {
    // Only update if there are a different number of orders being piped in
    if(this.props.orders.length !== nextProps.orders.length) {
      return true;
    } else {
      return false;
    }
  }

  // Convert raw order data into the processed chart points
  buildChartPoints(orders) {
    let data = [];

    let first_timestamp = orders[orders.length - 1]['raw_timestamp'];
    first_timestamp = first_timestamp - (first_timestamp % (3600000/4));

    let curr_candle = {
      date: new Date(first_timestamp),
      open: orders[orders.length-1]['price'],
      high: orders[orders.length-1]['price'],
      low: orders[orders.length-1]['price'],
      close: orders[orders.length-1]['price'],
      volume: parseFloat(ethers.utils.formatUnits(orders[orders.length-1]['curr_1'], 'ether'))
    };
    let end_timestamp = first_timestamp + (3600000/4);
    for(let i = orders.length-2; i >= 0; i--) {
      const order = orders[i];
      if(order["raw_timestamp"] < end_timestamp) {
        curr_candle['volume'] += parseFloat(ethers.utils.formatUnits(order['curr_1'], 'ether'));
        curr_candle['close'] = order['price'];
        if(order['price'] > curr_candle['high']) {
          curr_candle['high'] = order['price'];
        } else if(order['price'] < curr_candle['low']) {
          curr_candle['low'] = order['price'];
        }
      } else {
        data.push(curr_candle);
        curr_candle = {
          date: new Date(end_timestamp),
          open: curr_candle['close'],
          high: Math.max(order['price'], curr_candle['close']),
          low: Math.min(order['price'], curr_candle['close']),
          close: order['price'],
          volume: parseFloat(ethers.utils.formatUnits(order['curr_1'], 'ether'))
        };
        end_timestamp = end_timestamp + (3600000/4);
      }
    }
    return data;
  }

  /** ################# RENDER ################# **/

  render() {
    var { width, ratio, orders } = this.props

    var chart = <div id="CandleChart-loading">Loading...</div>
    if(orders.length > 0) {
      var initialData = this.buildChartPoints(orders)
      const ema10 = ema()
        .options({
          windowSize: 10, // optional will default to 10
          sourcePath: "close", // optional will default to close as the source
        })
        .skipUndefined(true) // defaults to true
        .merge((d, c) => {d.ema10 = c;}) // Required, if not provided, log a error
        .accessor(d => d.ema10) // Required, if not provided, log an error during calculation
        .stroke("#ce4200"); // Optional
      const ema50 = ema()
        .options({
          windowSize: 50, // optional will default to 10
          sourcePath: "close", // optional will default to close as the source
        })
        .skipUndefined(true) // defaults to true
        .merge((d, c) => {d.ema50 = c;}) // Required, if not provided, log a error
        .accessor(d => d.ema50) // Required, if not provided, log an error during calculation
        .stroke("blue"); // Optional
      const calculatedData = ema50(ema10(initialData))

      const margin = { left: 50, right: 60, top: 30, bottom: 50 }
      const height = 500
      var gridHeight = height - margin.top - margin.bottom;
      var gridWidth = width - margin.left - margin.right;
      var showGrid = true;
      var yGrid = showGrid ? { 
          innerTickSize: -1 * gridWidth,
          tickStrokeDasharray: 'Solid',
          tickStrokeOpacity: 0.2,
          tickStrokeWidth: 1
      } : {};
      var xGrid = showGrid ? { 
          innerTickSize: -1 * gridHeight,
          tickStrokeDasharray: 'Solid',
          tickStrokeOpacity: 0.2,
          tickStrokeWidth: 1
      } : {};
      const xScaleProvider = discontinuousTimeScaleProvider.inputDateAccessor( d => d.date )
      const { data, xScale, xAccessor, displayXAccessor } = xScaleProvider( calculatedData )
      const start = xAccessor(last(data))
      const end = xAccessor(data[Math.max(0, data.length - 100)])
      const xExtents = [start, end]

      chart = (
        <ChartCanvas
          height={height}
          ratio={ratio}
          width={width}
          margin={margin}
          type="hybrid"
          seriesName="Data"
          data={data}
          xScale={xScale}
          xAccessor={xAccessor}
          displayXAccessor={displayXAccessor}
          xExtents={xExtents}
          clamp={true}
        >
          <Chart id={1} height={400} yExtents={[d => [d.high+3, d.low-3], ema10.accessor(), ema50.accessor()]}>
            <YAxis axisAt="right" orient="right" ticks={10} stroke="#9aa3ad" tickStroke="#9aa3ad" {...yGrid} />
            <CandlestickSeries {...candlesAppearance} />
            <LineSeries yAccessor={ema10.accessor()} stroke={ema10.stroke()}/>
            <LineSeries yAccessor={ema50.accessor()} stroke={ema50.stroke()}/>
            <CurrentCoordinate yAccessor={ema10.accessor()} fill={ema10.stroke()} />
            <CurrentCoordinate yAccessor={ema50.accessor()} fill={ema50.stroke()} />
            <OHLCTooltip origin={[10, 10]} xDisplayFormat={timeFormat("%m-%d-%y %I:%M %p")} textFill="#9aa3ad" />
            <MovingAverageTooltip
              origin={[10, 25]}
              textFill="#9aa3ad"
              options={[
                {
                  yAccessor: ema10.accessor(),
                  type: "EMA",
                  stroke: ema10.stroke(),
                  windowSize: ema10.options().windowSize,
                  echo: "some echo here",
                },
                {
                  yAccessor: ema50.accessor(),
                  type: "EMA",
                  stroke: ema50.stroke(),
                  windowSize: ema50.options().windowSize,
                  echo: "some echo here",
                },
              ]}
            />
          </Chart>
          <Chart id={2} origin={(w, h) => [0, h - 100]} height={100} yExtents={d => d.volume}>
            <XAxis axisAt="bottom" orient="bottom" stroke="#9aa3ad" tickStroke="#9aa3ad" {...xGrid} />
            <YAxis axisAt="left" orient="left" ticks={5} stroke="#9aa3ad" tickStroke="#9aa3ad" tickFormat={format(".2s")} />
            <BarSeries
              yAccessor={d => d.volume}
              fill={d => (d.close > d.open ? "rgba(0, 255, 0, 0.2)" : "rgba(255, 0, 0, 0.3)")}
            />
          </Chart>
          <CrossHairCursor stroke="#9aa3ad" opacity={1} />
        </ChartCanvas>
      )
    }
    return (
      <div className="CandleChart">
        {chart}
      </div>
    );
  }
}

CandleChart = fitWidth(CandleChart);
export default CandleChart