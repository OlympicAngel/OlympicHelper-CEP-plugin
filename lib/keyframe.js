class KeyFrame{
    
    constructor(time1,value1, easing1 = 0)
    {
        this.time = time1;
        this.value = value1;

        this.easing = easing1;

        return this;
    }

    get Val(){return Number(this.value)}
    get Time(){return this.time}
    get Easing(){return this.easing}
}

class EffectAttrValue{
    constructor(elemnt,name,baseValue,keyframeable = true)
    {
        this.elemnt = elemnt;
        this.name = name;
        this.value = baseValue;
        
        this.keyframeable = keyframeable;
        this.keyframesToggle = false;
        this.keyframes = [new KeyFrame(0,baseValue)];
    }

    ToggleKeyFrames(atTime = 0)
    {
        if(!this.keyframeable)
        {
            this.keyframesToggle = false;
            return false;
        }
        //debugger

        if(this.keyframesToggle)
        {
            var lastValue = this.keyframes[0].val;
            for(var x = 0; x < this.keyframes.length; x++)
            {
                lastValue = this.keyframes[x].Val;
                if(atTime < this.keyframes[x].Time)
                    break;
            }
            this.keyframes = [];
            this.AddKeyFrame(atTime,lastValue)
        }
        else
        {
            this.keyframes[0].time = atTime;
        }
        this.keyframesToggle = !this.keyframesToggle;
        return this.keyframesToggle;
    }

    AddKeyFrame(atTime, value, easing)
    {

        if(!this.keyframesToggle)
        {
            if(value != undefined)
                    this.keyframes[0].value = value;
            if(easing  != undefined)
                    this.keyframes[0].easing = easing;
            return;
        }

        for(var x = 0; x < this.keyframes.length; x++)
        {
            if(this.keyframes[x].Time == atTime)
            {
                if(value != undefined)
                    this.keyframes[x].value = value;
                if(easing != undefined)
                    this.keyframes[x].easing = easing;
                return;
            }
        }
        if(value == undefined)
            throw "what?";

        var key = new KeyFrame(atTime,value,easing);
        this.keyframes.push(key);
        var temp = DeepSort(this.keyframes,"time");
        this.keyframes = [];
        for(var x = 0; x < temp.length; x++)
        {
            this.keyframes[x] = temp[temp.length - 1 - x];
        }
        return key;
    }

    GetValueByTime(atTime)
    {
        var beforeValue , afterValue ;
        for(var x = 0; x < this.keyframes.length;x++)
        {
            if(atTime <= this.keyframes[x].Time)
                break;
        }
        if(x == this.keyframes.length)
            return this.keyframes[x-1].Val;
        beforeValue = afterValue = this.keyframes[x];
        if(x != 0)
            beforeValue = this.keyframes[x-1];
        var valueDistnce = afterValue.Val - beforeValue.Val;
        var timeDistance = afterValue.Time - beforeValue.Time;
        if(timeDistance == 0)
            return afterValue.Val;

        var value = beforeValue.Val;
        var relativeTime = atTime - beforeValue.Time;
        var ratioTime = relativeTime / timeDistance;

        var outEase = 0, inEase = 1;
        if(beforeValue.Easing == 1 || beforeValue.Easing == 3)
            outEase = 0.6;
        if(afterValue.Easing == 2 || afterValue.Easing == 3)
            inEase = 0.4;

        var easingFunction = bezier(outEase,0.05,inEase,0.95)
        value += easingFunction(ratioTime)*valueDistnce;
        if(isNaN(value))
        {
            debugger
        }
        return value;
    }

    RemoveKeyFrame(atTime)
    {
        for(var x = 0; x < this.keyframes.length;x++)
        {
            if(atTime == this.keyframes[x].Time)
            {
                this.keyframes.splice(x, 1);
                return false;
            }
        }
        return true
    }

    GenerateKeyframes(jumpInterval,jsx = false)
    {
        var keys = [];
        var startTime =  this.keyframes[0].Time;
        var endTime =  this.keyframes[ this.keyframes.length - 1].Time;
        for(var x = startTime; x <= endTime + jumpInterval*2; x += jumpInterval )
        {
            keys.push([x,this.GetValueByTime(x)]);
        }


        if(jsx)
        {
            if(!this.keyframesToggle)
            {
                return  JSON.stringify({"0":keys[0][1],max:0});
            }
            var keysMap = {};
            var a = 0;
            for(var x = 0; x < keys.length; x++)
            {
                a++
                var key = keys[x];
                keysMap[Math.floor(key[0]*120)] = key[1];
            }
            keysMap.max = Math.floor(keys[x-1][0]*120);
            return JSON.stringify(keysMap);
        }
        return keys;
    }
}

function DeepSort(array, sortBy, subSort, func = undefined) {
    var sortedList;
    if (subSort == undefined || sortBy == subSort) {
        var len = array.length;
        if (len < 2) {
            return array;
        }
        var pivot = Math.ceil(len / 2);
        return merge(
            DeepSort(array.slice(0, pivot), sortBy),
            DeepSort(array.slice(pivot), sortBy),
            sortBy);
    } else {
        sortedList = DeepSort(array, sortBy);
    }

    var finalArr = [];
    var firstItem = sortedList[0]
    if (func != undefined)
        func(firstItem);
    var splitedArray = [
            [firstItem]
        ],
        splitArrayIndex = 0;
    for (var x = 1; x < sortedList.length; x++) {
        var cItem = sortedList[x];
        if (func != undefined)
            func(cItem);
        if (splitedArray[splitArrayIndex][0][sortBy] == cItem[sortBy]) {
            splitedArray[splitArrayIndex].push(cItem);
        } else {
            splitArrayIndex++;
            splitedArray.push([cItem]);
        }
    }

    for (var x = 0; x < splitedArray.length; x++) {
        var currentPart = DeepSort(splitedArray[x], subSort);
        for (var z = 0; z < currentPart.length; z++) {
            finalArr.push(currentPart[z]);
        }
    }

    return finalArr;
}

var merge = function(left, right, attr) {
    var result = [];
    while ((left.length > 0) && (right.length > 0)) {
        if (left[0][attr] > right[0][attr]) {
            result.push(left.shift());
        } else {
            result.push(right.shift());
        }
    }

    result = result.concat(left, right);
    return result;
};



/**
 * https://github.com/gre/bezier-easing
 * BezierEasing - use bezier curve for transition easing function
 * by Gaëtan Renaudeau 2014 - 2015 – MIT License
 */

// These values are established by empiricism with tests (tradeoff: performance VS precision)
var NEWTON_ITERATIONS = 4;
var NEWTON_MIN_SLOPE = 0.001;
var SUBDIVISION_PRECISION = 0.0000001;
var SUBDIVISION_MAX_ITERATIONS = 10;

var kSplineTableSize = 11;
var kSampleStepSize = 1.0 / (kSplineTableSize - 1.0);

var float32ArraySupported = typeof Float32Array === 'function';

function A (aA1, aA2) { return 1.0 - 3.0 * aA2 + 3.0 * aA1; }
function B (aA1, aA2) { return 3.0 * aA2 - 6.0 * aA1; }
function C (aA1)      { return 3.0 * aA1; }

// Returns x(t) given t, x1, and x2, or y(t) given t, y1, and y2.
function calcBezier (aT, aA1, aA2) { return ((A(aA1, aA2) * aT + B(aA1, aA2)) * aT + C(aA1)) * aT; }

// Returns dx/dt given t, x1, and x2, or dy/dt given t, y1, and y2.
function getSlope (aT, aA1, aA2) { return 3.0 * A(aA1, aA2) * aT * aT + 2.0 * B(aA1, aA2) * aT + C(aA1); }

function binarySubdivide (aX, aA, aB, mX1, mX2) {
  var currentX, currentT, i = 0;
  do {
    currentT = aA + (aB - aA) / 2.0;
    currentX = calcBezier(currentT, mX1, mX2) - aX;
    if (currentX > 0.0) {
      aB = currentT;
    } else {
      aA = currentT;
    }
  } while (Math.abs(currentX) > SUBDIVISION_PRECISION && ++i < SUBDIVISION_MAX_ITERATIONS);
  return currentT;
}

function newtonRaphsonIterate (aX, aGuessT, mX1, mX2) {
 for (var i = 0; i < NEWTON_ITERATIONS; ++i) {
   var currentSlope = getSlope(aGuessT, mX1, mX2);
   if (currentSlope === 0.0) {
     return aGuessT;
   }
   var currentX = calcBezier(aGuessT, mX1, mX2) - aX;
   aGuessT -= currentX / currentSlope;
 }
 return aGuessT;
}

function LinearEasing (x) {
  return x;
}

function bezier (mX1, mY1, mX2, mY2) {
  if (!(0 <= mX1 && mX1 <= 1 && 0 <= mX2 && mX2 <= 1)) {
    throw new Error('bezier x values must be in [0, 1] range');
  }

  if (mX1 === mY1 && mX2 === mY2) {
    return LinearEasing;
  }

  // Precompute samples table
  var sampleValues = float32ArraySupported ? new Float32Array(kSplineTableSize) : new Array(kSplineTableSize);
  for (var i = 0; i < kSplineTableSize; ++i) {
    sampleValues[i] = calcBezier(i * kSampleStepSize, mX1, mX2);
  }

  function getTForX (aX) {
    var intervalStart = 0.0;
    var currentSample = 1;
    var lastSample = kSplineTableSize - 1;

    for (; currentSample !== lastSample && sampleValues[currentSample] <= aX; ++currentSample) {
      intervalStart += kSampleStepSize;
    }
    --currentSample;

    // Interpolate to provide an initial guess for t
    var dist = (aX - sampleValues[currentSample]) / (sampleValues[currentSample + 1] - sampleValues[currentSample]);
    var guessForT = intervalStart + dist * kSampleStepSize;

    var initialSlope = getSlope(guessForT, mX1, mX2);
    if (initialSlope >= NEWTON_MIN_SLOPE) {
      return newtonRaphsonIterate(aX, guessForT, mX1, mX2);
    } else if (initialSlope === 0.0) {
      return guessForT;
    } else {
      return binarySubdivide(aX, intervalStart, intervalStart + kSampleStepSize, mX1, mX2);
    }
  }

  return function BezierEasing (x) {
    // Because JavaScript number are imprecise, we should guarantee the extremes are right.
    if (x === 0 || x === 1) {
      return x;
    }
    return calcBezier(getTForX(x), mY1, mY2);
  };
};