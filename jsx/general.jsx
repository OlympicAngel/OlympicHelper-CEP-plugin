/*************************************************************************
* ADOBE CONFIDENTIAL
* ___________________
*
* Copyright 2014 Adobe
* All Rights Reserved.
*
* NOTICE: Adobe permits you to use, modify, and distribute this file in
* accordance with the terms of the Adobe license agreement accompanying
* it. If you have received this file from a source other than Adobe,
* then your use, modification, or distribution of it requires the prior
* written permission of Adobe. 
**************************************************************************/
if (typeof $ == 'undefined') {
  $ = {};
}

// this file should contain jsx-code that can run in all apps
// like polyfills of e.g. JSON

app.enableQE();

/**@type {Sequence} */
var s = app.project.activeSequence;
var selection = s.getSelection();

for (var i = 0; i < selection.length; i++) {
  var clip = selection[i];
  //if selected non clip - ignore it
  if (clip.name != "Graphic") {
    clip.setSelected(false, true)
    continue;
  }

  var mgt = clip.getMGTComponent()

  var components = clip.components;
  var textFX;
  for (var x = 0; x < components.length; x++) {
    var fx = components[x];
    if (fx.matchName == "AE.ADBE Text") {
      textFX = fx;
      break;
    }
  }

  var textSource = textFX.properties[0].getValue();

  var textSource_prefix = textSource.substring(0, 4);
  var textSource_json = textSource.substring(1);
  var test = textSource_json == "undefined"

  comp;
}

selection;