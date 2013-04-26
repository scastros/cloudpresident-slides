/*
 * Copyright 2013 Google Inc.
 *
 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 *
 */

/*
  Google HTML5 slides template

  Authors: Luke Mahé (code)
           Marcin Wichary (code and design)

           Dominic Mazzoni (browser compatibility)
           Charles Chen (ChromeVox support)

  URL: http://code.google.com/p/html5slides/
  
  Additions: Martin Gorner
  
   --- localization support
   
   To localize your slides, add ?lang=xx to the URL.
   A list of strings needing localization will be displayed.
   If XX is the language in which your slides are
   originally written, then say so by adding a lang attribute
   to the tag <section class="slides" lang="xx"> and the 
   localization warnings will disappear.
   To localize your slides to language xx, add a
   <translation lang="xx"> tag to each <article>.
   The tag should contain translated strings, one per line.
   To leave a string untranslated, use --self--
*/

var PERMANENT_URL_PREFIX = '';

var SLIDE_CLASSES_NB = 5;
var SLIDE_CLASSES = ['far-past', 'past', 'current', 'next', 'far-next'];
var curSlide;
var PM_TOUCH_SENSITIVITY = 15;
var UIMVT_DETECT_DELAY = 200;
var uimvtState;
var centerTimer;


/* ---------------------------------------------------------------------- */
// 3D slides are identified by class="slide3d" and their backsides with class="backslide3d"

function turn3d()
{
	swapBeginEnd3dClass(this);
}

function turn3dcurrent()
{
	swapBeginEnd3dClass(getSlideEl(curSlide));
}

function resetturn3d(nod)
{
	replaceClass(nod, "end3d", "begin3d");
}

function hidecontrols()
{
	var el;
	el = document.getElementById('rotate-slide-button');
	if (el != null) el.classList.add('hidden');
	el = document.getElementById('toggle3d-button');
	if (el != null) el.classList.add('hidden');
	el = document.getElementById('prev-slide-area');
	if (el != null) el.classList.add('hidden');
	el = document.getElementById('next-slide-area');
	if (el != null) el.classList.add('hidden');
}

function showcontrols()
{
	var el;
	el = document.getElementById('rotate-slide-button')
	if (el != null) el.classList.remove('hidden');
	el = document.getElementById('toggle3d-button');
	if (el != null) el.classList.remove('hidden');
	el = document.getElementById('prev-slide-area');
	if (el != null) el.classList.remove('hidden');
	el = document.getElementById('next-slide-area');
	if (el != null) el.classList.remove('hidden');
}

// swaps classes "begin" and "end" in the node with the specified HTML node.
// adds class "end" if none are found
function swapBeginEnd3dClass(nod)
{
	if (nod != null)
	{
		var new_class = "";
		var found = false;
		for (var i=0; i<nod.classList.length; i++)
		{
			var clas = nod.classList[i];
			if (clas == "end3d")
			{
				clas = "begin3d";
				found = true;
			}
			else if (clas == "begin3d")
			{
				clas = "end3d";
				found = true;
			}
			new_class += " " + clas;
		}
		if (!found)
			new_class += " " + "end3d";
		nod.setAttribute("class", new_class);
	}
}

function toggle3D(buttonId)
{
	nod = document.getElementById(buttonId);
	var exist3d = (document.querySelectorAll('.slide3d').length > 0);
	if (exist3d)
	{
		remove3D();
		nod.setAttribute("src", "images/cube3.png");
	}
	else
	{
		add3D();
		nod.setAttribute("src", "images/cube2.png");
	}
}

function remove3D()
{
	var slide3dEls = document.querySelectorAll('.slide3d');
	for (var i=0; i<slide3dEls.length; i++)
		replaceClass(slide3dEls[i], "slide3d", "slideno3d");
	
	slide3dEls = document.querySelectorAll('.backslide3d');
	for (i=0; i<slide3dEls.length; i++)
		replaceClass(slide3dEls[i], "backslide3d", "backslideno3d");
}

function add3D()
{
	var slide3dEls = document.querySelectorAll('.slideno3d');
	for (var i=0; i<slide3dEls.length; i++)
		replaceClass(slide3dEls[i], "slideno3d", "slide3d");
	
	slide3dEls = document.querySelectorAll('.backslideno3d');
	for (i=0; i<slide3dEls.length; i++)
		replaceClass(slide3dEls[i], "backslideno3d", "backslide3d");
}

function replaceClass(nod, classToFind, newClass)
{
	if (nod != null)
	{
		var new_class = "";
		for (var i=0; i<nod.classList.length; i++)
		{
			var clas = nod.classList[i];
			if (clas == classToFind)
				clas = newClass;
			new_class += " " + clas;
		}
		nod.setAttribute("class", new_class);
	}
}

// add as click handler to a link to prevent default click action (usually turn3d)
function noop(e)
{
	if (!e) var e = window.event;
	e.cancelBubble = true;
	if (e.stopPropagation) e.stopPropagation();
}

/* Slide movement */

function getSlideEl(no) {
  if ((no < 0) || (no >= slideEls.length)) { 
    return null;
  } else {
    return slideEls[no];
  }
};

function updateSlideClass(slideNo, className) {
  var el = getSlideEl(slideNo);
  
  if (!el) {
    return;
  }
  
  if (className) {
    el.classList.add(className);
  }
    
  for (var i=0; i< SLIDE_CLASSES_NB; i++) {
    if (className != SLIDE_CLASSES[i]) {
      el.classList.remove(SLIDE_CLASSES[i]);
    }
  }
};

function updateSlides() {
  for (var i = 0; i < slideEls.length; i++) {
    switch (i) {
      case curSlide - 2:
        updateSlideClass(i, 'far-past');
        break;
      case curSlide - 1:
        updateSlideClass(i, 'past');
        break;
      case curSlide: 
        updateSlideClass(i, 'current');
        break;
      case curSlide + 1:
        updateSlideClass(i, 'next');      
        break;
      case curSlide + 2:
        updateSlideClass(i, 'far-next');      
        break;
      default:
        updateSlideClass(i);
        break;
    }
  }

  triggerLeaveEvent(curSlide - 1);
  triggerEnterEvent(curSlide);

  window.setTimeout(function() {
    // Hide after the slide
    disableSlideFrames(curSlide - 2);
  }, 301);

  enableSlideFrames(curSlide - 1);
  enableSlideFrames(curSlide + 2);
  
  if (isChromeVoxActive()) {
    speakAndSyncToNode(slideEls[curSlide]);
  }  

  updateHash();
}

function buildNextItem() {
  var toBuild  = slideEls[curSlide].querySelectorAll('.to-build');

  if (!toBuild.length) {
    return false;
  }

  toBuild[0].classList.remove('to-build');

  if (isChromeVoxActive()) {
    speakAndSyncToNode(toBuild[0]);
  }

  return true;
}

function prevSlide() {
  if (curSlide > 0) {
    curSlide--;

    updateSlides();
  }
}

function nextSlide() {
  if (buildNextItem()) {
    return;
  }

  if (curSlide < slideEls.length - 1) {
    curSlide++;

    updateSlides();
  }
}

/* Slide events */

function triggerEnterEvent(no) {
  var el = getSlideEl(no);
  if (!el) {
    return;
  }

  var onEnter = el.getAttribute('onslideenter');
  if (onEnter) {
    new Function(onEnter).call(el);
  }

  var evt = document.createEvent('Event');
  evt.initEvent('slideenter', true, true);
  evt.slideNumber = no + 1; // Make it readable

  el.dispatchEvent(evt);
}

function triggerLeaveEvent(no) {
  var el = getSlideEl(no);
  if (!el) {
    return;
  }

  var onLeave = el.getAttribute('onslideleave');
  if (onLeave) {
    new Function(onLeave).call(el);
  }

  var evt = document.createEvent('Event');
  evt.initEvent('slideleave', true, true);
  evt.slideNumber = no + 1; // Make it readable
  
  el.dispatchEvent(evt);
}

/* Touch events */

function handleSwipeStart(event) {
    if (event.touches.length == 1) {
        touchDX = 0;
        touchDY = 0;

        touchStartX = event.touches[0].pageX;
        touchStartY = event.touches[0].pageY;

        document.addEventListener('touchmove', handleSwipeMove);
        document.addEventListener('touchend', handleSwipeEnd);
    }
}

function handleSwipeMove(event) {
    if (event.touches.length > 1) {
        cancelSwipe();
    } else {
        touchDX = event.touches[0].pageX - touchStartX;
        touchDY = event.touches[0].pageY - touchStartY;
        var aDX = touchDX*touchDX;
        var aDY = touchDY*touchDY;
        if (aDX+aDY < 80 || aDX > aDY)
            event.preventDefault(); // keep scrolling vertically but not horizontally
        // this is buggy though: if the user starts scrolling vertically, then scrolling
        // gets enabled for both directions until he lifts her finger
    }
}

function handleSwipeEnd(event) {
    var dx = Math.abs(touchDX);
    var dy = Math.abs(touchDY);

    if ((dx > PM_TOUCH_SENSITIVITY) && (dy < (dx * 2 / 3))) {
        if (touchDX > 0)
            prevSlide();
        else
            nextSlide();
    }

    cancelSwipe();
    centerTimer = window.setTimeout(detectUIMovement, UIMVT_DETECT_DELAY);
}

function handleTouchCancel(event)
{
    cancelSwipe();
    centerTimer = window.setTimeout(detectUIMovement, UIMVT_DETECT_DELAY);
}

function handleTouchLeave(event)
{
    // on mobiles, whenever the browser detects a gesture supported by its UI,
    // it fires a touchCancel ot touchLeave event and does not send additional
    // touch events until the finger leaves the screen. Only a timer-fired
    // detection hack can figure out if the viewport was changed (with a pinch to zoom gesture for example)
    cancelSwipe();
    centerTimer = window.setTimeout(detectUIMovement, UIMVT_DETECT_DELAY);
}

function handleOrientationChange()
{
    centerViewport();
}

function detectUIMovement()
{
    var oldState = uimvtState;
    uimvtState = window.pageXOffset << 12 | window.pageYOffset << 8 | window.innerWidth << 4 | window.innerHeight;
    if (uimvtState == oldState)
        centerViewport(); // center viewport when movement stops
    else
        centerTimer = window.setTimeout(detectUIMovement, UIMVT_DETECT_DELAY); // relaunch detection if movement continues
}

function cancelSwipe() {
    document.removeEventListener('touchmove', handleSwipeMove);
    document.removeEventListener('touchend', handleSwipeEnd);
}

function centerViewport()
{
    window.clearTimeout(centerTimer);

    // desktop vs mobile behaviour
    // both HTML and BODY tags have width:100%, height:100%, min-width:slide+padding width, min-height:slide+padding height
    // on desktop, the BODY tag will fill the available window
    // on mobile, since the virtual viewport is infinite, the BODY tag will have the min-width and min-height dimensions
    // therefore, we can center the body tag in the window on mobile only
    // the formula below will produce an offset of 0,0 on desktop

    var el = document.body;
    var offsetY = 0;
    var deltaY  = (window.innerHeight - document.body.clientHeight)/2;
    if (deltaY > 0)
        offsetY = deltaY;
    var offsetX = 0;
    var deltaX = (window.innerWidth - document.body.clientWidth)/2;
    if (deltaX > 0)
        offsetX = deltaX;

    // translate the 'body' tag to center it
    var transform = "translate(" + offsetX + "px, " + offsetY + "px)";
    if (transform != el.style.webkitTransform)
    {
        el.style.webkitTransform = transform;
        el.style.webkitTransition = "0.5s";
    }

    // if applicable, scroll to center the slide (X direction only)
    window.webkitRequestAnimationFrame(continuousXScrollToCenter);

}

function continuousXScrollToCenter()
{
    var deltaX = (window.innerWidth - document.body.clientWidth)/2;
    var targetX = deltaX<0 ? -deltaX : 0;
    if (Math.abs(targetX - window.pageXOffset) > 50)
    {
        window.scrollBy((targetX - window.pageXOffset) / 4, 0);
        window.webkitRequestAnimationFrame(continuousXScrollToCenter);
    }
    else
        window.scrollTo(targetX, window.pageYOffset);
}

/* Mouse wheel events*/

function handleMouseWheel(event)
{	// for webkit, registered on 'mousewheel'
	var dx = Math.abs(event.wheelDeltaX);
	var dy = Math.abs(event.wheelDeltaY);
	if (dx  > dy*2)
	{
		event.preventDefault();
		var now = Date.now();
		
		if (window.prevMouseWheelEventTime === undefined)
			window.prevMouseWheelEventTime = 0;
			
		if (now - window.prevMouseWheelEventTime > 1000)
		{
			window.prevMouseWheelEventTime = now;
			var delta = event.wheelDeltaX; // vendors please standardize
			if (delta < 0)
				nextSlide();
			if (delta > 0)
				prevSlide();
		}
	}
}

function handleMouseWheel2(event)
{   // for mozilla, registered on 'DOMMouseScroll'
	if (event.axis == 1)
	{
		event.preventDefault();
		var now = Date.now();
		
		if (window.prevMouseWheelEventTime === undefined)
			window.prevMouseWheelEventTime = 0;

		if (now - window.prevMouseWheelEventTime > 1000)
		{
			window.prevMouseWheelEventTime = now;
			var delta = event.detail; // vendors please standardize
			if (delta > 0)
				nextSlide();
			if (delta < 0)
				prevSlide();
		}
	}
}

/* Preloading frames */

function disableSlideFrames(no) {
  var el = getSlideEl(no);
  if (!el) {
    return;
  }

  var frames = el.getElementsByTagName('iframe');
  for (var i = 0, frame; frame = frames[i]; i++) {
    disableFrame(frame);
  }
}

function enableSlideFrames(no) {
  var el = getSlideEl(no);
  if (!el) {
    return;
  }

  var frames = el.getElementsByTagName('iframe');
  for (var i = 0, frame; frame = frames[i]; i++) {
    enableFrame(frame);
  }
}

function disableFrame(frame) {
  frame.src = 'about:blank';
}

function enableFrame(frame) {
  var src = frame._src;

  if (frame.src != src && src != 'about:blank') {
    frame.src = src;
  }
}

function setupFrames() {
  var frames = document.querySelectorAll('iframe');
  for (var i = 0, frame; frame = frames[i]; i++) {
    frame._src = frame.src;
    disableFrame(frame);
  }
  
  enableSlideFrames(curSlide);
  enableSlideFrames(curSlide + 1);
  enableSlideFrames(curSlide + 2);  
}

function setup3Dslides() {
	// decorate slides so that a turned slide comes back to default positino on next/prev slide
	var slides = document.querySelectorAll('article.slide3d');
	for (var i = 0, slide; slide = slides[i]; i++) {
	    //slide.onclick = turn3d; // no more since we have a turn slide button
	    slide.setAttribute("onslideleave", "resetturn3d(this)");
	    slide.setAttribute("onslideenter", "resetturn3d(this)");
	  }
	// decorate links to prevent slide turning on link click
	var links = document.querySelectorAll('article.slide3d a');
	for (var i = 0, link; link = links[i]; i++) {
	    link.onclick = noop;
	    link.setAttribute("target", "_blank");
	  }
}

function setupInteraction() {
    /* Clicking and tapping */

    /* Swiping */
    document.addEventListener('touchstart', handleSwipeStart, false);
    document.addEventListener('touchcancel', handleTouchCancel);
    document.addEventListener('touchleave', handleTouchLeave);
    window.addEventListener('resize', handleOrientationChange);
    /* mouse wheel and trackpad scrolling*/
    document.addEventListener('DOMMouseScroll', handleMouseWheel2, false);
    document.addEventListener('mousewheel', handleMouseWheel, false);
}

/* ChromeVox support */

function isChromeVoxActive() {
  if (typeof(cvox) == 'undefined') {
    return false;
  } else {
    return true;
  }
};

function speakAndSyncToNode(node) {
  if (!isChromeVoxActive()) {
    return;
  }
  
  cvox.ChromeVox.navigationManager.switchToStrategy(
      cvox.ChromeVoxNavigationManager.STRATEGIES.LINEARDOM, 0, true);  
  cvox.ChromeVox.navigationManager.syncToNode(node);
  cvox.ChromeVoxUserCommands.finishNavCommand('');
  var target = node;
  while (target.firstChild) {
    target = target.firstChild;
  }
  cvox.ChromeVox.navigationManager.syncToNode(target);
};

function speakNextItem() {
  if (!isChromeVoxActive()) {
    return;
  }
  
  cvox.ChromeVox.navigationManager.switchToStrategy(
      cvox.ChromeVoxNavigationManager.STRATEGIES.LINEARDOM, 0, true);
  cvox.ChromeVox.navigationManager.next(true);
  if (!cvox.DomUtil.isDescendantOfNode(
      cvox.ChromeVox.navigationManager.getCurrentNode(), slideEls[curSlide])){
    var target = slideEls[curSlide];
    while (target.firstChild) {
      target = target.firstChild;
    }
    cvox.ChromeVox.navigationManager.syncToNode(target);
    cvox.ChromeVox.navigationManager.next(true);
  }
  cvox.ChromeVoxUserCommands.finishNavCommand('');
};

function speakPrevItem() {
  if (!isChromeVoxActive()) {
    return;
  }
  
  cvox.ChromeVox.navigationManager.switchToStrategy(
      cvox.ChromeVoxNavigationManager.STRATEGIES.LINEARDOM, 0, true);
  cvox.ChromeVox.navigationManager.previous(true);
  if (!cvox.DomUtil.isDescendantOfNode(
      cvox.ChromeVox.navigationManager.getCurrentNode(), slideEls[curSlide])){
    var target = slideEls[curSlide];
    while (target.lastChild){
      target = target.lastChild;
    }
    cvox.ChromeVox.navigationManager.syncToNode(target);
    cvox.ChromeVox.navigationManager.previous(true);
  }
  cvox.ChromeVoxUserCommands.finishNavCommand('');
};

/* Hash functions */

function getCurSlideFromHash() {
  var slideNo = parseInt(location.hash.substr(1));

  if (slideNo) {
    curSlide = slideNo - 1;
  } else {
    curSlide = 0;
  }
}

function updateHash() {
  location.hash = curSlide + 1;
}

function handleBodyKeyDown(event) {
  switch (event.keyCode) {
    case 39: // right arrow
    case 34: // PgDn
      nextSlide();
      event.preventDefault();
      break;

      case 37: // left arrow
    //case 8: // Backspace
      case 33: // PgUp
      prevSlide();
      event.preventDefault();
      break;

    case 40: // down arrow
      if (isChromeVoxActive()) {
        speakNextItem();
      } else {
    	  turn3dcurrent();
      }
      event.preventDefault();
      break;

    case 38: // up arrow
      if (isChromeVoxActive()) {
        speakPrevItem();
      } else {
    	  turn3dcurrent();
      }
      event.preventDefault();
      break;
      
    case 13: // Enter
    case 32: // space
      turn3dcurrent();
      event.preventDefault();
      break;
  }
};

function addEventListeners() {
  document.addEventListener('keydown', handleBodyKeyDown, false);
  window.addEventListener('popstate', function(e)
		  {
		  	getCurSlideFromHash();
		  	updateSlides();
		  });
};

/* Initialization */

function addPrettify() {
  var els = document.querySelectorAll('pre');
  for (var i = 0, el; el = els[i]; i++) {
    if (!el.classList.contains('noprettyprint')) {
      el.classList.add('prettyprint');
    }
  }
  
  var el = document.createElement('script');
  el.type = 'text/javascript';
  el.src = PERMANENT_URL_PREFIX + 'prettify.js';
  el.onload = function() {
    prettyPrint();
  }
  document.body.appendChild(el);
}

function addFontStyle() {
  var el = document.createElement('link');
  el.rel = 'stylesheet';
  el.type = 'text/css';
  el.href = 'http://fonts.googleapis.com/css?family=' +
            'Open+Sans:regular,semibold,italic,italicsemibold|Droid+Sans+Mono';

  document.body.appendChild(el);
}

function addGeneralStyle() {
    var el = document.createElement('link');
    el.rel = 'stylesheet';
    el.type = 'text/css';
    el.href = PERMANENT_URL_PREFIX + 'styles.css';
    document.body.appendChild(el);

    // No mobile specific settings here
    // the default behaviour of mobile browsers is
    // to zoom the body until its width fills the screen
    // width which is exactly what we want.
}

function makeBuildLists() {
  for (var i = curSlide, slide; slide = slideEls[i]; i++) {
    var items = slide.querySelectorAll('.build > *');
    for (var j = 0, item; item = items[j]; j++) {
      if (item.classList) {
        item.classList.add('to-build');
      }
    }
  }
}

function handleDomLoaded() {
  slideEls = document.querySelectorAll('section.slides > article');

  localizeAllSlides(slideEls, getQueryVariable('lang'));
  
  setupFrames();

  addFontStyle();
  addGeneralStyle();
  addPrettify();
  addEventListeners();
  setup3Dslides();

  updateSlides();

  setupInteraction();
  makeBuildLists();
  
  // deactivate 3D if not supported in browser
  if (!capaCss3D())
	 toggle3D('togglebutton1');

  document.body.classList.add('loaded');
}

/* page numbers */
function addPageNumbers(slides)
{
	for (var slide=1;  slide<slides.length; slide++)
	{
		var articleElement = slides[slide];
		var el = document.createElement('div');
		el.innerHTML = slide+1 +"/"+slides.length;
		el.classList.add("pagenumber");
		articleElement.appendChild(el);
	}
}

/* localization helpers */

function localizeAllSlides(slides, lang)
{
	// if language not specified, assume english
	if (lang === undefined || lang == '')
		lang = 'en';
	lang = lang.toLowerCase();
	
	// get the base language of the slides (english assumed if not specified)
	var slideslang = 'en';
	var topnode = document.querySelector('section.slides');
	if (topnode !== undefined && topnode.getAttribute('lang') !== null && topnode.getAttribute('lang') != '')
		slideslang = topnode.getAttribute('lang');
	slideslang = slideslang.toLowerCase();
	
	// nothing to do if the language is already the correct one
	if (lang == slideslang)
		return;
	
	// otherwise, we need to localize
	var tolocalizeall = '';
	for (var slide=0;  slide<slides.length; slide++)
	{
		var translations = getTranslations(slides[slide], lang);
		var tolocalize = localize(slides[slide], translations);
		var imagestolocalize = localizeImages(slides[slide], slideslang, lang);
		if (tolocalize !== '')
		{
			tolocalizeall += '<div><b>Slide ' + (slide+1) + ' needs localization to lang=\"' + lang + '\"' + ': </b><br/>';
			tolocalizeall += tolocalize;
			tolocalizeall += imagestolocalize;
			tolocalizeall += '</div>';
		}
	}

	// write unlocalized elements to the screen
	var el = document.querySelector('section.slides');
	var nel = document.createElement('div');
	nel.innerHTML = tolocalizeall;
	el.appendChild(nel);
}

function getTranslations(nod, lang)
{
	var selector = "translation[lang|=\"" + lang + "\"]";
	var translations = nod.querySelectorAll(selector)[0];
	if (translations !== undefined)
	{
		var translated =  translations.textContent.split('\n');
		var cleantranslated = new Array;
		for (var i=0,j=0; i<translated.length; i++)
		{
			if ( !isallblanks(translated[i]) )
				cleantranslated[j++] = translated[i];
		}
		var result = new Object;
		result.strings = cleantranslated;
		result.current = 0;
		result.count = function() {return this.strings.length - this.current;};
		return result;
	}
}

function localize(nod, translations, codelevel)
{
	// returns a string vith all non yet localized strings in this node
	var result = '';
	for (var i=0; i<nod.childNodes.length; i++)
	{
		var child = nod.childNodes[i];
		if (child.nodeType === 3 && !isallblanks(child.nodeValue)) // 3 = Node.TEXT_NODE
		{
			if (codelevel === undefined || isNaN(codelevel) || codelevel > 0) // skip code in <pre> tag unless it is marked with any kind of tag
			{
				if (translations !== undefined && translations.count() > 0)
				{ // yes, we have a translation
				  // --self-- stands for "do not translate"
					if (translations.strings[translations.current].indexOf('--self--') == -1)
						child.nodeValue = translations.strings[translations.current++];
					else
						translations.current++;
				}
				else
				{ // no, we do not have a translation
					result += child.nodeValue + '<br/>';
				}
			}
		}
		
		// continue recursion but skip <translation> tags
		if (child.childNodes.length > 0 && child.localName != 'translation')
		{
			var skip = false;
			if (child.localName == 'pre')
				result += localize(child, translations, 0); // codelevel 0 on entering <pre> tag, goes up after that
			else
				result += localize(child, translations, codelevel+1);
		}
	}
	return result;
}

function localizeImages(nod, langin, langout)
{
	// looking for images names like toto_en.gif
	// replacing them with toto_fr.gif
	var result = '';
	var langin_str = '_' + langin + '.';
	var langout_str = '_' + langout + '.';
	var images = nod.querySelectorAll('img');
	for (var i=0; i<images.length; i++)
	{
		images[i].src = images[i].src.replace(langin_str, langout_str);
		if (images[i].src.indexOf(langout_str) > 0)
			result += 'Image localized: ' + images[i].src + '<br/>';
	}
	return result;
}

function isallblanks(string)
{
	if (string === undefined)
		return true;
	for (var i=0; i<string.length; i++)
	{
		if (string.charCodeAt(i) != 32 && // space
			string.charAt(i) != '\t' &&     // tab
			string.charCodeAt(i) != 10 && // CR
			string.charCodeAt(i) != 13 && // LF
			string.charCodeAt(i) != 160)   // No-break space (&nbsp;)
			return false;
	}
	return true;
}

function capaCss3D()
{
    if ('perspectiveProperty' in document.body.style)
        return true;
    if ('WebkitPerspective' in document.body.style)
        return true;
    if ('MozPerspective' in document.body.style)
        return true;
    if ('OPerspective' in document.body.style)
        return true;
    if ('msPerspective' in document.body.style)
        return true;

    return false;
}

function getQueryVariable(variable)
{
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i = 0; i < vars.length; i++)
    {
        var pair = vars[i].split("=");
        if (pair[0] == variable)
            return unescape(pair[1]);
    }
}

function initialize() {
  getCurSlideFromHash();

  if (window['_DEBUG']) {
    PERMANENT_URL_PREFIX = '../';
  }

  if (window['_DCL']) {
    handleDomLoaded();
  } else {
    document.addEventListener('DOMContentLoaded', handleDomLoaded, false);
  }
}

// If ?debug exists then load the script relative instead of absolute
if (!window['_DEBUG'] && document.location.href.indexOf('?debug') !== -1) {
  document.addEventListener('DOMContentLoaded', function() {
    // Avoid missing the DomContentLoaded event
    window['_DCL'] = true
  }, false);

  window['_DEBUG'] = true;
  var script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = '../slides.js';
  var s = document.getElementsByTagName('script')[0];
  s.parentNode.insertBefore(script, s);

  // Remove this script
  s.parentNode.removeChild(s);
} else {
  initialize();
}
