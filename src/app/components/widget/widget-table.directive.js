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
class WidgetChartTableDirective {
  constructor() {
    this.restrict = 'E';
    this.scope = {
      data: "=data"
    };
    this.templateUrl = 'app/components/widget/table.html';
  }

  controller($scope, $rootScope) {
    this.$scope = $scope;
    this.$rootScope = $rootScope;

    $scope.selectItem = function() {
      let query = _($scope.selected).map(item => $scope.$parent.chart.request.field + ':' + item.key).join(' or ');
      $rootScope.$broadcast('queryUpdated', {
        field: $scope.$parent.chart.request.field,
        query: query
      });
    };

    $scope.deselectItem = function() {
      let query = _($scope.selected).map(item => $scope.$parent.chart.request.field + ':' + item.key).join(' or ');
      $rootScope.$broadcast('queryUpdated', {
        field: $scope.$parent.chart.request.field,
        query: query
      });
    };
  }

  link(scope) {
    scope.selected = [];

    scope.$watch('data', function(data) {
      if (data) {
        scope.paging = 1;

        console.log(data);
        scope.results = _.map(data.values, function (value, key) {
          return {
            key: key,
            value: value,
            metadata: (data && data.metadata) ? data.metadata[key] : undefined
          };
        });
      }
    }, true);
  }
}

export default WidgetChartTableDirective;
