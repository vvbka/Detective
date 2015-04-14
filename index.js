"use strict";

var _ = require('cutils'),
    g = _.graph(),
    l = function (arr) {
        return arr.map(function (str) {
            return str.toLowerCase();
        });
    },
    people = l(['Green', 'Mustard', 'Peacock', 'Plum', 'Scarlet', 'White']) // 6
    ,
    places = l(['Bathroom', 'Study', 'Dining Room', 'Game Room', 'Garage', 'Bedroom', 'Living Room', 'Kitchen', 'Courtyard']) // 9
    ,
    weapons = l(['Wrench', 'Candlestick', 'Dagger', 'Pistol', 'Lead Pipe', 'Rope']) // 6
    ,
    i, j, x, y;

for (i = 0; i < people.length; i += 1) {
    for (x = 0; x < weapons.length; x += 1) {
        for (j = 0; j < places.length; j += 1) {
            //console.log('%s => %s => %s', people[i], weapons[x], places[j])
            g.edge(people[i], places[j], x);
        }
    }
}

process.stdin.setEncoding('utf8');
process.stdin.resume();
process.stdin.on('data', function (chunk) {
    chunk = chunk.trim().toLowerCase().split(/\s+/g);

    // 0 => command
    // 1 => person
    // 2 => weapon
    // 3 => place

    if (chunk[0] === 'not') {
        if (chunk[1] === 'person' || chunk[1] === 'place') {
            g = g.delete(chunk[2]);

            if (chunk[1] === 'person') {
                people = people.filter(function (person) {
                    return person !== chunk[2];
                });
            } else {
                places = places.filter(function (place) {
                    return place !== chunk[2];
                });
            }
        } else {
            var index = weapons.indexOf(chunk[1])
            g.edges = g.edges.filter(function (edge) {
                return edge.weight !== index;
            });
            weapons = weapons.filter(function (weapon) {
                return weapon !== chunk[1];
            });
        }
    } else if (chunk[0] === 'my:') {
        var index = weapons.indexOf(chunk[2]);
        g = g.delete(chunk[1]).delete(chunk[3]);
        g.edges = g.edges.filter(function (edge) {
            return edge.weight !== index;
        })
        console.log(index);
        people = people.filter(function (person) {
            return person !== chunk[1];
        });
        places = places.filter(function (place) {
            return place !== chunk[3];
        });
    }

    console.log('\ncertainties:');

    var person, place, thing;

    if (people.length === 1) person = people[0];
    if (places.length === 1) place = places[0];
    if (weapons.length === 1) thing = weapons[0];
    if (person && place && thing) process.exit(0);

    var tmp;

    if (!person) {
        person = people.map(function (prsn) {
            var p = ((54 - g.edges.filter(function (edge) {
                    return edge.a === prsn;
                }).length) / 54)
                //console.log('  P(%s) = %s%', prsn, p * 100)
            return p;
        });
    }

    if (!place) {
        console.log('');
        place = places.map(function (plc) {
            var p = ((54 - g.edges.filter(function (edge) {
                    return edge.b === plc;
                }).length) / 54);
                //console.log('  P(%s) = %s%', plc, p * 100)
            return p;
        });
    }

    console.log('');
    for (x = 0; x < people.length; x += 1) {
        for (y = 0; y < places.length; y += 1) {
            console.log(' => P(%s && %s) = %s%', people[x], places[y], person[x] * place[y] * 100);
        }
    }

    process.stdout.write('> ');
})
process.stdout.write('> ');