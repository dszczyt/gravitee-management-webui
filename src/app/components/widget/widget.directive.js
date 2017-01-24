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
class WidgetDirective {
  constructor() {
    return {
      restrict: 'E',
      templateUrl: 'app/components/widget/widget.html',
      scope: {
        widget: '='
      },
      link: function link(scope, element) {
        scope.$watch(function () {
            // console.log(angular.element(element[0])[0].firstElementChild);
          console.log(angular.element(element[0])[0].firstElementChild);
            return element[0].scrollHeight ||
              angular.element(element[0])[0].firstElementChild.scrollHeight;
          },
          function (newVal) {
            let rowHeightOption = 250;
            let height = rowHeightOption * scope.widget.sizeY;
            if (newVal > height) {
              // scope.widget.sizeY = Math.floor(newVal / rowHeightOption) + 1;
            }
          });
      }
    };
  }
}

export default WidgetDirective;
