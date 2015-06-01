/**
 * lib/commands.js - detective
 * all commands mapped for alfred.
 * Licensed under MIT.
 * Copyright (C) 2015 VBKA.
 **/

'use strict';

module.exports = [
  {
    prompts: ['* asked a question with *, *, *'],
    script: __dirname + '/cmds/turn.js'
  },
  {
    prompts: ['hello *'],
    script: __dirname + '/cmds/hello.js'
  }
];
