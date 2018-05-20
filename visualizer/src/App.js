import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import ChartistGraph from 'react-chartist';
import 'chartist/dist/chartist.min.css';
import allData from './data.json';
import uniq from 'lodash/uniq';
import groupBy from 'lodash/groupBy';
import Chartist from 'chartist';
import PluginTooltip from 'chartist-plugin-tooltip';
import PluginAxisTitle from 'chartist-plugin-axistitle';

const QUERIES = Object.keys(allData);

const makeOptions = (title, o) => {
  let valueTransform;
  if (o.yTransform) {
    valueTransform = v => {
      const [x, y] = v.split(',');
      return `${o.yTransform(parseFloat(y))} @ ${x} rps`;
    }
  }

  return {
    ...o,
    valueTransform,
    title,
    options: {
      ...o.options,
      axisX: {
        type: Chartist.FixedScaleAxis,
        onlyInteger: true,
        ...o.axisX
      },
    }
  };
}

const formatMs = ms => ms ? ms.toFixed(0) : null;

const CONFIG_BY_STAT = {
  "latMean": makeOptions("Average latency", {yTransform: v => `${formatMs(v)}ms`}),
  "lat50": makeOptions("50th Percentile Latency", {yTransform: v => `${formatMs(v)}ms`}),
  "lat95": makeOptions("95th Percentile Latency", {yTransform: v => `${formatMs(v)}ms`}),
  "lat99": makeOptions("99th Percentile Latency", {yTransform: v => `${formatMs(v)}ms`}),
  "latMax": makeOptions("Maximum Latency", {yTransform: v => `${formatMs(v)}ms`}),
  "success": makeOptions("Successful requests", {yTransform: v => `${v} successful requests`}),
  "failure": makeOptions("Failed requests", {yTransform: v => `${v} failed requests`}),
};

const ALL_STATS = Object.keys(CONFIG_BY_STAT);

class App extends Component {
  state = {
    query: QUERIES[0],
    stat: 'lat95',
  };

  handleSetQuery = e => {
    this.setState({query: e.target.value});
  };
  handleSetStat = e => {
    this.setState({stat: e.target.value});
  };

  render() {
    const entries = allData[this.state.query];
    const rps = uniq(entries.map(e => e.rps)).sort(
      (a, b) => a-b
    );
    const groupedEntries = groupBy(entries, e => e.software);
    const softwares = Object.keys(groupedEntries);
    const data = {
      labels: rps.map((r, i) => i % 2 === 1 ? r : ''),
      series: softwares.map(
        software => ({
          name: software,
          className: `series-${software.replace(/[^a-z0-9]/g, '-')}`,
          data: rps.map(
            r => {
              const entry = groupedEntries[software].find(e => e.rps === r)
              if (entry) {
                return {x: r, y: entry[this.state.stat]};
              } else {
                return {x: r, y: null};
              }
            }
          ).filter(p => p.y !== null)
        })
      )
    }
    const {options: baseOptions, title, valueTransform} = CONFIG_BY_STAT[this.state.stat] || {};
    const options = {
      ...baseOptions,
      axisX: {
        ...baseOptions.axisX,
        ticks:  rps.filter((r, i) => i % 2 === 1),
        low: 0,
        high: rps[rps.length - 1],
      },
      chartPadding: {
        top: 20,
        right: 20,
        bottom: 30,
        left: 40,
      },
      showArea: false,
      lineSmooth: true,
      showGridBackground: false,
      fullWidth: false,
      plugins: [
        PluginTooltip({
          valueTransform
        }),
        PluginAxisTitle({
          axisX: {
            axisTitle: 'Requests per second',
            textAnchor: 'middle',
            offset: {
              x: 0,
              y: 50,
            },
          },
          axisY: {
            axisTitle: title || this.state.stat,
            textAnchor: 'middle',
            flipTitle: true,
            offset: {
              x: 0,
              y: 25,
            },
          }
        })
      ],
    };
        console.log(  rps.filter((r, i) => i % 2 === 1))
    return (
      <div className="App">
        <div style={{width: '100%', height: '4em', display: 'flex', alignItems: 'center', justifyContent: 'space-evenly', backgroundColor: 'rgba(0, 0, 0, 0.1)'}}>
          <div>
            Query: <select value={this.state.query} onChange={this.handleSetQuery}>
              {QUERIES.map(q => <option key={q} value={q}>{q}</option>)}
            </select>
          </div>
          <div>
            Stat: <select value={this.state.stat} onChange={this.handleSetStat}>
              {ALL_STATS.map(q => <option key={q} value={q}>{q}</option>)}
            </select>
          </div>
          <div>
            <div className='label-postgraphile'>
              postgraphile
            </div>
            <div className='label-postgraphile-next'>
              postgraphile-next
            </div>
            <div className='label-prisma'>
              prisma
            </div>
          </div>
        </div>
        <div style={{position: 'relative', flex: '1 0 300px', display: 'flex', alignItems: 'stretch'}}>
          <div style={{flex: '1 0 0'}}>
            <ChartistGraph options={options} data={
              data
            } type={'Line'} />
          </div>
        </div>
      </div>
    );
  }
}

export default App;