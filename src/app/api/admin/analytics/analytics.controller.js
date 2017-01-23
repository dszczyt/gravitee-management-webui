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
class ApiAnalyticsController {
  constructor(ApiService, resolvedApi, $scope) {
    'ngInject';
    this.ApiService = ApiService;
    this.$scope = $scope;
    this.api = resolvedApi.data;

    this.$scope.apiDashboard = [{
      col: 0,
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
          size: 20
        }
      }
    }, {
      col: 2,
      row: 1,
      sizeY: 1,
      sizeX: 2,
      title: "Status",
      chart: {
        type: 'pie',
        request: {
          type: "group_by",
          field: "status",
          ranges: "100:199;200:299;300:399;400:499;500:599"
        },
        labels: ["1xx", "2xx", "3xx", "4xx", "5xx"],
        colors: ['#42a5f5', '#66bb6a', '#ffee58', '#ef5350', '#8d6e63']
      }
    }, {
      col: 3,
      row: 0,
      sizeY: 1,
      sizeX: 2,
      title: "Top slow applications",
      chart: {
        type: 'table',
        columns: ['Application', 'Latency (in ms)'],
        paging: 5,
        request: {
          type: "group_by",
          field: "application",
          order: "-avg:response-time",
          size: 20
        }
      }
    }, {
      col: 1,
      row: 1,
      sizeY: 1,
      sizeX: 2,
      title: "Top plan",
      chart: {
        type: 'table',
        columns: ['Plan', 'Hits'],
        paging: 5,
        request: {
          type: "group_by",
          field: "plan",
          size: 20
        }
      }
    }, {
      col: 0,
      row: 2,
      sizeY: 1,
      sizeX: 4,
      title: "Response Status",
      subhead: "Hits repartition by HTTP Status",
      chart: {
        type: 'line',
        stacked: true,
        labelPrefix: 'HTTP Status',
        request: {
          "type": "date_histo",
          "aggs": "field:status"
        }
      }
    }, {
      col: 0,
      row: 2,
      sizeY: 1,
      sizeX: 4,
      title: "Response times",
      subhead: "Average response time for the gateway and the API",
      chart: {
        type: 'line',
        stacked: false,
        request: {
          "type": "date_histo",
          "aggs": "avg:response-time;avg:api-response-time"
        },
        labels: ["Global latency (ms)", "API latency (ms)"]
      }
    }, {
      col: 0,
      row: 3,
      sizeY: 1,
      sizeX: 4,
      title: "Hits by application",
      subhead: "Hits repartition by application",
      chart: {
        type: 'line',
        stacked: true,
        labelPrefix: '',
        request: {
          "type": "date_histo",
          "aggs": "field:application"
        }
      }
    }];

    var _that = this;

    _.forEach(this.$scope.apiDashboard, function (widget) {
      _.merge(widget, {
        root: _that.api.id,
        chart: {
          service: {
            caller: _that.ApiService,
            function: _that.ApiService.analytics
          }
        }
      });
    });
  }
}

export default ApiAnalyticsController;
