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
class ApiPropertiesController {
  constructor (ApiService, resolvedApi, $mdSidenav, $mdEditDialog, $state, $mdDialog, NotificationService, $scope, $rootScope) {
    'ngInject';
    this.ApiService = ApiService;
    this.$mdDialog = $mdDialog;
    this.NotificationService = NotificationService;
    this.$scope = $scope;
    this.$state = $state;
    this.$rootScope = $rootScope;
    this.api = resolvedApi.data;
    this.$mdSidenav = $mdSidenav;
    this.$mdEditDialog = $mdEditDialog;

    this.dynamicPropertyService = this.api.services && this.api.services['dynamic-property'];

    this.timeUnits = [ 'SECONDS', 'MINUTES', 'HOURS' ];
    this.dynamicPropertyProviders = [
      {
        id: 'HTTP',
        name: 'Custom (HTTP)'
      }
    ];

    this.init();
  }

  init() {
    this.$mdSidenav('dynamic-properties-config', true).then(function(instance) {
      instance.onClose(function () {
        console.log("close LEFT is done");
      });
    });
  }

  hasPropertiesDefined() {
    return this.api.properties && Object.keys(this.api.properties).length > 0;
  }

  deleteProperty(key) {
    var alert = this.$mdDialog.confirm({
      title: 'Warning',
      content: 'Are you sure you want to remove this property ?',
      ok: 'OK',
      cancel: 'Cancel'
    });

    var that = this;
    this.$mdDialog
      .show(alert)
      .then(function () {
        delete that.api.properties[key];
        that.update(that.api);
      });
  }

  showPropertyModal() {
    var _this = this;
    this.$mdDialog.show({
      controller: 'DialogAddPropertyController',
      controllerAs: 'dialogAddPropertyCtrl',
      templateUrl: 'app/api/admin/properties/add-property.dialog.html',
      clickOutsideToClose: true
    }).then(function (property) {
      var key = Object.keys(property)[0];

      if (_this.api.properties === undefined) {
        _this.api.properties = {};
      }

      _this.api.properties[key] = property[key];
    });
  }

  update() {
    var _this = this;
    this.api.services['dynamic-property'] = this.dynamicPropertyService;
    this.ApiService.update(this.api).then((updatedApi) => {
      _this.api = updatedApi.data;
      _this.$rootScope.$broadcast('apiChangeSuccess');
      _this.NotificationService.show('API \'' + _this.$scope.$parent.apiCtrl.api.name + '\' saved');
    });
  }

  editValue(event, key) {
    event.stopPropagation();

    var _that = this;
    this.$mdEditDialog.small({
      modelValue: _that.api.properties[key],
      placeholder: 'Set property value',
      save: function (input) {
        _that.api.properties[key] = input.$modelValue;
      },
      targetEvent: event,
      validators: {
        'md-maxlength': 160
      }
    });
  }

  toggleRight() {
    this.$mdSidenav('dynamic-properties-config')
      .toggle();
  }

  close() {
    this.$mdSidenav('dynamic-properties-config')
      .close();
  }
}

export default ApiPropertiesController;
