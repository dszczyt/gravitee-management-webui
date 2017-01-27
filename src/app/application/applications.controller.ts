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
import * as angular from 'angular';

class ApplicationsController {
  private applications: any;

  constructor(
    private $window,
    private $mdDialog,
    private $state,
    private $rootScope,
    private ApplicationService,
    private NotificationService,
    private resolvedApplications
  ) {
		'ngInject';
		this.applications = resolvedApplications.data;
	}

	createInitApplication() {
		if (!this.$rootScope.graviteeUser) {
			this.$rootScope.$broadcast("authenticationRequired");
		} else {
			this.showAddApplicationModal(null);
		}
	}

	showAddApplicationModal(ev) {
    this.$mdDialog.show({
      controller: 'DialogApplicationController',
      templateUrl: 'app/application/dialog/application.dialog.html',
      parent: angular.element(document.body),
			targetEvent: ev
    }).then((application: any) => {
      if (application) {
        this.$window.location.href = `#/applications/${application.data.id}/general`;
      }
    }, function() {
       // You cancelled the dialog
    });
  }
}

export default ApplicationsController;
