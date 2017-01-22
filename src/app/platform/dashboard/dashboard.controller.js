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
class DashboardController {

  constructor($log, EventsService, AnalyticsService, ApiService, ApplicationService, $scope, $state, $timeout) {
    'ngInject';
    this.$log = $log;
    this.EventsService = EventsService;
    this.AnalyticsService = AnalyticsService;
    this.ApiService = ApiService;
    this.ApplicationService = ApplicationService;
    this.$scope = $scope;
    this.$state = $state;
    this.$timeout = $timeout;
    this.eventLabels = {};
    this.eventTypes = [];
    this.selectedAPIs = [];
    this.selectedApplications = [];
    this.selectedEventTypes = [];
    /*
    this.beginDate = moment().subtract(1, 'weeks').toDate();
    this.endDate = moment().toDate();
    this.now = moment().toDate();
    */

    this.$scope.platformDashboard = [{
      col: 0,
      row: 0,
      sizeY: 1,
      sizeX: 2,
      title: "Top API",
      subhead: 'Ordered by API calls',
      chart: {
        type: 'table',
        columns: ['API', 'Hits'],
        paging: 5,
        request: {
          type: "group_by",
          field: "api",
          size: 10000
        }
      }
    }, {
      col: 2,
      row: 0,
      sizeY: 1,
      sizeX: 2,
      title: "Top applications",
      subhead: 'Ordered by application calls',
      chart: {
        type: 'table',
        columns: ['Application', 'Hits'],
        paging: 5,
        request: {
          type: "group_by",
          field: "application",
          size: 10000
        }
      }
    }, {
      col: 0,
      row: 1,
      sizeY: 1,
      sizeX: 1,
      title: "Top failed APIs",
      subhead: 'Order by API 5xx status calls',
      chart: {
        type: 'table',
        columns: ['Application', 'Hits'],
        paging: 5,
        request: {
          type: "group_by",
          field: "api",
          query: "status:[500 TO 599]",
          size: 10000
        }
      }
    }, {
      col: 1,
      row: 1,
      sizeY: 1,
      sizeX: 1,
      title: "Top slow APIs",
      subhead: 'Order by API response time calls',
      chart: {
        type: 'table',
        columns: ['API', 'Latency (in ms)'],
        paging: 5,
        request: {
          type: "group_by",
          field: "api",
          orderField: "response-time",
          orderDirection: "desc",
          orderType: "avg",
          size: 10000
        }
      }
    }, {
      col: 2,
      row: 1,
      sizeY: 1,
      sizeX: 1,
      title: "Top overhead APIs",
      subhead: 'Order by gateway latency',
      chart: {
        type: 'table',
        columns: ['API', 'Latency (in ms)'],
        paging: 5,
        request: {
          type: "group_by",
          field: "api",
          orderField: "proxy-latency",
          orderDirection: "desc",
          orderType: "avg",
          size: 10000
        }
      }
    }];

    var _that = this;

    _.forEach(this.$scope.platformDashboard, function (widget) {
      _.merge(widget, {
        chart: {
          service: {
            caller: _that.AnalyticsService,
            function: _that.AnalyticsService.analytics
          }
        }
      });
    });

    // init events
    this.eventLabels.start_api = "Start";
    this.eventLabels.stop_api = "Stop";
    this.eventLabels.publish_api = "Deploy";
    this.eventLabels.unpublish_api = "Undeploy";
    this.eventTypes = ['START_API', 'STOP_API', 'PUBLISH_API', 'UNPUBLISH_API'];

    this.initPagination();
    this.searchEvents = this.searchEvents.bind(this);

    // Refresh widget on each timeframe change
    this.$scope.$on('timeframeChange', function (event, timeframe) {
      _that.lastFrom = timeframe.from;
      _that.lastTo = timeframe.to;

      _that.searchEvents();
    });
  }

  undoAPI() {
    this.updateCharts();
    this.searchEvents();
  }

  selectAPI() {
    this.updateCharts();
    this.searchEvents();
  }

  undoApplication() {
    this.updateCharts();
  }

  selectApplication() {
    this.updateCharts();
  }

  selectEvent(eventType) {
    var idx = this.selectedEventTypes.indexOf(eventType);
    if (idx > -1) {
      this.selectedEventTypes.splice(idx, 1);
    }
    else {
      this.selectedEventTypes.push(eventType);
    }
    this.searchEvents();
  }

  searchEvents() {
/*
    var from = moment(this.beginDate).unix() * 1000;
    var to = moment(this.endDate).unix() * 1000;
    if (from === to) {
      to = moment(this.endDate).add(24, 'hours').unix() * 1000;
    }
*/

    // set apis
    var apis = this.selectedAPIs.map(function(api){ return api.id; }).join(",");
    // set event types
    var types = this.eventTypes;
    if (this.selectedEventTypes.length > 0) {
      types = this.selectedEventTypes.join(",");
    }

    // search
    this.$scope.eventsFetchData = true;
    this.EventsService.search(types, apis, this.lastFrom, this.lastTo, this.query.page - 1, this.query.limit).then(response => {
      this.events = response.data;
      this.$scope.eventsFetchData = false;
    });
  }

  searchAPI(query) {
    if (query) {
      return this.ApiService.list().then(function(response) {
        return _.filter(response.data,
          function(api) {
            return api.name.toUpperCase().indexOf(query.toUpperCase()) > -1;
          });
      });
    }
  }

  searchApplication(query) {
    if (query) {
      return this.ApplicationService.list().then(function(response) {
        return _.filter(response.data,
          function(application) {
            return application.name.toUpperCase().indexOf(query.toUpperCase()) > -1;
          });
      });
    }
  }

  initPagination() {
    this.query = {
      limit: 10,
      page: 1
    };
  }

  getEventLabel(label) {
    return this.eventLabels[label];
  }

  updateCharts() {
    var _this = this;
    var i;

    var queryFilter = '';
    if (this.selectedAPIs.length) {
      queryFilter = ' AND(';
      for (i = 0; i < this.selectedAPIs.length; i++) {
        queryFilter += 'api:' + this.selectedAPIs[i].id + (this.selectedAPIs.length - 1 === i ? ')' : ' OR ');
      }
    }

    if (this.selectedApplications.length) {
      queryFilter = ' AND(';
      for (i = 0; i < this.selectedApplications.length; i++) {
        queryFilter += 'application:' + this.selectedApplications[i].id + (this.selectedApplications.length - 1 === i ? ')' : ' OR ');
      }
    }

    _.forEach(this.analyticsData.tops, function (top) {
      _this.$scope.fetchData = true;
      var request = top.request.call(_this.AnalyticsService,
        _this.analyticsData.range.from,
        _this.analyticsData.range.to,
        _this.analyticsData.range.interval,
        top.key,
        top.query + queryFilter,
        top.field,
        top.orderField,
        top.orderDirection,
        top.orderType,
        top.size);

      request.then(response => {
        if (response.data && response.data.values) {
          if (Object.keys(response.data.values).length) {
            top.results = _.map(response.data.values, function (value, key) {
              return {
                topKey: key,
                topValue: value,
                model: top.field,
                metadata: (response.data) ? response.data.metadata[key] : undefined
              };
            });
            _this.$scope.paging[top.key] = 1;
          } else {
            delete top.results;
          }
        }
        _this.$scope.fetchData = false;
      });
    });
  }
}

export default DashboardController;
