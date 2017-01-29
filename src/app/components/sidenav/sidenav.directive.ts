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
import * as _ from 'lodash';

class SideNavDirective {
  constructor() {
    let directive = {
      restrict: 'E',
      templateUrl: 'app/components/sidenav/sidenav.html',
      controller: SideNavController,
      controllerAs: 'sidenavCtrl',
      bindToController: true
    };

    return directive;
  }
}

class SideNavController {
  private routeMenuItems: any;
  constructor(private $rootScope, private $mdSidenav, private $mdDialog, private $scope, private $state, private UserService, private Constants) {
    'ngInject';
    $rootScope.devMode = Constants.devMode;
    $rootScope.portalTitle = Constants.portalTitle;

    $scope.userCreationEnabled = Constants.userCreationEnabled;

    this.routeMenuItems = _.filter($state.get(), function (state: any) {
      return !state.abstract && state.data && state.data.menu;
    });

    this.loadMenuItems();

    $rootScope.$on('userLoginSuccessful', () =>{
      this.loadMenuItems();
    });

    $scope.$on('$stateChangeStart', function (event, toState, toParams, fromState) {
      // init current resource name to delegate its initialization to specific modules
      var fromStates = fromState.name.split('.');
      var toStates = toState.name.split('.');

      if ((fromStates[0] + '.' + fromStates[1]) !== (toStates[0] + '.' + toStates[1])) {
        delete $scope.currentResource;
      }
    });

    $scope.$on('$stateChangeSuccess', (event, toState, toParams, fromState) =>{
      this.checkRedirectIfNotAllowed(toState, fromState, event);
      $scope.subMenuItems = _.filter(this.routeMenuItems, function (routeMenuItem: any) {
        var routeMenuItemSplitted = routeMenuItem.name.split('.'), toStateSplitted = toState.name.split('.');
        return !routeMenuItem.data.menu.firstLevel &&
          routeMenuItemSplitted[0] === toStateSplitted[0] && routeMenuItemSplitted[1] === toStateSplitted[1];
      });
    });

    $scope.$on('authenticationRequired', function () {
      $state.go('login');
    });
  }

  checkRedirectIfNotAllowed(targetState, redirectionState, event) {
    // if dev mode, check if the target state is authorized
    var notEligibleForDevMode = this.$rootScope.devMode && !targetState.devMode;
    var notEligibleForUserCreation = !this.$scope.userCreationEnabled && (this.$state.is('registration') || this.$state.is('confirm'));
    if (notEligibleForDevMode || notEligibleForUserCreation) {
      if (event) {
        event.preventDefault();
      }
      this.$state.go(redirectionState && redirectionState.name ? redirectionState.name : 'home');
    }
  }

  loadMenuItems() {
    var that = this;
    that.$scope.menuItems = _.filter(this.routeMenuItems, function (routeMenuItem: any) {
      var isMenuItem = routeMenuItem.data.menu.firstLevel && (!routeMenuItem.data.roles || that.UserService.isUserInRoles(routeMenuItem.data.roles));
      if (that.$rootScope.devMode) {
        return isMenuItem && routeMenuItem.devMode;
      } else {
        return isMenuItem;
      }
    });
  }

  close() {
    this.$mdSidenav('left').close();
  }

  logout() {
    var that = this;
    this.UserService.logout().then(function () {
      that.$rootScope.$broadcast('graviteeLogout');
    });
  }

  isDisplayed() {
    return !(this.$state.is('login') || this.$state.is('registration') || this.$state.is('confirm'));
  }

  goToUserPage() {
    this.$state.go(this.$rootScope.graviteeUser ? 'user' : 'home');
  }
}

export default SideNavDirective;
