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
class DashboardDirective {
  constructor() {
    let directive = {
      restrict: 'E',
      scope: {
        model: '='
      },
      templateUrl: 'app/components/analytics/dashboard.html',
      controller: DashboardController,
      controllerAs: 'dashboardCtrl',
      bindToController: true
    };

    return directive;
  }
}

class DashboardController {
  constructor($scope, $timeout, $rootScope) {
    'ngInject';

    $scope.dashboardOptions = {
      margins: [20, 20],
      columns: 4,
      swapping: false,
      draggable: {
        enable: true,
        handle: 'md-card-title'
      },
      resizable: {
        enabled: true,
        stop: function () {
          $scope.$broadcast('onWidgetResize');
        }
      }
    };

    $timeout(function(){
      $rootScope.$broadcast('timeframeReload');
    });
  }
}

export default DashboardDirective;
