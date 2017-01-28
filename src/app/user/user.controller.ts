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
class UserController {
  private originalPicture: any;

  constructor(private UserService, private $rootScope, private NotificationService, private $scope) {
    'ngInject';
  }

  save() {
    this.UserService.save(this.$rootScope.graviteeUser).then(() =>{
      this.NotificationService.show("User updated with success");
      this.$scope.formUser.$setPristine();
      this.originalPicture = this.$rootScope.graviteeUser.picture;
    });
  }

  cancel() {
    this.$rootScope.graviteeUser.picture = this.$scope.originalPicture;
    delete this.$scope.originalPicture;
  }
}

export default UserController;
