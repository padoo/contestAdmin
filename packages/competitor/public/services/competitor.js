'use strict';

angular.module('mean.competitor').factory('Competitor', ['$resource',
function($resource) {
    return $resource('competitor/:competitorId', {
        competitorId : '@_id'
    }, {
        update : {method : 'PUT'},
        delete : {method : 'DELETE', params:{competitorId : '@_id'}},
        toggleStartNr : {method:'POST', params:{competitorId : '@_id'}}
    });
}]);


