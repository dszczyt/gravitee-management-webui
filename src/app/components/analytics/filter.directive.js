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
class AnalyticsFilterDirective {
  constructor() {

    let directive = {
      restrict: 'E',
      templateUrl: 'app/components/analytics/filter.html',
      controller: AnalyticsFilterController,
      controllerAs: 'analyticsFilterCtrl',
      bindToController: true
    };

    return directive;
  }
}

class AnalyticsFilterController {
  constructor($scope, $rootScope) {
    'ngInject';
    this.$scope = $scope;
    this.$rootScope = $rootScope;

    this.fields = {};
    this.filters = {};
    let _that = this;

    this.$rootScope.$on('filterItemChange', function (event, filter) {
      if (filter.mode === 'add') {
        _that.addFieldFilter(filter);
      } else if (filter.mode === 'remove') {
        _that.removeFieldFilter(filter);
      }
    });
  }

  addFieldFilter(filter) {
    /*
    var fields = {
      plan: {
        filters: {
          key: name
        }
      }
    };
    */

    var filters = this.fields[filter.field] || [];
    filters.push(filter);
    this.fields[filter.field] = filters;


    let query = filter.field + ' = ' + _(filters).map(fieldFilter => "'" + fieldFilter.name + "'").join(' or ');
    this.filters.push(query);
  }

  removeFieldFilter(filter) {
    var filters = this.fields[filter.field];
    if (filters) {
      filters.remove(filter);
    }
  }
}

export default AnalyticsFilterDirective;
