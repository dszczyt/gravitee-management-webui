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
import _ = require('lodash');
class NewApiController {
  private api: any;
  private vm: {
    selectedStep: number;
    stepProgress: number;
    maxStep: number;
    showBusyText: boolean;
    stepData: {
      step: number;
      completed: boolean;
      optional: boolean;
      data: any
    }[]
  };

  constructor(private $stateParams, private $window, private ApiService, private NotificationService) {
    'ngInject';

    this.api = _.clone(this.$stateParams.api);

    this.vm = {
      selectedStep: 0,
      stepProgress: 1,
      maxStep: 2,
      showBusyText: false,
      stepData: [
        {step: 1, completed: false, optional: false, data: {}},
        {step: 2, completed: false, optional: false, data: {}}
      ]
    };
  }

  enableNextStep() {
    //do not exceed into max step
    if (this.vm.selectedStep >= this.vm.maxStep) {
      return;
    }
    //do not increment vm.stepProgress when submitting from previously completed step
    if (this.vm.selectedStep === this.vm.stepProgress - 1) {
      this.vm.stepProgress = this.vm.stepProgress + 1;
    }
    this.vm.selectedStep = this.vm.selectedStep + 1;
  }

  moveToPreviousStep() {
    if (this.vm.selectedStep > 0) {
      this.vm.selectedStep = this.vm.selectedStep - 1;
    }
  }

  submitCurrentStep(stepData) {
    this.vm.showBusyText = true;

    if (!stepData.completed) {
      if (this.vm.selectedStep !== 1) {
        this.vm.showBusyText = false;
        //move to next step when success
        stepData.completed = true;
        this.enableNextStep();
      } else {
        this.ApiService.create(this.api).then((api) => {
          this.vm.showBusyText = false;
          this.NotificationService.show('API created');
          this.$window.location.href = `#/apis/${api.data.id}/settings/general`;
        }).catch(function () {
          this.vm.showBusyText = false;
        });
      }
    } else {
      this.vm.showBusyText = false;
      this.enableNextStep();
    }
  }
}

export default NewApiController;
