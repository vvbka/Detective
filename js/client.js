angular.module('app', []).controller('client', function ($scope) {
    'use strict';
    
    window.$scope = $scope;
    $scope.sock = io();
    $scope.players = [];
    $scope.board = [];
    $scope.labels = {};
    $scope.name = '';
    
    $scope.start = function () {
        $scope.name = $('#name').val().trim();
        $scope.sock.emit('init', $scope.name);
        
        $('#modal-init').modal('hide');
        $('.splash').fadeOut();
        $('.full-container').addClass('in');
    };
    
    $scope.sock.on('players', function (players) {
        $('#name').typeahead({
            source: players,
            order: 'asc',
            highlight: true
        });
    });
    
    $scope.sock.on('data', function (data) {
        console.log('received');
        $scope.board = data.board;
        $scope.players = data.players;
        $scope.labels = data.labels;
        $scope.$apply();
    });

    $scope.sock.on('move', function () {
        $scope.$apply(function () {
            $scope.movable = true;
        });
    });
    
    $scope.movable = false;
    $scope.getPosition = function (x, y) {
        if ($scope.movable) {
            $scope.movable = false;
            $scope.sock.emit('moved', [x, y]);
            
            for (var player of $scope.players) {
                if (player.charName === $scope.name) {
                    player.location = [x, y];
                    break;
                }
            }
        }
    };

    $scope.loc2class = function (x, y) {
        for (var player of $scope.players) {
            if (player.location[0] === x && player.location[1] === y) {
                return ' ' + player.charName.split(' ')[1] + '-bg';
            }
        }

        return '';
    };
    
    $('#modal-init').modal('show');
});