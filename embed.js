
(function (w, d, n) {
  'use strict';
  var utils = {
          propagateErrorSafely: function (err) {
              // re-throw the error in a new execution block
              // so errors keep being transparent towards devs
              w.setTimeout(function () {
                  throw err;
              }, 0);
          },
          dom: {
              getElementsByClassName: (function () {
                  var overwrite;
                  if (d.getElementsByClassName) {
                      overwrite = d.getElementsByClassName;
                  } else {
                      // 137 bytes polyfill
                      overwrite = function(a,b,c,d){c=[];for(d in b=this.all)(b[d].className||'').match(a.replace(/(\S+) */g,'(?=(^|.* )$1( |$))'))&&c.push(b[d]);return c};
                  }

                  return overwrite;
              }()),

              extractDataAttributes: function (element) {
                  var dataAttrRegex = /^data\-([\w\W]+)$/,
                      attributes = (element ? element.attributes || [] : []),
                      result = {},
                      currentAttribute,
                      nodeValue,
                      nodeName,
                      max,
                      i;

                  for (i = 0, max = attributes.length; i < max; i += 1) {
                      currentAttribute = attributes[i];
                      nodeValue = currentAttribute.value || currentAttribute.nodeValue;
                      nodeName = currentAttribute.name || currentAttribute.nodeName;

                      if (dataAttrRegex.test(nodeName)) {
                          result[
                              // remove the data- prefix from the key
                              nodeName.replace('data-', '')
                          ] = nodeValue;
                      }
                  }

                  return result;
              },



              getViewportMeta: function () {
                  var metaTags = d.getElementsByTagName('meta'),
                      nameAttribute,
                      metaTagsCount,
                      result,
                      i;

                  for (i = 0, metaTagsCount = metaTags.length; i < metaTagsCount; i += 1) {
                      nameAttribute = metaTags[i].getAttribute('name');
                      if (nameAttribute && nameAttribute === 'viewport') {
                          result = metaTags[i];
                          break;
                      }
                  }

                  // overwrite function and from now on directly
                  // return the reference to the element for faster
                  // future calls
                  utils.getViewportMeta = function () {
                      return result;
                  };

                  return result;
              }
          },
          hacks: {
              percentualFrameDimension: function (dimension, percentage) {
                  var result = percentage,
                      visualLayout,
                      intPercentage;

                  // unfortunately iframes in iOS do not behave as expected
                  // when using procentual dimensions. Therefor we
                  // calculate the procentual dimensions back to fixed
                  // pixels based on the visual layout dimensions.
                  // The issue is that a procentual value behaves as if
                  // the dimension value is set to auto. So in fact, the frame
                  // scales towards the size of the layout of the page
                  // within the frame
                  if (
                      n.userAgent.match(/iPhone|iPad|iPod/i) &&
                          (
                              (
                                  dimension === 'height' || dimension === 'width'
                              ) &&
                              percentage
                          )
                  ) {
                      visualLayout = {
                          height: d.documentElement.clientHeight,
                          width: d.documentElement.clientWidth
                      };

                      if (percentage.indexOf('%') > -1) {
                          // cast it to a real int
                          intPercentage = parseInt(percentage, 10);

                          // calculate the size in pixels and cast it back to a string
                          result = (visualLayout[dimension] * (intPercentage / 100)).toString();
                      }
                  }

                  return result;
              }
          }
      },

      /**
       * @constructor
       */
      GamePlayer = function (config, domElement) {
          var settings = config,
              playerFrame,
              host = 'http://kidmons.com',
              referrer = w.encodeURIComponent(d.location.protocol + '//' + d.location.host),

              setSize = function (width, height) {
                  if (width) {
                      width = utils.hacks.percentualFrameDimension(
                          'width',
                          width
                      );

                      // set the units as pixels if there isn't a percentual unit given
                      if (width.indexOf('%') < 0) {
                          domElement.style.width = width + 'px';
                      } else {
                          domElement.style.width = width;
                      }

                      playerFrame.width = width;
                  }

                  if (height) {
                      height = utils.hacks.percentualFrameDimension(
                          'height',
                          height
                      );
                      if (height.indexOf('%') < 0) {
                          domElement.style.height = height + 'px';
                      } else {
                          domElement.style.height = height;
                      }

                      playerFrame.height = height;
                  }
              },


              build = function () {

                  var error = false;
                  var message = "<p>Error:</p>";
                  var whiteList = [];
                  var linked = d.getElementsByClassName('kmlink');
                  var game = d.getElementsByClassName('kidmonsgame');

                  if (linked.length == 0) {

                      referrer = decodeURIComponent(referrer);
                      var correct = false;

                      for (var i = 0; i < whiteList.length; i++) {
                          
                          if(whiteList[i] == referrer){
                              correct = true;
                              break;
                          }
                      };

                      if(!correct){
                          message += "<p>Incorrect embed code. Please, do not modify the script: link is mandatory.</p>";
                          error = true;  
                      }

                    
                  }else{

                      var rel = linked[0].getAttribute("rel");
                      var href = linked[0].getAttribute("href");
                      var anchor =  linked[0].innerHTML;

                      if(rel == 'nofollow'){
                          message += "<p>Incorrect embed code. Attribute 'nofollow' found on link. Please, remove it.</p>";
                          error = true;
                      }
                     
                     if(href.indexOf("http://kidmons.com") != 0){
                          message += "<p>Incorrect embed code. Incorrect href on link.</p>"; 
                          error = true;  
                      }

                      if(anchor.length == 0){
                          message += "<p>Incorrect embed code. Wrong anchor text on link.</p>";
                          error = true;   
                      }
                  }

                  if(error){
                      var aviso = d.createElement('div');
                          aviso.innerHTML =  message;
                          aviso.style.fontFamily = 'sans-serif';
                          aviso.style.display = 'block';
                          aviso.style.width = '100%';
                          aviso.style.textAlign = 'center';
                          aviso.style.fontSize = '20px' ;
                          domElement.appendChild(aviso);
                      return;
                  }

                  var playerUrl = host + '/external/' + settings.gameid + '/?r='+ referrer;
                  playerFrame = d.createElement('iframe');

                  setSize(settings.width, settings.height);
               
                  playerFrame.setAttribute('webkitAllowFullScreen', 'true');
                  playerFrame.setAttribute('mozallowfullscreen', 'true');
                  playerFrame.setAttribute('allowFullScreen', 'true');
                  playerFrame.setAttribute('webkit-playsinline', 'true');
                  playerFrame.setAttribute('frameBorder', '0');
                  playerFrame.setAttribute('scrolling', 'no');
                  playerFrame.setAttribute('seamless', 'true');
               

                  playerFrame.style.margin = '0';
                  playerFrame.style.padding = '0';
                  playerFrame.style.border = '0';

                  playerFrame.setAttribute('src', playerUrl);
                  //domElement.appendChild(playerFrame);

                   if (linked.length == 0) {
                      domElement.appendChild(playerFrame);
                   }else{
                      game[0].style.position = "relative";
                      linked[0].style.textAlign = 'center';
                      linked[0].style.display = 'block';
                      linked[0].style.visibility = 'visible';
                      linked[0].style.position = "absolute";
                      linked[0].style.bottom = "2px";
                      linked[0].style.left = "0px";
                      linked[0].style.right = "0px";
                      linked[0].style.fontSize = "12px";
                      linked[0].style.fontFamily = "sans-serif";
                      linked[0].style.color = "white";
                      linked[0].style.textDecoration = "none";
                      linked[0].style.textShadow = "1px 1px 1px #000000";
                      //linked[0].style.backgroundColor = "rgba(0,0,0,0.2)";
                      domElement.insertBefore(playerFrame,linked[0]);
                   }


                   //AQUI PONEMOS EL CODIGO POST MESAGGE

                   window.addEventListener('message', function(event) {
                      
                       var e = event.data;

                       if(e === 'gameLoaded'){
                           playerFrame.contentWindow.postMessage("continueLoading", "*");
                       }

                   });



                  
              },




              init = function () {
                  build();
              };

              host = 'http://kidmons.com';


          init();

          // return the public API
          return {
              settings: settings
          };
      },

      GamePlayerFactory = (function () {
          var players = {},
              publicApi, // retain empty for pilot purposes

              init = function () {
                  var domPlayers,
                      config,
                      max,
                      i;

                  // Future requirement: wait for DOM ready or use a push mechanism
                  // For now, just load the API close to </body>
                  domPlayers = utils.dom.getElementsByClassName.call(d, 'kidmonsgame');

                  for (i = 0, max = domPlayers.length; i < max; i += 1) {
                      config = utils.dom.extractDataAttributes(domPlayers[i]);

                      // a try block for each player
                      // if one player crashes, the other can still continue
                      try {
                          if (config.gameid) {
                              players[config.gameid] = new GamePlayer(config, domPlayers[i]);
                          }
                      } catch (err) {
                          utils.propagateErrorSafely(err);
                      }
                  }
              };

          publicApi = {

              start: init
          };

          // make the factory available through a global
          return (w.GamePlayerFactory = publicApi);
      }());




 


  



  w.GamePlayerFactory.start();
}(window, window.document, window.navigator));