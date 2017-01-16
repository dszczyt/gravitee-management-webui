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
class WidgetChartPieDirective {
  constructor() {
    this.restrict = 'E';
    this.scope = {
      data: "=data"
    };
    this.templateUrl = 'app/components/widget/pie.html';
  }

  link(scope) {
    scope.$watch('data', function(data) {
      if (data) {
        let values = [];

        let total = _.reduce(data.values, function(sum, val) {
          return sum + val;
        }, 0);

        let idx = 0;
        _.forEach(data.values, function(value) {
          let percentage = _.round(value / total * 100);
          values.push({
            name: scope.$parent.chart.labels[idx] + ': (' + percentage + '%) ' + value + ' hits',
            y: percentage,
            color: scope.$parent.chart.colors[idx]
          });
          idx++;
        });

        scope.results = {
          title: {text: total + ' hits'},
          series: [{
            name: 'Percent hits',
            data: values
          }]
        };
      }
    }, true);
  }
}

export default WidgetChartPieDirective;
