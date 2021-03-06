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
class ChartDirective {
  constructor() {
    return {
      restrict: 'E',
      template: '<div></div>',
      scope: {
        options: '=',
        type: '@',
        zoom: '@',
        height: '@',
        width: '@'
      },
      link: function (scope, element) {
        if (scope.type && scope.type.startsWith('area') && _.isArray(scope.options)) {
          initSynchronizedCharts();
        }

        setChartSize();

        let lastOptions;
        scope.$watch('options', function (newOptions) {
          executeDisplayChart(newOptions, element);
          lastOptions = newOptions;
        }, true);

        $(window).resize(function () {
          onResize();
        });

        scope.$root.$watch('reducedMode', function (reducedMode) {
          if (reducedMode !== undefined) {
            setTimeout(function () {
              onResize();
            });
          }
        });

        function onResize() {
          setChartSize();
          executeDisplayChart(lastOptions, element);
        }

        function setChartSize() {
          let chartElement = angular.element(element[0]);
          chartElement.css('height', scope.height || chartElement.parent().height());
          chartElement.css('width', scope.width || chartElement.parent().width());
        }

        function executeDisplayChart(newOptions, element) {
          if (_.isArray(newOptions)) {
            while (element[0].firstChild) {
              element[0].removeChild(element[0].firstChild);
            }

            _.forEach(newOptions, function (newOption) {
              let child = document.createElement('div');
              element[0].appendChild(child);

              let childElement = angular.element(child);
              childElement.css('height', scope.height || childElement.parent().height());

              displayChart(newOption, child);
            });
          } else {
            displayChart(newOptions, element[0]);
          }
        }

        function initSynchronizedCharts() {
          let points = [];
          element.bind('mousemove touchmove touchstart', function (e) {
            let chart, i, event;

            for (i = 0; i < Highcharts.charts.length; i++) {
              chart = Highcharts.charts[i];
              if (chart) {
                event = chart.pointer.normalize(e.originalEvent);
                points = _.map(chart.series, function (serie) {
                  return serie.searchPoint(event, true);
                });
                points = _.filter(points, function (point) {
                  return point;
                });

                if (points.length && points[0] && points[0].series.area) {
                  points[0].highlight(e);
                }
              }
            }
          });
          Highcharts.Pointer.prototype.reset = function () {
            let chart;
            for (let i = 0; i < Highcharts.charts.length; i++) {
              chart = Highcharts.charts[i];
              if (chart) {
                chart.tooltip.hide(this);
                chart.xAxis[0].hideCrosshair();
              }
            }
          };
          Highcharts.Point.prototype.highlight = function (event) {
            if (points.length) {
              this.onMouseOver();
              this.series.chart.tooltip.refresh(points);
              this.series.chart.xAxis[0].drawCrosshair(event, this);
            }
          };
        }

        function syncExtremes(e) {
          let thisChart = this.chart;

          if (e.trigger !== 'syncExtremes') {
            Highcharts.each(Highcharts.charts, function (chart) {
              if (chart && chart !== thisChart) {
                if (chart.xAxis[0].setExtremes) {
                  chart.xAxis[0].setExtremes(e.min, e.max, undefined, false, {trigger: 'syncExtremes'});
                }
              }
            });
          }
        }

        function displayChart(newOptions, element) {
          if (newOptions) {
            if (newOptions.title) {
              newOptions.title.style = {
                'fontWeight': 'bold',
                'fontSize': '12px',
                'fontFamily': '"Helvetica Neue",Helvetica,Arial,sans-serif'
              };
              newOptions.title.align = 'left';
            } else {
              newOptions.title = {text: ''};
            }
            newOptions.yAxis = _.merge(newOptions.yAxis, {title: {text: ''}});
            newOptions.chart = {type: scope.type};
            if (scope.zoom) {
              newOptions.chart.zoomType = 'x';
            }
            newOptions.credits = {
              enabled: false
            };
            newOptions.series = _.sortBy(newOptions.series, 'name');

            _.forEach(newOptions.series, function (serie) {
              serie.data = _.sortBy(serie.data, 'name');
            });

            if (scope.type && scope.type.startsWith('area')) {
              newOptions.tooltip = {
                formatter: function () {
                  let s = '<b>' + this.x + '</b>';
                  if (_.filter(this.points, function (point) {
                      return point.y !== 0;
                    }).length) {
                    _.forEach(this.points, function (point) {
                      if (point.y) {
                        let name = ' ' + (point.series.options.labelPrefix ? point.series.options.labelPrefix + ' ' + point.series.name : point.series.name);
                        s += '<br /><span style="color:' + point.color + '">\u25CF</span>' + name + ': <b>' + point.y + '</b>';
                      }
                    });
                  }
                  return s;
                },
                shared: true
              };
              newOptions.plotOptions = _.merge(newOptions.plotOptions, {
                series: {
                  marker: {
                    enabled: false
                  },
                  fillOpacity: 0.1
                }
              });
              if (_.isArray(scope.options)) {
                newOptions.xAxis = _.merge(newOptions.xAxis, {crosshair: true, events: {setExtremes: syncExtremes}});
              }
            } else if (scope.type && scope.type === 'solidgauge') {
              newOptions = _.merge(newOptions, {
                pane: {
                  background: {
                    innerRadius: '80%',
                    outerRadius: '100%'
                  }
                },

                tooltip: {
                  enabled: false
                },

                yAxis: {
                  showFirstLabel: false,
                  showLastLabel: false,
                  min: 0,
                  max: 100,
                  stops: [
                    [0.1, '#55BF3B'], // green
                    [0.5, '#DDDF0D'], // yellow
                    [0.9, '#DF5353'] // red
                  ],
                  minorTickInterval: null,
                  tickAmount: 2
                },

                plotOptions: {
                  solidgauge: {
                    innerRadius: '80%',
                    outerRadius: '100%',
                    dataLabels: {
                      y: 30,
                      borderWidth: 0,
                      useHTML: true
                    }
                  }
                },
                series: [{
                  dataLabels: {
                    format: '<div style="text-align:center">' +
                    '<span style="font-size:25px;color:' +
                    ((Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black') + '">{y}%</span><br/>' +
                    '<span style="font-size:12px;color:silver;">' + newOptions.series[0].name + '</span>' +
                    '</div>'
                  }
                }]
              });
            } else if (scope.type && scope.type === 'column') {
              if (scope.stacked) {
                newOptions.plotOptions = {
                  column: {
                    stacking: 'normal'
                  }
                };
              }
            }
            Highcharts.chart(element, newOptions);
          }
        }
      }
    };
  }
}

export default ChartDirective;
