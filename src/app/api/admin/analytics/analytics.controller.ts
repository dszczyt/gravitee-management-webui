/*
 * Copyright (C) 2015 The Gravitee team (http://gravitee.io)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import _ = require('lodash');
import moment = require("moment");
class ApiAnalyticsController {
  private api: any;
  private analyticsData: any;
  private colorByBucket: string[];
  private bgColorByBucket: string[];
  private timeframe: any;
  private reportsFetched: any;
  private topsFetched: any;
  private indicators: any;
  private total: any;
  private indicatorsFetched: any;
  private indicatorChartData: any;

  constructor(private $log, private ApiService, private resolvedApi, private $q, private $scope, private $state) {
    'ngInject';
    this.$log = $log;
    this.ApiService = ApiService;
    this.$scope = $scope;
    this.$scope.Object = Object;
    this.$state = $state;
    this.api = resolvedApi.data;
    this.$q = $q;

    this.$scope.filteredApplications = [];

    // md table paging set up
    this.$scope.paging = [];

    this.analyticsData = this.analytics();

    if ($state.params.timestamp) {
      this.setTimestamp($state.params.timestamp);
    } else if ($state.params.timeframe) {
      this.setTimeframe($state.params.timeframe);
    } else {
      this.setTimeframe('3d');
    }

    //from https://material.google.com/style/color.html#color-color-palette
    //shade 500 & 900
    //
    // deep purple, lime, deep orange, pink, purple,
    // light green, amber, Blue Grey, orange, teal,
    // indigo, purple, red, cyan, brown
    this.colorByBucket = [
      '#673ab7', '#cddc39', '#ff5722', '#e91e63', '#9c27b0',
      '#8bc34a', '#ffc107', '#607d8b', '#ff9800', '#009688',
      '#3f51b5', '#9c27b0', '#f44336', '#00bcd4', '#795548',

      '#311b92', '#827717', '#bf360c', '#880e4f', '#4a148c',
      '#33691e', '#ff6f00', '#263238', '#e65100', '#004d40',
      '#1a237e', '#4a148c', '#b71c1c', '#006064', '#3e2723'

    ];


    //from https://material.google.com/style/color.html#color-color-palette
    //shade 200 & 300
    this.bgColorByBucket = [
      '#b39ddb', '#e6ee9c', '#ffab91', '#f48fb1', '#ce93d8',
      '#c5e1a5', '#ffe082', '#b0bec5', '#ffcc80', '#80cbc4',
      '#9fa8da', '#ce93d8', '#ef9a9a', '#80deea', '#bcaaa4',

      '#9575cd', '#dce775', '#ff8a65', '#f06292', '#ba68c8',
      '#aed581', '#ffd54f', '#90a4ae', '#ffb74d', '#4db6ac',
      '#7986cb', '#ba68c8', '#e57373', '#4dd0e1', '#a1887f'
    ];

    // data fetching settings
    this.setUpDataFetchSettings();

    var that = this;

    $scope.$watch('filteredApplications', function () {
      that.updateCharts();
    }, true);
  }

  openMenu($mdOpenMenu, ev) {
    $mdOpenMenu(ev);
  }

  updateDate(date) {
    if (date) {
      this.$state.transitionTo(this.$state.current, {
        apiId: this.api.id,
        timestamp: date.getTime() / 1000,
        timeframe: ''
      }, {notify: false});
      this.setTimestamp(date.getTime() / 1000);
      this.updateCharts();
    }
  }

  updateTimeframe(timeframeId) {
    if (timeframeId) {
      this.$state.transitionTo(this.$state.current, {
        apiId: this.api.id,
        timestamp: '',
        timeframe: timeframeId
      }, {notify: false});
      this.setTimeframe(timeframeId);
      this.updateCharts();
    }
  }

  setTimestamp(timestamp) {
    var momentDate = moment.unix(timestamp);

    this.$scope.timeframeDate = momentDate.toDate();

    var startDate = Math.floor(momentDate.startOf('day').valueOf() / 1000);
    var endDate = Math.floor(momentDate.endOf('day').valueOf() / 1000);
    this.analyticsData.range = {
      interval: 3600000,
      from: startDate * 1000,
      to: endDate * 1000
    };
  }

  setTimeframe(timeframeId) {
    var that = this;

    this.timeframe = _.find(this.analyticsData.timeframes, function (timeframe: any) {
      return timeframe.id === timeframeId;
    });

    var now = Date.now();

    var oldReport = (this.analyticsData === undefined) ? undefined : this.analyticsData.report;

    _.assignIn(this.analyticsData, {
      timeframe: that.timeframe,
      report: oldReport,
      range: {
        interval: that.timeframe.interval,
        from: now - that.timeframe.range,
        to: now
      }
    });
  }

  fetchApplicationAnalytics(report, response) {
    this.pushHitsByData(report, response);
    this.pushTopHitsData();
  }

  pushHitsByData(report, response) {
    let data = [], i = 0;
    _.forEach(report.requests, (request) => {
      let currentResponse = response[i];
      if (currentResponse) {
        if (currentResponse.data.values[0]) {
          _.forEach(currentResponse.data.values[0].buckets, (bucket) => {
            if (bucket) {
              i++;
              let lineColor = report.id === 'response-status' ? this.getColorByStatus(bucket.name) : this.colorByBucket[i % this.colorByBucket.length];
              let bgColor = report.id === 'response-status' ? this.getBgColorByStatus(bucket.name) : this.bgColorByBucket[i % this.bgColorByBucket.length];
              let label = request.label ? request.label : (report.label || bucket.name);
              if (report.id === 'applications') {
                let application = currentResponse.data.metadata[bucket.name];
                label = application.name;
              }
              data.push({
                name: label || bucket.name, data: bucket.data, color: lineColor, fillColor: bgColor,
                labelPrefix: report.labelPrefix
              });
            }
          });
        }
      }
    });

    if (data.length) {
      let categories = [];
      for (let timestamp = response[0].data.timestamp.from; timestamp <= response[0].data.timestamp.to;
           timestamp = timestamp + response[0].data.timestamp.gap) {
        categories.push(moment(timestamp).format("YYYY-MM-DD HH:mm:ss"));
      }
      this.$scope.chartConfig.push({
        title: {text: report.title},
        xAxis: {
          labels: {enabled: false},
          categories: categories
        },
        plotOptions: {areaspline: {stacking: report.stacked ? 'normal':null}},
        series: data
      });

      // sort by configured reports
      this.$scope.chartConfig = _.sortBy(this.$scope.chartConfig, (report: any) => {
        return _.findIndex(this.analyticsData.reports, {title: report.title.text});
      });
    }
  }

  pushTopHitsData() {
    _.forEach(this.analyticsData.tops, (top) => {
      if (top.key === 'top-apps') {
        var request = top.request.call(this.ApiService, this.api.id,
          this.analyticsData.range.from,
          this.analyticsData.range.to,
          this.analyticsData.range.interval,
          top.key,
          top.query,
          top.field,
          top.size);

        request.then(response => {
          this.dataFetched(this.topsFetched, top.key);
          if (response.data.values && Object.keys(response.data.values).length) {
            top.results = _.map(response.data.values, function (value, key) {
              return {
                topApp: key,
                topHits: value,
                metadata: (response.data && response.data.metadata) ? response.data.metadata[key] : undefined
              };
            });
            this.$scope.paging[top.key] = 1;
          } else {
            delete top.results;
          }
        });
      }
    });
  }

  updateCharts() {
    this.initDataFetching();

    let queryFilter = '';
    if (this.$scope.filteredApplications.length) {
      queryFilter = ' AND(';
      for (var i = 0; i < this.$scope.filteredApplications.length; i++) {
        queryFilter += 'application:' + this.$scope.filteredApplications[i].topApp + (this.$scope.filteredApplications.length - 1 === i ? ')' : ' OR ');
      }
    }

    _.forEach(this.analyticsData.reports, report => {
      let requests = _.map(report.requests, function (req: any) {
        return req.service.call(this.ApiService, this.api.id,
          req.key,
          req.query + queryFilter,
          req.field,
          req.aggType,
          this.analyticsData.range.from,
          this.analyticsData.range.to,
          this.analyticsData.range.interval);
      });

      this.$q.all(requests).then(response => {
        this.dataFetched(this.reportsFetched, report.key);

        // Push data for hits by 'something'
        if (response[0] && response[0].data.values) {
          if (report.id === 'applications') {
            this.fetchApplicationAnalytics(report, response);
          } else {
            this.pushHitsByData(report, response);
          }
        }
      });
    });

    // indicators
    this.indicators = [];
    // first we need to get total calls to produce ratios
    let totalIndicator: any = _.find(this.analyticsData.indicators, 'isTotal');
    let request = totalIndicator.request.call(this.ApiService, this.api.id,
      this.analyticsData.range.from,
      this.analyticsData.range.to,
      this.analyticsData.range.interval,
      totalIndicator.key,
      totalIndicator.query + queryFilter);

    let data = [];

    request.then(response => {
      this.dataFetched(this.indicatorsFetched, 'total');
      totalIndicator.value = response.data.hits;
      this.total = totalIndicator.value;

      // then we get other indicators
      let indicators: any = _.filter(this.analyticsData.indicators, function (indicator: any) {
        return !indicator.isTotal;
      });

      let i = 0;

      delete this.indicatorChartData;
      _.forEach(indicators, (indicator) => {
        var request = indicator.request.call(this.ApiService, this.api.id,
          this.analyticsData.range.from,
          this.analyticsData.range.to,
          this.analyticsData.range.interval,
          indicator.key,
          indicator.query + queryFilter);

        request.then(response => {
          this.dataFetched(this.indicatorsFetched, indicator.key);
          indicator.value = response.data.hits;
          i++;
          if (indicator.value !== undefined) {
            let percentage = _.round(indicator.value / this.total * 100);
            if (percentage !== 0) {
              data.push({
                name: indicator.title + ': (' + percentage + '%) ' + indicator.value + ' hits',
                y: percentage,
                color: indicator.color
              });
            }

            if (indicators.length === i && _.filter(indicators, (indicator: any) => {
                return indicator.value !== 0;
              }).length) {
              this.indicatorChartData = {
                title: {text: this.total + ' hits'},
                series: [{
                  name: 'Percent hits',
                  data: data
                }]
              };
            }
          }
        });
      });
    });
  }

  dataFetched(obj, key) {
    obj[key] = true;
    this.$scope.$broadcast('dataFetched');
  }

  initDataFetching() {
    this.topsFetched = {};
    this.reportsFetched = {};
    this.indicatorsFetched = {};
    _.forEach(this.analyticsData.tops, top =>{
      this.topsFetched[top.key] = false;
    });
    _.forEach(this.analyticsData.reports, report =>{
      this.reportsFetched[report.key] = false;
    });
    _.forEach(this.analyticsData.indicators, indicator =>{
      this.indicatorsFetched[indicator.key] = false;
    });
    this.$scope.fetchDone = false;
    this.$scope.chartConfig = [];
  }

  setUpDataFetchSettings() {
    // data fetching settings
    this.$scope.fetchDone = true;
    this.$scope.$on('dataFetched', () =>{
      let analyticsFetched = {
        tops: _.every(this.topsFetched, Boolean),
        reports: _.every(this.reportsFetched, Boolean),
        indicators: _.every(this.indicatorsFetched, Boolean)
      };
      this.$scope.fetchDone = _.every(analyticsFetched, Boolean);
    });
  }

  //from https://material.google.com/style/color.html#color-color-palette
  //shade 400
  getColorByStatus(status) {
    if (_.startsWith(status, '1')) {
      return '#42a5f5'; //blue
    } else if (_.startsWith(status, '2')) {
      return '#66bb6a'; //green
    } else if (_.startsWith(status, '3')) {
      return '#ffee58'; //yellow
    } else if (_.startsWith(status, '4')) {
      return '#ef5350'; //red
    } else if (_.startsWith(status, '5')) {
      return '#8d6e63'; //brown
    }
    return '#bdbdbd'; //grey
  }

  //from https://material.google.com/style/color.html#color-color-palette
  //shade 200
  getBgColorByStatus(status) {
    if (_.startsWith(status, '1')) {
      return '#90caf9'; //blue
    } else if (_.startsWith(status, '2')) {
      return '#a5d6a7'; //green
    } else if (_.startsWith(status, '3')) {
      return '#fff59d'; //yellow
    } else if (_.startsWith(status, '4')) {
      return '#ef9a9a'; //red
    } else if (_.startsWith(status, '5')) {
      return '#bcaaa4'; //brown
    }
    return '#eeeeee'; //grey
  }

  analytics() {
    var _this = this;
    return {
      tops: [
        {
          title: 'Top applications',
          request: this.ApiService.apiTopHits,
          key: "top-apps",
          query: "api:" + _this.api.id,
          field: "application",
          size: 20
        }
      ],
      indicators: [
        {
          title: 'Total calls',
          request: this.ApiService.apiGlobalHits,
          key: "total",
          query: "api:" + _this.api.id + " AND status:[100 TO 599]",
          color: 'silver',
          isTotal: true
        },
        {
          title: '1xx',
          request: this.ApiService.apiGlobalHits,
          key: "1xx",
          query: "api:" + _this.api.id + " AND status:[100 TO 199]",
          color: _this.getColorByStatus('100')
        },
        {
          title: '2xx',
          request: this.ApiService.apiGlobalHits,
          key: "2xx",
          query: "api:" + _this.api.id + " AND status:[200 TO 299]",
          color: _this.getColorByStatus('200')
        },
        {
          title: '3xx',
          request: this.ApiService.apiGlobalHits,
          key: "3xx",
          query: "api:" + _this.api.id + " AND status:[300 TO 399]",
          color: _this.getColorByStatus('300')
        },
        {
          title: '4xx',
          request: this.ApiService.apiGlobalHits,
          key: "4xx",
          query: "api:" + _this.api.id + " AND status:[400 TO 499]",
          color: _this.getColorByStatus('400')
        },
        {
          title: '5xx',
          request: this.ApiService.apiGlobalHits,
          key: "5xx",
          query: "api:" + _this.api.id + " AND status:[500 TO 599]",
          color: _this.getColorByStatus('500')
        }
      ],
      reports: [
        {
          id: 'response-status',
          type: 'line',
          stacked: true,
          title: 'Response Status',
          labelPrefix: 'HTTP Status',
          requests: [
            {
              "service": this.ApiService.apiHitsBy,
              "key": "api-hits-by-status",
              "query": "api:" + _this.api.id,
              "field": "status",
              "aggType": "terms"
            }
          ]
        }, {
          id: 'response-times',
          type: 'line',
          stacked: false,
          title: 'Response Times',
          requests: [
            {
              "label": "Global latency (average in ms)",
              "service": this.ApiService.apiHitsBy,
              "key": "api-hits-by-latency",
              "query": "api:" + _this.api.id,
              "field": "response-time",
              "aggType": "avg"
            },
            {
              "label": "API latency (average in ms)",
              "service": this.ApiService.apiHitsBy,
              "key": "api-hits-by-api-latency",
              "query": "api:" + _this.api.id,
              "field": "api-response-time",
              "aggType": "avg"
            }
          ]
        }, {
          id: 'applications',
          type: 'line',
          stacked: true,
          title: 'Hits by applications',
          labelPrefix: '',
          requests: [
            {
              "service": this.ApiService.apiHitsBy,
              "key": "api-hits-by-application",
              "query": "api:" + _this.api.id,
              "field": "application",
              "aggType": "terms"
            }
          ]
        }
      ],
      timeframes: [
        {
          id: '5m',
          title: 'Last 5 minutes',
          range: 1000 * 60 * 5,
          interval: 10000
        }, {
          id: '1h',
          title: 'Last hour',
          range: 1000 * 60 * 60,
          interval: 1000 * 60
        }, {
          id: '24h',
          title: 'Last 24 hours',
          range: 1000 * 60 * 60 * 24,
          interval: 1000 * 60 * 60
        }, {
          id: '3d',
          title: 'Last 3 days',
          range: 1000 * 60 * 60 * 24 * 3,
          interval: 1000 * 60 * 60 * 3
        }, {
          id: '14d',
          title: 'Last 14 days',
          range: 1000 * 60 * 60 * 24 * 14,
          interval: 1000 * 60 * 60 * 5
        }, {
          id: '30d',
          title: 'Last 30 days',
          range: 1000 * 60 * 60 * 24 * 30,
          interval: 10000000
        }, {
          id: '90d',
          title: 'Last 90 days',
          range: 1000 * 60 * 60 * 24 * 90,
          interval: 10000000
        }
      ]
    };
  }
}

export default ApiAnalyticsController;
