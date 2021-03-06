'use strict';

/**
 * Module dependencies.
 */
angular.module('mean.competitor').controller('CompetitorController', ['$scope', '$log', '$timeout', '$location', '$stateParams', 'Global', 'Competitor', 'Wettkampf', 'Disziplin', 'filterFilter',
function($scope, $log, $timeout, $location, $stateParams, Global, Competitor, Wettkampf, Disziplin, filterFilter) {
    /*global Ladda:false */
    $scope.global = Global;
    $scope.package = {
        name : 'competitor'

    };
   
    $scope.competitor = {
        gender: '',
        name:'',
        firstname: '',
        address: '',
        zip: '',
        location: '',
        society: '',
        email: '',
        birthdate: ''
    };

    $scope.cancel = function(){
        $location.path('/competitor/administration');
    };

    $scope.subscriptionActive = $scope.global.isCompetitorAdmin;

    $scope.hasAuthorization = function(competitor) {
        $log.info('hasAuthorization in competitor called...');
        return $scope.global.isCompetitorAdmin;
    };

    $scope.create = function(isValid) {
        $log.info('create competitor called...: ' + isValid);
        if (isValid) {
            var competitorToCreate = new Competitor({
                gender : this.competitor.gender,
                name : this.competitor.name,
                firstname : this.competitor.firstname,
                address : this.competitor.address,
                zip : '' + this.competitor.zip,
                location : this.competitor.location,
                society : this.competitor.society,
                email : this.competitor.email,
                birthdate : this.competitor.birthdate,
                disciplines : $scope.selectDeclaredDisciplines($scope.allDisciplines)
            });
            competitorToCreate.$save(function(response) {
                $location.path('/competitor/subscription/confirmation');
            });
        } else {
            $scope.competitor.submitted = true;
        }
    };

    $scope.loadDisciplins = function(cb) {
        $log.info('loadDisciplins called...');
        Disziplin.query(function(disciplines){
            
            disciplines.forEach(function(discipline){
                /* jshint ignore:start */
                var formatObj = JSON.parse(discipline.format);
                discipline.formatFnc = eval(formatObj.format);
                /* jshint ignore:end */
            });
            $scope.allDisciplines = disciplines;
            if (cb) {
                cb();
            }
        });
    };

    $scope.loadConfig = function(cb) {
        $log.info('loadConfig called...');
        Wettkampf.get({
        }, function(wettkampf) {
            $scope.wettkampf = wettkampf;
            if (wettkampf.anmeldungActive) {
                $scope.subscriptionActive = true;
            }
            if (cb) {
                cb();
            }
        });
    };

    $scope.loadConfigAndDisciplins = function() {
        $log.info('loadConfigAndDisciplins called...');
        $scope.loadConfig($scope.loadDisciplins);
    };

    $scope.loadDisciplinsAndFindOne = function() {
        $log.info('loadDisciplinsAndFindOne called...');
        $scope.loadDisciplins($scope.findOne);
    };

    $scope.loadConfigAndDisciplinsAndFindOne = function() {
        $log.info('loadConfigAndDisciplinsAndFindOne called...');
        $scope.loadConfig($scope.loadDisciplinsAndFindOne);
    };


    $scope.findOne = function() {
        $log.info('find competitor called... with: ' + $stateParams.competitorId);
        Competitor.get({
            competitorId : $stateParams.competitorId
        }, function(competitor) {
            $scope.competitor = competitor;
            competitor.disciplines.forEach(function(dbDiscipline) {
                $scope.allDisciplines.forEach(function(discipline) {
                    if (discipline._id === dbDiscipline.disciplineId) {
                        discipline.declared = true;
                        discipline.result = dbDiscipline.result;
                    }
                });
            });
        });
    };

    if (document.querySelector('#saveCompetitorMutation'))
        var saveCompetitorMutationButton = Ladda.create(document.querySelector('#saveCompetitorMutation'));

    $scope.update = function(isValid) {
        if (saveCompetitorMutationButton)
            saveCompetitorMutationButton.start();
        $log.info('update competitor called...: ' + isValid);
        if (isValid) {
            var competitor = $scope.competitor;
            competitor.disciplines = $scope.selectDeclaredDisciplines($scope.allDisciplines);

            if (!competitor.updated) {
                competitor.updated = [];
            }
            competitor.updated.push(new Date().getTime());

            competitor.$update(function() {
                if (saveCompetitorMutationButton) {
                    $timeout(function() {
                        saveCompetitorMutationButton.stop();
                    }, 500);
                }
                if ($scope.global.isCompetitorAdmin)
                    $location.path('competitor/administration');
            });
        } else {
            $scope.submitted = true;
        }
    };

    $scope.isPossibleDiscipline = function(discipline) {
        if (($scope.competitor === '') || ($scope.competitor.gender === ''))
            return false;
        if (discipline.geschlecht === 'm' && $scope.competitor.gender === 'female')
            return false;
        if (discipline.geschlecht === 'f' && $scope.competitor.gender === 'male')
            return false;
        if (!$scope.competitor.birthdate)
            return false;
        //        $log.info('type of $scope.competitor.birthdate: ' + typeof $scope.competitor.birthdate);
        //TODO: keine Ahnung wieso, birhtdate kommt als String von der DB
        if ( typeof $scope.competitor.birthdate === 'string')
            $scope.competitor.birthdate = new Date($scope.competitor.birthdate);
        if (discipline.jahrgang_von > $scope.competitor.birthdate.getFullYear())
            return false;
        if (discipline.jahrgang_bis < $scope.competitor.birthdate.getFullYear())
            return false;
        return true;
    };

    $scope.selectDeclaredDisciplines = function(srcDisciplines) {
        //        $log.info('selectDeclaredDisciplines called...');
        var destDisciplines = [];
        srcDisciplines.forEach(function(discipline) {
            if (discipline.declared && $scope.isPossibleDiscipline(discipline)) {
                //                $log.info('selectDeclaredDisciplines... ' + JSON.stringify(discipline));
                destDisciplines.push({
                    disciplineId : discipline._id
                });
            }
        });
        return destDisciplines;
    };

    $scope.deleteCompetitor = function(competitor) {
        var msg = 'Soll der Benutzer wirklich gelöscht werden? \n\nDies kann nicht mehr rückgängig gemacht werden!';
        if (confirm(msg)) {
            competitor.$delete(function () {
                $location.path('competitor/administration');
            });
        }
    };

}]);
